import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { useTracking } from '@features/tracking/presentation/hooks/useTracking';
import { AdnHero } from '@shared/ui/components/AdnHero';
import { Colors } from '@shared/ui/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, useFocusEffect, useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

const ecuadorLottie = require('@/assets/Ecuador.lottie');

export default function CoordinadorProvincialHomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { avanceRecintos, actasOrigen } = useTracking('alcalde', null);
  const ecuadorLottieRef = useRef<LottieView>(null);
  const pendingExitPollNavRef = useRef(false);
  const navFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      ecuadorLottieRef.current?.play(0, 10);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      pendingExitPollNavRef.current = false;
      ecuadorLottieRef.current?.play(0, 10);
    }, []),
  );

  const navigateToExitPoll = () => {
    if (!pendingExitPollNavRef.current) return;
    pendingExitPollNavRef.current = false;
    if (navFallbackTimerRef.current) {
      clearTimeout(navFallbackTimerRef.current);
      navFallbackTimerRef.current = null;
    }
    router.push('/(app)/coordinador-provincial/exit-poll' as Href);
  };

  const handleOpenExitPoll = () => {
    if (pendingExitPollNavRef.current) return;
    pendingExitPollNavRef.current = true;
    ecuadorLottieRef.current?.play(10, 30);
    navFallbackTimerRef.current = setTimeout(navigateToExitPoll, 1500);
  };

  const { totalJrvs, jrvsCompletas, pctAvance } = useMemo(() => {
    const total = avanceRecintos.reduce((acc, r) => acc + r.totalJrvs, 0);
    const completas = avanceRecintos.reduce((acc, r) => acc + r.jrvsCompletas, 0);
    const pct = total > 0 ? Math.round((completas / total) * 100) : 0;
    return { totalJrvs: total, jrvsCompletas: completas, pctAvance: pct };
  }, [avanceRecintos]);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera Ejecutiva ADN 7 */}
        <AdnHero patternId="adnGrid" variant="home" onLogout={logout} paddingBottom={56}>
          <Animated.View entering={FadeInDown.duration(350)} style={styles.greetingBlock}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>COORDINADOR PROVINCIAL</Text>
            </View>
            <Text style={styles.userName}>
              {user?.nombres} {user?.apellidos}
            </Text>
            <Text style={styles.jurisdiction}>Pichincha · Cantón Rumiñahui</Text>
          </Animated.View>
        </AdnHero>

        {/* Tarjeta flotante de KPIs rápidos */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.kpiCard}>
          <View style={styles.kpiHeader}>
            <Text style={styles.kpiLabel}>AVANCE DE ESCRUTINIO</Text>
            <Text style={styles.kpiPercent}>{pctAvance}%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, pctAvance)}%` }]} />
          </View>

          <View style={styles.kpiRow}>
            <View style={styles.kpiStat}>
              <Text style={styles.kpiNumber}>
                {jrvsCompletas}/{totalJrvs}
              </Text>
              <Text style={styles.kpiCaption}>Mesas</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiStat}>
              <Text style={styles.kpiNumber}>{avanceRecintos.length}</Text>
              <Text style={styles.kpiCaption}>Recintos</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiStat}>
              <Text style={styles.kpiNumber}>{actasOrigen.length}</Text>
              <Text style={styles.kpiCaption}>Actas recibidas</Text>
            </View>
          </View>
        </Animated.View>

        {/* Sección de Módulos (Bento Layout) */}
        <View style={styles.body}>
          <Text style={styles.sectionHeading}>Panel de Control</Text>

          {/* Tarjeta Principal Destacada: Exit Poll */}
          <Animated.View entering={FadeInUp.delay(80).duration(400)}>
            <Pressable
              onPress={handleOpenExitPoll}
              style={({ pressed }) => [styles.featuredWrap, pressed ? styles.pressed : null]}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryMedium]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.featuredCard}
              >
                <View style={styles.featuredHeaderFull}>
                  <Text style={styles.featuredTitle}>Exit Poll y Resultados</Text>
                </View>

                <View style={styles.featuredMiddleRow}>
                  <Text style={styles.featuredDesc}>
                    Conoce en tiempo real de Alcaldía y Prefectura
                  </Text>
                  <View style={styles.ecuadorLottieWrap} pointerEvents="none">
                    <LottieView
                      ref={ecuadorLottieRef}
                      source={ecuadorLottie}
                      autoPlay={false}
                      loop={false}
                      speed={4}
                      resizeMode="contain"
                      onAnimationFinish={navigateToExitPoll}
                      style={styles.ecuadorLottie}
                    />
                  </View>
                </View>

                <View style={styles.featuredFooter}>
                  <Text style={styles.featuredCta}>Ver resultados en vivo</Text>
                  <View style={styles.arrowCircle}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M5 12h14M13 6l6 6-6 6"
                        stroke={Colors.primaryDark}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Cards a ancho completo */}
          <Animated.View entering={FadeInUp.delay(160).duration(400)} style={styles.bentoRow}>
            <Pressable
              onPress={() => router.push('/(app)/coordinador-provincial/recintos' as Href)}
              style={({ pressed }) => [styles.bentoTile, pressed ? styles.pressed : null]}
            >
              <View style={styles.tileHeaderRow}>
                <View style={[styles.tileIconBox, { backgroundColor: Colors.primaryLight }]}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 21s-7-5.686-7-11a7 7 0 1114 0c0 5.314-7 11-7 11z"
                      stroke={Colors.primary}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Circle cx={12} cy={10} r={2.5} fill={Colors.primaryMedium} />
                  </Svg>
                </View>
                <Text style={styles.tileTitle}>Recintos y Personal</Text>
              </View>
              <View style={styles.tileFooter}>
                <Text style={styles.tileLink}>Administrar</Text>
                <View style={[styles.tileArrowCircle, { backgroundColor: Colors.primary }]}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M5 12h14M13 6l6 6-6 6"
                      stroke="#FFFFFF"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(app)/coordinador-provincial/monitor-errors' as Href)}
              style={({ pressed }) => [styles.bentoTile, pressed ? styles.pressed : null]}
            >
              <View style={styles.tileHeaderRow}>
                <View style={[styles.tileIconBox, { backgroundColor: '#FCE7F3' }]}>
                  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"
                      stroke={Colors.primaryWarm}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <Path
                      d="M12 8v4M12 16h.01"
                      stroke={Colors.primaryWarm}
                      strokeWidth={2.2}
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>
                <Text style={styles.tileTitle}>Monitor de Fallos</Text>
              </View>
              <View style={styles.tileFooter}>
                <Text style={[styles.tileLink, { color: Colors.primaryWarm }]}>Inspeccionar</Text>
                <View style={[styles.tileArrowCircle, { backgroundColor: Colors.primaryWarm }]}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M5 12h14M13 6l6 6-6 6"
                      stroke="#FFFFFF"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </View>
            </Pressable>
          </Animated.View>
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
    paddingBottom: 56,
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
    top: 5,
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
  kpiCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginTop: -32,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
    gap: 12,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.7,
  },
  kpiPercent: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.primary,
  },
  progressTrack: {
    height: 8,
    borderRadius: 6,
    backgroundColor: Colors.primaryLight,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
    backgroundColor: Colors.primaryMedium,
  },
  kpiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  kpiStat: {
    flex: 1,
    alignItems: 'center',
  },
  kpiNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
  },
  kpiCaption: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  body: {
    paddingHorizontal: 20,
    marginTop: 22,
    gap: 14,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  featuredWrap: {
    borderRadius: 22,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  featuredCard: {
    borderRadius: 22,
    padding: 20,
    gap: 10,
    overflow: 'hidden',
  },
  featuredHeaderFull: {
    width: '100%',
  },
  featuredMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  ecuadorLottieWrap: {
    width: 108,
    height: 108,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ecuadorLottie: {
    width: 220,
    height: 210,
    top:50,
    left:20
  },
  featuredTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(215, 228, 41, 0.2)',
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  liveTagText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  featuredTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },
  featuredDesc: {
    flex: 1,
    fontSize: 14,
    color: Colors.primaryLight,
    lineHeight: 20,
  },
  featuredFooter: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.16)',
  },
  featuredCta: {
    color: Colors.accent,
    fontSize: 15,
    fontWeight: '800',
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: Colors.primaryDark,
    fontSize: 16,
    fontWeight: '900',
  },
  bentoRow: {
    flexDirection: 'column',
    gap: 14,
  },
  bentoTile: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    gap: 10,
  },
  tileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tileIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  tileDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  tileFooter: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tileLink: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  tileArrowCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
