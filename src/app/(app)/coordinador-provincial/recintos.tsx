import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { JrvGenero } from '@features/territory/domain/entities/Jrv';
import { useRecintos } from '@features/territory/presentation/hooks/useTerritory';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppButton } from '@shared/ui/components/AppButton';
import { AppInput } from '@shared/ui/components/AppInput';
import { Colors } from '@shared/ui/theme/colors';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';

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
  const router = useRouter();
  const queryClient = useQueryClient();
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
      await queryClient.invalidateQueries({ queryKey: ['territory', 'recintos'] });
      setCreatedCredentials({ email: values.email, clave: values.claveTemporal });
      coordForm.reset();
      setSelectedRecintoForCoord(null);
    } catch {
      // El error aparece en createUserError
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Recintos de Rumiñahui</Text>
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

      <AppButton
        title={showNewRecinto ? 'Cancelar nuevo recinto' : '+ Agregar nuevo recinto'}
        variant={showNewRecinto ? 'secondary' : 'primary'}
        onPress={() => setShowNewRecinto((prev) => !prev)}
      />

      {showNewRecinto ? (
        <View style={styles.formCard}>
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
        </View>
      ) : null}

      {selectedRecintoForCoord ? (
        <View style={styles.formCard}>
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
        </View>
      ) : null}

      {isLoadingRecintos ? (
        <Text style={styles.loadingText}>Cargando recintos...</Text>
      ) : (
        recintos.map((recinto) => (
          <View key={recinto.id} style={styles.recintoCard}>
            <Text style={styles.parroquia}>{recinto.parroquia.toUpperCase()}</Text>
            <Text style={styles.recintoName}>{recinto.nombre}</Text>
            <Text style={styles.meta}>Mesas registradas (JRV): {recinto.totalJrvs ?? 0}</Text>
            <Text style={styles.meta}>
              Coordinador: {recinto.coordinadorNombre ?? 'Sin asignar'}
            </Text>

            <View style={styles.actionsRow}>
              <AppButton
                title="+ Mesa Mixta"
                variant="secondary"
                disabled={isCreatingJrv}
                onPress={() => onQuickAddJrv(recinto.id, (recinto.totalJrvs ?? 0) + 1, 'Mixta')}
                style={styles.smallBtn}
              />
              {!recinto.coordinadorId ? (
                <AppButton
                  title="Asignar Coordinador"
                  onPress={() => setSelectedRecintoForCoord(recinto.id)}
                  style={styles.smallBtn}
                />
              ) : null}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 54, backgroundColor: Colors.background, gap: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  recintoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  parroquia: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  recintoName: { fontSize: 17, fontWeight: '700', color: Colors.text },
  meta: { fontSize: 14, color: Colors.textSecondary },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  smallBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 10 },
  mt10: { marginTop: 10 },
  loadingText: { textAlign: 'center', color: Colors.textSecondary, marginTop: 20 },
  infoBanner: {
    backgroundColor: Colors.primaryLight,
    padding: 12,
    borderRadius: 10,
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
