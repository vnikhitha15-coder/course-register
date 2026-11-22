import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, required, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-ink uppercase tracking-wider">
            {label} {required && <span className="text-crimson">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          className={`w-full px-3.5 py-2 text-sm text-ink bg-surface border rounded-md transition-colors placeholder:text-ink-light focus:outline-none focus:ring-2 focus:ring-academic/20 focus:border-academic disabled:bg-canvas disabled:cursor-not-allowed ${
            error
              ? 'border-crimson focus:border-crimson focus:ring-crimson/20'
              : 'border-border hover:border-border-hover'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-xs text-crimson font-medium mt-0.5">{error}</p>
        ) : helperText ? (\n          <p className="text-xs text-ink-muted mt-0.5">{helperText}</p>\n        ) : null}\n      </div>\n    );\n  }\n);\n\nInput.displayName = 'Input';\n