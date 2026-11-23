import { ActaOrigenEvidencia } from '../../domain/entities/TrackingStats';
import { ITrackingRepository } from '../../domain/repositories/ITrackingRepository';

export class GetActasOrigenUseCase {
  constructor(private readonly trackingRepo: ITrackingRepository) {}

  async execute(): Promise<ActaOrigenEvidencia[]> {
    return this.trackingRepo.getActasOrigen();
  }
}
