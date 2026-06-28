import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from './api';
import { isInternalRole } from './constants';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  lastLoginAt?: string;
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
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  isAuthenticated: () => boolean;
  isInternal: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      login: async (email, password, rememberMe = false) => {
        set({ isLoading: true });
        try {
          const result = await api<{ user: User; accessToken: string; refreshToken: string }>(
            '/auth/login',
            { method: 'POST', body: JSON.stringify({ email, password, rememberMe }) }
          );
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
        const { accessToken, refreshToken } = get();
        try {
          if (accessToken) {
            await api('/auth/logout', {
              method: 'POST',
              token: accessToken,
              body: JSON.stringify({ refreshToken }),
            });
          }
        } catch {
          // Continue logout even if API fails
        }
        set({ user: null, accessToken: null, refreshToken: null });
      },

      fetchUser: async () => {
        const { accessToken } = get();
        if (!accessToken) return;
        try {
          const user = await api<User>('/auth/me', { token: accessToken });
          set({ user });
        } catch {
          set({ user: null, accessToken: null, refreshToken: null });
        }
      },

      isAuthenticated: () => !!get().accessToken && !!get().user,
      isInternal: () => {
        const user = get().user;
        return user ? isInternalRole(user.role) : false;
      },
    }),
    {
      name: 'dp-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
