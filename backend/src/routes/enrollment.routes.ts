import { Router } from 'express';
import {
  getMyEnrollments,
  enrollCourse,
  dropCourse,
} from '../controllers/enrollment.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  enrollSchema,
  paramCourseIdSchema,
} from '../validators/enrollment.validator.js';
import { Role } from '@prisma/client';

export const enrollmentRouter = Router();

// Strict Student Access Control
enrollmentRouter.use(authMiddleware, requireRole(Role.STUDENT));

enrollmentRouter.get('/me', getMyEnrollments);
enrollmentRouter.post('/', validate({ body: enrollSchema }), enrollCourse);
enrollmentRouter.delete('/:courseId', validate({ params: paramCourseIdSchema }), dropCourse);
