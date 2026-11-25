import { useAuthBootstrap } from '@features/auth/presentation/hooks/useAuth';
import { initSentry, Sentry } from '@shared/infrastructure/monitoring/sentry';
import { setupNetworkMonitoring } from '@shared/infrastructure/network/networkMonitor';
import { asyncStoragePersister, queryClient } from '@shared/infrastructure/storage/queryClient';
import { ErrorFallbackScreen } from '@shared/ui/components/ErrorFallbackScreen';
import { FeedbackModal } from '@shared/ui/components/FeedbackModal';
import { useEnsureLocationAccess } from '@shared/ui/hooks/useEnsureLocationAccess';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';

initSentry();

function RootLayout() {
  useAuthBootstrap();
  const { locationIssue, retryLocationCheck, openLocationSettings, dismissLocationIssue } =
    useEnsureLocationAccess();

  useEffect(() => {
    setupNetworkMonitoring();
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Sentry.ErrorBoundary
        fallback={({ resetError }) => <ErrorFallbackScreen onRetry={resetError} />}
      >
        <Stack screenOptions={{ headerShown: false }} />
      </Sentry.ErrorBoundary>

      <FeedbackModal
        visible={Boolean(locationIssue)}
        type="info"
        title={
          locationIssue === 'permission_denied' ? 'Permiso de ubicación requerido' : 'Activa el GPS'
        }
        message={
          locationIssue === 'permission_denied'
            ? 'La aplicación necesita acceso a tu ubicación para respaldar el escrutinio y los reportes de fallos.'
            : 'Tu GPS está desactivado. Activa la ubicación del teléfono para continuar con normalidad.'
        }
        actionLabel={locationIssue === 'permission_denied' ? 'Abrir ajustes' : 'Activar ubicación'}
        onAction={
          locationIssue === 'permission_denied'
            ? openLocationSettings
            : () => void retryLocationCheck()
        }
        buttonText="Ahora no"
        onClose={dismissLocationIssue}
      />
    </PersistQueryClientProvider>
  );
}

export default Sentry.wrap(RootLayout);
