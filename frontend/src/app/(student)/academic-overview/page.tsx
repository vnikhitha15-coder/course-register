'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../../../lib/api';
import { AcademicOverviewResponse } from '../../../types';
import { SummaryStrip } from '../../../components/academic/SummaryStrip';
import { CourseProgressCard } from '../../../components/academic/CourseProgressCard';
import { ExamTimeline } from '../../../components/academic/ExamTimeline';
import { AssignmentTracker } from '../../../components/academic/AssignmentTracker';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/ToastProvider';
import {
  GraduationCap,
  BookOpen,
  Calendar,
  RotateCw,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export default function AcademicOverviewPage() {
  const { success, error: toastError } = useToast();

  const [data, setData] = useState<AcademicOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingAssignmentId, setUpdatingAssignmentId] = useState<string | null>(null);

  const fetchOverview = useCallback(
    async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) {
          setIsRefreshing(true);
        } else {
          setIsLoading(true);
        }
        setError(null);

        const res = await api.get<AcademicOverviewResponse>('/student/academic-overview');
        setData(res);

        if (isManualRefresh) {
          success('Academic metrics and schedules updated successfully.', 'Overview Refreshed');
        }
      } catch (err: unknown) {
        let msg = 'Failed to load your academic overview.';
        if (err instanceof ApiError) {
          msg = err.message;
        }
        setError(msg);
        toastError(msg, 'Academic Sync Error');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [success, toastError]
  );

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleUpdateAssignmentStatus = async (
    assignmentId: string,
    nextStatus: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED'
  ) => {
    try {
      setUpdatingAssignmentId(assignmentId);
      await api.patch(`/student/assignments/${assignmentId}/status`, {
        status: nextStatus,
      });

      const label =
        nextStatus === 'SUBMITTED'
          ? 'submitted'
          : nextStatus === 'IN_PROGRESS'
          ? 'in progress'
          : 'pending';

      success(`Assignment marked as ${label}.`, 'Status Updated');
      // Re-sync all aggregations deterministically from backend
      await fetchOverview(false);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toastError(err.message, 'Update Failed');
      } else {
        toastError('Unable to update assignment status.', 'Error');
      }
    } finally {
      setUpdatingAssignmentId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-ink-muted">
        <Loader2 className="w-9 h-9 animate-spin text-academic mb-3" />
        <h3 className="font-serif text-lg text-ink font-bold">Synchronizing Academic Overview</h3>
        <p className="text-xs text-ink-light mt-1">
          Loading course attendance progress, examination schedules, and pending coursework...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-surface rounded-2xl border border-crimson-border p-10 max-w-lg mx-auto text-center shadow-card my-12">
        <div className="w-12 h-12 rounded-full bg-crimson-surface text-crimson flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="font-serif text-xl font-bold text-ink mb-1">
          Unable to Load Academic Overview
        </h3>
        <p className="text-xs text-ink-muted leading-relaxed max-w-sm mx-auto mb-6">
          {error || 'An unexpected communication error occurred with the academic registrar service.'}
        </p>
        <Button
          variant="primary"
          size="md"
          onClick={() => fetchOverview(false)}
          leftIcon={<RotateCw className="w-4 h-4" />}
          className="mx-auto"
        >
          Retry Academic Sync
        </Button>
      </div>
    );
  }

  const hasEnrollments = data.courses.length > 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-academic-surface text-academic text-xs font-semibold mb-2">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Academic Performance & Timeline</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Student Academic Overview
          </h1>
          <p className="text-sm text-ink-muted mt-1 leading-relaxed">
            Monitor real-time course session completion, accumulated semester credit load, upcoming
            assessments, and deadline-driven assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="md"
            onClick={() => fetchOverview(true)}
            isLoading={isRefreshing}
            leftIcon={<RotateCw className="w-4 h-4" />}
          >
            Refresh
          </Button>

          <a
            href="/courses"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-academic text-white hover:bg-academic-hover text-sm font-semibold transition-colors shadow-subtle"
          >
            <BookOpen className="w-4 h-4" />
            <span>Course Catalog</span>
          </a>
        </div>
      </div>

      {/* Summary KPI Cards Strip */}
      <SummaryStrip summary={data.summary} />

      {!hasEnrollments ? (
        /* Empty State */
        <div className="bg-surface rounded-2xl border border-border p-12 text-center max-w-md mx-auto shadow-card">
          <div className="w-12 h-12 rounded-full bg-academic-surface text-academic flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl font-bold text-ink mb-1">
            No Active Course Enrollments
          </h3>
          <p className="text-xs text-ink-muted leading-relaxed max-w-sm mx-auto mb-6">
            You are not currently enrolled in any academic courses for this semester. Register for courses
            in the catalog to activate your personalized schedule, session tracking, and exams.
          </p>
          <a
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-academic text-white hover:bg-academic-hover text-sm font-semibold transition-colors shadow-subtle mx-auto"
          >
            <span>Browse Available Courses</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <>
          {/* Section 1: Classes Left & Course Progress */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink tracking-tight">
                  Enrolled Courses & Class Completion
                </h2>
                <p className="text-xs text-ink-muted mt-0.5">
                  Detailed breakdown of remaining lecture sessions, attendance velocity, and assigned
                  faculty across all {data.courses.length} enrolled subjects.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {data.courses.map((course) => (
                <CourseProgressCard key={course.id} course={course} />
              ))}
            </div>
          </div>

          {/* Section 2: Examination Schedule & Timeline */}
          <div className="pt-2">
            <ExamTimeline exams={data.exams} />
          </div>

          {/* Section 3: Prioritized Assignments & To-Do Tracker */}
          <div className="pt-2">
            <AssignmentTracker
              assignments={data.assignments}
              onUpdateStatus={handleUpdateAssignmentStatus}
              isUpdatingId={updatingAssignmentId}
            />
          </div>
        </>
      )}
    </div>
  );
}
