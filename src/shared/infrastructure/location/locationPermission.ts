import * as Location from 'expo-location';
import { Platform } from 'react-native';

export type LocationAccessStatus = 'ok' | 'permission_denied' | 'gps_disabled';

/**
 * Verifica y solicita (solo si aún no se concedió) el permiso de ubicación en primer plano,
 * y comprueba que el servicio GPS del dispositivo esté encendido.
 */
export async function ensureLocationAccess(): Promise<LocationAccessStatus> {
  if (Platform.OS === 'web') {
    return 'ok';
  }

  const currentPerm = await Location.getForegroundPermissionsAsync();
  let status = currentPerm.status;

  if (status !== 'granted') {
    const requested = await Location.requestForegroundPermissionsAsync();
    status = requested.status;
  }

  if (status !== 'granted') {
    return 'permission_denied';
  }

  let servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled && Platform.OS === 'android') {
    try {
      await Location.enableNetworkProviderAsync();
      servicesEnabled = await Location.hasServicesEnabledAsync();
    } catch {
      // El usuario canceló el diálogo nativo de Android
    }
  }

  if (!servicesEnabled) {
    return 'gps_disabled';
  }

  return 'ok';
}
