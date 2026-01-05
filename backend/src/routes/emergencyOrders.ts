// AK FISH Emergency Orders Routes

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { redis } from '../utils/redis';
import { config } from '../config';
import { ApiError } from '../middleware/errorHandler';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// GET /api/v1/emergency-orders
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { active, region, species, type, limit = '50', offset = '0' } = req.query;

    // Try cache for active orders
    if (active === 'true' && !region && !species && !type) {
      const cacheKey = 'emergency-orders:active';
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({ success: true, data: cached, meta: { cached: true } });
      }
    }

    const orders = await prisma.emergencyOrder.findMany({
      where: {
        ...(active !== undefined && { isActive: active === 'true' }),
        ...(region && { affectedAreas: { has: String(region) } }),
        ...(species && { affectedSpecies: { has: String(species) } }),
        ...(type && { type: type as any }),
      },
      orderBy: { publishedAt: 'desc' },
      take: parseInt(String(limit), 10),
      skip: parseInt(String(offset), 10),
    });

    // Cache active orders
    if (active === 'true' && !region && !species && !type) {
      await redis.set('emergency-orders:active', orders, config.cache.emergencyOrders);
    }

    const total = await prisma.emergencyOrder.count({
      where: {
        ...(active !== undefined && { isActive: active === 'true' }),
        ...(region && { affectedAreas: { has: String(region) } }),
        ...(species && { affectedSpecies: { has: String(species) } }),
        ...(type && { type: type as any }),
      },
    });

    res.json({
      success: true,
      data: orders,
      meta: {
        total,
        limit: parseInt(String(limit), 10),
        offset: parseInt(String(offset), 10),
        hasMore: parseInt(String(offset), 10) + orders.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/emergency-orders/:id
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const order = await prisma.emergencyOrder.findUnique({
      where: { id },
    });

    if (!order) {
      throw ApiError.notFound('Emergency order not found');
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/emergency-orders/location/:lat/:lng
router.get('/location/:lat/:lng', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng } = req.params;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw ApiError.badRequest('Invalid coordinates');
    }

    // For now, return all active orders
    // In a full implementation, you'd use PostGIS to filter by location
    const orders = await prisma.emergencyOrder.findMany({
      where: { isActive: true },
      orderBy: { effectiveDate: 'desc' },
    });

    res.json({
      success: true,
      data: orders,
      meta: {
        location: { latitude, longitude },
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/emergency-orders/recent
router.get('/feed/recent', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = '7' } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(String(days), 10));

    const orders = await prisma.emergencyOrder.findMany({
      where: {
        publishedAt: { gte: daysAgo },
      },
      orderBy: { publishedAt: 'desc' },
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
