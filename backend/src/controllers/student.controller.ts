import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/app-error.js';
import { UpdateAssignmentStatusInput } from '../validators/student.validator.js';
import { AssignmentStatus } from '@prisma/client';

export async function getAcademicOverview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const studentId = req.user!.id;
    const now = new Date();

    // Fetch active enrollments with nested courses, exams, and assignments + student submissions
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            exams: {
              orderBy: { startTime: 'asc' },
            },
            assignments: {
              include: {
                submissions: {
                  where: { studentId },
                },
              },
              orderBy: { dueDate: 'asc' },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    const totalCourses = enrollments.length;
    let totalCredits = 0;
    let totalClassesLeft = 0;
    let totalClassesCompleted = 0;
    let totalClassesScheduled = 0;

    const allExams: Array<{
      id: string;
      courseId: string;
      courseCode: string;
      courseTitle: string;
      title: string;
      examType: string;
      startTime: Date;
      endTime: Date;
      location: string;
      syllabusNotes: string | null;
      isPast: boolean;
      hasConflict: boolean;
    }> = [];

    const allAssignments: Array<{
      id: string;
      courseId: string;
      courseCode: string;
      courseTitle: string;
      title: string;
      description: string | null;
      dueDate: Date;
      maxPoints: number;
      weightPercent: number | null;
      submissionUrl: string | null;
      status: AssignmentStatus;
      submittedAt: Date | null;
      score: number | null;
      isOverdue: boolean;
    }> = [];

    const courses = enrollments.map((enr) => {
      const course = enr.course;
      totalCredits += course.credits;

      const classesLeft = Math.max(0, course.totalClasses - course.completedClasses);
      totalClassesLeft += classesLeft;
      totalClassesCompleted += course.completedClasses;
      totalClassesScheduled += course.totalClasses;

      const completionPercent =
        course.totalClasses > 0
          ? Math.min(100, Math.round((course.completedClasses / course.totalClasses) * 100))
          : 0;

      // Nearest upcoming exam for this specific course
      const nextCourseExam =
        course.exams.find((exam) => new Date(exam.startTime) >= now) || null;

      // Pending assignments for this course
      let coursePendingCount = 0;
      course.assignments.forEach((assignment) => {
        const sub = assignment.submissions[0];
        const status = sub?.status || AssignmentStatus.PENDING;
        const isDone = status === AssignmentStatus.SUBMITTED || status === AssignmentStatus.GRADED;

        if (!isDone) {
          coursePendingCount++;
        }

        const isOverdue = !isDone && new Date(assignment.dueDate) < now;

        allAssignments.push({
          id: assignment.id,
          courseId: course.id,
          courseCode: course.code,
          courseTitle: course.title,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate,
          maxPoints: assignment.maxPoints,
          weightPercent: assignment.weightPercent,
          submissionUrl: assignment.submissionUrl,
          status,
          submittedAt: sub?.submittedAt || null,
          score: sub?.score ?? null,
          isOverdue,
        });
      });

      // Collect all exams
      course.exams.forEach((exam) => {
        const isPast = new Date(exam.endTime) < now;
        allExams.push({
          id: exam.id,
          courseId: course.id,
          courseCode: course.code,
          courseTitle: course.title,
          title: exam.title,
          examType: exam.examType,
          startTime: exam.startTime,
          endTime: exam.endTime,
          location: exam.location,
          syllabusNotes: exam.syllabusNotes,
          isPast,
          hasConflict: false, // Calculated next
        });
      });

      return {
        id: course.id,
        code: course.code,
        title: course.title,
        instructor: course.instructor,
        credits: course.credits,
        creditType: course.creditType,
        term: course.term,
        totalClasses: course.totalClasses,
        completedClasses: course.completedClasses,
        classesLeft,
        completionPercent,
        nextClassAt: course.nextClassAt,
        nextClassLocation: course.nextClassLocation,
        nextExam: nextCourseExam
          ? {
              id: nextCourseExam.id,
              title: nextCourseExam.title,
              examType: nextCourseExam.examType,
              startTime: nextCourseExam.startTime,
              endTime: nextCourseExam.endTime,
              location: nextCourseExam.location,
            }
          : null,
        pendingAssignmentCount: coursePendingCount,
      };
    });

    // Compute exam conflicts (only between non-past exams, or overlapping exam time blocks)
    for (let i = 0; i < allExams.length; i++) {
      const examA = allExams[i];
      for (let j = 0; j < allExams.length; j++) {
        if (i === j) continue;
        const examB = allExams[j];
        // If intervals overlap: startA < endB and endA > startB
        if (examA.startTime < examB.endTime && examA.endTime > examB.startTime) {
          examA.hasConflict = true;
          break;
        }
      }
    }

    // Sort exams: nearest upcoming first, past exams at the end
    allExams.sort((a, b) => {
      if (a.isPast !== b.isPast) {
        return a.isPast ? 1 : -1; // Upcoming first
      }
      return a.startTime.getTime() - b.startTime.getTime();
    });

    // Sort assignments:
    // 1. Overdue uncompleted first (earliest due date first)
    // 2. Pending/in-progress upcoming (earliest due date first)
    // 3. Submitted / Graded (most recently due or submitted)
    allAssignments.sort((a, b) => {
      const aDone = a.status === AssignmentStatus.SUBMITTED || a.status === AssignmentStatus.GRADED;
      const bDone = b.status === AssignmentStatus.SUBMITTED || b.status === AssignmentStatus.GRADED;

      if (aDone !== bDone) {
        return aDone ? 1 : -1; // Incomplete first
      }

      if (!aDone && !bDone) {
        if (a.isOverdue !== b.isOverdue) {
          return a.isOverdue ? -1 : 1; // Overdue first
        }
        return a.dueDate.getTime() - b.dueDate.getTime();
      }

      return b.dueDate.getTime() - a.dueDate.getTime();
    });

    // Summary calculations
    const earliestUpcomingExam = allExams.find((e) => !e.isPast) || null;
    const pendingAssignmentsCount = allAssignments.filter(
      (a) => a.status === AssignmentStatus.PENDING || a.status === AssignmentStatus.IN_PROGRESS
    ).length;
    const overdueAssignmentsCount = allAssignments.filter((a) => a.isOverdue).length;

    const overallCompletionPercent =
      totalClassesScheduled > 0
        ? Math.min(100, Math.round((totalClassesCompleted / totalClassesScheduled) * 100))
        : 0;

    res.status(200).json({
      summary: {
        totalCredits,
        totalCourses,
        totalClassesLeft,
        totalClassesCompleted,
        totalClassesScheduled,
        overallCompletionPercent,
        nextExam: earliestUpcomingExam
          ? {
              id: earliestUpcomingExam.id,
              courseCode: earliestUpcomingExam.courseCode,
              courseTitle: earliestUpcomingExam.courseTitle,
              title: earliestUpcomingExam.title,
              examType: earliestUpcomingExam.examType,
              startTime: earliestUpcomingExam.startTime,
              endTime: earliestUpcomingExam.endTime,
              location: earliestUpcomingExam.location,
              hasConflict: earliestUpcomingExam.hasConflict,
            }
          : null,
        pendingAssignmentsCount,
        overdueAssignmentsCount,
      },
      courses,
      exams: allExams,
      assignments: allAssignments,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateAssignmentStatus(
  req: Request<{ assignmentId: string }, unknown, UpdateAssignmentStatusInput>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const studentId = req.user!.id;
    const { assignmentId } = req.params;
    const { status } = req.body;

    // Verify assignment exists and student is currently enrolled in its course
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          include: {
            enrollments: {
              where: { studentId },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw AppError.notFound('Assignment not found.');
    }

    if (assignment.course.enrollments.length === 0) {
      throw AppError.forbidden(
        'You cannot update assignments for courses you are not actively enrolled in.'
      );
    }

    const submittedAt = status === 'SUBMITTED' ? new Date() : null;

    const studentAssignment = await prisma.studentAssignment.upsert({
      where: {
        studentId_assignmentId: {
          studentId,
          assignmentId,
        },
      },
      update: {
        status: status as AssignmentStatus,
        submittedAt,
      },
      create: {
        studentId,
        assignmentId,
        status: status as AssignmentStatus,
        submittedAt,
      },
      include: {
        assignment: {
          select: {
            id: true,
            title: true,
            courseId: true,
          },
        },
      },
    });

    res.status(200).json({
      message: 'Assignment status updated successfully',
      studentAssignment,
    });
  } catch (error) {
    next(error);
  }
}
