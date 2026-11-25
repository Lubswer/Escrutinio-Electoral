import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { Dignidad } from '@features/scrutiny/domain/entities/Acta';
import { evaluateActaCuadratura } from '@features/scrutiny/domain/rules/validateActaCuadratura';
import {
  useCandidatos,
  useJrvActas,
  useSaveActa,
} from '@features/scrutiny/presentation/hooks/useScrutiny';
import { ConflictError } from '@shared/domain/errors/AppError';
import { getCandidatePhoto } from '@shared/ui/assets/candidatePhotos';
import { AdnHero } from '@shared/ui/components/AdnHero';
import { AppButton } from '@shared/ui/components/AppButton';
import { FeedbackModal, FeedbackType } from '@shared/ui/components/FeedbackModal';
import { useNetworkStatus } from '@shared/ui/hooks/useNetworkStatus';
import { Colors } from '@shared/ui/theme/colors';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

function toInt(val: string): number {
  const parsed = parseInt(val.replace(/[^0-9]/g, ''), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function ScrutinyActaScreen() {
  const { jrvId, numero, genero, recinto } = useLocalSearchParams<{
    jrvId: string;
    numero?: string;
    genero?: string;
    recinto?: string;
  }>();
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();

  const isCoordRecinto = user?.rol === 'coordinador_recinto';

  const [dignidad, setDignidad] = useState<Dignidad>('alcalde');
  const { data: candidatos = [] } = useCandidatos(dignidad);
  const { data: actas = [], isLoading: isLoadingActas, refetch: refetchActas } = useJrvActas(
    jrvId ?? '',
  );
  const { saveActa, isSaving, capturePhotoAndCheckBlur, captureGps, getPhotoUrl } = useSaveActa(
    jrvId ?? '',
  );

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

  const [feedbackModal, setFeedbackModal] = useState<{
    type: FeedbackType;
    title?: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);
  const [capturingPhoto, setCapturingPhoto] = useState(false);
  const [capturingGps, setCapturingGps] = useState(false);
  const [fullPhotoUri, setFullPhotoUri] = useState<string | null>(null);
  const [loadingServerPhoto, setLoadingServerPhoto] = useState(false);

  const handleOpenServerPhoto = async () => {
    if (!photoUri) return;
    try {
      setLoadingServerPhoto(true);
      const signedUrl = await getPhotoUrl(photoUri);
      if (!signedUrl) {
        setFeedbackModal({
          type: 'info',
          title: 'Imagen no disponible',
          message: 'No se encontró esta fotografía en el servidor (puede ser un registro de prueba).',
        });
        return;
      }
      setFullPhotoUri(signedUrl);
    } catch {
      setFeedbackModal({
        type: 'error',
        title: 'Error al cargar foto',
        message: 'No se pudo descargar la fotografía del servidor. Verifica tu conexión.',
      });
    } finally {
      setLoadingServerPhoto(false);
    }
  };

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
  }, [currentActa, dignidad]);

  useEffect(() => {
    setFeedbackModal(null);
  }, [dignidad]);

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
      setFeedbackModal(null);
      const result = await capturePhotoAndCheckBlur();
      if (!result) return;

      setSharpnessScore(result.sharpnessScore);
      setPhotoBlurry(result.isBlurry);

      if (result.isBlurry) {
        setPhotoUri('');
        setFeedbackModal({
          type: 'error',
          title: 'Fotografía borrosa',
          message:
            'La fotografía salió borrosa o ilegible. Toma otra foto enfocando bien el acta.',
        });
      } else {
        setPhotoUri(result.uri);
        setFeedbackModal({
          type: 'success',
          title: 'Fotografía aprobada',
          message: 'La fotografía del acta se adjuntó correctamente.',
        });
      }
    } catch (err: any) {
      setFeedbackModal({
        type: 'error',
        title: 'Error de cámara',
        message: err?.message ?? 'Error al tomar la fotografía.',
      });
    } finally {
      setCapturingPhoto(false);
    }
  };

  const handleCaptureGps = async () => {
    try {
      setCapturingGps(true);
      setFeedbackModal(null);
      const loc = await captureGps();
      setGps(loc);
    } catch (err: any) {
      setFeedbackModal({
        type: 'error',
        title: 'Ubicación no disponible',
        message: err?.message ?? 'No se pudo obtener el GPS. Verifica que los permisos estén activos.',
        actionLabel: 'Solicitar permiso y reintentar',
        onAction: () => {
          setFeedbackModal(null);
          void handleCaptureGps();
        },
      });
    } finally {
      setCapturingGps(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !jrvId) return;

    if (isCoordRecinto && !currentActa) {
      setFeedbackModal({
        type: 'info',
        title: 'Acta aún no registrada',
        message: 'El coordinador de recinto solo puede corregir actas ya registradas por un veedor.',
      });
      return;
    }

    if (!cuadratura.valid) {
      setFeedbackModal({
        type: 'error',
        title: 'Cuadratura incorrecta',
        message: cuadratura.errorMessage ?? 'La suma de votos no cuadra.',
      });
      return;
    }

    if (!photoUri || photoBlurry) {
      setFeedbackModal({
        type: 'error',
        title: 'Falta fotografía',
        message: 'Adjunta una fotografía nítida del acta antes de continuar.',
      });
      return;
    }

    if (!gps) {
      setFeedbackModal({
        type: 'error',
        title: 'Falta ubicación GPS',
        message: 'Necesitas activar y capturar tu ubicación GPS antes de guardar el acta.',
        actionLabel: 'Activar y capturar GPS',
        onAction: () => {
          setFeedbackModal(null);
          void handleCaptureGps();
        },
      });
      return;
    }

    try {
      setFeedbackModal(null);
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
        setFeedbackModal({
          type: 'info',
          title: 'Guardado sin conexión',
          message: 'Sin señal: el acta quedó guardada localmente y se enviará al recuperar conexión.',
        });
      } else if (saved.syncStatus === 'fallido') {
        setFeedbackModal({
          type: 'error',
          title: 'No se pudo enviar',
          message: saved.syncError ?? 'Error al enviar el acta.',
        });
      } else {
        setFeedbackModal({
          type: 'success',
          title: 'Acta guardada',
          message: `Acta de ${dignidad} registrada correctamente en el servidor (v${saved.version}).`,
        });
      }
    } catch (err: any) {
      if (err instanceof ConflictError) {
        await refetchActas();
      }
      setFeedbackModal({
        type: 'error',
        title: 'Error al guardar',
        message: err?.message ?? 'No se pudo guardar el acta.',
      });
    }
  };

  const coordCannotCreate = isCoordRecinto && !isLoadingActas && !currentActa;

  return (
    <View style={styles.screen}>
      <AdnHero patternId="adnGridScrutiny" onBack={() => router.back()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Título + estado de red */}
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              {recinto ? <Text style={styles.recintoNameText}>{recinto}</Text> : null}
              {numero ? (
                <Text style={styles.mesaEyebrow}>
                  JRV · MESA #{numero}
                  {genero ? ` · ${genero.toUpperCase()}` : ''}
                </Text>
              ) : null}
              <Text style={styles.title}>
                {isCoordRecinto ? 'Revisión de Acta' : 'Registro de Acta'}
              </Text>
              <Text style={styles.subtitle}>
                {isCoordRecinto
                  ? 'Corrección de actas registradas'
                  : 'Registra Alcalde y Prefecto con foto y GPS'}
              </Text>
            </View>
          </View>

          {/* Tabs unidos de Dignidad con fondo accent */}
          <View style={styles.segmentedWrap}>
            {(['alcalde', 'prefecto'] as Dignidad[]).map((tab) => {
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
                    {tab === 'alcalde' ? 'Alcalde Rumiñahui' : 'Prefecto Pichincha'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {coordCannotCreate ? (
            <Animated.View entering={FadeInUp.duration(260)} style={styles.emptyRoleCard}>
              <View style={styles.emptyIconCircle}>
                <SymbolView
                  name={{ ios: 'doc.text', android: 'description', web: 'description' }}
                  size={28}
                  tintColor={Colors.primary}
                />
              </View>
              <Text style={styles.emptyRoleTitle}>Sin actas registrada</Text>
              <Text style={styles.emptyRoleDesc}>
                El veedor todavía no ha enviado el acta de{' '}
                <Text style={styles.boldText}>
                  {dignidad === 'alcalde' ? 'Alcalde' : 'Prefecto'}
                </Text>{' '}
                para esta mesa. Como coordinador de recinto podrás revisarla y corregirla una vez
                sea registrada.
              </Text>
            </Animated.View>
          ) : (
            <>
              {currentActa ? (
                <View style={styles.syncBadgeRow}>
                  <SymbolView
                    name={
                      currentActa.syncStatus === 'guardado'
                        ? { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }
                        : currentActa.syncStatus === 'pendiente_envio'
                          ? { ios: 'clock.fill', android: 'schedule', web: 'schedule' }
                          : { ios: 'exclamationmark.circle.fill', android: 'error', web: 'error' }
                    }
                    size={16}
                    tintColor={
                      currentActa.syncStatus === 'guardado'
                        ? Colors.success
                        : currentActa.syncStatus === 'pendiente_envio'
                          ? Colors.warning
                          : Colors.danger
                    }
                  />
                  <Text style={styles.syncLabel}>
                    {currentActa.syncStatus === 'guardado'
                      ? `Guardado en servidor (v${currentActa.version})`
                      : currentActa.syncStatus === 'pendiente_envio'
                        ? 'Pendiente de envío (guardado local)'
                        : 'Error en último envío'}
                  </Text>
                </View>
              ) : null}

              {/* Card 1: Conteo de votos */}
              <Animated.View entering={FadeInUp.duration(280)} style={styles.card}>
                <Text style={styles.cardTitle}>Conteo de Votos</Text>

                <View style={styles.sufragantesBox}>
                  <Text style={styles.fieldLabel}>Total de sufragantes en la mesa</Text>
                  <TextInput
                    style={styles.bigLineInput}
                    keyboardType="numeric"
                    value={totalSufragantes}
                    onChangeText={setTotalSufragantes}
                    placeholder="0"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <Text style={styles.subHeading}>Votos por Organización Política</Text>
                {candidatos.map((c) => {
                  const photo = getCandidatePhoto(dignidad, c.nombreCompleto);
                  const initials = c.nombreCompleto
                    .split(' ')
                    .slice(0, 2)
                    .map((p) => p[0] ?? '')
                    .join('')
                    .toUpperCase();

                  return (
                    <View key={c.id} style={styles.candidateRow}>
                      <View style={[styles.avatarRing, { backgroundColor: c.colorHex }]}>
                        {photo ? (
                          <Image source={photo} style={styles.avatarImage} contentFit="cover" />
                        ) : (
                          <View style={[styles.avatarFallback, { backgroundColor: c.colorHex }]}>
                            <Text style={styles.avatarFallbackText}>{initials}</Text>
                          </View>
                        )}
                      </View>
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
                        placeholder="0"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  );
                })}

                <View style={styles.rowTwo}>
                  <View style={styles.half}>
                    <Text style={styles.fieldLabel}>Votos en Blanco</Text>
                    <TextInput
                      style={styles.lineInput}
                      keyboardType="numeric"
                      value={votosBlancos}
                      onChangeText={setVotosBlancos}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                  <View style={styles.half}>
                    <Text style={styles.fieldLabel}>Votos Nulos</Text>
                    <TextInput
                      style={styles.lineInput}
                      keyboardType="numeric"
                      value={votosNulos}
                      onChangeText={setVotosNulos}
                      placeholder="0"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View style={styles.cuadraturaRow}>
                  <SymbolView
                    name={
                      cuadratura.valid
                        ? { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }
                        : { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' }
                    }
                    size={18}
                    tintColor={cuadratura.valid ? Colors.success : Colors.danger}
                  />
                  <Text
                    style={[
                      styles.cuadraText,
                      { color: cuadratura.valid ? Colors.success : Colors.danger },
                    ]}
                  >
                    {cuadratura.valid
                      ? `Cuadratura exacta: ${cuadratura.sumaTotal} / ${totalSufragantes}`
                      : cuadratura.errorMessage}
                  </Text>
                </View>
              </Animated.View>

              {/* Card 2: Evidencia obligatoria (Foto y GPS) */}
              <Animated.View entering={FadeInUp.delay(80).duration(300)} style={styles.card}>
                <Text style={styles.cardTitle}>Evidencia Obligatoria</Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={capturingPhoto}
                  onPress={handleTakePhoto}
                  style={styles.evidenceBtn}
                >
                  <SymbolView
                    name={{ ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' }}
                    size={18}
                    tintColor={Colors.primary}
                  />
                  <Text style={styles.evidenceBtnText}>
                    {capturingPhoto
                      ? 'Validando fotografía...'
                      : photoUri
                        ? 'Tomar otra foto del acta'
                        : 'Tomar fotografía del acta'}
                  </Text>
                </TouchableOpacity>

                {photoUri.startsWith('file://') ? (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setFullPhotoUri(photoUri)}
                    style={styles.previewWrap}
                  >
                    <Image source={{ uri: photoUri }} style={styles.preview} contentFit="cover" />
                    <View style={styles.previewExpandBadge}>
                      <SymbolView
                        name={{
                          ios: 'arrow.up.left.and.arrow.down.right',
                          android: 'open_in_full',
                          web: 'open_in_full',
                        }}
                        size={14}
                        tintColor="#FFFFFF"
                      />
                      <Text style={styles.previewExpandText}>Ver completa</Text>
                    </View>
                  </TouchableOpacity>
                ) : photoUri ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={loadingServerPhoto}
                    onPress={handleOpenServerPhoto}
                    style={styles.serverFilePill}
                  >
                    <SymbolView
                      name={{ ios: 'photo', android: 'image', web: 'image' }}
                      size={16}
                      tintColor={Colors.primary}
                    />
                    <Text style={styles.serverFileText} numberOfLines={1}>
                      {loadingServerPhoto ? 'Cargando fotografía...' : 'Foto guardada en servidor'}
                    </Text>
                    <Text style={styles.serverFileAction}>Ver</Text>
                    <SymbolView
                      name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                      size={14}
                      tintColor={Colors.primary}
                    />
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={capturingGps}
                  onPress={handleCaptureGps}
                  style={styles.evidenceBtn}
                >
                  <SymbolView
                    name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }}
                    size={18}
                    tintColor={Colors.primary}
                  />
                  <Text style={styles.evidenceBtnText}>
                    {capturingGps
                      ? 'Obteniendo ubicación...'
                      : gps
                        ? 'Actualizar ubicación GPS'
                        : 'Capturar ubicación GPS'}
                  </Text>
                </TouchableOpacity>

                {gps ? (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/maps/search/?api=1&query=${gps.latitude},${gps.longitude}`,
                      )
                    }
                    style={styles.gpsInfoBox}
                  >
                    <Text style={styles.coordsText}>
                      {gps.latitude.toFixed(5)}, {gps.longitude.toFixed(5)}
                    </Text>
                    <View style={styles.gpsActionRow}>
                      <Text style={styles.serverFileAction}>Ver</Text>
                      <SymbolView
                        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                        size={14}
                        tintColor={Colors.primary}
                      />
                    </View>
                  </TouchableOpacity>
                ) : null}
              </Animated.View>

              <AppButton
                title={currentActa?.id ? 'Guardar corrección del acta' : 'Enviar acta de escrutinio'}
                onPress={handleSubmit}
                loading={isSaving}
                disabled={isSaving}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <FeedbackModal
        visible={Boolean(feedbackModal)}
        type={feedbackModal?.type ?? 'info'}
        title={feedbackModal?.title}
        message={feedbackModal?.message ?? ''}
        actionLabel={feedbackModal?.actionLabel}
        onAction={feedbackModal?.onAction}
        onClose={() => setFeedbackModal(null)}
      />

      <Modal
        visible={Boolean(fullPhotoUri)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setFullPhotoUri(null)}
      >
        <View style={styles.fullPhotoBackdrop}>
          <Pressable style={styles.fullPhotoDismiss} onPress={() => setFullPhotoUri(null)} />
          {fullPhotoUri ? (
            <Image
              source={{ uri: fullPhotoUri }}
              style={styles.fullPhotoImage}
              contentFit="contain"
            />
          ) : null}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setFullPhotoUri(null)}
            style={styles.fullPhotoCloseBtn}
            accessibilityLabel="Cerrar imagen"
          >
            <SymbolView
              name={{ ios: 'xmark', android: 'close', web: 'close' }}
              size={22}
              tintColor="#FFFFFF"
            />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 44,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleBlock: {
    flex: 1,
  },
  recintoNameText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 2,
  },
  mesaEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primaryMedium,
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
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
  emptyRoleCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRoleTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
  },
  emptyRoleDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '800',
    color: Colors.text,
  },
  syncBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  syncLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  banner: {
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  bannerSuccess: { backgroundColor: Colors.successBg, borderColor: Colors.success },
  bannerWarning: { backgroundColor: Colors.warningBg, borderColor: Colors.warning },
  bannerError: { backgroundColor: Colors.dangerBg, borderColor: Colors.danger },
  bannerText: { fontSize: 13, fontWeight: '700', color: Colors.text },
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
  subHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  sufragantesBox: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  bigLineInput: {
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.primaryMedium,
    paddingVertical: 8,
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
  },
  lineInput: {
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.border,
    paddingVertical: 8,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  candidateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 6,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 43,
    height: 43,
    borderRadius: 4,
  },
  avatarFallback: {
    width: 43,
    height: 43,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  candidateInfo: {
    flex: 1,
    gap: 2,
  },
  candidateOrg: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  candidateName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 18,
  },
  voteInput: {
    width: 70,
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.border,
    paddingVertical: 6,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    color: Colors.text,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 4,
  },
  half: {
    flex: 1,
    gap: 2,
  },
  cuadraturaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 10,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: Colors.background,
  },
  cuadraText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  evidenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  evidenceBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
  },
  previewWrap: {
    position: 'relative',
    borderRadius: 14,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: 190,
    borderRadius: 14,
  },
  previewExpandBadge: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(28, 6, 36, 0.72)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  previewExpandText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  fullPhotoBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPhotoDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fullPhotoImage: {
    width: '100%',
    height: '86%',
  },
  fullPhotoCloseBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serverFilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  serverFileText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  serverFileAction: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
  },
  gpsInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gpsActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  coordsText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  gpsBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
