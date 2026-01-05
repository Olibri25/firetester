// AK FISH Trips Routes

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { ApiError } from '../middleware/errorHandler';
import { authenticate, requireSubscription } from '../middleware/auth';

const router = Router();

// Validation schemas
const createTripSchema = z.object({
  name: z.string().min(1).max(100),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  track: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
    altitude: z.number().optional(),
    accuracy: z.number().optional(),
    timestamp: z.number().optional(),
  })).optional(),
  distance: z.number().default(0),
  duration: z.number().default(0),
  conditions: z.object({
    weather: z.string().optional(),
    temperature: z.number().optional(),
    windSpeed: z.number().optional(),
    waterTemp: z.number().optional(),
    tidePhase: z.string().optional(),
    moonPhase: z.string().optional(),
    pressure: z.number().optional(),
  }).optional(),
  notes: z.string().max(5000).optional(),
  photos: z.array(z.string().url()).optional(),
  isPublic: z.boolean().default(false),
});

const updateTripSchema = createTripSchema.partial();

// GET /api/v1/trips
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { year, limit = '20', offset = '0' } = req.query;

    const trips = await prisma.trip.findMany({
      where: {
        userId: req.user!.id,
        ...(year && {
          startTime: {
            gte: new Date(parseInt(String(year)), 0, 1),
            lt: new Date(parseInt(String(year)) + 1, 0, 1),
          },
        }),
      },
      include: {
        _count: { select: { catches: true } },
      },
      orderBy: { startTime: 'desc' },
      take: parseInt(String(limit), 10),
      skip: parseInt(String(offset), 10),
    });

    const total = await prisma.trip.count({
      where: { userId: req.user!.id },
    });

    res.json({
      success: true,
      data: trips,
      meta: { total },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/trips
router.post('/', authenticate, requireSubscription('PREMIUM'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createTripSchema.parse(req.body);

    const trip = await prisma.trip.create({
      data: {
        ...data,
        startTime: new Date(data.startTime),
        endTime: data.endTime ? new Date(data.endTime) : undefined,
        userId: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      data: trip,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/trips/:id
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
      include: {
        catches: true,
      },
    });

    if (!trip) {
      throw ApiError.notFound('Trip not found');
    }

    res.json({
      success: true,
      data: trip,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/trips/:id
router.patch('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateTripSchema.parse(req.body);

    const existing = await prisma.trip.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existing) {
      throw ApiError.notFound('Trip not found');
    }

    const trip = await prisma.trip.update({
      where: { id },
      data: {
        ...data,
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime: data.endTime ? new Date(data.endTime) : undefined,
      },
    });

    res.json({
      success: true,
      data: trip,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/trips/:id
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const existing = await prisma.trip.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existing) {
      throw ApiError.notFound('Trip not found');
    }

    await prisma.trip.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Trip deleted',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/trips/:id/track
router.post('/:id/track', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { points } = req.body;

    if (!Array.isArray(points)) {
      throw ApiError.badRequest('points must be an array');
    }

    const trip = await prisma.trip.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!trip) {
      throw ApiError.notFound('Trip not found');
    }

    const existingTrack = (trip.track as any[]) || [];
    const updatedTrack = [...existingTrack, ...points];

    // Calculate distance
    let distance = trip.distance;
    for (let i = existingTrack.length; i < updatedTrack.length; i++) {
      if (i > 0) {
        distance += calculateDistance(
          updatedTrack[i - 1].latitude,
          updatedTrack[i - 1].longitude,
          updatedTrack[i].latitude,
          updatedTrack[i].longitude
        );
      }
    }

    await prisma.trip.update({
      where: { id },
      data: {
        track: updatedTrack,
        distance,
      },
    });

    res.json({
      success: true,
      data: { pointsAdded: points.length, totalPoints: updatedTrack.length, distance },
    });
  } catch (error) {
    next(error);
  }
});

// Helper function
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

export default router;
