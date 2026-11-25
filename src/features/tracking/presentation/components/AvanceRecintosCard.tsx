import { AvanceRecinto } from '@features/tracking/domain/entities/TrackingStats';
import { Colors } from '@shared/ui/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface AvanceRecintosCardProps {
  avanceRecintos: AvanceRecinto[];
}

export function AvanceRecintosCard({ avanceRecintos }: AvanceRecintosCardProps) {
  const [showAllRecintos, setShowAllRecintos] = useState(false);

  return (
    <Animated.View entering={FadeInUp.delay(140).duration(340)} style={styles.card}>
      <Text style={styles.cardTitle}>Avance por Recinto</Text>
      {(showAllRecintos ? avanceRecintos : avanceRecintos.slice(0, 2)).map((r, idx) => {
        const pct = r.totalJrvs > 0 ? Math.round((r.jrvsCompletas / r.totalJrvs) * 100) : 0;
        const isFadedPreview = !showAllRecintos && idx === 1 && avanceRecintos.length > 2;
        return (
          <View key={r.recintoId} style={styles.recintoItemWrap}>
            <View style={[styles.recintoItem, isFadedPreview ? styles.recintoItemFaded : null]}>
              <View style={styles.recintoRow}>
                <View style={styles.legendInfo}>
                  <Text style={styles.legendName}>{r.recintoNombre}</Text>
                  <Text style={styles.metaText}>{r.parroquia}</Text>
                </View>
                <View style={styles.recintoPill}>
                  <Text style={styles.recintoCount}>
                    {r.jrvsCompletas}/{r.totalJrvs} ({pct}%)
                  </Text>
                </View>
              </View>
              <View style={styles.miniTrack}>
                <View
                  style={[
                    styles.miniFill,
                    { width: `${Math.min(100, pct)}%`, backgroundColor: Colors.primaryMedium },
                  ]}
                />
              </View>
            </View>

            {isFadedPreview ? (
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.85)', Colors.surface]}
                locations={[0, 0.55, 1]}
                style={styles.fadeOverlay}
                pointerEvents="none"
              />
            ) : null}
          </View>
        );
      })}

      {avanceRecintos.length > 2 ? (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setShowAllRecintos((prev) => !prev)}
          style={styles.expandToggleBtn}
        >
          <Text style={styles.expandToggleText}>
            {showAllRecintos
              ? 'Mostrar menos'
              : `Ver todos los recintos (${avanceRecintos.length})`}
          </Text>
          <SymbolView
            name={
              showAllRecintos
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
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  recintoItemWrap: {
    position: 'relative',
  },
  recintoItem: {
    gap: 6,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  recintoItemFaded: {
    borderBottomWidth: 0,
    opacity: 0.65,
  },
  fadeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  recintoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  legendInfo: {
    flex: 1,
  },
  legendName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  recintoPill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recintoCount: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  miniTrack: {
    height: 6,
    borderRadius: 4,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  miniFill: {
    height: '100%',
    borderRadius: 4,
  },
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 10,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
  },
  expandToggleText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
});
