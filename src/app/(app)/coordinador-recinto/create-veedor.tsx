import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppButton } from '@shared/ui/components/AppButton';
import { AppInput } from '@shared/ui/components/AppInput';
import { Colors } from '@shared/ui/theme/colors';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';

const veedorSchema = z.object({
  cedula: z.string().length(10, 'La cédula debe tener 10 dígitos.'),
  nombres: z.string().min(2, 'Ingresa los nombres.'),
  apellidos: z.string().min(2, 'Ingresa los apellidos.'),
  telefono: z.string().min(9, 'Ingresa un teléfono válido.'),
  email: z.string().email('Ingresa un correo válido.'),
});

type VeedorFormValues = z.infer<typeof veedorSchema>;

export default function CreateVeedorScreen() {
  const { user, createSubordinateUser, isCreatingUser, createUserError } = useAuth();
  const router = useRouter();

  const [createdEmail, setCreatedEmail] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VeedorFormValues>({
    resolver: zodResolver(veedorSchema),
    defaultValues: {
      cedula: '',
      nombres: '',
      apellidos: '',
      telefono: '',
      email: '',
    },
  });

  const onSubmit = async (values: VeedorFormValues) => {
    if (!user?.recintoId) return;
    try {
      setCreatedEmail(null);
      await createSubordinateUser({
        ...values,
        rol: 'veedor',
        recintoId: user.recintoId,
      });
      setCreatedEmail(values.email);
      reset();
    } catch {
      // El error se muestra en createUserError
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Registrar Veedor</Text>
      </View>

      {createdEmail ? (
        <View style={styles.successBanner}>
          <Text style={styles.successTitle}>Veedor registrado</Text>
          <Text style={styles.successText}>Correo: {createdEmail}</Text>
          <Text style={styles.successHint}>
            Se envió automáticamente su clave temporal y el enlace de verificación al correo
            registrado. Ya puedes asignarlo a una o varias mesas.
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        {createUserError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{createUserError}</Text>
          </View>
        ) : null}

        <AppInput
          control={control}
          name="cedula"
          label="Cédula (10 dígitos)"
          placeholder="Ej: 1712345678"
          keyboardType="numeric"
          maxLength={10}
          errorMessage={errors.cedula?.message}
        />
        <AppInput
          control={control}
          name="nombres"
          label="Nombres completos"
          placeholder="Ej: Carlos Andrés"
          errorMessage={errors.nombres?.message}
        />
        <AppInput
          control={control}
          name="apellidos"
          label="Apellidos completos"
          placeholder="Ej: Gómez Salazar"
          errorMessage={errors.apellidos?.message}
        />
        <AppInput
          control={control}
          name="telefono"
          label="Teléfono celular"
          placeholder="Ej: 0991234567"
          keyboardType="phone-pad"
          errorMessage={errors.telefono?.message}
        />
        <AppInput
          control={control}
          name="email"
          label="Correo electrónico"
          placeholder="Ej: veedor@correo.com"
          autoCapitalize="none"
          keyboardType="email-address"
          errorMessage={errors.email?.message}
        />

        <AppButton title="Crear Veedor" onPress={handleSubmit(onSubmit)} loading={isCreatingUser} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 54, backgroundColor: Colors.background, gap: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
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
