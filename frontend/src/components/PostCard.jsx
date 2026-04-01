import { useState } from 'react';
import { MessageSquare, Clock3, Pencil, Trash2 } from 'lucide-react';
import { Card } from './Card.jsx';
import { Button } from './Button.jsx';
import { CommentComposer } from './CommentComposer.jsx';
import { InlineEditor } from './InlineEditor.jsx';
import { MentionText } from './MentionText.jsx';
import { ReactionBar } from './ReactionBar.jsx';
import { Avatar } from './Avatar.jsx';
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
  const [submitting, setSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);

  async function handleComment(content) {
    setSubmitting(true);
    try {
      await onComment(post.id, content);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="p-5 sm:p-6 transition hover:border-[rgba(var(--accent),0.2)]">
      <div className="mb-5 flex items-start gap-4">
        <Avatar user={post.author} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{post.author?.name}</p>
            {post.circle ? (
              <span className="rounded-full bg-[rgb(var(--accent-soft))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--text))]">
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
            <Button variant="ghost" className="h-10 w-10 rounded-full p-0" onClick={() => setEditingPost((current) => !current)}>
              <Pencil size={15} />
            </Button>
            <Button variant="ghost" className="h-10 w-10 rounded-full p-0" onClick={() => onDeletePost(post.id)}>
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

      {post.image_url ? (
        <img
          src={post.image_url}
          alt="Post attachment"
          loading="lazy"
          className="mt-5 h-[320px] w-full rounded-[24px] object-cover"
        />
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center gap-2 rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-2.5 text-sm font-semibold">
          <MessageSquare size={16} />
          {post.commentsCount}
        </div>
      </div>

      <ReactionBar reactions={post.reactions} onReact={(type) => onReact('post', post.id, type)} />

      <div className="mt-5 space-y-3">
        {post.comments.map((item) => (
          <div key={item.id} className="rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-3">
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{item.author?.name}</p>
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
            <ReactionBar compact reactions={item.reactions} onReact={(type) => onReact('comment', item.id, type)} />
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
