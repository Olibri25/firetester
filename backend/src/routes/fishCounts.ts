// AK FISH Fish Count Routes

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { redis } from '../utils/redis';
import { config } from '../config';
import { ApiError } from '../middleware/errorHandler';
import { optionalAuth, authenticate } from '../middleware/auth';

const router = Router();

// GET /api/v1/fish-counts/stations
router.get('/stations', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { region, river, active } = req.query;

    // Try cache first
    const cacheKey = `fish-stations:${region || 'all'}:${river || 'all'}:${active || 'all'}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, meta: { cached: true } });
    }

    const stations = await prisma.fishCountStation.findMany({
      where: {
        ...(region && { region: String(region) }),
        ...(river && { river: String(river) }),
        ...(active !== undefined && { isActive: active === 'true' }),
      },
      orderBy: { name: 'asc' },
    });

    // Cache for 1 hour
    await redis.set(cacheKey, stations, 3600);

    res.json({
      success: true,
      data: stations,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/fish-counts/stations/:id
router.get('/stations/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const station = await prisma.fishCountStation.findUnique({
      where: { id },
      include: {
        counts: {
          orderBy: { date: 'desc' },
          take: 30,
        },
      },
    });

    if (!station) {
      throw ApiError.notFound('Station not found');
    }

    res.json({
      success: true,
      data: station,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/fish-counts/latest
router.get('/latest', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stationId, species, limit = '10' } = req.query;

    // Try cache
    const cacheKey = `fish-counts:latest:${stationId || 'all'}:${species || 'all'}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, meta: { cached: true } });
    }

    const counts = await prisma.fishCount.findMany({
      where: {
        ...(stationId && { stationId: String(stationId) }),
        ...(species && { species: String(species) }),
      },
      include: {
        station: {
          select: {
            id: true,
            name: true,
            river: true,
            region: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: parseInt(String(limit), 10),
    });

    // Cache for fish count TTL
    await redis.set(cacheKey, counts, config.cache.fishCounts);

    res.json({
      success: true,
      data: counts,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/fish-counts/summary
router.get('/summary', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(String(date)) : new Date();

    // Try cache
    const cacheKey = `fish-counts:summary:${targetDate.toISOString().split('T')[0]}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, meta: { cached: true } });
    }

    // Get latest count for each active station
    const stations = await prisma.fishCountStation.findMany({
      where: { isActive: true },
      include: {
        counts: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    const summary = stations.map(station => ({
      stationId: station.id,
      stationName: station.name,
      river: station.river,
      region: station.region,
      latitude: station.latitude,
      longitude: station.longitude,
      latestCount: station.counts[0] || null,
    }));

    await redis.set(cacheKey, summary, config.cache.fishCounts);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/fish-counts/history/:stationId
router.get('/history/:stationId', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stationId } = req.params;
    const { species, year, startDate, endDate } = req.query;

    const currentYear = new Date().getFullYear();
    const targetYear = year ? parseInt(String(year), 10) : currentYear;

    // Calculate date range
    const start = startDate
      ? new Date(String(startDate))
      : new Date(targetYear, 0, 1); // Jan 1
    const end = endDate
      ? new Date(String(endDate))
      : new Date(targetYear, 11, 31); // Dec 31

    const counts = await prisma.fishCount.findMany({
      where: {
        stationId,
        ...(species && { species: String(species) }),
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Also get historical comparison data
    const historical = await prisma.historicalFishCount.findMany({
      where: {
        stationId,
        ...(species && { species: String(species) }),
      },
      orderBy: { year: 'desc' },
      take: 5,
    });

    res.json({
      success: true,
      data: {
        counts,
        historical,
        station: await prisma.fishCountStation.findUnique({
          where: { id: stationId },
        }),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/fish-counts/compare
router.get('/compare', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stationId, species } = req.query;

    if (!stationId || !species) {
      throw ApiError.badRequest('stationId and species are required');
    }

    const currentYear = new Date().getFullYear();

    // Get current year counts
    const currentCounts = await prisma.fishCount.findMany({
      where: {
        stationId: String(stationId),
        species: String(species),
        date: {
          gte: new Date(currentYear, 0, 1),
        },
      },
      orderBy: { date: 'asc' },
    });

    // Get last year counts
    const lastYearCounts = await prisma.fishCount.findMany({
      where: {
        stationId: String(stationId),
        species: String(species),
        date: {
          gte: new Date(currentYear - 1, 0, 1),
          lt: new Date(currentYear, 0, 1),
        },
      },
      orderBy: { date: 'asc' },
    });

    // Get 5-year average
    const historicalData = await prisma.historicalFishCount.findMany({
      where: {
        stationId: String(stationId),
        species: String(species),
        year: {
          gte: currentYear - 5,
          lt: currentYear,
        },
      },
    });

    const fiveYearAvg = historicalData.length > 0
      ? historicalData.reduce((sum, h) => sum + h.totalCount, 0) / historicalData.length
      : null;

    res.json({
      success: true,
      data: {
        currentYear: {
          year: currentYear,
          counts: currentCounts,
          total: currentCounts.reduce((sum, c) => sum + c.dailyCount, 0),
        },
        lastYear: {
          year: currentYear - 1,
          counts: lastYearCounts,
          total: lastYearCounts.reduce((sum, c) => sum + c.dailyCount, 0),
        },
        fiveYearAverage: fiveYearAvg,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/fish-counts/favorite/:stationId
router.post('/favorite/:stationId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stationId } = req.params;

    // Verify station exists
    const station = await prisma.fishCountStation.findUnique({
      where: { id: stationId },
    });

    if (!station) {
      throw ApiError.notFound('Station not found');
    }

    // Add to favorites
    await prisma.favoriteStation.upsert({
      where: {
        userId_stationId: {
          userId: req.user!.id,
          stationId,
        },
      },
      update: {},
      create: {
        userId: req.user!.id,
        stationId,
      },
    });

    res.json({
      success: true,
      message: 'Station added to favorites',
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/fish-counts/favorite/:stationId
router.delete('/favorite/:stationId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stationId } = req.params;

    await prisma.favoriteStation.deleteMany({
      where: {
        userId: req.user!.id,
        stationId,
      },
    });

    res.json({
      success: true,
      message: 'Station removed from favorites',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
