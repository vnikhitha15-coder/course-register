import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { signToken, getAuthCookieOptions, getClearCookieOptions, AUTH_COOKIE_NAME } from '../utils/jwt.js';
import { AppError } from '../utils/app-error.js';
import { RegisterInput, LoginInput } from '../validators/auth.validator.js';

export async function register(
  req: Request<unknown, unknown, RegisterInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw AppError.conflict('An account with this email address already exists.');
    }

    // Hash password with 12 rounds
    const passwordHash = await bcrypt.hash(password, 12);

    // Enforce role: STUDENT strictly (prevent privilege escalation)
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: Role.STUDENT,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Issue JWT and set HttpOnly cookie
    const token = signToken({ sub: user.id, role: user.role });
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    res.status(201).json({
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request<unknown, unknown, LoginInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw AppError.unauthorized('Invalid email or password.');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw AppError.unauthorized('Invalid email or password.');
    }

    const token = signToken({ sub: user.id, role: user.role });
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      user: safeUser,
      token,
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.clearCookie(AUTH_COOKIE_NAME, getClearCookieOptions());
    res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required.');
    }
    res.status(200).json({
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
}
