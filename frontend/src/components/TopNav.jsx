import { Home, LogOut, Menu, MoonStar, Plus, Search, Settings2, SunMedium, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Avatar } from './Avatar.jsx';
import { Button } from './Button.jsx';
import { MessageInboxButton } from './MessageInboxButton.jsx';
import { NotificationBell } from './NotificationBell.jsx';
import { SearchBar } from './SearchBar.jsx';
import { useAuthStore } from '../store/authStore.js';

export function TopNav({ user, theme, onToggleTheme, onCompose, onToggleMobileMenu }) {
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className="social-topbar">
      <div className="mx-auto flex h-16 max-w-[1760px] items-center gap-3 px-3 sm:px-4 xl:px-6 2xl:px-8">
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
            <MessageInboxButton />
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

          <div ref={profileMenuRef} className="relative hidden sm:block">
            <Button
              variant="secondary"
              className="h-10 items-center gap-2 rounded-full px-2.5"
              onClick={() => setProfileMenuOpen((current) => !current)}
            >
              <Avatar user={user} size="sm" />
              <span className="hidden md:inline">{user?.name?.split(' ')[0] || 'Profile'}</span>
            </Button>

            {profileMenuOpen ? (
              <div className="surface-card motion-dropdown absolute right-0 top-[calc(100%+0.7rem)] z-40 w-60 rounded-2xl p-2">
                <div className="border-b px-3 py-3">
                  <p className="truncate text-sm font-bold">{user?.name || 'SkillCircle user'}</p>
                  <p className="truncate text-xs text-[rgb(var(--muted))]">{user?.email || 'Signed in'}</p>
                </div>
                <div className="p-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-[rgb(var(--bg-soft))]"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/profile');
                    }}
                  >
                    <UserRound size={16} />
                    View profile
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-[rgb(var(--bg-soft))]"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/settings');
                    }}
                  >
                    <Settings2 size={16} />
                    Settings
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-500 transition hover:bg-rose-500/10"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      logout();
                      navigate('/auth');
                    }}
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
