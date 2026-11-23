import { ValidationError } from '@shared/domain/errors/AppError';
import { VeedorSummary } from '../../domain/entities/Jrv';
import { ITerritoryRepository } from '../../domain/repositories/ITerritoryRepository';

export class GetVeedoresByRecintoUseCase {
  constructor(private readonly territoryRepo: ITerritoryRepository) {}

  async execute(recintoId: string): Promise<VeedorSummary[]> {
    if (!recintoId) {
      throw new ValidationError('El recinto es obligatorio.');
    }
    return this.territoryRepo.getVeedoresByRecinto(recintoId);
  }
}
