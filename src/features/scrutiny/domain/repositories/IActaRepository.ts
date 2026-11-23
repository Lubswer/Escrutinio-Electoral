import { Acta, Candidato, Dignidad, SaveActaInput } from '../entities/Acta';

export interface IActaRepository {
  getCandidatos(dignidad?: Dignidad): Promise<Candidato[]>;
  getActasByJrv(jrvId: string): Promise<Acta[]>;
  saveActaRemote(input: SaveActaInput): Promise<Acta>;
  enqueuePendingActa(input: SaveActaInput, errorMessage?: string): Promise<Acta>;
  getPendingActas(): Promise<Acta[]>;
  syncPendingActas(): Promise<{ synced: number; failed: number }>;
}
