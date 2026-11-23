import { AuthError, ValidationError } from '@shared/domain/errors/AppError';
import { UserProfile } from '../../domain/entities/User';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';

export class LoginUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(email: string, password: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      throw new ValidationError('Ingresa tu correo electrónico y contraseña.');
    }

    try {
      const user = await this.authRepo.login(cleanEmail, password);
      if (!user.activo) {
        throw new AuthError('Tu cuenta ha sido deshabilitada por un coordinador.');
      }
      return user;
    } catch (error) {
      if (error instanceof AuthError || error instanceof ValidationError) {
        throw error;
      }
      throw new AuthError('Correo o contraseña incorrectos.', error);
    }
  }
}
