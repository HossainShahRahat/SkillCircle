import { ExternalLink } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { Avatar } from './Avatar.jsx';

const profileCache = new Map();

function getInitialProfile(user) {
  if (!user) return null;
  return {
    user,
    stats: null,
  };
}

export function UserHoverCard({ user, children, className = '' }) {
  const closeTimerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(() => getInitialProfile(user));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setProfile(getInitialProfile(user));
  }, [user]);

  useEffect(() => () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (!open || !user?.id) return;

    const cached = profileCache.get(user.id);
    if (cached) {
      setProfile(cached);
      return;
    }

    let cancelled = false;
    setLoading(true);
    api.get(`/profile/${user.id}`)
      .then((data) => {
        if (cancelled) return;
        const nextProfile = {
          user: data.user || user,
          stats: data.stats || null,
        };
        profileCache.set(user.id, nextProfile);
        setProfile(nextProfile);
      })
      .catch(() => null)
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, user]);

  function handleOpen() {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  }

  function handleClose() {
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, 120);
  }

  const profileUser = profile?.user || user;
  const stats = profile?.stats;
  const skills = Array.isArray(profileUser?.skills) ? profileUser.skills.filter(Boolean).slice(0, 3) : [];

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onFocus={handleOpen}
      onBlur={handleClose}
    >
      <Link
        to={`/profile/${user?.id || ''}`}
        className="font-semibold text-inherit transition hover:underline focus:underline"
      >
        {children}
      </Link>

      {open && user?.id ? (
        <div className="surface-card motion-dropdown motion-lift absolute left-0 top-[calc(100%+0.55rem)] z-40 w-[280px] rounded-2xl p-4 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
          <div className="flex items-start gap-3">
            <Avatar user={profileUser} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{profileUser?.name || 'Profile'}</p>
                  <p className="truncate text-xs text-[rgb(var(--muted))]">
                    {profileUser?.email || 'SkillCircle member'}
                  </p>
                </div>
                <ExternalLink size={14} className="mt-0.5 shrink-0 text-[rgb(var(--muted))]" />
              </div>
              <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                {loading ? 'Loading profile...' : profileUser?.bio || 'Learning in public and building momentum one step at a time.'}
              </p>
            </div>
          </div>

          {stats ? (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-[rgb(var(--bg-soft))] px-3 py-2">
                <p className="text-sm font-bold">{stats.totalPosts || 0}</p>
                <p className="text-[11px] text-[rgb(var(--muted))]">Posts</p>
              </div>
              <div className="rounded-xl bg-[rgb(var(--bg-soft))] px-3 py-2">
                <p className="text-sm font-bold">{stats.totalLikesReceived || 0}</p>
                <p className="text-[11px] text-[rgb(var(--muted))]">Likes</p>
              </div>
              <div className="rounded-xl bg-[rgb(var(--bg-soft))] px-3 py-2">
                <p className="text-sm font-bold">{stats.circlesJoined || 0}</p>
                <p className="text-[11px] text-[rgb(var(--muted))]">Circles</p>
              </div>
            </div>
          ) : null}

          {skills.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-[rgb(var(--accent-soft))] px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--accent))]"
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </span>
  );
}
