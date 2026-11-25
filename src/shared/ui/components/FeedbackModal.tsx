import { Colors } from '@shared/ui/theme/colors';
import { SymbolView } from 'expo-symbols';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

export type FeedbackType = 'info' | 'error' | 'success';

interface FeedbackModalProps {
  visible: boolean;
  type: FeedbackType;
  title?: string;
  message: string;
  buttonText?: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose: () => void;
}

const VARIANT_CONFIG = {
  info: {
    defaultTitle: 'Información',
    defaultButton: 'Entendido',
    iconColor: Colors.primary,
    iconBg: Colors.primaryLight,
    btnBg: Colors.primary,
    icon: { ios: 'info.circle.fill', android: 'info', web: 'info' } as const,
  },
  error: {
    defaultTitle: 'Algo requiere atención',
    defaultButton: 'Revisar',
    iconColor: Colors.danger,
    iconBg: Colors.dangerBg,
    btnBg: Colors.danger,
    icon: { ios: 'exclamationmark.triangle.fill', android: 'error', web: 'error' } as const,
  },
  success: {
    defaultTitle: '¡Listo!',
    defaultButton: 'Continuar',
    iconColor: Colors.success,
    iconBg: Colors.successBg,
    btnBg: Colors.primary,
    icon: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' } as const,
  },
};

export function FeedbackModal({
  visible,
  type,
  title,
  message,
  buttonText,
  actionLabel,
  onAction,
  onClose,
}: FeedbackModalProps) {
  const cfg = VARIANT_CONFIG[type];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropDismiss} onPress={onClose} />

        <Animated.View entering={ZoomIn.duration(220)} style={styles.card}>
          <View style={[styles.topStrip, { backgroundColor: cfg.iconColor }]} />

          <View style={styles.cardBody}>
            <View style={styles.titleRow}>
              <SymbolView name={cfg.icon} size={22} tintColor={cfg.iconColor} />
              <Text style={styles.title}>{title ?? cfg.defaultTitle}</Text>
            </View>

            <Text style={styles.message}>{message}</Text>

            <View style={styles.buttonsWrap}>
              {actionLabel && onAction ? (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={onAction}
                  style={[styles.button, { backgroundColor: Colors.primary }]}
                >
                  <Text style={styles.buttonText}>{actionLabel}</Text>
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onClose}
                style={[
                  styles.button,
                  actionLabel && onAction ? styles.secondaryButton : { backgroundColor: cfg.btnBg },
                ]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    actionLabel && onAction ? styles.secondaryButtonText : null,
                  ]}
                >
                  {buttonText ?? (actionLabel && onAction ? 'Cerrar' : cfg.defaultButton)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(28, 6, 36, 0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  backdropDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 12,
  },
  topStrip: {
    height: 5,
    width: '100%',
  },
  cardBody: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '900',
    color: Colors.text,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  buttonsWrap: {
    width: '100%',
    gap: 8,
  },
  button: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButtonText: {
    color: Colors.textSecondary,
  },
});
