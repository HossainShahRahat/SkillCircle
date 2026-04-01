import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/Card.jsx';
import { DirectChatList } from '../components/DirectChatList.jsx';
import { ChatWindow } from '../components/ChatWindow.jsx';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import { getSocket } from '../services/socket.js';

const EMPTY_MESSAGES = [];

export function DirectMessagesPage() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const directChats = useAppStore((state) => state.directChats);
  const activeDirectChatId = useAppStore((state) => state.activeDirectChatId);
  const directMessages = useAppStore((state) => state.directMessagesByChat[activeDirectChatId] ?? EMPTY_MESSAGES);
  const typingState = useAppStore((state) => state.typingState);
  const loadDirectChats = useAppStore((state) => state.loadDirectChats);
  const createDirectChat = useAppStore((state) => state.createDirectChat);
  const loadDirectMessages = useAppStore((state) => state.loadDirectMessages);
  const sendDirectMessage = useAppStore((state) => state.sendDirectMessage);
  const markDirectMessages = useAppStore((state) => state.markDirectMessages);
  const reactToDirectMessage = useAppStore((state) => state.reactToDirectMessage);
  const search = useAppStore((state) => state.search);
  const searchResults = useAppStore((state) => state.searchResults);
  const clearSearch = useAppStore((state) => state.clearSearch);
  const setActiveDirectChat = useAppStore((state) => state.setActiveDirectChat);
  const setTyping = useAppStore((state) => state.setTyping);
  const [draft, setDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    loadDirectChats();
  }, [loadDirectChats]);

  useEffect(() => {
    if (!activeDirectChatId) return;
    loadDirectMessages(activeDirectChatId).then(() => markDirectMessages(activeDirectChatId, 'read')).catch(() => null);
  }, [activeDirectChatId, loadDirectMessages, markDirectMessages]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!userSearch.trim()) {
        clearSearch();
        return;
      }
      search(userSearch);
    }, 250);
    return () => clearTimeout(timer);
  }, [userSearch, search, clearSearch]);

  useEffect(() => {
    if (!token || !activeDirectChatId) return undefined;
    const socket = getSocket(token);
    socket?.emit('join_direct_room', activeDirectChatId);
    return () => {
      socket?.emit('leave_direct_room', activeDirectChatId);
    };
  }, [token, activeDirectChatId]);

  const activeChat = useMemo(
    () => directChats.find((chat) => chat.id === activeDirectChatId) || null,
    [directChats, activeDirectChatId],
  );

  const typingUsers = (typingState.direct?.[activeDirectChatId] || [])
    .filter((entry) => entry.user.id !== user?.id)
    .map((entry) => entry.user.name);

  return (
    <Card className="grid min-h-[720px] overflow-hidden p-0 xl:grid-cols-[320px_minmax(0,1fr)]">
      <div className="min-h-[320px]">
        <div className="border-b px-5 py-4">
          <input
            id="direct-user-search"
            name="direct_user_search"
            type="search"
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
            placeholder="Search people to start a chat"
            className="w-full rounded-2xl border bg-[rgb(var(--bg-elevated))] px-4 py-3 text-sm"
          />
        </div>
        <DirectChatList
          chats={directChats}
          activeChatId={activeDirectChatId}
          onSelect={setActiveDirectChat}
          userResults={(searchResults.users || []).filter((candidate) => candidate.id !== user?.id)}
          onStartChat={async (participantId) => {
            const chat = await createDirectChat(participantId);
            setActiveDirectChat(chat.id);
          }}
        />
      </div>

      {activeChat ? (
        <ChatWindow
          title={activeChat.participant?.name || 'Conversation'}
          subtitle={activeChat.participant?.bio || 'Direct messages with live delivery, reactions, and offline sync.'}
          messages={directMessages}
          currentUser={user}
          typingUsers={typingUsers}
          draft={draft}
          onDraftChange={setDraft}
          onSend={async ({ content, attachment }) => {
            await sendDirectMessage(activeChat.id, { content, attachment }, user);
            setDraft('');
            setTyping('direct', activeChat.id, false);
          }}
          onTyping={(value) => setTyping('direct', activeChat.id, Boolean(value))}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onReact={(messageId, emoji) => reactToDirectMessage(messageId, emoji)}
          emptyMessage="No messages yet. Say hello, send context, or drop a file to start the thread."
        />
      ) : (
        <div className="flex items-center justify-center px-8 py-10 text-center">
          <div>
            <p className="text-xl font-bold">Pick a conversation</p>
            <p className="mt-2 muted-copy">Your direct chats live here, with typing indicators, media previews, and read receipts.</p>
          </div>
        </div>
      )}
    </Card>
  );
}
