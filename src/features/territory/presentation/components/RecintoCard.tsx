import { Recinto } from '@features/territory/domain/entities/Recinto';
import { Colors } from '@shared/ui/theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

interface RecintoCardProps {
  recinto: Recinto;
  index: number;
  isCreatingJrv: boolean;
  onAddMesa: () => void;
  onAssignCoordinator: () => void;
}

export function RecintoCard({
  recinto,
  index,
  isCreatingJrv,
  onAddMesa,
  onAssignCoordinator,
}: RecintoCardProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(index * 45).duration(320)}
      style={styles.recintoCard}
    >
      {/* Fila superior: Pestaña de parroquia unida al borde + Contador de mesas */}
      <View style={styles.cardTopRow}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryMedium]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.parroquiaTab}
        >
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 21s-7-5.686-7-11a7 7 0 1114 0c0 5.314-7 11-7 11z"
              stroke="#FFFFFF"
              strokeWidth={2.2}
            />
            <Circle cx={12} cy={10} r={2.5} fill={Colors.accent} />
          </Svg>
          <Text style={styles.parroquiaText}>{recinto.parroquia.toUpperCase()}</Text>
        </LinearGradient>

        <View style={styles.jrvCountPill}>
          <Text style={styles.jrvCountText}>
            {recinto.totalJrvs ?? 0} {(recinto.totalJrvs ?? 0) === 1 ? 'mesa' : 'mesas'}
          </Text>
        </View>
      </View>

      {/* Nombre y dirección */}
      <Text style={styles.recintoName}>{recinto.nombre}</Text>
      {recinto.direccion ? <Text style={styles.recintoAddress}>{recinto.direccion}</Text> : null}

      {/* Estado del Coordinador */}
      <View style={styles.coordStatusRow}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: recinto.coordinadorId ? Colors.success : Colors.warning },
          ]}
        />
        <Text style={styles.coordInlineText}>
          <Text style={styles.coordLabel}>Coordinador de recinto: </Text>
          <Text
            style={[
              styles.coordValue,
              !recinto.coordinadorId ? styles.coordMissingText : null,
            ]}
          >
            {recinto.coordinadorNombre ?? 'Sin asignar todavía'}
          </Text>
        </Text>
      </View>

      {/* Acciones */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={isCreatingJrv}
          onPress={onAddMesa}
          style={[styles.secondaryActionBtn, isCreatingJrv ? styles.disabledBtn : null]}
        >
          <Text style={styles.secondaryActionText}>+ Mesa Mixta</Text>
        </TouchableOpacity>

        {!recinto.coordinadorId ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onAssignCoordinator}
            style={styles.primaryActionBtn}
          >
            <Text style={styles.primaryActionText}>Asignar Coordinador</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  recintoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    gap: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  parroquiaTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -18,
    marginLeft: -18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderTopLeftRadius: 19,
    borderBottomRightRadius: 16,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    elevation: 4,
  },
  parroquiaText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  jrvCountPill: {
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.primaryMedium,
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  jrvCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  recintoName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  recintoAddress: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: -4,
  },
  coordStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  coordInlineText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  coordLabel: {
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  coordValue: {
    fontWeight: '800',
    color: Colors.success,
  },
  coordMissingText: {
    color: Colors.warning,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  primaryActionBtn: {
    flex: 1.2,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.55,
  },
});
