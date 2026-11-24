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
  creditType?: string;
  term?: string;
  totalClasses?: number;
  completedClasses?: number;
  nextClassAt?: string | null;
  nextClassLocation?: string | null;
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

// Student Academic Overview Types
export interface AcademicCourseOverview {
  id: string;
  code: string;
  title: string;
  instructor: string;
  credits: number;
  creditType: string;
  term: string;
  totalClasses: number;
  completedClasses: number;
  classesLeft: number;
  completionPercent: number;
  nextClassAt: string | null;
  nextClassLocation: string | null;
  nextExam: {
    id: string;
    title: string;
    examType: string;
    startTime: string;
    endTime: string;
    location: string;
  } | null;
  pendingAssignmentCount: number;
}

export type ExamType = 'MIDTERM' | 'FINAL' | 'QUIZ' | 'PRACTICAL' | 'OTHER';

export interface AcademicExam {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  title: string;
  examType: ExamType;
  startTime: string;
  endTime: string;
  location: string;
  syllabusNotes: string | null;
  isPast: boolean;
  hasConflict: boolean;
}

export type AssignmentStatus = 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';

export interface AcademicAssignment {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  title: string;
  description: string | null;
  dueDate: string;
  maxPoints: number;
  weightPercent: number | null;
  submissionUrl: string | null;
  status: AssignmentStatus;
  submittedAt: string | null;
  score: number | null;
  isOverdue: boolean;
}

export interface AcademicOverviewSummary {
  totalCredits: number;
  totalCourses: number;
  totalClassesLeft: number;
  totalClassesCompleted: number;
  totalClassesScheduled: number;
  overallCompletionPercent: number;
  nextExam: {
    id: string;
    courseCode: string;
    courseTitle: string;
    title: string;
    examType: string;
    startTime: string;
    endTime: string;
    location: string;
    hasConflict: boolean;
  } | null;
  pendingAssignmentsCount: number;
  overdueAssignmentsCount: number;
}

export interface AcademicOverviewResponse {
  summary: AcademicOverviewSummary;
  courses: AcademicCourseOverview[];
  exams: AcademicExam[];
  assignments: AcademicAssignment[];
}
