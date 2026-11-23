import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { Acta, Dignidad, SaveActaInput } from '../../domain/entities/Acta';
import {
  IOfflineActaQueueRepository,
  PendingActaEntry,
} from '../../domain/repositories/IOfflineActaQueueRepository';

const PENDING_ACTAS_STORAGE_KEY = 'ESCRUTINIO_PENDING_ACTAS';

async function persistPhotoLocally(sourceUri: string, key: string): Promise<string> {
  if (Platform.OS === 'web' || !sourceUri.startsWith('file://')) {
    return sourceUri;
  }

  try {
    const offlineDir = new Directory(Paths.document, 'actas_offline');
    if (!offlineDir.exists) {
      offlineDir.create({ intermediates: true });
    }
    const destFile = new File(offlineDir, `${key}.jpg`);
    if (sourceUri === destFile.uri) {
      return destFile.uri;
    }
    const srcFile = new File(sourceUri);
    if (destFile.exists) {
      destFile.delete();
    }
    srcFile.copy(destFile);
    return destFile.uri;
  } catch {
    return sourceUri;
  }
}

function mapEntryToActa(entry: PendingActaEntry): Acta {
  return {
    id: entry.input.actaId,
    jrvId: entry.input.jrvId,
    dignidad: entry.input.dignidad,
    totalSufragantes: entry.input.totalSufragantes,
    votosBlancos: entry.input.votosBlancos,
    votosNulos: entry.input.votosNulos,
    votosPorCandidato: entry.input.votosPorCandidato,
    fotoPath: entry.input.localPhotoUri,
    fotoNitidezScore: entry.input.fotoNitidezScore,
    latitud: entry.input.latitud,
    longitud: entry.input.longitud,
    ubicacionTimestamp: entry.input.ubicacionTimestamp,
    ubicacionVerificada: entry.input.ubicacionVerificada,
    version: entry.input.expectedVersion,
    registradoPor: entry.input.userId,
    syncStatus: entry.syncStatus,
    syncError: entry.syncError,
  };
}

export class AsyncStorageOfflineActaRepository implements IOfflineActaQueueRepository {
  async getAllPendingEntries(): Promise<PendingActaEntry[]> {
    const raw = await AsyncStorage.getItem(PENDING_ACTAS_STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as PendingActaEntry[];
    } catch {
      return [];
    }
  }

  private async writeQueue(entries: PendingActaEntry[]): Promise<void> {
    await AsyncStorage.setItem(PENDING_ACTAS_STORAGE_KEY, JSON.stringify(entries));
  }

  async enqueue(input: SaveActaInput, errorMessage?: string): Promise<Acta> {
    const key = `${input.jrvId}_${input.dignidad}`;
    const persistedUri = await persistPhotoLocally(input.localPhotoUri, key);
    const updatedInput: SaveActaInput = { ...input, localPhotoUri: persistedUri };

    const queue = await this.getAllPendingEntries();
    const entry: PendingActaEntry = {
      key,
      input: updatedInput,
      syncStatus: errorMessage ? 'fallido' : 'pendiente_envio',
      syncError: errorMessage,
      savedAt: new Date().toISOString(),
    };

    const nextQueue = [...queue.filter((q) => q.key !== key), entry];
    await this.writeQueue(nextQueue);
    return mapEntryToActa(entry);
  }

  async getPendingActas(): Promise<Acta[]> {
    const queue = await this.getAllPendingEntries();
    return queue.map(mapEntryToActa);
  }

  async getPendingActasByJrv(jrvId: string): Promise<Acta[]> {
    const queue = await this.getAllPendingEntries();
    return queue.filter((q) => q.input.jrvId === jrvId).map(mapEntryToActa);
  }

  async markFailed(key: string, errorMessage: string): Promise<void> {
    const queue = await this.getAllPendingEntries();
    const updated = queue.map((item) =>
      item.key === key
        ? { ...item, syncStatus: 'fallido' as const, syncError: errorMessage }
        : item,
    );
    await this.writeQueue(updated);
  }

  async remove(jrvId: string, dignidad: Dignidad): Promise<void> {
    const key = `${jrvId}_${dignidad}`;
    const queue = await this.getAllPendingEntries();
    const filtered = queue.filter((item) => item.key !== key);
    if (filtered.length !== queue.length) {
      await this.writeQueue(filtered);
    }
  }
}
