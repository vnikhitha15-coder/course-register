import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { verifyToken, AUTH_COOKIE_NAME } from '../utils/jwt.js';
import { AppError } from '../utils/app-error.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Check HttpOnly cookie first
    if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
      token = req.cookies[AUTH_COOKIE_NAME];
    }
    // 2. Fall back to Authorization: Bearer <token> header
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw AppError.unauthorized('Authentication token is missing. Please log in.');
    }

    // 3. Verify JWT
    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      throw AppError.unauthorized('Invalid or expired authentication session. Please log in again.');
    }

    // 4. Confirm user exists in PostgreSQL
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw AppError.unauthorized('User account associated with this session no longer exists.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
