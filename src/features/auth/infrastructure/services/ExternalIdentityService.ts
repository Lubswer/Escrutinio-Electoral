import {
  CedulaVerificationResult,
  EmailVerificationResult,
  IIdentityVerificationService,
} from '../../domain/services/IIdentityVerificationService';

const cedulaApiUrl = process.env.EXPO_PUBLIC_CEDULA_API_URL ?? '';
const emailApiUrl = process.env.EXPO_PUBLIC_EMAIL_API_URL ?? '';

/**
 * Algoritmo oficial Módulo 10 para validar estructura de cédula ecuatoriana (10 dígitos).
 */
function isValidEcuadorianCedulaStructure(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false;

  const province = Number(cedula.substring(0, 2));
  const thirdDigit = Number(cedula[2]);
  if (province < 1 || (province > 24 && province !== 30)) return false;
  if (thirdDigit >= 6) return false;

  const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    let value = Number(cedula[i]) * coefficients[i];
    if (value >= 10) value -= 9;
    sum += value;
  }

  const verifier = (10 - (sum % 10)) % 10;
  return verifier === Number(cedula[9]);
}

/**
 * Adaptador para validación externa de cédula y correo electrónico (ADR-11).
 */
export class ExternalIdentityService implements IIdentityVerificationService {
  async verifyCedula(cedula: string): Promise<CedulaVerificationResult> {
    if (!isValidEcuadorianCedulaStructure(cedula)) {
      return {
        valid: false,
        message: 'La cédula no cumple con el formato válido ecuatoriano de 10 dígitos.',
      };
    }

    if (!cedulaApiUrl) {
      return { valid: true };
    }

    try {
      const response = await fetch(`${cedulaApiUrl}?cedula=${encodeURIComponent(cedula)}`);
      if (!response.ok) {
        return { valid: false, message: 'No se pudo verificar la cédula en el servicio externo.' };
      }
      const data = await response.json();
      const isValid = Boolean(data.valid ?? data.valido ?? data.ok ?? true);
      return {
        valid: isValid,
        fullName: data.fullName ?? data.nombres,
        message: isValid ? undefined : (data.message ?? 'Cédula no encontrada.'),
      };
    } catch {
      return {
        valid: false,
        message: 'Error de conexión al consultar la API de verificación de cédula.',
      };
    }
  }

  async verifyEmail(email: string): Promise<EmailVerificationResult> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, message: 'Formato de correo electrónico inválido.' };
    }

    if (!emailApiUrl) {
      return { valid: true };
    }

    try {
      const response = await fetch(`${emailApiUrl}?email=${encodeURIComponent(email)}`);
      if (!response.ok) {
        return { valid: false, message: 'No se pudo verificar el correo en el servicio externo.' };
      }
      const data = await response.json();
      const isValid = Boolean(data.valid ?? data.deliverable ?? data.ok ?? true);
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
