import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { JrvGenero } from '@features/territory/domain/entities/Jrv';
import { useRecintos } from '@features/territory/presentation/hooks/useTerritory';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppButton } from '@shared/ui/components/AppButton';
import { AppInput } from '@shared/ui/components/AppInput';
import { Colors } from '@shared/ui/theme/colors';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, Pattern, Rect } from 'react-native-svg';
import { z } from 'zod';

const logoAdn = require('@/assets/logoADN.png');

const recintoSchema = z.object({
  parroquia: z.string().min(2, 'Ingresa la parroquia.'),
  nombre: z.string().min(3, 'Ingresa el nombre del recinto.'),
  direccion: z.string().optional(),
});

const coordSchema = z.object({
  cedula: z.string().length(10, 'La cédula debe tener 10 dígitos.'),
  nombres: z.string().min(2, 'Ingresa los nombres.'),
  apellidos: z.string().min(2, 'Ingresa los apellidos.'),
  telefono: z.string().min(9, 'Ingresa un teléfono válido.'),
  email: z.string().email('Correo inválido.'),
  claveTemporal: z.string().min(8, 'Mínimo 8 caracteres.'),
});

type RecintoForm = z.infer<typeof recintoSchema>;
type CoordForm = z.infer<typeof coordSchema>;

export default function RecintosScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const { recintos, isLoadingRecintos, createRecinto, isCreatingRecinto, createJrv, isCreatingJrv } =
    useRecintos();
  const { createSubordinateUser, isCreatingUser, createUserError } = useAuth();

  const [showNewRecinto, setShowNewRecinto] = useState(false);
  const [selectedRecintoForCoord, setSelectedRecintoForCoord] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    clave: string;
  } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const recintoForm = useForm<RecintoForm>({
    resolver: zodResolver(recintoSchema),
    defaultValues: { parroquia: '', nombre: '', direccion: '' },
  });

  const coordForm = useForm<CoordForm>({
    resolver: zodResolver(coordSchema),
    defaultValues: {
      cedula: '',
      nombres: '',
      apellidos: '',
      telefono: '',
      email: '',
      claveTemporal: '',
    },
  });

  const onCreateRecinto = async (values: RecintoForm) => {
    try {
      setFeedback(null);
      await createRecinto(values);
      recintoForm.reset();
      setShowNewRecinto(false);
      setFeedback('Recinto creado correctamente.');
    } catch (err: any) {
      setFeedback(err?.message ?? 'Error al crear recinto.');
    }
  };

  const onQuickAddJrv = async (recintoId: string, nextNumero: number, genero: JrvGenero) => {
    try {
      setFeedback(null);
      await createJrv({ recintoId, numeroMesa: nextNumero, genero });
      setFeedback(`Mesa #${nextNumero} (${genero}) agregada al recinto.`);
    } catch (err: any) {
      setFeedback(err?.message ?? 'No se pudo agregar la mesa.');
    }
  };

  const onCreateCoord = async (values: CoordForm) => {
    if (!selectedRecintoForCoord) return;
    try {
      setCreatedCredentials(null);
      await createSubordinateUser({
        ...values,
        rol: 'coordinador_recinto',
        recintoId: selectedRecintoForCoord,
      });
      setCreatedCredentials({ email: values.email, clave: values.claveTemporal });
      coordForm.reset();
      setSelectedRecintoForCoord(null);
    } catch {
      // El error aparece en createUserError
    }
  };

  return (
    <View style={styles.screen}>
      {/* Hero compacto con cuadrícula ADN 7 */}
      <LinearGradient
        colors={[Colors.primaryMedium, Colors.primaryMedium, Colors.primaryMedium]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={[styles.heroGrid, { width: screenWidth }]} pointerEvents="none">
          <Svg width={screenWidth} height="100%">
            <Defs>
              <Pattern id="adnGridRecintos" width="28" height="28" patternUnits="userSpaceOnUse">
                <Path
                  d="M 28 0 L 0 0 0 28"
                  fill="none"
                  stroke={Colors.primary}
                  strokeWidth="1.2"
                  strokeOpacity="0.45"
                />
              </Pattern>
            </Defs>
            <Rect width={screenWidth} height="100%" fill="url(#adnGridRecintos)" />
          </Svg>
        </View>

        <View style={styles.heroBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.75}
            style={styles.backChip}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M11 6l-6 6 6 6"
                stroke="#FFFFFF"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.backChipText}>Volver</Text>
          </TouchableOpacity>

          <Image source={logoAdn} style={styles.logo} contentFit="contain" />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Fila: Título a la izquierda | Botón Agregar Recinto a la derecha */}
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Recintos de Rumiñahui</Text>
            <Text style={styles.subtitle}>{recintos.length} recintos en jurisdicción</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowNewRecinto((prev) => !prev)}
            style={[styles.addBtn, showNewRecinto ? styles.addBtnCancel : null]}
          >
            <Text style={[styles.addBtnText, showNewRecinto ? styles.addBtnCancelText : null]}>
              {showNewRecinto ? 'Cancelar' : '+ Agregar'}
            </Text>
          </TouchableOpacity>
        </View>

        {feedback ? (
          <View style={styles.infoBanner}>
            <Text style={styles.infoBannerText}>{feedback}</Text>
          </View>
        ) : null}

        {createdCredentials ? (
          <View style={styles.successBanner}>
            <Text style={styles.successTitle}>Coordinador creado (aviso único S-11)</Text>
            <Text style={styles.successText}>Correo: {createdCredentials.email}</Text>
            <Text style={styles.successText}>Clave temporal: {createdCredentials.clave}</Text>
            <Text style={styles.successHint}>
              Entrégale esta clave ahora; deberá cambiarla en su primer ingreso.
            </Text>
          </View>
        ) : null}

        {showNewRecinto ? (
          <Animated.View entering={FadeInUp.duration(260)} style={styles.formCard}>
            <Text style={styles.cardTitle}>Nuevo Recinto (Rumiñahui)</Text>
            <AppInput
              control={recintoForm.control}
              name="parroquia"
              label="Parroquia"
              placeholder="Ej: Sangolquí"
              errorMessage={recintoForm.formState.errors.parroquia?.message}
            />
            <AppInput
              control={recintoForm.control}
              name="nombre"
              label="Nombre del recinto"
              placeholder="Ej: U.E. Darío Figueroa"
              errorMessage={recintoForm.formState.errors.nombre?.message}
            />
            <AppInput
              control={recintoForm.control}
              name="direccion"
              label="Dirección (opcional)"
              placeholder="Av. Principal..."
            />
            <AppButton
              title="Guardar recinto"
              onPress={recintoForm.handleSubmit(onCreateRecinto)}
              loading={isCreatingRecinto}
            />
          </Animated.View>
        ) : null}

        {selectedRecintoForCoord ? (
          <Animated.View entering={FadeInUp.duration(260)} style={styles.formCard}>
            <Text style={styles.cardTitle}>Crear Coordinador de Recinto</Text>
            {createUserError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{createUserError}</Text>
              </View>
            ) : null}
            <AppInput
              control={coordForm.control}
              name="cedula"
              label="Cédula (10 dígitos)"
              keyboardType="numeric"
              maxLength={10}
              errorMessage={coordForm.formState.errors.cedula?.message}
            />
            <AppInput
              control={coordForm.control}
              name="nombres"
              label="Nombres"
              errorMessage={coordForm.formState.errors.nombres?.message}
            />
            <AppInput
              control={coordForm.control}
              name="apellidos"
              label="Apellidos"
              errorMessage={coordForm.formState.errors.apellidos?.message}
            />
            <AppInput
              control={coordForm.control}
              name="telefono"
              label="Teléfono"
              keyboardType="phone-pad"
              errorMessage={coordForm.formState.errors.telefono?.message}
            />
            <AppInput
              control={coordForm.control}
              name="email"
              label="Correo electrónico"
              autoCapitalize="none"
              keyboardType="email-address"
              errorMessage={coordForm.formState.errors.email?.message}
            />
            <AppInput
              control={coordForm.control}
              name="claveTemporal"
              label="Clave temporal (mín. 8 caracteres)"
              secureTextEntry
              errorMessage={coordForm.formState.errors.claveTemporal?.message}
            />
            <AppButton
              title="Crear Coordinador"
              onPress={coordForm.handleSubmit(onCreateCoord)}
              loading={isCreatingUser}
            />
            <AppButton
              title="Cancelar"
              variant="secondary"
              onPress={() => setSelectedRecintoForCoord(null)}
              style={styles.mt10}
            />
          </Animated.View>
        ) : null}

        {isLoadingRecintos ? (
          <Text style={styles.loadingText}>Cargando recintos...</Text>
        ) : (
          recintos.map((recinto, index) => (
            <Animated.View
              key={recinto.id}
              entering={FadeInUp.delay(index * 45).duration(320)}
              style={styles.recintoCard}
            >
              {/* Fila superior: Parroquia pill + Contador de mesas */}
              <View style={styles.cardTopRow}>
                <View style={styles.parroquiaPill}>
                  <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M12 21s-7-5.686-7-11a7 7 0 1114 0c0 5.314-7 11-7 11z"
                      stroke={Colors.primary}
                      strokeWidth={2.2}
                    />
                    <Circle cx={12} cy={10} r={2.5} fill={Colors.primaryMedium} />
                  </Svg>
                  <Text style={styles.parroquiaText}>{recinto.parroquia.toUpperCase()}</Text>
                </View>

                <View style={styles.jrvCountPill}>
                  <Text style={styles.jrvCountText}>
                    {recinto.totalJrvs ?? 0}{' '}
                    {(recinto.totalJrvs ?? 0) === 1 ? 'mesa' : 'mesas'}
                  </Text>
                </View>
              </View>

              {/* Nombre y dirección */}
              <Text style={styles.recintoName}>{recinto.nombre}</Text>
              {recinto.direccion ? (
                <Text style={styles.recintoAddress}>{recinto.direccion}</Text>
              ) : null}

              {/* Estado del Coordinador */}
              <View
                style={[
                  styles.coordStatusBox,
                  recinto.coordinadorId ? styles.coordAssignedBox : styles.coordMissingBox,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: recinto.coordinadorId ? Colors.success : Colors.warning },
                  ]}
                />
                <View style={styles.coordInfo}>
                  <Text style={styles.coordLabel}>Coordinador de recinto</Text>
                  <Text
                    style={[
                      styles.coordValue,
                      !recinto.coordinadorId ? styles.coordMissingText : null,
                    ]}
                  >
                    {recinto.coordinadorNombre ?? 'Sin asignar todavía'}
                  </Text>
                </View>
              </View>

              {/* Acciones */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isCreatingJrv}
                  onPress={() => onQuickAddJrv(recinto.id, (recinto.totalJrvs ?? 0) + 1, 'Mixta')}
                  style={[styles.secondaryActionBtn, isCreatingJrv ? styles.disabledBtn : null]}
                >
                  <Text style={styles.secondaryActionText}>+ Mesa Mixta</Text>
                </TouchableOpacity>

                {!recinto.coordinadorId ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setSelectedRecintoForCoord(recinto.id)}
                    style={styles.primaryActionBtn}
                  >
                    <Text style={styles.primaryActionText}>Asignar Coordinador</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  hero: {
    paddingTop: 28,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  heroGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    top:8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  backChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  logo: {
    width: 88,
    height: 54,
  },
  container: {
    padding: 20,
    paddingBottom: 36,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 2,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: 21,
    fontWeight: '900',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnCancel: {
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  addBtnCancelText: {
    color: Colors.primary,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 12,
  },
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  parroquiaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  parroquiaText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  jrvCountPill: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
  coordStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 11,
    borderRadius: 12,
  },
  coordAssignedBox: {
    backgroundColor: Colors.successBg,
  },
  coordMissingBox: {
    backgroundColor: Colors.warningBg,
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  coordInfo: {
    flex: 1,
  },
  coordLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  coordValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.text,
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
  mt10: { marginTop: 10 },
  loadingText: { textAlign: 'center', color: Colors.textSecondary, marginTop: 20 },
  infoBanner: {
    backgroundColor: Colors.primaryLight,
    padding: 12,
    borderRadius: 12,
  },
  infoBannerText: { color: Colors.primary, fontWeight: '600', fontSize: 14 },
  successBanner: {
    backgroundColor: Colors.successBg,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.success,
    gap: 4,
  },
  successTitle: { color: Colors.success, fontWeight: '800', fontSize: 15 },
  successText: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  successHint: { color: Colors.textSecondary, fontSize: 13, marginTop: 4 },
  errorBanner: {
    backgroundColor: Colors.dangerBg,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorBannerText: { color: Colors.danger, fontSize: 14, fontWeight: '600' },
});
