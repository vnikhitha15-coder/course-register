'use client';

import React, { useState, useMemo } from 'react';
import { AcademicAssignment, AssignmentStatus } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  CheckSquare,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface AssignmentTrackerProps {
  assignments: AcademicAssignment[];
  onUpdateStatus: (assignmentId: string, nextStatus: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED') => Promise<void>;
  isUpdatingId: string | null;
}

export function AssignmentTracker({
  assignments,
  onUpdateStatus,
  isUpdatingId,
}: AssignmentTrackerProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique courses for filter dropdown
  const uniqueCourses = useMemo(() => {
    const map = new Map<string, string>();
    assignments.forEach((a) => {
      if (!map.has(a.courseCode)) {
        map.set(a.courseCode, a.courseTitle);
      }
    });
    return Array.from(map.entries()).map(([code, title]) => ({ code, title }));
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      // Status filter
      if (filterStatus === 'pending') {
        if (item.status !== 'PENDING' && item.status !== 'IN_PROGRESS') return false;
      } else if (filterStatus === 'in_progress') {
        if (item.status !== 'IN_PROGRESS') return false;
      } else if (filterStatus === 'overdue') {
        if (!item.isOverdue) return false;
      } else if (filterStatus === 'completed') {
        if (item.status !== 'SUBMITTED' && item.status !== 'GRADED') return false;
      }

      // Course filter
      if (filterCourse !== 'all' && item.courseCode !== filterCourse) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesCourse = item.courseCode.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query) ?? false;
        if (!matchesTitle && !matchesCourse && !matchesDesc) return false;
      }

      return true;
    });
  }, [assignments, filterStatus, filterCourse, searchQuery]);

  const formatDueDate = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getUrgencyBadge = (item: AcademicAssignment) => {
    if (item.status === 'GRADED') {
      return (
        <Badge variant="academic" className="text-xs font-semibold">
          Graded: {item.score} / {item.maxPoints} pts
        </Badge>
      );
    }

    if (item.status === 'SUBMITTED') {
      return (
        <Badge variant="academic" className="text-xs font-medium">
          Submitted
        </Badge>
      );
    }

    if (item.isOverdue) {
      return (
        <Badge variant="destructive" className="text-xs font-semibold animate-pulse">
          Overdue
        </Badge>
      );
    }

    try {
      const diffMs = new Date(item.dueDate).getTime() - Date.now();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays <= 2) {
        return (
          <Badge variant="warning" className="text-xs font-semibold">
            Due in {diffDays} {diffDays === 1 ? 'day' : 'days'}
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="text-xs text-ink-muted">
          Due in {diffDays} days
        </Badge>
      );
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink tracking-tight">
            Assignments & Course Tasks
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Track coursework deadlines, manage personal completion workflow, and monitor graded milestones.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface p-4 rounded-xl border border-border shadow-subtle flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-ink-light absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search assignments by title, course, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm text-ink bg-canvas/60 border border-border rounded-md placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-academic/20 focus:border-academic"
          />
        </div>

        {/* Filter by Status */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'pending', label: 'To Do' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'overdue', label: 'Overdue' },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === tab.id
                  ? 'bg-academic text-white shadow-subtle'
                  : 'bg-canvas text-ink-muted hover:text-ink hover:bg-border/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter by Course */}
        {uniqueCourses.length > 1 && (
          <div className="flex items-center gap-1.5 min-w-[160px]">
            <Filter className="w-3.5 h-3.5 text-ink-light shrink-0" />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs text-ink bg-surface border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-academic/20"
            >
              <option value="all">All Enrolled Courses</option>
              {uniqueCourses.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Assignment Items List */}
      {filteredAssignments.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center text-ink-muted">
          <CheckSquare className="w-8 h-8 mx-auto text-ink-light mb-2" />
          <p className="font-serif text-base text-ink mb-1">No Assignments Found</p>
          <p className="text-xs">
            {searchQuery || filterStatus !== 'all' || filterCourse !== 'all'
              ? 'No assignments match the selected filter criteria.'
              : 'You have no coursework or problem sets assigned at this moment.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((assignment) => {
            const isUpdating = isUpdatingId === assignment.id;
            const isDone =
              assignment.status === 'SUBMITTED' || assignment.status === 'GRADED';

            return (
              <div
                key={assignment.id}
                className={`bg-surface rounded-xl border p-4 sm:p-5 shadow-card transition-all ${
                  assignment.isOverdue
                    ? 'border-crimson/40 hover:border-crimson'
                    : 'border-border hover:border-border-hover'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left Column: Info & Details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="default" className="font-mono text-xs font-bold">
                        {assignment.courseCode}
                      </Badge>

                      {getUrgencyBadge(assignment)}

                      {assignment.weightPercent && (
                        <span className="text-xs text-ink-light font-medium">
                          Weight: {assignment.weightPercent}% of grade
                        </span>
                      )}
                    </div>

                    <h4
                      className={`font-serif text-base sm:text-lg font-bold leading-snug ${
                        isDone ? 'text-ink-muted line-through' : 'text-ink'
                      }`}
                    >
                      {assignment.title}
                    </h4>

                    {assignment.description && (
                      <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">
                        {assignment.description}
                      </p>
                    )}

                    {/* Metadata strip */}
                    <div className="flex items-center gap-4 text-xs text-ink-muted pt-1 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 font-medium ${
                          assignment.isOverdue ? 'text-crimson' : 'text-ink'
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5 text-academic" />
                        Due: {formatDueDate(assignment.dueDate)}
                      </span>
                      <span className="text-ink-light">
                        Max: {assignment.maxPoints} pts
                      </span>
                      {assignment.submittedAt && (
                        <span className="text-academic font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Submitted {formatDueDate(assignment.submittedAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Interactive Status Controls */}
                  <div className="shrink-0 flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                    {assignment.status === 'GRADED' ? (
                      <div className="text-right">
                        <span className="text-xs text-ink-light block">Final Score</span>
                        <span className="font-serif text-lg font-bold text-academic">
                          {assignment.score} / {assignment.maxPoints}
                        </span>
                      </div>
                    ) : assignment.status === 'SUBMITTED' ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="academic" className="text-xs font-semibold">
                          Turned In
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUpdateStatus(assignment.id, 'IN_PROGRESS')}
                          isLoading={isUpdating}
                          leftIcon={<RotateCcw className="w-3 h-3" />}
                          className="text-xs text-ink-muted hover:text-ink"
                        >
                          Reopen
                        </Button>
                      </div>
                    ) : assignment.status === 'IN_PROGRESS' ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onUpdateStatus(assignment.id, 'SUBMITTED')}
                          isLoading={isUpdating}
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          className="text-xs"
                        >
                          Mark Submitted
                        </Button>
                      </div>
                    ) : (
                      /* PENDING */
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateStatus(assignment.id, 'IN_PROGRESS')}
                          isLoading={isUpdating}
                          leftIcon={<Clock className="w-3 h-3" />}
                          className="text-xs"
                        >
                          Start Task
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onUpdateStatus(assignment.id, 'SUBMITTED')}
                          isLoading={isUpdating}
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          className="text-xs"
                        >
                          Submit
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
