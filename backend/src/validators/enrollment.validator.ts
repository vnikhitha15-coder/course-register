import { z } from 'zod';

export const enrollSchema = z.object({
  courseId: z.string().uuid('Invalid course ID format. Must be a valid UUID.'),
});

export const paramCourseIdSchema = z.object({
  courseId: z.string().uuid('Invalid course ID format. Must be a valid UUID.'),
});

export const paramIdSchema = z.object({
  id: z.string().uuid('Invalid ID format. Must be a valid UUID.'),
});

export const adminEnrollmentQuerySchema = z.object({
  courseId: z.string().uuid('Invalid course ID format').optional().or(z.literal('')),
  search: z.string().optional().default(''),
});

export type EnrollInput = z.infer<typeof enrollSchema>;
