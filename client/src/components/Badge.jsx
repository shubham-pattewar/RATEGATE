import { clsx } from 'clsx';

const colors = {
  green:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  red:    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  blue:   'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  gray:   'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
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
