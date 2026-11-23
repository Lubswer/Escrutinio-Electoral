export type TrackingDignidad = 'alcalde' | 'prefecto';

export interface AvanceRecinto {
  recintoId: string;
  parroquia: string;
  recintoNombre: string;
  totalJrvs: number;
  jrvsCompletas: number;
  jrvsPendientes: number;
}

export interface ResultadoCandidato {
  candidatoId: string;
  candidatoNombre: string;
  dignidad: TrackingDignidad;
  listaNumero: string;
  siglas: string;
  colorHex: string;
  totalVotos: number;
}

export interface ActaOrigenEvidencia {
  actaId: string;
  dignidad: TrackingDignidad;
  recintoNombre: string;
  numeroMesa: number;
  generoMesa: string;
  latitud: number;
  longitud: number;
  ubicacionVerificada: boolean;
  ubicacionTimestamp: string;
  registradoPorNombre: string;
  updatedAt: string;
}
