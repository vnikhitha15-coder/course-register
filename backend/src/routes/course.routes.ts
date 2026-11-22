import { Router } from 'express';
import { getCourses, getCourseById } from '../controllers/course.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { courseQuerySchema } from '../validators/course.validator.js';
import { paramIdSchema } from '../validators/enrollment.validator.js';

export const courseRouter = Router();

courseRouter.get('/', authMiddleware, validate({ query: courseQuerySchema }), getCourses);
courseRouter.get('/:id', authMiddleware, validate({ params: paramIdSchema }), getCourseById);
