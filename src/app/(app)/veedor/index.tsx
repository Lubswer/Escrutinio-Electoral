import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { usePendingQueue } from '@features/scrutiny/presentation/hooks/useScrutiny';
import { useVeedorJrvs } from '@features/territory/presentation/hooks/useTerritory';
import { AdnHero } from '@shared/ui/components/AdnHero';
import { AppButton } from '@shared/ui/components/AppButton';
import { Colors } from '@shared/ui/theme/colors';
import { Href, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function VeedorHomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { data: jrvs = [], isLoading } = useVeedorJrvs(user?.id);
  const { pendingActas, isOnline, syncNow } = usePendingQueue();

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AdnHero
          patternId="adnGridVeedor"
          variant="home"
          onLogout={logout}
        >
          <Animated.View entering={FadeInDown.duration(350)} style={styles.greetingBlock}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>VEEDOR DE MESA</Text>
            </View>
            <Text style={styles.userName}>
              {user?.nombres} {user?.apellidos}
            </Text>
            <Text style={styles.jurisdiction}>
              {jrvs.length} {jrvs.length === 1 ? 'mesa asignada' : 'mesas asignadas'} · Cantón
              Rumiñahui
            </Text>
          </Animated.View>
        </AdnHero>

        <View style={styles.body}>
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
                Aún no tienes mesas asignadas. Solicita a tu coordinador de recinto que te asigne
                una JRV.
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
                  onPress={() =>
                    router.push(
                      `/(app)/veedor/scrutiny/${jrv.id}?numero=${jrv.numeroMesa}&genero=${encodeURIComponent(jrv.genero)}&recinto=${encodeURIComponent(jrv.recintoNombre ?? '')}` as Href,
                    )
                  }
                  style={styles.openBtn}
                />
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 36,
  },
  netPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    top: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  netOnline: { backgroundColor: 'rgba(21, 128, 61, 0.85)' },
  netOffline: { backgroundColor: 'rgba(180, 83, 9, 0.9)' },
  netDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  netText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  greetingBlock: {
    gap: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 4,
  },
  roleBadgeText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  userName: {
    fontSize: 25,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  jurisdiction: {
    fontSize: 14,
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  body: {
    padding: 20,
    gap: 14,
  },
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
});
