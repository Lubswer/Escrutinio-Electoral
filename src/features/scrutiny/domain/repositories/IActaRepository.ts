import { Acta, Candidato, Dignidad, SaveActaInput } from '../entities/Acta';

export interface IActaRepository {
  getCandidatos(dignidad?: Dignidad): Promise<Candidato[]>;
  getActasByJrv(jrvId: string): Promise<Acta[]>;
  saveActa(input: SaveActaInput): Promise<Acta>;
}
