import { MoonStar, SunMedium, Plus } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { navigation } from '../data/navigation.js';
import { Button } from './Button.jsx';
import { Avatar } from './Avatar.jsx';
import { CircleBadge } from './CircleBadge.jsx';

export function Sidebar({ user, circles, onCompose, onToggleTheme, theme, mobileOpen = false, onCloseMobile }) {
  const joinedCircles = circles.filter((circle) => circle.joined);
  const primaryNavigation = navigation.filter((item) => !['/settings', '/insights'].includes(item.path));
  const secondaryNavigation = navigation.filter((item) => ['/settings', '/insights'].includes(item.path));

  return (
    <>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden"
          onClick={onCloseMobile}
        />
      ) : null}
      <aside className={`fixed inset-y-16 left-0 z-40 w-[280px] border-r bg-[rgb(var(--bg-elevated))] p-4 transition lg:sticky lg:top-20 lg:block lg:h-[calc(100vh-6rem)] lg:rounded-2xl lg:border lg:bg-transparent lg:p-0 lg:shadow-none ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex h-full flex-col rounded-2xl bg-[rgb(var(--bg-elevated))] p-3 shadow-soft lg:border">
      <div className="mb-4 flex items-center gap-3 rounded-xl px-2 py-2">
        <Avatar user={user} size="md" />
        <div className="min-w-0">
          <p className="truncate font-semibold">{user?.name}</p>
          <p className="truncate text-xs text-[rgb(var(--muted))]">{user?.email}</p>
        </div>
      </div>

      <Button className="mb-4 min-h-11 w-full justify-center rounded-xl" onClick={onCompose}>
        <Plus size={16} />
        New update
      </Button>

      <nav className="space-y-1.5">
        {primaryNavigation.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `social-nav-link ${isActive ? 'social-nav-link-active' : ''}`
            }
            onClick={onCloseMobile}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-5 border-t pt-4">
        <p className="mb-3 px-2 text-xs font-bold uppercase tracking-[0.22em] text-[rgb(var(--muted))]">
          Shortcuts
        </p>
        <div className="space-y-1.5">
          {secondaryNavigation.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `social-nav-link ${isActive ? 'social-nav-link-active' : ''}`
              }
              onClick={onCloseMobile}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t pt-4">
        <p className="mb-3 px-2 text-xs font-bold uppercase tracking-[0.22em] text-[rgb(var(--muted))]">
          Your circles
        </p>
        <div className="space-y-2">
          {joinedCircles.slice(0, 5).map((circle) => (
            <NavLink
              key={circle.id}
              to={`/circles/${circle.id}`}
              className={({ isActive }) => `block rounded-xl px-3 py-3 transition ${isActive ? 'bg-[rgb(var(--accent-soft))]' : 'hover:bg-[rgb(var(--bg-soft))]'}`}
              onClick={onCloseMobile}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{circle.name}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{circle.membersCount} members</p>
                </div>
                <CircleBadge isPrivate={circle.is_private} />
              </div>
            </NavLink>
          ))}
          {!joinedCircles.length ? (
            <div className="rounded-xl bg-[rgb(var(--bg-soft))] px-4 py-4 text-sm text-[rgb(var(--muted))]">
              Join a circle to personalize your feed.
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-auto border-t pt-4">
        <Button variant="ghost" className="w-full justify-between rounded-xl" onClick={onToggleTheme}>
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          {theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
        </Button>
      </div>
        </div>
      </aside>
    </>
  );
}
