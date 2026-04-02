import { Compass, Plus, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { CircleBadge } from '../components/CircleBadge.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { useAppStore } from '../store/appStore.js';

export function CirclesPage() {
  const navigate = useNavigate();
  const circles = useAppStore((state) => state.circles);
  const joinCircle = useAppStore((state) => state.joinCircle);
  const setModalOpen = useAppStore((state) => state.setModalOpen);
  const showToast = useAppStore((state) => state.showToast);
  const [tab, setTab] = useState('joined');

  const joined = useMemo(() => circles.filter((circle) => circle.joined), [circles]);
  const discover = useMemo(() => circles.filter((circle) => !circle.joined), [circles]);
  const visible = tab === 'joined' ? joined : discover;

  return (
    <div className="space-y-5">
      <Card className="p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">Circles</p>
            <h1 className="mt-3 text-3xl font-bold">Find the communities that make your progress stick.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgb(var(--muted))]">
              Join small, focused spaces where updates feel useful, feedback stays relevant, and consistency becomes visible.
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            Share an update
          </Button>
        </div>
      </Card>

      <div className="flex flex-wrap gap-3">
        {[
          ['joined', `My circles (${joined.length})`],
          ['discover', `Discover (${discover.length})`],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === value ? 'bg-[rgb(var(--text))] text-white dark:bg-white dark:text-slate-900' : 'bg-[rgb(var(--bg-soft))] text-[rgb(var(--muted))]'
            }`}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {visible.map((circle) => (
            <Card key={circle.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold">{circle.name}</h2>
                    <CircleBadge isPrivate={circle.is_private} />
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[rgb(var(--muted))]">{circle.description}</p>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3 text-sm text-[rgb(var(--muted))]">
                <Users size={16} />
                <span>{circle.membersCount} members</span>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => navigate(`/circles/${circle.id}`)}>
                  Open circle
                </Button>
                {!circle.joined ? (
                  <Button
                    onClick={() => {
                      if (circle.is_private) {
                        showToast('Use an invite code to join this private circle.', 'error');
                        return;
                      }
                      joinCircle(circle.id).catch((error) => showToast(error.message, 'error'));
                    }}
                  >
                    Join circle
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={tab === 'joined' ? Users : Compass}
          eyebrow={tab === 'joined' ? 'No circles yet' : 'Nothing to discover'}
          title={tab === 'joined' ? 'Join or create your first circle' : 'You already explored everything here'}
          description={tab === 'joined'
            ? 'Circles make your feed more relevant and your progress more social. Start with one focused group.'
            : 'Try creating a new circle for a topic you want to learn in public.'}
          actionLabel={tab === 'joined' ? 'Browse discover tab' : 'Go to my circles'}
          onAction={() => setTab(tab === 'joined' ? 'discover' : 'joined')}
          secondaryLabel="Share an update"
          onSecondaryAction={() => setModalOpen(true)}
        />
      )}
    </div>
  );
}
