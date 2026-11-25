import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { JrvGenero } from '@features/territory/domain/entities/Jrv';
import {
  AssignCoordinatorModal,
  CoordFormValues,
} from '@features/territory/presentation/components/AssignCoordinatorModal';
import { RecintoCard } from '@features/territory/presentation/components/RecintoCard';
import { useRecintos } from '@features/territory/presentation/hooks/useTerritory';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdnHero } from '@shared/ui/components/AdnHero';
import { AppButton } from '@shared/ui/components/AppButton';
import { AppInput } from '@shared/ui/components/AppInput';
import { Colors } from '@shared/ui/theme/colors';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { z } from 'zod';

const recintoSchema = z.object({
  parroquia: z.string().min(2, 'Ingresa la parroquia.'),
  nombre: z.string().min(3, 'Ingresa el nombre del recinto.'),
  direccion: z.string().optional(),
});

type RecintoForm = z.infer<typeof recintoSchema>;

export default function RecintosScreen() {
  const router = useRouter();
  const { recintos, isLoadingRecintos, createRecinto, isCreatingRecinto, createJrv, isCreatingJrv } =
    useRecintos();
  const { createSubordinateUser, isCreatingUser, createUserError } = useAuth();

  const [showNewRecinto, setShowNewRecinto] = useState(false);
  const [selectedRecintoForCoord, setSelectedRecintoForCoord] = useState<{
    id: string;
    nombre: string;
  } | null>(null);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const recintoForm = useForm<RecintoForm>({
    resolver: zodResolver(recintoSchema),
    defaultValues: { parroquia: '', nombre: '', direccion: '' },
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

  const onCreateCoord = async (values: CoordFormValues) => {
    if (!selectedRecintoForCoord) return;
    try {
      setCreatedEmail(null);
      await createSubordinateUser({
        ...values,
        rol: 'coordinador_recinto',
        recintoId: selectedRecintoForCoord.id,
      });
      setCreatedEmail(values.email);
      setSelectedRecintoForCoord(null);
    } catch {
      // El error aparece en createUserError
    }
  };

  return (
    <View style={styles.screen}>
      <AdnHero patternId="adnGridRecintos" onBack={() => router.back()} />

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

        {createdEmail ? (
          <View style={styles.successBanner}>
            <Text style={styles.successTitle}>Coordinador registrado</Text>
            <Text style={styles.successText}>Correo: {createdEmail}</Text>
            <Text style={styles.successHint}>
              Se envió automáticamente su clave temporal y el enlace de verificación al correo
              registrado. Deberá cambiar su clave en el primer ingreso.
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

        {isLoadingRecintos ? (
          <Text style={styles.loadingText}>Cargando recintos...</Text>
        ) : (
          recintos.map((recinto, index) => (
            <RecintoCard
              key={recinto.id}
              recinto={recinto}
              index={index}
              isCreatingJrv={isCreatingJrv}
              onAddMesa={() => onQuickAddJrv(recinto.id, (recinto.totalJrvs ?? 0) + 1, 'Mixta')}
              onAssignCoordinator={() =>
                setSelectedRecintoForCoord({ id: recinto.id, nombre: recinto.nombre })
              }
            />
          ))
        )}
      </ScrollView>

      <AssignCoordinatorModal
        visible={Boolean(selectedRecintoForCoord)}
        recintoNombre={selectedRecintoForCoord?.nombre}
        isLoading={isCreatingUser}
        errorMessage={createUserError}
        onClose={() => setSelectedRecintoForCoord(null)}
        onSubmit={onCreateCoord}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
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
});
