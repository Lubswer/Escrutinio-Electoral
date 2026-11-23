import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { captureAppError, triggerControlledCrash } from '@shared/infrastructure/monitoring/sentry';
import { useNetworkStatus } from '@shared/infrastructure/network/networkMonitor';
import { AppButton } from '@shared/ui/components/AppButton';
import { Colors } from '@shared/ui/theme/colors';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MonitorErrorsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleNonFatalError = () => {
    const err = new Error('Prueba de error controlado (ej. fallo de subida de foto)');
    captureAppError(err, {
      screen: 'MonitorErrorsScreen',
      userId: user?.id,
      online: isOnline,
      type: 'non-fatal-test',
    });
    setFeedback(
      isOnline
        ? 'Error no fatal enviado a Sentry. Revisa tu panel de Issues en sentry.io.'
        : 'Sin conexión: el reporte quedó en caché local de Sentry y se enviará al recuperar red.',
    );
  };

  const handleControlledCrash = () => {
    triggerControlledCrash('MonitorErrorsScreen');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Estabilidad y Fallos</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estado del Monitoreo (Sentry · ADR-03)</Text>
        <Text style={styles.desc}>
          Conectividad actual: {isOnline ? 'En línea ✅' : 'Sin señal (Offline - Caché activo) ⚠️'}
        </Text>
        <Text style={styles.desc}>
          Usuario reportado en trazas: {user?.email} ({user?.rol})
        </Text>
      </View>

      {feedback ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{feedback}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Prueba 1: Error No Fatal (RF-17)</Text>
        <Text style={styles.desc}>
          Simula un fallo que no cierra la app (como una subida fallida de imagen) y envía el
          reporte con dispositivo, versión de Android y pantalla a Sentry.
        </Text>
        <AppButton title="Enviar error no fatal a Sentry" onPress={handleNonFatalError} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Prueba 2: Fallo Crítico / Crash (Rúbrica)</Text>
        <Text style={styles.desc}>
          Provoca una excepción no controlada para demostrar en vivo el reporte inmediato en Sentry.
        </Text>
        <AppButton
          title="Provocar fallo controlado"
          variant="danger"
          onPress={handleControlledCrash}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 54,
    backgroundColor: Colors.background,
    gap: 14,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  desc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  successBanner: {
    backgroundColor: Colors.successBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  successText: { color: Colors.success, fontSize: 14, fontWeight: '700' },
});
