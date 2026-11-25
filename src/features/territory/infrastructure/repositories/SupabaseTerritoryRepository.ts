import { AppError } from '@shared/domain/errors/AppError';
import { supabase } from '@shared/infrastructure/supabase/client';
import { CreateJrvInput, Jrv, JrvGenero, VeedorSummary } from '../../domain/entities/Jrv';
import { CreateRecintoInput, Recinto } from '../../domain/entities/Recinto';
import { ITerritoryRepository } from '../../domain/repositories/ITerritoryRepository';

export class SupabaseTerritoryRepository implements ITerritoryRepository {
  async getRecintos(): Promise<Recinto[]> {
    const { data: recintos, error } = await supabase
      .from('recintos')
      .select('id, provincia, canton, parroquia, nombre, direccion, jrvs(count)')
      .order('parroquia', { ascending: true })
      .order('nombre', { ascending: true });

    if (error) {
      throw new AppError('No se pudieron cargar los recintos electorales.', 'UNKNOWN_ERROR', error);
    }

    const { data: coords } = await supabase
      .from('profiles')
      .select('id, nombres, apellidos, recinto_id')
      .eq('rol', 'coordinador_recinto')
      .eq('activo', true);

    const coordByRecinto = new Map<string, { id: string; nombre: string }>();
    for (const c of coords ?? []) {
      if (c.recinto_id) {
        coordByRecinto.set(c.recinto_id, {
          id: c.id,
          nombre: `${c.nombres} ${c.apellidos}`,
        });
      }
    }

    return (recintos ?? []).map((r) => {
      const coord = coordByRecinto.get(r.id);
      const jrvCount = Array.isArray(r.jrvs) && r.jrvs[0]?.count ? Number(r.jrvs[0].count) : 0;
      return {
        id: r.id,
        provincia: r.provincia,
        canton: r.canton,
        parroquia: r.parroquia,
        nombre: r.nombre,
        direccion: r.direccion,
        coordinadorId: coord?.id ?? null,
        coordinadorNombre: coord?.nombre ?? null,
        totalJrvs: jrvCount,
      };
    });
  }

  async createRecinto(input: CreateRecintoInput): Promise<Recinto> {
    const { data, error } = await supabase
      .from('recintos')
      .insert({
        provincia: 'Pichincha',
        canton: 'Rumiñahui',
        parroquia: input.parroquia,
        nombre: input.nombre,
        direccion: input.direccion ?? null,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new AppError('No se pudo crear el recinto electoral.', 'UNKNOWN_ERROR', error);
    }

    return {
      id: data.id,
      provincia: data.provincia,
      canton: data.canton,
      parroquia: data.parroquia,
      nombre: data.nombre,
      direccion: data.direccion,
      coordinadorId: null,
      coordinadorNombre: null,
      totalJrvs: 0,
    };
  }

  async getJrvsByRecinto(recintoId: string): Promise<Jrv[]> {
    const { data, error } = await supabase
      .from('jrvs')
      .select(
        'id, recinto_id, numero_mesa, genero, veedor_id, profiles:veedor_id(nombres, apellidos), recintos(nombre)',
      )
      .eq('recinto_id', recintoId)
      .order('genero', { ascending: true })
      .order('numero_mesa', { ascending: true });

    if (error) {
      throw new AppError('No se pudieron cargar las mesas (JRV) del recinto.', 'UNKNOWN_ERROR', error);
    }

    return (data ?? []).map((row) => {
      const veedor = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      const recinto = Array.isArray(row.recintos) ? row.recintos[0] : row.recintos;
      return {
        id: row.id,
        recintoId: row.recinto_id,
        recintoNombre: recinto?.nombre ?? null,
        numeroMesa: row.numero_mesa,
        genero: row.genero as JrvGenero,
        veedorId: row.veedor_id,
        veedorNombre: veedor ? `${veedor.nombres} ${veedor.apellidos}` : null,
      };
    });
  }

  async getMyAssignedJrvs(veedorId: string): Promise<Jrv[]> {
    const { data, error } = await supabase
      .from('jrvs')
      .select('id, recinto_id, numero_mesa, genero, veedor_id, recintos(nombre)')
      .eq('veedor_id', veedorId)
      .order('numero_mesa', { ascending: true });

    if (error) {
      throw new AppError('No se pudieron cargar tus mesas asignadas.', 'UNKNOWN_ERROR', error);
    }

    return (data ?? []).map((row) => {
      const recinto = Array.isArray(row.recintos) ? row.recintos[0] : row.recintos;
      return {
        id: row.id,
        recintoId: row.recinto_id,
        recintoNombre: recinto?.nombre ?? null,
        numeroMesa: row.numero_mesa,
        genero: row.genero as JrvGenero,
        veedorId: row.veedor_id,
        veedorNombre: null,
      };
    });
  }

  async createJrv(input: CreateJrvInput): Promise<Jrv> {
    const { data, error } = await supabase
      .from('jrvs')
      .insert({
        recinto_id: input.recintoId,
        numero_mesa: input.numeroMesa,
        genero: input.genero,
      })
      .select('*')
      .single();

    if (error || !data) {
      throw new AppError(
        'No se pudo crear la mesa (verifica que no esté duplicado el número y género).',
        'UNKNOWN_ERROR',
        error,
      );
    }

    return {
      id: data.id,
      recintoId: data.recinto_id,
      numeroMesa: data.numero_mesa,
      genero: data.genero as JrvGenero,
      veedorId: null,
      veedorNombre: null,
    };
  }

  async getVeedoresByRecinto(recintoId: string): Promise<VeedorSummary[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, cedula, nombres, apellidos, telefono, email')
      .eq('recinto_id', recintoId)
      .eq('rol', 'veedor')
      .eq('activo', true)
      .order('apellidos', { ascending: true });

    if (error) {
      throw new AppError('No se pudieron cargar los veedores del recinto.', 'UNKNOWN_ERROR', error);
    }

    return data ?? [];
  }

  async assignVeedorToJrv(jrvId: string, veedorId: string | null): Promise<void> {
    const { error } = await supabase
      .from('jrvs')
      .update({ veedor_id: veedorId })
      .eq('id', jrvId);

    if (error) {
      throw new AppError('No se pudo asignar el veedor a la mesa.', 'UNKNOWN_ERROR', error);
    }
  }
}
