import {
  CedulaVerificationResult,
  EmailVerificationResult,
  IIdentityVerificationService,
} from '../../domain/services/IIdentityVerificationService';

const cedulaApiUrl = process.env.EXPO_PUBLIC_CEDULA_API_URL ?? '';
const emailApiUrl = process.env.EXPO_PUBLIC_EMAIL_API_URL ?? '';

/**
 * Adaptador para validación externa de cédula y correo electrónico vía APIs (ADR-11).
 */
export class ExternalIdentityService implements IIdentityVerificationService {
  async verifyCedula(cedula: string): Promise<CedulaVerificationResult> {
    if (!cedulaApiUrl) {
      return {
        valid: false,
        message: 'Falta configurar EXPO_PUBLIC_CEDULA_API_URL en el archivo .env.',
      };
    }

    try {
      const response = await fetch(`${cedulaApiUrl}?cedula=${encodeURIComponent(cedula)}`);
      if (!response.ok) {
        return {
          valid: false,
          message: 'No se pudo verificar la cédula en el servicio externo.',
        };
      }

      const data = await response.json();
      const isValid = Boolean(data.valid ?? data.valido ?? data.ok);
      return {
        valid: isValid,
        fullName: data.fullName ?? data.nombres,
        message: isValid ? undefined : (data.message ?? 'Cédula no encontrada o inválida.'),
      };
    } catch {
      return {
        valid: false,
        message: 'Error de conexión al consultar la API de verificación de cédula.',
      };
    }
  }

  async verifyEmail(email: string): Promise<EmailVerificationResult> {
    if (!emailApiUrl) {
      return {
        valid: false,
        message: 'Falta configurar EXPO_PUBLIC_EMAIL_API_URL en el archivo .env.',
      };
    }

    try {
      const response = await fetch(`${emailApiUrl}?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        return {
          valid: false,
          message: 'No se pudo verificar el correo en el servicio externo.',
        };
      }

      const data = await response.json();
      const isValid = Boolean(data.valid ?? data.deliverable ?? data.ok);
      return {
        valid: isValid,
        message: isValid ? undefined : (data.message ?? 'El correo electrónico no es válido o no existe.'),
      };
    } catch {
      return {
        valid: false,
        message: 'Error de conexión al consultar la API de verificación de correo.',
      };
    }
  }
}
