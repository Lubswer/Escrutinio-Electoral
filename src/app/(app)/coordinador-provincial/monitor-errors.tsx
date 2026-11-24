import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { useReportedErrors } from '@features/tracking/presentation/hooks/useTracking';
import { captureAppError, triggerControlledCrash } from '@shared/infrastructure/monitoring/sentry';
import { useNetworkStatus } from '@shared/infrastructure/network/networkMonitor';
import { AppButton } from '@shared/ui/components/AppButton';
import { Colors } from '@shared/ui/theme/colors';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function MonitorErrorsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { data: issues = [], isLoading, error, refetch, isFetching } = useReportedErrors();
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
        ? 'Error no fatal enviado a Sentry. Espera unos segundos y pulsa "Actualizar".'
        : 'Sin conexión: el reporte quedó en caché local de Sentry y se enviará al recuperar red.',
    );
  };

  const handleControlledCrash = () => {
    triggerControlledCrash('MonitorErrorsScreen');
  };

  const openLocationInMaps = (coords: string) => {
    const clean = coords.replace(/\s+/g, '');
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${clean}`);
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
          Conectividad: {isOnline ? 'En línea ✅' : 'Sin señal (Offline - Caché activo) ⚠️'}
        </Text>
        <Text style={styles.desc}>
          Usuario en trazas: {user?.email} ({user?.rol})
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.cardTitle}>Fallos Reportados en Sentry ({issues.length})</Text>
          <TouchableOpacity onPress={() => refetch()} disabled={isFetching}>
            <Text style={styles.refreshLink}>{isFetching ? 'Actualizando...' : 'Actualizar'}</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{(error as Error).message}</Text>
          </View>
        ) : isLoading ? (
          <Text style={styles.desc}>Consultando reportes en Sentry...</Text>
        ) : issues.length === 0 ? (
          <Text style={styles.desc}>No hay fallos registrados en el proyecto todavía.</Text>
        ) : (
          issues.map((issue) => (
            <View key={issue.id} style={styles.issueRow}>
              <Text style={styles.issueTitle}>{issue.title}</Text>
              <Text style={styles.issueDetail}>Pantalla / Origen: {issue.screen}</Text>
              <Text style={styles.issueDetail}>
                Dispositivo: {issue.deviceModel} · {issue.osVersion}
              </Text>
              <Text style={styles.issueDetail}>Usuario afectado: {issue.affectedUser}</Text>
              <Text style={styles.issueMeta}>
                Ocurrencias: {issue.count} · Personas afectadas: {issue.userCount} · Nivel:{' '}
                {issue.level.toUpperCase()}
              </Text>
              {issue.location ? (
                <TouchableOpacity onPress={() => openLocationInMaps(issue.location!)}>
                  <Text style={styles.mapLink}>📍 GPS: {issue.location} (Ver en mapa)</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.issueMeta}>📍 GPS: No disponible en este evento</Text>
              )}
              {issue.lastSeen ? (
                <Text style={styles.issueMeta}>
                  Último reporte: {new Date(issue.lastSeen).toLocaleString()}
                </Text>
              ) : null}
              {issue.permalink ? (
                <TouchableOpacity onPress={() => Linking.openURL(issue.permalink)}>
                  <Text style={styles.openLink}>Ver traza completa en Sentry →</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ))
        )}
      </View>

      {feedback ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{feedback}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pruebas de Estabilidad (Rúbrica RF-17)</Text>
        <AppButton title="Enviar error no fatal a Sentry" onPress={handleNonFatalError} />
        <AppButton
          title="Provocar fallo controlado (Crash)"
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
    paddingBottom: 40,
    backgroundColor: Colors.background,
    gap: 14,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  refreshLink: { fontSize: 14, fontWeight: '700', color: Colors.primary },
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
  issueRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
    gap: 3,
  },
  issueTitle: { fontSize: 14, fontWeight: '800', color: Colors.danger },
  issueDetail: { fontSize: 13, fontWeight: '600', color: Colors.text },
  issueMeta: { fontSize: 12, color: Colors.textSecondary },
  mapLink: { fontSize: 13, fontWeight: '700', color: Colors.success, marginTop: 2 },
  openLink: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginTop: 4 },
  errorBanner: {
    backgroundColor: Colors.dangerBg,
    borderRadius: 10,
    padding: 10,
  },
  errorText: { color: Colors.danger, fontSize: 13, fontWeight: '600' },
  successBanner: {
    backgroundColor: Colors.successBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  successText: { color: Colors.success, fontSize: 14, fontWeight: '700' },
});
