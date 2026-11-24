import {
  isDeviceOnline,
  subscribeToNetworkStatus,
} from '@shared/infrastructure/network/networkMonitor';
import { useEffect, useState } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    void isDeviceOnline().then(setIsOnline);
    const unsubscribe = subscribeToNetworkStatus(setIsOnline);
    return () => unsubscribe();
  }, []);

  return { isOnline };
}
