import { ResumenVotos, TrackingDignidad } from '../../domain/entities/TrackingStats';
import { ITrackingRepository } from '../../domain/repositories/ITrackingRepository';

export class GetResumenVotosUseCase {
  constructor(private readonly trackingRepo: ITrackingRepository) {}

  async execute(
    dignidad: TrackingDignidad,
    recintoId?: string | null,
  ): Promise<ResumenVotos> {
    return this.trackingRepo.getResumenVotos(dignidad, recintoId);
  }
}
