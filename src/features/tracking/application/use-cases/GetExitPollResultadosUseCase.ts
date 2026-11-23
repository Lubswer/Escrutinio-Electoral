import { ResultadoCandidato, TrackingDignidad } from '../../domain/entities/TrackingStats';
import { ITrackingRepository } from '../../domain/repositories/ITrackingRepository';

export class GetExitPollResultadosUseCase {
  constructor(private readonly trackingRepo: ITrackingRepository) {}

  async execute(
    dignidad: TrackingDignidad,
    recintoId?: string | null,
  ): Promise<ResultadoCandidato[]> {
    return this.trackingRepo.getExitPollResultados(dignidad, recintoId);
  }
}
