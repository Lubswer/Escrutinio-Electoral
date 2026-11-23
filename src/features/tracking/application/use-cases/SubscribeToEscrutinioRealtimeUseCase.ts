import { ITrackingRepository } from '../../domain/repositories/ITrackingRepository';

export class SubscribeToEscrutinioRealtimeUseCase {
  constructor(private readonly trackingRepo: ITrackingRepository) {}

  execute(onChange: () => void): () => void {
    return this.trackingRepo.subscribeToEscrutinio(onChange);
  }
}
