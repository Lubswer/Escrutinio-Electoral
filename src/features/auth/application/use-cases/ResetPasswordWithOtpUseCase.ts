import { ValidationError } from '@shared/domain/errors/AppError';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';

export class ResetPasswordWithOtpUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(input: {
    email: string;
    token: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    const cleanEmail = input.email.trim().toLowerCase();
    const cleanToken = input.token.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new ValidationError('Ingresa un correo electrónico válido.');
    }
    if (cleanToken.length < 8) {
      throw new ValidationError('Ingresa el código de 8 dígitos enviado a tu correo.');
    }
    if (input.newPassword.length < 8) {
      throw new ValidationError('La nueva contraseña debe tener al menos 8 caracteres.');
    }
    if (input.newPassword !== input.confirmPassword) {
      throw new ValidationError('Las contraseñas no coinciden.');
    }

    await this.authRepo.resetPasswordWithOtp(cleanEmail, cleanToken, input.newPassword);
  }
}
