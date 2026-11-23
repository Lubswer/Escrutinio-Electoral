import { ValidationError } from '@shared/domain/errors/AppError';
import { ITerritoryRepository } from '../../domain/repositories/ITerritoryRepository';

/**
 * RF-07 / RF-08:
 * Asigna o reemplaza en el acto al veedor de una JRV.
 * Un mismo veedor puede cubrir múltiples mesas sin límite.
 */
export class AssignVeedorToJrvUseCase {
  constructor(private readonly territoryRepo: ITerritoryRepository) {}

  async execute(jrvId: string, veedorId: string | null): Promise<void> {
    if (!jrvId) {
      throw new ValidationError('La mesa (JRV) es obligatoria.');
    }

    await this.territoryRepo.assignVeedorToJrv(jrvId, veedorId);
  }
}
