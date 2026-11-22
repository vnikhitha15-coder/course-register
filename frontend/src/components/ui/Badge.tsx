import React from 'react';

export type BadgeVariant = 'default' | 'academic' | 'warning' | 'destructive' | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({ variant = 'default', children, className = '', ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide transition-colors border select-none';

  const variantStyles = {
    default: 'bg-[#F2EFE9] text-ink border-border',
    academic: 'bg-academic-surface text-academic border-academic/20 font-semibold',
    warning: 'bg-ochre-surface text-ochre border-ochre-border font-medium',
    destructive: 'bg-crimson-surface text-crimson border-crimson-border font-medium',
    outline: 'bg-surface text-ink-muted border-border font-normal',
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
