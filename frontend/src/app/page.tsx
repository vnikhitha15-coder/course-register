'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'ADMIN') {
        router.push('/admin/courses');
      } else {
        router.push('/courses');
      }
    }
  }, [user, isLoading, router]);

  return (
    <main className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3 text-ink-muted">
        <Loader2 className="w-8 h-8 animate-spin text-academic" />
        <p className="font-serif text-lg text-ink">University Registrar</p>
        <p className="text-xs tracking-wider uppercase text-ink-light font-medium">
          Loading portal session...
        </p>
      </div>
    </main>
  );
}
