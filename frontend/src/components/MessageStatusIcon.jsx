export function MessageStatusIcon({ message, isOwn }) {
  if (!isOwn) return null;
  if (message.pending) {
    return <span className="text-[11px] text-white/70 dark:text-slate-500">...</span>;
  }

  const delivered = message.status_summary?.deliveredCount > 0 || message.status === 'delivered' || message.status === 'read';
  const read = message.status_summary?.readCount > 0 || message.status === 'read';
  const symbol = read ? '✔✔' : delivered ? '✔✔' : '✔';
  const tone = read ? 'text-emerald-300 dark:text-emerald-500' : 'text-white/70 dark:text-slate-500';

  return <span className={`text-[11px] ${tone}`}>{symbol}</span>;
}
