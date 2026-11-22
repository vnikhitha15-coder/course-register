import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import { EnrollInput } from '../validators/enrollment.validator.js';

export async function getMyEnrollments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const studentId = req.user!.id;

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      orderBy: { enrolledAt: 'desc' },
      include: {
        course: true,
      },
    });

    const totalCourses = enrollments.length;
    const totalCredits = enrollments.reduce((sum, enr) => sum + enr.course.credits, 0);

    res.status(200).json({
      enrollments,
      summary: {
        totalCourses,
        totalCredits,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function enrollCourse(
  req: Request<unknown, unknown, EnrollInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const studentId = req.user!.id;
    const { courseId } = req.body;

    const enrollment = await prisma.$transaction(async (tx) => {
      // 1. Lock the target course row with SELECT ... FOR UPDATE
      const lockedCourses = await tx.$queryRaw<Array<{ id: string; capacity: number }>>`
        SELECT id, capacity FROM \"Course\" WHERE id = ${courseId} FOR UPDATE
      `;

      if (!lockedCourses || lockedCourses.length === 0) {
        throw AppError.notFound('Course not found.');
      }

      const course = lockedCourses[0];

      // 2. Check for duplicate enrollment
      const existing = await tx.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId,
            courseId,
          },
        },
      });

      if (existing) {
        throw AppError.conflict('You are already enrolled in this course.');
      }

      // 3. Count active enrollments to enforce capacity
      const activeCount = await tx.enrollment.count({
        where: { courseId },
      });

      if (activeCount >= course.capacity) {
        throw AppError.conflict('This course has reached maximum capacity.');
      }

      // 4. Create enrollment record
      return await tx.enrollment.create({
        data: {
          studentId,
          courseId,
        },
        include: {
          course: true,
        },
      });
    });

    res.status(201).json({
      enrollment,
    });
  } catch (error) {
    next(error);
  }
}

export async function dropCourse(
  req: Request<{ courseId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const studentId = req.user!.id;
    const { courseId } = req.params;

    const existing = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (!existing) {
      throw AppError.notFound('You are not currently enrolled in this course.');
    }

    await prisma.enrollment.delete({
      where: {
        id: existing.id,
      },
    });

    res.status(200).json({
      message: 'Dropped course successfully',
    });
  } catch (error) {
    next(error);
  }
}
