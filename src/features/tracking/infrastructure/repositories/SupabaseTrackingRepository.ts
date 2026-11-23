import { AppError } from '@shared/domain/errors/AppError';
import { supabase } from '@shared/infrastructure/supabase/client';
import {
  ActaOrigenEvidencia,
  AvanceRecinto,
  ResultadoCandidato,
  TrackingDignidad,
} from '../../domain/entities/TrackingStats';
import { ITrackingRepository } from '../../domain/repositories/ITrackingRepository';

export class SupabaseTrackingRepository implements ITrackingRepository {
  async getAvanceRecintos(): Promise<AvanceRecinto[]> {
    const { data, error } = await supabase
      .from('v_avance_recintos')
      .select('*')
      .order('parroquia', { ascending: true })
      .order('recinto_nombre', { ascending: true });

    if (error) {
      throw new AppError('No se pudo cargar el avance por recintos.', 'UNKNOWN_ERROR', error);
    }

    return (data ?? []).map((row) => ({
      recintoId: row.recinto_id,
      parroquia: row.parroquia,
      recintoNombre: row.recinto_nombre,
      totalJrvs: Number(row.total_jrvs ?? 0),
      jrvsCompletas: Number(row.jrvs_completas ?? 0),
      jrvsPendientes: Number(row.jrvs_pendientes ?? 0),
    }));
  }

  async getExitPollResultados(
    dignidad: TrackingDignidad,
    recintoId?: string | null,
  ): Promise<ResultadoCandidato[]> {
    let query = supabase
      .from('v_exit_poll_resultados')
      .select('*')
      .eq('dignidad', dignidad);

    if (recintoId) {
      query = query.eq('recinto_id', recintoId);
    }

    const { data, error } = await query;

    if (error) {
      throw new AppError('No se pudieron cargar los resultados del Exit Poll.', 'UNKNOWN_ERROR', error);
    }

    // Agrupar votos por candidato si se consulta el total cantonal (todos los recintos)
    const grouped = new Map<string, ResultadoCandidato>();
    for (const row of data ?? []) {
      const existing = grouped.get(row.candidato_id);
      const votos = Number(row.total_votos ?? 0);
      if (existing) {
        existing.totalVotos += votos;
      } else {
        grouped.set(row.candidato_id, {
          candidatoId: row.candidato_id,
          candidatoNombre: row.candidato_nombre,
          dignidad: row.dignidad as TrackingDignidad,
          listaNumero: row.lista_numero,
          siglas: row.siglas,
          colorHex: row.color_hex,
          totalVotos: votos,
        });
      }
    }

    return Array.from(grouped.values()).sort((a, b) => b.totalVotos - a.totalVotos);
  }

  async getActasOrigen(): Promise<ActaOrigenEvidencia[]> {
    const { data, error } = await supabase
      .from('actas')
      .select(
        `
        id,
        dignidad,
        latitud,
        longitud,
        ubicacion_verificada,
        ubicacion_timestamp,
        updated_at,
        jrvs (
          numero_mesa,
          genero,
          recintos ( nombre )
        ),
        registrador:profiles!actas_registrado_por_fkey ( nombres, apellidos )
      `,
      )
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new AppError('No se pudo cargar el origen de las actas.', 'UNKNOWN_ERROR', error);
    }

    return (data ?? []).map((row: any) => {
      const jrv = Array.isArray(row.jrvs) ? row.jrvs[0] : row.jrvs;
      const recinto = jrv?.recintos
        ? Array.isArray(jrv.recintos)
          ? jrv.recintos[0]
          : jrv.recintos
        : null;
      const registrador = Array.isArray(row.registrador) ? row.registrador[0] : row.registrador;

      return {
        actaId: row.id,
        dignidad: row.dignidad as TrackingDignidad,
        recintoNombre: recinto?.nombre ?? 'Recinto',
        numeroMesa: jrv?.numero_mesa ?? 0,
        generoMesa: jrv?.genero ?? '',
        latitud: row.latitud,
        longitud: row.longitud,
        ubicacionVerificada: Boolean(row.ubicacion_verificada),
        ubicacionTimestamp: row.ubicacion_timestamp,
        registradoPorNombre: registrador
          ? `${registrador.nombres} ${registrador.apellidos}`
          : 'Desconocido',
        updatedAt: row.updated_at,
      };
    });
  }

  subscribeToEscrutinio(onChange: () => void): () => void {
    const channel = supabase
      .channel('escrutinio-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'actas' },
        () => onChange(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'acta_votos' },
        () => onChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
