import { Card } from './Card.jsx';

export function FeedSkeleton({ count = 3 }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="motion-shimmer h-11 w-11 rounded-2xl" />
            <div className="min-w-0 flex-1">
              <div className="motion-shimmer h-4 w-40 rounded-full" />
              <div className="motion-shimmer mt-3 h-3 w-24 rounded-full" />
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="motion-shimmer h-4 w-full rounded-full" />
            <div className="motion-shimmer h-4 w-[88%] rounded-full" />
            <div className="motion-shimmer h-4 w-[72%] rounded-full" />
          </div>
          <div className="motion-shimmer mt-6 h-36 rounded-[24px]" />
        </Card>
      ))}
    </div>
  );
}
