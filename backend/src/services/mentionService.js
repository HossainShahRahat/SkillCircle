function normalizeName(value) {
  return (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function buildAliases(user) {
  const aliases = new Set();
  const compact = normalizeName(user.name);
  if (compact) aliases.add(compact);

  const firstName = normalizeName(user.name?.split(' ')[0] || '');
  if (firstName) aliases.add(firstName);

  return Array.from(aliases);
}

export function extractMentionTokens(content) {
  return Array.from(content.matchAll(/@([A-Za-z0-9_]+)/g)).map((match) => match[1].toLowerCase());
}

export function resolveMentions(content, members) {
  const tokens = extractMentionTokens(content);
  if (!tokens.length || !members?.length) {
    return [];
  }

  const directory = new Map();
  members.forEach((member) => {
    buildAliases(member).forEach((alias) => {
      if (!directory.has(alias)) {
        directory.set(alias, member);
      }
    });
  });

  const resolved = [];
  const seen = new Set();

  tokens.forEach((token) => {
    const normalized = normalizeName(token);
    const member = directory.get(normalized);
    if (member && !seen.has(member.id)) {
      seen.add(member.id);
      resolved.push(member);
    }
  });

  return resolved;
}

export function buildMentionPayload(users) {
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    alias: normalizeName(user.name),
  }));
}
