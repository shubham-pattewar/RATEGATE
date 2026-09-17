import { clsx } from 'clsx';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx(
        'rounded-[14px] border border-slate-200/80 bg-white/95 dark:border-slate-800/80 dark:bg-[#0e1526]/90',
        'backdrop-blur-xs shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] dark:shadow-none',
        'transition-colors duration-200',
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
    <div className={clsx('flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/70', className)}>
      {children}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={clsx('px-6 py-5', className)}>{children}</div>;
}
