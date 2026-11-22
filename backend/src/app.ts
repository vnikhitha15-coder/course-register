import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { authRouter } from './routes/auth.routes.js';
import { courseRouter } from './routes/course.routes.js';
import { enrollmentRouter } from './routes/enrollment.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { AppError } from './utils/app-error.js';

export const app: Express = express();

// Security & Parsing Middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);
app.use(cookieParser());
app.use(express.json());

// Public Health Check Endpoint
app.get('/api/health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      database: 'connected',
    });
  } catch (error) {
    next(AppError.internal('Database connection failed during health probe.'));
  }
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/courses', courseRouter);
app.use('/api/enrollments', enrollmentRouter);
app.use('/api/admin', adminRouter);

// 404 Catch-All
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(AppError.notFound('The requested API resource does not exist.'));
});

// Centralized Error Handler
app.use(errorHandler);
