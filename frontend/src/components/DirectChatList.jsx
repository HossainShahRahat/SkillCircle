import { Search } from 'lucide-react';
import { Avatar } from './Avatar.jsx';

function formatTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function DirectChatList({
  chats,
  activeChatId,
  onSelect,
  userResults,
  onStartChat,
}) {
  return (
    <div className="flex h-full flex-col border-r">
      <div className="border-b px-5 py-4">
        <h2 className="text-lg font-bold">Messages</h2>
        <p className="muted-copy">Private conversations that move as fast as the circle feed.</p>
      </div>

      {userResults?.length ? (
        <div className="border-b px-4 py-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Start a chat</p>
          <div className="space-y-2">
            {userResults.map((user) => (
              <button
                key={user.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl bg-[rgb(var(--bg-soft))] px-3 py-3 text-left"
                onClick={() => onStartChat(user.id)}
              >
                <Avatar user={user} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{user.name}</p>
                  <p className="truncate text-sm text-[rgb(var(--muted))]">{user.email}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {chats.length ? chats.map((chat) => (
          <button
            key={chat.id}
            type="button"
            className={`w-full rounded-[24px] px-3 py-3 text-left transition ${
              activeChatId === chat.id ? 'bg-[rgb(var(--accent-soft))]' : 'hover:bg-[rgb(var(--bg-soft))]'
            }`}
            onClick={() => onSelect(chat.id)}
          >
            <div className="flex items-start gap-3">
              <Avatar user={chat.participant} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate font-semibold">{chat.participant?.name}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{formatTime(chat.last_message?.created_at || chat.updated_at)}</p>
                </div>
                <p className="truncate text-sm text-[rgb(var(--muted))]">
                  {chat.last_message?.content || chat.last_message?.media_name || 'No messages yet'}
                </p>
              </div>
              {chat.unread_count ? (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[rgb(var(--text))] px-2 text-xs font-bold text-white dark:bg-white dark:text-slate-900">
                  {chat.unread_count}
                </span>
              ) : null}
            </div>
          </button>
        )) : (
          <div className="rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-5 text-sm text-[rgb(var(--muted))]">
            <div className="mb-2 flex items-center gap-2">
              <Search size={15} />
              <span>Use the top search to start a new chat.</span>
            </div>
            Existing conversations will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
