import { AvanceRecinto } from '../../domain/entities/TrackingStats';
import { ITrackingRepository } from '../../domain/repositories/ITrackingRepository';

export class GetAvanceRecintosUseCase {
  constructor(private readonly trackingRepo: ITrackingRepository) {}

  async execute(): Promise<AvanceRecinto[]> {
    return this.trackingRepo.getAvanceRecintos();
  }
}
