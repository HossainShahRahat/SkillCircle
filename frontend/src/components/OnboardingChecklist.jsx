import { CheckCircle2, CircleDot, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from './Button.jsx';
import { Card } from './Card.jsx';

function buildStorageKey(userId) {
  return `skillcircle-onboarding-dismissed:${userId || 'guest'}`;
}

export function OnboardingChecklist({
  user,
  joinedCirclesCount,
  postsCount,
  onOpenProfile,
  onOpenCreateCircle,
  onOpenPostComposer,
}) {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(buildStorageKey(user?.id)) === 'true');

  const steps = useMemo(() => [
    {
      id: 'profile',
      label: 'Complete your profile',
      description: 'Add a short bio, avatar, and a few skills so people know what you are learning.',
      done: Boolean(user?.bio?.trim() && (user?.skills?.length || user?.avatar_url)),
      actionLabel: 'Finish profile',
      onAction: onOpenProfile,
    },
    {
      id: 'circle',
      label: 'Join or create a circle',
      description: 'Circles make the feed more relevant and give your progress an audience.',
      done: joinedCirclesCount > 0,
      actionLabel: 'Find circles',
      onAction: onOpenCreateCircle,
    },
    {
      id: 'post',
      label: 'Publish your first update',
      description: 'A short daily note is enough. Momentum matters more than polish.',
      done: postsCount > 0,
      actionLabel: 'Post update',
      onAction: onOpenPostComposer,
    },
  ], [joinedCirclesCount, onOpenCreateCircle, onOpenPostComposer, onOpenProfile, postsCount, user]);

  const completed = steps.filter((step) => step.done).length;

  if (dismissed || completed === steps.length) return null;

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-[rgb(var(--text))] px-6 py-6 text-white dark:bg-[rgb(var(--accent))]">
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/70">Getting started</p>
          <h2 className="mt-3 font-display text-4xl leading-tight">A faster path to daily momentum.</h2>
          <p className="mt-4 text-sm leading-7 text-white/76">
            Finish these three steps and your feed, profile, and circles will start feeling alive immediately.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold">
            <Sparkles size={15} />
            {completed} of {steps.length} steps done
          </div>
        </div>
        <div className="space-y-4 px-6 py-6">
          {steps.map((step) => (
            <div key={step.id} className="rounded-[24px] border bg-[rgb(var(--bg-soft))] px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <div className="mt-0.5 text-[rgb(var(--accent))]">
                    {step.done ? <CheckCircle2 size={20} /> : <CircleDot size={20} />}
                  </div>
                  <div>
                    <p className="font-semibold">{step.label}</p>
                    <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">{step.description}</p>
                  </div>
                </div>
                {!step.done ? (
                  <Button variant="secondary" className="shrink-0" onClick={step.onAction}>
                    {step.actionLabel}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                localStorage.setItem(buildStorageKey(user?.id), 'true');
                setDismissed(true);
              }}
            >
              Hide checklist
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
