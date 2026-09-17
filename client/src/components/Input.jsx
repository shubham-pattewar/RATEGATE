import { clsx } from 'clsx';
import { forwardRef } from 'react';

export const Input = forwardRef(function Input({ label, error, id, className, ...props }, ref) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={clsx(
          'block w-full rounded-md border px-3 py-2 text-sm',
          'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
          'placeholder-gray-400 dark:placeholder-gray-600',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-0',
          error
            ? 'border-red-400 dark:border-red-600'
            : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
});
