import { ValidationError } from '@shared/domain/errors/AppError';
import { Acta } from '../../domain/entities/Acta';
import { IActaRepository } from '../../domain/repositories/IActaRepository';
import { IOfflineActaQueueRepository } from '../../domain/repositories/IOfflineActaQueueRepository';

export class GetActasByJrvUseCase {
  constructor(
    private readonly actaRepo: IActaRepository,
    private readonly offlineQueueRepo: IOfflineActaQueueRepository,
  ) {}

  async execute(jrvId: string): Promise<Acta[]> {
    if (!jrvId) {
      throw new ValidationError('La mesa (JRV) es obligatoria.');
    }

    const [remoteActas, localPending] = await Promise.all([
      this.actaRepo.getActasByJrv(jrvId),
      this.offlineQueueRepo.getPendingActasByJrv(jrvId),
    ]);

    const merged = [...remoteActas];
    for (const pending of localPending) {
      const idx = merged.findIndex((a) => a.dignidad === pending.dignidad);
      if (idx >= 0) {
        merged[idx] = pending;
      } else {
        merged.push(pending);
      }
    }

    return merged;
  }
}
