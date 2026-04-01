import { useEffect } from 'react';
import { Flame, RefreshCw } from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { PostCard } from '../components/PostCard.jsx';
import { useAppStore } from '../store/appStore.js';
import { useAuthStore } from '../store/authStore.js';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const posts = useAppStore((state) => state.posts);
  const loadFeed = useAppStore((state) => state.loadFeed);
  const loadingFeed = useAppStore((state) => state.loadingFeed);
  const likePost = useAppStore((state) => state.likePost);
  const commentOnPost = useAppStore((state) => state.commentOnPost);
  const setModalOpen = useAppStore((state) => state.setModalOpen);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden p-0">
        <div className="grid gap-6 p-5 sm:p-6 md:grid-cols-[1.2fr_0.8fr] md:p-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">Global feed</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">Learning progress with actual signal.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgb(var(--muted))]">
              Keep updates short, concrete, and worth responding to. The feed is optimized for momentum, not endless scrolling.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => setModalOpen(true)}>Share today&apos;s progress</Button>
              <Button variant="secondary" onClick={() => loadFeed()}>
                <RefreshCw size={16} />
                Refresh feed
              </Button>
            </div>
          </div>
          <div className="rounded-[28px] bg-[rgb(var(--bg-soft))] p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgb(var(--text))] text-white dark:bg-white dark:text-slate-900">
                <Flame size={20} />
              </div>
              <div>
                <p className="font-semibold">Progress rhythm</p>
                <p className="muted-copy">The best posts are honest, specific, and recent.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ['3', 'updates this week'],
                ['2', 'circles joined'],
                [String(posts.length), 'posts in feed'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-[rgb(var(--bg-elevated))] p-4">
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[rgb(var(--muted))]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {loadingFeed ? (
        <Card className="p-8 text-center">
          <p className="font-semibold">Loading updates...</p>
        </Card>
      ) : posts.length ? (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            user={user}
            onLike={likePost}
            onComment={(postId, content) => commentOnPost(postId, content, user)}
          />
        ))
      ) : (
        <Card className="p-8 text-center">
          <p className="text-lg font-semibold">No progress posts yet</p>
          <p className="mt-2 muted-copy">Create the first update and set the tone for the community.</p>
        </Card>
      )}
    </div>
  );
}
