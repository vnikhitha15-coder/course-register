import { z } from 'zod';

export const createCourseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Course code must be at least 2 characters')
    .max(10, 'Course code cannot exceed 10 characters')
    .toUpperCase(),
  title: z
    .string()
    .trim()
    .min(3, 'Course title must be at least 3 characters')
    .max(120, 'Course title cannot exceed 120 characters'),
  description: z
    .string()
    .trim()
    .min(5, 'Description must be at least 5 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  credits: z
    .number({ invalid_type_error: 'Credits must be a number' })
    .int('Credits must be an integer')
    .min(1, 'Credits must be at least 1')
    .max(6, 'Credits cannot exceed 6'),
  instructor: z
    .string()
    .trim()
    .min(2, 'Instructor name must be at least 2 characters')
    .max(80, 'Instructor name cannot exceed 80 characters'),
  capacity: z
    .number({ invalid_type_error: 'Capacity must be a number' })
    .int('Capacity must be an integer')
    .min(1, 'Capacity must be at least 1')
    .max(500, 'Capacity cannot exceed 500'),
});

export const updateCourseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, 'Course code must be at least 2 characters')
    .max(10, 'Course code cannot exceed 10 characters')
    .toUpperCase()
    .optional(),
  title: z
    .string()
    .trim()
    .min(3, 'Course title must be at least 3 characters')
    .max(120, 'Course title cannot exceed 120 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .min(5, 'Description must be at least 5 characters')
    .max(2000, 'Description cannot exceed 2000 characters')
    .optional(),
  credits: z
    .number({ invalid_type_error: 'Credits must be a number' })
    .int('Credits must be an integer')
    .min(1, 'Credits must be at least 1')
    .max(6, 'Credits cannot exceed 6')
    .optional(),
  instructor: z
    .string()
    .trim()
    .min(2, 'Instructor name must be at least 2 characters')
    .max(80, 'Instructor name cannot exceed 80 characters')
    .optional(),
  capacity: z
    .number({ invalid_type_error: 'Capacity must be a number' })
    .int('Capacity must be an integer')
    .min(1, 'Capacity must be at least 1')
    .max(500, 'Capacity cannot exceed 500')
    .optional(),
});

export const courseQuerySchema = z.object({
  search: z.string().optional().default(''),
  credits: z
    .string()
    .optional()
    .transform((val) => (val && val.trim() !== '' ? parseInt(val, 10) : undefined))
    .pipe(z.number().int().min(1).max(6).optional()),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type CourseQueryInput = z.infer<typeof courseQuerySchema>;
