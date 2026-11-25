export type UserRole = 'coordinador_provincial' | 'coordinador_recinto' | 'veedor';

export interface UserProfile {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  rol: UserRole;
  recintoId: string | null;
  debeCambiarClave: boolean;
  emailVerificado: boolean;
  activo: boolean;
}

export interface CreateSubordinateUserInput {
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  rol: Exclude<UserRole, 'coordinador_provincial'>;
  recintoId: string;
  claveTemporal?: string;
}
