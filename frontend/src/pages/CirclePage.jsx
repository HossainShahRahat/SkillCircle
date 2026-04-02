import { useEffect, useState } from 'react';
import { Search, Settings2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { ActivityBars } from '../components/ActivityBars.jsx';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { CircleBadge } from '../components/CircleBadge.jsx';
import { CircleChatPanel } from '../components/CircleChatPanel.jsx';
import { CircleMemberPanel } from '../components/CircleMemberPanel.jsx';
import { JoinByCodeModal } from '../components/JoinByCodeModal.jsx';
import { PostCard } from '../components/PostCard.jsx';
import { useAppStore } from '../store/appStore.js';
import { useAuthStore } from '../store/authStore.js';
import { getSocket } from '../services/socket.js';
import { StreakBadge } from '../components/StreakBadge.jsx';
import { staggerStyle } from '../utils/motion.js';

export function CirclePage() {
  const { circleId } = useParams();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const posts = useAppStore((state) => state.posts);
  const activeCircle = useAppStore((state) => state.activeCircle);
  const loadCircle = useAppStore((state) => state.loadCircle);
  const loadMessages = useAppStore((state) => state.loadMessages);
  const searchCircle = useAppStore((state) => state.searchCircle);
  const clearCircleSearch = useAppStore((state) => state.clearCircleSearch);
  const circleSearchResults = useAppStore((state) => state.circleSearchResults);
  const circleSearchLoading = useAppStore((state) => state.circleSearchLoading);
  const circleAnalytics = useAppStore((state) => state.circleAnalytics);
  const loadCircleAnalytics = useAppStore((state) => state.loadCircleAnalytics);
  const messages = useAppStore((state) => state.messages);
  const messagesLoading = useAppStore((state) => state.messagesLoading);
  const socketConnected = useAppStore((state) => state.socketConnected);
  const sendMessage = useAppStore((state) => state.sendMessage);
  const markCircleMessages = useAppStore((state) => state.markCircleMessages);
  const reactToCircleMessage = useAppStore((state) => state.reactToCircleMessage);
  const typingState = useAppStore((state) => state.typingState);
  const setTyping = useAppStore((state) => state.setTyping);
  const clearMessages = useAppStore((state) => state.clearMessages);
  const joinCircle = useAppStore((state) => state.joinCircle);
  const joinCircleByCode = useAppStore((state) => state.joinCircleByCode);
  const leaveCircle = useAppStore((state) => state.leaveCircle);
  const commentOnPost = useAppStore((state) => state.commentOnPost);
  const toggleReaction = useAppStore((state) => state.toggleReaction);
  const updatePost = useAppStore((state) => state.updatePost);
  const deletePost = useAppStore((state) => state.deletePost);
  const updateComment = useAppStore((state) => state.updateComment);
  const deleteComment = useAppStore((state) => state.deleteComment);
  const updateCircleMemberRole = useAppStore((state) => state.updateCircleMemberRole);
  const setModalOpen = useAppStore((state) => state.setModalOpen);
  const showToast = useAppStore((state) => state.showToast);
  const [joinCodeModalOpen, setJoinCodeModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatDraft, setChatDraft] = useState('');

  useEffect(() => {
    loadCircle(circleId);
  }, [circleId, loadCircle]);

  useEffect(() => {
    if (!token) return undefined;
    const socket = getSocket(token);
    socket?.emit('join_circle_room', circleId);
    return () => {
      socket?.emit('leave_circle_room', circleId);
      clearMessages();
    };
  }, [circleId, token, clearMessages]);

  useEffect(() => {
    if (activeCircle?.joined) {
      loadMessages(circleId).then(() => markCircleMessages(circleId, 'read')).catch(() => null);
      loadCircleAnalytics(circleId).catch(() => null);
    }
  }, [activeCircle?.joined, circleId, loadMessages, loadCircleAnalytics, markCircleMessages]);

  const typingUsers = (typingState.circle?.[circleId] || [])
    .filter((entry) => entry.user.id !== user?.id)
    .map((entry) => entry.user.name);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        clearCircleSearch();
        return;
      }
      searchCircle(circleId, searchQuery);
    }, 220);
    return () => clearTimeout(timer);
  }, [searchQuery, searchCircle, circleId, clearCircleSearch]);

  if (!activeCircle) {
    return (
      <Card className="p-8">
        <p className="font-semibold">Loading circle...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="motion-fade-up motion-lift overflow-hidden p-0">
        <div className="bg-[rgb(var(--text))] px-6 py-8 text-white dark:bg-[rgb(var(--accent))]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-white/70">Skill circle</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <h1 className="font-display text-4xl">{activeCircle.name}</h1>
                <CircleBadge isPrivate={activeCircle.is_private} />
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/75">{activeCircle.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/60">Members</p>
                <p className="mt-1 text-xl font-bold">{activeCircle.membersCount}</p>
              </div>
              {activeCircle.is_premium ? (
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/60">Access</p>
                  <p className="mt-1 text-xl font-bold">{activeCircle.premium_badge || 'Plus'}</p>
                </div>
              ) : null}
              {activeCircle.joined && activeCircle.myRole === 'admin' ? (
                <div className="rounded-2xl bg-white/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/60">Invite code</p>
                  <p className="mt-1 text-xl font-bold">{activeCircle.invite_code || 'Hidden'}</p>
                </div>
              ) : null}
              {activeCircle.joined ? (
                <>
                  <Button className="bg-white text-slate-900 hover:bg-white/90" onClick={() => setModalOpen(true)}>
                    Share in this circle
                  </Button>
                  {activeCircle.myRole === 'admin' ? (
                    <Button variant="ghost" className="border border-white/20 text-white hover:bg-white/10">
                      <Settings2 size={16} />
                      Settings
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="border border-white/20 text-white hover:bg-white/10"
                      onClick={async () => {
                        try {
                          await leaveCircle(circleId);
                        } catch (error) {
                          showToast(error.message, 'error');
                        }
                      }}
                    >
                      Leave circle
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  className="bg-white text-slate-900 hover:bg-white/90"
                  onClick={() => {
                    if (activeCircle.is_private) {
                      setJoinCodeModalOpen(true);
                      return;
                    }
                    joinCircle(circleId).catch((error) => showToast(error.message, 'error'));
                  }}
                >
                  {activeCircle.is_private ? 'Enter code' : 'Join circle'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      <JoinByCodeModal
        open={joinCodeModalOpen}
        onClose={() => setJoinCodeModalOpen(false)}
        onSubmit={async (code) => {
          try {
            await joinCircleByCode(code);
            await loadCircle(circleId);
          } catch (error) {
            showToast(error.message || 'Invalid invite code.', 'error');
            throw error;
          }
        }}
        submitting={false}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Card className="motion-fade-up motion-lift p-5" style={staggerStyle(1)}>
            <div className="flex items-center gap-3 rounded-2xl border bg-[rgb(var(--bg-elevated))] px-4 py-3">
              <Search size={16} className="text-[rgb(var(--muted))]" />
              <input
                id="circle-search"
                name="circle_search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search posts or members in this circle"
                className="w-full bg-transparent text-sm placeholder:text-[rgb(var(--muted))]"
              />
            </div>
            {searchQuery.trim() ? (
              <div className="mt-4 space-y-4">
                {circleSearchLoading ? (
                  <div className="h-16 animate-pulse rounded-2xl bg-[rgb(var(--bg-soft))]" />
                ) : (
                  <>
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[rgb(var(--muted))]">Matching posts</p>
                      {circleSearchResults.posts.length ? (
                        <div className="space-y-2">
                          {circleSearchResults.posts.slice(0, 3).map((result) => (
                            <div key={result.id} className="rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-3 text-sm">
                              {result.content}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="muted-copy">No posts match yet.</p>
                      )}
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[rgb(var(--muted))]">Matching members</p>
                      {circleSearchResults.members.length ? (
                        <div className="flex flex-wrap gap-2">
                          {circleSearchResults.members.map((member) => (
                            <span key={member.id} className="rounded-full bg-[rgb(var(--accent-soft))] px-3 py-2 text-sm font-semibold">
                              {member.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="muted-copy">No members match yet.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            ) : null}
          </Card>

          {activeCircle.joined && circleAnalytics ? (
            <Card className="motion-fade-up motion-lift p-5" style={staggerStyle(2)}>
              <div className="mb-4">
                <p className="text-lg font-bold">Circle insights</p>
                <p className="muted-copy">A quick read on activity, consistency, and member momentum.</p>
              </div>
              <div className="mb-5 grid grid-cols-3 gap-3">
                {[
                  [circleAnalytics.totals?.posts || 0, 'Posts'],
                  [circleAnalytics.totals?.activeMembers || 0, 'Active'],
                  [circleAnalytics.totals?.messages || 0, 'Messages'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl bg-[rgb(var(--bg-soft))] p-4">
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[rgb(var(--muted))]">{label}</p>
                  </div>
                ))}
              </div>
              <ActivityBars points={circleAnalytics.weeklyActivity || []} />
            </Card>
          ) : null}

          {posts.length ? (
            posts.map((post, index) => (
              <div key={post.id} className="motion-fade-up" style={staggerStyle(index + 3)}>
                <PostCard
                  post={post}
                  user={user}
                  onComment={(postId, content) => commentOnPost(postId, content, user)}
                  onReact={toggleReaction}
                  onUpdatePost={updatePost}
                  onDeletePost={deletePost}
                  onUpdateComment={updateComment}
                  onDeleteComment={deleteComment}
                  activeMembers={activeCircle.members || []}
                  canModerate={['admin', 'moderator'].includes(activeCircle.myRole)}
                />
              </div>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-lg font-semibold">No posts in this circle yet</p>
              <p className="mt-2 muted-copy">A good first post usually shares a concrete milestone and one honest lesson.</p>
            </Card>
          )}
        </div>

        {activeCircle.joined ? (
          <div className="space-y-5">
            {circleAnalytics?.leaderboard?.length ? (
              <Card className="motion-fade-up motion-lift p-5" style={staggerStyle(1)}>
                <div className="mb-4">
                  <p className="text-lg font-bold">Leaderboard</p>
                  <p className="muted-copy">Subtle rewards for consistency inside this circle.</p>
                </div>
                <div className="space-y-3">
                  {circleAnalytics.leaderboard.map((member) => (
                    <div key={member.id} className="rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-sm text-[rgb(var(--muted))]">{member.totalPosts} posts in this circle</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{member.streak}d</p>
                          <StreakBadge badge={member.badge} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}
            <div className="motion-fade-up" style={staggerStyle(2)}>
            <CircleChatPanel
              messages={messages}
              currentUser={user}
              activeMembers={activeCircle.members || []}
              typingUsers={typingUsers}
              isOnline={socketConnected}
              draft={chatDraft}
              onDraftChange={setChatDraft}
              onSend={async ({ content, attachment }) => {
                await sendMessage(circleId, { content, attachment }, user);
                setChatDraft('');
                setTyping('circle', circleId, false);
              }}
              onTyping={(value) => setTyping('circle', circleId, Boolean(value))}
              searchQuery={chatSearchQuery}
              onSearchChange={setChatSearchQuery}
              onReact={(messageId, emoji) => reactToCircleMessage(messageId, emoji)}
            />
            </div>
            <div className="motion-fade-up" style={staggerStyle(3)}>
            <CircleMemberPanel
              members={activeCircle.members || []}
              myRole={activeCircle.myRole}
              currentUserId={user?.id}
              onRoleChange={(memberId, role) => updateCircleMemberRole(circleId, memberId, role)}
            />
            </div>
          </div>
        ) : (
          <Card className="p-6">
            <p className="text-lg font-bold">Circle chat</p>
            <p className="mt-2 muted-copy">Join this circle to participate in live chat with other members.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
