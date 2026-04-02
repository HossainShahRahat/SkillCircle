import { cn } from '../utils/cn.js';

const variants = {
  primary: 'bg-[rgb(var(--accent))] text-white hover:bg-[rgba(var(--accent),0.92)]',
  secondary: 'bg-[rgb(var(--bg-soft))] text-[rgb(var(--text))] hover:bg-[rgba(var(--accent),0.12)]',
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
        'motion-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold duration-200',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
