import { zodResolver } from '@hookform/resolvers/zod';
import { AppButton } from '@shared/ui/components/AppButton';
import { AppInput } from '@shared/ui/components/AppInput';
import { Colors } from '@shared/ui/theme/colors';
import { SymbolView } from 'expo-symbols';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { z } from 'zod';

const veedorSchema = z.object({
  cedula: z.string().length(10, 'La cédula debe tener 10 dígitos.'),
  nombres: z.string().min(2, 'Ingresa los nombres.'),
  apellidos: z.string().min(2, 'Ingresa los apellidos.'),
  telefono: z.string().min(9, 'Ingresa un teléfono válido.'),
  email: z.string().email('Ingresa un correo válido.'),
});

export type VeedorFormValues = z.infer<typeof veedorSchema>;

interface CreateVeedorModalProps {
  visible: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (values: VeedorFormValues) => Promise<void>;
}

export function CreateVeedorModal({
  visible,
  isLoading,
  onClose,
  onSubmit,
}: CreateVeedorModalProps) {
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

  useEffect(() => {
    if (!visible) {
      reset();
    }
  }, [visible, reset]);

  const handleFormSubmit = async (values: VeedorFormValues) => {
    await onSubmit(values);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropDismiss} onPress={onClose} />

        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Registrar Veedor</Text>
              <Text style={styles.subtitle}>Nuevo delegado o reemplazo de mesa</Text>
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
            contentContainerStyle={styles.formContent}
          >
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
              label="Nombres"
              placeholder="Ej: Carlos Andrés"
              errorMessage={errors.nombres?.message}
            />
            <AppInput
              control={control}
              name="apellidos"
              label="Apellidos"
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

            <Text style={styles.autoPassNote}>
              Se generará una clave temporal automáticamente y se enviará a este correo junto con el
              enlace de verificación.
            </Text>

            <View style={styles.actions}>
              <AppButton
                title="Crear Veedor"
                onPress={handleSubmit(handleFormSubmit)}
                loading={isLoading}
              />
              <AppButton
                title="Cancelar"
                variant="secondary"
                onPress={onClose}
                disabled={isLoading}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 6, 36, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    maxHeight: '86%',
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
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
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryMedium,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContent: {
    paddingBottom: 6,
  },
  errorBanner: {
    backgroundColor: Colors.dangerBg,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  autoPassNote: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  actions: {
    gap: 10,
    marginTop: 6,
  },
});
