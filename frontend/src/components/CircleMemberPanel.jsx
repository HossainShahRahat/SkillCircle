import { Button } from './Button.jsx';
import { Card } from './Card.jsx';

const ROLE_OPTIONS = ['member', 'moderator', 'admin'];

export function CircleMemberPanel({ members = [], myRole, currentUserId, onRoleChange }) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <p className="text-lg font-bold">Members</p>
        <p className="muted-copy">Roles clarify moderation responsibility inside the circle.</p>
      </div>
      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.id} className="rounded-2xl border px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{member.name}</p>
                <p className="muted-copy">{member.role}</p>
              </div>
              {myRole === 'admin' && member.id !== currentUserId ? (
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map((role) => (
                    <Button
                      key={role}
                      variant={member.role === role ? 'primary' : 'ghost'}
                      className="rounded-full px-3 py-2 text-xs"
                      onClick={() => onRoleChange(member.id, role)}
                    >
                      {role}
                    </Button>
                  ))}
                </div>
              ) : (
                <span className="rounded-full bg-[rgb(var(--bg-soft))] px-3 py-2 text-xs font-semibold">
                  {member.role}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
