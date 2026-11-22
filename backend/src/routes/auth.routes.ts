import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 20 : 500,
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
      details: {},
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRouter = Router();

authRouter.post('/register', authLimiter, validate({ body: registerSchema }), register);
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), login);
authRouter.post('/logout', logout);
authRouter.get('/me', authMiddleware, getMe);
