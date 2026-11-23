import { ValidationError } from '@shared/domain/errors/AppError';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';

/**
 * RF-02 / Supuesto S-11:
 * En el primer ingreso, el titular define su clave definitiva para que
 * quien creó la cuenta no pueda conocerla nunca más.
 */
export class ChangeFirstPasswordUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(newPassword: string, confirmPassword: string): Promise<void> {
    if (newPassword.length < 8) {
      throw new ValidationError('La nueva contraseña debe tener al menos 8 caracteres.');
    }

    if (newPassword !== confirmPassword) {
      throw new ValidationError('Las contraseñas ingresadas no coinciden.');
    }

    await this.authRepo.changeFirstLoginPassword(newPassword);
  }
}
