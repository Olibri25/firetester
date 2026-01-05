// AK FISH Regulations Routes

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { redis } from '../utils/redis';
import { config } from '../config';
import { ApiError } from '../middleware/errorHandler';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// GET /api/v1/regulations
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { area, waterBody, species, limit = '50', offset = '0' } = req.query;

    const regulations = await prisma.regulation.findMany({
      where: {
        ...(area && { area: { contains: String(area), mode: 'insensitive' } }),
        ...(waterBody && { waterBody: { contains: String(waterBody), mode: 'insensitive' } }),
        ...(species && { species: String(species) }),
      },
      orderBy: { area: 'asc' },
      take: parseInt(String(limit), 10),
      skip: parseInt(String(offset), 10),
    });

    res.json({
      success: true,
      data: regulations,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/regulations/location/:lat/:lng
router.get('/location/:lat/:lng', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng } = req.params;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw ApiError.badRequest('Invalid coordinates');
    }

    // Try cache
    const cacheKey = `regulations:${latitude.toFixed(3)}:${longitude.toFixed(3)}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, meta: { cached: true } });
    }

    // In a full implementation, use PostGIS to find regulations by location
    // For now, return a sample response
    const regulations = await prisma.regulation.findMany({
      take: 10,
      orderBy: { lastUpdated: 'desc' },
    });

    // Cache for regulation TTL
    await redis.set(cacheKey, regulations, config.cache.regulations);

    res.json({
      success: true,
      data: regulations,
      meta: {
        location: { latitude, longitude },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/regulations/search
router.get('/search', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;

    if (!q || String(q).length < 2) {
      throw ApiError.badRequest('Search query must be at least 2 characters');
    }

    const regulations = await prisma.regulation.findMany({
      where: {
        OR: [
          { area: { contains: String(q), mode: 'insensitive' } },
          { waterBody: { contains: String(q), mode: 'insensitive' } },
          { plainEnglishSummary: { contains: String(q), mode: 'insensitive' } },
        ],
      },
      take: 20,
    });

    res.json({
      success: true,
      data: regulations,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/regulations/:id
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const regulation = await prisma.regulation.findUnique({
      where: { id },
    });

    if (!regulation) {
      throw ApiError.notFound('Regulation not found');
    }

    res.json({
      success: true,
      data: regulation,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
