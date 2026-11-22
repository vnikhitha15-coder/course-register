'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api, ApiError } from '../../../lib/api';
import { Course } from '../../../types';
import { CourseCard } from '../../../components/courses/CourseCard';
import { Search, BookMarked, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '../../../components/ui/ToastProvider';

export default function StudentCoursesPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCredits, setSelectedCredits] = useState<number | null>(null);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (selectedCredits !== null) params.append('credits', String(selectedCredits));

      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await api.get<{ courses: Course[] }>(`/courses${query}`);
      setCourses(res.courses);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toastError(err.message, 'Failed to Load Courses');
      } else {
        toastError('Failed to load courses. Please try again.', 'Network Error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCredits, toastError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchCourses]);

  const handleEnroll = async (courseId: string) => {
    try {
      setEnrollingId(courseId);
      await api.post('/enrollments', { courseId });

      const enrolledCourse = courses.find((c) => c.id === courseId);
      success(
        `You have successfully registered for ${enrolledCourse?.code ?? 'the course'} (${enrolledCourse?.title ?? ''}).`,
        'Enrollment Confirmed'
      );

      // Re-fetch courses for fresh state & seat calculations
      await fetchCourses();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toastError(err.message, 'Enrollment Failed');
      } else {
        toastError('Could not process registration. Please try again.', 'Error');
      }
    } finally {
      setEnrollingId(null);
    }
  };

  const creditFilters = [
    { label: 'All Credits', value: null },
    { label: '2 Credits', value: 2 },
    { label: '3 Credits', value: 3 },
    { label: '4 Credits', value: 4 },
  ];

  return (
    <div className="space-y-8">
      {/* Student Welcome Header Banner */}
      <div className="bg-surface rounded-2xl border border-border shadow-card p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-academic-surface text-academic text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Academic Term 2026–2027</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="text-sm text-ink-muted mt-1 leading-relaxed max-w-2xl">
            Browse active course offerings, verify remaining seat allocations, and register for
            your required curriculum credits.
          </p>
        </div>

        <a
          href="/my-courses"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-canvas hover:bg-[#ECE7DE] border border-border text-sm font-semibold text-ink transition-colors shrink-0 shadow-subtle group"
        >
          <BookMarked className="w-4 h-4 text-academic" />
          <span>View My Enrolled Courses</span>
          <ArrowRight className="w-4 h-4 text-ink-light group-hover:translate-x-0.5 transition-transform" />
        </a>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-ink-light absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by course code, title, instructor, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm text-ink bg-surface border border-border rounded-lg placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-academic/20 focus:border-academic shadow-subtle"
          />
        </div>

        {/* Credit Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {creditFilters.map((pill) => {
            const isSelected = selectedCredits === pill.value;
            return (
              <button
                key={pill.label}
                type="button"
                onClick={() => setSelectedCredits(pill.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all select-none shrink-0 ${
                  isSelected
                    ? 'bg-academic text-white font-semibold shadow-subtle'
                    : 'bg-surface text-ink-muted hover:text-ink border border-border hover:bg-canvas'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-ink-muted">
          <Loader2 className="w-8 h-8 animate-spin text-academic mb-3" />
          <p className="text-sm font-medium">Loading academic course catalog...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-border p-12 text-center max-w-lg mx-auto shadow-subtle">
          <div className="w-12 h-12 rounded-full bg-canvas text-ink-muted flex items-center justify-center mx-auto mb-3">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="font-serif text-lg font-bold text-ink">No matching courses found</h3>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">
            We couldn't find any courses matching your search criteria. Try modifying your search term
            or clearing the credit filter.
          </p>
          {(search || selectedCredits !== null) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setSelectedCredits(null);
              }}
              className="mt-4 px-3.5 py-1.5 rounded-md bg-canvas hover:bg-border text-xs font-medium text-ink transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onEnroll={handleEnroll}
              isEnrolling={enrollingId === course.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
