import { useId } from 'react';
import { cn } from '../utils/cn.js';

export function Textarea({ label, className, ...props }) {
  const generatedId = useId();
  const textareaId = props.id || props.name || generatedId;
  const textareaName = props.name || textareaId;

  return (
    <label className="flex w-full flex-col gap-2" htmlFor={textareaId}>
      {label ? <span className="text-sm font-semibold text-[rgb(var(--text))]">{label}</span> : null}
      <textarea
        id={textareaId}
        name={textareaName}
        className={cn(
          'min-h-[120px] w-full rounded-2xl border bg-[rgb(var(--bg-elevated))] px-4 py-3 text-sm text-[rgb(var(--text))] placeholder:text-[rgb(var(--muted))] focus:border-[rgba(var(--accent),0.4)] focus:ring-2 focus:ring-[rgba(var(--accent),0.15)]',
          className,
        )}
        {...props}
      />
    </label>
  );
}
