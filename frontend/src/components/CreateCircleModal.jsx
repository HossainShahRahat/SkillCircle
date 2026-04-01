import { useState } from 'react';
import { Button } from './Button.jsx';
import { Input } from './Input.jsx';
import { Modal } from './Modal.jsx';
import { Textarea } from './Textarea.jsx';

export function CreateCircleModal({ open, onClose, onSubmit, submitting }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const circle = await onSubmit({ name, description });
    setName('');
    setDescription('');
    onClose(circle);
  }

  return (
    <Modal open={open} title="Create a circle" onClose={() => onClose(null)}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Circle name"
          placeholder="Design Systems Lab"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Textarea
          label="Description"
          placeholder="A focused place to share experiments, critique interface details, and document systems thinking."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
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
