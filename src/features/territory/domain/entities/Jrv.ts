export type JrvGenero = 'Femenino' | 'Masculino' | 'Mixta';

export interface Jrv {
  id: string;
  recintoId: string;
  recintoNombre?: string | null;
  numeroMesa: number;
  genero: JrvGenero;
  veedorId: string | null;
  veedorNombre: string | null;
}

export interface CreateJrvInput {
  recintoId: string;
  numeroMesa: number;
  genero: JrvGenero;
}

export interface VeedorSummary {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
}
