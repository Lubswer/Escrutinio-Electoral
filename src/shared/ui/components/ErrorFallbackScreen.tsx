import { AppButton } from '@shared/ui/components/AppButton';
import { Colors } from '@shared/ui/theme/colors';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

interface ErrorFallbackScreenProps {
  onRetry: () => void;
}

export function ErrorFallbackScreen({ onRetry }: ErrorFallbackScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <SymbolView
            name={{ ios: 'exclamationmark.triangle.fill', android: 'error', web: 'error' }}
            size={24}
            tintColor={Colors.danger}
          />
          <Text style={styles.title}>Algo salió mal</Text>
        </View>
        <Text style={styles.message}>
          Ocurrió un error inesperado, pero tu sesión y datos locales están a salvo. Ya enviamos el
          reporte automáticamente para su revisión.
        </Text>
        <AppButton title="Reintentar" onPress={onRetry} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: '900',
    color: Colors.text,
  },
  message: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 21,
  },
});
