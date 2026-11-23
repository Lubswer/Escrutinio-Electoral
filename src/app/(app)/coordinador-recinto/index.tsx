import { useAuth } from '@features/auth/presentation/hooks/useAuth';
import { AppButton } from '@shared/ui/components/AppButton';
import { Colors } from '@shared/ui/theme/colors';
import { StyleSheet, Text, View } from 'react-native';

export default function CoordinadorRecintoHomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.role}>COORDINADOR DE RECINTO</Text>
      <Text style={styles.name}>
        {user?.nombres} {user?.apellidos}
      </Text>
      <Text style={styles.info}>
        Aquí gestionarás tus veedores, asignaciones de mesa y corrección de actas de tu recinto.
      </Text>
      <AppButton title="Cerrar sesión" variant="danger" onPress={logout} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  role: { fontSize: 13, fontWeight: '700', color: Colors.primary, marginBottom: 6 },
  name: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  info: { fontSize: 15, color: Colors.textSecondary, marginBottom: 24 },
  button: { marginTop: 8 },
});
