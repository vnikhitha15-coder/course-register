'use client';

import React from 'react';
import { RoleGuard } from '../../components/layout/RoleGuard';
import { Navbar } from '../../components/layout/Navbar';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['STUDENT']}>
      <div className="min-h-screen bg-canvas flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
