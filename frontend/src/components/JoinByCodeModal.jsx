import { useState } from 'react';
import { Button } from './Button.jsx';
import { Input } from './Input.jsx';
import { Modal } from './Modal.jsx';

export function JoinByCodeModal({ open, onClose, onSubmit, submitting }) {
  const [code, setCode] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(code);
    setCode('');
    onClose();
  }

  return (
    <Modal open={open} title="Enter invite code" onClose={onClose}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Invite code"
          maxLength={6}
          placeholder="SYS246"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
        />
        <p className="muted-copy">Private circles require a valid 6-character code from an admin.</p>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={submitting || code.trim().length < 6} type="submit">
            Join circle
          </Button>
        </div>
      </form>
    </Modal>
  );
}

