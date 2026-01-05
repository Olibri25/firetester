// AK FISH Shared Constants

// ============================================
// App Theme Colors
// ============================================

export const Colors = {
  // Primary colors
  primary: '#0D4F4F', // Deep Teal - Evokes Alaska waters
  primaryLight: '#1A6B6B',
  primaryDark: '#073636',

  // Secondary colors
  secondary: '#A8D8E8', // Glacier Blue
  secondaryLight: '#C4E8F5',
  secondaryDark: '#7EC0D6',

  // Accent colors
  accent: '#E85D4C', // Salmon Orange - CTAs, alerts
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
  gray50: '#F8F9FA', // Off-white background

  // Background colors
  background: '#F8F9FA',
  backgroundDark: '#1A2634', // Midnight blue for dark mode
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

  // Map specific colors
  waterBody: '#4A90D9',
  waterBodyDeep: '#2E6BB0',
  salmonStream: '#E85D4C',
  publicLand: '#A8D8A8',
  privateLand: '#F5B7B1',
  closedArea: '#E74C3C',
  trail: '#8B4513',
  road: '#6B7280',

  // Species colors (for charts and icons)
  speciesKing: '#FFD700',
  speciesSockeye: '#DC143C',
  speciesCoho: '#C0C0C0',
  speciesPink: '#FFB6C1',
  speciesChum: '#9ACD32',
  speciesRainbow: '#FF69B4',
  speciesDolly: '#FF6347',
  speciesHalibut: '#4682B4',

  // Transparency
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

// ============================================
// Typography
// ============================================

export const Typography = {
  fontFamily: {
    primary: 'Inter',
    secondary: 'SF Pro Display',
    mono: 'SF Mono',
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
    '5xl': 48,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ============================================
// Spacing & Layout
// ============================================

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
  '5xl': 64,
} as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// Minimum touch target for gloved/wet hands
export const MIN_TOUCH_TARGET = 48;

// ============================================
// Alaska Regions
// ============================================

export const AlaskaRegions = {
  SOUTHCENTRAL: 'southcentral',
  SOUTHEAST: 'southeast',
  INTERIOR: 'interior',
  SOUTHWEST: 'southwest',
  WESTERN: 'western',
  ARCTIC: 'arctic',
} as const;

export const RegionNames: Record<string, string> = {
  southcentral: 'Southcentral Alaska',
  southeast: 'Southeast Alaska',
  interior: 'Interior Alaska',
  southwest: 'Southwest Alaska',
  western: 'Western Alaska',
  arctic: 'Arctic Alaska',
};

// ============================================
// Major Rivers & Drainages
// ============================================

export const MajorRivers = [
  { id: 'kenai', name: 'Kenai River', region: 'southcentral' },
  { id: 'kasilof', name: 'Kasilof River', region: 'southcentral' },
  { id: 'anchor', name: 'Anchor River', region: 'southcentral' },
  { id: 'russian', name: 'Russian River', region: 'southcentral' },
  { id: 'copper', name: 'Copper River', region: 'southcentral' },
  { id: 'susitna', name: 'Susitna River', region: 'southcentral' },
  { id: 'deshka', name: 'Deshka River', region: 'southcentral' },
  { id: 'little_susitna', name: 'Little Susitna River', region: 'southcentral' },
  { id: 'ship_creek', name: 'Ship Creek', region: 'southcentral' },
  { id: 'bird_creek', name: 'Bird Creek', region: 'southcentral' },
  { id: 'yukon', name: 'Yukon River', region: 'interior' },
  { id: 'tanana', name: 'Tanana River', region: 'interior' },
  { id: 'chena', name: 'Chena River', region: 'interior' },
  { id: 'kuskokwim', name: 'Kuskokwim River', region: 'southwest' },
  { id: 'nushagak', name: 'Nushagak River', region: 'southwest' },
  { id: 'kvichak', name: 'Kvichak River', region: 'southwest' },
  { id: 'naknek', name: 'Naknek River', region: 'southwest' },
  { id: 'stikine', name: 'Stikine River', region: 'southeast' },
  { id: 'taku', name: 'Taku River', region: 'southeast' },
  { id: 'chilkat', name: 'Chilkat River', region: 'southeast' },
] as const;

// ============================================
// Fish Counting Stations
// ============================================

export const FishCountingStations = [
  // Kenai Peninsula
  {
    id: 'kenai_sonar',
    name: 'Kenai River Sonar',
    river: 'Kenai River',
    type: 'sonar',
    lat: 60.5042,
    lng: -151.2732,
    species: ['sockeye_salmon', 'king_salmon'],
  },
  {
    id: 'kasilof_sonar',
    name: 'Kasilof River Sonar',
    river: 'Kasilof River',
    type: 'sonar',
    lat: 60.3388,
    lng: -151.2789,
    species: ['sockeye_salmon', 'king_salmon'],
  },
  {
    id: 'anchor_weir',
    name: 'Anchor River Weir',
    river: 'Anchor River',
    type: 'weir',
    lat: 59.7694,
    lng: -151.8317,
    species: ['king_salmon', 'coho_salmon'],
  },
  {
    id: 'russian_weir',
    name: 'Russian River Weir',
    river: 'Russian River',
    type: 'weir',
    lat: 60.4833,
    lng: -149.9500,
    species: ['sockeye_salmon'],
  },
  // Copper River
  {
    id: 'miles_lake_sonar',
    name: 'Miles Lake Sonar',
    river: 'Copper River',
    type: 'sonar',
    lat: 60.6950,
    lng: -144.6567,
    species: ['sockeye_salmon', 'king_salmon'],
  },
  // Susitna
  {
    id: 'yentna_sonar',
    name: 'Yentna River Sonar',
    river: 'Yentna River',
    type: 'sonar',
    lat: 61.5692,
    lng: -150.3167,
    species: ['sockeye_salmon', 'king_salmon'],
  },
  {
    id: 'deshka_weir',
    name: 'Deshka River Weir',
    river: 'Deshka River',
    type: 'weir',
    lat: 61.7883,
    lng: -150.2583,
    species: ['king_salmon'],
  },
  // Bristol Bay
  {
    id: 'wood_tower',
    name: 'Wood River Tower',
    river: 'Wood River',
    type: 'tower',
    lat: 59.0500,
    lng: -158.5167,
    species: ['sockeye_salmon'],
  },
  {
    id: 'egegik_tower',
    name: 'Egegik River Tower',
    river: 'Egegik River',
    type: 'tower',
    lat: 58.2167,
    lng: -157.3833,
    species: ['sockeye_salmon'],
  },
  {
    id: 'naknek_tower',
    name: 'Naknek River Tower',
    river: 'Naknek River',
    type: 'tower',
    lat: 58.7167,
    lng: -156.9667,
    species: ['sockeye_salmon'],
  },
] as const;

// ============================================
// ADFG Data Source URLs
// ============================================

export const ADFGUrls = {
  fishCounts: 'https://www.adfg.alaska.gov/sf/FishCounts/',
  fishingReports: 'https://www.adfg.alaska.gov/sf/FishingReports/',
  emergencyOrders: 'https://www.adfg.alaska.gov/sf/EONR/',
  lakeDatabase: 'https://www.adfg.alaska.gov/sf/SARR/AWC/',
  regulations: 'https://www.adfg.alaska.gov/index.cfm?adfg=fishregulations.main',
  stockingSchedule: 'https://www.adfg.alaska.gov/index.cfm?adfg=fishingSportStockingHatcheries.main',
} as const;

// ============================================
// External API URLs
// ============================================

export const ExternalAPIs = {
  noaaTides: 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter',
  usgsWater: 'https://waterservices.usgs.gov/nwis/iv/',
  nwsWeather: 'https://api.weather.gov',
  mapbox: 'https://api.mapbox.com',
} as const;

// ============================================
// Subscription Tiers
// ============================================

export const SubscriptionTiers = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    features: [
      'Basic map view',
      'Current fish counts',
      'Regulations lookup',
      'Emergency order alerts',
      '5 waypoints',
    ],
    limits: {
      waypoints: 5,
      offlineMaps: 0,
      catchLogEntries: 10,
      historicalData: false,
      runPredictions: false,
      groupSharing: false,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 29.99,
    priceMonthly: 3.99,
    features: [
      'All Free features',
      'Offline maps (3 regions)',
      'Unlimited waypoints',
      'Full catch log',
      'Stocking alerts',
      'Historical data (1 year)',
      'Trip tracking',
    ],
    limits: {
      waypoints: -1, // unlimited
      offlineMaps: 3,
      catchLogEntries: -1,
      historicalData: true,
      runPredictions: false,
      groupSharing: false,
    },
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    price: 79.99,
    priceMonthly: 9.99,
    features: [
      'All Premium features',
      'Unlimited offline maps',
      'Run timing AI predictions',
      'Full historical data (10+ years)',
      'Group sharing',
      'Priority support',
      'Early access to new features',
    ],
    limits: {
      waypoints: -1,
      offlineMaps: -1,
      catchLogEntries: -1,
      historicalData: true,
      runPredictions: true,
      groupSharing: true,
    },
  },
} as const;

// ============================================
// Map Configuration
// ============================================

export const MapConfig = {
  defaultCenter: {
    latitude: 61.2181,
    longitude: -149.9003, // Anchorage
  },
  defaultZoom: 8,
  minZoom: 4,
  maxZoom: 18,
  alaskaBounds: {
    north: 71.5,
    south: 51.2,
    east: -129.0,
    west: -179.9,
  },
  tileSize: 512,
  offlineStorageLimit: 2 * 1024 * 1024 * 1024, // 2GB
} as const;

// ============================================
// Cache Durations (milliseconds)
// ============================================

export const CacheDurations = {
  fishCounts: 4 * 60 * 60 * 1000, // 4 hours
  fishingReports: 24 * 60 * 60 * 1000, // 24 hours
  emergencyOrders: 15 * 60 * 1000, // 15 minutes
  weather: 60 * 60 * 1000, // 1 hour
  tides: 24 * 60 * 60 * 1000, // 24 hours
  regulations: 7 * 24 * 60 * 60 * 1000, // 7 days
  lakeData: 30 * 24 * 60 * 60 * 1000, // 30 days
  stockingSchedule: 24 * 60 * 60 * 1000, // 24 hours
} as const;

// ============================================
// Species Information
// ============================================

export const SpeciesData = {
  king_salmon: {
    commonName: 'King Salmon',
    scientificName: 'Oncorhynchus tshawytscha',
    alternateNames: ['Chinook Salmon', 'Tyee', 'Blackmouth'],
    avgWeight: { min: 15, max: 50 },
    avgLength: { min: 24, max: 48 },
    peakMonths: [5, 6, 7], // May-July
    color: '#FFD700',
  },
  sockeye_salmon: {
    commonName: 'Sockeye Salmon',
    scientificName: 'Oncorhynchus nerka',
    alternateNames: ['Red Salmon', 'Blueback'],
    avgWeight: { min: 5, max: 8 },
    avgLength: { min: 20, max: 28 },
    peakMonths: [6, 7, 8], // June-August
    color: '#DC143C',
  },
  coho_salmon: {
    commonName: 'Coho Salmon',
    scientificName: 'Oncorhynchus kisutch',
    alternateNames: ['Silver Salmon'],
    avgWeight: { min: 8, max: 12 },
    avgLength: { min: 20, max: 30 },
    peakMonths: [8, 9, 10], // August-October
    color: '#C0C0C0',
  },
  pink_salmon: {
    commonName: 'Pink Salmon',
    scientificName: 'Oncorhynchus gorbuscha',
    alternateNames: ['Humpy', 'Humpback Salmon'],
    avgWeight: { min: 3, max: 5 },
    avgLength: { min: 18, max: 24 },
    peakMonths: [7, 8], // July-August (odd years stronger)
    color: '#FFB6C1',
  },
  chum_salmon: {
    commonName: 'Chum Salmon',
    scientificName: 'Oncorhynchus keta',
    alternateNames: ['Dog Salmon', 'Keta Salmon'],
    avgWeight: { min: 8, max: 15 },
    avgLength: { min: 22, max: 30 },
    peakMonths: [7, 8, 9], // July-September
    color: '#9ACD32',
  },
  rainbow_trout: {
    commonName: 'Rainbow Trout',
    scientificName: 'Oncorhynchus mykiss',
    alternateNames: ['Steelhead (sea-run)'],
    avgWeight: { min: 1, max: 8 },
    avgLength: { min: 12, max: 28 },
    peakMonths: [5, 6, 9, 10], // Spring and Fall
    color: '#FF69B4',
  },
  dolly_varden: {
    commonName: 'Dolly Varden',
    scientificName: 'Salvelinus malma',
    alternateNames: ['Dolly'],
    avgWeight: { min: 1, max: 5 },
    avgLength: { min: 10, max: 22 },
    peakMonths: [6, 7, 8, 9], // Summer
    color: '#FF6347',
  },
  arctic_char: {
    commonName: 'Arctic Char',
    scientificName: 'Salvelinus alpinus',
    alternateNames: [],
    avgWeight: { min: 2, max: 10 },
    avgLength: { min: 14, max: 28 },
    peakMonths: [6, 7, 8], // Summer
    color: '#E85D4C',
  },
  halibut: {
    commonName: 'Pacific Halibut',
    scientificName: 'Hippoglossus stenolepis',
    alternateNames: ['Barn Door'],
    avgWeight: { min: 20, max: 100 },
    avgLength: { min: 28, max: 60 },
    peakMonths: [5, 6, 7, 8], // May-August
    color: '#4682B4',
  },
  arctic_grayling: {
    commonName: 'Arctic Grayling',
    scientificName: 'Thymallus arcticus',
    alternateNames: ['Grayling'],
    avgWeight: { min: 0.5, max: 3 },
    avgLength: { min: 10, max: 18 },
    peakMonths: [6, 7, 8], // Summer
    color: '#9370DB',
  },
} as const;
