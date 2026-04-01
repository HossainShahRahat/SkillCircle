import { useEffect } from 'react';
import { ActivityBars } from '../components/ActivityBars.jsx';
import { Card } from '../components/Card.jsx';
import { StreakBadge } from '../components/StreakBadge.jsx';
import { useAppStore } from '../store/appStore.js';

export function InsightsPage() {
  const analytics = useAppStore((state) => state.userAnalytics);
  const loadingAnalytics = useAppStore((state) => state.loadingAnalytics);
  const loadUserAnalytics = useAppStore((state) => state.loadUserAnalytics);

  useEffect(() => {
    loadUserAnalytics();
  }, [loadUserAnalytics]);

  return (
    <div className="space-y-5">
      <Card className="p-6 md:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">Insights</p>
        <h1 className="mt-3 text-3xl font-bold">A clearer read on your learning consistency.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgb(var(--muted))]">
          These numbers stay intentionally compact: enough to spot momentum, identify your strongest circles, and keep posting with purpose.
        </p>
      </Card>

      {loadingAnalytics && !analytics ? (
        <Card className="p-8 text-center">
          <p className="font-semibold">Loading your insights...</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              [analytics?.totals?.posts || 0, 'Posts published'],
              [analytics?.totals?.reactionsReceived || 0, 'Reactions received'],
              [analytics?.totals?.activeCircles || 0, 'Active circles'],
            ].map(([value, label]) => (
              <Card key={label} className="p-6">
                <p className="text-3xl font-bold">{value}</p>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">{label}</p>
              </Card>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-bold">Weekly activity</p>
                  <p className="muted-copy">Posts published over the last seven days.</p>
                </div>
              </div>
              <ActivityBars points={analytics?.weeklyActivity || []} />
            </Card>

            <Card className="p-6">
              <p className="text-lg font-bold">Streak and rewards</p>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">A subtle reward loop that keeps the app motivating without becoming noisy.</p>
              <div className="mt-6 flex items-center justify-between gap-4 rounded-[24px] bg-[rgb(var(--bg-soft))] p-5">
                <div>
                  <p className="text-4xl font-bold">{analytics?.streak?.current_streak || 0}</p>
                  <p className="mt-1 text-sm text-[rgb(var(--muted))]">day streak</p>
                </div>
                <StreakBadge badge={analytics?.streak?.badge} />
              </div>
              <div className="mt-5 rounded-[24px] border bg-[rgb(var(--bg-soft))] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Top circle</p>
                <p className="mt-2 text-lg font-bold">{analytics?.topCircle?.name || 'Not enough data yet'}</p>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">{analytics?.topCircle?.description || 'Your strongest circle will appear here once your posting pattern settles in.'}</p>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
