import { useAuthStore } from '@features/auth/presentation/store/authStore';
import { Href, Redirect, Stack } from 'expo-router';

export default function ProtectedAppLayout() {
  const { user, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return null;
  }

  if (!user) {
    return <Redirect href={'/(auth)/login' as Href} />;
  }

  if (user.debeCambiarClave) {
    return <Redirect href={'/(auth)/first-login-change-password' as Href} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
