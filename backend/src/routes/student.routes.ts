import { Router } from 'express';
import {
  getAcademicOverview,
  updateAssignmentStatus,
} from '../controllers/student.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  updateAssignmentStatusSchema,
  paramAssignmentIdSchema,
} from '../validators/student.validator.js';
import { Role } from '@prisma/client';

export const studentRouter = Router();

// Strict Authentication and Student Role RBAC
studentRouter.use(authMiddleware, requireRole(Role.STUDENT));

studentRouter.get('/academic-overview', getAcademicOverview);
studentRouter.patch(
  '/assignments/:assignmentId/status',
  validate({
    params: paramAssignmentIdSchema,
    body: updateAssignmentStatusSchema,
  }),
  updateAssignmentStatus
);
