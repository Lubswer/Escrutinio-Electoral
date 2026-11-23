import { ValidationError } from '@shared/domain/errors/AppError';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';

/**
 * RF-05 / Supuesto S-08:
 * Recuperación autónoma de contraseña mediante correo verificado.
 */
export class RecoverPasswordUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new ValidationError('Ingresa un correo electrónico válido.');
    }

    await this.authRepo.sendPasswordResetEmail(cleanEmail);
  }
}
