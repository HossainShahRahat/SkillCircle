import { useEffect, useState } from 'react';
import { Search, Users, Layers3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore.js';
import { CircleBadge } from './CircleBadge.jsx';

export function SearchBar() {
  const navigate = useNavigate();
  const search = useAppStore((state) => state.search);
  const clearSearch = useAppStore((state) => state.clearSearch);
  const searchResults = useAppStore((state) => state.searchResults);
  const searchLoading = useAppStore((state) => state.searchLoading);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        search(query);
        setOpen(true);
      } else {
        clearSearch();
        setOpen(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query, search, clearSearch]);

  const hasResults = searchResults.users.length || searchResults.circles.length;

  return (
    <div className="relative w-full max-w-xl">
      <div className="flex items-center gap-3 rounded-full bg-[rgb(var(--bg-soft))] px-4 py-2.5">
        <Search size={16} className="text-[rgb(var(--muted))]" />
        <input
          id="global-search"
          name="global_search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (query.trim()) setOpen(true);
          }}
          placeholder="Search circles or people"
          className="w-full bg-transparent text-sm placeholder:text-[rgb(var(--muted))]"
        />
      </div>

      {open ? (
        <div className="surface-card absolute left-0 right-0 top-[calc(100%+0.6rem)] z-40 overflow-hidden p-3 sm:p-4">
          {searchLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-12 animate-pulse rounded-2xl bg-[rgb(var(--bg-soft))]" />
              ))}
            </div>
          ) : hasResults ? (
            <div className="space-y-4">
              {searchResults.users.length ? (
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[rgb(var(--muted))]">
                    <Users size={14} />
                    Users
                  </div>
                  <div className="space-y-2">
                    {searchResults.users.map((user) => (
                      <button
                        key={user.id}
                        className="w-full rounded-xl px-4 py-3 text-left transition hover:bg-[rgb(var(--bg-soft))]"
                        onClick={() => {
                          navigate(`/profile/${user.id}`);
                          setOpen(false);
                        }}
                      >
                        <p className="font-semibold">{user.name}</p>
                        <p className="muted-copy truncate">{user.bio || user.email}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {searchResults.circles.length ? (
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[rgb(var(--muted))]">
                    <Layers3 size={14} />
                    Circles
                  </div>
                  <div className="space-y-2">
                    {searchResults.circles.map((circle) => (
                      <button
                        key={circle.id}
                        className="w-full rounded-xl px-4 py-3 text-left transition hover:bg-[rgb(var(--bg-soft))]"
                        onClick={() => {
                          navigate(`/circles/${circle.id}`);
                          setOpen(false);
                        }}
                      >
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <p className="font-semibold">{circle.name}</p>
                          <CircleBadge isPrivate={circle.is_private} />
                        </div>
                        <p className="muted-copy truncate">{circle.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-5 text-sm text-[rgb(var(--muted))]">
              No matches yet. Try a circle name or a person.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
