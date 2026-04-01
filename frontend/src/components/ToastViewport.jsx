import { CheckCircle2, CircleAlert, X } from 'lucide-react';
import { useAppStore } from '../store/appStore.js';
import { Button } from './Button.jsx';

export function ToastViewport() {
  const toasts = useAppStore((state) => state.toasts);
  const dismissToast = useAppStore((state) => state.dismissToast);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto surface-card animate-[toast-in_180ms_ease-out] flex items-start gap-3 p-4"
        >
          <div className="mt-0.5 text-[rgb(var(--success))]">
            {toast.type === 'error' ? <CircleAlert size={18} /> : <CheckCircle2 size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{toast.type === 'error' ? 'Action failed' : 'Success'}</p>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">{toast.message}</p>
          </div>
          <Button
            variant="ghost"
            className="h-8 w-8 rounded-full p-0"
            onClick={() => dismissToast(toast.id)}
          >
            <X size={14} />
          </Button>
        </div>
      ))}
    </div>
  );
}
