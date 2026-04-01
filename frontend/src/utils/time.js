export function formatRelativeTime(value) {
  if (!value) return '';

  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const absSeconds = Math.round(Math.abs(diffMs) / 1000);

  if (absSeconds < 60) return 'just now';

  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const units = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ];

  for (const [unit, secondsInUnit] of units) {
    if (absSeconds >= secondsInUnit) {
      return formatter.format(Math.round(diffMs / 1000 / secondsInUnit), unit);
    }
  }

  return 'just now';
}
