import { Plus } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { navigation } from '../data/navigation.js';
import { Button } from './Button.jsx';

const mobileNavigation = navigation.filter((item) => ['/', '/circles', '/messages', '/notifications', '/profile'].includes(item.path));

export function BottomNav({ onCompose }) {
  return (
    <>
      <Button
        className="fixed bottom-24 right-4 z-40 h-14 w-14 rounded-full p-0 shadow-panel lg:hidden"
        onClick={onCompose}
      >
        <Plus size={20} />
      </Button>
      <nav className="fixed bottom-3 left-3 right-3 z-30 rounded-2xl border bg-[rgb(var(--bg-elevated))] px-3 py-2 shadow-panel lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {mobileNavigation.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center rounded-2xl text-xs font-semibold transition ${
                isActive
                  ? 'bg-[rgb(var(--accent-soft))] text-[rgb(var(--accent))]'
                  : 'text-[rgb(var(--muted))]'
              }`}
            >
              <Icon size={18} />
              <span className="mt-1">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
