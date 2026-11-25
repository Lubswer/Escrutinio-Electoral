import { ReactNode, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  StretchInX,
  StretchOutY,
} from 'react-native-reanimated';

const BACKDROP_ENTER_DURATION = 180;
const CARD_ENTER_DELAY = 90;
const CARD_ENTER_DURATION = 360;
const CARD_EXIT_DURATION = 280;
const BACKDROP_EXIT_DELAY = 60;
const BACKDROP_EXIT_DURATION = 240;
const UNMOUNT_DELAY_MS = BACKDROP_EXIT_DELAY + BACKDROP_EXIT_DURATION + 20;

const backdropEntering = FadeIn.duration(BACKDROP_ENTER_DURATION).easing(Easing.out(Easing.quad));
const backdropExiting = FadeOut.duration(BACKDROP_EXIT_DURATION).delay(BACKDROP_EXIT_DELAY);

const modalEntering = StretchInX.delay(CARD_ENTER_DELAY)
  .duration(CARD_ENTER_DURATION)
  .easing(Easing.out(Easing.cubic));
const modalExiting = StretchOutY.duration(CARD_EXIT_DURATION).easing(Easing.inOut(Easing.quad));

interface AnimatedModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  keyboardAvoiding?: boolean;
  backdropStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  overlayContent?: ReactNode;
}

export function AnimatedModal({
  visible,
  onClose,
  children,
  keyboardAvoiding = false,
  backdropStyle,
  contentStyle,
  overlayContent,
}: AnimatedModalProps) {
  const [mounted, setMounted] = useState(visible);

  if (visible && !mounted) {
    setMounted(true);
  }

  useEffect(() => {
    if (visible) return;

    const timer = setTimeout(() => {
      setMounted(false);
    }, UNMOUNT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [visible]);

  if (!mounted) return null;

  const innerContent = (
    <>
      {visible ? (
        <Animated.View
          entering={backdropEntering}
          exiting={backdropExiting}
          style={[styles.backdropOverlay, backdropStyle]}
        >
          <Pressable style={styles.backdropDismiss} onPress={onClose} />
        </Animated.View>
      ) : null}

      {visible ? (
        <Animated.View entering={modalEntering} exiting={modalExiting} style={contentStyle}>
          {children}
        </Animated.View>
      ) : null}

      {visible ? overlayContent : null}
    </>
  );

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {innerContent}
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.container}>{innerContent}</View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(28, 6, 36, 0.55)',
  },
  backdropDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
