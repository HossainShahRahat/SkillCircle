import { cn } from '../utils/cn.js';

export function Input({ label, className, ...props }) {
  return (
    <label className="flex w-full flex-col gap-2">
      {label ? <span className="text-sm font-semibold text-[rgb(var(--text))]">{label}</span> : null}
      <input
        className={cn(
          'w-full rounded-2xl border bg-[rgb(var(--bg-elevated))] px-4 py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:border-[rgba(var(--accent),0.4)] focus:ring-2 focus:ring-[rgba(var(--accent),0.15)]',
          className,
        )}
        {...props}
      />
    </label>
  );
}

