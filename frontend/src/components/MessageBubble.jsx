import { Avatar } from './Avatar.jsx';
import { ChatMediaPreview } from './ChatMediaPreview.jsx';
import { MessageStatusIcon } from './MessageStatusIcon.jsx';
import { formatRelativeTime } from '../utils/time.js';

function formatTime(value) {
  return formatRelativeTime(value);
}

function highlight(text, query) {
  if (!query?.trim() || !text) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(`(${escaped})`, 'ig');
  return text.split(matcher).map((part, index) => (
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={`${part}-${index}`} className="rounded bg-amber-200 px-0.5 text-slate-900">{part}</mark>
      : <span key={`${part}-${index}`}>{part}</span>
  ));
}

const quickReactions = ['❤️', '🔥', '👏', '👍'];

export function MessageBubble({
  message,
  currentUser,
  searchQuery,
  onReact,
  onOpenMedia,
}) {
  const isOwn = message.user_id === currentUser?.id || message.sender_id === currentUser?.id;

  return (
    <div className={`animate-[message-in_180ms_ease-out] flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[88%] items-end gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
        {!isOwn ? <Avatar user={message.author} size="sm" /> : null}
        <div className="group">
          <div
            className={`rounded-[18px] px-4 py-3 shadow-sm ${
              isOwn ? 'bg-[rgb(var(--accent))] text-white' : 'border bg-[rgb(var(--bg-elevated))]'
            }`}
          >
            {!isOwn ? <p className="mb-1 text-xs font-semibold">{message.author?.name}</p> : null}
            {message.content ? <p className="text-sm leading-6">{highlight(message.content, searchQuery)}</p> : null}
            <ChatMediaPreview message={message} onOpenMedia={onOpenMedia} />
            <div className={`mt-2 flex items-center gap-2 text-[11px] ${isOwn ? 'text-white/70 dark:text-slate-500' : 'text-[rgb(var(--muted))]'}`}>
              <span>{formatTime(message.created_at)}</span>
              <MessageStatusIcon message={message} isOwn={isOwn} />
            </div>
          </div>

          <div className={`mt-1 flex flex-wrap gap-2 ${isOwn ? 'justify-end pr-1' : 'justify-start pl-1'}`}>
            {message.reactions?.length ? message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                type="button"
                className={`rounded-full px-2 py-1 text-xs ${reaction.reactedByMe ? 'bg-[rgb(var(--accent-soft))] font-semibold' : 'bg-[rgb(var(--bg-soft))]'}`}
                onClick={() => onReact(message.id, reaction.emoji)}
              >
                {reaction.emoji} {reaction.count}
              </button>
            )) : null}
            {quickReactions.map((emoji) => (
              <button
                key={`${message.id}-${emoji}`}
                type="button"
                className="opacity-0 transition group-hover:opacity-100"
                onClick={() => onReact(message.id, emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
