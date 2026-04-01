import { BellRing, CheckCheck } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { useAppStore } from '../store/appStore.js';

function notificationMessage(notification) {
  const actor = notification.actor?.name || 'Someone';
  if (notification.type === 'like') return `${actor} liked your post`;
  if (notification.type === 'comment') return `${actor} commented on your post`;
  if (notification.type === 'mention') return `${actor} mentioned you`;
  if (notification.type === 'message') return `${actor} sent you a message`;
  return `${actor} joined your circle`;
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const notifications = useAppStore((state) => state.notifications);
  const notificationsLoading = useAppStore((state) => state.notificationsLoading);
  const loadNotifications = useAppStore((state) => state.loadNotifications);
  const markNotificationRead = useAppStore((state) => state.markNotificationRead);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unread = useMemo(() => notifications.filter((notification) => !notification.is_read), [notifications]);

  async function markAllAsRead() {
    await Promise.all(unread.map((notification) => markNotificationRead(notification.id).catch(() => null)));
  }

  return (
    <div className="space-y-5">
      <Card className="p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">Notifications</p>
            <h1 className="mt-3 text-3xl font-bold">Everything that needs your attention, in one place.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgb(var(--muted))]">
              Likes, comments, mentions, and circle activity land here so you can catch up quickly without hunting across the app.
            </p>
          </div>
          <Button variant="secondary" onClick={markAllAsRead} disabled={!unread.length}>
            <CheckCheck size={16} />
            Mark all as read
          </Button>
        </div>
      </Card>

      {notificationsLoading ? (
        <Card className="p-8 text-center">
          <p className="font-semibold">Loading notifications...</p>
        </Card>
      ) : notifications.length ? (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`cursor-pointer p-5 transition hover:border-[rgba(var(--accent),0.25)] ${notification.is_read ? '' : 'bg-[rgb(var(--accent-soft))]/30'}`}
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={async () => {
                  if (!notification.is_read) {
                    await markNotificationRead(notification.id);
                  }
                  if (notification.circle_id) {
                    navigate(`/circles/${notification.circle_id}`);
                    return;
                  }
                  navigate('/');
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgb(var(--bg-soft))] text-[rgb(var(--accent))]">
                      <BellRing size={18} />
                    </div>
                    <div>
                      <p className="font-semibold">{notificationMessage(notification)}</p>
                      <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                        {notification.post_id ? 'Tap to jump back into the conversation.' : 'Tap to open the most relevant place in the app.'}
                      </p>
                    </div>
                  </div>
                  {!notification.is_read ? <span className="rounded-full bg-[rgb(var(--accent))] px-2 py-1 text-xs font-bold text-white">New</span> : null}
                </div>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
                  {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(notification.created_at))}
                </p>
              </button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={BellRing}
          eyebrow="All clear"
          title="No notifications yet"
          description="Once people react, comment, mention you, or join your circles, they will show up here."
        />
      )}
    </div>
  );
}
