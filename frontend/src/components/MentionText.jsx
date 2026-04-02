import { normalizeMentionName } from '../utils/mentions.js';
import { UserHoverCard } from './UserHoverCard.jsx';

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function MentionText({ content, mentions = [] }) {
  if (!mentions.length) {
    return <span>{content}</span>;
  }

  const variants = mentions.flatMap((mention) => {
    const fullAlias = `@${mention.alias}`;
    const firstAlias = `@${normalizeMentionName(mention.name?.split(' ')[0] || '')}`;
    return [
      { token: fullAlias, mention },
      ...(firstAlias !== fullAlias ? [{ token: firstAlias, mention }] : []),
    ];
  });
  const tokenMap = new Map(variants.map((variant) => [variant.token.toLowerCase(), variant.mention]));
  const pattern = new RegExp(`(${variants.map((variant) => escapeRegExp(variant.token)).join('|')})`, 'gi');
  const parts = content.split(pattern);

  return (
    <span>
      {parts.map((part, index) => {
        const mention = tokenMap.get(part.toLowerCase());
        if (!mention) {
          return <span key={`${part}-${index}`}>{part}</span>;
        }

        return (
          <UserHoverCard key={`${mention.id}-${index}`} user={mention}>
            <span className="font-semibold text-[rgb(var(--accent))] transition hover:underline">
              {part}
            </span>
          </UserHoverCard>
        );
      })}
    </span>
  );
}
