import { clsx } from 'clsx';
import { forwardRef } from 'react';

export const Input = forwardRef(function Input({ label, error, id, className, ...props }, ref) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={clsx(
          'block w-full rounded-lg border px-3 py-2 text-sm shadow-xs',
          'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100',
          'placeholder-zinc-400 dark:placeholder-zinc-500',
          'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 dark:focus:ring-emerald-400/20 dark:focus:border-emerald-400',
          error
            ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500/20 focus:border-rose-500'
            : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{error}</p>}
    </div>
  );
});
