import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Flame, ImageUp, Save, Users } from 'lucide-react';
import { Card } from '../components/Card.jsx';
import { Input } from '../components/Input.jsx';
import { Textarea } from '../components/Textarea.jsx';
import { Avatar } from '../components/Avatar.jsx';
import { Button } from '../components/Button.jsx';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../services/api.js';
import { useAppStore } from '../store/appStore.js';

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read avatar file.'));
    reader.readAsDataURL(file);
  });
}

export function ProfilePage() {
  const { userId } = useParams();
  const authUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const posts = useAppStore((state) => state.posts);
  const [profileUser, setProfileUser] = useState(authUser);
  const [stats, setStats] = useState({ totalPosts: 0, totalLikesReceived: 0, circlesJoined: 0 });
  const [form, setForm] = useState({
    name: authUser?.name || '',
    bio: authUser?.bio || '',
    avatar_url: authUser?.avatar_url || '',
    skills: (authUser?.skills || []).join(', '),
  });
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const isOwnProfile = !userId || userId === authUser?.id;

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const endpoint = isOwnProfile ? '/profile' : `/profile/${userId}`;
      try {
        const data = await api.get(endpoint);
        setProfileUser(data.user);
        setStats(data.stats || { totalPosts: 0, totalLikesReceived: 0, circlesJoined: 0 });
        setForm({
          name: data.user?.name || '',
          bio: data.user?.bio || '',
          avatar_url: data.user?.avatar_url || '',
          skills: (data.user?.skills || []).join(', '),
        });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [isOwnProfile, userId]);

  const myPosts = useMemo(
    () => posts.filter((post) => post.author?.id === profileUser?.id).slice(0, 3),
    [posts, profileUser],
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
      setProfileUser(data.user);
      setMessage('Profile updated.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(event) {
    const [file] = Array.from(event.target.files || []);
    if (!file) return;

    setUploadingAvatar(true);
    setUploadMessage('');

    try {
      const dataUrl = await fileToDataUrl(file);
      const data = await api.post('/media/upload', {
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        dataUrl,
      });

      setForm((current) => ({
        ...current,
        avatar_url: data.media?.url || '',
      }));
      setUploadMessage('Avatar uploaded. Save profile to keep it.');
    } catch (error) {
      setUploadMessage(error.message || 'Unable to upload avatar.');
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  }

  return (
    <div className="space-y-5">
      <Card className="p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[32px] bg-[rgb(var(--bg-soft))] p-6">
            {loading ? <div className="h-16 w-16 animate-pulse rounded-2xl bg-[rgb(var(--bg-elevated))]" /> : <Avatar user={{ ...profileUser, avatar_url: form.avatar_url || profileUser?.avatar_url }} size="lg" />}
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
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                [stats.totalPosts, 'Posts'],
                [stats.totalLikesReceived, 'Likes received'],
                [stats.circlesJoined, 'Circles'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-2xl bg-[rgb(var(--bg-elevated))] p-4">
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[rgb(var(--muted))]">{label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[rgb(var(--bg-elevated))] p-4">
                <div className="flex items-center gap-2 text-[rgb(var(--accent))]">
                  <Flame size={16} />
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Consistency</span>
                </div>
                <p className="mt-2 font-semibold">Show up daily, even with a tiny win.</p>
              </div>
              <div className="rounded-2xl bg-[rgb(var(--bg-elevated))] p-4">
                <div className="flex items-center gap-2 text-[rgb(var(--accent))]">
                  <Users size={16} />
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Active circles</span>
                </div>
                <p className="mt-2 font-semibold">{stats.circlesJoined || 0} circles shaping your current momentum.</p>
              </div>
            </div>
          </div>

          {isOwnProfile ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="profile_name"
                label="Name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-[rgb(var(--text))]">Avatar image</span>
                <label
                  htmlFor="avatar-upload"
                  className="flex min-h-[52px] cursor-pointer items-center justify-between rounded-2xl border bg-[rgb(var(--bg-elevated))] px-4 py-3 text-sm text-[rgb(var(--text))] transition hover:bg-[rgb(var(--bg-soft))]"
                >
                  <span className="truncate">
                    {uploadingAvatar ? 'Uploading avatar...' : 'Choose an image to upload'}
                  </span>
                  <span className="inline-flex items-center gap-2 font-semibold text-[rgb(var(--muted))]">
                    <ImageUp size={16} />
                    Browse
                  </span>
                </label>
                <input
                  id="avatar-upload"
                  name="avatar_upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <p className="text-sm text-[rgb(var(--muted))]">
                  JPG, PNG, GIF, or WebP. Upload first, then save your profile.
                </p>
              </label>
            </div>
            <Textarea
              name="profile_bio"
              label="Bio"
              value={form.bio}
              onChange={(event) => setForm({ ...form, bio: event.target.value })}
            />
            <Input
              name="profile_skills"
              label="Skills"
              placeholder="React, UI Design, TypeScript"
              value={form.skills}
              onChange={(event) => setForm({ ...form, skills: event.target.value })}
            />
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>
                <p className={`text-sm ${uploadMessage && uploadMessage.toLowerCase().includes('unable') ? 'text-rose-500' : 'text-[rgb(var(--muted))]'}`}>
                  {uploadMessage}
                </p>
              </div>
              <Button disabled={saving}>
                <Save size={16} />
                {saving ? 'Saving...' : 'Save profile'}
              </Button>
            </div>
            </form>
          ) : (
            <div className="rounded-[28px] border bg-[rgb(var(--bg-elevated))] p-6">
              <p className="text-lg font-bold">Profile snapshot</p>
              <p className="mt-3 text-sm leading-7 text-[rgb(var(--muted))]">
                This view is read-only. Search helps you quickly discover who is learning what across the platform.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {(profileUser?.skills || []).map((skill) => (
                  <span key={skill} className="rounded-full bg-[rgb(var(--accent-soft))] px-3 py-2 text-sm font-semibold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
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
