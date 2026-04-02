export function Avatar({ user, size = 'md' }) {
  const sizes = {
    sm: 'h-9 w-9 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-20 w-20 text-2xl',
  };

  if (user?.avatar_url) {
    return (
      <img
        className={`${sizes[size]} rounded-full object-cover`}
        referrerPolicy="no-referrer"
        src={user.avatar_url}
        alt={user.name}
        loading="lazy"
      />
    );
  }

  return (
    <div className={`${sizes[size]} flex items-center justify-center rounded-full bg-[rgb(var(--accent-soft))] font-semibold text-[rgb(var(--accent))]`}>
      {user?.name?.slice(0, 1) || 'S'}
    </div>
  );
}
