import { ProvisionUserInput, UserProfile } from '../entities/User';

export interface IAuthRepository {
  login(email: string, password: string): Promise<UserProfile>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<UserProfile | null>;
  changeFirstLoginPassword(newPassword: string): Promise<void>;
  sendPasswordResetEmail(email: string): Promise<void>;
  provisionSubordinate(input: ProvisionUserInput, creatorId: string): Promise<UserProfile>;
}
