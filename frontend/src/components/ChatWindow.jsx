import { useEffect, useMemo, useRef, useState } from 'react';
import { ChatComposer } from './ChatComposer.jsx';
import { MediaPreviewModal } from './MediaPreviewModal.jsx';
import { MessageBubble } from './MessageBubble.jsx';
import { TypingIndicator } from './TypingIndicator.jsx';

export function ChatWindow({
  title,
  subtitle,
  messages,
  currentUser,
  typingUsers,
  isOnline = true,
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
  const previousLengthRef = useRef(messages.length);
  const [activeMedia, setActiveMedia] = useState(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    const hasNewMessage = messages.length > previousLengthRef.current;
    if (hasNewMessage && isNearBottom) {
      container.scrollTop = container.scrollHeight;
    }
    previousLengthRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    const container = scrollRef.current;
    if (container && typingUsers?.length) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
      if (isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  }, [typingUsers]);

  const visibleMessages = useMemo(() => {
    if (!searchQuery?.trim()) return messages;
    const normalized = searchQuery.toLowerCase();
    return messages.filter((message) => {
      const contentMatch = message.content?.toLowerCase().includes(normalized);
      const fileMatch = message.media_name?.toLowerCase().includes(normalized);
      return contentMatch || fileMatch;
    });
  }, [messages, searchQuery]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-[rgb(var(--bg-elevated))]">
      <div className="border-b px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="muted-copy">{subtitle}</p>
          </div>
          <div className={`rounded-full px-3 py-2 text-xs font-semibold ${isOnline ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-[rgb(var(--bg-soft))] text-[rgb(var(--muted))]'}`}>
            {typingUsers?.length ? 'Typing now' : isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[rgb(var(--bg))] px-4 py-4 sm:px-5">
        {visibleMessages.length ? visibleMessages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            currentUser={currentUser}
            searchQuery={searchQuery}
            onReact={onReact}
            onOpenMedia={(media) => setActiveMedia(media)}
          />
        )) : (
          <div className="rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-5 text-sm text-[rgb(var(--muted))]">
            {emptyMessage}
          </div>
        )}

        <TypingIndicator typingUsers={typingUsers} />
      </div>

      <div className="border-t bg-[rgb(var(--bg-elevated))]">
        <ChatComposer
          draft={draft}
          onDraftChange={onDraftChange}
          onSend={onSend}
          onTyping={onTyping}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />
      </div>

      <MediaPreviewModal media={activeMedia} open={Boolean(activeMedia)} onClose={() => setActiveMedia(null)} />
    </div>
  );
}
