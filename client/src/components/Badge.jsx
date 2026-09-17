import { clsx } from 'clsx';

const colors = {
  green:  'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
  purple: 'bg-purple-50/80 text-purple-700 border border-purple-200/70 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50',
  blue:   'bg-indigo-50/80 text-indigo-700 border border-indigo-200/70 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50',
  red:    'bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
  yellow: 'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
  gray:   'bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
};

export function Badge({ color = 'gray', className, dot, children }) {
  const showDot = dot !== undefined ? dot : color === 'green';

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-normal',
        colors[color] || colors.gray,
        className,
      )}
    >
      {showDot && (
        <span
          className={clsx(
            'w-2 h-2 rounded-full mr-1.5 shrink-0',
            color === 'green' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' : 'bg-current opacity-70',
          )}
        />
      )}
      {children}
    </span>
  );
}
