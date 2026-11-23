import { ValidationError } from '@shared/domain/errors/AppError';
import { Acta } from '../../domain/entities/Acta';
import { IActaRepository } from '../../domain/repositories/IActaRepository';

export class GetActasByJrvUseCase {
  constructor(private readonly actaRepo: IActaRepository) {}

  async execute(jrvId: string): Promise<Acta[]> {
    if (!jrvId) {
      throw new ValidationError('La mesa (JRV) es obligatoria.');
    }
    return this.actaRepo.getActasByJrv(jrvId);
  }
}
