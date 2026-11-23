import { Candidato, Dignidad } from '../../domain/entities/Acta';
import { IActaRepository } from '../../domain/repositories/IActaRepository';

export class GetCandidatosUseCase {
  constructor(private readonly actaRepo: IActaRepository) {}

  async execute(dignidad?: Dignidad): Promise<Candidato[]> {
    return this.actaRepo.getCandidatos(dignidad);
  }
}
