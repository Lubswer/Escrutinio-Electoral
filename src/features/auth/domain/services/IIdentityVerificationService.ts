export interface CedulaVerificationResult {
  valid: boolean;
  fullName?: string;
  message?: string;
}

export interface EmailVerificationResult {
  valid: boolean;
  message?: string;
}

/**
 * Puerto de dominio para validación externa de cédula y correo (RF-03, RF-04, ADR-11).
 */
export interface IIdentityVerificationService {
  verifyCedula(cedula: string): Promise<CedulaVerificationResult>;
  verifyEmail(email: string): Promise<EmailVerificationResult>;
}
