// AK FISH Settings Store

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type MapStyle = 'satellite' | 'topo' | 'hybrid' | 'nautical';
type Units = 'imperial' | 'metric';
type DarkMode = 'auto' | 'light' | 'dark';

interface NotificationSettings {
  emergencyOrders: boolean;
  fishCountAlerts: boolean;
  stockingAlerts: boolean;
  weatherAlerts: boolean;
  runTimingAlerts: boolean;
}

interface SettingsState {
  // Map settings
  mapStyle: MapStyle;
  showPublicLand: boolean;
  showFishCountStations: boolean;
  showStockedLakes: boolean;
  showRegulationZones: boolean;

  // Units
  units: Units;

  // Display
  darkMode: DarkMode;
  highContrastMode: boolean;

  // Notifications
  notifications: NotificationSettings;

  // Home location
  homeLocation: { latitude: number; longitude: number } | null;

  // Favorites
  favoriteSpecies: string[];

  // Offline settings
  autoDownloadMaps: boolean;
  offlineMapRegions: string[];

  // Actions
  loadSettings: () => Promise<void>;
  setMapStyle: (style: MapStyle) => void;
  setUnits: (units: Units) => void;
  setDarkMode: (mode: DarkMode) => void;
  setHighContrastMode: (enabled: boolean) => void;
  setNotificationSetting: (key: keyof NotificationSettings, value: boolean) => void;
  setHomeLocation: (location: { latitude: number; longitude: number } | null) => void;
  toggleMapLayer: (layer: 'publicLand' | 'fishCountStations' | 'stockedLakes' | 'regulationZones') => void;
  addFavoriteSpecies: (species: string) => void;
  removeFavoriteSpecies: (species: string) => void;
  addOfflineRegion: (regionId: string) => void;
  removeOfflineRegion: (regionId: string) => void;
}

const STORAGE_KEY = 'ak_fish_settings';

const defaultSettings = {
  mapStyle: 'satellite' as MapStyle,
  showPublicLand: true,
  showFishCountStations: true,
  showStockedLakes: true,
  showRegulationZones: true,
  units: 'imperial' as Units,
  darkMode: 'auto' as DarkMode,
  highContrastMode: false,
  notifications: {
    emergencyOrders: true,
    fishCountAlerts: true,
    stockingAlerts: true,
    weatherAlerts: false,
    runTimingAlerts: true,
  },
  homeLocation: null,
  favoriteSpecies: [] as string[],
  autoDownloadMaps: false,
  offlineMapRegions: [] as string[],
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,

  loadSettings: async () => {
    try {
      const storedSettings = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        set({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  },

  setMapStyle: (style: MapStyle) => {
    set({ mapStyle: style });
    persistSettings(get());
  },

  setUnits: (units: Units) => {
    set({ units });
    persistSettings(get());
  },

  setDarkMode: (mode: DarkMode) => {
    set({ darkMode: mode });
    persistSettings(get());
  },

  setHighContrastMode: (enabled: boolean) => {
    set({ highContrastMode: enabled });
    persistSettings(get());
  },

  setNotificationSetting: (key: keyof NotificationSettings, value: boolean) => {
    const notifications = { ...get().notifications, [key]: value };
    set({ notifications });
    persistSettings(get());
  },

  setHomeLocation: (location) => {
    set({ homeLocation: location });
    persistSettings(get());
  },

  toggleMapLayer: (layer) => {
    const layerMap = {
      publicLand: 'showPublicLand',
      fishCountStations: 'showFishCountStations',
      stockedLakes: 'showStockedLakes',
      regulationZones: 'showRegulationZones',
    } as const;

    const key = layerMap[layer];
    set({ [key]: !get()[key] });
    persistSettings(get());
  },

  addFavoriteSpecies: (species: string) => {
    const favoriteSpecies = [...get().favoriteSpecies];
    if (!favoriteSpecies.includes(species)) {
      favoriteSpecies.push(species);
      set({ favoriteSpecies });
      persistSettings(get());
    }
  },

  removeFavoriteSpecies: (species: string) => {
    const favoriteSpecies = get().favoriteSpecies.filter((s) => s !== species);
    set({ favoriteSpecies });
    persistSettings(get());
  },

  addOfflineRegion: (regionId: string) => {
    const offlineMapRegions = [...get().offlineMapRegions];
    if (!offlineMapRegions.includes(regionId)) {
      offlineMapRegions.push(regionId);
      set({ offlineMapRegions });
      persistSettings(get());
    }
  },

  removeOfflineRegion: (regionId: string) => {
    const offlineMapRegions = get().offlineMapRegions.filter((r) => r !== regionId);
    set({ offlineMapRegions });
    persistSettings(get());
  },
}));

// Helper to persist settings
async function persistSettings(state: SettingsState) {
  try {
    const settingsToStore = {
      mapStyle: state.mapStyle,
      showPublicLand: state.showPublicLand,
      showFishCountStations: state.showFishCountStations,
      showStockedLakes: state.showStockedLakes,
      showRegulationZones: state.showRegulationZones,
      units: state.units,
      darkMode: state.darkMode,
      highContrastMode: state.highContrastMode,
      notifications: state.notifications,
      homeLocation: state.homeLocation,
      favoriteSpecies: state.favoriteSpecies,
      autoDownloadMaps: state.autoDownloadMaps,
      offlineMapRegions: state.offlineMapRegions,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToStore));
  } catch (error) {
    console.error('Error persisting settings:', error);
  }
}
