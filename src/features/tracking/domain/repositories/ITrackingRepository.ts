import {
  ActaOrigenEvidencia,
  AvanceRecinto,
  ResultadoCandidato,
  ResumenVotos,
  TrackingDignidad,
} from '../entities/TrackingStats';

export interface ITrackingRepository {
  getAvanceRecintos(): Promise<AvanceRecinto[]>;
  getExitPollResultados(
    dignidad: TrackingDignidad,
    recintoId?: string | null,
  ): Promise<ResultadoCandidato[]>;
  getResumenVotos(
    dignidad: TrackingDignidad,
    recintoId?: string | null,
  ): Promise<ResumenVotos>;
  getActasOrigen(): Promise<ActaOrigenEvidencia[]>;
  subscribeToEscrutinio(onChange: () => void): () => void;
}
