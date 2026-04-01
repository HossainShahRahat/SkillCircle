import { useEffect } from 'react';
import { BellRing, Flame, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { PostCard } from '../components/PostCard.jsx';
import { useAppStore } from '../store/appStore.js';
import { useAuthStore } from '../store/authStore.js';
import { StreakBadge } from '../components/StreakBadge.jsx';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const posts = useAppStore((state) => state.posts);
  const dashboard = useAppStore((state) => state.dashboard);
  const loadDashboard = useAppStore((state) => state.loadDashboard);
  const loadingDashboard = useAppStore((state) => state.loadingDashboard);
  const commentOnPost = useAppStore((state) => state.commentOnPost);
  const toggleReaction = useAppStore((state) => state.toggleReaction);
  const updatePost = useAppStore((state) => state.updatePost);
  const deletePost = useAppStore((state) => state.deletePost);
  const updateComment = useAppStore((state) => state.updateComment);
  const deleteComment = useAppStore((state) => state.deleteComment);
  const setModalOpen = useAppStore((state) => state.setModalOpen);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden p-0">
        <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1.15fr_0.85fr] md:p-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">Activity dashboard</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Momentum that reflects your circles.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgb(var(--muted))]">
              Your feed now prioritizes the circles you joined, then surfaces the activity most likely to keep your streak and conversations moving.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => setModalOpen(true)}>Share today&apos;s progress</Button>
              <Button variant="secondary" onClick={() => loadDashboard()}>
                <RefreshCw size={16} />
                Refresh dashboard
              </Button>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-[28px] bg-[rgb(var(--bg-soft))] p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgb(var(--text))] text-white dark:bg-white dark:text-slate-900">
                  <Flame size={20} />
                </div>
                <div>
                  <p className="font-semibold">Posting streak</p>
                  <p className="muted-copy">Small, consistent updates compound fast.</p>
                </div>
              </div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-bold">{dashboard.streak?.current_streak || 0}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[rgb(var(--muted))]">days in a row</p>
                </div>
                <StreakBadge badge={dashboard.streak?.badge} />
              </div>
            </div>
            <div className="rounded-[28px] bg-[rgb(var(--bg-soft))] p-5">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgb(var(--accent))] text-white">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="font-semibold">This week</p>
                  <p className="muted-copy">A quick read on your current learning rhythm.</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  [String(dashboard.insights?.joinedCircles || 0), 'joined circles'],
                  [String(dashboard.insights?.totalPosts || 0), 'your updates'],
                  [String(posts.length), 'in dashboard'],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-2xl bg-[rgb(var(--bg-elevated))] p-4">
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[rgb(var(--muted))]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          {loadingDashboard ? (
            <Card className="p-8 text-center">
              <p className="font-semibold">Loading your dashboard...</p>
            </Card>
          ) : posts.length ? (
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
              />
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-lg font-semibold">No circle activity yet</p>
              <p className="mt-2 muted-copy">Join a few circles or publish a fresh update to bring your dashboard to life.</p>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgb(var(--text))] text-white dark:bg-white dark:text-slate-900">
                <Flame size={20} />
              </div>
              <div>
                <p className="font-semibold">Activity highlights</p>
                <p className="muted-copy">Likes, mentions, and joins worth catching quickly.</p>
              </div>
            </div>
            {dashboard.highlights?.length ? (
              <div className="space-y-3">
                {dashboard.highlights.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-3">
                    <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                      <BellRing size={15} className="text-[rgb(var(--accent))]" />
                      <span>{item.actor?.name || 'Someone'}</span>
                    </div>
                    <p className="text-sm text-[rgb(var(--muted))]">
                      {item.type === 'mention' ? 'mentioned you in a comment' : item.type === 'comment' ? 'commented on your post' : item.type === 'like' ? 'reacted to your progress update' : 'joined your circle'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-5 text-sm text-[rgb(var(--muted))]">
                Recent highlights will land here as your circles get more active.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
