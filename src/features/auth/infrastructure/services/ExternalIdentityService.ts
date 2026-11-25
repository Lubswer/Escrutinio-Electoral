import {
  CedulaVerificationResult,
  EmailVerificationResult,
  IIdentityVerificationService,
} from '../../domain/services/IIdentityVerificationService';

const cedulaApiUrl = (process.env.EXPO_PUBLIC_CEDULA_API_URL ?? '').replace(/\/+$/, '');
const cedulaApiKey = process.env.EXPO_PUBLIC_CEDULA_API_KEY ?? '';
const emailApiUrl = process.env.EXPO_PUBLIC_EMAIL_API_URL ?? '';
const emailApiKey = process.env.EXPO_PUBLIC_EMAIL_API_KEY ?? '';

// Caché en memoria por sesión para no consumir créditos repetidos si el usuario corrige otro campo
const cedulaCache = new Map<string, CedulaVerificationResult>();
const emailCache = new Map<string, EmailVerificationResult>();

/**
 * Adaptador para validación externa de cédula (Datacil) y correo electrónico vía APIs (ADR-11).
 */
export class ExternalIdentityService implements IIdentityVerificationService {
  async verifyCedula(cedula: string): Promise<CedulaVerificationResult> {
    const cleanCedula = cedula.trim();
    const cached = cedulaCache.get(cleanCedula);
    if (cached) {
      return cached;
    }

    if (!cedulaApiUrl || !cedulaApiKey) {
      return {
        valid: false,
        message: 'Falta configurar EXPO_PUBLIC_CEDULA_API_URL o EXPO_PUBLIC_CEDULA_API_KEY en .env.',
      };
    }

    try {
      const response = await fetch(`${cedulaApiUrl}/${encodeURIComponent(cleanCedula)}`, {
        headers: {
          Authorization: `Bearer ${cedulaApiKey}`,
          Accept: 'application/json',
        },
      });

      const json = await response.json().catch(() => null);

      if (!response.ok || !json) {
        if (response.status === 401 || response.status === 403) {
          return {
            valid: false,
            message: 'No se pudo autenticar con el servicio de verificación de cédula.',
          };
        }
        const invalidRes: CedulaVerificationResult = {
          valid: false,
          message: 'La cédula ingresada no es válida o no se encontró en el registro civil.',
        };
        if (response.status === 400 || response.status === 404 || response.status === 422) {
          cedulaCache.set(cleanCedula, invalidRes);
        }
        return invalidRes;
      }

      const isBooleanValid = json.success === true && json.data === true;
      const isObjectValid =
        json.success === true && json.data !== null && typeof json.data === 'object';

      if (!isBooleanValid && !isObjectValid) {
        const invalidRes: CedulaVerificationResult = {
          valid: false,
          message: 'La cédula ingresada no es válida. Verifica los 10 dígitos e intenta nuevamente.',
        };
        cedulaCache.set(cleanCedula, invalidRes);
        return invalidRes;
      }

      let fullName: string | undefined;
      let firstName: string | undefined;
      let lastName: string | undefined;
      if (isObjectValid) {
        firstName = json.data.firstname ?? json.data.nombres ?? json.data.firstName ?? undefined;
        lastName = json.data.lastname ?? json.data.apellidos ?? json.data.lastName ?? undefined;
        const parts = [firstName, lastName].filter(Boolean);
        fullName =
          json.data.name ??
          json.data.nombreCompleto ??
          json.data.fullName ??
          (parts.length > 0 ? parts.join(' ') : undefined);
      }

      const validRes: CedulaVerificationResult = {
        valid: true,
        fullName,
        firstName,
        lastName,
      };
      cedulaCache.set(cleanCedula, validRes);
      return validRes;
    } catch {
      return {
        valid: false,
        message: 'Error de conexión al consultar la API de verificación de cédula.',
      };
    }
  }

  async verifyEmail(email: string): Promise<EmailVerificationResult> {
    const cleanEmail = email.trim().toLowerCase();
    const cached = emailCache.get(cleanEmail);
    if (cached) {
      return cached;
    }

    if (!emailApiUrl || !emailApiKey) {
      return {
        valid: false,
        message: 'Falta configurar EXPO_PUBLIC_EMAIL_API_URL o EXPO_PUBLIC_EMAIL_API_KEY en .env.',
      };
    }

    try {
      const separator = emailApiUrl.includes('?') ? '&' : '?';
      const url = `${emailApiUrl}${separator}api_key=${encodeURIComponent(emailApiKey)}&email=${encodeURIComponent(cleanEmail)}`;

      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        return {
          valid: false,
          message: 'No se pudo verificar el correo en el servicio externo.',
        };
      }

      const data = await response.json();
      const status = String(data?.email_deliverability?.status ?? '').toLowerCase();
      const isValid = status === 'deliverable';

      if (isValid) {
        const validRes: EmailVerificationResult = { valid: true };
        emailCache.set(cleanEmail, validRes);
        return validRes;
      }

      const suggestion = data?.suggested_correction
        ? ` ¿Quisiste decir ${data.suggested_correction}?`
        : '';

      const invalidRes: EmailVerificationResult = {
        valid: false,
        message: `El correo electrónico no es entregable o no existe.${suggestion}`,
      };
      emailCache.set(cleanEmail, invalidRes);
      return invalidRes;
    } catch {
      return {
        valid: false,
        message: 'Error de conexión al consultar la API de verificación de correo.',
      };
    }
  }
}
