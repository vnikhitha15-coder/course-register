import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import { CreateCourseInput, UpdateCourseInput } from '../validators/course.validator.js';
import { Role, Prisma } from '@prisma/client';

export async function getAdminStats(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [totalCourses, totalStudents, totalEnrollments, coursesWithCounts] = await Promise.all([
      prisma.course.count(),
      prisma.user.count({ where: { role: Role.STUDENT } }),
      prisma.enrollment.count(),
      prisma.course.findMany({
        select: {
          id: true,
          capacity: true,
          _count: {
            select: { enrollments: true },
          },
        },
      }),
    ]);

    const fullCoursesCount = coursesWithCounts.filter(
      (c) => c._count.enrollments >= c.capacity
    ).length;

    res.status(200).json({
      totalCourses,
      totalStudents,
      totalEnrollments,
      fullCoursesCount,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCourse(
  req: Request<unknown, unknown, CreateCourseInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { code, title, description, credits, instructor, capacity } = req.body;
    const upperCode = code.toUpperCase().trim();

    const existing = await prisma.course.findUnique({
      where: { code: upperCode },
    });

    if (existing) {
      throw AppError.conflict(`A course with code '${upperCode}' already exists.`);
    }

    const course = await prisma.course.create({
      data: {
        code: upperCode,
        title: title.trim(),
        description: description.trim(),
        credits,
        instructor: instructor.trim(),
        capacity,
      },
    });

    res.status(201).json({
      course,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCourse(
  req: Request<{ id: string }, unknown, UpdateCourseInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const { code, title, description, credits, instructor, capacity } = req.body;

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.course.findUnique({
        where: { id },
        include: {
          _count: {
            select: { enrollments: true },
          },
        },
      });

      if (!existing) {
        throw AppError.notFound('Course not found.');
      }

      // Check if new capacity is smaller than current enrollments
      if (capacity !== undefined && capacity < existing._count.enrollments) {
        throw AppError.badRequest(
          `Cannot reduce course capacity to ${capacity}. There are currently ${existing._count.enrollments} students enrolled.`
        );
      }

      // If code is changed, verify uniqueness
      if (code && code.toUpperCase() !== existing.code) {
        const codeTaken = await tx.course.findUnique({
          where: { code: code.toUpperCase() },
        });
        if (codeTaken) {
          throw AppError.conflict(`A course with code '${code.toUpperCase()}' already exists.`);
        }
      }

      return await tx.course.update({
        where: { id },
        data: {
          ...(code ? { code: code.toUpperCase().trim() } : {}),
          ...(title ? { title: title.trim() } : {}),
          ...(description ? { description: description.trim() } : {}),
          ...(credits !== undefined ? { credits } : {}),
          ...(instructor ? { instructor: instructor.trim() } : {}),
          ...(capacity !== undefined ? { capacity } : {}),
        },
      });
    });

    res.status(200).json({
      course: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCourse(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: { select: { enrollments: true } },
      },
    });

    if (!existing) {
      throw AppError.notFound('Course not found.');
    }

    await prisma.course.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'Course deleted successfully',
      deletedEnrollmentsCount: existing._count.enrollments,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminEnrollments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const courseId = typeof req.query.courseId === 'string' && req.query.courseId.trim() !== ''
      ? req.query.courseId.trim()
      : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

    const where: Prisma.EnrollmentWhereInput = {};

    if (courseId) {
      where.courseId = courseId;
    }

    if (search) {
      where.OR = [
        { student: { name: { contains: search, mode: 'insensitive' } } },
        { student: { email: { contains: search, mode: 'insensitive' } } },
        { course: { code: { contains: search, mode: 'insensitive' } } },
        { course: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const enrollments = await prisma.enrollment.findMany({
      where,
      orderBy: { enrolledAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            credits: true,
          },
        },
      },
    });

    res.status(200).json({
      enrollments,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeEnrollment(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;

    const existing = await prisma.enrollment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw AppError.notFound('Enrollment record not found.');
    }

    await prisma.enrollment.delete({
      where: { id },
    });

    res.status(200).json({
      message: 'Enrollment removed successfully',
    });
  } catch (error) {
    next(error);
  }
}
