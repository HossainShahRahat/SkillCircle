import { useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { Card } from '../components/Card.jsx';
import { Input } from '../components/Input.jsx';
import { Textarea } from '../components/Textarea.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { Button } from '../components/Button.jsx';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../services/api.js';
import { useAppStore } from '../store/appStore.js';

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const posts = useAppStore((state) => state.posts);
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || '',
    skills: (user?.skills || []).join(', '),
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const myPosts = useMemo(
    () => posts.filter((post) => post.author?.id === user?.id).slice(0, 3),
    [posts, user],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const data = await api.put('/profile', {
        ...form,
        skills: form.skills.split(',').map((item) => item.trim()).filter(Boolean),
      });
      setUser(data.user);
      setMessage('Profile updated.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[32px] bg-[rgb(var(--bg-soft))] p-6">
            <Avatar user={{ ...user, avatar_url: form.avatar_url || user?.avatar_url }} size="lg" />
            <h1 className="mt-5 text-3xl font-bold">{form.name || 'Your profile'}</h1>
            <p className="mt-3 text-sm leading-7 text-[rgb(var(--muted))]">
              {form.bio || 'Your profile is where your learning identity becomes legible. Add a grounded bio and a few skills people can recognize instantly.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {form.skills.split(',').map((skill) => skill.trim()).filter(Boolean).map((skill) => (
                <span key={skill} className="rounded-full bg-[rgb(var(--accent-soft))] px-3 py-2 text-sm font-semibold">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
              <Input
                label="Avatar URL"
                value={form.avatar_url}
                onChange={(event) => setForm({ ...form, avatar_url: event.target.value })}
              />
            </div>
            <Textarea
              label="Bio"
              value={form.bio}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
            />
            <Input
              label="Skills"
              placeholder="React, UI Design, TypeScript"
              value={form.skills}
              onChange={(event) => setForm({ ...form, skills: event.target.value })}
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>
              <Button disabled={saving}>
                <Save size={16} />
                {saving ? 'Saving...' : 'Save profile'}
              </Button>
            </div>
          </form>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Recent updates</h2>
            <p className="muted-copy">A quick snapshot of what your profile is signaling.</p>
          </div>
        </div>

        {myPosts.length ? (
          <div className="space-y-4">
            {myPosts.map((post) => (
              <div key={post.id} className="rounded-[24px] border bg-[rgb(var(--bg-soft))] p-5">
                <p className="text-sm leading-7">{post.content}</p>
                <div className="mt-3 flex gap-4 text-sm text-[rgb(var(--muted))]">
                  <span>{post.likesCount} likes</span>
                  <span>{post.commentsCount} comments</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted-copy">Your updates will appear here after you publish a few milestones.</p>
        )}
      </Card>
    </div>
  );
}

