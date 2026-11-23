import { Acta, Dignidad, SaveActaInput } from '../entities/Acta';

export interface PendingActaEntry {
  key: string;
  input: SaveActaInput;
  syncStatus: 'pendiente_envio' | 'fallido';
  syncError?: string;
  savedAt: string;
}

export interface IOfflineActaQueueRepository {
  enqueue(input: SaveActaInput, errorMessage?: string): Promise<Acta>;
  getPendingActas(): Promise<Acta[]>;
  getPendingActasByJrv(jrvId: string): Promise<Acta[]>;
  getAllPendingEntries(): Promise<PendingActaEntry[]>;
  markFailed(key: string, errorMessage: string): Promise<void>;
  remove(jrvId: string, dignidad: Dignidad): Promise<void>;
}
