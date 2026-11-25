import {
  ResultadoCandidato,
  ResumenVotos,
  TrackingDignidad,
} from '@features/tracking/domain/entities/TrackingStats';
import { getCandidatePhoto } from '@shared/ui/assets/candidatePhotos';
import { Colors } from '@shared/ui/theme/colors';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

interface ExitPollChartCardProps {
  dignidad: TrackingDignidad;
  resultados: ResultadoCandidato[];
  resumenVotos: ResumenVotos;
  totalVotosValidos: number;
  isLoading: boolean;
}

export function ExitPollChartCard({
  dignidad,
  resultados,
  resumenVotos,
  totalVotosValidos,
  isLoading,
}: ExitPollChartCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const pieData = useMemo(() => {
    if (totalVotosValidos <= 0) return [];
    return resultados
      .filter((c) => c.totalVotos > 0)
      .map((c) => {
        const pct = (c.totalVotos / totalVotosValidos) * 100;
        return {
          value: c.totalVotos,
          color: c.colorHex,
          text: pct >= 7 ? `${Math.round(pct)}%` : '',
        };
      });
  }, [resultados, totalVotosValidos]);

  return (
    <Animated.View entering={FadeInUp.delay(80).duration(340)} style={styles.card}>
      <View style={styles.chartHeader}>
        <View style={styles.titleBlock}>
          <Text style={styles.cardTitle}>
            Votos · {dignidad === 'alcalde' ? 'Alcalde' : 'Prefecto'}
          </Text>
          <Text style={styles.cardSub}>Distribución porcentual de votos válidos</Text>
        </View>
      </View>

      {isLoading ? (
        <Text style={styles.metaText}>Cargando resultados...</Text>
      ) : totalVotosValidos === 0 ? (
        <View style={styles.emptyChartBox}>
          <Text style={styles.emptyChartTitle}>Sin votos registrados todavía</Text>
          <Text style={styles.metaText}>
            Cuando los veedores envíen actas, la gráfica se actualizará en vivo.
          </Text>
        </View>
      ) : (
        <View style={styles.chartWrap}>
          <PieChart
            data={pieData}
            donut
            radius={96}
            innerRadius={56}
            innerCircleColor={Colors.surface}
            showText
            textColor="#FFFFFF"
            textSize={11}
            fontWeight="bold"
            focusOnPress
            isAnimated
            centerLabelComponent={() => (
              <View style={styles.pieCenter}>
                <Text style={styles.pieCenterValue}>{totalVotosValidos}</Text>
                <Text style={styles.pieCenterLabel}>votos</Text>
              </View>
            )}
          />
        </View>
      )}

      {/* Detalle desplegable: candidatos + blancos/nulos */}
      {showDetails ? (
        <Animated.View entering={FadeInDown.duration(220)} style={styles.detailsSection}>
          <View style={styles.legendList}>
            {resultados.map((c) => {
              const pctNum =
                totalVotosValidos > 0 ? (c.totalVotos / totalVotosValidos) * 100 : 0;
              const photo = getCandidatePhoto(dignidad, c.candidatoNombre);
              const initials = c.candidatoNombre
                .split(' ')
                .slice(0, 2)
                .map((part) => part[0] ?? '')
                .join('')
                .toUpperCase();

              return (
                <View key={c.candidatoId} style={styles.legendItem}>
                  <View style={styles.legendRow}>
                    <View style={[styles.avatarRing, { backgroundColor: c.colorHex }]}>
                      {photo ? (
                        <Image source={photo} style={styles.avatarImage} contentFit="cover" />
                      ) : (
                        <View style={[styles.avatarFallback, { backgroundColor: c.colorHex }]}>
                          <Text style={styles.avatarFallbackText}>{initials}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.legendInfo}>
                      <Text style={styles.legendName}>{c.candidatoNombre}</Text>
                      <Text style={styles.metaText}>
                        Lista {c.listaNumero} · {c.siglas}
                      </Text>
                    </View>
                    <View style={styles.legendRight}>
                      <Text style={styles.legendVotes}>{c.totalVotos}</Text>
                      <Text style={styles.legendPct}>{pctNum.toFixed(1)}%</Text>
                    </View>
                  </View>
                  <View style={styles.miniTrack}>
                    <View
                      style={[
                        styles.miniFill,
                        { width: `${Math.min(100, pctNum)}%`, backgroundColor: c.colorHex },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Desglose informativo: Blancos, Nulos y Total Sufragantes */}
          <View style={styles.breakdownBox}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Blancos</Text>
              <Text style={styles.breakdownValue}>{resumenVotos.votosBlancos}</Text>
              <Text style={styles.breakdownPct}>
                {resumenVotos.totalSufragantes > 0
                  ? `${((resumenVotos.votosBlancos / resumenVotos.totalSufragantes) * 100).toFixed(1)}%`
                  : '0.0%'}
              </Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Nulos</Text>
              <Text style={styles.breakdownValue}>{resumenVotos.votosNulos}</Text>
              <Text style={styles.breakdownPct}>
                {resumenVotos.totalSufragantes > 0
                  ? `${((resumenVotos.votosNulos / resumenVotos.totalSufragantes) * 100).toFixed(1)}%`
                  : '0.0%'}
              </Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Sufragantes</Text>
              <Text style={[styles.breakdownValue, { color: Colors.primary }]}>
                {resumenVotos.totalSufragantes}
              </Text>
              <Text style={styles.breakdownPct}>Total acta</Text>
            </View>
          </View>
        </Animated.View>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => setShowDetails((prev) => !prev)}
        style={styles.expandToggleBtn}
      >
        <Text style={styles.expandToggleText}>
          {showDetails ? 'Ocultar detalle' : 'Ver detalle por candidato'}
        </Text>
        <SymbolView
          name={
            showDetails
              ? { ios: 'chevron.up', android: 'keyboard_arrow_up', web: 'keyboard_arrow_up' }
              : { ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }
          }
          size={22}
          tintColor={Colors.primary}
        />
      </TouchableOpacity>
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
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleBlock: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  cardSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  emptyChartBox: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  emptyChartTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
  },
  chartWrap: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  pieCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCenterValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
  },
  pieCenterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  detailsSection: {
    gap: 10,
  },
  legendList: {
    gap: 10,
    marginTop: 4,
  },
  legendItem: {
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  legendInfo: {
    flex: 1,
  },
  legendName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  legendRight: {
    alignItems: 'flex-end',
  },
  legendVotes: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.text,
  },
  legendPct: {
    fontSize: 12,
    fontWeight: '700',
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
  breakdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  breakdownLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.text,
  },
  breakdownPct: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  kpiDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
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
