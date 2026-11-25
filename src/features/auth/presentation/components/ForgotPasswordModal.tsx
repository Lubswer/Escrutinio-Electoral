import { PasswordStrengthGuide } from '@features/auth/presentation/components/PasswordStrengthGuide';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatedModal } from '@shared/ui/components/AnimatedModal';
import { AppButton } from '@shared/ui/components/AppButton';
import { AppInput } from '@shared/ui/components/AppInput';
import { Colors } from '@shared/ui/theme/colors';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { z } from 'zod';

const emailStepSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido.'),
});

const otpStepSchema = z
  .object({
    token: z.string().min(8, 'Ingresa el código de 8 dígitos de tu correo.'),
    newPassword: z
      .string()
      .min(8, 'Mínimo 8 caracteres.')
      .regex(/[A-Z]/, 'Incluye al menos una mayúscula.')
      .regex(/[0-9]/, 'Incluye al menos un número.'),
    confirmPassword: z.string().min(8, 'Confirma tu nueva contraseña.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  });

type EmailStepValues = z.infer<typeof emailStepSchema>;
type OtpStepValues = z.infer<typeof otpStepSchema>;

interface ForgotPasswordModalProps {
  visible: boolean;
  isSendingEmail: boolean;
  isResetting: boolean;
  onClose: () => void;
  onSubmitEmail: (email: string) => Promise<void>;
  onResetWithOtp: (input: {
    email: string;
    token: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void>;
}

export function ForgotPasswordModal({
  visible,
  isSendingEmail,
  isResetting,
  onClose,
  onSubmitEmail,
  onResetWithOtp,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<'email' | 'otp' | 'done'>('email');
  const [targetEmail, setTargetEmail] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const emailForm = useForm<EmailStepValues>({
    resolver: zodResolver(emailStepSchema),
    defaultValues: { email: '' },
  });

  const otpForm = useForm<OtpStepValues>({
    resolver: zodResolver(otpStepSchema),
    defaultValues: { token: '', newPassword: '', confirmPassword: '' },
  });

  const watchedNewPassword = otpForm.watch('newPassword') ?? '';

  useEffect(() => {
    if (!visible) {
      setStep('email');
      setTargetEmail('');
      setLocalError(null);
      emailForm.reset();
      otpForm.reset();
    }
  }, [visible, emailForm, otpForm]);

  const handleSendCode = async (values: EmailStepValues) => {
    try {
      setLocalError(null);
      await onSubmitEmail(values.email);
      setTargetEmail(values.email.trim().toLowerCase());
      setStep('otp');
    } catch (err: any) {
      setLocalError(err?.message ?? 'No se pudo enviar el código de recuperación.');
    }
  };

  const handleResetPassword = async (values: OtpStepValues) => {
    try {
      setLocalError(null);
      await onResetWithOtp({
        email: targetEmail,
        token: values.token,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      });
      setStep('done');
    } catch (err: any) {
      setLocalError(err?.message ?? 'No se pudo actualizar tu contraseña.');
    }
  };

  return (
    <AnimatedModal
      visible={visible}
      onClose={onClose}
      keyboardAvoiding
      contentStyle={styles.modalCard}
    >
      <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Recuperar contraseña</Text>
              <Text style={styles.subtitle}>
                {step === 'email'
                  ? 'Te enviaremos un código de 8 dígitos a tu correo'
                  : step === 'otp'
                    ? `Código enviado a ${targetEmail}`
                    : 'Tu acceso fue actualizado'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={styles.closeBtn}
              accessibilityLabel="Cerrar modal"
            >
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={18}
                tintColor={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {localError ? (
              <View style={styles.statusRow}>
                <SymbolView
                  name={{ ios: 'exclamationmark.triangle.fill', android: 'error', web: 'error' }}
                  size={18}
                  tintColor={Colors.danger}
                />
                <Text style={styles.errorText}>{localError}</Text>
              </View>
            ) : null}

            {step === 'email' ? (
              <View style={styles.formBlock}>
                <AppInput
                  control={emailForm.control}
                  name="email"
                  label="Correo electrónico"
                  placeholder="Ej: usuario@correo.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  errorMessage={emailForm.formState.errors.email?.message}
                />

                <View style={styles.actions}>
                  <AppButton
                    title="Enviar código"
                    onPress={emailForm.handleSubmit(handleSendCode)}
                    loading={isSendingEmail}
                  />
                  <AppButton
                    title="Cancelar"
                    variant="secondary"
                    onPress={onClose}
                    disabled={isSendingEmail}
                  />
                </View>
              </View>
            ) : step === 'otp' ? (
              <View style={styles.formBlock}>
                <AppInput
                  control={otpForm.control}
                  name="token"
                  label="Código de verificación (8 dígitos)"
                  placeholder="Ej: 48291035"
                  keyboardType="numeric"
                  maxLength={8}
                  errorMessage={otpForm.formState.errors.token?.message}
                />
                <AppInput
                  control={otpForm.control}
                  name="newPassword"
                  label="Nueva contraseña"
                  placeholder="Mín. 8 chars, 1 mayúscula y 1 número"
                  secureTextEntry
                  errorMessage={otpForm.formState.errors.newPassword?.message}
                />
                <PasswordStrengthGuide password={watchedNewPassword} compact />
                <AppInput
                  control={otpForm.control}
                  name="confirmPassword"
                  label="Confirmar nueva contraseña"
                  placeholder="Repite tu nueva contraseña"
                  secureTextEntry
                  errorMessage={otpForm.formState.errors.confirmPassword?.message}
                />

                <View style={styles.actions}>
                  <AppButton
                    title="Cambiar contraseña"
                    onPress={otpForm.handleSubmit(handleResetPassword)}
                    loading={isResetting}
                  />
                  <AppButton
                    title="Volver atrás"
                    variant="secondary"
                    onPress={() => {
                      setLocalError(null);
                      setStep('email');
                    }}
                    disabled={isResetting}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.sentBlock}>
                <View style={styles.statusRow}>
                  <SymbolView
                    name={{
                      ios: 'checkmark.circle.fill',
                      android: 'check_circle',
                      web: 'check_circle',
                    }}
                    size={20}
                    tintColor={Colors.success}
                  />
                  <Text style={styles.successText}>
                    Contraseña restablecida correctamente. Ya puedes iniciar sesión con tu nueva
                    clave.
                  </Text>
                </View>
                <AppButton title="Ir al inicio de sesión" onPress={onClose} />
              </View>
            )}
          </ScrollView>
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 6, 36, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  backdropDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    maxHeight: '85%',
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 4,
  },
  formBlock: {
    gap: 4,
  },
  sentBlock: {
    gap: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.danger,
    lineHeight: 19,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success,
    lineHeight: 20,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
});
