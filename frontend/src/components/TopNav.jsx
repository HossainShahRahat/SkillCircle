import { Home, Menu, MessageCircle, MoonStar, Plus, Search, SunMedium } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Avatar } from './Avatar.jsx';
import { Button } from './Button.jsx';
import { NotificationBell } from './NotificationBell.jsx';
import { SearchBar } from './SearchBar.jsx';

export function TopNav({ user, theme, onToggleTheme, onCompose, onToggleMobileMenu }) {
  const navigate = useNavigate();

  return (
    <header className="social-topbar">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-3 sm:px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            className="social-icon-button lg:hidden"
            onClick={onToggleMobileMenu}
          >
            <Menu size={18} />
          </button>
          <button
            type="button"
            className="flex items-center gap-3"
            onClick={() => navigate('/')}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--accent))] text-sm font-bold text-white">
              SC
            </div>
            <div className="hidden sm:block">
              <p className="text-lg font-bold tracking-tight">SkillCircle</p>
            </div>
          </button>
        </div>

        <div className="hidden flex-1 justify-center px-4 md:flex">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <NavLink
              to="/"
              className={({ isActive }) => `social-icon-button ${isActive ? 'bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))]' : ''}`}
            >
              <Home size={18} />
            </NavLink>
            <NavLink
              to="/messages"
              className={({ isActive }) => `social-icon-button ${isActive ? 'bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))]' : ''}`}
            >
              <MessageCircle size={18} />
            </NavLink>
          </div>

          <button
            type="button"
            className="social-icon-button md:hidden"
            onClick={() => navigate('/circles')}
          >
            <Search size={18} />
          </button>

          <button
            type="button"
            className="social-icon-button"
            onClick={onCompose}
          >
            <Plus size={18} />
          </button>

          <button
            type="button"
            className="social-icon-button hidden sm:inline-flex"
            onClick={onToggleTheme}
          >
            {theme === 'dark' ? <SunMedium size={18} /> : <MoonStar size={18} />}
          </button>

          <NotificationBell />

          <Button
            variant="secondary"
            className="hidden h-10 items-center gap-2 rounded-full px-2.5 sm:inline-flex"
            onClick={() => navigate('/profile')}
          >
            <Avatar user={user} size="sm" />
            <span className="hidden md:inline">{user?.name?.split(' ')[0] || 'Profile'}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
