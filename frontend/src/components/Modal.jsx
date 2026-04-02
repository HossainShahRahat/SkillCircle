import { X } from 'lucide-react';
import { Button } from './Button.jsx';

export function Modal({ open, title, children, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="surface-card motion-scale-in max-h-[92vh] w-full max-w-2xl overflow-y-auto p-5 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="muted-copy">Stay focused on the key interaction without leaving the feed.</p>
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
