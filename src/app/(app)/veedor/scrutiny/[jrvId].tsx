import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { Dignidad } from '@features/scrutiny/domain/entities/Acta';
import { evaluateActaCuadratura } from '@features/scrutiny/domain/rules/validateActaCuadratura';
import {
  useCandidatos,
  useJrvActas,
  useSaveActa,
} from '@features/scrutiny/presentation/hooks/useScrutiny';
import { ConflictError } from '@shared/domain/errors/AppError';
import { useNetworkStatus } from '@shared/infrastructure/network/networkMonitor';
import { AppButton } from '@shared/ui/components/AppButton';
import { Colors } from '@shared/ui/theme/colors';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

function toInt(val: string): number {
  const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function ScrutinyActaScreen() {
  const { jrvId } = useLocalSearchParams<{ jrvId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  const [dignidad, setDignidad] = useState<Dignidad>('alcalde');
  const { data: candidatos = [] } = useCandidatos(dignidad);
  const { data: actas = [], refetch: refetchActas } = useJrvActas(jrvId ?? '');
  const { saveActa, isSaving, capturePhotoAndCheckBlur, captureGps } = useSaveActa(jrvId ?? '');

  const currentActa = useMemo(
    () => actas.find((a) => a.dignidad === dignidad),
    [actas, dignidad],
  );

  const [totalSufragantes, setTotalSufragantes] = useState('0');
  const [votosBlancos, setVotosBlancos] = useState('0');
  const [votosNulos, setVotosNulos] = useState('0');
  const [votosMap, setVotosMap] = useState<Record<string, string>>({});

  const [photoUri, setPhotoUri] = useState('');
  const [sharpnessScore, setSharpnessScore] = useState<number | null>(null);
  const [photoBlurry, setPhotoBlurry] = useState(false);

  const [gps, setGps] = useState<{
    latitude: number;
    longitude: number;
    timestamp: string;
    isVerified: boolean;
  } | null>(null);

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);
  const [capturingPhoto, setCapturingPhoto] = useState(false);
  const [capturingGps, setCapturingGps] = useState(false);

  useEffect(() => {
    if (currentActa) {
      setTotalSufragantes(String(currentActa.totalSufragantes));
      setVotosBlancos(String(currentActa.votosBlancos));
      setVotosNulos(String(currentActa.votosNulos));
      const nextMap: Record<string, string> = {};
      for (const v of currentActa.votosPorCandidato) {
        nextMap[v.candidatoId] = String(v.votos);
      }
      setVotosMap(nextMap);
      setPhotoUri(currentActa.fotoPath);
      setSharpnessScore(currentActa.fotoNitidezScore);
      setPhotoBlurry(false);
      setGps({
        latitude: currentActa.latitud,
        longitude: currentActa.longitud,
        timestamp: currentActa.ubicacionTimestamp,
        isVerified: currentActa.ubicacionVerificada,
      });
    } else {
      setTotalSufragantes('0');
      setVotosBlancos('0');
      setVotosNulos('0');
      setVotosMap({});
      setPhotoUri('');
      setSharpnessScore(null);
      setPhotoBlurry(false);
      setGps(null);
    }
    setStatusMessage(null);
  }, [currentActa, dignidad]);

  const cuadratura = useMemo(() => {
    return evaluateActaCuadratura({
      totalSufragantes: toInt(totalSufragantes),
      votosBlancos: toInt(votosBlancos),
      votosNulos: toInt(votosNulos),
      votosPorCandidato: candidatos.map((c) => ({
        candidatoId: c.id,
        votos: toInt(votosMap[c.id] ?? '0'),
      })),
    });
  }, [totalSufragantes, votosBlancos, votosNulos, candidatos, votosMap]);

  const handleTakePhoto = async () => {
    try {
      setCapturingPhoto(true);
      setStatusMessage(null);
      const result = await capturePhotoAndCheckBlur();
      if (!result) return;

      setSharpnessScore(result.sharpnessScore);
      setPhotoBlurry(result.isBlurry);

      if (result.isBlurry) {
        setPhotoUri('');
        setStatusMessage({
          type: 'error',
          text: `Foto borrosa (nitidez: ${result.sharpnessScore}). Toma otra foto enfocando bien el acta.`,
        });
      } else {
        setPhotoUri(result.uri);
        setStatusMessage({
          type: 'success',
          text: `Foto nítida aprobada (puntaje: ${result.sharpnessScore}).`,
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message ?? 'Error al tomar la fotografía.' });
    } finally {
      setCapturingPhoto(false);
    }
  };

  const handleCaptureGps = async () => {
    try {
      setCapturingGps(true);
      setStatusMessage(null);
      const loc = await captureGps();
      setGps(loc);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message ?? 'No se pudo obtener el GPS.' });
    } finally {
      setCapturingGps(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !jrvId) return;

    if (!cuadratura.valid) {
      setStatusMessage({
        type: 'error',
        text: cuadratura.errorMessage ?? 'La suma de votos no cuadra.',
      });
      return;
    }

    if (!photoUri || photoBlurry) {
      setStatusMessage({ type: 'error', text: 'Adjunta una fotografía nítida del acta.' });
      return;
    }

    if (!gps) {
      setStatusMessage({ type: 'error', text: 'Captura la ubicación GPS antes de guardar.' });
      return;
    }

    try {
      setStatusMessage(null);
      const saved = await saveActa({
        actaId: currentActa?.id,
        jrvId,
        dignidad,
        totalSufragantes: toInt(totalSufragantes),
        votosBlancos: toInt(votosBlancos),
        votosNulos: toInt(votosNulos),
        votosPorCandidato: candidatos.map((c) => ({
          candidatoId: c.id,
          votos: toInt(votosMap[c.id] ?? '0'),
        })),
        localPhotoUri: photoUri,
        fotoNitidezScore: sharpnessScore,
        latitud: gps.latitude,
        longitud: gps.longitude,
        ubicacionTimestamp: gps.timestamp,
        ubicacionVerificada: gps.isVerified,
        expectedVersion: currentActa?.version ?? 1,
        userId: user.id,
      });

      if (saved.syncStatus === 'pendiente_envio') {
        setStatusMessage({
          type: 'warning',
          text: 'Sin señal: acta guardada localmente. Se enviará al recuperar conexión.',
        });
      } else if (saved.syncStatus === 'fallido') {
        setStatusMessage({
          type: 'error',
          text: saved.syncError ?? 'Error al enviar el acta.',
        });
      } else {
        setStatusMessage({
          type: 'success',
          text: `Acta de ${dignidad} guardada en el servidor (v${saved.version}).`,
        });
      }
    } catch (err: any) {
      if (err instanceof ConflictError) {
        await refetchActas();
      }
      setStatusMessage({ type: 'error', text: err?.message ?? 'No se pudo guardar el acta.' });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Registro de Acta</Text>
        <Text style={[styles.netChip, isOnline ? styles.netOnline : styles.netOffline]}>
          {isOnline ? 'Online' : 'Offline'}
        </Text>
      </View>

      <View style={styles.tabsRow}>
        {(['alcalde', 'prefecto'] as Dignidad[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setDignidad(tab)}
            style={[styles.tabBtn, dignidad === tab ? styles.tabActive : null]}
          >
            <Text style={[styles.tabText, dignidad === tab ? styles.tabTextActive : null]}>
              {tab === 'alcalde' ? 'Alcalde (Rumiñahui)' : 'Prefecto (Pichincha)'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {currentActa ? (
        <View style={styles.syncBadgeRow}>
          <Text style={styles.syncLabel}>
            Estado actual:{' '}
            {currentActa.syncStatus === 'guardado'
              ? `✅ Guardado en servidor (v${currentActa.version})`
              : currentActa.syncStatus === 'pendiente_envio'
                ? '⏳ Pendiente de envío (local)'
                : '❌ Fallido'}
          </Text>
        </View>
      ) : null}

      {statusMessage ? (
        <View
          style={[
            styles.banner,
            statusMessage.type === 'success'
              ? styles.bannerSuccess
              : statusMessage.type === 'warning'
                ? styles.bannerWarning
                : styles.bannerError,
          ]}
        >
          <Text style={styles.bannerText}>{statusMessage.text}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.label}>Total de sufragantes en la mesa</Text>
        <TextInput
          style={styles.numInput}
          keyboardType="numeric"
          value={totalSufragantes}
          onChangeText={setTotalSufragantes}
        />

        <Text style={styles.sectionSub}>Votos por Organización Política</Text>
        {candidatos.map((c) => (
          <View key={c.id} style={styles.candidateRow}>
            <View style={[styles.colorDot, { backgroundColor: c.colorHex }]} />
            <View style={styles.candidateInfo}>
              <Text style={styles.candidateOrg}>
                Lista {c.listaNumero} · {c.siglas}
              </Text>
              <Text style={styles.candidateName}>{c.nombreCompleto}</Text>
            </View>
            <TextInput
              style={styles.voteInput}
              keyboardType="numeric"
              value={votosMap[c.id] ?? '0'}
              onChangeText={(val) => setVotosMap((prev) => ({ ...prev, [c.id]: val }))}
            />
          </View>
        ))}

        <View style={styles.rowTwo}>
          <View style={styles.half}>
            <Text style={styles.label}>Votos en Blanco</Text>
            <TextInput
              style={styles.numInput}
              keyboardType="numeric"
              value={votosBlancos}
              onChangeText={setVotosBlancos}
            />
          </View>
          <View style={styles.half}>
            <Text style={styles.label}>Votos Nulos</Text>
            <TextInput
              style={styles.numInput}
              keyboardType="numeric"
              value={votosNulos}
              onChangeText={setVotosNulos}
            />
          </View>
        </View>

        <View style={[styles.cuadraturaBox, cuadratura.valid ? styles.cuadraOk : styles.cuadraErr]}>
          <Text style={styles.cuadraText}>
            {cuadratura.valid
              ? `✅ Cuadratura correcta: ${cuadratura.sumaTotal} / ${totalSufragantes}`
              : `⚠️ ${cuadratura.errorMessage}`}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionSub}>Evidencia Obligatoria (Foto y GPS)</Text>

        <AppButton
          title={photoUri ? 'Tomar otra foto del acta' : '📷 Tomar foto del acta'}
          variant="secondary"
          onPress={handleTakePhoto}
          loading={capturingPhoto}
        />

        {photoUri.startsWith('file://') ? (
          <Image source={{ uri: photoUri }} style={styles.preview} />
        ) : photoUri ? (
          <Text style={styles.metaText}>Foto registrada en servidor: {photoUri}</Text>
        ) : null}

        {sharpnessScore !== null ? (
          <Text style={styles.metaText}>
            Nitidez medida: {sharpnessScore} ({photoBlurry ? 'Borrosa' : 'Nítida ✅'})
          </Text>
        ) : null}

        <AppButton
          title={gps ? 'Actualizar GPS' : '📍 Capturar ubicación GPS'}
          variant="secondary"
          onPress={handleCaptureGps}
          loading={capturingGps}
          style={styles.mt10}
        />

        {gps ? (
          <Text style={styles.metaText}>
            GPS: {gps.latitude.toFixed(5)}, {gps.longitude.toFixed(5)} ·{' '}
            {gps.isVerified ? 'Verificada (< 5 min) ✅' : 'No verificada (> 5 min)'}
          </Text>
        ) : null}
      </View>

      <AppButton
        title={currentActa?.id ? 'Guardar corrección del acta' : 'Enviar acta de escrutinio'}
        onPress={handleSubmit}
        loading={isSaving}
        disabled={isSaving}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 54, paddingBottom: 40, backgroundColor: Colors.background, gap: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  title: { fontSize: 19, fontWeight: '800', color: Colors.text },
  netChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14, color: '#FFF', fontSize: 12, fontWeight: '700', overflow: 'hidden' },
  netOnline: { backgroundColor: Colors.success },
  netOffline: { backgroundColor: Colors.warning },
  tabsRow: { flexDirection: 'row', gap: 8 },
  tabBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '700', color: Colors.text },
  tabTextActive: { color: '#FFFFFF' },
  syncBadgeRow: { backgroundColor: Colors.primaryLight, padding: 10, borderRadius: 10 },
  syncLabel: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  banner: { padding: 12, borderRadius: 10, borderWidth: 1 },
  bannerSuccess: { backgroundColor: Colors.successBg, borderColor: Colors.success },
  bannerWarning: { backgroundColor: Colors.warningBg, borderColor: Colors.warning },
  bannerError: { backgroundColor: Colors.dangerBg, borderColor: Colors.danger },
  bannerText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.border, gap: 10 },
  label: { fontSize: 14, fontWeight: '700', color: Colors.text },
  sectionSub: { fontSize: 16, fontWeight: '800', color: Colors.text, marginTop: 4 },
  numInput: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, padding: 12, fontSize: 18, fontWeight: '700', color: Colors.text, backgroundColor: Colors.background },
  candidateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.background },
  colorDot: { width: 12, height: 34, borderRadius: 6 },
  candidateInfo: { flex: 1 },
  candidateOrg: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  candidateName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  voteInput: { width: 78, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, padding: 10, fontSize: 17, fontWeight: '800', textAlign: 'center', color: Colors.text, backgroundColor: Colors.background },
  rowTwo: { flexDirection: 'row', gap: 10 },
  half: { flex: 1, gap: 6 },
  cuadraturaBox: { padding: 12, borderRadius: 10, borderWidth: 1 },
  cuadraOk: { backgroundColor: Colors.successBg, borderColor: Colors.success },
  cuadraErr: { backgroundColor: Colors.dangerBg, borderColor: Colors.danger },
  cuadraText: { fontSize: 14, fontWeight: '700', color: Colors.text },
  preview: { width: '100%', height: 180, borderRadius: 10, marginTop: 6 },
  metaText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  mt10: { marginTop: 6 },
});
