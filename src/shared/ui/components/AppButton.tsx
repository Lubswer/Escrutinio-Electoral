import { Colors } from '@shared/ui/theme/colors';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
}

export function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}: AppButtonProps) {
  const isBlocked = loading || disabled;

  const backgroundColor =
    variant === 'danger'
      ? Colors.danger
      : variant === 'secondary'
        ? Colors.surface
        : Colors.accent;

  const textColor = variant === 'secondary' ? Colors.primary : Colors.primaryDark;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={isBlocked}
      style={[
        styles.button,
        { backgroundColor },
        variant === 'secondary' ? styles.secondaryBorder : null,
        isBlocked ? styles.disabled : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBorder: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
});
