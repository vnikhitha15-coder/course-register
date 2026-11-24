'use client';

import React from 'react';
import Link from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, LogOut, BookOpen, Users, BookMarked, LayoutDashboard } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';

  const navLinks = isAdmin
    ? [
        { href: '/admin/courses', label: 'Course Catalog & Stats', icon: BookOpen },
        { href: '/admin/enrollments', label: 'Student Enrollments', icon: Users },
      ]
    : [
        { href: '/academic-overview', label: 'Academic Overview', icon: LayoutDashboard },
        { href: '/courses', label: 'Browse Courses', icon: BookOpen },
        { href: '/my-courses', label: 'My Enrollments', icon: BookMarked },
      ];

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/95 backdrop-blur-md border-b border-border shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Left Navigation */}
          <div className="flex items-center gap-8">
            <a
              href={isAdmin ? '/admin/courses' : '/academic-overview'}
              className="flex items-center gap-2.5 group"
            >
              <div className="w-9 h-9 rounded-lg bg-academic flex items-center justify-center text-white shadow-subtle group-hover:bg-academic-hover transition-colors">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-lg font-bold text-ink tracking-tight block leading-tight">
                  University Registrar
                </span>
                <span className="text-[11px] uppercase tracking-wider text-ink-light font-medium block">
                  Course Registration Portal
                </span>
              </div>
            </a>

            {/* Navigation Pills */}
            <nav className="hidden md:flex items-center gap-1.5" aria-label="Main Navigation">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-academic-surface text-academic font-semibold border border-academic/20 shadow-subtle'
                        : 'text-ink-muted hover:text-ink hover:bg-canvas'
                    }`}\n                  >\n                    <Icon className=\"w-4 h-4 shrink-0\" />\n                    <span>{link.label}</span>\n                  </a>\n                );\n              })}\n            </nav>\n          </div>\n\n          {/* User Profile & Logout */}\n          <div className=\"flex items-center gap-3\">\n            <div className=\"hidden sm:flex flex-col text-right\">\n              <span className=\"text-sm font-semibold text-ink leading-tight\">{user.name}</span>\n              <span className=\"text-xs text-ink-muted\">{user.email}</span>\n            </div>\n\n            <Badge variant={isAdmin ? 'default' : 'academic'} className=\"uppercase\">\n              {user.role}\n            </Badge>\n\n            <Button\n              variant=\"outline\"\n              size=\"sm\"\n              onClick={() => logout()}\n              leftIcon={<LogOut className=\"w-3.5 h-3.5\" />}\n              className=\"ml-2 text-xs\"\n            >\n              <span className=\"hidden sm:inline\">Sign Out</span>\n            </Button>\n          </div>\n        </div>\n      </div>\n    </header>\n  );\n}\n