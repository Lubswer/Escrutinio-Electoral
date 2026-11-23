import { create } from 'zustand';
import { UserProfile } from '../../domain/entities/User';

interface AuthState {
  user: UserProfile | null;
  isInitialized: boolean;
  setUser: (user: UserProfile | null) => void;
  setInitialized: (initialized: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isInitialized: false,
  setUser: (user) => set({ user }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  clearAuth: () => set({ user: null }),
}));
