import { z } from 'zod';

export const updateAssignmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'SUBMITTED'], {
    errorMap: () => ({ message: 'Status must be PENDING, IN_PROGRESS, or SUBMITTED' }),
  }),
});

export const paramAssignmentIdSchema = z.object({
  assignmentId: z.string().uuid('Invalid assignment identifier format'),
});

export type UpdateAssignmentStatusInput = z.infer<typeof updateAssignmentStatusSchema>;
