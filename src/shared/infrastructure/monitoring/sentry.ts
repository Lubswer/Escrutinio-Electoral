import * as Sentry from '@sentry/react-native';
import * as Device from 'expo-device';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

async function refreshMonitoringGpsTag() {
  if (!sentryDsn) return;
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const lastPos = await Location.getLastKnownPositionAsync();
    if (lastPos) {
      const coords = `${lastPos.coords.latitude.toFixed(5)}, ${lastPos.coords.longitude.toFixed(5)}`;
      Sentry.setTag('gps_location', coords);
    }
  } catch {
    // No bloquear la app si falla la lectura pasiva de GPS
  }
}

export function initSentry() {
  if (!sentryDsn) {
    console.warn('[Sentry] EXPO_PUBLIC_SENTRY_DSN no configurado. Monitoreo en espera.');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    enableNative: true,
    tracesSampleRate: 0.2,
    // Sentry en React Native almacena eventos en disco si no hay red y los envía al reconectar (RF-17)
    maxCacheItems: 50,
  });

  const deviceModel = [Device.brand, Device.modelName].filter(Boolean).join(' ') || 'Desconocido';
  const osVersion = `${Device.osName ?? Platform.OS} ${Device.osVersion ?? Platform.Version}`;

  Sentry.setTag('device_model', deviceModel);
  Sentry.setTag('os_version', osVersion);
  void refreshMonitoringGpsTag();
}

export function setMonitoringUser(user: { id: string; email: string; rol: string } | null) {
  if (!sentryDsn) return;
  if (!user) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({
    id: user.id,
    email: user.email,
    segment: user.rol,
  });
  void refreshMonitoringGpsTag();
}

export function captureAppError(error: unknown, context?: Record<string, unknown>) {
  const screen = typeof context?.screen === 'string' ? context.screen : undefined;

  if (sentryDsn) {
    void refreshMonitoringGpsTag();
    Sentry.withScope((scope) => {
      if (screen) {
        scope.setTag('screen', screen);
      }
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureException(error);
    });
  } else {
    console.error('[Error capturado]', error, context);
  }
}

/**
 * Helper para la prueba controlada de fallos exigida en la rúbrica (RF-17).
 */
export function triggerControlledCrash(screenName: string) {
  const testError = new Error(`Fallo controlado de prueba desde ${screenName}`);
  captureAppError(testError, { screen: screenName, test: true });
  throw testError;
}

export { Sentry };
