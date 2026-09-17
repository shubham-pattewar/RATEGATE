import { clsx } from 'clsx';
import { forwardRef } from 'react';

export const Input = forwardRef(function Input({ label, error, id, className, ...props }, ref) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={clsx(
          'block w-full rounded-xl border px-3.5 py-2.5 text-sm shadow-2xs',
          'bg-white dark:bg-[#0b101c] text-slate-900 dark:text-slate-100',
          'placeholder-slate-400 dark:placeholder-slate-500',
          'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400',
          error
            ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500/20 focus:border-rose-500'
            : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">{error}</p>}
    </div>
  );
});
