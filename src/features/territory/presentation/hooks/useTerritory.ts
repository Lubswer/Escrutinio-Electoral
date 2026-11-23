import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AssignVeedorToJrvUseCase } from '../../application/use-cases/AssignVeedorToJrvUseCase';
import { CreateJrvUseCase } from '../../application/use-cases/CreateJrvUseCase';
import { CreateRecintoUseCase } from '../../application/use-cases/CreateRecintoUseCase';
import { GetJrvsByRecintoUseCase } from '../../application/use-cases/GetJrvsByRecintoUseCase';
import { GetRecintosUseCase } from '../../application/use-cases/GetRecintosUseCase';
import { GetVeedoresByRecintoUseCase } from '../../application/use-cases/GetVeedoresByRecintoUseCase';
import { CreateJrvInput } from '../../domain/entities/Jrv';
import { CreateRecintoInput } from '../../domain/entities/Recinto';
import { SupabaseTerritoryRepository } from '../../infrastructure/repositories/SupabaseTerritoryRepository';

const territoryRepo = new SupabaseTerritoryRepository();

const getRecintosUseCase = new GetRecintosUseCase(territoryRepo);
const createRecintoUseCase = new CreateRecintoUseCase(territoryRepo);
const getJrvsByRecintoUseCase = new GetJrvsByRecintoUseCase(territoryRepo);
const createJrvUseCase = new CreateJrvUseCase(territoryRepo);
const getVeedoresByRecintoUseCase = new GetVeedoresByRecintoUseCase(territoryRepo);
const assignVeedorToJrvUseCase = new AssignVeedorToJrvUseCase(territoryRepo);

export function useRecintos() {
  const queryClient = useQueryClient();

  const recintosQuery = useQuery({
    queryKey: ['territory', 'recintos'],
    queryFn: () => getRecintosUseCase.execute(),
  });

  const createRecintoMutation = useMutation({
    mutationFn: (input: CreateRecintoInput) => createRecintoUseCase.execute(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territory', 'recintos'] });
    },
  });

  const createJrvMutation = useMutation({
    mutationFn: (input: CreateJrvInput) => createJrvUseCase.execute(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['territory', 'recintos'] });
      queryClient.invalidateQueries({ queryKey: ['territory', 'jrvs', variables.recintoId] });
    },
  });

  return {
    recintos: recintosQuery.data ?? [],
    isLoadingRecintos: recintosQuery.isLoading,
    refetchRecintos: recintosQuery.refetch,
    createRecinto: createRecintoMutation.mutateAsync,
    isCreatingRecinto: createRecintoMutation.isPending,
    createJrv: createJrvMutation.mutateAsync,
    isCreatingJrv: createJrvMutation.isPending,
  };
}

export function useRecintoManagement(recintoId: string | null) {
  const queryClient = useQueryClient();

  const jrvsQuery = useQuery({
    queryKey: ['territory', 'jrvs', recintoId],
    queryFn: () => getJrvsByRecintoUseCase.execute(recintoId ?? ''),
    enabled: Boolean(recintoId),
  });

  const veedoresQuery = useQuery({
    queryKey: ['territory', 'veedores', recintoId],
    queryFn: () => getVeedoresByRecintoUseCase.execute(recintoId ?? ''),
    enabled: Boolean(recintoId),
  });

  const assignVeedorMutation = useMutation({
    mutationFn: ({ jrvId, veedorId }: { jrvId: string; veedorId: string | null }) =>
      assignVeedorToJrvUseCase.execute(jrvId, veedorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territory', 'jrvs', recintoId] });
    },
  });

  return {
    jrvs: jrvsQuery.data ?? [],
    veedores: veedoresQuery.data ?? [],
    isLoading: jrvsQuery.isLoading || veedoresQuery.isLoading,
    refetch: () => {
      jrvsQuery.refetch();
      veedoresQuery.refetch();
    },
    assignVeedor: assignVeedorMutation.mutateAsync,
    isAssigning: assignVeedorMutation.isPending,
  };
}
