import { ArrowLeft, Compass } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { useAuthStore } from '../store/authStore.js';

export function NotFoundPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const homePath = token ? '/' : '/auth';

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-8">
      <Card className="relative w-full max-w-3xl overflow-hidden p-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(var(--accent),0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,138,76,0.16),transparent_32%)]" />
        <div className="relative grid gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div className="rounded-[32px] bg-[rgb(var(--text))] px-6 py-8 text-white shadow-soft dark:bg-[rgb(var(--accent))]">
            <p className="text-sm font-bold uppercase tracking-[0.26em] text-white/65">404</p>
            <p className="mt-4 font-display text-6xl leading-none sm:text-7xl">Lost?</p>
            <p className="mt-4 text-sm leading-7 text-white/75">
              This page drifted outside the circle.
            </p>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--accent-soft))] px-4 py-2 text-sm font-semibold text-[rgb(var(--text))]">
              <Compass size={15} />
              Route not found
            </div>
            <h1 className="mt-5 max-w-xl font-display text-4xl leading-tight sm:text-5xl">
              The link exists in spirit, just not in this app.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[rgb(var(--muted))]">
              Try heading back to your dashboard, messages, or auth screen and jump back in from there.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to={homePath}>
                <Button className="w-full sm:w-auto">Go to {token ? 'dashboard' : 'sign in'}</Button>
              </Link>
              <Button
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={16} />
                Go back
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
