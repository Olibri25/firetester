// AK FISH Waypoints Routes

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/db';
import { ApiError } from '../middleware/errorHandler';
import { authenticate, requireSubscription } from '../middleware/auth';

const router = Router();

// Validation schemas
const createWaypointSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(['HOT_SPOT', 'CAMP_SITE', 'BOAT_LAUNCH', 'HAZARD', 'FISH_ON', 'PARKING', 'TRAILHEAD', 'CUSTOM']),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  description: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  photos: z.array(z.string().url()).optional(),
  isPrivate: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
});

const updateWaypointSchema = createWaypointSchema.partial();

// GET /api/v1/waypoints
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, tag, limit = '100', offset = '0' } = req.query;

    const waypoints = await prisma.waypoint.findMany({
      where: {
        userId: req.user!.id,
        ...(type && { type: type as any }),
        ...(tag && { tags: { has: String(tag) } }),
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(String(limit), 10),
      skip: parseInt(String(offset), 10),
    });

    const total = await prisma.waypoint.count({
      where: { userId: req.user!.id },
    });

    res.json({
      success: true,
      data: waypoints,
      meta: {
        total,
        limit: parseInt(String(limit), 10),
        offset: parseInt(String(offset), 10),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/waypoints/nearby
router.get('/nearby', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius = '10' } = req.query;

    if (!lat || !lng) {
      throw ApiError.badRequest('lat and lng are required');
    }

    const latitude = parseFloat(String(lat));
    const longitude = parseFloat(String(lng));
    const radiusMiles = parseFloat(String(radius));

    const latDelta = radiusMiles / 69;
    const lngDelta = radiusMiles / (69 * Math.cos(latitude * Math.PI / 180));

    const waypoints = await prisma.waypoint.findMany({
      where: {
        userId: req.user!.id,
        latitude: {
          gte: latitude - latDelta,
          lte: latitude + latDelta,
        },
        longitude: {
          gte: longitude - lngDelta,
          lte: longitude + lngDelta,
        },
      },
    });

    res.json({
      success: true,
      data: waypoints,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/waypoints
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createWaypointSchema.parse(req.body);

    // Check waypoint limit for free tier
    if (req.user!.subscriptionTier === 'FREE') {
      const count = await prisma.waypoint.count({
        where: { userId: req.user!.id },
      });

      if (count >= 5) {
        throw ApiError.forbidden('Free tier limited to 5 waypoints. Upgrade to Premium for unlimited waypoints.');
      }
    }

    const waypoint = await prisma.waypoint.create({
      data: {
        ...data,
        userId: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      data: waypoint,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/waypoints/:id
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const waypoint = await prisma.waypoint.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!waypoint) {
      throw ApiError.notFound('Waypoint not found');
    }

    res.json({
      success: true,
      data: waypoint,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/v1/waypoints/:id
router.patch('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateWaypointSchema.parse(req.body);

    // Verify ownership
    const existing = await prisma.waypoint.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existing) {
      throw ApiError.notFound('Waypoint not found');
    }

    const waypoint = await prisma.waypoint.update({
      where: { id },
      data,
    });

    res.json({
      success: true,
      data: waypoint,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/v1/waypoints/:id
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const existing = await prisma.waypoint.findFirst({
      where: { id, userId: req.user!.id },
    });

    if (!existing) {
      throw ApiError.notFound('Waypoint not found');
    }

    await prisma.waypoint.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Waypoint deleted',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/waypoints/import
router.post('/import', authenticate, requireSubscription('PREMIUM'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { waypoints } = req.body;

    if (!Array.isArray(waypoints)) {
      throw ApiError.badRequest('waypoints must be an array');
    }

    const created = await prisma.waypoint.createMany({
      data: waypoints.map((wp: any) => ({
        ...createWaypointSchema.parse(wp),
        userId: req.user!.id,
      })),
    });

    res.status(201).json({
      success: true,
      data: { count: created.count },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/waypoints/export
router.get('/export/gpx', authenticate, requireSubscription('PREMIUM'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const waypoints = await prisma.waypoint.findMany({
      where: { userId: req.user!.id },
    });

    // Generate GPX XML
    const gpx = generateGPX(waypoints);

    res.set('Content-Type', 'application/gpx+xml');
    res.set('Content-Disposition', 'attachment; filename="ak-fish-waypoints.gpx"');
    res.send(gpx);
  } catch (error) {
    next(error);
  }
});

// Helper function to generate GPX
function generateGPX(waypoints: any[]): string {
  const wpts = waypoints.map(wp => `
    <wpt lat="${wp.latitude}" lon="${wp.longitude}">
      <name>${escapeXml(wp.name)}</name>
      <desc>${escapeXml(wp.description || '')}</desc>
      <type>${wp.type}</type>
      <time>${wp.createdAt.toISOString()}</time>
    </wpt>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="AK FISH">
  <metadata>
    <name>AK FISH Waypoints</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  ${wpts}
</gpx>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default router;
