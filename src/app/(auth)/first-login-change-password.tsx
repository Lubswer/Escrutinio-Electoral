import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdnHero } from '@shared/ui/components/AdnHero';
import { AppButton } from '@shared/ui/components/AppButton';
import { AppInput } from '@shared/ui/components/AppInput';
import { FeedbackModal } from '@shared/ui/components/FeedbackModal';
import { Colors } from '@shared/ui/theme/colors';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
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

interface PasswordStrength {
  score: number; // 0..4
  label: string;
  color: string;
  checks: {
    minLength: boolean;
    hasUpper: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
  };
}

function evaluatePasswordStrength(password: string): PasswordStrength {
  const checks = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  if (password.length === 0) {
    return { score: 0, label: 'Ingresa tu clave', color: Colors.textSecondary, checks };
  }
  if (score <= 1) {
    return { score: 1, label: 'Débil', color: Colors.danger, checks };
  }
  if (score === 2) {
    return { score: 2, label: 'Regular', color: Colors.warning, checks };
  }
  if (score === 3) {
    return { score: 3, label: 'Buena', color: Colors.primaryMedium, checks };
  }
  return { score: 4, label: 'Fuerte', color: Colors.success, checks };
}

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

  const watchedPassword = watch('newPassword');
  const strength = useMemo(
    () => evaluatePasswordStrength(watchedPassword ?? ''),
    [watchedPassword],
  );

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

  const criteriaList = [
    { key: 'minLength', label: 'Mínimo 8 caracteres', met: strength.checks.minLength },
    { key: 'hasUpper', label: 'Al menos 1 letra mayúscula', met: strength.checks.hasUpper },
    { key: 'hasNumber', label: 'Al menos 1 número', met: strength.checks.hasNumber },
    { key: 'hasSymbol', label: 'Al menos 1 símbolo (recomendado)', met: strength.checks.hasSymbol },
  ];

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

              {/* Medidor de seguridad de contraseña (puro código + React Hook Form + Zod) */}
              <View style={styles.strengthBox}>
                <View style={styles.strengthHeader}>
                  <Text style={styles.strengthLabel}>Seguridad de la clave</Text>
                  <Text style={[styles.strengthValue, { color: strength.color }]}>
                    {strength.label}
                  </Text>
                </View>

                <View style={styles.barsRow}>
                  {[1, 2, 3, 4].map((segment) => (
                    <View
                      key={segment}
                      style={[
                        styles.barSegment,
                        {
                          backgroundColor:
                            strength.score >= segment ? strength.color : Colors.border,
                        },
                      ]}
                    />
                  ))}
                </View>

                <View style={styles.criteriaList}>
                  {criteriaList.map((item) => (
                    <View key={item.key} style={styles.criteriaRow}>
                      <SymbolView
                        name={
                          item.met
                            ? {
                                ios: 'checkmark.circle.fill',
                                android: 'check_circle',
                                web: 'check_circle',
                              }
                            : {
                                ios: 'circle',
                                android: 'radio_button_unchecked',
                                web: 'radio_button_unchecked',
                              }
                        }
                        size={16}
                        tintColor={item.met ? Colors.success : Colors.border}
                      />
                      <Text
                        style={[styles.criteriaText, item.met ? styles.criteriaTextMet : null]}
                      >
                        {item.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

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
  strengthBox: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 10,
    marginBottom: 18,
  },
  strengthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  strengthValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  barsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  barSegment: {
    flex: 1,
    height: 6,
    borderRadius: 4,
  },
  criteriaList: {
    gap: 6,
    marginTop: 2,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  criteriaText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  criteriaTextMet: {
    color: Colors.text,
  },
  button: {
    marginTop: 4,
  },
});
