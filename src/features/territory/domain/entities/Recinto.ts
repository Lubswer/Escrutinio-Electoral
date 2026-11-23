export interface Recinto {
  id: string;
  provincia: string;
  canton: string;
  parroquia: string;
  nombre: string;
  direccion: string | null;
  coordinadorNombre?: string | null;
  coordinadorId?: string | null;
  totalJrvs?: number;
}

export interface CreateRecintoInput {
  parroquia: string;
  nombre: string;
  direccion?: string;
}
