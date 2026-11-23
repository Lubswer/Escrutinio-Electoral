import { PermissionError, ValidationError } from '@shared/domain/errors/AppError';
import { ProvisionUserInput, UserProfile } from '../../domain/entities/User';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { IIdentityVerificationService } from '../../domain/services/IIdentityVerificationService';

/**
 * RF-01, RF-03, RF-04, ADR-11:
 * Creación jerárquica de cuentas validando cédula y correo con APIs externas.
 */
export class ProvisionUserUseCase {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly identityService: IIdentityVerificationService,
  ) {}

  async execute(input: ProvisionUserInput, creator: UserProfile): Promise<UserProfile> {
    if (creator.rol === 'veedor') {
      throw new PermissionError('Un veedor no puede crear cuentas.');
    }

    if (creator.rol === 'coordinador_provincial' && input.rol !== 'coordinador_recinto') {
      throw new PermissionError('El coordinador provincial solo puede crear coordinadores de recinto.');
    }

    if (creator.rol === 'coordinador_recinto' && input.rol !== 'veedor') {
      throw new PermissionError('El coordinador de recinto solo puede crear veedores.');
    }

    if (input.claveTemporal.length < 8) {
      throw new ValidationError('La clave temporal debe tener al menos 8 caracteres.');
    }

    const [cedulaCheck, emailCheck] = await Promise.all([
      this.identityService.verifyCedula(input.cedula.trim()),
      this.identityService.verifyEmail(input.email.trim().toLowerCase()),
    ]);

    if (!cedulaCheck.valid) {
      throw new ValidationError(cedulaCheck.message ?? 'La cédula ingresada no es válida.');
    }

    if (!emailCheck.valid) {
      throw new ValidationError(emailCheck.message ?? 'El correo electrónico no pudo verificarse.');
    }

    return this.authRepo.provisionSubordinate(
      {
        ...input,
        cedula: input.cedula.trim(),
        email: input.email.trim().toLowerCase(),
        nombres: input.nombres.trim(),
        apellidos: input.apellidos.trim(),
        telefono: input.telefono.trim(),
      },
      creator.id,
    );
  }
}
