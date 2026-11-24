import { initSentry, Sentry, setMonitoringUser } from '@shared/infrastructure/monitoring/sentry';
import { setupNetworkMonitoring } from '@shared/infrastructure/network/networkMonitor';
import { asyncStoragePersister, queryClient } from '@shared/infrastructure/storage/queryClient';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SupabaseAuthRepository } from '../features/auth/infrastructure/repositories/SupabaseAuthRepository';
import { useAuthStore } from '../features/auth/presentation/store/authStore';

initSentry();

const authRepo = new SupabaseAuthRepository();

function RootLayout() {
  const { setUser, setInitialized } = useAuthStore();

  useEffect(() => {
    setupNetworkMonitoring();

    authRepo
      .getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          setMonitoringUser({
            id: currentUser.id,
            email: currentUser.email,
            rol: currentUser.rol,
          });
        }
      })
      .finally(() => {
        setInitialized(true);
      });
  }, [setInitialized, setUser]);

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
