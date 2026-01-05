// AK FISH Weather Routes

import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { redis } from '../utils/redis';
import { config } from '../config';
import { ApiError } from '../middleware/errorHandler';
import { optionalAuth } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/v1/weather/current
router.get('/current', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      throw ApiError.badRequest('lat and lng are required');
    }

    const latitude = parseFloat(String(lat));
    const longitude = parseFloat(String(lng));

    // Try cache
    const cacheKey = `weather:current:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, meta: { cached: true } });
    }

    // Fetch from NWS API
    try {
      // First get the grid point
      const pointsResponse = await axios.get(
        `${config.nwsWeatherUrl}/points/${latitude},${longitude}`,
        { headers: { 'User-Agent': 'AK-FISH-App' } }
      );

      const forecastUrl = pointsResponse.data.properties.forecast;
      const forecastResponse = await axios.get(forecastUrl, {
        headers: { 'User-Agent': 'AK-FISH-App' },
      });

      const currentPeriod = forecastResponse.data.properties.periods[0];

      const weatherData = {
        location: { latitude, longitude },
        timestamp: new Date().toISOString(),
        temperature: currentPeriod.temperature,
        temperatureUnit: currentPeriod.temperatureUnit,
        windSpeed: currentPeriod.windSpeed,
        windDirection: currentPeriod.windDirection,
        conditions: currentPeriod.shortForecast,
        detailedForecast: currentPeriod.detailedForecast,
        icon: currentPeriod.icon,
        isDaytime: currentPeriod.isDaytime,
      };

      // Cache for 1 hour
      await redis.set(cacheKey, weatherData, config.cache.weather);

      res.json({
        success: true,
        data: weatherData,
      });
    } catch (apiError: any) {
      logger.error('NWS API error:', apiError.message);

      // Return mock data if API fails
      res.json({
        success: true,
        data: {
          location: { latitude, longitude },
          timestamp: new Date().toISOString(),
          temperature: 55,
          temperatureUnit: 'F',
          windSpeed: '10 mph',
          windDirection: 'SW',
          conditions: 'Partly Cloudy',
          detailedForecast: 'Weather data temporarily unavailable',
          isDaytime: true,
        },
        meta: { fallback: true },
      });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/weather/forecast
router.get('/forecast', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      throw ApiError.badRequest('lat and lng are required');
    }

    const latitude = parseFloat(String(lat));
    const longitude = parseFloat(String(lng));

    // Try cache
    const cacheKey = `weather:forecast:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, meta: { cached: true } });
    }

    try {
      // Get grid point
      const pointsResponse = await axios.get(
        `${config.nwsWeatherUrl}/points/${latitude},${longitude}`,
        { headers: { 'User-Agent': 'AK-FISH-App' } }
      );

      const forecastUrl = pointsResponse.data.properties.forecast;
      const forecastResponse = await axios.get(forecastUrl, {
        headers: { 'User-Agent': 'AK-FISH-App' },
      });

      const periods = forecastResponse.data.properties.periods;

      const forecast = {
        location: { latitude, longitude },
        generatedAt: new Date().toISOString(),
        periods: periods.map((p: any) => ({
          name: p.name,
          startTime: p.startTime,
          endTime: p.endTime,
          temperature: p.temperature,
          temperatureUnit: p.temperatureUnit,
          windSpeed: p.windSpeed,
          windDirection: p.windDirection,
          conditions: p.shortForecast,
          detailedForecast: p.detailedForecast,
          icon: p.icon,
          isDaytime: p.isDaytime,
        })),
      };

      // Cache for 1 hour
      await redis.set(cacheKey, forecast, config.cache.weather);

      res.json({
        success: true,
        data: forecast,
      });
    } catch (apiError: any) {
      logger.error('NWS API error:', apiError.message);

      res.json({
        success: true,
        data: {
          location: { latitude, longitude },
          generatedAt: new Date().toISOString(),
          periods: [],
        },
        meta: { fallback: true },
      });
    }
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/weather/solunar
router.get('/solunar', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, date } = req.query;

    if (!lat || !lng) {
      throw ApiError.badRequest('lat and lng are required');
    }

    const targetDate = date ? new Date(String(date)) : new Date();

    // Calculate solunar data (simplified algorithm)
    const solunarData = calculateSolunar(
      parseFloat(String(lat)),
      parseFloat(String(lng)),
      targetDate
    );

    res.json({
      success: true,
      data: solunarData,
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to calculate solunar data (simplified)
function calculateSolunar(lat: number, lng: number, date: Date) {
  // This is a simplified calculation - a real implementation would use
  // proper astronomical algorithms
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );

  // Moon phase calculation (approximate)
  const lunarCycle = 29.53058867;
  const knownNewMoon = new Date('2024-01-11').getTime();
  const daysSinceNewMoon = (date.getTime() - knownNewMoon) / 86400000;
  const moonAge = daysSinceNewMoon % lunarCycle;
  const moonIllumination = Math.abs(Math.cos(moonAge / lunarCycle * 2 * Math.PI));

  // Moon phase name
  let moonPhase: string;
  if (moonAge < 1.85) moonPhase = 'New Moon';
  else if (moonAge < 7.38) moonPhase = 'Waxing Crescent';
  else if (moonAge < 9.23) moonPhase = 'First Quarter';
  else if (moonAge < 14.77) moonPhase = 'Waxing Gibbous';
  else if (moonAge < 16.61) moonPhase = 'Full Moon';
  else if (moonAge < 22.15) moonPhase = 'Waning Gibbous';
  else if (moonAge < 24.00) moonPhase = 'Last Quarter';
  else moonPhase = 'Waning Crescent';

  // Major and minor periods (simplified - based on moonrise/set times)
  const baseHour = (lng / 15 + 12) % 24;
  const majorPeriods = [
    {
      start: formatTime(baseHour),
      end: formatTime(baseHour + 2),
      type: 'major' as const,
    },
    {
      start: formatTime((baseHour + 12) % 24),
      end: formatTime((baseHour + 14) % 24),
      type: 'major' as const,
    },
  ];

  const minorPeriods = [
    {
      start: formatTime((baseHour + 6) % 24),
      end: formatTime((baseHour + 7) % 24),
      type: 'minor' as const,
    },
    {
      start: formatTime((baseHour + 18) % 24),
      end: formatTime((baseHour + 19) % 24),
      type: 'minor' as const,
    },
  ];

  // Rating based on moon phase (new and full moons are best)
  const rating = moonAge < 3 || moonAge > 27 || (moonAge > 13 && moonAge < 17) ? 5 :
                 moonAge < 7 || (moonAge > 10 && moonAge < 20) ? 3 : 2;

  return {
    date: date.toISOString().split('T')[0],
    location: { latitude: lat, longitude: lng },
    majorPeriods,
    minorPeriods,
    moonPhase,
    moonIllumination: Math.round(moonIllumination * 100),
    rating,
  };
}

function formatTime(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.round((hour - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export default router;
