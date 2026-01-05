// AK FISH User Routes

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { ApiError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();

// Update preferences schema
const updatePreferencesSchema = z.object({
  defaultMapStyle: z.enum(['satellite', 'topo', 'hybrid', 'nautical']).optional(),
  units: z.enum(['imperial', 'metric']).optional(),
  darkMode: z.enum(['auto', 'light', 'dark']).optional(),
  notifications: z.object({
    emergencyOrders: z.boolean().optional(),
    fishCountAlerts: z.boolean().optional(),
    stockingAlerts: z.boolean().optional(),
    weatherAlerts: z.boolean().optional(),
    runTimingAlerts: z.boolean().optional(),
  }).optional(),
  favoriteSpecies: z.array(z.string()).optional(),
  homeLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
});

// Update profile schema
const updateProfileSchema = z.object({
  displayName: z.string().min(2).optional(),
  avatarUrl: z.string().url().optional(),
});

// GET /api/v1/users/profile
router.get('/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        subscriptionTier: true,
        subscriptionExpires: true,
        preferences: true,
        createdAt: true,
        _count: {
          select: {
            waypoints: true,
            trips: true,
            catches: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/users/profile
router.patch('/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = updateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        subscriptionTier: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/users/preferences
router.patch('/preferences', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newPreferences = updatePreferencesSchema.parse(req.body);

    // Get current preferences
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { preferences: true },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Merge preferences
    const currentPrefs = user.preferences as Record<string, unknown>;
    const mergedPreferences = {
      ...currentPrefs,
      ...newPreferences,
      notifications: {
        ...(currentPrefs.notifications as Record<string, boolean> || {}),
        ...(newPreferences.notifications || {}),
      },
    };

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: { preferences: mergedPreferences },
      select: { preferences: true },
    });

    res.json({
      success: true,
      data: updatedUser.preferences,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/users/stats
router.get('/stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Get user stats
    const [catchStats, tripStats, waypointCount] = await Promise.all([
      // Catch statistics
      prisma.catch.groupBy({
        by: ['species'],
        where: { userId },
        _count: { id: true },
      }),
      // Trip statistics
      prisma.trip.aggregate({
        where: { userId },
        _count: { id: true },
        _sum: { distance: true, duration: true },
      }),
      // Waypoint count
      prisma.waypoint.count({
        where: { userId },
      }),
    ]);

    // Get personal bests
    const personalBests = await prisma.catch.findMany({
      where: { userId, length: { not: null } },
      orderBy: { length: 'desc' },
      take: 10,
      select: {
        species: true,
        length: true,
        weight: true,
        timestamp: true,
      },
    });

    res.json({
      success: true,
      data: {
        catches: {
          total: catchStats.reduce((acc, s) => acc + s._count.id, 0),
          bySpecies: catchStats.map(s => ({
            species: s.species,
            count: s._count.id,
          })),
        },
        trips: {
          total: tripStats._count.id,
          totalDistance: tripStats._sum.distance || 0,
          totalDuration: tripStats._sum.duration || 0,
        },
        waypoints: waypointCount,
        personalBests,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/users/push-token
router.post('/push-token', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, platform } = req.body;

    if (!token || !platform) {
      throw ApiError.badRequest('Token and platform are required');
    }

    if (!['IOS', 'ANDROID'].includes(platform)) {
      throw ApiError.badRequest('Invalid platform');
    }

    // Upsert push token
    await prisma.pushToken.upsert({
      where: { token },
      update: {
        userId: req.user!.id,
        platform,
        isActive: true,
      },
      create: {
        userId: req.user!.id,
        token,
        platform,
        isActive: true,
      },
    });

    res.json({
      success: true,
      message: 'Push token registered',
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/users/push-token
router.delete('/push-token', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;

    if (!token) {
      throw ApiError.badRequest('Token is required');
    }

    await prisma.pushToken.updateMany({
      where: {
        token,
        userId: req.user!.id,
      },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'Push token deactivated',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
