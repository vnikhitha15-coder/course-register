'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { api, ApiError } from '../../../lib/api';
import { User } from '../../../types';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { GraduationCap, AlertCircle, ArrowRight } from 'lucide-react';
import { useToast } from '../../../components/ui/ToastProvider';

export default function RegisterPage() {
  const router = useRouter();
  const { loginUser } = useAuth();
  const { success } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) {
      errs.name = 'Full name is required';
    } else if (name.trim().length < 2 || name.trim().length > 80) {
      errs.name = 'Name must be between 2 and 80 characters';
    }

    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid university email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters long';
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
      const res = await api.post<{ user: User; token: string }>('/auth/register', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      loginUser(res.user);
      success(`Welcome to Course Registration, ${res.user.name}!`, 'Account Created');
      router.push('/courses');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('An unexpected error occurred while creating your account.');
      }
    } finally {
      setIsLoading(false);
    }
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
            Student Registration Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-2xl border border-border shadow-card p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="font-serif text-xl font-bold text-ink">Create Student Account</h2>
            <p className="text-xs text-ink-muted mt-1">
              Register as an enrolled university student to browse and select course offerings.
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
              label="Full Name"
              type="text"
              placeholder="e.g. Maya Lin"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              required
              autoFocus
            />

            <Input
              label="Student Email Address"
              type="email"
              placeholder="student@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              required
            />

            <Input
              label="Password (min. 8 characters)"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              helperText="Must be at least 8 characters long."
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
              Complete Registration
            </Button>
          </form>
        </div>

        {/* Link to Login */}
        <p className="text-center text-xs text-ink-muted mt-6">
          Already registered?{' '}
          <a
            href="/login"
            className="font-semibold text-academic hover:text-academic-hover underline transition-colors"
          >
            Sign in to existing account
          </a>
        </p>
      </div>
    </div>
  );
}
