import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { PostCard } from '../components/PostCard.jsx';
import { useAppStore } from '../store/appStore.js';
import { useAuthStore } from '../store/authStore.js';

export function CirclePage() {
  const { circleId } = useParams();
  const user = useAuthStore((state) => state.user);
  const posts = useAppStore((state) => state.posts);
  const activeCircle = useAppStore((state) => state.activeCircle);
  const loadCircle = useAppStore((state) => state.loadCircle);
  const joinCircle = useAppStore((state) => state.joinCircle);
  const likePost = useAppStore((state) => state.likePost);
  const commentOnPost = useAppStore((state) => state.commentOnPost);
  const setModalOpen = useAppStore((state) => state.setModalOpen);

  useEffect(() => {
    loadCircle(circleId);
  }, [circleId, loadCircle]);

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
              <h1 className="mt-3 font-display text-4xl">{activeCircle.name}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/75">{activeCircle.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/60">Members</p>
                <p className="mt-1 text-xl font-bold">{activeCircle.membersCount}</p>
              </div>
              {activeCircle.joined ? (
                <Button className="bg-white text-slate-900 hover:bg-white/90" onClick={() => setModalOpen(true)}>
                  Share in this circle
                </Button>
              ) : (
                <Button className="bg-white text-slate-900 hover:bg-white/90" onClick={() => joinCircle(circleId)}>
                  Join circle
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {posts.length ? (
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
          <p className="text-lg font-semibold">No posts in this circle yet</p>
          <p className="mt-2 muted-copy">A good first post usually shares a concrete milestone and one honest lesson.</p>
        </Card>
      )}
    </div>
  );
}
