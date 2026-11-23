import { AuthError } from '@shared/domain/errors/AppError';
import { supabase, supabaseProvisioningClient } from '@shared/infrastructure/supabase/client';
import { ProvisionUserInput, UserProfile, UserRole } from '../../domain/entities/User';
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

export class SupabaseAuthRepository implements IAuthRepository {
  async login(email: string, password: string): Promise<UserProfile> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      throw new AuthError(error?.message ?? 'No se pudo iniciar sesión.', error);
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
    });

    if (authError || !userData.user) {
      throw new AuthError('No se pudo actualizar la contraseña.', authError);
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
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      throw new AuthError('No se pudo enviar el correo de recuperación.', error);
    }
  }

  async provisionSubordinate(input: ProvisionUserInput, creatorId: string): Promise<UserProfile> {
    const { data: authData, error: signUpError } = await supabaseProvisioningClient.auth.signUp({
      email: input.email,
      password: input.claveTemporal,
    });

    if (signUpError || !authData.user) {
      throw new AuthError(
        signUpError?.message ?? 'No se pudo registrar la cuenta en autenticación.',
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
