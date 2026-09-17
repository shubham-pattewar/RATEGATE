import { clsx } from 'clsx';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900',
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
    <div className={clsx('flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800', className)}>
      {children}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={clsx('px-6 py-4', className)}>{children}</div>;
}
