import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { zodResolver } from '@hookform/resolvers/zod';
import { AppButton } from '@shared/ui/components/AppButton';
import { AppInput } from '@shared/ui/components/AppInput';
import { Colors } from '@shared/ui/theme/colors';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

const recoverSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido.'),
});

type RecoverFormValues = z.infer<typeof recoverSchema>;

export default function ForgotPasswordScreen() {
  const { recoverPassword, isRecovering, recoverError } = useAuth();
  const router = useRouter();
  const [sent, setSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RecoverFormValues>({
    resolver: zodResolver(recoverSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (values: RecoverFormValues) => {
    try {
      setSent(false);
      await recoverPassword(values.email);
      setSent(true);
    } catch {
      // El error se muestra en recoverError
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>Recuperar contraseña</Text>
        <Text style={styles.subtitle}>
          Ingresa tu correo verificado. Te enviaremos un enlace para que restablezcas tu clave sin
          depender de nadie.
        </Text>

        {recoverError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{recoverError}</Text>
          </View>
        ) : null}

        {sent ? (
          <View style={styles.successBanner}>
            <Text style={styles.successBannerText}>
              Listo. Revisa la bandeja de entrada de tu correo electrónico para cambiar tu clave.
            </Text>
          </View>
        ) : null}

        <AppInput
          control={control}
          name="email"
          label="Correo electrónico"
          placeholder="ejemplo@correo.com"
          autoCapitalize="none"
          keyboardType="email-address"
          errorMessage={errors.email?.message}
        />

        <AppButton
          title="Enviar enlace de recuperación"
          onPress={handleSubmit(onSubmit)}
          loading={isRecovering}
        />

        <AppButton
          title="Volver al inicio de sesión"
          variant="secondary"
          onPress={() => router.back()}
          style={styles.backButton}
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
  errorBannerText: { color: Colors.danger, fontSize: 14, fontWeight: '600' },
  successBanner: {
    backgroundColor: Colors.successBg,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  successBannerText: { color: Colors.success, fontSize: 14, fontWeight: '600' },
  backButton: { marginTop: 12 },
});
