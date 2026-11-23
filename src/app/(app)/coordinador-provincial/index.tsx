import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { AppButton } from '@shared/ui/components/AppButton';
import { Colors } from '@shared/ui/theme/colors';
import { Href, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function CoordinadorProvincialHomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.role}>COORDINADOR PROVINCIAL · PICHINCHA</Text>
        <Text style={styles.name}>
          {user?.nombres} {user?.apellidos}
        </Text>
        <Text style={styles.subtitle}>Cantón Rumiñahui</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exit Poll y Seguimiento en Vivo</Text>
        <Text style={styles.sectionDesc}>
          Consulta votos por candidato en tiempo real, avance de mesas por recinto y ubicación GPS
          de cada acta.
        </Text>
        <AppButton
          title="Abrir Exit Poll en Tiempo Real"
          onPress={() => router.push('/(app)/coordinador-provincial/exit-poll' as Href)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gestión Territorial y Personal</Text>
        <Text style={styles.sectionDesc}>
          Administra recintos electorales, agrega mesas (JRV) y crea coordinadores de recinto.
        </Text>
        <AppButton
          title="Recintos y Coordinadores"
          variant="secondary"
          onPress={() => router.push('/(app)/coordinador-provincial/recintos' as Href)}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estabilidad y Monitoreo (Sentry)</Text>
        <Text style={styles.sectionDesc}>
          Verifica el reporte automático de errores y ejecuta pruebas controladas de estabilidad.
        </Text>
        <AppButton
          title="Monitor de Estabilidad y Fallos"
          variant="secondary"
          onPress={() => router.push('/(app)/coordinador-provincial/monitor-errors' as Href)}
        />
      </View>

      <AppButton title="Cerrar sesión" variant="danger" onPress={logout} style={styles.logoutBtn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 54,
    paddingBottom: 32,
    backgroundColor: Colors.background,
    gap: 16,
  },
  headerCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
  },
  role: { fontSize: 12, fontWeight: '700', color: Colors.primaryLight, marginBottom: 4 },
  name: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: Colors.primaryLight, marginTop: 2 },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  sectionDesc: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  logoutBtn: { marginTop: 8 },
});
