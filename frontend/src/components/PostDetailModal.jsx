import { Clock3, MessageCircle, ThumbsUp } from 'lucide-react';
import { Avatar } from './Avatar.jsx';
import { CommentComposer } from './CommentComposer.jsx';
import { MentionText } from './MentionText.jsx';
import { Modal } from './Modal.jsx';
import { ReactionBar } from './ReactionBar.jsx';
import { UserHoverCard } from './UserHoverCard.jsx';
import { formatRelativeTime } from '../utils/time.js';

function formatTime(value) {
  return formatRelativeTime(value);
}

export function PostDetailModal({
  open,
  post,
  user,
  submitting,
  activeMembers = [],
  onClose,
  onComment,
  onReact,
}) {
  if (!post) return null;
  const comments = Array.isArray(post.comments) ? post.comments : [];

  return (
    <Modal open={open} title="Post activity" onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-[28px] bg-[rgb(var(--bg-soft))] p-5">
          <div className="mb-4 flex items-start gap-3">
            <Avatar user={post.author} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-[15px]">
                {post.author?.id ? (
                  <UserHoverCard user={post.author}>
                    <span className="font-semibold">{post.author?.name || 'Unknown user'}</span>
                  </UserHoverCard>
                ) : (
                  <p className="font-semibold">{post.author?.name || 'Unknown user'}</p>
                )}
                {post.circle ? (
                  <span className="rounded-full bg-[rgb(var(--accent-soft))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--accent))]">
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
              loading="lazy"
              className="mt-4 h-[320px] w-full rounded-[24px] object-cover"
            />
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm text-[rgb(var(--muted))]">
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[rgb(var(--accent))] text-white">
                <ThumbsUp size={12} />
              </span>
              <span>{post.reactions?.total || 0} reactions</span>
            </div>
            <div className="inline-flex items-center gap-2">
              <MessageCircle size={15} />
              <span>{post.commentsCount ?? comments.length} comments</span>
            </div>
          </div>

          <ReactionBar reactions={post.reactions} onReact={(type) => onReact('post', post.id, type)} />
        </div>

        <div className="space-y-3">
          {comments.length ? comments.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <Avatar user={item.author} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-3">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {item.author?.id ? (
                        <UserHoverCard user={item.author}>
                          <span className="text-sm font-semibold">{item.author?.name || 'Unknown user'}</span>
                        </UserHoverCard>
                      ) : (
                        <p className="text-sm font-semibold">{item.author?.name || 'Unknown user'}</p>
                      )}
                      {item.isEdited ? <span className="text-[11px] font-semibold text-[rgb(var(--muted))]">edited</span> : null}
                    </div>
                    <span className="text-xs text-[rgb(var(--muted))]">{formatTime(item.created_at)}</span>
                  </div>
                  <p className="text-sm leading-6 text-[rgb(var(--text))]">
                    <MentionText content={item.content} mentions={item.mentionedUsers} />
                  </p>
                </div>
                <ReactionBar compact reactions={item.reactions} onReact={(type) => onReact('comment', item.id, type)} />
              </div>
            </div>
          )) : (
            <div className="rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-5 text-sm text-[rgb(var(--muted))]">
              No comments yet. Start the conversation from here.
            </div>
          )}
        </div>

        <CommentComposer
          user={user}
          activeMembers={activeMembers}
          onSubmit={onComment}
          submitting={submitting}
        />
      </div>
    </Modal>
  );
}
