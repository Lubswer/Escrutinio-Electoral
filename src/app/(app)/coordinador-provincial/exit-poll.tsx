import { TrackingDignidad } from '@features/tracking/domain/entities/TrackingStats';
import { ActasOrigenCard } from '@features/tracking/presentation/components/ActasOrigenCard';
import { AvanceRecintosCard } from '@features/tracking/presentation/components/AvanceRecintosCard';
import { ExitPollChartCard } from '@features/tracking/presentation/components/ExitPollChartCard';
import { useTracking } from '@features/tracking/presentation/hooks/useTracking';
import { AdnHero } from '@shared/ui/components/AdnHero';
import { Colors } from '@shared/ui/theme/colors';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function ExitPollScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const [dignidad, setDignidad] = useState<TrackingDignidad>('alcalde');
  const [selectedRecintoId, setSelectedRecintoId] = useState<string | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const carouselRef = useRef<ScrollView>(null);

  const { avanceRecintos, resultados, resumenVotos, actasOrigen, isLoading } = useTracking(
    dignidad,
    selectedRecintoId,
  );

  const totalJrvs = useMemo(
    () => avanceRecintos.reduce((acc, r) => acc + r.totalJrvs, 0),
    [avanceRecintos],
  );
  const jrvsCompletas = useMemo(
    () => avanceRecintos.reduce((acc, r) => acc + r.jrvsCompletas, 0),
    [avanceRecintos],
  );
  const jrvsFaltantes = Math.max(0, totalJrvs - jrvsCompletas);
  const pctAvance = totalJrvs > 0 ? Math.round((jrvsCompletas / totalJrvs) * 100) : 0;

  const totalVotosValidos = useMemo(
    () => resultados.reduce((acc, c) => acc + c.totalVotos, 0),
    [resultados],
  );

  const recintoSlides = useMemo(
    () => [
      {
        id: null as string | null,
        nombre: 'Todos los recintos',
        parroquia: 'Consolidado cantonal · Rumiñahui',
        jrvsCompletas,
        totalJrvs,
      },
      ...avanceRecintos.map((r) => ({
        id: r.recintoId as string | null,
        nombre: r.recintoNombre,
        parroquia: r.parroquia,
        jrvsCompletas: r.jrvsCompletas,
        totalJrvs: r.totalJrvs,
      })),
    ],
    [avanceRecintos, jrvsCompletas, totalJrvs],
  );

  const slideWidth = Math.max(260, screenWidth - 40);

  const handleCarouselEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const idx = Math.round(offsetX / slideWidth);
    const clamped = Math.max(0, Math.min(idx, recintoSlides.length - 1));
    setActiveSlideIndex(clamped);
    setSelectedRecintoId(recintoSlides[clamped]?.id ?? null);
  };

  const handleSelectSlide = (idx: number) => {
    setActiveSlideIndex(idx);
    setSelectedRecintoId(recintoSlides[idx]?.id ?? null);
    carouselRef.current?.scrollTo({ x: idx * slideWidth, animated: true });
  };

  return (
    <View style={styles.screen}>
      <AdnHero patternId="adnGridExitPoll" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Título y badge EN VIVO */}
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Exit Poll en Vivo</Text>
            <Text style={styles.subtitle}>Resultados en tiempo real · Elecciones</Text>
          </View>
        </View>

        {/* Card Avance General Rumiñahui */}
        <Animated.View entering={FadeInUp.duration(300)} style={styles.avanceCard}>
          <View style={styles.avanceHeader}>
            <Text style={styles.avanceLabel}>AVANCE GENERAL · RUMIÑAHUI</Text>
            <Text style={styles.avancePercent}>{pctAvance}%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, pctAvance)}%` }]} />
          </View>

          <View style={styles.kpiRow}>
            <View style={styles.kpiStat}>
              <Text style={styles.kpiNumber}>
                {jrvsCompletas}/{totalJrvs}
              </Text>
              <Text style={styles.kpiCaption}>Completas (2/2)</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiStat}>
              <Text style={styles.kpiNumber}>{jrvsFaltantes}</Text>
              <Text style={styles.kpiCaption}>Pendientes</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiStat}>
              <Text style={[styles.kpiNumber, { color: Colors.primary }]}>
                {totalVotosValidos}
              </Text>
              <Text style={styles.kpiCaption}>Votos válidos</Text>
            </View>
          </View>
        </Animated.View>

        {/* Tabs unidos de Dignidad con fondo amarillo accent */}
        <View style={styles.segmentedWrap}>
          {(['alcalde', 'prefecto'] as TrackingDignidad[]).map((tab) => {
            const isActive = dignidad === tab;
            return (
              <TouchableOpacity
                key={tab}
                activeOpacity={0.85}
                onPress={() => setDignidad(tab)}
                style={[
                  styles.segmentedBtn,
                  isActive ? styles.segmentedBtnActive : styles.segmentedBtnInactive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentedText,
                    isActive ? styles.segmentedTextActive : styles.segmentedTextInactive,
                  ]}
                >
                  {tab === 'alcalde' ? 'Alcaldía (Rumiñahui)' : 'Prefectura (Pichincha)'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Carrusel de Recintos con indicadores de puntos */}
        <View style={styles.carouselSection}>
          <ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            onMomentumScrollEnd={handleCarouselEnd}
          >
            {recintoSlides.map((slide, idx) => {
              const slidePct =
                slide.totalJrvs > 0 ? Math.round((slide.jrvsCompletas / slide.totalJrvs) * 100) : 0;
              return (
                <TouchableOpacity
                  key={slide.id ?? 'all'}
                  activeOpacity={0.9}
                  onPress={() => handleSelectSlide(idx)}
                  style={[styles.carouselCard, { width: slideWidth }]}
                >
                  <View style={styles.carouselCardLeft}>
                    <Text style={styles.carouselEyebrow}>
                      {slide.id ? 'RECINTO SELECCIONADO' : 'FILTRO ACTIVO'}
                    </Text>
                    <Text style={styles.carouselTitle} numberOfLines={1}>
                      {slide.nombre}
                    </Text>
                    <Text style={styles.carouselSub} numberOfLines={1}>
                      {slide.parroquia}
                    </Text>
                  </View>
                  <View style={styles.carouselBadge}>
                    <Text style={styles.carouselBadgeValue}>
                      {slide.jrvsCompletas}/{slide.totalJrvs}
                    </Text>
                    <Text style={styles.carouselBadgeLabel}>{slidePct}%</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.dotsRow}>
            {recintoSlides.map((slide, idx) => {
              const isCurrent = idx === activeSlideIndex;
              return (
                <TouchableOpacity
                  key={slide.id ?? 'dot-all'}
                  onPress={() => handleSelectSlide(idx)}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                  style={[styles.dotIndicator, isCurrent ? styles.dotIndicatorActive : null]}
                />
              );
            })}
          </View>
        </View>

        <ExitPollChartCard
          dignidad={dignidad}
          resultados={resultados}
          resumenVotos={resumenVotos}
          totalVotosValidos={totalVotosValidos}
          isLoading={isLoading}
        />

        <AvanceRecintosCard avanceRecintos={avanceRecintos} />

        <ActasOrigenCard actasOrigen={actasOrigen} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.successBg,
    borderWidth: 1,
    borderColor: Colors.success,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  liveText: {
    color: Colors.success,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  avanceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    gap: 12,
  },
  avanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avanceLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
  },
  avancePercent: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primary,
  },
  progressTrack: {
    height: 9,
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
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  segmentedWrap: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segmentedBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedBtnActive: {
    backgroundColor: Colors.accent,
  },
  segmentedBtnInactive: {
    backgroundColor: 'transparent',
    opacity: 0.55,
  },
  segmentedText: {
    fontSize: 13,
  },
  segmentedTextActive: {
    fontWeight: '900',
    color: Colors.primaryDark,
  },
  segmentedTextInactive: {
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  carouselSection: {
    gap: 10,
  },
  carouselCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    gap: 12,
  },
  carouselCardLeft: {
    flex: 1,
    gap: 2,
  },
  carouselEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primaryMedium,
    letterSpacing: 0.6,
  },
  carouselTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  carouselSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  carouselBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    alignItems: 'center',
  },
  carouselBadgeValue: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.primary,
  },
  carouselBadgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryMedium,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dotIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotIndicatorActive: {
    width: 22,
    backgroundColor: Colors.primary,
  },
});
