// AK FISH Authentication Store

import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../services/api';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  subscriptionTier: 'FREE' | 'PREMIUM' | 'ELITE';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

const SECURE_STORE_KEYS = {
  accessToken: 'ak_fish_access_token',
  refreshToken: 'ak_fish_refresh_token',
  user: 'ak_fish_user',
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data.data;

      // Store tokens securely
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.accessToken, accessToken);
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.refreshToken, refreshToken);
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.user, JSON.stringify(user));

      // Update API client with token
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (email: string, password: string, displayName: string) => {
    set({ isLoading: true });

    try {
      const response = await api.post('/auth/register', {
        email,
        password,
        displayName,
      });
      const { user, accessToken, refreshToken } = response.data.data;

      // Store tokens securely
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.accessToken, accessToken);
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.refreshToken, refreshToken);
      await SecureStore.setItemAsync(SECURE_STORE_KEYS.user, JSON.stringify(user));

      // Update API client with token
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      // Call logout endpoint
      await api.post('/auth/logout').catch(() => {});

      // Clear stored tokens
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.accessToken);
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.refreshToken);
      await SecureStore.deleteItemAsync(SECURE_STORE_KEYS.user);

      // Clear API authorization header
      delete api.defaults.headers.common['Authorization'];

      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  loadStoredAuth: async () => {
    try {
      const [accessToken, refreshToken, userJson] = await Promise.all([
        SecureStore.getItemAsync(SECURE_STORE_KEYS.accessToken),
        SecureStore.getItemAsync(SECURE_STORE_KEYS.refreshToken),
        SecureStore.getItemAsync(SECURE_STORE_KEYS.user),
      ]);

      if (accessToken && userJson) {
        const user = JSON.parse(userJson);

        // Set API authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        // Verify token is still valid
        try {
          const response = await api.get('/auth/me');
          const freshUser = response.data.data;

          set({
            user: freshUser,
            accessToken,
            refreshToken,
            isAuthenticated: true,
          });

          // Update stored user data
          await SecureStore.setItemAsync(SECURE_STORE_KEYS.user, JSON.stringify(freshUser));
        } catch {
          // Token invalid, clear stored data
          await get().logout();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    }
  },

  updateUser: (updates: Partial<User>) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      set({ user: updatedUser });

      // Update stored user
      SecureStore.setItemAsync(SECURE_STORE_KEYS.user, JSON.stringify(updatedUser));
    }
  },
}));
