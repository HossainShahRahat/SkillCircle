import { MessageSquareText, PenSquare, Users, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button.jsx';
import { Card } from './Card.jsx';

function storageKey(userId) {
  return `skillcircle-feature-tips:${userId || 'guest'}`;
}

export function FeatureTips({ user, onCompose }) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(storageKey(user?.id)) === 'true');

  if (dismissed || !user?.id) return null;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">Quick tips</p>
          <h3 className="mt-2 text-xl font-bold">Three places you will use most.</h3>
        </div>
        <button
          type="button"
          className="rounded-full p-2 text-[rgb(var(--muted))] transition hover:bg-[rgb(var(--bg-soft))]"
          onClick={() => {
            localStorage.setItem(storageKey(user?.id), 'true');
            setDismissed(true);
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {[
          {
            icon: PenSquare,
            title: 'Post quickly',
            description: 'Use the inline composer or the floating plus button to keep your streak moving.',
            action: 'Write update',
            onClick: onCompose,
          },
          {
            icon: Users,
            title: 'Join circles',
            description: 'Circles shape your feed and make conversations feel much more relevant.',
            action: 'Open circles',
            onClick: () => navigate('/circles'),
          },
          {
            icon: MessageSquareText,
            title: 'Check chat',
            description: 'Messages and circle chat are where accountability turns into momentum.',
            action: 'Open inbox',
            onClick: () => navigate('/messages'),
          },
        ].map(({ icon: Icon, title, description, action, onClick }) => (
          <div key={title} className="rounded-[24px] bg-[rgb(var(--bg-soft))] p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgb(var(--bg-elevated))] text-[rgb(var(--accent))]">
              <Icon size={18} />
            </div>
            <p className="mt-4 font-semibold">{title}</p>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{description}</p>
            <Button variant="secondary" className="mt-4 w-full" onClick={onClick}>
              {action}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
