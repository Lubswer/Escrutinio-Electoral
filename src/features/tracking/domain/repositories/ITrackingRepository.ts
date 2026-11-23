import {
  ActaOrigenEvidencia,
  AvanceRecinto,
  ResultadoCandidato,
  TrackingDignidad,
} from '../entities/TrackingStats';

export interface ITrackingRepository {
  getAvanceRecintos(): Promise<AvanceRecinto[]>;
  getExitPollResultados(
    dignidad: TrackingDignidad,
    recintoId?: string | null,
  ): Promise<ResultadoCandidato[]>;
  getActasOrigen(): Promise<ActaOrigenEvidencia[]>;
  subscribeToEscrutinio(onChange: () => void): () => void;
}
