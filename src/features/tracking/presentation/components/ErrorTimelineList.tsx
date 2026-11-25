import { SentryIssueSummary } from '@features/tracking/domain/entities/TrackingStats';
import { Colors } from '@shared/ui/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ErrorTimelineListProps {
  issues: SentryIssueSummary[];
  onSelectIssue: (issue: SentryIssueSummary) => void;
}

function formatTimeHHMM(isoDate: string): string {
  if (!isoDate) return '--:--';
  const dt = new Date(isoDate);
  if (Number.isNaN(dt.getTime())) return '--:--';
  const hh = String(dt.getHours()).padStart(2, '0');
  const mm = String(dt.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatShortDate(isoDate: string): string {
  if (!isoDate) return '';
  const dt = new Date(isoDate);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' });
}

function getLevelMeta(level: string) {
  const normalized = level.toLowerCase();
  if (normalized === 'warning') {
    return {
      color: Colors.warning,
      bg: Colors.warningBg,
      icon: { ios: 'exclamationmark.circle.fill', android: 'warning', web: 'warning' } as const,
    };
  }
  if (normalized === 'info') {
    return {
      color: Colors.primaryMedium,
      bg: Colors.primaryLight,
      icon: { ios: 'info.circle.fill', android: 'info', web: 'info' } as const,
    };
  }
  return {
    color: Colors.danger,
    bg: Colors.dangerBg,
    icon: { ios: 'exclamationmark.triangle.fill', android: 'error', web: 'error' } as const,
  };
}

export function ErrorTimelineList({ issues, onSelectIssue }: ErrorTimelineListProps) {
  const [contentHeight, setContentHeight] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const showBottomFade =
    contentHeight > containerHeight + 8 && scrollY + containerHeight < contentHeight - 8;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollY(e.nativeEvent.contentOffset.y);
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.listContent}
        nestedScrollEnabled
        showsVerticalScrollIndicator
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onContentSizeChange={(_, h) => setContentHeight(h)}
        onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
      >
        {issues.map((issue, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === issues.length - 1;
          const levelMeta = getLevelMeta(issue.level);
          const exactTime = formatTimeHHMM(issue.lastSeen);
          const shortDate = formatShortDate(issue.lastSeen);

          return (
            <View key={issue.id} style={styles.timelineRow}>
              {/* Columna izquierda: Hora exacta */}
              <View style={styles.timeCol}>
                <Text style={styles.timeText}>{exactTime}</Text>
                {shortDate ? <Text style={styles.dateText}>{shortDate}</Text> : null}
              </View>

              {/* Carril vertical con línea continua y nodo circular */}
              <View style={styles.railCol}>
                <View style={[styles.railSegment, isFirst ? styles.railHidden : null]} />
                <View style={[styles.nodeCircle, { backgroundColor: levelMeta.color }]}>
                  <SymbolView name={levelMeta.icon} size={14} tintColor="#FFFFFF" />
                </View>
                <View
                  style={[styles.railSegment, styles.railBottom, isLast ? styles.railHidden : null]}
                />
              </View>

              {/* Card derecha minimalista con franja accent */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onSelectIssue(issue)}
                style={styles.card}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.userText} numberOfLines={1}>
                    {issue.affectedUser}
                  </Text>
                  <Text style={styles.deviceText} numberOfLines={1}>
                    {issue.deviceModel}
                  </Text>
                </View>
                <View style={styles.cardArrowStrip}>
                  <SymbolView
                    name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                    size={18}
                    tintColor={Colors.primaryDark}
                  />
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {showBottomFade ? (
        <LinearGradient
          colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.82)', Colors.surface]}
          locations={[0, 0.6, 1]}
          style={styles.bottomFade}
          pointerEvents="none"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  scroll: {
    maxHeight: 350,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
  },
  listContent: {
    paddingVertical: 4,
    paddingRight: 2,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  timeCol: {
    width: 44,
    alignItems: 'flex-end',
    paddingTop: 14,
    paddingRight: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  dateText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 1,
  },
  railCol: {
    width: 34,
    alignItems: 'center',
  },
  railSegment: {
    width: 2,
    height: 14,
    backgroundColor: Colors.border,
  },
  railBottom: {
    flex: 1,
    minHeight: 16,
  },
  railHidden: {
    backgroundColor: 'transparent',
  },
  nodeCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 3,
    elevation: 2,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    marginLeft: 4,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
    gap: 3,
  },
  cardArrowStrip: {
    width: 30,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  deviceText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
