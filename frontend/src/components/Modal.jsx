import { X } from 'lucide-react';
import { Button } from './Button.jsx';

export function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm">
      <div className="surface-card w-full max-w-2xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="muted-copy">Share a crisp update, not a wall of text.</p>
          </div>
          <Button variant="ghost" className="h-11 w-11 rounded-full p-0" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

