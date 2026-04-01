import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useAppStore } from '../store/appStore.js';
import { Button } from './Button.jsx';

function notificationMessage(notification) {
  const actor = notification.actor?.name || 'Someone';
  if (notification.type === 'like') return `${actor} liked your post`;
  if (notification.type === 'comment') return `${actor} commented on your post`;
  if (notification.type === 'mention') return `${actor} mentioned you in a comment`;
  return `${actor} joined your circle`;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const notifications = useAppStore((state) => state.notifications);
  const notificationsLoading = useAppStore((state) => state.notificationsLoading);
  const loadNotifications = useAppStore((state) => state.loadNotifications);
  const markNotificationRead = useAppStore((state) => state.markNotificationRead);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    loadNotifications();
  }, [loadNotifications, token]);

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="relative h-11 w-11 rounded-full border bg-[rgb(var(--bg-elevated))] p-0"
        onClick={() => {
          if (!open) {
            if (token) {
              loadNotifications();
            }
          }
          setOpen((current) => !current);
        }}
      >
        <Bell size={18} />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[rgb(var(--accent))] px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="surface-card absolute right-0 top-[calc(100%+0.75rem)] z-40 w-[min(360px,calc(100vw-2rem))] p-4">
          <div className="mb-3">
            <p className="text-base font-bold">Notifications</p>
            <p className="muted-copy">Activity around your posts and circles.</p>
          </div>

          {notificationsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-14 animate-pulse rounded-2xl bg-[rgb(var(--bg-soft))]" />
              ))}
            </div>
          ) : notifications.length ? (
            <div className="max-h-[380px] space-y-2 overflow-y-auto">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition hover:bg-[rgb(var(--bg-soft))] ${notification.is_read ? 'opacity-70' : 'bg-[rgb(var(--accent-soft))]/40'}`}
                  onClick={async () => {
                    if (!notification.is_read) {
                      await markNotificationRead(notification.id);
                    }
                    setOpen(false);
                    if (notification.circle_id) {
                      navigate(`/circles/${notification.circle_id}`);
                      return;
                    }
                    navigate('/');
                  }}
                >
                  <p className="text-sm font-semibold">{notificationMessage(notification)}</p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(notification.created_at))}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-[rgb(var(--bg-soft))] px-4 py-5 text-sm text-[rgb(var(--muted))]">
              No notifications yet.
            </div>
          )}
          <Button
            variant="secondary"
            className="mt-3 w-full"
            onClick={() => {
              setOpen(false);
              navigate('/notifications');
            }}
          >
            Open notifications center
          </Button>
        </div>
      ) : null}
    </div>
  );
}
