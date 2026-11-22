'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../../../../lib/api';
import { Enrollment, Course } from '../../../../types';
import { EnrollmentTable } from '../../../../components/enrollments/EnrollmentTable';
import { Users, Loader2 } from 'lucide-react';
import { useToast } from '../../../../components/ui/ToastProvider';

export default function AdminEnrollmentsPage() {
  const { success, error: toastError } = useToast();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchCoursesList = useCallback(async () => {
    try {
      const res = await api.get<{ courses: Course[] }>('/courses');
      setCourses(res.courses);
    } catch (err) {\n      console.error('Failed to load courses for filter:', err);\n    }\n  }, []);

  const fetchEnrollments = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedCourseId) params.append('courseId', selectedCourseId);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<{ enrollments: Enrollment[] }>(`/admin/enrollments${query}`);
      setEnrollments(res.enrollments);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toastError(err.message, 'Failed to Load Enrollments');
      } else {
        toastError('Unable to retrieve student enrollment list.', 'Error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseId, searchQuery, toastError]);

  useEffect(() => {
    fetchCoursesList();
  }, [fetchCoursesList]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEnrollments();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchEnrollments]);

  const handleRemoveEnrollment = async (enrollmentId: string) => {
    try {
      await api.delete(`/admin/enrollments/${enrollmentId}`);
      success('Student enrollment has been removed successfully.', 'Enrollment Removed');
      await fetchEnrollments();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toastError(err.message, 'Failed to Remove Enrollment');
      } else {
        toastError('Could not remove enrollment.', 'Error');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-academic-surface text-academic text-xs font-semibold mb-2">
          <Users className="w-3.5 h-3.5" />
          <span>Registrar Operations</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
          Student Enrollment Roster
        </h1>
        <p className="text-sm text-ink-muted mt-1 leading-relaxed">
          Comprehensive university roster of all registered students by course. Filter by specific
          academic offerings or search by student credentials.
        </p>
      </div>

      {isLoading && enrollments.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-ink-muted">
          <Loader2 className="w-8 h-8 animate-spin text-academic mb-3" />
          <p className="text-sm font-medium">Loading student enrollment roster...</p>
        </div>
      ) : (
        <EnrollmentTable
          enrollments={enrollments}
          courses={courses}
          onRemoveEnrollment={handleRemoveEnrollment}
          selectedCourseId={selectedCourseId}
          onSelectCourse={setSelectedCourseId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}