import { Jrv } from '@features/territory/domain/entities/Jrv';
import { Colors } from '@shared/ui/theme/colors';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface JrvGridCardProps {
  jrv: Jrv;
  index: number;
  onAssignPress: () => void;
  onReviewActas: () => void;
}

export function JrvGridCard({ jrv, index, onAssignPress, onReviewActas }: JrvGridCardProps) {
  const hasVeedor = Boolean(jrv.veedorId);

  return (
    <Animated.View entering={FadeInUp.delay(index * 40).duration(280)} style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.mesaTitle}>Mesa #{jrv.numeroMesa}</Text>
        <View style={styles.genderPill}>
          <Text style={styles.genderText}>{jrv.genero}</Text>
        </View>
      </View>

      <View style={styles.veedorRow}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: hasVeedor ? Colors.success : Colors.warning },
          ]}
        />
        <Text
          style={[styles.veedorName, !hasVeedor ? styles.veedorMissing : null]}
          numberOfLines={2}
        >
          {jrv.veedorNombre ?? 'Sin veedor asignado'}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onAssignPress}
          style={[styles.assignBtn, hasVeedor ? styles.assignBtnOutline : styles.assignBtnSolid]}
        >
          <Text
            style={[
              styles.assignBtnText,
              hasVeedor ? styles.assignBtnTextOutline : styles.assignBtnTextSolid,
            ]}
          >
            {hasVeedor ? 'Reemplazar' : 'Asignar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.75} onPress={onReviewActas} style={styles.actasBtn}>
          <Text style={styles.actasBtnText}>Actas</Text>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={14}
            tintColor={Colors.primary}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48.2%',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    justifyContent: 'space-between',
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  mesaTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.text,
  },
  genderPill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  genderText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
  },
  veedorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    minHeight: 34,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  veedorName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.success,
    lineHeight: 17,
  },
  veedorMissing: {
    color: Colors.warning,
  },
  actions: {
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
  },
  assignBtn: {
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignBtnSolid: {
    backgroundColor: Colors.primary,
  },
  assignBtnOutline: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  assignBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  assignBtnTextSolid: {
    color: '#FFFFFF',
  },
  assignBtnTextOutline: {
    color: Colors.primary,
  },
  actasBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  actasBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});
