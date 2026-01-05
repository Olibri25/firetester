// AK FISH Backend Configuration

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://localhost:5432/akfish',

  // Redis
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  // Firebase (for push notifications)
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,

  // Mapbox
  mapboxAccessToken: process.env.MAPBOX_ACCESS_TOKEN,

  // External APIs
  noaaTidesUrl: 'https://api.tidesandcurrents.noaa.gov/api/prod/datagetter',
  usgsWaterUrl: 'https://waterservices.usgs.gov/nwis/iv/',
  nwsWeatherUrl: 'https://api.weather.gov',

  // ADFG URLs
  adfg: {
    fishCountsUrl: 'https://www.adfg.alaska.gov/sf/FishCounts/',
    fishingReportsUrl: 'https://www.adfg.alaska.gov/sf/FishingReports/',
    emergencyOrdersUrl: 'https://www.adfg.alaska.gov/sf/EONR/',
    lakeDatabaseUrl: 'https://www.adfg.alaska.gov/sf/SARR/AWC/',
  },

  // Cache TTLs (seconds)
  cache: {
    fishCounts: 4 * 60 * 60, // 4 hours
    fishingReports: 24 * 60 * 60, // 24 hours
    emergencyOrders: 15 * 60, // 15 minutes
    weather: 60 * 60, // 1 hour
    tides: 24 * 60 * 60, // 24 hours
    regulations: 7 * 24 * 60 * 60, // 7 days
    lakeData: 30 * 24 * 60 * 60, // 30 days
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
  },

  // Scraping intervals (cron expressions)
  scrapeSchedule: {
    fishCounts: '0 */4 * * *', // Every 4 hours
    fishingReports: '0 6 * * *', // Daily at 6 AM
    emergencyOrders: '*/15 * * * *', // Every 15 minutes
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // CORS
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8081'],
} as const;

export type Config = typeof config;
