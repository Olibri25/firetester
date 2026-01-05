// AK FISH - Main Application Entry Point

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';

import { Navigation } from './src/navigation';
import { useAuthStore } from './src/store/authStore';
import { useSettingsStore } from './src/store/settingsStore';

// Keep splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const loadAuth = useAuthStore((state) => state.loadStoredAuth);
  const loadSettings = useSettingsStore((state) => state.loadSettings);
  const darkMode = useSettingsStore((state) => state.darkMode);

  useEffect(() => {
    async function prepare() {
      try {
        // Load stored auth and settings
        await Promise.all([loadAuth(), loadSettings()]);
      } catch (e) {
        console.warn('Error loading initial data:', e);
      } finally {
        // Hide splash screen
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [loadAuth, loadSettings]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style={darkMode === 'dark' ? 'light' : 'auto'} />
          <Navigation />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
