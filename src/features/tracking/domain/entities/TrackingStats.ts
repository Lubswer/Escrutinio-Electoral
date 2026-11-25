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

export interface ResumenVotos {
  votosValidos: number;
  votosBlancos: number;
  votosNulos: number;
  totalSufragantes: number;
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

export interface SentryIssueSummary {
  id: string;
  title: string;
  culprit: string;
  screen: string;
  deviceModel: string;
  osVersion: string;
  affectedUser: string;
  location: string | null;
  level: string;
  status: string;
  count: number;
  userCount: number;
  lastSeen: string;
  permalink: string;
}
