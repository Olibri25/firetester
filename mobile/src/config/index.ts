// AK FISH Mobile Configuration

export const config = {
  // API Configuration
  api: {
    baseUrl: __DEV__
      ? 'http://localhost:3000/api/v1'
      : 'https://api.akfish.app/api/v1',
    timeout: 30000,
  },

  // Mapbox
  mapbox: {
    accessToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '',
    styleUrl: 'mapbox://styles/mapbox/outdoors-v12',
    satelliteStyleUrl: 'mapbox://styles/mapbox/satellite-streets-v12',
  },

  // Default map settings
  map: {
    defaultCenter: {
      latitude: 61.2181,
      longitude: -149.9003, // Anchorage
    },
    defaultZoom: 8,
    minZoom: 4,
    maxZoom: 18,
  },

  // Cache settings
  cache: {
    fishCountsTTL: 4 * 60 * 60 * 1000, // 4 hours
    emergencyOrdersTTL: 15 * 60 * 1000, // 15 minutes
    weatherTTL: 60 * 60 * 1000, // 1 hour
    regulationsTTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  },

  // Feature flags
  features: {
    offlineMaps: true,
    tripTracking: true,
    socialFeatures: false,
    runPredictions: true,
  },
} as const;

// Theme colors
export const Colors = {
  // Primary colors
  primary: '#0D4F4F',
  primaryLight: '#1A6B6B',
  primaryDark: '#073636',

  // Secondary colors
  secondary: '#A8D8E8',
  secondaryLight: '#C4E8F5',
  secondaryDark: '#7EC0D6',

  // Accent colors
  accent: '#E85D4C',
  accentLight: '#F08070',
  accentDark: '#D04030',

  // Neutral colors
  charcoal: '#2C3E50',
  gray900: '#1A2634',
  gray800: '#2D3A47',
  gray700: '#3D4F5F',
  gray600: '#5A6C7D',
  gray500: '#7A8B9A',
  gray400: '#9AABB8',
  gray300: '#BDC8D1',
  gray200: '#D8E0E6',
  gray100: '#EDF1F4',
  gray50: '#F8F9FA',

  // Background colors
  background: '#F8F9FA',
  backgroundDark: '#1A2634',
  surface: '#FFFFFF',
  surfaceDark: '#2D3A47',

  // Semantic colors
  success: '#2ECC71',
  successLight: '#A9DFBF',
  warning: '#F39C12',
  warningLight: '#FCE5B5',
  error: '#E74C3C',
  errorLight: '#F5B7B1',
  info: '#3498DB',
  infoLight: '#AED6F1',

  // Map colors
  water: '#4A90D9',
  publicLand: '#A8D8A8',
  privateLand: '#F5B7B1',
  closedArea: '#E74C3C',

  // Species colors
  kingColor: '#FFD700',
  sockeyeColor: '#DC143C',
  cohoColor: '#C0C0C0',
  pinkColor: '#FFB6C1',
  chumColor: '#9ACD32',
} as const;

// Typography
export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    mono: 'Courier',
  },
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
} as const;

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

// Minimum touch target for gloved hands
export const MIN_TOUCH_TARGET = 48;
