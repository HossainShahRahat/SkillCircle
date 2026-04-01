export function TypingIndicator({ typingUsers = [] }) {
  if (!typingUsers.length) return null;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-3 text-sm text-[rgb(var(--muted))]">
      <div className="flex items-center gap-1">
        <span className="h-2 w-2 animate-bounce rounded-full bg-[rgb(var(--accent))] [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-[rgb(var(--accent))] [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-[rgb(var(--accent))]" />
      </div>
      <span>
        {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
      </span>
    </div>
  );
}
