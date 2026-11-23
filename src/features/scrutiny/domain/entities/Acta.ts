export type Dignidad = 'alcalde' | 'prefecto';

export type ActaSyncStatus = 'pendiente_envio' | 'enviando' | 'guardado' | 'fallido';

export interface Candidato {
  id: string;
  organizacionId: string;
  listaNumero: string;
  organizacionNombre: string;
  siglas: string;
  colorHex: string;
  dignidad: Dignidad;
  nombreCompleto: string;
}

export interface VotoCandidato {
  candidatoId: string;
  votos: number;
}

export interface Acta {
  id?: string;
  jrvId: string;
  dignidad: Dignidad;
  totalSufragantes: number;
  votosBlancos: number;
  votosNulos: number;
  votosPorCandidato: VotoCandidato[];
  fotoPath: string;
  fotoNitidezScore: number | null;
  latitud: number;
  longitud: number;
  ubicacionTimestamp: string;
  ubicacionVerificada: boolean;
  version: number;
  registradoPor: string;
  corregidoPor?: string | null;
  updatedAt?: string;
  syncStatus: ActaSyncStatus;
  syncError?: string;
}

export interface SaveActaInput {
  actaId?: string;
  jrvId: string;
  dignidad: Dignidad;
  totalSufragantes: number;
  votosBlancos: number;
  votosNulos: number;
  votosPorCandidato: VotoCandidato[];
  localPhotoUri: string;
  fotoNitidezScore: number | null;
  latitud: number;
  longitud: number;
  ubicacionTimestamp: string;
  ubicacionVerificada: boolean;
  expectedVersion: number;
  userId: string;
}
