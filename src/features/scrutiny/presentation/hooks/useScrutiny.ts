import { NetInfoNetworkStatusService } from '@shared/infrastructure/network/networkMonitor';
import { useNetworkStatus } from '@shared/ui/hooks/useNetworkStatus';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { GetActasByJrvUseCase } from '../../application/use-cases/GetActasByJrvUseCase';
import { GetCandidatosUseCase } from '../../application/use-cases/GetCandidatosUseCase';
import { SaveActaUseCase } from '../../application/use-cases/SaveActaUseCase';
import { SyncPendingActasUseCase } from '../../application/use-cases/SyncPendingActasUseCase';
import { Dignidad, SaveActaInput } from '../../domain/entities/Acta';
import { AsyncStorageOfflineActaRepository } from '../../infrastructure/repositories/AsyncStorageOfflineActaRepository';
import { SupabaseActaRepository } from '../../infrastructure/repositories/SupabaseActaRepository';
import { ExpoMediaEvidenceService } from '../../infrastructure/services/ExpoMediaEvidenceService';

const actaRepo = new SupabaseActaRepository();
const offlineQueueRepo = new AsyncStorageOfflineActaRepository();
const mediaService = new ExpoMediaEvidenceService();
const networkStatusService = new NetInfoNetworkStatusService();

const getCandidatosUseCase = new GetCandidatosUseCase(actaRepo);
const getActasByJrvUseCase = new GetActasByJrvUseCase(actaRepo, offlineQueueRepo);
const saveActaUseCase = new SaveActaUseCase(actaRepo, offlineQueueRepo, networkStatusService);
const syncPendingActasUseCase = new SyncPendingActasUseCase(
  actaRepo,
  offlineQueueRepo,
  networkStatusService,
);

export function useCandidatos(dignidad?: Dignidad) {
  return useQuery({
    queryKey: ['scrutiny', 'candidatos', dignidad ?? 'all'],
    queryFn: () => getCandidatosUseCase.execute(dignidad),
    staleTime: 1000 * 60 * 60,
  });
}

export function useJrvActas(jrvId: string) {
  return useQuery({
    queryKey: ['scrutiny', 'actas', jrvId],
    queryFn: () => getActasByJrvUseCase.execute(jrvId),
    enabled: Boolean(jrvId),
  });
}

export function usePendingQueue() {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  const pendingQuery = useQuery({
    queryKey: ['scrutiny', 'pending-queue'],
    queryFn: () => offlineQueueRepo.getPendingActas(),
  });

  const syncNow = useCallback(async () => {
    const result = await syncPendingActasUseCase.execute();
    if (result.synced > 0) {
      queryClient.invalidateQueries({ queryKey: ['scrutiny'] });
    }
    return result;
  }, [queryClient]);

  useEffect(() => {
    if (isOnline && (pendingQuery.data?.length ?? 0) > 0) {
      syncNow();
    }
  }, [isOnline, pendingQuery.data?.length, syncNow]);

  return {
    pendingActas: pendingQuery.data ?? [],
    isOnline,
    syncNow,
  };
}

export function useSaveActa(jrvId: string) {
  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: (input: SaveActaInput) => saveActaUseCase.execute(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scrutiny', 'actas', jrvId] });
      queryClient.invalidateQueries({ queryKey: ['scrutiny', 'pending-queue'] });
    },
  });

  return {
    saveActa: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
    capturePhotoAndCheckBlur: () => mediaService.captureAndValidatePhoto(),
    captureGps: () => mediaService.captureGpsLocation(),
  };
}
