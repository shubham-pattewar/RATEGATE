import { clsx } from 'clsx';

const variants = {
  primary: 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xs hover:shadow-[0_0_18px_rgba(147,51,234,0.32)] border border-purple-500/30 focus-visible:ring-purple-500 active:scale-[0.98]',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90 dark:bg-[#111728] dark:text-slate-200 dark:border-slate-800 dark:hover:bg-[#182035] dark:hover:border-slate-700 shadow-2xs focus-visible:ring-slate-400 active:scale-[0.98]',
  'outline-purple': 'bg-purple-50/60 hover:bg-purple-100/80 text-purple-700 border border-purple-200/90 dark:bg-purple-950/25 dark:hover:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800/60 shadow-2xs focus-visible:ring-purple-400 active:scale-[0.98]',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500 shadow-xs active:scale-[0.98]',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 focus-visible:ring-purple-400',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded-lg',
  md: 'px-4 py-2 text-sm font-medium rounded-xl',
  lg: 'px-5 py-2.5 text-base font-medium rounded-xl',
};

export function Button({ variant = 'primary', size = 'md', className, disabled, children, ...props }) {
  return (
    <button
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium',
        'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900',
        'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
        variants[variant] || variants.primary,
        sizes[size] || sizes.md,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
