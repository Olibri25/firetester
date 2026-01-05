// AK FISH Fishing Reports Routes

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { redis } from '../utils/redis';
import { config } from '../config';
import { ApiError } from '../middleware/errorHandler';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// GET /api/v1/fishing-reports
router.get('/', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { region, area, limit = '20', offset = '0' } = req.query;

    // Try cache
    const cacheKey = `fishing-reports:${region || 'all'}:${area || 'all'}`;
    const cached = await redis.get(cacheKey);
    if (cached && offset === '0') {
      return res.json({ success: true, data: cached, meta: { cached: true } });
    }

    const reports = await prisma.fishingReport.findMany({
      where: {
        ...(region && { region: String(region) }),
        ...(area && { area: { contains: String(area), mode: 'insensitive' } }),
      },
      orderBy: { reportDate: 'desc' },
      take: parseInt(String(limit), 10),
      skip: parseInt(String(offset), 10),
    });

    if (offset === '0') {
      await redis.set(cacheKey, reports, config.cache.fishingReports);
    }

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/fishing-reports/regions
router.get('/regions', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const regions = await prisma.fishingReport.findMany({
      select: { region: true },
      distinct: ['region'],
      orderBy: { region: 'asc' },
    });

    res.json({
      success: true,
      data: regions.map(r => r.region),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/fishing-reports/latest
router.get('/latest', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get latest report for each region
    const regions = await prisma.fishingReport.findMany({
      select: { region: true },
      distinct: ['region'],
    });

    const latestReports = await Promise.all(
      regions.map(r =>
        prisma.fishingReport.findFirst({
          where: { region: r.region },
          orderBy: { reportDate: 'desc' },
        })
      )
    );

    res.json({
      success: true,
      data: latestReports.filter(Boolean),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/fishing-reports/:id
router.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const report = await prisma.fishingReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw ApiError.notFound('Fishing report not found');
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
