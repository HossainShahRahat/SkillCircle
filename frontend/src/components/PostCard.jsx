import { useState } from 'react';
import { Heart, MessageSquare, Clock3 } from 'lucide-react';
import { Card } from './Card.jsx';
import { Avatar } from './Avatar.jsx';
import { Button } from './Button.jsx';
import { CommentComposer } from './CommentComposer.jsx';
import { MentionText } from './MentionText.jsx';

function formatTime(value) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function PostCard({ post, user, onLike, onComment, activeMembers = [] }) {
  const [submitting, setSubmitting] = useState(false);

  async function handleComment(content) {
    setSubmitting(true);
    try {
      await onComment(post.id, content);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-4">
        <Avatar user={post.author} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{post.author?.name}</p>
            {post.circle ? (
              <span className="rounded-full bg-[rgb(var(--accent-soft))] px-2 py-1 text-xs font-semibold text-[rgb(var(--text))]">
                {post.circle.name}
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-[rgb(var(--muted))]">
            <Clock3 size={14} />
            <span>{formatTime(post.created_at)}</span>
          </div>
        </div>
      </div>

      <p className="whitespace-pre-wrap text-[15px] leading-7 text-[rgb(var(--text))]">{post.content}</p>

      {post.image_url ? (
        <img
          src={post.image_url}
          alt="Post attachment"
          className="mt-5 h-[320px] w-full rounded-[24px] object-cover"
        />
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button variant={post.likedByMe ? 'primary' : 'secondary'} onClick={() => onLike(post.id)}>
          <Heart size={16} className={post.likedByMe ? 'fill-current' : ''} />
          {post.likesCount}
        </Button>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-2.5 text-sm font-semibold">
          <MessageSquare size={16} />
          {post.commentsCount}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {post.comments.map((item) => (
          <div key={item.id} className="rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-3">
            <div className="mb-1 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">{item.author?.name}</p>
              <span className="text-xs text-[rgb(var(--muted))]">{formatTime(item.created_at)}</span>
            </div>
            <p className="text-sm leading-6 text-[rgb(var(--text))]">
              <MentionText content={item.content} mentions={item.mentionedUsers} />
            </p>
          </div>
        ))}
      </div>

      <CommentComposer
        user={user}
        activeMembers={activeMembers}
        onSubmit={handleComment}
        submitting={submitting}
      />
    </Card>
  );
}
