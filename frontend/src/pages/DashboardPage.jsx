import { useEffect, useMemo, useRef, useState } from 'react';
import { BellRing, Flame, RefreshCw, Sparkles, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { AnimatedNumber } from '../components/AnimatedNumber.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { FeedSkeleton } from '../components/FeedSkeleton.jsx';
import { InlinePostComposer } from '../components/InlinePostComposer.jsx';
import { PostCard } from '../components/PostCard.jsx';
import { useAppStore } from '../store/appStore.js';
import { useAuthStore } from '../store/authStore.js';
import { StreakBadge } from '../components/StreakBadge.jsx';
import { staggerStyle } from '../utils/motion.js';

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const posts = useAppStore((state) => state.posts);
  const dashboard = useAppStore((state) => state.dashboard);
  const circles = useAppStore((state) => state.circles);
  const loadDashboard = useAppStore((state) => state.loadDashboard);
  const loadingDashboard = useAppStore((state) => state.loadingDashboard);
  const commentOnPost = useAppStore((state) => state.commentOnPost);
  const toggleReaction = useAppStore((state) => state.toggleReaction);
  const updatePost = useAppStore((state) => state.updatePost);
  const deletePost = useAppStore((state) => state.deletePost);
  const updateComment = useAppStore((state) => state.updateComment);
  const deleteComment = useAppStore((state) => state.deleteComment);
  const setModalOpen = useAppStore((state) => state.setModalOpen);
  const createPost = useAppStore((state) => state.createPost);
  const submitting = useAppStore((state) => state.submitting);
  const [feedMode, setFeedMode] = useState('my_circles');
  const [visibleCount, setVisibleCount] = useState(6);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    setVisibleCount(6);
  }, [feedMode, posts.length]);

  const joinedCircleIds = useMemo(
    () => new Set(circles.filter((circle) => circle.joined).map((circle) => circle.id)),
    [circles],
  );

  const visiblePosts = useMemo(() => {
    if (feedMode === 'global') return posts;
    return posts.filter((post) => !post.circle_id || joinedCircleIds.has(post.circle_id));
  }, [feedMode, joinedCircleIds, posts]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || visiblePosts.length <= visibleCount) return undefined;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisibleCount((current) => Math.min(current + 4, visiblePosts.length));
      }
    }, { rootMargin: '200px' });

    observer.observe(target);
    return () => observer.disconnect();
  }, [visibleCount, visiblePosts.length]);

  return (
    <div className="space-y-5">
      <Card className="motion-fade-up motion-lift p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[rgb(var(--muted))]">Home</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Welcome back, {user?.name?.split(' ')[0] || 'there'}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[rgb(var(--muted))]">
              Catch up on the people, circles, and learning streaks that matter most today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button className="rounded-xl" onClick={() => setModalOpen(true)}>Create post</Button>
            <Button className="rounded-xl" variant="secondary" onClick={() => navigate('/circles')}>
              <Users size={16} />
              Explore circles
            </Button>
            <Button className="rounded-xl" variant="secondary" onClick={() => loadDashboard()}>
              <RefreshCw size={16} />
              Refresh
            </Button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            {
              label: 'Posting streak',
              value: dashboard.streak?.current_streak || 0,
              hint: 'days in a row',
              icon: Flame,
            },
            {
              label: 'Joined circles',
              value: dashboard.insights?.joinedCircles || 0,
              hint: 'communities',
              icon: Users,
            },
            {
              label: 'Your updates',
              value: dashboard.insights?.totalPosts || 0,
              hint: 'posts shared',
              icon: Sparkles,
            },
          ].map(({ label, value, hint, icon: Icon }, index) => (
            <div key={label} className="motion-fade-up rounded-2xl bg-[rgb(var(--bg-soft))] p-4" style={staggerStyle(index + 1)}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[rgb(var(--muted))]">{label}</p>
                <Icon size={18} className="text-[rgb(var(--accent))]" />
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-bold"><AnimatedNumber value={value} /></p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[rgb(var(--muted))]">{hint}</p>
                </div>
                {label === 'Posting streak' ? <StreakBadge badge={dashboard.streak?.badge} /> : null}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <InlinePostComposer
        user={user}
        circles={circles.filter((circle) => circle.joined)}
        onSubmit={createPost}
        submitting={submitting}
        onOpenFullComposer={() => setModalOpen(true)}
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-bold">Your feed</p>
              <p className="muted-copy">Switch between the whole network and the circles shaping your momentum.</p>
            </div>
            <div className="flex gap-2 rounded-full bg-[rgb(var(--bg-soft))] p-1">
              {[
                ['my_circles', 'My circles'],
                ['global', 'Global'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${feedMode === value ? 'bg-[rgb(var(--bg-elevated))] shadow-soft' : 'text-[rgb(var(--muted))]'}`}
                  onClick={() => setFeedMode(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {loadingDashboard ? (
            <FeedSkeleton count={3} />
          ) : visiblePosts.length ? (
            <>
              {visiblePosts.slice(0, visibleCount).map((post, index) => (
                <div key={post.id} className="motion-fade-up" style={staggerStyle(index)}>
                  <PostCard
                    post={post}
                    user={user}
                    onComment={(postId, content) => commentOnPost(postId, content, user)}
                    onReact={toggleReaction}
                    onUpdatePost={updatePost}
                    onDeletePost={deletePost}
                    onUpdateComment={updateComment}
                    onDeleteComment={deleteComment}
                  />
                </div>
              ))}
              {visiblePosts.length > visibleCount ? (
                <div ref={loadMoreRef} className="rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-4 text-center text-sm text-[rgb(var(--muted))]">
                  Loading more updates...
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              icon={Sparkles}
              eyebrow="Fresh start"
              title={feedMode === 'my_circles' ? 'Start your journey inside a circle' : 'Start your journey'}
              description={feedMode === 'my_circles'
                ? 'Join or create a circle, then share a small update to make your feed feel personal fast.'
                : 'Post your first progress update to turn this empty feed into a living learning timeline.'}
              actionLabel={feedMode === 'my_circles' ? 'Explore circles' : 'Share your first update'}
              onAction={() => (feedMode === 'my_circles' ? navigate('/circles') : setModalOpen(true))}
              secondaryLabel={feedMode === 'my_circles' ? 'Share an update' : 'Explore circles'}
              onSecondaryAction={() => (feedMode === 'my_circles' ? setModalOpen(true) : navigate('/circles'))}
            />
          )}
        </div>

        <div className="space-y-5">
          <Card className="motion-fade-up motion-lift p-5" style={staggerStyle(2)}>
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
