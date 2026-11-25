import { PasswordStrengthGuide } from '@features/auth/presentation/components/PasswordStrengthGuide';
import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdnHero } from '@shared/ui/components/AdnHero';
import { AppButton } from '@shared/ui/components/AppButton';
import { AppInput } from '@shared/ui/components/AppInput';
import { FeedbackModal } from '@shared/ui/components/FeedbackModal';
import { Colors } from '@shared/ui/theme/colors';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { z } from 'zod';

const changePasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'La clave debe tener al menos 8 caracteres.')
      .regex(/[A-Z]/, 'Incluye al menos una letra mayúscula.')
      .regex(/[0-9]/, 'Incluye al menos un número.'),
    confirmPassword: z.string().min(8, 'Confirma tu nueva contraseña.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

export default function FirstLoginChangePasswordScreen() {
  const { user, changeFirstPassword, isChangingPassword, logout } = useAuth();
  const [errorModalMessage, setErrorModalMessage] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  const watchedPassword = watch('newPassword') ?? '';

  const onSubmit = async (values: ChangePasswordValues) => {
    try {
      setErrorModalMessage(null);
      await changeFirstPassword(values);
    } catch (err: any) {
      setErrorModalMessage(
        err?.message ?? 'No se pudo actualizar tu contraseña. Intenta nuevamente.',
      );
    }
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AdnHero patternId="adnGridFirstLogin" variant="home" onLogout={logout}>
            <Animated.View entering={FadeInDown.duration(350)} style={styles.greetingBlock}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>PRIMER INGRESO</Text>
              </View>
              <Text style={styles.userName}>Define tu clave personal</Text>
              <Text style={styles.jurisdiction}>
                Hola {user?.nombres}. Cambia tu clave temporal para que solo tú conozcas tu acceso.
              </Text>
            </Animated.View>
          </AdnHero>

          <View style={styles.body}>
            <Animated.View entering={FadeInUp.duration(300)} style={styles.card}>
              <AppInput
                control={control}
                name="newPassword"
                label="Nueva contraseña"
                placeholder="Ej: MiClave2026!"
                secureTextEntry
                errorMessage={errors.newPassword?.message}
              />

              <AppInput
                control={control}
                name="confirmPassword"
                label="Confirmar contraseña"
                placeholder="Repite tu nueva contraseña"
                secureTextEntry
                errorMessage={errors.confirmPassword?.message}
              />

              <PasswordStrengthGuide password={watchedPassword} />

              <AppButton
                title="Guardar clave y continuar"
                onPress={handleSubmit(onSubmit)}
                loading={isChangingPassword}
                style={styles.button}
              />
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <FeedbackModal
        visible={Boolean(errorModalMessage)}
        type="error"
        title="No se pudo guardar la clave"
        message={errorModalMessage ?? ''}
        onClose={() => setErrorModalMessage(null)}
      />
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
  scrollContent: {
    paddingBottom: 36,
  },
  greetingBlock: {
    gap: 4,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 4,
  },
  roleBadgeText: {
    color: Colors.primaryDark,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  jurisdiction: {
    fontSize: 13,
    color: Colors.primaryLight,
    fontWeight: '600',
    lineHeight: 19,
  },
  body: {
    padding: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  button: {
    marginTop: 4,
  },
});
