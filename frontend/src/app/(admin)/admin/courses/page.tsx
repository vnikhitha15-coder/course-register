'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '../../../../lib/api';
import { Course, AdminStats } from '../../../../types';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog';
import { CourseFormModal, CourseFormData } from '../../../../components/courses/CourseFormModal';
import {
  BookOpen,
  Users,
  UserCheck,
  AlertOctagon,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useToast } from '../../../../components/ui/ToastProvider';

export default function AdminCoursesPage() {
  const { success, error: toastError } = useToast();

  const [stats, setStats] = useState<AdminStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    fullCoursesCount: 0,
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsRes, coursesRes] = await Promise.all([
        api.get<AdminStats>('/admin/stats'),
        api.get<{ courses: Course[] }>(`/courses${search ? `?search=${encodeURIComponent(search)}` : ''}`),
      ]);
      setStats(statsRes);
      setCourses(coursesRes.courses);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toastError(err.message, 'Failed to Load Admin Data');
      } else {
        toastError('Failed to connect to registrar services.', 'Error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [search, toastError]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleOpenAdd = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: CourseFormData) => {
    setIsActionLoading(true);
    try {
      if (editingCourse) {
        await api.put(`/admin/courses/${editingCourse.id}`, data);
        success(`Course ${data.code} updated successfully.`, 'Course Updated');
      } else {
        await api.post('/admin/courses', data);
        success(`Course ${data.code} created successfully.`, 'Course Created');
      }
      await fetchData();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCourse) return;
    setIsActionLoading(true);
    try {
      await api.delete(`/admin/courses/${deletingCourse.id}`);
      success(
        `Course ${deletingCourse.code} and its enrolled students removed.`,
        'Course Deleted'
      );
      setDeletingCourse(null);
      await fetchData();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        toastError(err.message, 'Delete Failed');
      } else {
        toastError('Failed to delete course.', 'Error');
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Add CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            Curriculum Catalog & Course Control
          </h1>
          <p className="text-sm text-ink-muted mt-1 leading-relaxed">
            Manage course capacities, instructor assignments, credit allocations, and monitor real-time
            enrollment saturation.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={handleOpenAdd}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shrink-0"
        >
          Add New Course
        </Button>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between text-ink-light mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Total Courses
            </span>
            <BookOpen className="w-4 h-4 text-academic" />
          </div>
          <div className="font-serif text-3xl font-bold text-ink tabular-nums">
            {stats.totalCourses}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between text-ink-light mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Active Students
            </span>
            <Users className="w-4 h-4 text-academic" />
          </div>
          <div className="font-serif text-3xl font-bold text-ink tabular-nums">
            {stats.totalStudents}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between text-ink-light mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Enrollments
            </span>
            <UserCheck className="w-4 h-4 text-academic" />
          </div>
          <div className="font-serif text-3xl font-bold text-ink tabular-nums">
            {stats.totalEnrollments}
          </div>
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between text-ink-light mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Full Courses
            </span>
            <AlertOctagon className="w-4 h-4 text-crimson" />
          </div>
          <div className="font-serif text-3xl font-bold text-ink tabular-nums">
            {stats.fullCoursesCount}
          </div>
        </div>
      </div>

      {/* Search and Table Container */}
      <div className="space-y-4">
        {/* Search Input */}
        <div className="bg-surface p-4 rounded-xl border border-border shadow-subtle flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-ink-light absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter courses by code, title, or instructor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm text-ink bg-canvas/60 border border-border rounded-md placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-academic/20 focus:border-academic"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
          {isLoading ? (\n            <div className="py-20 flex flex-col items-center justify-center text-ink-muted">\n              <Loader2 className="w-8 h-8 animate-spin text-academic mb-3" />\n              <p className="text-sm font-medium">Loading course catalog...</p>\n            </div>\n          ) : (\n            <div className="overflow-x-auto">\n              <table className="w-full text-left border-collapse">\n                <thead>\n                  <tr className="bg-canvas border-b border-border text-[11px] font-semibold text-ink-muted uppercase tracking-wider">\n                    <th className="py-3 px-4">Code</th>\n                    <th className="py-3 px-4">Title & Instructor</th>\n                    <th className="py-3 px-4">Credits</th>\n                    <th className="py-3 px-4 min-w-[200px]">Capacity & Occupancy</th>\n                    <th className="py-3 px-4 text-right">Actions</th>\n                  </tr>\n                </thead>\n                <tbody className="divide-y divide-border/60 text-sm">\n                  {courses.length === 0 ? (\n                    <tr>\n                      <td colSpan={5} className="py-12 text-center text-ink-muted">\n                        <p className="font-serif text-base text-ink mb-1">No courses found</p>\n                        <p className="text-xs">\n                          {search\n                            ? 'No courses matched your search query.'\n                            : 'No courses currently registered in catalog.'}\n                        </p>\n                      </td>\n                    </tr>\n                  ) : (\n                    courses.map((course) => {\n                      const isFull = course.enrolledCount >= course.capacity;\n                      const occupancyPct = Math.min(\n                        100,\n                        Math.round((course.enrolledCount / course.capacity) * 100)\n                      );\n\n                      return (\n                        <tr key={course.id} className="hover:bg-canvas/40 transition-colors">\n                          {/* Code */}\n                          <td className="py-3.5 px-4">\n                            <Badge variant="default" className="font-mono text-xs font-bold">\n                              {course.code}\n                            </Badge>\n                          </td>\n\n                          {/* Title & Instructor */}\n                          <td className="py-3.5 px-4">\n                            <div className="font-semibold text-ink leading-tight">\n                              {course.title}\n                            </div>\n                            <div className="text-xs text-ink-muted mt-0.5">\n                              {course.instructor}\n                            </div>\n                          </td>\n\n                          {/* Credits */}\n                          <td className="py-3.5 px-4 tabular-nums">\n                            <Badge variant="outline" className="text-xs">\n                              {course.credits} Credits\n                            </Badge>\n                          </td>\n\n                          {/* Capacity & Occupancy Bar */}\n                          <td className="py-3.5 px-4">\n                            <div className="flex items-center justify-between text-xs mb-1 tabular-nums">\n                              <span className="font-semibold text-ink">\n                                {course.enrolledCount} / {course.capacity} seats\n                              </span>\n                              <span\n                                className={`font-semibold ${\n                                  isFull ? 'text-crimson' : 'text-academic'\n                                }`}\n                              >\n                                {occupancyPct}%\n                              </span>\n                            </div>\n                            <div className="w-full h-1.5 bg-[#EFECE6] rounded-full overflow-hidden">\n                              <div\n                                className={`h-full rounded-full ${\n                                  isFull ? 'bg-crimson' : 'bg-academic'\n                                }`}\n                                style={{ width: `${occupancyPct}%` }}\n                              />\n                            </div>\n                          </td>\n\n                          {/* Actions */}\n                          <td className="py-3.5 px-4 text-right">\n                            <div className="inline-flex items-center gap-1.5">\n                              <Button\n                                variant="outline"\n                                size="sm"\n                                onClick={() => handleOpenEdit(course)}\n                                leftIcon={<Edit2 className="w-3.5 h-3.5" />}\n                                className="text-xs"\n                              >\n                                Edit\n                              </Button>\n                              <Button\n                                variant="destructive-outline"\n                                size="sm"\n                                onClick={() => setDeletingCourse(course)}\n                                leftIcon={<Trash2 className="w-3.5 h-3.5" />}\n                                className="text-xs"\n                              >\n                                Delete\n                              </Button>\n                            </div>\n                          </td>\n                        </tr>\n                      );\n                    })\n                  )}\n                </tbody>\n              </table>\n            </div>\n          )}\n        </div>\n      </div>\n\n      {/* Add / Edit Course Modal */}\n      <CourseFormModal\n        isOpen={isModalOpen}\n        onClose={() => setIsModalOpen(false)}\n        onSubmit={handleFormSubmit}\n        course={editingCourse}\n        isLoading={isActionLoading}\n      />\n\n      {/* Delete Confirmation Dialog */}\n      <ConfirmDialog\n        isOpen={Boolean(deletingCourse)}\n        onClose={() => setDeletingCourse(null)}\n        onConfirm={handleConfirmDelete}\n        title="Delete Academic Course"\n        message={`Are you sure you want to permanently delete course ${deletingCourse?.code} (${deletingCourse?.title})? This will also remove all ${deletingCourse?.enrolledCount ?? 0} active student enrollments registered for this course.`}\n        confirmLabel="Delete Course"\n        isDestructive\n        isLoading={isActionLoading}\n      />\n    </div>\n  );\n}