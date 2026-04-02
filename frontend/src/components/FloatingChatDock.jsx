import { ChevronDown, ImagePlus, Maximize2, Minus, SendHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from './Avatar.jsx';
import { MessageBubble } from './MessageBubble.jsx';
import { TypingIndicator } from './TypingIndicator.jsx';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import { getSocket } from '../services/socket.js';

const EMPTY_MESSAGES = [];

async function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function FloatingChatBox({ chat, currentUser, token }) {
  const navigate = useNavigate();
  const messages = useAppStore((state) => state.directMessagesByChat[chat.id] ?? EMPTY_MESSAGES);
  const typingEntries = useAppStore((state) => state.typingState.direct?.[chat.id] || EMPTY_MESSAGES);
  const socketConnected = useAppStore((state) => state.socketConnected);
  const loadDirectMessages = useAppStore((state) => state.loadDirectMessages);
  const sendDirectMessage = useAppStore((state) => state.sendDirectMessage);
  const markDirectMessages = useAppStore((state) => state.markDirectMessages);
  const setActiveDirectChat = useAppStore((state) => state.setActiveDirectChat);
  const closeDirectChatBox = useAppStore((state) => state.closeDirectChatBox);
  const minimizeDirectChatBox = useAppStore((state) => state.minimizeDirectChatBox);
  const setTyping = useAppStore((state) => state.setTyping);
  const reactToDirectMessage = useAppStore((state) => state.reactToDirectMessage);
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const stopTypingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  const typingUsers = typingEntries
    .filter((entry) => entry.user.id !== currentUser?.id)
    .map((entry) => entry.user.name);

  useEffect(() => {
    loadDirectMessages(chat.id)
      .then(() => markDirectMessages(chat.id, 'read'))
      .catch(() => null);
  }, [chat.id, loadDirectMessages, markDirectMessages]);

  useEffect(() => {
    if (!token) return undefined;
    const socket = getSocket(token);
    socket?.emit('join_direct_room', chat.id);
    return () => {
      socket?.emit('leave_direct_room', chat.id);
    };
  }, [chat.id, token]);

  useEffect(() => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, typingUsers.length]);

  useEffect(() => () => {
    if (stopTypingTimeoutRef.current) {
      clearTimeout(stopTypingTimeoutRef.current);
    }
  }, []);

  async function handleAttachment(event) {
    const [file] = Array.from(event.target.files || []);
    if (!file) return;
    const dataUrl = await toDataUrl(file);
    setAttachment({
      name: file.name,
      type: file.type,
      size: file.size,
      dataUrl,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if ((!draft || !draft.trim()) && !attachment) return;
    setSubmitting(true);
    try {
      await sendDirectMessage(chat.id, { content: draft.trim(), attachment }, currentUser);
      setDraft('');
      setAttachment(null);
      setTyping('direct', chat.id, false);
      markDirectMessages(chat.id, 'read').catch(() => null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pointer-events-auto motion-dock-box flex h-[460px] w-[338px] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-[rgba(var(--border),0.9)] bg-[rgb(var(--bg-elevated))] shadow-[0_18px_48px_rgba(0,0,0,0.28)]">
      <div className="flex items-center justify-between gap-3 bg-[rgb(var(--bg-elevated))] px-3 py-2.5">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left transition hover:bg-[rgb(var(--bg-soft))] px-1 py-1"
          onClick={() => {
            setActiveDirectChat(chat.id);
            navigate('/messages');
          }}
        >
          <Avatar user={chat.participant} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{chat.participant?.name || 'Conversation'}</p>
            <p className="truncate text-xs text-[rgb(var(--muted))]">
              {typingUsers.length ? 'Typing...' : socketConnected ? 'Active now' : 'Offline'}
            </p>
          </div>
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="social-icon-button h-8 w-8"
            onClick={() => minimizeDirectChatBox(chat.id)}
            title="Minimize chat"
          >
            <Minus size={15} />
          </button>
          <button
            type="button"
            className="social-icon-button h-8 w-8"
            onClick={() => {
              setActiveDirectChat(chat.id);
              navigate('/messages');
            }}
            title="Open full chat"
          >
            <Maximize2 size={15} />
          </button>
          <button
            type="button"
            className="social-icon-button h-8 w-8"
            onClick={() => closeDirectChatBox(chat.id)}
            title="Close chat"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 bg-[rgb(var(--bg))] px-3 py-3 messenger-chat-scroll overflow-y-auto">
        {messages.length ? messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            currentUser={currentUser}
            onReact={(messageId, emoji) => reactToDirectMessage(messageId, emoji)}
          />
        )) : (
          <div className="rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-4 text-sm text-[rgb(var(--muted))]">
            Start the conversation with {chat.participant?.name?.split(' ')[0] || 'this person'}.
          </div>
        )}
        <TypingIndicator typingUsers={typingUsers} />
      </div>

      <div className="border-t bg-[rgb(var(--bg-elevated))] px-3 py-3">
        {attachment ? (
          <div className="mb-2 flex items-center justify-between rounded-2xl bg-[rgb(var(--bg-soft))] px-3 py-2 text-xs">
            <div className="min-w-0">
              <p className="truncate font-semibold">{attachment.name}</p>
            </div>
            <button type="button" className="text-[rgb(var(--muted))]" onClick={() => setAttachment(null)}>
              <X size={14} />
            </button>
          </div>
        ) : null}
        <form className="flex items-end gap-2" onSubmit={handleSubmit}>
          <button
            type="button"
            className="social-icon-button h-10 w-10 shrink-0"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file"
          >
            <ImagePlus size={16} />
          </button>
          <div className="min-w-0 flex-1 rounded-[20px] bg-[rgb(var(--bg-soft))] px-3 py-2">
            <textarea
              id={`floating-chat-${chat.id}`}
              name={`floating_chat_${chat.id}`}
              rows={1}
              value={draft}
              onChange={(event) => {
                const value = event.target.value;
                setDraft(value);
                setTyping('direct', chat.id, Boolean(value));
                if (stopTypingTimeoutRef.current) {
                  clearTimeout(stopTypingTimeoutRef.current);
                }
                stopTypingTimeoutRef.current = setTimeout(() => {
                  setTyping('direct', chat.id, false);
                }, 1200);
              }}
              placeholder="Aa"
              className="max-h-24 min-h-[24px] w-full resize-none bg-transparent text-sm placeholder:text-[rgb(var(--muted))]"
              disabled={submitting}
            />
          </div>
          <button
            type="submit"
            className="social-icon-button h-10 w-10 shrink-0 bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))]"
            disabled={submitting || ((!draft || !draft.trim()) && !attachment)}
            title="Send message"
          >
            <SendHorizontal size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.zip,.txt"
            onChange={handleAttachment}
          />
        </form>
      </div>
    </div>
  );
}

function MinimizedChatPill({ chat }) {
  const unread = chat.unread_count || 0;
  const restoreDirectChatBox = useAppStore((state) => state.restoreDirectChatBox);
  const closeDirectChatBox = useAppStore((state) => state.closeDirectChatBox);

  return (
    <div className="pointer-events-auto motion-dock-pill flex h-14 min-w-[220px] max-w-[260px] items-center gap-3 rounded-t-2xl border border-b-0 border-[rgba(var(--border),0.9)] bg-[rgb(var(--bg-elevated))] px-3 shadow-[0_14px_32px_rgba(0,0,0,0.24)]">
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        onClick={() => restoreDirectChatBox(chat.id)}
      >
        <div className="relative">
          <Avatar user={chat.participant} size="sm" />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[rgb(var(--bg-elevated))] bg-emerald-500" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{chat.participant?.name || 'Conversation'}</p>
          <p className="truncate text-xs text-[rgb(var(--muted))]">
            {chat.last_message?.content || chat.last_message?.media_name || 'Open chat'}
          </p>
        </div>
      </button>
      {unread ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[rgb(var(--accent))] px-1.5 text-[10px] font-bold text-white">
          {unread}
        </span>
      ) : null}
      <button
        type="button"
        className="social-icon-button h-8 w-8"
        onClick={() => restoreDirectChatBox(chat.id)}
        title="Expand chat"
      >
        <ChevronDown size={15} className="rotate-180" />
      </button>
      <button
        type="button"
        className="social-icon-button h-8 w-8"
        onClick={() => closeDirectChatBox(chat.id)}
        title="Close chat"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export function FloatingChatDock() {
  const token = useAuthStore((state) => state.token);
  const currentUser = useAuthStore((state) => state.user);
  const chats = useAppStore((state) => state.directChats);
  const openDirectChatIds = useAppStore((state) => state.openDirectChatIds);
  const minimizedDirectChatIds = useAppStore((state) => state.minimizedDirectChatIds);

  const openChats = openDirectChatIds
    .map((chatId) => chats.find((chat) => chat.id === chatId))
    .filter(Boolean);

  const expandedChats = openChats.filter((chat) => !minimizedDirectChatIds.includes(chat.id));
  const minimizedChats = openChats.filter((chat) => minimizedDirectChatIds.includes(chat.id));

  if (!token || !currentUser || !openChats.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-0 right-4 z-50 hidden items-end gap-3 xl:flex">
      {minimizedChats.map((chat) => (
        <MinimizedChatPill key={`min-${chat.id}`} chat={chat} />
      ))}
      {expandedChats.map((chat) => (
        <FloatingChatBox key={chat.id} chat={chat} currentUser={currentUser} token={token} />
      ))}
    </div>
  );
}
