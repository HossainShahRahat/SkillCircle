import { Button } from './Button.jsx';

export function EmptyState({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  icon: Icon,
}) {
  return (
    <div className="rounded-[28px] border border-dashed bg-[rgb(var(--bg-soft))] px-6 py-8 text-center">
      {Icon ? (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgb(var(--bg-elevated))] text-[rgb(var(--accent))] shadow-soft">
          <Icon size={24} />
        </div>
      ) : null}
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">{eyebrow}</p>
      ) : null}
      <h3 className="mt-2 text-2xl font-bold">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[rgb(var(--muted))]">{description}</p>
      {(actionLabel || secondaryLabel) ? (
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {actionLabel ? <Button onClick={onAction}>{actionLabel}</Button> : null}
          {secondaryLabel ? <Button variant="secondary" onClick={onSecondaryAction}>{secondaryLabel}</Button> : null}
        </div>
      ) : null}
    </div>
  );
}
