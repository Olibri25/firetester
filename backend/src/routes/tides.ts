// AK FISH Tides Routes

import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { redis } from '../utils/redis';
import { config } from '../config';
import { ApiError } from '../middleware/errorHandler';
import { optionalAuth } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Alaska tide stations
const ALASKA_TIDE_STATIONS = [
  { id: '9455920', name: 'Anchorage', lat: 61.2381, lng: -149.8903 },
  { id: '9455500', name: 'Seldovia', lat: 59.4406, lng: -151.7208 },
  { id: '9455760', name: 'Nikiski', lat: 60.6833, lng: -151.3983 },
  { id: '9455090', name: 'Seward', lat: 60.1203, lng: -149.4269 },
  { id: '9457292', name: 'Valdez', lat: 61.1247, lng: -146.3628 },
  { id: '9457804', name: 'Cordova', lat: 60.5575, lng: -145.7553 },
  { id: '9452210', name: 'Juneau', lat: 58.2989, lng: -134.4117 },
  { id: '9450460', name: 'Ketchikan', lat: 55.3319, lng: -131.6261 },
  { id: '9452400', name: 'Sitka', lat: 57.0517, lng: -135.3414 },
  { id: '9459450', name: 'Homer', lat: 59.6017, lng: -151.4183 },
];

// GET /api/v1/tides/stations
router.get('/stations', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: ALASKA_TIDE_STATIONS,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/tides/predictions
router.get('/predictions', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stationId, date, days = '7' } = req.query;

    if (!stationId) {
      throw ApiError.badRequest('stationId is required');
    }

    const station = ALASKA_TIDE_STATIONS.find(s => s.id === stationId);
    if (!station) {
      throw ApiError.notFound('Station not found');
    }

    const startDate = date ? new Date(String(date)) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + parseInt(String(days), 10));

    // Format dates for NOAA API
    const beginDate = formatNoaaDate(startDate);
    const endDateStr = formatNoaaDate(endDate);

    // Try cache
    const cacheKey = `tides:${stationId}:${beginDate}:${endDateStr}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, meta: { cached: true } });
    }

    try {
      const response = await axios.get(config.noaaTidesUrl, {
        params: {
          begin_date: beginDate,
          end_date: endDateStr,
          station: stationId,
          product: 'predictions',
          datum: 'MLLW',
          units: 'english',
          time_zone: 'lst_ldt',
          application: 'AK_FISH',
          format: 'json',
          interval: 'hilo', // High/low only
        },
      });

      const predictions = response.data.predictions || [];

      const tideData = {
        stationId,
        stationName: station.name,
        location: { latitude: station.lat, longitude: station.lng },
        predictions: predictions.map((p: any) => ({
          timestamp: p.t,
          height: parseFloat(p.v),
          type: p.type === 'H' ? 'high' : 'low',
        })),
      };

      // Cache for 24 hours
      await redis.set(cacheKey, tideData, config.cache.tides);

      res.json({
        success: true,
        data: tideData,
      });
    } catch (apiError: any) {
      logger.error('NOAA Tides API error:', apiError.message);

      // Return mock data
      res.json({
        success: true,
        data: {
          stationId,
          stationName: station.name,
          location: { latitude: station.lat, longitude: station.lng },
          predictions: generateMockTides(startDate, parseInt(String(days), 10)),
        },
        meta: { fallback: true },
      });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/tides/nearest
router.get('/nearest', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      throw ApiError.badRequest('lat and lng are required');
    }

    const latitude = parseFloat(String(lat));
    const longitude = parseFloat(String(lng));

    // Find nearest station
    let nearestStation = ALASKA_TIDE_STATIONS[0];
    let minDistance = Infinity;

    for (const station of ALASKA_TIDE_STATIONS) {
      const distance = calculateDistance(latitude, longitude, station.lat, station.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestStation = station;
      }
    }

    res.json({
      success: true,
      data: {
        ...nearestStation,
        distance: Math.round(minDistance * 10) / 10,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/tides/current
router.get('/current', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stationId } = req.query;

    if (!stationId) {
      throw ApiError.badRequest('stationId is required');
    }

    const station = ALASKA_TIDE_STATIONS.find(s => s.id === stationId);
    if (!station) {
      throw ApiError.notFound('Station not found');
    }

    // Get today's predictions
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const beginDate = formatNoaaDate(today);
    const endDate = formatNoaaDate(tomorrow);

    try {
      const response = await axios.get(config.noaaTidesUrl, {
        params: {
          begin_date: beginDate,
          end_date: endDate,
          station: stationId,
          product: 'predictions',
          datum: 'MLLW',
          units: 'english',
          time_zone: 'lst_ldt',
          application: 'AK_FISH',
          format: 'json',
          interval: 'hilo',
        },
      });

      const predictions = response.data.predictions || [];
      const now = new Date();

      // Find next high and low
      const upcoming = predictions
        .map((p: any) => ({
          timestamp: new Date(p.t),
          height: parseFloat(p.v),
          type: p.type === 'H' ? 'high' : 'low',
        }))
        .filter((p: any) => p.timestamp > now)
        .slice(0, 4);

      // Determine current tide phase
      const nextTide = upcoming[0];
      const tidePhase = nextTide?.type === 'high' ? 'rising' : 'falling';

      res.json({
        success: true,
        data: {
          stationId,
          stationName: station.name,
          currentPhase: tidePhase,
          upcoming,
        },
      });
    } catch (apiError: any) {
      logger.error('NOAA Tides API error:', apiError.message);

      res.json({
        success: true,
        data: {
          stationId,
          stationName: station.name,
          currentPhase: 'unknown',
          upcoming: [],
        },
        meta: { fallback: true },
      });
    }
  } catch (error) {
    next(error);
  }
});

// Helper functions
function formatNoaaDate(date: Date): string {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function generateMockTides(startDate: Date, days: number): any[] {
  const predictions = [];
  const baseDate = new Date(startDate);

  for (let d = 0; d < days; d++) {
    // Two high and two low tides per day (approximately)
    const dayStart = new Date(baseDate);
    dayStart.setDate(dayStart.getDate() + d);

    predictions.push(
      {
        timestamp: new Date(dayStart.setHours(3, 30)).toISOString(),
        height: 18.5 + Math.random() * 3,
        type: 'high',
      },
      {
        timestamp: new Date(dayStart.setHours(9, 45)).toISOString(),
        height: -1.5 + Math.random() * 2,
        type: 'low',
      },
      {
        timestamp: new Date(dayStart.setHours(15, 50)).toISOString(),
        height: 16.5 + Math.random() * 3,
        type: 'high',
      },
      {
        timestamp: new Date(dayStart.setHours(22, 15)).toISOString(),
        height: 0.5 + Math.random() * 2,
        type: 'low',
      }
    );
  }

  return predictions;
}

export default router;
