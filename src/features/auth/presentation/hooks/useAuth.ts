import { setMonitoringUser } from '@shared/infrastructure/monitoring/sentry';
import { useMutation } from '@tanstack/react-query';
import { Href, useRouter } from 'expo-router';
import { ChangeFirstPasswordUseCase } from '../../application/use-cases/ChangeFirstPasswordUseCase';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { ProvisionUserUseCase } from '../../application/use-cases/ProvisionUserUseCase';
import { RecoverPasswordUseCase } from '../../application/use-cases/RecoverPasswordUseCase';
import { ProvisionUserInput, UserProfile, UserRole } from '../../domain/entities/User';
import { SupabaseAuthRepository } from '../../infrastructure/repositories/SupabaseAuthRepository';
import { ExternalIdentityService } from '../../infrastructure/services/ExternalIdentityService';
import { useAuthStore } from '../store/authStore';

const authRepo = new SupabaseAuthRepository();
const identityService = new ExternalIdentityService();

const loginUseCase = new LoginUseCase(authRepo);
const changeFirstPasswordUseCase = new ChangeFirstPasswordUseCase(authRepo);
const recoverPasswordUseCase = new RecoverPasswordUseCase(authRepo);
const provisionUserUseCase = new ProvisionUserUseCase(authRepo, identityService);

export function getHomeRouteForRole(role: UserRole): Href {
  switch (role) {
    case 'coordinador_provincial':
      return '/(app)/coordinador-provincial' as Href;
    case 'coordinador_recinto':
      return '/(app)/coordinador-recinto' as Href;
    case 'veedor':
      return '/(app)/veedor' as Href;
  }
}

export function useAuth() {
  const { user, setUser, clearAuth } = useAuthStore();
  const router = useRouter();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginUseCase.execute(email, password),
    onSuccess: (loggedUser: UserProfile) => {
      setUser(loggedUser);
      setMonitoringUser({ id: loggedUser.id, email: loggedUser.email, rol: loggedUser.rol });

      if (loggedUser.debeCambiarClave) {
        router.replace('/(auth)/first-login-change-password' as Href);
        return;
      }

      router.replace(getHomeRouteForRole(loggedUser.rol));
    },
  });

  const changeFirstPasswordMutation = useMutation({
    mutationFn: ({
      newPassword,
      confirmPassword,
    }: {
      newPassword: string;
      confirmPassword: string;
    }) => changeFirstPasswordUseCase.execute(newPassword, confirmPassword),
    onSuccess: () => {
      if (!user) return;
      const updatedUser = { ...user, debeCambiarClave: false };
      setUser(updatedUser);
      router.replace(getHomeRouteForRole(updatedUser.rol));
    },
  });

  const recoverPasswordMutation = useMutation({
    mutationFn: (email: string) => recoverPasswordUseCase.execute(email),
  });

  const provisionUserMutation = useMutation({
    mutationFn: (input: ProvisionUserInput) => {
      if (!user) throw new Error('Sesión no iniciada.');
      return provisionUserUseCase.execute(input, user);
    },
  });

  const logout = async () => {
    try {
      await authRepo.logout();
    } finally {
      clearAuth();
      setMonitoringUser(null);
      router.replace('/(auth)/login' as Href);
    }
  };

  return {
    user,
    login: loginMutation.mutateAsync,
    logout,
    changeFirstPassword: changeFirstPasswordMutation.mutateAsync,
    recoverPassword: recoverPasswordMutation.mutateAsync,
    provisionUser: provisionUserMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isChangingPassword: changeFirstPasswordMutation.isPending,
    isRecovering: recoverPasswordMutation.isPending,
    isProvisioning: provisionUserMutation.isPending,
    loginError: loginMutation.error?.message ?? null,
    changePasswordError: changeFirstPasswordMutation.error?.message ?? null,
    recoverError: recoverPasswordMutation.error?.message ?? null,
    provisionError: provisionUserMutation.error?.message ?? null,
  };
}
