export type Role = 'STUDENT' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string;
  credits: number;
  instructor: string;
  capacity: number;
  createdAt: string;
  updatedAt: string;
  enrolledCount: number;
  remainingSeats: number;
  isEnrolled: boolean;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: string;
  course: Course;
  student?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface EnrollmentSummary {
  totalCourses: number;
  totalCredits: number;
}

export interface AdminStats {
  totalCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  fullCoursesCount: number;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[] | string | unknown>;
  };
}
