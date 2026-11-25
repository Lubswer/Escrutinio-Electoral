import { INetworkStatusService } from '@shared/domain/services/INetworkStatusService';
import { IActaRepository } from '../../domain/repositories/IActaRepository';
import { IOfflineActaQueueRepository } from '../../domain/repositories/IOfflineActaQueueRepository';

export class SyncPendingActasUseCase {
  constructor(
    private readonly actaRepo: IActaRepository,
    private readonly offlineQueueRepo: IOfflineActaQueueRepository,
    private readonly networkStatus: INetworkStatusService,
  ) {}

  async execute(): Promise<{ synced: number; failed: number }> {
    const online = await this.networkStatus.isOnline();
    if (!online) {
      return { synced: 0, failed: 0 };
    }

    const entries = await this.offlineQueueRepo.getAllPendingEntries();
    if (entries.length === 0) {
      return { synced: 0, failed: 0 };
    }

    let synced = 0;
    let failed = 0;

    for (const entry of entries) {
      try {
        await this.actaRepo.saveActa(entry.input);
        await this.offlineQueueRepo.remove(entry.input.jrvId, entry.input.dignidad);
        synced++;
      } catch (error) {
        failed++;
        await this.offlineQueueRepo.markFailed(
          entry.key,
          (error as Error)?.message ?? 'Error al sincronizar acta.',
        );
      }
    }

    return { synced, failed };
  }
}
