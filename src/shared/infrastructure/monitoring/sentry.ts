import * as Sentry from '@sentry/react-native';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

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
}

export function captureAppError(error: unknown, context?: Record<string, unknown>) {
  if (sentryDsn) {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('[Error capturado]', error, context);
  }
}

/**
 * Helper para la prueba controlada de fallos exigida en la rúbrica (RF-17).
 */
export function triggerControlledCrash(screenName: string) {
  const testError = new Error(`Fallo controlado de prueba desde ${screenName}`);
  captureAppError(testError, { screenName, test: true });
  throw testError;
}

export { Sentry };
