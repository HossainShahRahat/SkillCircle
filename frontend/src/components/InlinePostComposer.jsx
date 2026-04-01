import { useMemo, useState } from 'react';
import { ImagePlus, SendHorizontal } from 'lucide-react';
import { Avatar } from './Avatar.jsx';
import { Button } from './Button.jsx';
import { Input } from './Input.jsx';
import { Textarea } from './Textarea.jsx';

export function InlinePostComposer({ user, circles, onSubmit, submitting, onOpenFullComposer }) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [circleId, setCircleId] = useState('');
  const remaining = useMemo(() => 280 - content.length, [content]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!content.trim()) return;
    await onSubmit({ content, image, circleId: circleId || null });
    setContent('');
    setImage('');
    setCircleId('');
  }

  return (
    <form className="surface-card p-5 sm:p-6" onSubmit={handleSubmit}>
      <div className="flex items-center gap-3">
        <Avatar user={user} />
        <div>
          <p className="font-semibold">{user?.name}</p>
          <p className="muted-copy">What moved forward today?</p>
        </div>
      </div>

      <div className="mt-4">
        <Textarea
          name="inline_post_content"
          className="min-h-[110px]"
          maxLength={280}
          placeholder="Share a small win, a lesson, or one thing you are trying next."
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_220px]">
        <Input
          name="inline_post_image_url"
          label="Optional image URL"
          placeholder="https://images.unsplash.com/..."
          value={image}
          onChange={(event) => setImage(event.target.value)}
        />
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Audience</span>
          <select
            id="inline-post-circle-id"
            name="inline_circle_id"
            className="rounded-2xl border bg-[rgb(var(--bg-elevated))] px-4 py-3 text-sm"
            value={circleId}
            onChange={(event) => setCircleId(event.target.value)}
          >
            <option value="">Global feed</option>
            {circles.map((circle) => (
              <option key={circle.id} value={circle.id}>
                {circle.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm text-[rgb(var(--muted))]">
          <span>{remaining} characters left</span>
          <button
            type="button"
            className="inline-flex items-center gap-2 font-semibold text-[rgb(var(--accent))]"
            onClick={onOpenFullComposer}
          >
            <ImagePlus size={15} />
            Use full composer
          </button>
        </div>
        <Button disabled={submitting || !content.trim()} type="submit">
          <SendHorizontal size={16} />
          {submitting ? 'Posting...' : 'Post update'}
        </Button>
      </div>
    </form>
  );
}
