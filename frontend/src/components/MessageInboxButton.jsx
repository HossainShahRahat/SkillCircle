import { MessageCircle, MoreHorizontal, Pencil, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore.js';
import { Avatar } from './Avatar.jsx';

function formatPreviewTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'now';
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d`;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
}

function buildPreview(chat) {
  const lastMessage = chat.last_message;
  if (!lastMessage) return 'No messages yet';
  if (lastMessage.content?.trim()) return lastMessage.content.trim();
  if (lastMessage.media_name) return `Sent ${lastMessage.media_name}`;
  if (lastMessage.media_type?.startsWith('image/')) return 'Sent a photo';
  return 'Sent an attachment';
}

export function MessageInboxButton() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const directChats = useAppStore((state) => state.directChats);
  const loadDirectChats = useAppStore((state) => state.loadDirectChats);
  const setActiveDirectChat = useAppStore((state) => state.setActiveDirectChat);
  const openDirectChatBox = useAppStore((state) => state.openDirectChatBox);
  const createDirectChat = useAppStore((state) => state.createDirectChat);
  const search = useAppStore((state) => state.search);
  const searchResults = useAppStore((state) => state.searchResults);
  const clearSearch = useAppStore((state) => state.clearSearch);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!open) return;
      if (!query.trim()) {
        clearSearch();
        return;
      }
      search(query);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [clearSearch, open, query, search]);

  const unreadCount = directChats.reduce((total, chat) => total + (chat.unread_count || 0), 0);

  const visibleChats = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const base = activeTab === 'unread'
      ? directChats.filter((chat) => (chat.unread_count || 0) > 0)
      : directChats;

    if (!normalizedQuery) return base;
    return base.filter((chat) => {
      const participant = chat.participant?.name?.toLowerCase() || '';
      const preview = buildPreview(chat).toLowerCase();
      return participant.includes(normalizedQuery) || preview.includes(normalizedQuery);
    });
  }, [activeTab, directChats, query]);

  const startableUsers = (searchResults.users || []).filter((candidate) => (
    !directChats.some((chat) => chat.participant?.id === candidate.id)
  )).slice(0, 4);

  async function handleOpenChat(chatId) {
    setActiveDirectChat(chatId);
    openDirectChatBox(chatId);
    setOpen(false);
    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
      navigate('/messages');
    }
  }

  return (
    <div ref={containerRef} className="relative hidden lg:block">
      <button
        type="button"
        className="social-icon-button relative"
        onClick={() => {
          if (!open) {
            loadDirectChats().catch(() => null);
          }
          setOpen((current) => !current);
        }}
        title="Messages"
      >
        <MessageCircle size={18} />
        {unreadCount ? (
          <span className="motion-pulse-badge absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[rgb(var(--accent))] px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="surface-card motion-dropdown absolute right-0 top-[calc(100%+0.75rem)] z-40 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-[26px] p-0">
          <div className="border-b px-4 pb-4 pt-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-[2rem] font-bold leading-none tracking-tight">Chats</h3>
              <div className="flex items-center gap-1">
                <button type="button" className="social-icon-button h-9 w-9" title="More options">
                  <MoreHorizontal size={17} />
                </button>
                <button
                  type="button"
                  className="social-icon-button h-9 w-9"
                  title="New message"
                  onClick={() => navigate('/messages')}
                >
                  <Pencil size={17} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-full bg-[rgb(var(--bg-soft))] px-4 py-3">
              <Search size={16} className="text-[rgb(var(--muted))]" />
              <input
                id="message-inbox-search"
                name="message_inbox_search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Messenger"
                className="w-full bg-transparent text-sm placeholder:text-[rgb(var(--muted))]"
              />
            </div>

            <div className="mt-4 flex items-center gap-2 overflow-x-auto">
              {[
                ['all', 'All'],
                ['unread', 'Unread'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === value ? 'bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))]' : 'text-[rgb(var(--text))] hover:bg-[rgb(var(--bg-soft))]'}`}
                  onClick={() => setActiveTab(value)}
                >
                  {label}
                </button>
              ))}
              {['Groups', 'Communities'].map((label) => (
                <span key={label} className="rounded-full px-3 py-2 text-sm font-semibold text-[rgb(var(--muted))]">
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="max-h-[520px] overflow-y-auto px-2 py-2 messenger-chat-scroll">
            {query.trim() && startableUsers.length ? (
              <div className="px-2 pb-2 pt-1">
                <p className="px-2 pb-2 text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
                  Start a new chat
                </p>
                <div className="space-y-1">
                  {startableUsers.map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-[rgb(var(--bg-soft))]"
                      onClick={async () => {
                        const chat = await createDirectChat(candidate.id);
                        await handleOpenChat(chat.id);
                      }}
                    >
                      <Avatar user={candidate} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{candidate.name}</p>
                        <p className="truncate text-sm text-[rgb(var(--muted))]">{candidate.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {visibleChats.length ? (
              <div className="space-y-1">
                {visibleChats.map((chat) => (
                  <button
                    key={chat.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-[rgb(var(--bg-soft))]"
                    onClick={() => handleOpenChat(chat.id)}
                  >
                    <div className="relative shrink-0">
                      <Avatar user={chat.participant} size="md" />
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[rgb(var(--bg-elevated))] bg-sky-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-[1rem] font-semibold">{chat.participant?.name || 'Conversation'}</p>
                        <p className="shrink-0 text-xs text-[rgb(var(--muted))]">
                          {formatPreviewTime(chat.last_message?.created_at || chat.updated_at)}
                        </p>
                      </div>
                      <p className="truncate text-sm text-[rgb(var(--muted))]">
                        {buildPreview(chat)}
                      </p>
                    </div>
                    {chat.unread_count ? (
                      <span className="ml-1 h-3 w-3 shrink-0 rounded-full bg-sky-500" />
                    ) : null}
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-[rgb(var(--muted))]">
                {activeTab === 'unread' ? 'No unread chats right now.' : 'Your recent chats will appear here.'}
              </div>
            )}
          </div>

          <div className="border-t px-3 py-3">
            <button
              type="button"
              className="w-full rounded-xl px-3 py-3 text-center text-sm font-semibold text-[rgb(var(--accent))] transition hover:bg-[rgb(var(--bg-soft))]"
              onClick={() => {
                setOpen(false);
                navigate('/messages');
              }}
            >
              See all in Messenger
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
