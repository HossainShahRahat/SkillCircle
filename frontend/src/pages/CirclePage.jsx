import { useEffect, useState } from 'react';
import { Search, Settings2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
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
  const messages = useAppStore((state) => state.messages);
  const messagesLoading = useAppStore((state) => state.messagesLoading);
  const sendMessage = useAppStore((state) => state.sendMessage);
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
      loadMessages(circleId);
    }
  }, [activeCircle?.joined, circleId, loadMessages]);

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
      <Card className="overflow-hidden p-0">
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
          <Card className="p-5">
            <div className="flex items-center gap-3 rounded-2xl border bg-[rgb(var(--bg-elevated))] px-4 py-3">
              <Search size={16} className="text-[rgb(var(--muted))]" />
              <input
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

          {posts.length ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
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
            <CircleChatPanel
              messages={messages}
              user={user}
              loading={messagesLoading}
              onSend={(content) => sendMessage(circleId, content)}
            />
            <CircleMemberPanel
              members={activeCircle.members || []}
              myRole={activeCircle.myRole}
              currentUserId={user?.id}
              onRoleChange={(memberId, role) => updateCircleMemberRole(circleId, memberId, role)}
            />
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
