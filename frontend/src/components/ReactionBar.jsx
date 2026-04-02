import { Button } from './Button.jsx';

const REACTION_OPTIONS = [
  { type: 'like', label: 'Like', emoji: '👍' },
  { type: 'heart', label: 'Heart', emoji: '❤️' },
  { type: 'fire', label: 'Fire', emoji: '🔥' },
  { type: 'celebrate', label: 'Celebrate', emoji: '🎉' },
];

export function ReactionBar({ reactions, onReact, compact = false }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'mt-3'}`}>
      {REACTION_OPTIONS.map((option) => {
        const count = reactions?.counts?.[option.type] || 0;
        const active = reactions?.myReaction === option.type;
        return (
          <Button
            key={option.type}
            variant={active ? 'secondary' : 'ghost'}
            className={`min-h-9 rounded-full px-3 py-2 text-xs ${active ? 'text-[rgb(var(--accent))]' : ''}`}
            onClick={() => onReact(option.type)}
          >
            <span>{option.emoji}</span>
            <span>{count}</span>
          </Button>
        );
      })}
    </div>
  );
}
