import { useState } from 'react';
import { Button } from './Button.jsx';
import { Textarea } from './Textarea.jsx';

export function InlineEditor({ initialValue, onSave, onCancel, submitting, placeholder }) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="space-y-3">
      <Textarea
        className="min-h-[100px]"
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={submitting || !value.trim()} type="button" onClick={() => onSave(value)}>
          Save changes
        </Button>
      </div>
    </div>
  );
}

