// AK FISH Catches Routes

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { ApiError } from '../middleware/errorHandler';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Validation schemas
const createCatchSchema = z.object({
  tripId: z.string().uuid().optional(),
  species: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timestamp: z.string().datetime(),
  length: z.number().positive().optional(),
  weight: z.number().positive().optional(),
  kept: z.boolean().default(false),
  lure: z.string().max(100).optional(),
  technique: z.string().max(100).optional(),
  depth: z.number().positive().optional(),
  waterTemp: z.number().optional(),
  notes: z.string().max(1000).optional(),
  photos: z.array(z.string().url()).optional(),
  isPublic: z.boolean().default(false),
});

const updateCatchSchema = createCatchSchema.partial();

// GET /api/v1/catches
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { species, year, tripId, kept, limit = '50', offset = '0' } = req.query;

    const catches = await prisma.catch.findMany({
      where: {
        userId: req.user!.id,
        ...(species && { species: String(species) }),
        ...(tripId && { tripId: String(tripId) }),
        ...(kept !== undefined && { kept: kept === 'true' }),
        ...(year && {
          timestamp: {
            gte: new Date(parseInt(String(year)), 0, 1),
            lt: new Date(parseInt(String(year)) + 1, 0, 1),
          },
        }),
      },
      orderBy: { timestamp: 'desc' },
      take: parseInt(String(limit), 10),
      skip: parseInt(String(offset), 10),
    });

    const total = await prisma.catch.count({
      where: { userId: req.user!.id },
    });

    res.json({
      success: true,
      data: catches,
      meta: { total },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/catches/stats
router.get('/stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { year } = req.query;
    const userId = req.user!.id;

    const dateFilter = year ? {
      timestamp: {
        gte: new Date(parseInt(String(year)), 0, 1),
        lt: new Date(parseInt(String(year)) + 1, 0, 1),
      },
    } : {};

    // Get species breakdown
    const speciesStats = await prisma.catch.groupBy({
      by: ['species'],
      where: { userId, ...dateFilter },
      _count: { id: true },
      _sum: { weight: true },
    });

    // Get kept vs released
    const keptStats = await prisma.catch.groupBy({
      by: ['kept'],
      where: { userId, ...dateFilter },
      _count: { id: true },
    });

    // Get monthly trends
    const catches = await prisma.catch.findMany({
      where: { userId, ...dateFilter },
      select: { timestamp: true },
    });

    const monthlyTrends: Record<string, number> = {};
    catches.forEach(c => {
      const month = c.timestamp.toISOString().slice(0, 7);
      monthlyTrends[month] = (monthlyTrends[month] || 0) + 1;
    });

    // Get personal bests
    const personalBests = await prisma.catch.findMany({
      where: { userId },
      orderBy: [{ length: 'desc' }],
      distinct: ['species'],
      take: 10,
    });

    // Get top lures
    const lureStats = await prisma.catch.groupBy({
      by: ['lure'],
      where: { userId, lure: { not: null }, ...dateFilter },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    res.json({
      success: true,
      data: {
        totalCatches: catches.length,
        bySpecies: speciesStats.map(s => ({
          species: s.species,
          count: s._count.id,
          totalWeight: s._sum.weight,
        })),
        kept: keptStats.find(k => k.kept)?._count.id || 0,
        released: keptStats.find(k => !k.kept)?._count.id || 0,
        monthlyTrends: Object.entries(monthlyTrends).map(([month, count]) => ({
          month,
          count,
        })),
        personalBests: personalBests.map(pb => ({
          species: pb.species,
          length: pb.length,
          weight: pb.weight,
          date: pb.timestamp,
        })),
        topLures: lureStats.map(l => ({
          lure: l.lure,
          catches: l._count.id,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/catches/feed
router.get('/feed', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { region, species, limit = '20' } = req.query;

    // Get recent public catches (anonymized)
    const catches = await prisma.catch.findMany({
      where: {
        isPublic: true,
        ...(species && { species: String(species) }),
      },
      select: {
        species: true,
        timestamp: true,
        length: true,
        weight: true,
        lure: true,
        technique: true,
        // Don't expose exact location
        latitude: false,
        longitude: false,
      },
      orderBy: { timestamp: 'desc' },
      take: parseInt(String(limit), 10),
    });

    res.json({
      success: true,
      data: catches,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/catches
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createCatchSchema.parse(req.body);

    // Check catch log limit for free tier
    if (req.user!.subscriptionTier === 'FREE') {
      const count = await prisma.catch.count({
        where: { userId: req.user!.id },
      });

      if (count >= 10) {
        throw ApiError.forbidden('Free tier limited to 10 catch log entries. Upgrade to Premium for unlimited logging.');
      }
    }

    const catchEntry = await prisma.catch.create({
      data: {
        ...data,
        timestamp: new Date(data.timestamp),
        userId: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      data: catchEntry,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/catches/:id
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const catchEntry = await prisma.catch.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        trip: {
          select: { id: true, name: true, startTime: true },
        },
      },
    });

    if (!catchEntry) {
      throw ApiError.notFound('Catch not found');
    }

    res.json({
      success: true,
      data: catchEntry,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/catches/:id
router.patch('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateCatchSchema.parse(req.body);

    const existing = await prisma.catch.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existing) {
      throw ApiError.notFound('Catch not found');
    }

    const catchEntry = await prisma.catch.update({
      where: { id },
      data: {
        ...data,
        timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
      },
    });

    res.json({
      success: true,
      data: catchEntry,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/catches/:id
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await prisma.catch.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existing) {
      throw ApiError.notFound('Catch not found');
    }

    await prisma.catch.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Catch deleted',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
