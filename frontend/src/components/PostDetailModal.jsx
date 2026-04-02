import { Clock3, MessageCircle, ThumbsUp, X } from 'lucide-react';
import { Avatar } from './Avatar.jsx';
import { Button } from './Button.jsx';
import { CommentComposer } from './CommentComposer.jsx';
import { MentionText } from './MentionText.jsx';
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
  if (!open || !post) return null;
  const comments = Array.isArray(post.comments) ? post.comments : [];

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-4 py-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="motion-scale-in flex h-[min(92vh,860px)] w-full max-w-[760px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#242526] text-white shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-[1.05rem] font-bold">
              {post.author?.name || 'Someone'}
              {"'"}s Post
            </p>
          </div>
          <Button
            variant="ghost"
            className="absolute right-4 top-4 h-11 w-11 rounded-full bg-white/10 p-0 text-white hover:bg-white/15"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </div>

        <div className="messenger-chat-scroll flex-1 overflow-y-auto">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex items-start gap-3">
              <Avatar user={post.author} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[15px]">
                  {post.author?.id ? (
                    <UserHoverCard user={post.author}>
                      <span className="font-semibold text-white">{post.author?.name || 'Unknown user'}</span>
                    </UserHoverCard>
                  ) : (
                    <p className="font-semibold text-white">{post.author?.name || 'Unknown user'}</p>
                  )}
                  {post.circle ? (
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/80">
                      {post.circle.name}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-white/55">
                  <Clock3 size={13} />
                  <span>{formatTime(post.created_at)}</span>
                </div>
              </div>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-[1rem] leading-7 text-white/95">
              {post.content}
            </p>
          </div>

          {post.image_url ? (
            <div className="bg-[#1c1d1e]">
              <img
                src={post.image_url}
                alt="Post attachment"
                loading="lazy"
                className="max-h-[520px] w-full object-contain"
              />
            </div>
          ) : (
            <div className="border-b border-white/10 bg-[#1c1d1e] px-6 py-14 text-center text-white/45">
              No media attached to this post.
            </div>
          )}

          <div className="border-b border-white/10 px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/65">
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

          <div className="space-y-3 px-5 py-4">
            {comments.length ? comments.map((item) => (
              <div key={item.id} className="flex items-start gap-3">
                <Avatar user={item.author} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="rounded-2xl bg-white/5 px-4 py-3">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {item.author?.id ? (
                          <UserHoverCard user={item.author}>
                            <span className="text-sm font-semibold text-white">{item.author?.name || 'Unknown user'}</span>
                          </UserHoverCard>
                        ) : (
                          <p className="text-sm font-semibold text-white">{item.author?.name || 'Unknown user'}</p>
                        )}
                        {item.isEdited ? <span className="text-[11px] font-semibold text-white/40">edited</span> : null}
                      </div>
                      <span className="text-xs text-white/40">{formatTime(item.created_at)}</span>
                    </div>
                    <p className="text-sm leading-6 text-white/82">
                      <MentionText content={item.content} mentions={item.mentionedUsers} />
                    </p>
                  </div>
                  <ReactionBar compact reactions={item.reactions} onReact={(type) => onReact('comment', item.id, type)} />
                </div>
              </div>
            )) : (
              <div className="rounded-2xl bg-white/5 px-4 py-5 text-sm text-white/55">
                No comments yet. Start the conversation from here.
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 px-4 py-4">
          <CommentComposer
            user={user}
            activeMembers={activeMembers}
            onSubmit={onComment}
            submitting={submitting}
            variant="overlay"
            placeholder={`Comment as ${user?.name || 'you'}`}
          />
        </div>
      </div>
    </div>
  );
}
