export function ActivityBars({ points = [] }) {
  const max = Math.max(...points.map((point) => point.count), 1);

  return (
    <div className="grid grid-cols-7 gap-2">
      {points.map((point) => (
        <div key={point.date} className="flex flex-col items-center gap-2">
          <div className="flex h-24 w-full items-end rounded-2xl bg-[rgb(var(--bg-soft))] p-2">
            <div
              className="w-full rounded-xl bg-[rgb(var(--accent))] transition-all"
              style={{ height: `${Math.max(10, (point.count / max) * 100)}%` }}
            />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold">{point.day}</p>
            <p className="text-[11px] text-[rgb(var(--muted))]">{point.count}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
