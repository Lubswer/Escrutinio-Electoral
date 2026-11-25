export interface INetworkStatusService {
  isOnline(): Promise<boolean>;
}
