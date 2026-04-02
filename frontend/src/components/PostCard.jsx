import { useState } from 'react';
import { Clock3, MessageCircle, Pencil, Share2, ThumbsUp, Trash2 } from 'lucide-react';
import { Card } from './Card.jsx';
import { Button } from './Button.jsx';
import { CommentComposer } from './CommentComposer.jsx';
import { InlineEditor } from './InlineEditor.jsx';
import { MentionText } from './MentionText.jsx';
import { PostDetailModal } from './PostDetailModal.jsx';
import { ReactionBar } from './ReactionBar.jsx';
import { ReactionQuickActions } from './ReactionQuickActions.jsx';
import { Avatar } from './Avatar.jsx';
import { UserHoverCard } from './UserHoverCard.jsx';
import { formatRelativeTime } from '../utils/time.js';

function formatTime(value) {
  return formatRelativeTime(value);
}

export function PostCard({
  post,
  user,
  onComment,
  onReact,
  onUpdatePost,
  onDeletePost,
  onUpdateComment,
  onDeleteComment,
  activeMembers = [],
  canModerate = false,
}) {
  const comments = Array.isArray(post.comments) ? post.comments : [];
  const [submitting, setSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  async function handleComment(content) {
    setSubmitting(true);
    try {
      await onComment(post.id, content);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="motion-lift overflow-hidden p-0">
      <div className="px-5 pb-4 pt-5 sm:px-6">
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
              {post.isEdited ? <span className="rounded-full bg-[rgb(var(--bg-soft))] px-2 py-1 font-semibold">edited</span> : null}
            </div>
          </div>
          {(post.author?.id === user?.id || canModerate) ? (
            <div className="flex gap-2">
              <Button variant="ghost" className="h-9 w-9 rounded-full p-0" onClick={() => setEditingPost((current) => !current)}>
                <Pencil size={15} />
              </Button>
              <Button variant="ghost" className="h-9 w-9 rounded-full p-0" onClick={() => onDeletePost(post.id)}>
                <Trash2 size={15} />
              </Button>
            </div>
          ) : null}
        </div>

        {editingPost ? (
          <InlineEditor
            initialValue={post.content}
            onSave={async (content) => {
              await onUpdatePost(post.id, content);
              setEditingPost(false);
            }}
            onCancel={() => setEditingPost(false)}
            submitting={submitting}
            placeholder="Update your progress"
          />
        ) : (
          <p className="whitespace-pre-wrap text-[15px] leading-7 text-[rgb(var(--text))]">{post.content}</p>
        )}
      </div>

      {post.image_url ? (
        <img
          src={post.image_url}
          alt="Post attachment"
          loading="lazy"
          className="h-[320px] w-full object-cover"
        />
      ) : null}

      <div className="px-5 pb-4 pt-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 text-sm text-[rgb(var(--muted))]">
          <div className="inline-flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[rgb(var(--accent))] text-white">
              <ThumbsUp size={12} />
            </span>
            <span>{post.reactions?.total || 0} reactions</span>
          </div>
          <div className="flex items-center gap-4">
            <span>{post.commentsCount ?? comments.length} comments</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-b py-2">
          <ReactionQuickActions
            myReaction={post.reactions?.myReaction}
            onDefaultLike={() => onReact('post', post.id, 'like')}
            onReact={(type) => onReact('post', post.id, type)}
          />
          <button type="button" className="social-action-button" onClick={() => setDetailOpen(true)}>
            <MessageCircle size={16} />
            Comment
          </button>
          <button type="button" className="social-action-button">
            <Share2 size={16} />
            Share
          </button>
        </div>

        <ReactionBar reactions={post.reactions} onReact={(type) => onReact('post', post.id, type)} />

        <div className="mt-4 space-y-3">
          {comments.map((item) => (
            <div key={item.id} className="motion-fade-up flex items-start gap-3">
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[rgb(var(--muted))]">{formatTime(item.created_at)}</span>
                      {(item.author?.id === user?.id || canModerate) ? (
                        <>
                          <Button variant="ghost" className="h-8 w-8 rounded-full p-0" onClick={() => setEditingCommentId(item.id)}>
                            <Pencil size={13} />
                          </Button>
                          <Button variant="ghost" className="h-8 w-8 rounded-full p-0" onClick={() => onDeleteComment(item.id)}>
                            <Trash2 size={13} />
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {editingCommentId === item.id ? (
                    <InlineEditor
                      initialValue={item.content}
                      onSave={async (content) => {
                        await onUpdateComment(item.id, content);
                        setEditingCommentId(null);
                      }}
                      onCancel={() => setEditingCommentId(null)}
                      submitting={submitting}
                      placeholder="Update your comment"
                    />
                  ) : (
                    <p className="text-sm leading-6 text-[rgb(var(--text))]">
                      <MentionText content={item.content} mentions={item.mentionedUsers} />
                    </p>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-3 px-2 text-xs font-semibold text-[rgb(var(--muted))]">
                  <button type="button" onClick={() => onReact('comment', item.id, 'like')}>Like</button>
                  {(item.author?.id === user?.id || canModerate) ? (
                    <button type="button" onClick={() => setEditingCommentId(item.id)}>Edit</button>
                  ) : null}
                  <span>{formatTime(item.created_at)}</span>
                </div>
                <ReactionBar compact reactions={item.reactions} onReact={(type) => onReact('comment', item.id, type)} />
              </div>
            </div>
          ))}
        </div>

        <div id={`comment-box-${post.id}`}>
          <CommentComposer
            user={user}
            activeMembers={activeMembers}
            onSubmit={handleComment}
            submitting={submitting}
          />
        </div>
      </div>

      <PostDetailModal
        open={detailOpen}
        post={post}
        user={user}
        submitting={submitting}
        activeMembers={activeMembers}
        onClose={() => setDetailOpen(false)}
        onComment={handleComment}
        onReact={onReact}
      />
    </Card>
  );
}
