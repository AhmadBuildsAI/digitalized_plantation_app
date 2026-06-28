import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  customerProfile?: {
    id: string;
    companyName?: string;
    manualControlEnabled: boolean;
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
}

const STORAGE_KEYS = {
  accessToken: 'dp_access_token',
  refreshToken: 'dp_refresh_token',
  user: 'dp_user',
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isHydrated: false,

  hydrate: async () => {
    try {
      const [accessToken, refreshToken, userJson] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEYS.accessToken),
        SecureStore.getItemAsync(STORAGE_KEYS.refreshToken),
        SecureStore.getItemAsync(STORAGE_KEYS.user),
      ]);
      set({
        accessToken,
        refreshToken,
        user: userJson ? JSON.parse(userJson) : null,
        isHydrated: true,
      });
    } catch {
      set({ isHydrated: true });
    }
  },

  login: async (email, password, rememberMe = false) => {
    set({ isLoading: true });
    try {
      const result = await api<{ user: User; accessToken: string; refreshToken: string }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password, rememberMe }) }
      );
      await SecureStore.setItemAsync(STORAGE_KEYS.accessToken, result.accessToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.refreshToken, result.refreshToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.user, JSON.stringify(result.user));
      set({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(STORAGE_KEYS.accessToken),
      SecureStore.deleteItemAsync(STORAGE_KEYS.refreshToken),
      SecureStore.deleteItemAsync(STORAGE_KEYS.user),
    ]);
    set({ user: null, accessToken: null, refreshToken: null });
  },
}));
