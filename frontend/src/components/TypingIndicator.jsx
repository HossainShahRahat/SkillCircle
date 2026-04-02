export function TypingIndicator({ typingUsers = [] }) {
  if (!typingUsers.length) return null;

  return (
    <div className="motion-fade-up flex items-center gap-3 rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-3 text-sm text-[rgb(var(--muted))]">
      <div className="flex items-center gap-1">
        <span className="motion-typing-dot h-2 w-2 rounded-full bg-[rgb(var(--accent))]" style={{ animationDelay: '-0.24s' }} />
        <span className="motion-typing-dot h-2 w-2 rounded-full bg-[rgb(var(--accent))]" style={{ animationDelay: '-0.12s' }} />
        <span className="motion-typing-dot h-2 w-2 rounded-full bg-[rgb(var(--accent))]" />
      </div>
      <span>
        {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
      </span>
    </div>
  );
}
