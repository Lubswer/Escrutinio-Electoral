import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { usePendingQueue, useVeedorJrvs } from '@features/scrutiny/presentation/hooks/useScrutiny';
import { AppButton } from '@shared/ui/components/AppButton';
import { Colors } from '@shared/ui/theme/colors';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

const logoAdn = require('@/assets/logoADN.png');

export default function VeedorHomeScreen() {
  const { width: screenWidth } = useWindowDimensions();
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
        {/* Cabecera ADN 7 */}
        <LinearGradient
          colors={[Colors.primaryMedium, Colors.primaryMedium, Colors.primaryMedium]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={[styles.heroGrid, { width: screenWidth }]} pointerEvents="none">
            <Svg width={screenWidth} height="100%">
              <Defs>
                <Pattern id="adnGridVeedor" width="28" height="28" patternUnits="userSpaceOnUse">
                  <Path
                    d="M 28 0 L 0 0 0 28"
                    fill="none"
                    stroke={Colors.primary}
                    strokeWidth="1.2"
                    strokeOpacity="0.45"
                  />
                </Pattern>
              </Defs>
              <Rect width={screenWidth} height="100%" fill="url(#adnGridVeedor)" />
            </Svg>
          </View>

          <View style={styles.topBar}>
            <Image source={logoAdn} style={styles.logo} contentFit="contain" />

            <View style={styles.topActions}>
              <TouchableOpacity
                onPress={logout}
                activeOpacity={0.75}
                style={styles.logoutChip}
                accessibilityLabel="Cerrar sesión"
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                    stroke="#FFFFFF"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.logoutText}>Salir</Text>
              </TouchableOpacity>
            </View>
          </View>

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
        </LinearGradient>

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
                <Text style={styles.jrvHint}>Registra: Alcalde y Prefecto.</Text>
                <AppButton
                  title="Registrar Actas"
                  onPress={() => router.push(`/(app)/veedor/scrutiny/${jrv.id}` as Href)}
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
  hero: {
    paddingTop: 25,
    paddingBottom: 28,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  heroGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: {
    width: 122,
    height: 65,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  netPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  logoutChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
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
