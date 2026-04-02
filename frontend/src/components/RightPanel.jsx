import { Activity, CirclePlus, MessageCircle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from './Card.jsx';
import { Button } from './Button.jsx';
import { CircleBadge } from './CircleBadge.jsx';
import { Avatar } from './Avatar.jsx';
import { useAppStore } from '../store/appStore.js';

export function RightPanel({ user, circles, onOpenChat, onCreateCircle, onOpenJoinByCode, onJoinPublic }) {
  const directChats = useAppStore((state) => state.directChats);
  const joinedCircles = circles.filter((circle) => circle.joined).slice(0, 5);
  const suggestedCircles = circles.filter((circle) => !circle.joined).slice(0, 4);
  const contacts = directChats.slice(0, 9);

  return (
    <aside className="sticky top-20 hidden h-fit w-[320px] shrink-0 space-y-4 xl:block">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Avatar user={user} size="md" />
          <div>
            <p className="font-semibold">{user?.name}</p>
            <p className="text-xs text-[rgb(var(--muted))]">You are visible to your circles today</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" className="justify-center rounded-xl" onClick={onCreateCircle}>
            <CirclePlus size={16} />
            Create
          </Button>
          <Button variant="ghost" className="justify-center rounded-xl" onClick={onOpenJoinByCode}>
            Join by code
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-base font-bold">Online now</p>
            <p className="muted-copy">People and spaces shaping your feed.</p>
          </div>
          <Activity size={18} className="text-[rgb(var(--muted))]" />
        </div>
        <div className="space-y-3">
          {joinedCircles.length ? joinedCircles.map((circle) => (
            <div
              key={circle.id}
              className="rounded-xl px-3 py-3 transition hover:bg-[rgb(var(--bg-soft))]"
            >
              <Link to={`/circles/${circle.id}`} className="block">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-10 w-10 rounded-full bg-[rgb(var(--accent-soft))]">
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[rgb(var(--bg-elevated))] bg-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{circle.name}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">{circle.membersCount} members active</p>
                    </div>
                  </div>
                  <CircleBadge isPrivate={circle.is_private} />
                </div>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">{circle.description}</p>
              </Link>
            </div>
          )) : (
            <div className="rounded-xl bg-[rgb(var(--bg-soft))] px-4 py-4 text-sm text-[rgb(var(--muted))]">
              Join a few circles to see activity and shortcuts here.
            </div>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-base font-bold">Suggested circles</p>
            <p className="muted-copy">Communities you can join fast.</p>
          </div>
          <Users size={18} className="text-[rgb(var(--muted))]" />
        </div>
        <div className="space-y-3">
          {suggestedCircles.map((circle) => (
            <div key={circle.id} className="rounded-xl bg-[rgb(var(--bg-soft))] p-3">
              <Link to={`/circles/${circle.id}`} className="block">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{circle.name}</p>
                  <CircleBadge isPrivate={circle.is_private} />
                </div>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">{circle.description}</p>
              </Link>
              <Button
                variant="secondary"
                className="mt-3 w-full rounded-xl"
                onClick={() => {
                  if (circle.is_private) {
                    onOpenJoinByCode();
                    return;
                  }
                  onJoinPublic(circle.id);
                }}
              >
                {circle.is_private ? 'Enter code' : 'Join circle'}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-base font-bold">Contacts</p>
            <p className="muted-copy">Reply fast from the dock, or open full chat.</p>
          </div>
          <MessageCircle size={18} className="text-[rgb(var(--muted))]" />
        </div>
        <div className="space-y-1">
          {contacts.length ? contacts.map((chat) => (
            <button
              key={chat.id}
              type="button"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-[rgb(var(--bg-soft))]"
              onClick={() => onOpenChat?.(chat.id)}
            >
              <div className="relative">
                <Avatar user={chat.participant} size="sm" />
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[rgb(var(--bg-elevated))] bg-emerald-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{chat.participant?.name}</p>
                <p className="truncate text-xs text-[rgb(var(--muted))]">
                  {chat.last_message?.content || chat.last_message?.media_name || 'Say hello'}
                </p>
              </div>
              {chat.unread_count ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[rgb(var(--accent))] px-1.5 text-[10px] font-bold text-white">
                  {chat.unread_count}
                </span>
              ) : null}
            </button>
          )) : (
            <div className="rounded-xl bg-[rgb(var(--bg-soft))] px-4 py-4 text-sm text-[rgb(var(--muted))]">
              Your recent chats will appear here.
            </div>
          )}
        </div>
      </Card>
    </aside>
  );
}
