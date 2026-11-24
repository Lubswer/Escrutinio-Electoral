import { setMonitoringUser } from '@shared/infrastructure/monitoring/sentry';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Href, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ChangeFirstPasswordUseCase } from '../../application/use-cases/ChangeFirstPasswordUseCase';
import { CreateSubordinateUserUseCase } from '../../application/use-cases/CreateSubordinateUserUseCase';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { RecoverPasswordUseCase } from '../../application/use-cases/RecoverPasswordUseCase';
import { CreateSubordinateUserInput, UserProfile, UserRole } from '../../domain/entities/User';
import { SupabaseAuthRepository } from '../../infrastructure/repositories/SupabaseAuthRepository';
import { ExternalIdentityService } from '../../infrastructure/services/ExternalIdentityService';
import { useAuthStore } from '../store/authStore';

const authRepo = new SupabaseAuthRepository();
const identityService = new ExternalIdentityService();

const loginUseCase = new LoginUseCase(authRepo);
const changeFirstPasswordUseCase = new ChangeFirstPasswordUseCase(authRepo);
const recoverPasswordUseCase = new RecoverPasswordUseCase(authRepo);
const createSubordinateUserUseCase = new CreateSubordinateUserUseCase(authRepo, identityService);

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

/**
 * Restaura la sesión activa al iniciar la app sin exponer SupabaseAuthRepository a src/app/_layout.tsx.
 */
export function useAuthBootstrap() {
  const { setUser, setInitialized } = useAuthStore();

  useEffect(() => {
    authRepo
      .getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          setMonitoringUser({
            id: currentUser.id,
            email: currentUser.email,
            rol: currentUser.rol,
          });
        }
      })
      .finally(() => {
        setInitialized(true);
      });
  }, [setInitialized, setUser]);
}

export function useAuth() {
  const { user, setUser, clearAuth } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

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

  const createSubordinateUserMutation = useMutation({
    mutationFn: (input: CreateSubordinateUserInput) => {
      if (!user) throw new Error('Sesión no iniciada.');
      return createSubordinateUserUseCase.execute(input, user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['territory'] });
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
    createSubordinateUser: createSubordinateUserMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isChangingPassword: changeFirstPasswordMutation.isPending,
    isRecovering: recoverPasswordMutation.isPending,
    isCreatingUser: createSubordinateUserMutation.isPending,
    loginError: loginMutation.error?.message ?? null,
    changePasswordError: changeFirstPasswordMutation.error?.message ?? null,
    recoverError: recoverPasswordMutation.error?.message ?? null,
    createUserError: createSubordinateUserMutation.error?.message ?? null,
  };
}
