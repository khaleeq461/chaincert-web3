import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-gray-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-xl bg-black/40 border px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-500 transition focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent ${
            error ? 'border-accent-rose focus:ring-accent-rose' : 'border-card-border hover:border-white/20'
          } ${className}`}
          {...props}
        />
        {error ? (
          <span className="text-xs text-accent-rose">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-gray-500">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
