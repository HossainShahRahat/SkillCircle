export function StreakBadge({ badge }) {
  const toneStyles = {
    gold: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
    accent: 'bg-[rgb(var(--accent-soft))] text-[rgb(var(--text))]',
    soft: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
    neutral: 'bg-[rgb(var(--bg-elevated))] text-[rgb(var(--text))]',
  };

  return (
    <div className={`rounded-full px-4 py-2 text-sm font-semibold ${toneStyles[badge?.tone || 'neutral']}`}>
      {badge?.label || 'Starting Strong'}
    </div>
  );
}
