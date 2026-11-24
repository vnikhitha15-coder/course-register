'use client';

import React, { useState } from 'react';
import { AcademicExam } from '../../types';
import { Badge } from '../ui/Badge';
import {
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  Info,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ExamTimelineProps {
  exams: AcademicExam[];
}

export function ExamTimeline({ exams }: ExamTimelineProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  const upcomingExams = exams.filter((e) => !e.isPast);
  const pastExams = exams.filter((e) => e.isPast);

  const displayedExams = activeTab === 'upcoming' ? upcomingExams : pastExams;
  const hasAnyConflict = upcomingExams.some((e) => e.hasConflict);

  const toggleNotes = (id: string) => {
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatExamDate = (isoStart: string): string => {
    try {
      const d = new Date(isoStart);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoStart;
    }
  };

  const formatExamTimeRange = (isoStart: string, isoEnd: string): string => {
    try {
      const s = new Date(isoStart);
      const e = new Date(isoEnd);
      const startStr = s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const endStr = e.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      const durationHours = Math.round(((e.getTime() - s.getTime()) / (1000 * 60 * 60)) * 10) / 10;
      return `${startStr} – ${endStr} (${durationHours} hrs)`;
    } catch {
      return '';
    }
  };

  const getCountdownString = (isoStart: string, isPast: boolean): string => {
    if (isPast) return 'Concluded';
    try {
      const diffMs = new Date(isoStart).getTime() - Date.now();
      if (diffMs <= 0) return 'In Progress';
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const days = Math.floor(hours / 24);

      if (days === 0) return `In ${hours} hours`;
      if (days === 1) return `Tomorrow`;
      return `In ${days} days`;
    } catch {
      return '';
    }
  };

  const getExamTypeVariant = (type: string) => {
    switch (type) {
      case 'FINAL':
        return 'destructive';
      case 'MIDTERM':
        return 'warning';
      case 'PRACTICAL':
        return 'academic';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink tracking-tight">
            Examination Schedule
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Synchronized timetable of upcoming midterms, practicals, quizzes, and final examinations.
          </p>
        </div>

        {/* Tab pills */}
        <div className="inline-flex items-center p-1 bg-canvas border border-border rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-surface text-ink shadow-subtle'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Upcoming ({upcomingExams.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('past')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeTab === 'past'
                ? 'bg-surface text-ink shadow-subtle'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            Concluded ({pastExams.length})
          </button>
        </div>
      </div>

      {/* Overlapping Conflict Alert Banner */}
      {hasAnyConflict && activeTab === 'upcoming' && (
        <div className="p-4 rounded-xl bg-crimson-surface border border-crimson-border flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-crimson shrink-0 mt-0.5" />
          <div className="text-xs text-crimson leading-relaxed">
            <strong className="font-semibold block text-sm">Examination Time Conflict Warning</strong>
            One or more upcoming examinations overlap in your personal academic schedule. Please review
            the flagged assessments below and contact the university registrar or your academic advisor
            promptly for conflict resolution.
          </div>
        </div>
      )}

      {/* Exam Cards List */}
      {displayedExams.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center text-ink-muted">
          <Calendar className="w-8 h-8 mx-auto text-ink-light mb-2" />
          <p className="font-serif text-base text-ink mb-1">
            {activeTab === 'upcoming' ? 'No Upcoming Examinations' : 'No Past Examinations'}
          </p>
          <p className="text-xs">
            {activeTab === 'upcoming'
              ? 'You have no pending midterms or final exams scheduled for enrolled courses.'
              : 'You have not completed any examinations in this academic period yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedExams.map((exam) => {
            const isExpanded = Boolean(expandedNotes[exam.id]);
            return (
              <div
                key={exam.id}
                className={`bg-surface rounded-xl border p-4 sm:p-5 shadow-card transition-all ${
                  exam.hasConflict
                    ? 'border-crimson/50 hover:border-crimson'
                    : 'border-border hover:border-border-hover'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left Column: Course & Exam Info */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="default" className="font-mono text-xs font-bold">
                        {exam.courseCode}
                      </Badge>
                      <Badge variant={getExamTypeVariant(exam.examType)} className="text-xs">
                        {exam.examType}
                      </Badge>

                      {exam.hasConflict && (
                        <Badge variant="destructive" className="text-xs font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Time Conflict</span>
                        </Badge>
                      )}

                      <span className="text-xs font-semibold text-ink-muted">
                        {getCountdownString(exam.startTime, exam.isPast)}
                      </span>
                    </div>

                    <h4 className="font-serif text-base sm:text-lg font-bold text-ink leading-snug">
                      {exam.title}
                    </h4>

                    <p className="text-xs text-ink-muted font-medium truncate">
                      {exam.courseTitle}
                    </p>

                    {/* Venue & Time Row */}
                    <div className="flex items-center gap-4 text-xs text-ink-muted pt-1 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 font-medium text-ink">
                        <Calendar className="w-3.5 h-3.5 text-academic" />
                        {formatExamDate(exam.startTime)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-ink-light" />
                        {formatExamTimeRange(exam.startTime, exam.endTime)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-ink-muted">
                        <MapPin className="w-3.5 h-3.5 text-ink-light" />
                        {exam.location}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Status & Syllabus Toggle */}
                  <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                    {exam.isPast ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-academic">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-academic-surface text-academic">
                        Confirmed
                      </span>
                    )}

                    {exam.syllabusNotes && (
                      <button
                        type="button"
                        onClick={() => toggleNotes(exam.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-academic hover:text-academic-hover underline transition-colors"
                      >
                        <Info className="w-3 h-3" />
                        <span>{isExpanded ? 'Hide Notes' : 'Syllabus & Notes'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible Syllabus Notes */}
                {isExpanded && exam.syllabusNotes && (
                  <div className="mt-3 pt-3 border-t border-border/80 text-xs text-ink-muted bg-canvas/40 p-3 rounded-lg leading-relaxed">
                    <strong className="text-ink font-semibold block mb-0.5">Syllabus & Guidelines:</strong>
                    {exam.syllabusNotes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
