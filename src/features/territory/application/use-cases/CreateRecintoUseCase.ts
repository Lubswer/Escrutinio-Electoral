import { ValidationError } from '@shared/domain/errors/AppError';
import { CreateRecintoInput, Recinto } from '../../domain/entities/Recinto';
import { ITerritoryRepository } from '../../domain/repositories/ITerritoryRepository';

export class CreateRecintoUseCase {
  constructor(private readonly territoryRepo: ITerritoryRepository) {}

  async execute(input: CreateRecintoInput): Promise<Recinto> {
    const parroquia = input.parroquia.trim();
    const nombre = input.nombre.trim();

    if (!parroquia) {
      throw new ValidationError('La parroquia es obligatoria.');
    }

    if (!nombre) {
      throw new ValidationError('El nombre del recinto es obligatorio.');
    }

    return this.territoryRepo.createRecinto({
      parroquia,
      nombre,
      direccion: input.direccion?.trim() || undefined,
    });
  }
}
