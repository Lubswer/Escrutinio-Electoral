import { AppError, ConflictError, NetworkError } from '@shared/domain/errors/AppError';
import { captureAppError } from '@shared/infrastructure/monitoring/sentry';
import { supabase } from '@shared/infrastructure/supabase/client';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import { Acta, Candidato, Dignidad, SaveActaInput } from '../../domain/entities/Acta';
import { IActaRepository } from '../../domain/repositories/IActaRepository';

function isNetworkFailure(error: unknown): boolean {
  const msg = String((error as { message?: string })?.message ?? error).toLowerCase();
  return (
    msg.includes('network request failed') ||
    msg.includes('failed to fetch') ||
    msg.includes('timeout') ||
    msg.includes('offline')
  );
}

async function readLocalPhotoBytes(uri: string): Promise<Uint8Array> {
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer);
  }
  const file = new File(uri);
  return file.bytes();
}

export class SupabaseActaRepository implements IActaRepository {
  async getCandidatos(dignidad?: Dignidad): Promise<Candidato[]> {
    let query = supabase
      .from('candidatos')
      .select(
        'id, dignidad, nombre_completo, organizacion_id, organizaciones_politicas(lista_numero, nombre, siglas, color_hex)',
      );

    if (dignidad) {
      query = query.eq('dignidad', dignidad);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError('No se pudieron cargar los candidatos.', 'UNKNOWN_ERROR', error);
    }

    return (data ?? [])
      .map((row) => {
        const org = Array.isArray(row.organizaciones_politicas)
          ? row.organizaciones_politicas[0]
          : row.organizaciones_politicas;
        return {
          id: row.id,
          organizacionId: row.organizacion_id,
          listaNumero: org?.lista_numero ?? '',
          organizacionNombre: org?.nombre ?? '',
          siglas: org?.siglas ?? '',
          colorHex: org?.color_hex ?? '#1E3A8A',
          dignidad: row.dignidad as Dignidad,
          nombreCompleto: row.nombre_completo,
        };
      })
      .sort((a, b) => Number(a.listaNumero) - Number(b.listaNumero));
  }

  async getActasByJrv(jrvId: string): Promise<Acta[]> {
    const { data, error } = await supabase
      .from('actas')
      .select('*, acta_votos(candidato_id, votos)')
      .eq('jrv_id', jrvId);

    if (error || !data) {
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      jrvId: row.jrv_id,
      dignidad: row.dignidad as Dignidad,
      totalSufragantes: row.total_sufragantes,
      votosBlancos: row.votos_blancos,
      votosNulos: row.votos_nulos,
      votosPorCandidato: (row.acta_votos ?? []).map(
        (v: { candidato_id: string; votos: number }) => ({
          candidatoId: v.candidato_id,
          votos: v.votos,
        }),
      ),
      fotoPath: row.foto_path,
      fotoNitidezScore: row.foto_nitidez_score,
      latitud: row.latitud,
      longitud: row.longitud,
      ubicacionTimestamp: row.ubicacion_timestamp,
      ubicacionVerificada: row.ubicacion_verificada,
      version: row.version,
      registradoPor: row.registrado_por,
      corregidoPor: row.corregido_por,
      updatedAt: row.updated_at,
      syncStatus: 'guardado',
    }));
  }

  private async uploadPhotoIfLocal(input: SaveActaInput): Promise<string> {
    if (!input.localPhotoUri.startsWith('file://') && !input.localPhotoUri.startsWith('blob:')) {
      return input.localPhotoUri;
    }

    const bytes = await readLocalPhotoBytes(input.localPhotoUri);
    const storagePath = `${input.jrvId}/${input.dignidad}_${Date.now()}.jpg`;

    const { error } = await supabase.storage.from('actas-fotos').upload(storagePath, bytes, {
      contentType: 'image/jpeg',
      upsert: true,
    });

    if (error) {
      if (isNetworkFailure(error)) {
        throw new NetworkError('Sin conexión al subir la fotografía del acta.', error);
      }
      throw new AppError(`Error al subir fotografía: ${error.message}`, 'UNKNOWN_ERROR', error);
    }

    return storagePath;
  }

  async saveActa(input: SaveActaInput): Promise<Acta> {
    try {
      const fotoPath = await this.uploadPhotoIfLocal(input);
      let savedId = input.actaId;
      let savedVersion = 1;

      if (input.actaId) {
        const nextVersion = input.expectedVersion + 1;
        const { data, error } = await supabase
          .from('actas')
          .update({
            total_sufragantes: input.totalSufragantes,
            votos_blancos: input.votosBlancos,
            votos_nulos: input.votosNulos,
            foto_path: fotoPath,
            foto_nitidez_score: input.fotoNitidezScore,
            latitud: input.latitud,
            longitud: input.longitud,
            ubicacion_timestamp: input.ubicacionTimestamp,
            ubicacion_verificada: input.ubicacionVerificada,
            version: nextVersion,
            corregido_por: input.userId,
          })
          .eq('id', input.actaId)
          .select('id, version')
          .single();

        if (error) {
          if (error.message?.includes('CONFLICTO_VERSION')) {
            throw new ConflictError();
          }
          if (isNetworkFailure(error)) {
            throw new NetworkError(undefined, error);
          }
          throw new AppError(`No se pudo corregir el acta: ${error.message}`, 'UNKNOWN_ERROR', error);
        }

        savedId = data.id;
        savedVersion = data.version;
      } else {
        const { data, error } = await supabase
          .from('actas')
          .upsert(
            {
              jrv_id: input.jrvId,
              dignidad: input.dignidad,
              total_sufragantes: input.totalSufragantes,
              votos_blancos: input.votosBlancos,
              votos_nulos: input.votosNulos,
              foto_path: fotoPath,
              foto_nitidez_score: input.fotoNitidezScore,
              latitud: input.latitud,
              longitud: input.longitud,
              ubicacion_timestamp: input.ubicacionTimestamp,
              ubicacion_verificada: input.ubicacionVerificada,
              version: 1,
              registrado_por: input.userId,
            },
            { onConflict: 'jrv_id,dignidad' },
          )
          .select('id, version')
          .single();

        if (error || !data) {
          if (isNetworkFailure(error)) {
            throw new NetworkError(undefined, error);
          }
          throw new AppError(
            `No se pudo guardar el acta: ${error?.message ?? 'error desconocido'}`,
            'UNKNOWN_ERROR',
            error,
          );
        }

        savedId = data.id;
        savedVersion = data.version;
      }

      const votosRows = input.votosPorCandidato.map((v) => ({
        acta_id: savedId,
        candidato_id: v.candidatoId,
        votos: v.votos,
      }));

      const { error: votosError } = await supabase
        .from('acta_votos')
        .upsert(votosRows, { onConflict: 'acta_id,candidato_id' });

      if (votosError) {
        if (isNetworkFailure(votosError)) {
          throw new NetworkError(undefined, votosError);
        }
        throw new AppError(
          `El acta se creó pero falló el detalle de votos: ${votosError.message}`,
          'UNKNOWN_ERROR',
          votosError,
        );
      }

      return {
        id: savedId,
        jrvId: input.jrvId,
        dignidad: input.dignidad,
        totalSufragantes: input.totalSufragantes,
        votosBlancos: input.votosBlancos,
        votosNulos: input.votosNulos,
        votosPorCandidato: input.votosPorCandidato,
        fotoPath,
        fotoNitidezScore: input.fotoNitidezScore,
        latitud: input.latitud,
        longitud: input.longitud,
        ubicacionTimestamp: input.ubicacionTimestamp,
        ubicacionVerificada: input.ubicacionVerificada,
        version: savedVersion,
        registradoPor: input.userId,
        syncStatus: 'guardado',
      };
    } catch (error) {
      if (isNetworkFailure(error) && !(error instanceof NetworkError)) {
        throw new NetworkError(undefined, error);
      }
      captureAppError(error, {
        action: 'SupabaseActaRepository.saveActa',
        jrvId: input.jrvId,
        dignidad: input.dignidad,
      });
      throw error;
    }
  }
}
