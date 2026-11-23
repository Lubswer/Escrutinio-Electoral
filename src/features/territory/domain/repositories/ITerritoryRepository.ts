import { CreateJrvInput, Jrv, VeedorSummary } from '../entities/Jrv';
import { CreateRecintoInput, Recinto } from '../entities/Recinto';

export interface ITerritoryRepository {
  getRecintos(): Promise<Recinto[]>;
  createRecinto(input: CreateRecintoInput): Promise<Recinto>;
  getJrvsByRecinto(recintoId: string): Promise<Jrv[]>;
  getMyAssignedJrvs(veedorId: string): Promise<Jrv[]>;
  createJrv(input: CreateJrvInput): Promise<Jrv>;
  getVeedoresByRecinto(recintoId: string): Promise<VeedorSummary[]>;
  assignVeedorToJrv(jrvId: string, veedorId: string | null): Promise<void>;
}
