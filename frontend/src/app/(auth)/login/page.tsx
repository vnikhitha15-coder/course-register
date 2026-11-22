'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { api, ApiError } from '../../../lib/api';
import { User } from '../../../types';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { GraduationCap, AlertCircle, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { useToast } from '../../../components/ui/ToastProvider';

export default function LoginPage() {
  const router = useRouter();
  const { loginUser } = useAuth();
  const { success } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    try {
      setIsLoading(true);
      const res = await api.post<{ user: User; token: string }>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      loginUser(res.user);
      success(`Welcome back, ${res.user.name}`, 'Authentication Successful');

      if (res.user.role === 'ADMIN') {
        router.push('/admin/courses');
      } else {
        router.push('/courses');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('Unable to connect to the authentication server.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutofill = (autofillEmail: string, autofillPass: string) => {
    setEmail(autofillEmail);
    setPassword(autofillPass);
    setErrors({});
    setServerError(null);
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-academic text-white flex items-center justify-center mx-auto mb-3 shadow-card">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            University Registrar
          </h1>
          <p className="text-xs uppercase tracking-wider text-ink-muted font-medium mt-1">
            Course Registration & Catalog Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-2xl border border-border shadow-card p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="font-serif text-xl font-bold text-ink">Sign In</h2>
            <p className="text-xs text-ink-muted mt-1">
              Enter your academic credentials to access course enrollment or catalog management.
            </p>
          </div>

          {serverError && (
            <div className="mb-5 p-3.5 bg-crimson-surface border border-crimson-border rounded-lg flex items-start gap-2.5 text-crimson text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Portal
            </Button>
          </form>

          {/* Quick Demo Autofill Pills */}
          <div className="mt-6 pt-5 border-t border-border/80">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-ink-light mb-2.5 text-center">
              Quick Test Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAutofill('admin@university.edu', 'Admin@123456')}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-canvas hover:bg-[#EAE5DC] border border-border text-[11px] font-medium text-ink transition-colors text-center"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-academic" />
                <span>Dr. Carter (Admin)</span>
              </button>

              <button
                type="button"
                onClick={() => handleAutofill('student1@university.edu', 'Student@123456')}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded bg-canvas hover:bg-[#EAE5DC] border border-border text-[11px] font-medium text-ink transition-colors text-center"
              >
                <UserCheck className="w-3.5 h-3.5 text-academic" />
                <span>Aarav (Student)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Link to Register */}
        <p className="text-center text-xs text-ink-muted mt-6">
          New student?{' '}
          <a
            href="/register"
            className="font-semibold text-academic hover:text-academic-hover underline transition-colors"
          >
            Create student registration account
          </a>
        </p>
      </div>
    </div>
  );
}
