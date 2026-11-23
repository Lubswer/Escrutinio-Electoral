import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppButton } from '@shared/ui/components/AppButton';
import { AppInput } from '@shared/ui/components/AppInput';
import { Colors } from '@shared/ui/theme/colors';
import { useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

const changePasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'La clave debe tener al menos 8 caracteres.'),
    confirmPassword: z.string().min(8, 'Confirma tu nueva contraseña.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export default function FirstLoginChangePasswordScreen() {
  const { user, changeFirstPassword, isChangingPassword, changePasswordError, logout } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const onSubmit = async (values: ChangePasswordValues) => {
    try {
      await changeFirstPassword(values);
    } catch {
      // El error se muestra en changePasswordError
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>Define tu contraseña personal</Text>
        <Text style={styles.subtitle}>
          Hola {user?.nombres}. Por seguridad, debes cambiar la clave temporal para que solo tú
          conozcas tu acceso.
        </Text>

        {changePasswordError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{changePasswordError}</Text>
          </View>
        ) : null}

        <AppInput
          control={control}
          name="newPassword"
          label="Nueva contraseña (mínimo 8 caracteres)"
          placeholder="••••••••"
          secureTextEntry
          errorMessage={errors.newPassword?.message}
        />

        <AppInput
          control={control}
          name="confirmPassword"
          label="Confirmar contraseña"
          placeholder="••••••••"
          secureTextEntry
          errorMessage={errors.confirmPassword?.message}
        />

        <AppButton
          title="Guardar clave y continuar"
          onPress={handleSubmit(onSubmit)}
          loading={isChangingPassword}
          style={styles.button}
        />

        <AppButton
          title="Cerrar sesión"
          variant="secondary"
          onPress={logout}
          style={styles.logoutButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 21,
  },
  errorBanner: {
    backgroundColor: Colors.dangerBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  errorBannerText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  button: { marginTop: 8 },
  logoutButton: { marginTop: 12 },
});
