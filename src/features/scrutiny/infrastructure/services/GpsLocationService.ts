import { PermissionError } from '@shared/domain/errors/AppError';
import * as Location from 'expo-location';
import { GpsEvidenceResult } from '../../domain/services/IMediaEvidenceService';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

/**
 * ADR-04 / S-07 / S-10:
 * Obtiene coordenadas satelitales GPS (funciona sin internet) y verifica
 * que la lectura tenga menos de 5 minutos de antigüedad.
 */
export async function captureSatellitalGps(): Promise<GpsEvidenceResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new PermissionError(
      'Se requiere permiso de ubicación GPS para certificar el recinto del acta.',
    );
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  const ageMs = Date.now() - location.timestamp;
  const isVerified = ageMs <= FIVE_MINUTES_MS;

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    timestamp: new Date(location.timestamp).toISOString(),
    isVerified,
  };
}
