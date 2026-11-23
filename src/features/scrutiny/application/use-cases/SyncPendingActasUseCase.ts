import { isDeviceOnline } from '@shared/infrastructure/network/networkMonitor';
import { IActaRepository } from '../../domain/repositories/IActaRepository';

export class SyncPendingActasUseCase {
  constructor(private readonly actaRepo: IActaRepository) {}

  async execute(): Promise<{ synced: number; failed: number }> {
    const online = await isDeviceOnline();
    if (!online) {
      return { synced: 0, failed: 0 };
    }
    return this.actaRepo.syncPendingActas();
  }
}
