import { Recinto } from '../../domain/entities/Recinto';
import { ITerritoryRepository } from '../../domain/repositories/ITerritoryRepository';

export class GetRecintosUseCase {
  constructor(private readonly territoryRepo: ITerritoryRepository) {}

  async execute(): Promise<Recinto[]> {
    return this.territoryRepo.getRecintos();
  }
}
