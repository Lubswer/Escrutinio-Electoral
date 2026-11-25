import { PermissionError, ValidationError } from '@shared/domain/errors/AppError';
import { CreateSubordinateUserInput, UserProfile } from '../../domain/entities/User';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';
import { IIdentityVerificationService } from '../../domain/services/IIdentityVerificationService';

/**
 * Genera una clave temporal aleatoria fuerte y legible (sin caracteres ambiguos 0/O, 1/l/I)
 * para enviarla automáticamente al correo del nuevo usuario (RF-02, RNF-03).
 */
function generateTemporaryPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const all = upper + lower + digits;
  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)];

  const raw = [
    pick(upper),
    pick(lower),
    pick(digits),
    pick(upper),
    pick(lower),
    pick(digits),
    pick(all),
    pick(all),
  ];

  // Mezcla simple Fisher-Yates
  for (let i = raw.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [raw[i], raw[j]] = [raw[j], raw[i]];
  }

  return `Adn-${raw.join('')}`;
}

/**
 * RF-01, RF-02, RF-03, RF-04, ADR-11:
 * Creación jerárquica de cuentas subordinadas validando cédula y correo con APIs externas,
 * con generación automática de clave temporal enviada por correo.
 */
export class CreateSubordinateUserUseCase {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly identityService: IIdentityVerificationService,
  ) {}

  async execute(input: CreateSubordinateUserInput, creator: UserProfile): Promise<UserProfile> {
    if (creator.rol === 'veedor') {
      throw new PermissionError('Un veedor no puede crear cuentas.');
    }

    if (creator.rol === 'coordinador_provincial' && input.rol !== 'coordinador_recinto') {
      throw new PermissionError('El coordinador provincial solo puede crear coordinadores de recinto.');
    }

    if (creator.rol === 'coordinador_recinto') {
      if (input.rol !== 'veedor') {
        throw new PermissionError('El coordinador de recinto solo puede crear veedores.');
      }
      if (input.recintoId !== creator.recintoId) {
        throw new PermissionError('Solo puedes crear veedores asignados a tu propio recinto.');
      }
    }

    const claveTemporal = input.claveTemporal?.trim() || generateTemporaryPassword();

    if (claveTemporal.length < 8) {
      throw new ValidationError('La clave temporal debe tener al menos 8 caracteres.');
    }

    // 1. Validar primero cédula y coincidencia de nombres/apellidos antes de consumir la API de correo
    const cedulaCheck = await this.identityService.verifyCedula(input.cedula.trim());

    if (!cedulaCheck.valid) {
      throw new ValidationError(cedulaCheck.message ?? 'La cédula ingresada no es válida.');
    }

    if (cedulaCheck.firstName && cedulaCheck.lastName) {
      const normalize = (value: string) =>
        value
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim();

      const apiFirstTokens = normalize(cedulaCheck.firstName).split(/\s+/).filter(Boolean);
      const apiLastTokens = normalize(cedulaCheck.lastName).split(/\s+/).filter(Boolean);
      const enteredFirstTokens = normalize(input.nombres).split(/\s+/).filter(Boolean);
      const enteredLastTokens = normalize(input.apellidos).split(/\s+/).filter(Boolean);

      const firstMatches =
        enteredFirstTokens.length > 0 &&
        enteredFirstTokens.every((token) => apiFirstTokens.includes(token));
      const lastMatches =
        enteredLastTokens.length > 0 &&
        enteredLastTokens.every((token) => apiLastTokens.includes(token));

      if (!firstMatches || !lastMatches) {
        throw new ValidationError(
          `Los nombres y apellidos no coinciden con la cédula registrada (${cedulaCheck.fullName ?? `${cedulaCheck.firstName} ${cedulaCheck.lastName}`}).`,
        );
      }
    } else if (cedulaCheck.fullName) {
      const normalize = (value: string) =>
        value
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim();

      const apiTokens = normalize(cedulaCheck.fullName).split(/\s+/).filter(Boolean);
      const enteredFirstTokens = normalize(input.nombres).split(/\s+/).filter(Boolean);
      const enteredLastTokens = normalize(input.apellidos).split(/\s+/).filter(Boolean);
      const distinctEntered = new Set([...enteredFirstTokens, ...enteredLastTokens]);

      const matches =
        enteredFirstTokens.every((t) => apiTokens.includes(t)) &&
        enteredLastTokens.every((t) => apiTokens.includes(t)) &&
        enteredLastTokens.some((t) => !enteredFirstTokens.includes(t)) &&
        distinctEntered.size >= 2;

      if (!matches) {
        throw new ValidationError(
          `Los nombres y apellidos no coinciden con la cédula registrada (${cedulaCheck.fullName}).`,
        );
      }
    }

    // 2. Solo si cédula y nombres pasaron, validar el correo electrónico en la API externa
    const emailCheck = await this.identityService.verifyEmail(input.email.trim().toLowerCase());

    if (!emailCheck.valid) {
      throw new ValidationError(emailCheck.message ?? 'El correo electrónico no pudo verificarse.');
    }

    return this.authRepo.createSubordinateUser(
      {
        ...input,
        cedula: input.cedula.trim(),
        email: input.email.trim().toLowerCase(),
        nombres: input.nombres.trim(),
        apellidos: input.apellidos.trim(),
        telefono: input.telefono.trim(),
        claveTemporal,
      },
      creator.id,
    );
  }
}
