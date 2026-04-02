import { Flame, Heart, PartyPopper, ThumbsUp } from 'lucide-react';
import { useRef, useState } from 'react';

const OPTIONS = [
  { type: 'like', label: 'Like', Icon: ThumbsUp },
  { type: 'heart', label: 'Heart', Icon: Heart },
  { type: 'fire', label: 'Fire', Icon: Flame },
  { type: 'celebrate', label: 'Celebrate', Icon: PartyPopper },
];

export function ReactionQuickActions({ myReaction, onDefaultLike, onReact }) {
  const closeTimerRef = useRef(null);
  const [open, setOpen] = useState(false);

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => setOpen(false), 120);
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        clearCloseTimer();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className={`social-action-button w-full ${myReaction ? 'text-[rgb(var(--accent))]' : ''}`}
        onClick={onDefaultLike}
      >
        <ThumbsUp size={16} />
        {myReaction === 'like' ? 'Liked' : 'Like'}
      </button>

      {open ? (
        <div
          className="surface-card absolute bottom-[calc(100%+0.55rem)] left-0 z-20 flex items-center gap-1 rounded-full px-2 py-2 shadow-[0_16px_34px_rgba(0,0,0,0.24)]"
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleClose}
        >
          {OPTIONS.map(({ type, label, Icon }) => (
            <button
              key={type}
              type="button"
              title={label}
              aria-label={label}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition hover:scale-110 hover:bg-[rgb(var(--bg-soft))] ${myReaction === type ? 'bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))]' : 'text-[rgb(var(--text))]'}`}
              onClick={() => {
                onReact(type);
                setOpen(false);
              }}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
