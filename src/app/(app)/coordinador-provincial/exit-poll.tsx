import { TrackingDignidad } from '@features/tracking/domain/entities/TrackingStats';
import { useTracking } from '@features/tracking/presentation/hooks/useTracking';
import { Colors } from '@shared/ui/theme/colors';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

export default function ExitPollScreen() {
  const router = useRouter();
  const [dignidad, setDignidad] = useState<TrackingDignidad>('alcalde');
  const [selectedRecintoId, setSelectedRecintoId] = useState<string | null>(null);

  const { avanceRecintos, resultados, actasOrigen, isLoading } = useTracking(
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
  const totalVotosValidos = useMemo(
    () => resultados.reduce((acc, c) => acc + c.totalVotos, 0),
    [resultados],
  );

  const chartData = useMemo(
    () =>
      resultados.map((c) => ({
        value: c.totalVotos,
        label: c.siglas,
        frontColor: c.colorHex,
        topLabelComponent: () => <Text style={styles.barTopLabel}>{c.totalVotos}</Text>,
      })),
    [resultados],
  );

  const openInMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Exit Poll en Vivo</Text>
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>● EN VIVO</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Avance General · Rumiñahui</Text>
        <Text style={styles.summaryBig}>
          {jrvsCompletas} / {totalJrvs} mesas completas (2/2 actas)
        </Text>
        <Text style={styles.summarySub}>
          Faltan {Math.max(0, totalJrvs - jrvsCompletas)} mesas por completar · Votos válidos:{' '}
          {totalVotosValidos}
        </Text>
      </View>

      <View style={styles.tabsRow}>
        {(['alcalde', 'prefecto'] as TrackingDignidad[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setDignidad(tab)}
            style={[styles.tabBtn, dignidad === tab ? styles.tabActive : null]}
          >
            <Text style={[styles.tabText, dignidad === tab ? styles.tabTextActive : null]}>
              {tab === 'alcalde' ? 'Alcaldía (Rumiñahui)' : 'Prefectura (Pichincha)'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <TouchableOpacity
          onPress={() => setSelectedRecintoId(null)}
          style={[styles.filterChip, !selectedRecintoId ? styles.filterActive : null]}
        >
          <Text style={[styles.filterText, !selectedRecintoId ? styles.filterTextActive : null]}>
            Todos los recintos
          </Text>
        </TouchableOpacity>
        {avanceRecintos.map((r) => (
          <TouchableOpacity
            key={r.recintoId}
            onPress={() => setSelectedRecintoId(r.recintoId)}
            style={[
              styles.filterChip,
              selectedRecintoId === r.recintoId ? styles.filterActive : null,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedRecintoId === r.recintoId ? styles.filterTextActive : null,
              ]}
            >
              {r.recintoNombre}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Votos por Candidato ({dignidad === 'alcalde' ? 'Alcalde' : 'Prefecto'})
        </Text>
        {isLoading ? (
          <Text style={styles.metaText}>Cargando resultados...</Text>
        ) : chartData.length > 0 ? (
          <View style={styles.chartWrap}>
            <BarChart
              data={chartData}
              barWidth={36}
              spacing={20}
              roundedTop
              hideRules
              noOfSections={4}
              xAxisThickness={1}
              yAxisThickness={1}
              yAxisTextStyle={styles.axisText}
              xAxisLabelTextStyle={styles.axisText}
              isAnimated
            />
          </View>
        ) : (
          <Text style={styles.metaText}>Aún no hay votos registrados.</Text>
        )}

        <View style={styles.legendList}>
          {resultados.map((c) => {
            const pct =
              totalVotosValidos > 0 ? ((c.totalVotos / totalVotosValidos) * 100).toFixed(1) : '0.0';
            return (
              <View key={c.candidatoId} style={styles.legendRow}>
                <View style={[styles.dot, { backgroundColor: c.colorHex }]} />
                <View style={styles.legendInfo}>
                  <Text style={styles.legendName}>{c.candidatoNombre}</Text>
                  <Text style={styles.metaText}>
                    Lista {c.listaNumero} · {c.siglas}
                  </Text>
                </View>
                <Text style={styles.legendVotes}>
                  {c.totalVotos} ({pct}%)
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Avance por Recinto</Text>
        {avanceRecintos.map((r) => (
          <View key={r.recintoId} style={styles.recintoRow}>
            <View style={styles.legendInfo}>
              <Text style={styles.legendName}>{r.recintoNombre}</Text>
              <Text style={styles.metaText}>{r.parroquia}</Text>
            </View>
            <Text style={styles.recintoCount}>
              {r.jrvsCompletas}/{r.totalJrvs} completas
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Origen GPS de Actas Recibidas</Text>
        {actasOrigen.length === 0 ? (
          <Text style={styles.metaText}>Todavía no se han recibido actas.</Text>
        ) : (
          actasOrigen.map((a) => (
            <View key={a.actaId} style={styles.origenRow}>
              <Text style={styles.legendName}>
                {a.recintoNombre} · Mesa #{a.numeroMesa} ({a.dignidad.toUpperCase()})
              </Text>
              <Text style={styles.metaText}>Registrado por: {a.registradoPorNombre}</Text>
              <Text style={styles.metaText}>
                GPS: {a.latitud.toFixed(5)}, {a.longitud.toFixed(5)} ·{' '}
                {a.ubicacionVerificada ? 'Verificada ✅' : 'No verificada ⚠️'}
              </Text>
              <TouchableOpacity onPress={() => openInMaps(a.latitud, a.longitud)}>
                <Text style={styles.mapLink}>Ver ubicación en Google Maps →</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 54,
    paddingBottom: 40,
    backgroundColor: Colors.background,
    gap: 14,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  title: { fontSize: 19, fontWeight: '800', color: Colors.text },
  liveBadge: {
    backgroundColor: Colors.successBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  liveText: { color: Colors.success, fontSize: 11, fontWeight: '800' },
  summaryCard: { backgroundColor: Colors.primary, borderRadius: 16, padding: 18, gap: 4 },
  summaryTitle: { color: Colors.primaryLight, fontSize: 13, fontWeight: '700' },
  summaryBig: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  summarySub: { color: Colors.primaryLight, fontSize: 13 },
  tabsRow: { flexDirection: 'row', gap: 8 },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '700', color: Colors.text },
  tabTextActive: { color: '#FFFFFF' },
  filterRow: { gap: 8, paddingVertical: 2 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterTextActive: { color: Colors.primary, fontWeight: '700' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
  chartWrap: { paddingVertical: 12, alignItems: 'center' },
  barTopLabel: { fontSize: 12, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  axisText: { fontSize: 11, color: Colors.textSecondary },
  legendList: { gap: 8, marginTop: 6 },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendInfo: { flex: 1 },
  legendName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  legendVotes: { fontSize: 14, fontWeight: '800', color: Colors.primary },
  metaText: { fontSize: 13, color: Colors.textSecondary },
  recintoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  recintoCount: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  origenRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
    gap: 2,
  },
  mapLink: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginTop: 4 },
});
