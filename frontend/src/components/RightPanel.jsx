import { TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from './Card.jsx';
import { Button } from './Button.jsx';

export function RightPanel({ circles, onCreateCircle }) {
  return (
    <aside className="hidden w-[320px] shrink-0 space-y-5 2xl:block">
      <Card className="overflow-hidden p-0">
        <div className="bg-[rgb(var(--text))] px-6 py-5 text-white dark:bg-[rgb(var(--accent))]">
          <p className="mb-1 text-sm uppercase tracking-[0.24em] text-white/70">Momentum</p>
          <h3 className="font-display text-3xl">Learn in public, with structure.</h3>
        </div>
        <div className="p-6">
          <p className="muted-copy">
            Focused circles keep updates meaningful. Post progress, get feedback, and keep your streak alive.
          </p>
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-base font-bold">Circles to join</p>
            <p className="muted-copy">Small communities with high signal.</p>
          </div>
          <TrendingUp size={18} className="text-[rgb(var(--muted))]" />
        </div>
        <div className="space-y-3">
          {circles.slice(0, 5).map((circle) => (
            <Link
              key={circle.id}
              to={`/circles/${circle.id}`}
              className="block rounded-2xl border px-4 py-4 transition hover:border-[rgba(var(--accent),0.25)] hover:bg-[rgb(var(--bg-soft))]"
            >
              <div className="mb-1 flex items-center justify-between">
                <p className="font-semibold">{circle.name}</p>
                <span className="rounded-full bg-[rgb(var(--accent-soft))] px-2 py-1 text-xs font-semibold">
                  {circle.membersCount}
                </span>
              </div>
              <p className="muted-copy">{circle.description}</p>
            </Link>
          ))}
        </div>
        <Button variant="secondary" className="mt-4 w-full" onClick={onCreateCircle}>
          Create a circle
        </Button>
      </Card>
    </aside>
  );
}
