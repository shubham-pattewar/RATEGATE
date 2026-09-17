import { clsx } from 'clsx';

const colors = {
  green:  'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
  red:    'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20',
  yellow: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
  blue:   'bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20',
  gray:   'bg-zinc-100 text-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60',
};

export function Badge({ color = 'gray', className, children }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        colors[color],
        className,
      )}
    >
      {children}
    </span>
  );
}
