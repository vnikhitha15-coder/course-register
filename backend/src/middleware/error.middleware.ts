import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/app-error.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Handled AppError instances
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
    return;
  }

  // 2. Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = Array.isArray(err.meta?.target)
        ? (err.meta.target as string[]).join(', ')
        : String(err.meta?.target ?? 'field');
      res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: `A record with this ${target} already exists.`,
          details: { target: err.meta?.target },
        },
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'The requested database record was not found.',
          details: {},
        },
      });
      return;
    }

    if (err.code === 'P2003') {
      res.status(400).json({
        error: {
          code: 'BAD_REQUEST',
          message: 'Related database constraint violation occurred.',
          details: { field: err.meta?.field_name },
        },
      });
      return;
    }
  }

  // 3. Prisma Validation Error
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid database query or missing required relation fields.',
        details: {},
      },
    });
    return;
  }

  // 4. Fallback unhandled server error
  const message = err instanceof Error ? err.message : 'An unexpected internal error occurred';
  if (env.NODE_ENV !== 'test') {
    console.error('Unhandled internal error:', err);
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.NODE_ENV === 'production' ? 'An unexpected internal server error occurred.' : message,
      details: {},
    },
  });
}
