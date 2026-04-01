import { Card } from './Card.jsx';

export function FeedSkeleton({ count = 3 }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 animate-pulse rounded-2xl bg-[rgb(var(--bg-soft))]" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-40 animate-pulse rounded-full bg-[rgb(var(--bg-soft))]" />
              <div className="mt-3 h-3 w-24 animate-pulse rounded-full bg-[rgb(var(--bg-soft))]" />
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="h-4 w-full animate-pulse rounded-full bg-[rgb(var(--bg-soft))]" />
            <div className="h-4 w-[88%] animate-pulse rounded-full bg-[rgb(var(--bg-soft))]" />
            <div className="h-4 w-[72%] animate-pulse rounded-full bg-[rgb(var(--bg-soft))]" />
          </div>
          <div className="mt-6 h-36 animate-pulse rounded-[24px] bg-[rgb(var(--bg-soft))]" />
        </Card>
      ))}
    </div>
  );
}
