import { useState } from 'react';
import { Button } from './Button.jsx';
import { Input } from './Input.jsx';
import { Modal } from './Modal.jsx';
import { Textarea } from './Textarea.jsx';

export function CreateCircleModal({ open, onClose, onSubmit, submitting }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const circle = await onSubmit({ name, description, is_private: isPrivate });
    setName('');
    setDescription('');
    setIsPrivate(false);
    onClose(circle);
  }

  return (
    <Modal open={open} title="Create a circle" onClose={() => onClose(null)}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          name="circle_name"
          label="Circle name"
          placeholder="Design Systems Lab"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Textarea
          name="circle_description"
          label="Description"
          placeholder="A focused place to share experiments, critique interface details, and document systems thinking."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <label className="flex items-start gap-3 rounded-2xl border bg-[rgb(var(--bg-soft))] px-4 py-4">
          <input
            id="circle-is-private"
            name="is_private"
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border"
            checked={isPrivate}
            onChange={(event) => setIsPrivate(event.target.checked)}
          />
          <div>
            <p className="text-sm font-semibold">Private circle</p>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              Private circles can only be joined using a 6-character invite code.
            </p>
          </div>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={() => onClose(null)}>
            Cancel
          </Button>
          <Button disabled={submitting || !name.trim() || !description.trim()} type="submit">
            Create circle
          </Button>
        </div>
      </form>
    </Modal>
  );
}
