import { ValidationError } from '@shared/domain/errors/AppError';
import { CreateJrvInput, Jrv } from '../../domain/entities/Jrv';
import { ITerritoryRepository } from '../../domain/repositories/ITerritoryRepository';

export class CreateJrvUseCase {
  constructor(private readonly territoryRepo: ITerritoryRepository) {}

  async execute(input: CreateJrvInput): Promise<Jrv> {
    if (!input.recintoId) {
      throw new ValidationError('Selecciona un recinto.');
    }

    if (!Number.isInteger(input.numeroMesa) || input.numeroMesa <= 0) {
      throw new ValidationError('El número de mesa debe ser mayor a 0.');
    }

    return this.territoryRepo.createJrv(input);
  }
}
