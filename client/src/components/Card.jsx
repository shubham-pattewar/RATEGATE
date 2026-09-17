import { clsx } from 'clsx';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-zinc-200/90 bg-white dark:border-zinc-800/80 dark:bg-zinc-900 shadow-xs dark:shadow-none transition-colors duration-200',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return (
    <div className={clsx('flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80', className)}>
      {children}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={clsx('px-6 py-4', className)}>{children}</div>;
}
