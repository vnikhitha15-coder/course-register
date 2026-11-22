import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import { Prisma } from '@prisma/client';

export async function getCourses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const currentUserId = req.user?.id;
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const creditsParam = req.query.credits ? parseInt(String(req.query.credits), 10) : undefined;

    const where: Prisma.CourseWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { instructor: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (creditsParam && !isNaN(creditsParam)) {
      where.credits = creditsParam;
    }

    const courses = await prisma.course.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: { enrollments: true },
        },
        enrollments: currentUserId
          ? {
              where: { studentId: currentUserId },
              select: { id: true },
            }
          : false,
      },
    });

    const enrichedCourses = courses.map((course) => {
      const enrolledCount = course._count.enrollments;
      const remainingSeats = Math.max(0, course.capacity - enrolledCount);
      const isEnrolled = currentUserId ? (course.enrollments?.length ?? 0) > 0 : false;

      return {
        id: course.id,
        code: course.code,
        title: course.title,
        description: course.description,
        credits: course.credits,
        instructor: course.instructor,
        capacity: course.capacity,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        enrolledCount,
        remainingSeats,
        isEnrolled,
      };
    });

    res.status(200).json({
      courses: enrichedCourses,
    });
  } catch (error) {
    next(error);
  }
}

export async function getCourseById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: { enrollments: true },
        },
        enrollments: currentUserId
          ? {
              where: { studentId: currentUserId },
              select: { id: true },
            }
          : false,
      },
    });

    if (!course) {
      throw AppError.notFound('Course not found.');
    }

    const enrolledCount = course._count.enrollments;
    const remainingSeats = Math.max(0, course.capacity - enrolledCount);
    const isEnrolled = currentUserId ? (course.enrollments?.length ?? 0) > 0 : false;

    res.status(200).json({
      course: {
        id: course.id,
        code: course.code,
        title: course.title,
        description: course.description,
        credits: course.credits,
        instructor: course.instructor,
        capacity: course.capacity,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        enrolledCount,
        remainingSeats,
        isEnrolled,
      },
    });
  } catch (error) {
    next(error);
  }
}
