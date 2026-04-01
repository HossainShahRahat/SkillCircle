import { useEffect, useRef } from 'react';
import { Avatar } from './Avatar.jsx';
import { ChatComposer } from './ChatComposer.jsx';
import { ChatMediaPreview } from './ChatMediaPreview.jsx';
import { MessageStatusIcon } from './MessageStatusIcon.jsx';

function formatTime(value) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function highlight(text, query) {
  if (!query?.trim() || !text) return text;
  const pattern = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
  return text.split(pattern).map((part, index) => (
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={`${part}-${index}`} className="rounded bg-amber-200 px-0.5 text-slate-900">{part}</mark>
      : <span key={`${part}-${index}`}>{part}</span>
  ));
}

const quickReactions = ['❤️', '🔥', '👏', '👍'];

export function ChatThread({
  title,
  subtitle,
  messages,
  currentUser,
  typingUsers,
  draft,
  onDraftChange,
  onSend,
  onTyping,
  searchQuery,
  onSearchChange,
  onReact,
  emptyMessage,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingUsers]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b px-5 py-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="muted-copy">{subtitle}</p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
        {messages.length ? messages.map((message) => {
          const isOwn = message.user_id === currentUser?.id || message.sender_id === currentUser?.id;
          return (
            <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[88%] items-end gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                <Avatar user={message.author} size="sm" />
                <div className="group">
                  <div
                    className={`rounded-[24px] px-4 py-3 shadow-sm ${
                      isOwn ? 'bg-[rgb(var(--text))] text-white dark:bg-white dark:text-slate-900' : 'bg-[rgb(var(--bg-soft))]'
                    }`}
                  >
                    {!isOwn ? <p className="mb-1 text-xs font-semibold">{message.author?.name}</p> : null}
                    {message.content ? <p className="text-sm leading-6">{highlight(message.content, searchQuery)}</p> : null}
                    <ChatMediaPreview message={message} />
                    <div className={`mt-2 flex items-center gap-2 text-[11px] ${isOwn ? 'text-white/70 dark:text-slate-500' : 'text-[rgb(var(--muted))]'}`}>
                      <span>{formatTime(message.created_at)}</span>
                      <MessageStatusIcon message={message} isOwn={isOwn} />
                    </div>
                  </div>

                  <div className={`mt-1 flex flex-wrap gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
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
        }) : (
          <div className="rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-5 text-sm text-[rgb(var(--muted))]">
            {emptyMessage}
          </div>
        )}

        {typingUsers?.length ? (
          <div className="text-sm text-[rgb(var(--muted))]">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        ) : null}
      </div>

      <ChatComposer
        draft={draft}
        onDraftChange={onDraftChange}
        onSend={onSend}
        onTyping={onTyping}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
      />
    </div>
  );
}
