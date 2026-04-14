import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export default function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  ...rest
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-secondary-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full border rounded-lg px-3 py-2.5 text-sm text-secondary-900 placeholder:text-secondary-400 transition-colors
          ${error
            ? 'border-error-500 focus:border-error-500 focus:ring-2 focus:ring-error-500/20'
            : 'border-secondary-200 hover:border-secondary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
          }
          focus:outline-none ${className}`}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-error-500">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-xs text-secondary-400">{helperText}</p>
      )}
    </div>
  );
}
