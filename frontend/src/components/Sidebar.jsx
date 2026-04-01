import { MoonStar, SunMedium, Plus } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { navigation } from '../data/navigation.js';
import { Button } from './Button.jsx';
import { Avatar } from './Avatar.jsx';
import { CircleBadge } from './CircleBadge.jsx';

export function Sidebar({ user, circles, onCompose, onToggleTheme, theme }) {
  return (
    <aside className="glass-panel sticky top-6 hidden h-[calc(100vh-3rem)] w-[280px] flex-col rounded-[32px] p-5 xl:flex">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgb(var(--text))] font-display text-lg text-white dark:bg-white dark:text-slate-900">
          SC
        </div>
        <div>
          <p className="text-lg font-bold">SkillCircle</p>
          <p className="muted-copy">Ship your progress in public.</p>
        </div>
      </div>

      <Button className="mb-6 min-h-12 w-full justify-center" onClick={onCompose}>
        <Plus size={16} />
        New update
      </Button>

      <nav className="space-y-2">
        {navigation.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'bg-[rgb(var(--text))] text-white dark:bg-white dark:text-slate-900'
                  : 'text-[rgb(var(--text))] hover:bg-[rgb(var(--bg-soft))]'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">
          Your circles
        </p>
        <div className="space-y-2">
          {circles.slice(0, 4).map((circle) => (
            <NavLink
              key={circle.id}
              to={`/circles/${circle.id}`}
              className="block rounded-2xl border px-4 py-3 transition hover:border-[rgba(var(--accent),0.25)] hover:bg-[rgb(var(--bg-soft))]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{circle.name}</p>
                <CircleBadge isPrivate={circle.is_private} />
              </div>
              <p className="muted-copy">{circle.membersCount} members</p>
            </NavLink>
          ))}
        </div>
      </div>

      <div className="mt-auto rounded-[28px] bg-[rgb(var(--bg-soft))] p-4">
        <div className="mb-4 flex items-center gap-3">
          <Avatar user={user} />
          <div>
            <p className="font-semibold">{user?.name}</p>
            <p className="muted-copy">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-between rounded-2xl" onClick={onToggleTheme}>
          {theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          {theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
        </Button>
      </div>
    </aside>
  );
}
