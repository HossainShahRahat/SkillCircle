import { useEffect, useRef, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { Card } from './Card.jsx';
import { Button } from './Button.jsx';
import { Avatar } from './Avatar.jsx';
import { Input } from './Input.jsx';

function formatTime(value) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function CircleChatPanel({ messages, user, loading, onSend }) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!draft.trim()) return;
    await onSend(draft);
    setDraft('');
  }

  return (
    <Card className="flex h-[560px] flex-col overflow-hidden p-0">
      <div className="border-b px-5 py-4">
        <h2 className="text-lg font-bold">Circle chat</h2>
        <p className="muted-copy">A live space for quick coordination and feedback.</p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-2xl bg-[rgb(var(--bg-soft))]" />
            ))}
          </div>
        ) : messages.length ? (
          messages.map((message) => {
            const isOwn = message.user_id === user?.id;
            return (
              <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] items-end gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <Avatar user={message.author} size="sm" />
                  <div
                    className={`rounded-[24px] px-4 py-3 ${isOwn ? 'bg-[rgb(var(--text))] text-white dark:bg-white dark:text-slate-900' : 'bg-[rgb(var(--bg-soft))]'}`}
                  >
                    {!isOwn ? <p className="mb-1 text-xs font-semibold">{message.author?.name}</p> : null}
                    <p className="text-sm leading-6">{message.content}</p>
                    <p className={`mt-2 text-[11px] ${isOwn ? 'text-white/70 dark:text-slate-500' : 'text-[rgb(var(--muted))]'}`}>
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-5 text-sm text-[rgb(var(--muted))]">
            No messages yet. Start the conversation with a quick update or question.
          </div>
        )}
      </div>

      <form className="border-t px-4 py-4 sm:px-5" onSubmit={handleSubmit}>
        <div className="flex items-center gap-3">
          <Input
            className="py-3"
            placeholder="Write to the circle"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button className="shrink-0" disabled={!draft.trim()}>
            <SendHorizontal size={16} />
          </Button>
        </div>
      </form>
    </Card>
  );
}

