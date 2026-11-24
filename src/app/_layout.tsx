import { useAuthBootstrap } from '@features/auth/presentation/hooks/useAuth';
import { initSentry, Sentry } from '@shared/infrastructure/monitoring/sentry';
import { setupNetworkMonitoring } from '@shared/infrastructure/network/networkMonitor';
import { asyncStoragePersister, queryClient } from '@shared/infrastructure/storage/queryClient';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';

initSentry();

function RootLayout() {
  useAuthBootstrap();

  useEffect(() => {
    setupNetworkMonitoring();
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Stack screenOptions={{ headerShown: false }} />
    </PersistQueryClientProvider>
  );
}

export default Sentry.wrap(RootLayout);
