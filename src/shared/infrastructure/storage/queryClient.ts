import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

const ONE_DAY_MS = 1000 * 60 * 60 * 24;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      gcTime: ONE_DAY_MS,
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
    mutations: {
      networkMode: 'always',
      retry: 0,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'ESCRUTINIO_QUERY_CACHE',
});
