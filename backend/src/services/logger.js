function formatMeta(meta = {}) {
  const entries = Object.entries(meta).filter(([, value]) => value !== undefined);
  if (!entries.length) return '';
  return ` ${JSON.stringify(Object.fromEntries(entries))}`;
}

export const logger = {
  info(message, meta) {
    console.log(`[info] ${message}${formatMeta(meta)}`);
  },
  warn(message, meta) {
    console.warn(`[warn] ${message}${formatMeta(meta)}`);
  },
  error(message, meta) {
    console.error(`[error] ${message}${formatMeta(meta)}`);
  },
};
