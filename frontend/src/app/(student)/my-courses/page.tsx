'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../../../lib/api';
import { Enrollment, EnrollmentSummary } from '../../../types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { BookOpen, Calendar, BookMarked, User, Loader2, ArrowRight, Trash2 } from 'lucide-react';
import { useToast } from '../../../components/ui/ToastProvider';

export default function MyCoursesPage() {
  const { success, error: toastError } = useToast();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [summary, setSummary] = useState<EnrollmentSummary>({ totalCourses: 0, totalCredits: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [droppingCourse, setDroppingCourse] = useState<Enrollment | null>(null);
  const [isDropping, setIsDropping] = useState<boolean>(false);

  const fetchMyEnrollments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get<{
        enrollments: Enrollment[];
        summary: EnrollmentSummary;
      }>('/enrollments/me');
      setEnrollments(res.enrollments);
      setSummary(res.summary);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toastError(err.message, 'Failed to Load Enrollments');
      } else {
        toastError('Unable to load your registered courses.', 'Error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchMyEnrollments();
  }, [fetchMyEnrollments]);

  const handleConfirmDrop = async () => {
    if (!droppingCourse) return;

    try {
      setIsDropping(true);
      await api.delete(`/enrollments/${droppingCourse.course.id}`);

      success(
        `Successfully dropped ${droppingCourse.course.code} (${droppingCourse.course.title}).`,
        'Course Dropped'
      );

      // Re-fetch enrollments & updated credit sum
      await fetchMyEnrollments();
      setDroppingCourse(null);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toastError(err.message, 'Failed to Drop Course');
      } else {
        toastError('An unexpected error occurred while dropping the course.', 'Error');
      }
    } finally {
      setIsDropping(false);
    }
  };

  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            My Registered Courses
          </h1>
          <p className="text-sm text-ink-muted mt-1 leading-relaxed">
            Review your active academic enrollment schedule, monitor total credit hours, or drop
            courses within the open registration window.
          </p>
        </div>

        <a
          href="/courses"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-academic text-white hover:bg-academic-hover text-sm font-semibold transition-colors shrink-0 shadow-subtle"
        >
          <BookOpen className="w-4 h-4" />
          <span>Browse Course Catalog</span>
        </a>
      </div>

      {/* Summary KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-surface rounded-xl border border-border shadow-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-academic-surface text-academic flex items-center justify-center shrink-0">
            <BookMarked className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-ink-muted font-medium block">
              Enrolled Courses
            </span>
            <span className="font-serif text-2xl sm:text-3xl font-bold text-ink tabular-nums">
              {summary.totalCourses}
            </span>
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-ochre-surface text-ochre flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-ink-muted font-medium block">
              Total Credit Hours
            </span>
            <span className="font-serif text-2xl sm:text-3xl font-bold text-ink tabular-nums">
              {summary.totalCredits} <span className="text-sm font-normal text-ink-muted">credits</span>
            </span>
          </div>
        </div>
      </div>

      {/* Enrolled Courses List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-ink-muted">
          <Loader2 className="w-8 h-8 animate-spin text-academic mb-3" />
          <p className="text-sm font-medium">Loading your enrolled courses...</p>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center max-w-lg mx-auto shadow-card">
          <div className="w-12 h-12 rounded-full bg-academic-surface text-academic flex items-center justify-center mx-auto mb-3">
            <BookMarked className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl font-bold text-ink mb-1">
            No courses currently enrolled
          </h3>
          <p className="text-xs text-ink-muted leading-relaxed max-w-sm mx-auto mb-6">
            You have not registered for any courses for the upcoming term. Explore the catalog to select
            your curriculum courses.
          </p>
          <a
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-academic text-white hover:bg-academic-hover text-sm font-semibold transition-colors shadow-subtle"
          >
            <span>Explore Course Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {enrollments.map((enr) => (
            <div
              key={enr.id}
              className="bg-surface rounded-xl border border-border hover:border-border-hover shadow-card p-5 sm:p-6 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Badge variant="default" className="font-mono text-xs font-bold">
                    {enr.course.code}
                  </Badge>
                  <Badge variant="outline" className="tabular-nums text-xs">
                    {enr.course.credits} Credits
                  </Badge>
                  <span className="text-xs text-ink-light flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Enrolled {formatDate(enr.enrolledAt)}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-bold text-ink leading-snug">
                  {enr.course.title}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <User className="w-3.5 h-3.5 text-ink-light" />
                  <span>Instructor: <strong className="text-ink font-medium">{enr.course.instructor}</strong></span>
                </div>

                <p className="text-xs text-ink-muted line-clamp-2 max-w-3xl leading-relaxed">
                  {enr.course.description}
                </p>
              </div>

              <div className="shrink-0 flex items-center pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                <Button
                  variant="destructive-outline"
                  size="sm"
                  onClick={() => setDroppingCourse(enr)}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  Drop Course
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drop Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(droppingCourse)}
        onClose={() => setDroppingCourse(null)}
        onConfirm={handleConfirmDrop}
        title="Confirm Course Withdrawal"
        message={`Are you sure you want to drop ${droppingCourse?.course.code} — ${droppingCourse?.course.title}? You will forfeit your reserved seat and this course will be removed from your transcript schedule.`}
        confirmLabel="Drop Course"
        isDestructive
        isLoading={isDropping}
      />
    </div>
  );
}
