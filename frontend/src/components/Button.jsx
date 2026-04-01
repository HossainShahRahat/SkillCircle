import { cn } from '../utils/cn.js';

const variants = {
  primary: 'bg-[rgb(var(--text))] text-white hover:translate-y-[-1px] dark:bg-white dark:text-slate-900',
  secondary: 'bg-[rgb(var(--accent-soft))] text-[rgb(var(--text))] hover:bg-[rgba(var(--accent),0.18)]',
  ghost: 'bg-transparent text-[rgb(var(--text))] hover:bg-[rgb(var(--bg-soft))]',
};

export function Button({
  children,
  className,
  variant = 'primary',
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition duration-200',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

