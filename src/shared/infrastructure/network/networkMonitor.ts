import NetInfo from '@react-native-community/netinfo';
import { INetworkStatusService } from '@shared/domain/services/INetworkStatusService';
import { onlineManager } from '@tanstack/react-query';

/**
 * Conecta NetInfo con el onlineManager de TanStack Query (ADR-05 + ADR-08).
 * Cuando el celular pierde señal en zonas rurales, TanStack Query pausa
 * las mutaciones y las reanuda automáticamente al volver la conexión.
 */
export function setupNetworkMonitoring(): void {
  onlineManager.setEventListener((setOnline) => {
    return NetInfo.addEventListener((state) => {
      const isConnected = Boolean(state.isConnected && state.isInternetReachable !== false);
      setOnline(isConnected);
    });
  });
}

export async function isDeviceOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

export function subscribeToNetworkStatus(onChange: (isOnline: boolean) => void): () => void {
  return NetInfo.addEventListener((state) => {
    onChange(Boolean(state.isConnected && state.isInternetReachable !== false));
  });
}

export class NetInfoNetworkStatusService implements INetworkStatusService {
  isOnline(): Promise<boolean> {
    return isDeviceOnline();
  }
}
