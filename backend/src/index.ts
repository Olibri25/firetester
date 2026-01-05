// AK FISH Backend API Server

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Route imports
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import fishCountRoutes from './routes/fishCounts';
import emergencyOrderRoutes from './routes/emergencyOrders';
import regulationRoutes from './routes/regulations';
import lakeRoutes from './routes/lakes';
import fishingReportRoutes from './routes/fishingReports';
import waypointRoutes from './routes/waypoints';
import tripRoutes from './routes/trips';
import catchRoutes from './routes/catches';
import weatherRoutes from './routes/weather';
import tideRoutes from './routes/tides';
import runTimingRoutes from './routes/runTiming';

// Initialize Express app
const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API routes
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/fish-counts', fishCountRoutes);
apiRouter.use('/emergency-orders', emergencyOrderRoutes);
apiRouter.use('/regulations', regulationRoutes);
apiRouter.use('/lakes', lakeRoutes);
apiRouter.use('/fishing-reports', fishingReportRoutes);
apiRouter.use('/waypoints', waypointRoutes);
apiRouter.use('/trips', tripRoutes);
apiRouter.use('/catches', catchRoutes);
apiRouter.use('/weather', weatherRoutes);
apiRouter.use('/tides', tideRoutes);
apiRouter.use('/run-timing', runTimingRoutes);

// Mount API routes
app.use('/api/v1', apiRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const server = app.listen(config.port, () => {
  logger.info(`AK FISH API server running on port ${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;
