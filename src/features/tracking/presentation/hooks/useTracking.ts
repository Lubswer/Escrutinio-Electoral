import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { GetActasOrigenUseCase } from '../../application/use-cases/GetActasOrigenUseCase';
import { GetAvanceRecintosUseCase } from '../../application/use-cases/GetAvanceRecintosUseCase';
import { GetExitPollResultadosUseCase } from '../../application/use-cases/GetExitPollResultadosUseCase';
import { SubscribeToEscrutinioRealtimeUseCase } from '../../application/use-cases/SubscribeToEscrutinioRealtimeUseCase';
import { TrackingDignidad } from '../../domain/entities/TrackingStats';
import { SupabaseTrackingRepository } from '../../infrastructure/repositories/SupabaseTrackingRepository';

const trackingRepo = new SupabaseTrackingRepository();

const getAvanceRecintosUseCase = new GetAvanceRecintosUseCase(trackingRepo);
const getExitPollResultadosUseCase = new GetExitPollResultadosUseCase(trackingRepo);
const getActasOrigenUseCase = new GetActasOrigenUseCase(trackingRepo);
const subscribeUseCase = new SubscribeToEscrutinioRealtimeUseCase(trackingRepo);

export function useTracking(dignidad: TrackingDignidad, recintoId: string | null) {
  const queryClient = useQueryClient();

  const avanceQuery = useQuery({
    queryKey: ['tracking', 'avance'],
    queryFn: () => getAvanceRecintosUseCase.execute(),
  });

  const resultadosQuery = useQuery({
    queryKey: ['tracking', 'exit-poll', dignidad, recintoId ?? 'all'],
    queryFn: () => getExitPollResultadosUseCase.execute(dignidad, recintoId),
  });

  const actasOrigenQuery = useQuery({
    queryKey: ['tracking', 'actas-origen'],
    queryFn: () => getActasOrigenUseCase.execute(),
  });

  // RNF-07 / ADR-10: Actualización automática en tiempo real vía Supabase Realtime
  useEffect(() => {
    const unsubscribe = subscribeUseCase.execute(() => {
      queryClient.invalidateQueries({ queryKey: ['tracking'] });
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient]);

  return {
    avanceRecintos: avanceQuery.data ?? [],
    resultados: resultadosQuery.data ?? [],
    actasOrigen: actasOrigenQuery.data ?? [],
    isLoading: avanceQuery.isLoading || resultadosQuery.isLoading,
    refetchAll: () => {
      avanceQuery.refetch();
      resultadosQuery.refetch();
      actasOrigenQuery.refetch();
    },
  };
}
