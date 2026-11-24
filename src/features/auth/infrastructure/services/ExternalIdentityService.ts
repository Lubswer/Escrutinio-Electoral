import {
  CedulaVerificationResult,
  EmailVerificationResult,
  IIdentityVerificationService,
} from '../../domain/services/IIdentityVerificationService';

const cedulaApiUrl = (process.env.EXPO_PUBLIC_CEDULA_API_URL ?? '').replace(/\/+$/, '');
const cedulaApiKey = process.env.EXPO_PUBLIC_CEDULA_API_KEY ?? '';
const emailApiUrl = process.env.EXPO_PUBLIC_EMAIL_API_URL ?? '';
const emailApiKey = process.env.EXPO_PUBLIC_EMAIL_API_KEY ?? '';

/**
 * Adaptador para validación externa de cédula (Datacil) y correo electrónico vía APIs (ADR-11).
 */
export class ExternalIdentityService implements IIdentityVerificationService {
  async verifyCedula(cedula: string): Promise<CedulaVerificationResult> {
    if (!cedulaApiUrl || !cedulaApiKey) {
      return {
        valid: false,
        message: 'Falta configurar EXPO_PUBLIC_CEDULA_API_URL o EXPO_PUBLIC_CEDULA_API_KEY en .env.',
      };
    }

    try {
      const response = await fetch(`${cedulaApiUrl}/${encodeURIComponent(cedula)}`, {
        headers: {
          Authorization: `Bearer ${cedulaApiKey}`,
          Accept: 'application/json',
        },
      });

      const json = await response.json().catch(() => null);

      if (!response.ok || !json) {
        return {
          valid: false,
          message: json?.message ?? 'No se pudo verificar la cédula en el servicio externo.',
        };
      }

      const isBooleanValid = json.success === true && json.data === true;
      const isObjectValid =
        json.success === true && json.data !== null && typeof json.data === 'object';

      if (!isBooleanValid && !isObjectValid) {
        return {
          valid: false,
          message: json.message ?? 'La cédula ingresada no es válida.',
        };
      }

      let fullName: string | undefined;
      if (isObjectValid) {
        const parts = [
          json.data.firstname ?? json.data.nombres ?? json.data.firstName,
          json.data.lastname ?? json.data.apellidos ?? json.data.lastName,
        ].filter(Boolean);
        fullName =
          json.data.name ??
          json.data.nombreCompleto ??
          json.data.fullName ??
          (parts.length > 0 ? parts.join(' ') : undefined);
      }

      return {
        valid: true,
        fullName,
      };
    } catch {
      return {
        valid: false,
        message: 'Error de conexión al consultar la API de verificación de cédula.',
      };
    }
  }

  async verifyEmail(email: string): Promise<EmailVerificationResult> {
    if (!emailApiUrl || !emailApiKey) {
      return {
        valid: false,
        message: 'Falta configurar EXPO_PUBLIC_EMAIL_API_URL o EXPO_PUBLIC_EMAIL_API_KEY en .env.',
      };
    }

    try {
      const separator = emailApiUrl.includes('?') ? '&' : '?';
      const url = `${emailApiUrl}${separator}api_key=${encodeURIComponent(emailApiKey)}&email=${encodeURIComponent(email)}`;

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
        return { valid: true };
      }

      const suggestion = data?.suggested_correction
        ? ` ¿Quisiste decir ${data.suggested_correction}?`
        : '';

      return {
        valid: false,
        message: `El correo electrónico no es entregable o no existe.${suggestion}`,
      };
    } catch {
      return {
        valid: false,
        message: 'Error de conexión al consultar la API de verificación de correo.',
      };
    }
  }
}
