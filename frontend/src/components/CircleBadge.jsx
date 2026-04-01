export function CircleBadge({ isPrivate }) {
  return (
    <span className="rounded-full bg-[rgb(var(--accent-soft))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--text))]">
      {isPrivate ? 'Private' : 'Public'}
    </span>
  );
}

