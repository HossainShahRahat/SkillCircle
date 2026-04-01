import { useMemo, useState } from 'react';
import { Button } from './Button.jsx';
import { Input } from './Input.jsx';
import { Modal } from './Modal.jsx';
import { Textarea } from './Textarea.jsx';

export function CreatePostModal({ open, circles, onClose, onSubmit, submitting }) {
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [circleId, setCircleId] = useState('');
  const remaining = useMemo(() => 280 - content.length, [content]);

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit({ content, image, circleId: circleId || null });
    setContent('');
    setImage('');
    setCircleId('');
  }

  return (
    <Modal open={open} title="Share progress" onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Textarea
          label="What moved forward today?"
          maxLength={280}
          placeholder="Day 5 learning React: I finally understood why state belongs higher in the tree when multiple components need to coordinate."
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <div className="flex justify-end">
          <span className={`text-sm ${remaining < 40 ? 'text-orange-500' : 'text-[rgb(var(--muted))]'}`}>
            {remaining} characters left
          </span>
        </div>
        <Input
          label="Optional image URL"
          placeholder="https://images.unsplash.com/..."
          value={image}
          onChange={(event) => setImage(event.target.value)}
        />
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Post to a circle</span>
          <select
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
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={submitting || !content.trim()} type="submit">
            Publish update
          </Button>
        </div>
      </form>
    </Modal>
  );
}

