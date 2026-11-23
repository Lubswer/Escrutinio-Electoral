import { ValidationError } from '@shared/domain/errors/AppError';
import { Jrv } from '../../domain/entities/Jrv';
import { ITerritoryRepository } from '../../domain/repositories/ITerritoryRepository';

export class GetJrvsByRecintoUseCase {
  constructor(private readonly territoryRepo: ITerritoryRepository) {}

  async execute(recintoId: string): Promise<Jrv[]> {
    if (!recintoId) {
      throw new ValidationError('El recinto es obligatorio.');
    }
    return this.territoryRepo.getJrvsByRecinto(recintoId);
  }
}
