// AK FISH Shared Types
// Core types used across mobile and backend applications

// ============================================
// Geographic Types
// ============================================

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface GeoPoint extends Coordinates {
  altitude?: number;
  accuracy?: number;
  timestamp?: number;
}

// ============================================
// Fish Species
// ============================================

export enum FishSpecies {
  KING_SALMON = 'king_salmon',
  SOCKEYE_SALMON = 'sockeye_salmon',
  COHO_SALMON = 'coho_salmon',
  PINK_SALMON = 'pink_salmon',
  CHUM_SALMON = 'chum_salmon',
  RAINBOW_TROUT = 'rainbow_trout',
  DOLLY_VARDEN = 'dolly_varden',
  ARCTIC_CHAR = 'arctic_char',
  LAKE_TROUT = 'lake_trout',
  ARCTIC_GRAYLING = 'arctic_grayling',
  HALIBUT = 'halibut',
  LINGCOD = 'lingcod',
  ROCKFISH = 'rockfish',
  NORTHERN_PIKE = 'northern_pike',
  BURBOT = 'burbot',
  STEELHEAD = 'steelhead',
}

export interface SpeciesInfo {
  id: FishSpecies;
  commonName: string;
  scientificName: string;
  iconUrl: string;
  avgSizeRange: { min: number; max: number }; // in inches
  seasonalPeaks: SeasonalPeak[];
}

export interface SeasonalPeak {
  startMonth: number;
  endMonth: number;
  region: string;
  quality: 'poor' | 'fair' | 'good' | 'excellent';
}

// ============================================
// Fish Counting Stations
// ============================================

export enum StationType {
  SONAR = 'sonar',
  WEIR = 'weir',
  TOWER = 'tower',
  AERIAL = 'aerial',
}

export interface FishCountStation {
  id: string;
  name: string;
  type: StationType;
  location: Coordinates;
  river: string;
  region: string;
  species: FishSpecies[];
  isActive: boolean;
  dataUrl?: string;
}

export interface FishCount {
  stationId: string;
  date: string; // ISO date string
  timestamp: string; // ISO datetime string
  species: FishSpecies;
  dailyCount: number;
  cumulativeCount: number;
  escapementGoal?: number;
  percentOfGoal?: number;
  fiveYearAverage?: number;
  previousYearCount?: number;
}

export interface FishCountHistory {
  stationId: string;
  species: FishSpecies;
  season: number; // year
  counts: FishCount[];
  totalCount: number;
  escapementGoal?: number;
  goalMet: boolean;
}

// ============================================
// Emergency Orders & Regulations
// ============================================

export enum RegulationType {
  EMERGENCY_ORDER = 'emergency_order',
  NEWS_RELEASE = 'news_release',
  REGULATION_CHANGE = 'regulation_change',
}

export enum RegulationAction {
  CLOSURE = 'closure',
  OPENING = 'opening',
  BAG_LIMIT_CHANGE = 'bag_limit_change',
  GEAR_RESTRICTION = 'gear_restriction',
  SIZE_LIMIT_CHANGE = 'size_limit_change',
  SEASON_EXTENSION = 'season_extension',
  CONSERVATION_CONCERN = 'conservation_concern',
}

export interface EmergencyOrder {
  id: string;
  type: RegulationType;
  action: RegulationAction;
  title: string;
  summary: string;
  fullText: string;
  effectiveDate: string;
  expirationDate?: string;
  affectedAreas: string[];
  affectedSpecies: FishSpecies[];
  sourceUrl: string;
  publishedAt: string;
  isActive: boolean;
}

export interface Regulation {
  id: string;
  area: string;
  waterBody: string;
  species: FishSpecies;
  bagLimit: number;
  sizeLimit?: { min?: number; max?: number; slot?: boolean };
  gearRestrictions: string[];
  seasonOpen: string; // date string
  seasonClose: string; // date string
  specialConditions: string[];
  plainEnglishSummary: string;
  lastUpdated: string;
}

// ============================================
// Lakes & Streams Database
// ============================================

export enum WaterBodyType {
  LAKE = 'lake',
  RIVER = 'river',
  STREAM = 'stream',
  CREEK = 'creek',
  SLOUGH = 'slough',
  ESTUARY = 'estuary',
}

export enum AccessType {
  ROAD = 'road',
  TRAIL = 'trail',
  BOAT = 'boat',
  FLOAT_PLANE = 'float_plane',
  HELICOPTER = 'helicopter',
  WALK_IN = 'walk_in',
}

export interface Lake {
  id: string;
  name: string;
  alternateNames?: string[];
  location: Coordinates;
  region: string;
  type: WaterBodyType;
  surfaceArea?: number; // acres
  maxDepth?: number; // feet
  elevation?: number; // feet
  species: LakeSpeciesInfo[];
  accessTypes: AccessType[];
  accessDescription?: string;
  boatLaunchAvailable: boolean;
  bathymetryAvailable: boolean;
  bathymetryUrl?: string;
  stockingHistory: StockingRecord[];
  lastSurveyDate?: string;
  notes?: string;
}

export interface LakeSpeciesInfo {
  species: FishSpecies;
  abundance: 'rare' | 'common' | 'abundant';
  averageSize?: number; // inches
  sizeRange?: { min: number; max: number };
  notes?: string;
}

export interface StockingRecord {
  id: string;
  lakeId: string;
  date: string;
  species: FishSpecies;
  quantity: number;
  sizeCategory: 'fry' | 'fingerling' | 'subcatchable' | 'catchable';
  averageLength?: number; // inches
  source?: string;
}

export interface StockingSchedule {
  id: string;
  lakeId: string;
  lakeName: string;
  plannedDate: string;
  species: FishSpecies;
  plannedQuantity: number;
  sizeCategory: 'fry' | 'fingerling' | 'subcatchable' | 'catchable';
  status: 'scheduled' | 'completed' | 'cancelled';
  year: number;
}

// ============================================
// Fishing Reports
// ============================================

export interface FishingReport {
  id: string;
  region: string;
  area: string;
  reportDate: string;
  publishedAt: string;
  author?: string;
  content: string;
  conditions: FishingConditions;
  speciesReports: SpeciesReport[];
  recommendations?: string[];
  sourceUrl: string;
}

export interface FishingConditions {
  overall: 'poor' | 'fair' | 'good' | 'excellent';
  waterClarity?: 'clear' | 'slightly_murky' | 'murky' | 'muddy';
  waterLevel?: 'low' | 'normal' | 'high' | 'flood';
  waterTemp?: number; // fahrenheit
  weather?: string;
  crowdLevel?: 'light' | 'moderate' | 'heavy';
}

export interface SpeciesReport {
  species: FishSpecies;
  abundance: 'none' | 'few' | 'some' | 'many' | 'abundant';
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  notes?: string;
  recommendedTechniques?: string[];
  recommendedGear?: string[];
}

// ============================================
// Run Timing & Predictions
// ============================================

export interface RunTimingData {
  id: string;
  location: string;
  river: string;
  species: FishSpecies;
  year: number;
  firstFish?: string; // date
  earlyRunStart?: string;
  earlyRunPeak?: string;
  earlyRunEnd?: string;
  lateRunStart?: string;
  lateRunPeak?: string;
  lateRunEnd?: string;
  lastFish?: string;
  totalEscapement?: number;
  notes?: string;
}

export interface RunPrediction {
  id: string;
  location: string;
  species: FishSpecies;
  predictedPeakDate: string;
  confidenceLevel: number; // 0-100
  predictedTotalRun: number;
  predictedStrength: 'weak' | 'below_average' | 'average' | 'above_average' | 'strong';
  factors: PredictionFactor[];
  generatedAt: string;
  validUntil: string;
}

export interface PredictionFactor {
  name: string;
  value: number | string;
  impact: 'positive' | 'neutral' | 'negative';
  weight: number;
  description: string;
}

// ============================================
// Weather & Conditions
// ============================================

export interface TideData {
  stationId: string;
  stationName: string;
  predictions: TidePrediction[];
}

export interface TidePrediction {
  timestamp: string;
  height: number; // feet
  type: 'high' | 'low';
}

export interface RiverConditions {
  gaugeId: string;
  gaugeName: string;
  location: Coordinates;
  timestamp: string;
  flowRate?: number; // cubic feet per second
  gaugeHeight?: number; // feet
  waterTemp?: number; // fahrenheit
  trend: 'rising' | 'stable' | 'falling';
}

export interface WeatherData {
  location: Coordinates;
  timestamp: string;
  temperature: number; // fahrenheit
  feelsLike: number;
  humidity: number;
  windSpeed: number; // mph
  windDirection: string;
  windGust?: number;
  conditions: string;
  icon: string;
  pressure: number; // inHg
  pressureTrend: 'rising' | 'stable' | 'falling';
  visibility: number; // miles
  uvIndex: number;
  sunrise: string;
  sunset: string;
}

export interface WeatherForecast {
  location: Coordinates;
  generatedAt: string;
  daily: DailyForecast[];
  hourly: HourlyForecast[];
}

export interface DailyForecast {
  date: string;
  high: number;
  low: number;
  conditions: string;
  icon: string;
  precipChance: number;
  windSpeed: number;
  windDirection: string;
}

export interface HourlyForecast {
  timestamp: string;
  temperature: number;
  conditions: string;
  icon: string;
  precipChance: number;
  windSpeed: number;
  windDirection: string;
}

export interface SolunarData {
  date: string;
  location: Coordinates;
  majorPeriods: SolunarPeriod[];
  minorPeriods: SolunarPeriod[];
  moonPhase: string;
  moonIllumination: number;
  rating: number; // 1-5
}

export interface SolunarPeriod {
  start: string;
  end: string;
  type: 'major' | 'minor';
}

// ============================================
// User Data
// ============================================

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  subscriptionTier: 'free' | 'premium' | 'elite';
  subscriptionExpiresAt?: string;
  createdAt: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  defaultMapStyle: 'satellite' | 'topo' | 'hybrid' | 'nautical';
  units: 'imperial' | 'metric';
  darkMode: 'auto' | 'light' | 'dark';
  notifications: NotificationPreferences;
  favoriteSpecies: FishSpecies[];
  homeLocation?: Coordinates;
}

export interface NotificationPreferences {
  emergencyOrders: boolean;
  fishCountAlerts: boolean;
  stockingAlerts: boolean;
  weatherAlerts: boolean;
  runTimingAlerts: boolean;
}

// ============================================
// Waypoints & Markers
// ============================================

export enum WaypointType {
  HOT_SPOT = 'hot_spot',
  CAMP_SITE = 'camp_site',
  BOAT_LAUNCH = 'boat_launch',
  HAZARD = 'hazard',
  FISH_ON = 'fish_on',
  PARKING = 'parking',
  TRAILHEAD = 'trailhead',
  CUSTOM = 'custom',
}

export interface Waypoint {
  id: string;
  userId: string;
  name: string;
  type: WaypointType;
  location: Coordinates;
  description?: string;
  notes?: string;
  photos?: string[];
  isPrivate: boolean;
  sharedWith?: string[]; // group IDs
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Trip Tracking
// ============================================

export interface Trip {
  id: string;
  userId: string;
  name: string;
  startTime: string;
  endTime?: string;
  track: GeoPoint[];
  distance: number; // miles
  duration: number; // minutes
  conditions?: TripConditions;
  catches: Catch[];
  waypoints: string[]; // waypoint IDs
  notes?: string;
  photos?: string[];
  isPublic: boolean;
}

export interface TripConditions {
  weather?: string;
  temperature?: number;
  windSpeed?: number;
  waterTemp?: number;
  tidePhase?: string;
  moonPhase?: string;
  pressure?: number;
}

// ============================================
// Catch Logging
// ============================================

export interface Catch {
  id: string;
  oderId: string;
  tripId?: string;
  species: FishSpecies;
  location: Coordinates;
  timestamp: string;
  length?: number; // inches
  weight?: number; // pounds
  kept: boolean;
  lure?: string;
  technique?: string;
  depth?: number; // feet
  waterTemp?: number;
  notes?: string;
  photos?: string[];
  isPublic: boolean;
}

export interface CatchStats {
  userId: string;
  totalCatches: number;
  totalKept: number;
  totalReleased: number;
  speciesBreakdown: { species: FishSpecies; count: number }[];
  personalBests: { species: FishSpecies; length?: number; weight?: number; date: string }[];
  monthlyTrends: { month: string; count: number }[];
  topLures: { lure: string; catches: number }[];
  topLocations: { location: string; catches: number }[];
}

// ============================================
// Map & Layers
// ============================================

export enum MapLayer {
  PUBLIC_LAND_BLM = 'public_land_blm',
  PUBLIC_LAND_USFS = 'public_land_usfs',
  PUBLIC_LAND_STATE = 'public_land_state',
  PUBLIC_LAND_NPS = 'public_land_nps',
  PUBLIC_LAND_FWS = 'public_land_fws',
  PRIVATE_LAND = 'private_land',
  NATIVE_CORPORATION = 'native_corporation',
  ACCESS_POINTS = 'access_points',
  FISH_COUNTING_STATIONS = 'fish_counting_stations',
  REGULATION_ZONES = 'regulation_zones',
  STOCKED_LAKES = 'stocked_lakes',
  ANADROMOUS_WATERS = 'anadromous_waters',
  TRAILS = 'trails',
  ROADS = 'roads',
}

export interface OfflineMapRegion {
  id: string;
  name: string;
  bounds: BoundingBox;
  sizeBytes: number;
  downloadedAt?: string;
  lastUpdated: string;
  includesRegulations: boolean;
  includesFishCounts: boolean;
  expiresAt: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
  cachedAt?: string;
  expiresAt?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: ApiMeta & {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}
