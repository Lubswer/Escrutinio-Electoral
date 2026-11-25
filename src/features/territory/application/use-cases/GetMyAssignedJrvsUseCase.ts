import { ValidationError } from '@shared/domain/errors/AppError';
import { Jrv } from '../../domain/entities/Jrv';
import { ITerritoryRepository } from '../../domain/repositories/ITerritoryRepository';

export class GetMyAssignedJrvsUseCase {
  constructor(private readonly territoryRepo: ITerritoryRepository) {}

  async execute(veedorId: string): Promise<Jrv[]> {
    if (!veedorId) {
      throw new ValidationError('Identificador de veedor requerido.');
    }
    return this.territoryRepo.getMyAssignedJrvs(veedorId);
  }
}
