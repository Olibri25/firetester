// AK FISH Lakes Routes

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { redis } from '../utils/redis';
import { config } from '../config';
import { ApiError } from '../middleware/errorHandler';
import { optionalAuth, authenticate } from '../middleware/auth';

const router = Router();

// GET /api/v1/lakes
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { region, species, stocked, hasBoatLaunch, limit = '50', offset = '0' } = req.query;

    const lakes = await prisma.lake.findMany({
      where: {
        ...(region && { region: String(region) }),
        ...(hasBoatLaunch !== undefined && { boatLaunchAvailable: hasBoatLaunch === 'true' }),
        ...(species && {
          species: {
            some: { species: String(species) },
          },
        }),
        ...(stocked === 'true' && {
          stockingHistory: { some: {} },
        }),
      },
      include: {
        species: true,
        _count: {
          select: { stockingHistory: true },
        },
      },
      orderBy: { name: 'asc' },
      take: parseInt(String(limit), 10),
      skip: parseInt(String(offset), 10),
    });

    const total = await prisma.lake.count({
      where: {
        ...(region && { region: String(region) }),
        ...(hasBoatLaunch !== undefined && { boatLaunchAvailable: hasBoatLaunch === 'true' }),
      },
    });

    res.json({
      success: true,
      data: lakes,
      meta: {
        total,
        limit: parseInt(String(limit), 10),
        offset: parseInt(String(offset), 10),
        hasMore: parseInt(String(offset), 10) + lakes.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/lakes/nearby
router.get('/nearby', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius = '25' } = req.query;

    if (!lat || !lng) {
      throw ApiError.badRequest('lat and lng are required');
    }

    const latitude = parseFloat(String(lat));
    const longitude = parseFloat(String(lng));
    const radiusMiles = parseFloat(String(radius));

    // In a full implementation, use PostGIS for distance queries
    // For now, do a simple bounding box filter
    const latDelta = radiusMiles / 69; // Rough conversion
    const lngDelta = radiusMiles / (69 * Math.cos(latitude * Math.PI / 180));

    const lakes = await prisma.lake.findMany({
      where: {
        latitude: {
          gte: latitude - latDelta,
          lte: latitude + latDelta,
        },
        longitude: {
          gte: longitude - lngDelta,
          lte: longitude + lngDelta,
        },
      },
      include: {
        species: true,
      },
      take: 50,
    });

    // Calculate distance and sort
    const lakesWithDistance = lakes.map(lake => ({
      ...lake,
      distance: calculateDistance(latitude, longitude, lake.latitude, lake.longitude),
    })).sort((a, b) => a.distance - b.distance);

    res.json({
      success: true,
      data: lakesWithDistance,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/lakes/search
router.get('/search', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;

    if (!q || String(q).length < 2) {
      throw ApiError.badRequest('Search query must be at least 2 characters');
    }

    const lakes = await prisma.lake.findMany({
      where: {
        OR: [
          { name: { contains: String(q), mode: 'insensitive' } },
          { alternateNames: { has: String(q) } },
        ],
      },
      include: {
        species: true,
      },
      take: 20,
    });

    res.json({
      success: true,
      data: lakes,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/lakes/:id
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const lake = await prisma.lake.findUnique({
      where: { id },
      include: {
        species: true,
        stockingHistory: {
          orderBy: { date: 'desc' },
          take: 20,
        },
        stockingSchedule: {
          where: {
            year: new Date().getFullYear(),
          },
          orderBy: { plannedDate: 'asc' },
        },
      },
    });

    if (!lake) {
      throw ApiError.notFound('Lake not found');
    }

    res.json({
      success: true,
      data: lake,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/lakes/:id/stocking
router.get('/:id/stocking', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { years = '5' } = req.query;

    const yearsBack = parseInt(String(years), 10);
    const startYear = new Date().getFullYear() - yearsBack;

    const stockingHistory = await prisma.stockingRecord.findMany({
      where: {
        lakeId: id,
        date: { gte: new Date(startYear, 0, 1) },
      },
      orderBy: { date: 'desc' },
    });

    const upcomingStocking = await prisma.stockingSchedule.findMany({
      where: {
        lakeId: id,
        status: 'SCHEDULED',
        plannedDate: { gte: new Date() },
      },
      orderBy: { plannedDate: 'asc' },
    });

    res.json({
      success: true,
      data: {
        history: stockingHistory,
        upcoming: upcomingStocking,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/lakes/:id/favorite
router.post('/:id/favorite', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Verify lake exists
    const lake = await prisma.lake.findUnique({ where: { id } });
    if (!lake) {
      throw ApiError.notFound('Lake not found');
    }

    await prisma.favoriteLake.upsert({
      where: {
        userId_lakeId: {
          userId: req.user!.id,
          lakeId: id,
        },
      },
      update: {},
      create: {
        userId: req.user!.id,
        lakeId: id,
      },
    });

    res.json({
      success: true,
      message: 'Lake added to favorites',
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/lakes/:id/favorite
router.delete('/:id/favorite', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.favoriteLake.deleteMany({
      where: {
        userId: req.user!.id,
        lakeId: id,
      },
    });

    res.json({
      success: true,
      message: 'Lake removed from favorites',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/lakes/stocking/recent
router.get('/stocking/recent', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = '30' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(String(days), 10));

    const recentStocking = await prisma.stockingRecord.findMany({
      where: {
        date: { gte: daysAgo },
      },
      include: {
        lake: {
          select: {
            id: true,
            name: true,
            region: true,
            latitude: true,
            longitude: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json({
      success: true,
      data: recentStocking,
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to calculate distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default router;
