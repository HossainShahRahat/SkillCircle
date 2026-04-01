export function normalizeMentionName(value) {
  return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function buildMentionToken(user) {
  return `@${normalizeMentionName(user.name)}`;
}

export function extractActiveMentionQuery(content) {
  const match = content.match(/(^|\s)@([A-Za-z0-9_]*)$/);
  if (!match) return null;
  return match[2].toLowerCase();
}

