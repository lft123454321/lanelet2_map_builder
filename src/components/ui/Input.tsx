import React from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-tahoe-text">
          {label}
        </label>
      )}
      <input
        className={`input ${error ? 'border-tahoe-error' : ''} ${className}`}
        {...props}
      />
      {error && (
        <span className="text-xs text-tahoe-error">{error}</span>
      )}
    </div>
  );
}
