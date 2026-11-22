import jwt, { SignOptions } from 'jsonwebtoken';
import { CookieOptions } from 'express';
import { env } from '../config/env.js';
import { Role } from '@prisma/client';

export interface TokenPayload {
  sub: string;
  role: Role;
}

export function signToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export const AUTH_COOKIE_NAME = 'auth_token';

export function getAuthCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  };
}

export function getClearCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
  };
}
