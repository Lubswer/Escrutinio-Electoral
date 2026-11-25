import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { SentryIssueSummary } from '@features/tracking/domain/entities/TrackingStats';
import { ErrorDetailModal } from '@features/tracking/presentation/components/ErrorDetailModal';
import {
  DayOption,
  ErrorTimeFilterCarousel,
} from '@features/tracking/presentation/components/ErrorTimeFilterCarousel';
import { ErrorTimelineList } from '@features/tracking/presentation/components/ErrorTimelineList';
import { useReportedErrors } from '@features/tracking/presentation/hooks/useTracking';
import { AdnHero } from '@shared/ui/components/AdnHero';
import { useNetworkStatus } from '@shared/ui/hooks/useNetworkStatus';
import { Colors } from '@shared/ui/theme/colors';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

function toLocalDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDayLabel(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const todayKey = toLocalDayKey(new Date());
  const formatted = date.toLocaleDateString('es-EC', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return dayKey === todayKey ? `Hoy · ${formatted}` : formatted;
}

export default function MonitorErrorsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const {
    data: issues = [],
    isLoading,
    error,
    refetch,
    isFetching,
    sendTestNonFatalError,
    triggerTestCrash,
  } = useReportedErrors();
  const [selectedIssue, setSelectedIssue] = useState<SentryIssueSummary | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string>('all');
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [showSimular, setShowSimular] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const dayOptions = useMemo<DayOption[]>(() => {
    const uniqueDays = new Set<string>([toLocalDayKey(new Date())]);
    for (const issue of issues) {
      if (issue.lastSeen) {
        const dt = new Date(issue.lastSeen);
        if (!Number.isNaN(dt.getTime())) {
          uniqueDays.add(toLocalDayKey(dt));
        }
      }
    }
    const sorted = Array.from(uniqueDays).sort((a, b) => (a < b ? 1 : -1));
    return [
      { key: 'all', label: 'Todos los días' },
      ...sorted.map((key) => ({ key, label: formatDayLabel(key) })),
    ];
  }, [issues]);

  const issuesInDay = useMemo(() => {
    if (selectedDayKey === 'all') return issues;
    return issues.filter((issue) => {
      if (!issue.lastSeen) return false;
      const dt = new Date(issue.lastSeen);
      return !Number.isNaN(dt.getTime()) && toLocalDayKey(dt) === selectedDayKey;
    });
  }, [issues, selectedDayKey]);

  const countsByHour = useMemo(() => {
    const map: Record<number, number> = {};
    for (const issue of issuesInDay) {
      if (!issue.lastSeen) continue;
      const dt = new Date(issue.lastSeen);
      if (Number.isNaN(dt.getTime())) continue;
      const h = dt.getHours();
      map[h] = (map[h] ?? 0) + 1;
    }
    return map;
  }, [issuesInDay]);

  const filteredIssues = useMemo(() => {
    if (selectedHour === null) return issuesInDay;
    return issuesInDay.filter((issue) => {
      if (!issue.lastSeen) return false;
      const dt = new Date(issue.lastSeen);
      return !Number.isNaN(dt.getTime()) && dt.getHours() === selectedHour;
    });
  }, [issuesInDay, selectedHour]);

  const handleNonFatalError = () => {
    sendTestNonFatalError({
      screen: 'MonitorErrorsScreen',
      userId: user?.id,
      online: isOnline,
    });
    void refetch();
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = setTimeout(() => {
      void refetch();
    }, 2800);
  };

  const handleControlledCrash = () => {
    triggerTestCrash('MonitorErrorsScreen');
  };

  return (
    <View style={styles.screen}>
      <AdnHero patternId="adnGridMonitor" onBack={() => router.back()} paddingBottom={20}>
        <ErrorTimeFilterCarousel
          dayOptions={dayOptions}
          selectedDayKey={selectedDayKey}
          onSelectDay={setSelectedDayKey}
          selectedHour={selectedHour}
          onSelectHour={setSelectedHour}
          countsByHour={countsByHour}
        />
      </AdnHero>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Título de pantalla */}
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Registro de Fallos</Text>
            <Text style={styles.subtitle}>Reportes de la aplicación</Text>
          </View>
        </View>

        {/* Card de Fallos Reportados en Sentry */}
        <Animated.View entering={FadeInUp.duration(300)} style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleGroup}>
              <Text style={styles.cardTitle}>Total</Text>
              <View style={styles.countChip}>
                <Text style={styles.countChipText}>{filteredIssues.length}</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => refetch()}
              disabled={isFetching}
              activeOpacity={0.75}
              style={styles.refreshBtn}
            >
              <SymbolView
                name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
                size={15}
                tintColor={Colors.primary}
              />
              <Text style={styles.refreshLink}>
                {isFetching ? 'Actualizando...' : 'Actualizar'}
              </Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{(error as Error).message}</Text>
            </View>
          ) : isLoading ? (
            <Text style={styles.desc}>Consultando reportes en Sentry...</Text>
          ) : filteredIssues.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.desc}>
                {issues.length === 0
                  ? 'No hay fallos registrados en el proyecto todavía.'
                  : 'No hay fallos registrados en el horario seleccionado.'}
              </Text>
            </View>
          ) : (
            <ErrorTimelineList issues={filteredIssues} onSelectIssue={setSelectedIssue} />
          )}
        </Animated.View>

        {/* Card desplegable: Simular Errores */}
        <Animated.View entering={FadeInUp.delay(100).duration(340)} style={styles.card}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setShowSimular((prev) => !prev)}
            style={styles.collapseHeader}
          >
            <Text style={styles.cardTitle}>Simular Errores</Text>
            <SymbolView
              name={
                showSimular
                  ? { ios: 'chevron.up', android: 'keyboard_arrow_up', web: 'keyboard_arrow_up' }
                  : {
                      ios: 'chevron.down',
                      android: 'keyboard_arrow_down',
                      web: 'keyboard_arrow_down',
                    }
              }
              size={22}
              tintColor={Colors.primary}
            />
          </TouchableOpacity>

          {showSimular ? (
            <Animated.View entering={FadeInDown.duration(200)} style={styles.simCardsRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleNonFatalError}
                style={styles.simCard}
              >
                <SymbolView
                  name={{ ios: 'exclamationmark.circle', android: 'bug_report', web: 'bug_report' }}
                  size={24}
                  tintColor={Colors.primary}
                />
                <Text style={styles.simCardTitle}>Error no fatal</Text>
                <Text style={styles.simCardSub}>Reporte controlado</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleControlledCrash}
                style={[styles.simCard, styles.simCardDanger]}
              >
                <SymbolView
                  name={{
                    ios: 'exclamationmark.triangle',
                    android: 'report',
                    web: 'report',
                  }}
                  size={24}
                  tintColor={Colors.danger}
                />
                <Text style={[styles.simCardTitle, { color: Colors.danger }]}>Cierre fatal</Text>
                <Text style={styles.simCardSub}>Simular crash</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <ErrorDetailModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusOnline: {
    backgroundColor: Colors.successBg,
    borderColor: Colors.success,
  },
  statusOffline: {
    backgroundColor: Colors.warningBg,
    borderColor: Colors.warning,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  countChip: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 12,
  },
  countChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
  },
  refreshLink: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  desc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  emptyBox: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  collapseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  simCardsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 4,
  },
  simCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 5,
  },
  simCardDanger: {
    borderColor: '#FECACA',
  },
  simCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 2,
  },
  simCardSub: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  errorBanner: {
    backgroundColor: Colors.dangerBg,
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
});
