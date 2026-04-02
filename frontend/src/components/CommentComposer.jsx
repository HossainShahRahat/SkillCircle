import { useMemo, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { Avatar } from './Avatar.jsx';
import { Button } from './Button.jsx';
import { Input } from './Input.jsx';
import { buildMentionToken, extractActiveMentionQuery, scoreMentionMatch } from '../utils/mentions.js';

export function CommentComposer({ user, activeMembers = [], onSubmit, submitting }) {
  const [comment, setComment] = useState('');
  const mentionQuery = extractActiveMentionQuery(comment);

  const suggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    return activeMembers
      .filter((member) => member.id !== user?.id)
      .map((member) => ({ member, score: scoreMentionMatch(member.name, mentionQuery) }))
      .filter((entry) => entry.score >= 0)
      .sort((left, right) => right.score - left.score || left.member.name.localeCompare(right.member.name))
      .map((entry) => entry.member)
      .slice(0, 5);
  }, [activeMembers, mentionQuery, user]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!comment.trim()) return;
    await onSubmit(comment);
    setComment('');
  }

  function insertMention(member) {
    setComment((current) => current.replace(/@([A-Za-z0-9_ ]*)$/, `${buildMentionToken(member)} `));
  }

  return (
    <div className="relative">
      {suggestions.length ? (
        <div className="surface-card absolute bottom-[calc(100%+0.75rem)] left-0 right-0 z-20 p-2">
          {suggestions.map((member) => (
            <button
              key={member.id}
              type="button"
              className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition hover:bg-[rgb(var(--bg-soft))]"
              onClick={() => insertMention(member)}
            >
              <span className="font-semibold">{member.name}</span>
              <span className="text-xs text-[rgb(var(--muted))]">{buildMentionToken(member)}</span>
            </button>
          ))}
        </div>
      ) : null}

      <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center" onSubmit={handleSubmit}>
        <Avatar user={user} size="sm" />
        <Input
          className="py-3"
          placeholder="Leave a thoughtful note"
          value={comment}
          onChange={(event) => setComment(event.target.value)}
        />
        <Button className="w-full shrink-0 sm:w-auto" disabled={submitting}>
          <SendHorizontal size={16} />
        </Button>
      </form>
    </div>
  );
}
