import { Colors } from '@shared/ui/theme/colors';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  BounceIn,
  BounceOutDown,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

const BACKDROP_ENTER_DURATION = 160;
const CARD_ENTER_DELAY = 70;
const CARD_ENTER_DURATION = 300;
const CARD_EXIT_DURATION = 300;
const BACKDROP_EXIT_DELAY = 80;
const BACKDROP_EXIT_DURATION = 220;
const UNMOUNT_DELAY_MS = Math.max(CARD_EXIT_DURATION, BACKDROP_EXIT_DELAY + BACKDROP_EXIT_DURATION) + 30;

const backdropEntering = FadeIn.duration(BACKDROP_ENTER_DURATION).easing(Easing.out(Easing.quad));
const backdropExiting = FadeOut.duration(BACKDROP_EXIT_DURATION).delay(BACKDROP_EXIT_DELAY);

const cardEntering = BounceIn.delay(CARD_ENTER_DELAY)
  .duration(CARD_ENTER_DURATION)
  .easing(Easing.inOut(Easing.quad));
const cardExiting = BounceOutDown.duration(CARD_EXIT_DURATION).easing(Easing.inOut(Easing.quad));

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
  const [mounted, setMounted] = useState(visible);
  const [snapshot, setSnapshot] = useState({
    type,
    title,
    message,
    buttonText,
    actionLabel,
  });

  if (visible && !mounted) {
    setMounted(true);
  }

  if (
    visible &&
    (snapshot.type !== type ||
      snapshot.title !== title ||
      snapshot.message !== message ||
      snapshot.buttonText !== buttonText ||
      snapshot.actionLabel !== actionLabel)
  ) {
    setSnapshot({ type, title, message, buttonText, actionLabel });
  }

  useEffect(() => {
    if (visible) return;

    const timer = setTimeout(() => {
      setMounted(false);
    }, UNMOUNT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [visible]);

  if (!mounted) return null;

  const active = visible ? { type, title, message, buttonText, actionLabel } : snapshot;
  const cfg = VARIANT_CONFIG[active.type];
  const hasAction = Boolean(active.actionLabel && onAction);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {visible ? (
          <Animated.View
            entering={backdropEntering}
            exiting={backdropExiting}
            style={styles.backdropOverlay}
          >
            <Pressable style={styles.backdropDismiss} onPress={onClose} />
          </Animated.View>
        ) : null}

        {visible ? (
          <Animated.View entering={cardEntering} exiting={cardExiting} style={styles.card}>
            <View style={[styles.topStrip, { backgroundColor: cfg.iconColor }]} />

            <View style={styles.cardBody}>
              <View style={styles.titleRow}>
                <SymbolView name={cfg.icon} size={22} tintColor={cfg.iconColor} />
                <Text style={styles.title}>{active.title ?? cfg.defaultTitle}</Text>
              </View>

              <Text style={styles.message}>{active.message}</Text>

              <View style={styles.buttonsWrap}>
                {hasAction ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onAction}
                    style={[styles.button, { backgroundColor: Colors.primary }]}
                  >
                    <Text style={styles.buttonText}>{active.actionLabel}</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={onClose}
                  style={[
                    styles.button,
                    hasAction ? styles.secondaryButton : { backgroundColor: cfg.btnBg },
                  ]}
                >
                  <Text
                    style={[styles.buttonText, hasAction ? styles.secondaryButtonText : null]}
                  >
                    {active.buttonText ?? (hasAction ? 'Cerrar' : cfg.defaultButton)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  backdropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(28, 6, 36, 0.52)',
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
