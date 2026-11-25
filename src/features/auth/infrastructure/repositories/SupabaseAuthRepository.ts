import { AuthError } from '@shared/domain/errors/AppError';
import { supabase, supabaseNoSessionClient } from '@shared/infrastructure/supabase/client';
import * as Linking from 'expo-linking';
import { CreateSubordinateUserInput, UserProfile, UserRole } from '../../domain/entities/User';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';

interface ProfileRow {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  rol: UserRole;
  recinto_id: string | null;
  debe_cambiar_clave: boolean;
  email_verificado: boolean;
  activo: boolean;
}

function mapRowToProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    cedula: row.cedula,
    nombres: row.nombres,
    apellidos: row.apellidos,
    telefono: row.telefono,
    email: row.email,
    rol: row.rol,
    recintoId: row.recinto_id,
    debeCambiarClave: row.debe_cambiar_clave,
    emailVerificado: row.email_verificado,
    activo: row.activo,
  };
}

function translateAuthError(rawMessage?: string | null, fallback = 'Ocurrió un error de autenticación.'): string {
  const msg = (rawMessage ?? '').toLowerCase();
  if (!msg) return fallback;
  if (msg.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos. Verifica tus datos e intenta nuevamente.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Tu correo aún no ha sido confirmado. Revisa tu bandeja de entrada y abre el enlace de verificación.';
  }
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return 'Este correo electrónico ya se encuentra registrado en el sistema.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('for security purposes')) {
    return 'Se enviaron demasiadas solicitudes seguidas. Espera unos segundos e intenta nuevamente.';
  }
  if (msg.includes('invalid format') || msg.includes('invalid email')) {
    return 'El formato del correo electrónico no es válido.';
  }
  if (msg.includes('password should be at least') || msg.includes('weak password')) {
    return 'La contraseña es muy débil. Usa al menos 8 caracteres.';
  }
  if (msg.includes('new password should be different')) {
    return 'La nueva contraseña debe ser diferente a tu contraseña anterior.';
  }
  if (msg.includes('expired') || msg.includes('otp') || msg.includes('token')) {
    return 'El código de verificación es incorrecto o ya expiró. Solicita uno nuevo.';
  }
  if (msg.includes('network request failed') || msg.includes('failed to fetch')) {
    return 'Sin conexión a internet. Verifica tu señal e intenta nuevamente.';
  }
  return fallback;
}

export class SupabaseAuthRepository implements IAuthRepository {
  async login(email: string, password: string): Promise<UserProfile> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      throw new AuthError(
        translateAuthError(error?.message, 'No se pudo iniciar sesión. Intenta nuevamente.'),
        error,
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single<ProfileRow>();

    if (profileError || !profile) {
      throw new AuthError('No se encontró el perfil del usuario en el sistema.', profileError);
    }

    return mapRowToProfile(profile);
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) return null;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sessionData.session.user.id)
      .single<ProfileRow>();

    if (error || !profile) return null;
    return mapRowToProfile(profile);
  }

  async changeFirstLoginPassword(newPassword: string): Promise<void> {
    const { data: userData, error: authError } = await supabase.auth.updateUser({
      password: newPassword,
      data: { temp_password: null },
    });

    if (authError || !userData.user) {
      throw new AuthError(
        translateAuthError(authError?.message, 'No se pudo actualizar la contraseña.'),
        authError,
      );
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ debe_cambiar_clave: false })
      .eq('id', userData.user.id);

    if (profileError) {
      throw new AuthError('Se cambió la clave pero no se actualizó el estado del perfil.', profileError);
    }
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    const redirectTo = Linking.createURL('first-login-change-password');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      throw new AuthError(
        translateAuthError(error.message, 'No se pudo enviar el correo de recuperación.'),
        error,
      );
    }
  }

  async resetPasswordWithOtp(email: string, token: string, newPassword: string): Promise<void> {
    const { error: verifyError } = await supabaseNoSessionClient.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });

    if (verifyError) {
      throw new AuthError(
        translateAuthError(verifyError.message, 'El código ingresado es inválido o ya expiró.'),
        verifyError,
      );
    }

    const { error: updateError } = await supabaseNoSessionClient.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw new AuthError(
        translateAuthError(updateError.message, 'No se pudo actualizar tu contraseña.'),
        updateError,
      );
    }

    await supabaseNoSessionClient.auth.signOut();
  }

  /**
   * Procesa el deep link que devuelve Supabase al pulsar el enlace de "Restablecer contraseña"
   * en el correo (soporta tanto PKCE `?code=` como tokens `#access_token=&refresh_token=`).
   */
  async handleAuthDeepLink(url: string): Promise<UserProfile | null> {
    try {
      const hashPart = url.includes('#') ? url.split('#')[1] : '';
      const queryPart = url.includes('?') ? url.split('?')[1]?.split('#')[0] ?? '' : '';
      const hashParams = new URLSearchParams(hashPart);
      const queryParams = new URLSearchParams(queryPart);

      const code = queryParams.get('code');
      const accessToken = hashParams.get('access_token') ?? queryParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token') ?? queryParams.get('refresh_token');

      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      } else if (accessToken && refreshToken) {
        await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
      } else {
        return null;
      }

      const profile = await this.getCurrentUser();
      if (!profile) return null;

      const type = hashParams.get('type') ?? queryParams.get('type');
      if (type === 'recovery' || url.includes('first-login-change-password')) {
        return { ...profile, debeCambiarClave: true };
      }

      return profile;
    } catch {
      return null;
    }
  }

  async createSubordinateUser(
    input: CreateSubordinateUserInput,
    creatorId: string,
  ): Promise<UserProfile> {
    if (!input.claveTemporal) {
      throw new AuthError('No se generó la clave temporal de acceso.');
    }

    const rolLabel =
      input.rol === 'coordinador_recinto' ? 'Coordinador de Recinto' : 'Veedor de Mesa';
    const emailRedirectTo = Linking.createURL('login');

    const { data: authData, error: signUpError } = await supabaseNoSessionClient.auth.signUp({
      email: input.email,
      password: input.claveTemporal,
      options: {
        emailRedirectTo,
        data: {
          temp_password: input.claveTemporal,
          nombres: input.nombres,
          rol: rolLabel,
        },
      },
    });

    if (signUpError || !authData.user) {
      throw new AuthError(
        translateAuthError(
          signUpError?.message,
          'No se pudo registrar la cuenta en autenticación.',
        ),
        signUpError,
      );
    }

    const { data: profile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        cedula: input.cedula,
        nombres: input.nombres,
        apellidos: input.apellidos,
        telefono: input.telefono,
        email: input.email,
        rol: input.rol,
        recinto_id: input.recintoId,
        creado_por: creatorId,
        debe_cambiar_clave: true,
        email_verificado: Boolean(authData.user.email_confirmed_at),
      })
      .select('*')
      .single<ProfileRow>();

    if (insertError || !profile) {
      throw new AuthError(
        'La cuenta de acceso se creó pero falló el registro del perfil (revisa si la cédula o recinto ya tienen asignación).',
        insertError,
      );
    }

    return mapRowToProfile(profile);
  }
}
