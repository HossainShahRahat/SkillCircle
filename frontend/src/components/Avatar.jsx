export function Avatar({ user, size = 'md' }) {
  const sizes = {
    sm: 'h-9 w-9 text-sm',
    md: 'h-11 w-11 text-base',
    lg: 'h-16 w-16 text-xl',
  };

  if (user?.avatar_url) {
    return (
      <img
        className={`${sizes[size]} rounded-2xl object-cover`}
        src={user.avatar_url}
        alt={user.name}
      />
    );
  }

  return (
    <div className={`${sizes[size]} flex items-center justify-center rounded-2xl bg-[rgb(var(--accent-soft))] font-semibold text-[rgb(var(--text))]`}>
      {user?.name?.slice(0, 1) || 'S'}
    </div>
  );
}

