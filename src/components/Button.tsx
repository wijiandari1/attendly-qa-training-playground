import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const styles: Record<Variant, string> = {
  primary: 'bg-[#1e3a5f] text-white border border-[#1e3a5f] hover:bg-[#172e4c] disabled:bg-gray-300 disabled:border-gray-300 disabled:text-gray-500',
  secondary: 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 disabled:text-gray-400 disabled:bg-gray-100',
  danger: 'bg-white text-red-700 border border-red-300 hover:bg-red-50 disabled:text-gray-400 disabled:bg-gray-100',
  ghost: 'bg-transparent text-gray-700 border border-transparent hover:bg-gray-100',
};

export function Button({ variant = 'primary', loading = false, className = '', children, disabled, ...rest }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
