export function normalizeMentionName(value) {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function buildMentionToken(user) {
  return `@${normalizeMentionName(user.name)}`;
}

export function extractActiveMentionQuery(content) {
  const match = content.match(/(^|\s)@([A-Za-z0-9_ ]*)$/);
  if (!match) return null;
  return match[2].trim().toLowerCase();
}

export function scoreMentionMatch(name, query) {
  const normalizedName = (name || '').toLowerCase().trim();
  const compactName = normalizeMentionName(name);
  const compactQuery = normalizeMentionName(query);
  if (!compactQuery) return 0;
  if (compactName.startsWith(compactQuery)) return 400 - compactName.length;
  if (normalizedName.startsWith(query)) return 320 - normalizedName.length;

  const words = normalizedName.split(/\s+/).filter(Boolean);
  if (words.some((word) => word.startsWith(query))) return 240 - words.length;
  if (normalizedName.includes(query)) return 180 - normalizedName.length;
  if (compactName.includes(compactQuery)) return 120 - compactName.length;
  return -1;
}
