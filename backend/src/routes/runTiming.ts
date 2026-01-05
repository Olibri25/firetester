// AK FISH Run Timing Routes

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { redis } from '../utils/redis';
import { ApiError } from '../middleware/errorHandler';
import { optionalAuth, authenticate, requireSubscription } from '../middleware/auth';

const router = Router();

// GET /api/v1/run-timing/historical
router.get('/historical', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { location, species, years = '5' } = req.query;

    const yearsBack = parseInt(String(years), 10);
    const currentYear = new Date().getFullYear();

    const runData = await prisma.runTimingData.findMany({
      where: {
        ...(location && { location: String(location) }),
        ...(species && { species: String(species) }),
        year: { gte: currentYear - yearsBack },
      },
      orderBy: [{ location: 'asc' }, { species: 'asc' }, { year: 'desc' }],
    });

    res.json({
      success: true,
      data: runData,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/run-timing/predictions
router.get('/predictions', authenticate, requireSubscription('ELITE'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { location, species } = req.query;

    // Try cache
    const cacheKey = `run-predictions:${location || 'all'}:${species || 'all'}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached, meta: { cached: true } });
    }

    const predictions = await prisma.runPrediction.findMany({
      where: {
        ...(location && { location: String(location) }),
        ...(species && { species: String(species) }),
        validUntil: { gte: new Date() },
      },
      orderBy: { predictedPeakDate: 'asc' },
    });

    // Cache for 4 hours
    await redis.set(cacheKey, predictions, 4 * 60 * 60);

    res.json({
      success: true,
      data: predictions,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/run-timing/predictions/:location/:species
router.get('/predictions/:location/:species', authenticate, requireSubscription('ELITE'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { location, species } = req.params;

    const prediction = await prisma.runPrediction.findFirst({
      where: {
        location,
        species,
        validUntil: { gte: new Date() },
      },
      orderBy: { generatedAt: 'desc' },
    });

    if (!prediction) {
      // Generate a prediction based on historical data
      const generatedPrediction = await generatePrediction(location, species);

      res.json({
        success: true,
        data: generatedPrediction,
        meta: { generated: true },
      });
      return;
    }

    res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/run-timing/calendar
router.get('/calendar', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { region, month } = req.query;

    // Return run timing calendar data
    const calendarData = getRunTimingCalendar(String(region || 'southcentral'), parseInt(String(month)) || new Date().getMonth() + 1);

    res.json({
      success: true,
      data: calendarData,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/run-timing/current
router.get('/current', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentMonth = new Date().getMonth() + 1; // 1-12

    // Get species that are currently running
    const currentRuns = getCurrentRuns(currentMonth);

    res.json({
      success: true,
      data: currentRuns,
    });
  } catch (error) {
    next(error);
  }
});

// Helper function to generate prediction based on historical data
async function generatePrediction(location: string, species: string) {
  // Get historical data
  const historicalData = await prisma.runTimingData.findMany({
    where: { location, species },
    orderBy: { year: 'desc' },
    take: 10,
  });

  if (historicalData.length === 0) {
    throw ApiError.notFound('No historical data available for this location and species');
  }

  // Calculate average peak date
  const peakDates = historicalData
    .filter(d => d.earlyRunPeak || d.lateRunPeak)
    .map(d => {
      const peak = d.earlyRunPeak || d.lateRunPeak;
      return peak ? peak.getTime() : null;
    })
    .filter(Boolean) as number[];

  const avgPeakTime = peakDates.reduce((a, b) => a + b, 0) / peakDates.length;
  const avgPeakDate = new Date(avgPeakTime);

  // Adjust to current year
  const currentYear = new Date().getFullYear();
  avgPeakDate.setFullYear(currentYear);

  // Calculate average total run
  const totalRuns = historicalData
    .filter(d => d.totalEscapement)
    .map(d => d.totalEscapement!);
  const avgRun = totalRuns.length > 0
    ? Math.round(totalRuns.reduce((a, b) => a + b, 0) / totalRuns.length)
    : 0;

  // Determine predicted strength based on recent trends
  let predictedStrength: string;
  if (totalRuns.length >= 2) {
    const recentAvg = (totalRuns[0] + (totalRuns[1] || totalRuns[0])) / 2;
    const ratio = recentAvg / avgRun;
    if (ratio < 0.7) predictedStrength = 'below_average';
    else if (ratio < 0.9) predictedStrength = 'average';
    else if (ratio < 1.2) predictedStrength = 'above_average';
    else predictedStrength = 'strong';
  } else {
    predictedStrength = 'average';
  }

  return {
    id: `generated-${location}-${species}`,
    location,
    species,
    predictedPeakDate: avgPeakDate.toISOString().split('T')[0],
    confidenceLevel: Math.min(70, 40 + historicalData.length * 5),
    predictedTotalRun: avgRun,
    predictedStrength,
    factors: [
      {
        name: 'Historical Average',
        value: `${historicalData.length} years of data`,
        impact: 'neutral',
        weight: 0.4,
        description: 'Based on historical run timing patterns',
      },
      {
        name: 'Recent Trends',
        value: predictedStrength,
        impact: predictedStrength === 'above_average' || predictedStrength === 'strong' ? 'positive' : 'neutral',
        weight: 0.3,
        description: 'Based on recent year escapement numbers',
      },
    ],
    generatedAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

// Helper function to get run timing calendar
function getRunTimingCalendar(region: string, month: number) {
  // Salmon run timing data for Alaska (generalized)
  const runTimings = {
    king_salmon: {
      southcentral: { start: 5, peak: 6, end: 7 },
      southeast: { start: 5, peak: 6, end: 7 },
      southwest: { start: 6, peak: 7, end: 8 },
    },
    sockeye_salmon: {
      southcentral: { start: 6, peak: 7, end: 8 },
      southeast: { start: 6, peak: 7, end: 8 },
      southwest: { start: 6, peak: 7, end: 9 },
    },
    coho_salmon: {
      southcentral: { start: 7, peak: 8, end: 10 },
      southeast: { start: 8, peak: 9, end: 10 },
      southwest: { start: 7, peak: 8, end: 9 },
    },
    pink_salmon: {
      southcentral: { start: 7, peak: 8, end: 9 },
      southeast: { start: 7, peak: 8, end: 9 },
      southwest: { start: 7, peak: 8, end: 8 },
    },
    chum_salmon: {
      southcentral: { start: 7, peak: 8, end: 9 },
      southeast: { start: 7, peak: 8, end: 10 },
      southwest: { start: 7, peak: 8, end: 9 },
    },
  };

  const calendar: any[] = [];

  for (const [species, regions] of Object.entries(runTimings)) {
    const timing = (regions as any)[region];
    if (!timing) continue;

    let status: string;
    if (month < timing.start) {
      status = 'upcoming';
    } else if (month === timing.peak) {
      status = 'peak';
    } else if (month >= timing.start && month <= timing.end) {
      status = 'active';
    } else {
      status = 'ended';
    }

    calendar.push({
      species,
      timing,
      status,
      quality: status === 'peak' ? 'excellent' : status === 'active' ? 'good' : 'none',
    });
  }

  return {
    region,
    month,
    species: calendar,
  };
}

// Helper function to get current runs
function getCurrentRuns(month: number) {
  const runs = [
    {
      species: 'king_salmon',
      regions: ['southcentral', 'southeast'],
      quality: month >= 5 && month <= 7 ? (month === 6 ? 'excellent' : 'good') : 'none',
      active: month >= 5 && month <= 7,
    },
    {
      species: 'sockeye_salmon',
      regions: ['southcentral', 'southwest'],
      quality: month >= 6 && month <= 8 ? (month === 7 ? 'excellent' : 'good') : 'none',
      active: month >= 6 && month <= 8,
    },
    {
      species: 'coho_salmon',
      regions: ['southcentral', 'southeast'],
      quality: month >= 7 && month <= 10 ? (month === 8 || month === 9 ? 'excellent' : 'good') : 'none',
      active: month >= 7 && month <= 10,
    },
    {
      species: 'pink_salmon',
      regions: ['southcentral', 'southeast'],
      quality: month >= 7 && month <= 9 ? (month === 8 ? 'excellent' : 'good') : 'none',
      active: month >= 7 && month <= 9,
    },
    {
      species: 'chum_salmon',
      regions: ['southcentral', 'southeast'],
      quality: month >= 7 && month <= 9 ? (month === 8 ? 'good' : 'fair') : 'none',
      active: month >= 7 && month <= 9,
    },
  ];

  return runs.filter(r => r.active);
}

export default router;
