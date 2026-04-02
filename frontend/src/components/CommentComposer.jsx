import { useMemo, useState } from 'react';
import { Camera, ImageIcon, SendHorizontal, Smile, Sticker } from 'lucide-react';
import { Avatar } from './Avatar.jsx';
import { Button } from './Button.jsx';
import { Input } from './Input.jsx';
import { buildMentionToken, extractActiveMentionQuery, scoreMentionMatch } from '../utils/mentions.js';

export function CommentComposer({
  user,
  activeMembers = [],
  onSubmit,
  submitting,
  variant = 'default',
  placeholder,
}) {
  const [comment, setComment] = useState('');
  const mentionQuery = extractActiveMentionQuery(comment);
  const isOverlay = variant === 'overlay';

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
        <div className={`absolute bottom-[calc(100%+0.75rem)] left-0 right-0 z-20 p-2 ${isOverlay ? 'rounded-3xl border border-white/10 bg-[#242526] shadow-[0_20px_50px_rgba(0,0,0,0.45)]' : 'surface-card'}`}>
          {suggestions.map((member) => (
            <button
              key={member.id}
              type="button"
              className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition ${isOverlay ? 'text-white hover:bg-white/5' : 'hover:bg-[rgb(var(--bg-soft))]'}`}
              onClick={() => insertMention(member)}
            >
              <span className="font-semibold">{member.name}</span>
              <span className={`text-xs ${isOverlay ? 'text-white/45' : 'text-[rgb(var(--muted))]'}`}>{buildMentionToken(member)}</span>
            </button>
          ))}
        </div>
      ) : null}

      {isOverlay ? (
        <form className="mt-4 flex items-end gap-3" onSubmit={handleSubmit}>
          <Avatar user={user} size="sm" />
          <div className="min-w-0 flex-1 rounded-[22px] bg-[#3a3b3c] px-4 py-3 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]">
            <Input
              className="border-none bg-transparent px-0 py-0 text-sm text-white placeholder:text-white/45 focus:ring-0"
              placeholder={placeholder || `Comment as ${user?.name || 'you'}`}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white/65">
                <button type="button" className="social-icon-button h-8 w-8 bg-transparent hover:bg-white/10">
                  <Smile size={15} />
                </button>
                <button type="button" className="social-icon-button h-8 w-8 bg-transparent hover:bg-white/10">
                  <Camera size={15} />
                </button>
                <button type="button" className="social-icon-button h-8 w-8 bg-transparent hover:bg-white/10">
                  <ImageIcon size={15} />
                </button>
                <button type="button" className="social-icon-button h-8 w-8 bg-transparent hover:bg-white/10">
                  <Sticker size={15} />
                </button>
              </div>
              <Button className="h-9 w-9 shrink-0 rounded-full p-0" disabled={submitting || !comment.trim()}>
                <SendHorizontal size={16} />
              </Button>
            </div>
          </div>
        </form>
      ) : (
        <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center" onSubmit={handleSubmit}>
          <Avatar user={user} size="sm" />
          <Input
            className="py-3"
            placeholder={placeholder || 'Leave a thoughtful note'}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
          <Button className="w-full shrink-0 sm:w-auto" disabled={submitting}>
            <SendHorizontal size={16} />
          </Button>
        </form>
      )}
    </div>
  );
}
