import { ActaOrigenEvidencia } from '@features/tracking/domain/entities/TrackingStats';
import { Colors } from '@shared/ui/theme/colors';
import { SymbolView } from 'expo-symbols';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface ActasOrigenCardProps {
  actasOrigen: ActaOrigenEvidencia[];
}

export function ActasOrigenCard({ actasOrigen }: ActasOrigenCardProps) {
  const openInMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url);
  };

  return (
    <Animated.View entering={FadeInUp.delay(200).duration(340)} style={styles.card}>
      <View style={styles.origenHeader}>
        <Text style={styles.cardTitle}>Origen GPS de Actas Recibidas</Text>
        <View style={styles.countChip}>
          <Text style={styles.countChipText}>{actasOrigen.length}</Text>
        </View>
      </View>

      {actasOrigen.length === 0 ? (
        <Text style={styles.metaText}>Todavía no se han recibido actas.</Text>
      ) : (
        <ScrollView
          style={styles.origenScroll}
          contentContainerStyle={styles.origenList}
          nestedScrollEnabled
          showsVerticalScrollIndicator
        >
          {actasOrigen.map((a) => (
            <View key={a.actaId} style={styles.origenItem}>
              <Text style={styles.origenTitle} numberOfLines={1}>
                {a.recintoNombre} · Mesa #{a.numeroMesa}
              </Text>

              <View style={styles.origenMetaRow}>
                <Text style={styles.origenAuthor} numberOfLines={1}>
                  {a.registradoPorNombre}
                </Text>
                <View style={styles.dignidadPill}>
                  <Text style={styles.dignidadPillText}>
                    {a.dignidad === 'alcalde' ? 'Alcalde' : 'Prefecto'}
                  </Text>
                </View>
              </View>

              <View style={styles.origenFooter}>
                <Text style={styles.coordsText}>
                  {a.latitud.toFixed(5)}, {a.longitud.toFixed(5)}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => openInMaps(a.latitud, a.longitud)}
                  style={styles.mapBtn}
                >
                  <SymbolView
                    name={{ ios: 'map', android: 'location_on', web: 'location_on' }}
                    size={14}
                    tintColor={Colors.primary}
                  />
                  <Text style={styles.mapLink}>Ver mapa</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  origenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  countChip: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  countChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  origenScroll: {
    maxHeight: 280,
  },
  origenList: {
    gap: 10,
    paddingRight: 2,
  },
  origenItem: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  origenTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: Colors.text,
  },
  dignidadPill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dignidadPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  origenMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  origenAuthor: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  origenFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  coordsText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  mapLink: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});
