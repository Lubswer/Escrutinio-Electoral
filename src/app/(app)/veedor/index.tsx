import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { usePendingQueue, useVeedorJrvs } from '@features/scrutiny/presentation/hooks/useScrutiny';
import { AppButton } from '@shared/ui/components/AppButton';
import { Colors } from '@shared/ui/theme/colors';
import { Href, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function VeedorHomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { data: jrvs = [], isLoading } = useVeedorJrvs(user?.id);
  const { pendingActas, isOnline, syncNow } = usePendingQueue();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <Text style={styles.role}>PANEL DEL VEEDOR</Text>
          <View style={[styles.netBadge, isOnline ? styles.netOnline : styles.netOffline]}>
            <Text style={styles.netText}>{isOnline ? 'En línea' : 'Sin señal (Offline)'}</Text>
          </View>
        </View>
        <Text style={styles.name}>
          {user?.nombres} {user?.apellidos}
        </Text>
        <Text style={styles.subtitle}>Mesas asignadas: {jrvs.length}</Text>
      </View>

      {pendingActas.length > 0 ? (
        <View style={styles.pendingBanner}>
          <Text style={styles.pendingTitle}>
            Actas en cola local: {pendingActas.length}
          </Text>
          <Text style={styles.pendingDesc}>
            {isOnline
              ? 'Conexión detectada. Puedes sincronizar ahora.'
              : 'Se enviarán automáticamente cuando recuperes la señal.'}
          </Text>
          {isOnline ? (
            <AppButton title="Sincronizar ahora" onPress={syncNow} style={styles.syncBtn} />
          ) : null}
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Tus Mesas (JRV)</Text>

      {isLoading ? (
        <Text style={styles.emptyText}>Cargando tus mesas asignadas...</Text>
      ) : jrvs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Aún no tienes mesas asignadas. Solicita a tu coordinador de recinto que te asigne una
            JRV.
          </Text>
        </View>
      ) : (
        jrvs.map((jrv) => (
          <View key={jrv.id} style={styles.jrvCard}>
            <Text style={styles.jrvTitle}>
              Mesa #{jrv.numeroMesa} · {jrv.genero}
            </Text>
            <Text style={styles.jrvHint}>Registra las 2 actas: Alcalde y Prefecto.</Text>
            <AppButton
              title="Registrar / Revisar Actas"
              onPress={() => router.push(`/(app)/veedor/scrutiny/${jrv.id}` as Href)}
              style={styles.openBtn}
            />
          </View>
        ))
      )}

      <AppButton title="Cerrar sesión" variant="danger" onPress={logout} style={styles.logoutBtn} />
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
  headerCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  role: { fontSize: 12, fontWeight: '700', color: Colors.primaryLight },
  netBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  netOnline: { backgroundColor: Colors.success },
  netOffline: { backgroundColor: Colors.warning },
  netText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  name: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: Colors.primaryLight, marginTop: 4 },
  pendingBanner: {
    backgroundColor: Colors.warningBg,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.warning,
    gap: 6,
  },
  pendingTitle: { fontSize: 15, fontWeight: '800', color: Colors.warning },
  pendingDesc: { fontSize: 13, color: Colors.text },
  syncBtn: { marginTop: 4, paddingVertical: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  emptyCard: {
    backgroundColor: Colors.surface,
    padding: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  jrvCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  jrvTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  jrvHint: { fontSize: 13, color: Colors.textSecondary },
  openBtn: { marginTop: 6, paddingVertical: 12 },
  logoutBtn: { marginTop: 8 },
});
