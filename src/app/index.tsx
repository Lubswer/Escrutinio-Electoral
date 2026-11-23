import { getHomeRouteForRole } from '@features/auth/presentation/hooks/useAuth';
import { useAuthStore } from '@features/auth/presentation/store/authStore';
import { Colors } from '@shared/ui/theme/colors';
import { Href, Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

export default function Index() {
  const { user, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.text}>Cargando sesión...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href={'/(auth)/login' as Href} />;
  }

  if (user.debeCambiarClave) {
    return <Redirect href={'/(auth)/first-login-change-password' as Href} />;
  }

  return <Redirect href={getHomeRouteForRole(user.rol)} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
