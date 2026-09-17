import { clsx } from 'clsx';

const variants = {
  primary: 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white shadow-xs focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300 font-medium active:scale-[0.98]',
  secondary: 'bg-white text-zinc-900 border border-zinc-200/90 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-800 dark:hover:bg-zinc-800/80 dark:hover:border-zinc-700 shadow-xs focus-visible:ring-zinc-400 active:scale-[0.98]',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 shadow-xs focus-visible:ring-rose-500 active:scale-[0.98]',
  ghost: 'bg-transparent text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100 focus-visible:ring-zinc-400',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export function Button({ variant = 'primary', size = 'md', className, disabled, children, ...props }) {
  return (
    <button
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
