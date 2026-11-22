import { Router } from 'express';
import {
  getAdminStats,
  createCourse,
  updateCourse,
  deleteCourse,
  getAdminEnrollments,
  removeEnrollment,
} from '../controllers/admin.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createCourseSchema,
  updateCourseSchema,
} from '../validators/course.validator.js';
import {
  paramIdSchema,
  adminEnrollmentQuerySchema,
} from '../validators/enrollment.validator.js';
import { Role } from '@prisma/client';

export const adminRouter = Router();

// Strict Admin Access Control
adminRouter.use(authMiddleware, requireRole(Role.ADMIN));

adminRouter.get('/stats', getAdminStats);
adminRouter.post('/courses', validate({ body: createCourseSchema }), createCourse);
adminRouter.put(
  '/courses/:id',
  validate({ params: paramIdSchema, body: updateCourseSchema }),
  updateCourse
);
adminRouter.delete('/courses/:id', validate({ params: paramIdSchema }), deleteCourse);
adminRouter.get(
  '/enrollments',
  validate({ query: adminEnrollmentQuerySchema }),
  getAdminEnrollments
);
adminRouter.delete(
  '/enrollments/:id',
  validate({ params: paramIdSchema }),
  removeEnrollment
);
