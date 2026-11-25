import {
  ensureLocationAccess,
  LocationAccessStatus,
} from '@shared/infrastructure/location/locationPermission';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking } from 'react-native';

export function useEnsureLocationAccess() {
  const [issue, setIssue] = useState<Exclude<LocationAccessStatus, 'ok'> | null>(null);

  const checkAccess = useCallback(async () => {
    try {
      const result = await ensureLocationAccess();
      setIssue(result === 'ok' ? null : result);
    } catch {
      // No bloquear la app si ocurre un fallo inesperado consultando permisos
    }
  }, []);

  useEffect(() => {
    void checkAccess();

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void checkAccess();
      }
    });

    return () => {
      sub.remove();
    };
  }, [checkAccess]);

  const openSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  const dismiss = useCallback(() => {
    setIssue(null);
  }, []);

  return {
    locationIssue: issue,
    retryLocationCheck: checkAccess,
    openLocationSettings: openSettings,
    dismissLocationIssue: dismiss,
  };
}
