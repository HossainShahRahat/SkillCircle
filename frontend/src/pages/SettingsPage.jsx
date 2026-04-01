import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { useAppStore } from '../store/appStore.js';

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-[24px] border bg-[rgb(var(--bg-soft))] px-4 py-4">
      <div>
        <p className="font-semibold">{label}</p>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">{description}</p>
      </div>
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 rounded border-[rgb(var(--border))]"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

export function SettingsPage() {
  const settings = useAppStore((state) => state.settings);
  const loadingSettings = useAppStore((state) => state.loadingSettings);
  const loadSettings = useAppStore((state) => state.loadSettings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const [form, setForm] = useState({
    post_visibility: 'public',
    notify_likes: true,
    notify_comments: true,
    notify_mentions: true,
    notify_joins: true,
    weekly_digest: false,
  });

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (settings) {
      setForm(settings);
    }
  }, [settings]);

  async function handleSubmit(event) {
    event.preventDefault();
    await updateSettings(form);
  }

  return (
    <div className="space-y-5">
      <Card className="p-6 md:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">User settings</p>
        <h1 className="mt-3 text-3xl font-bold">Control who sees your work and how updates reach you.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[rgb(var(--muted))]">
          Keep the defaults lightweight, or tune your notifications and privacy so SkillCircle matches your working style.
        </p>
      </Card>

      <form className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]" onSubmit={handleSubmit}>
        <Card className="space-y-4 p-6">
          <div>
            <p className="text-lg font-bold">Privacy</p>
            <p className="muted-copy">Choose whether your posts travel beyond the circles you participate in.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['public', 'Public visibility', 'Your posts can appear across the app when relevant.'],
              ['circles', 'Circle-only visibility', 'Only people who share circles with you can discover your posts.'],
            ].map(([value, label, description]) => (
              <button
                type="button"
                key={value}
                className={`rounded-[24px] border px-5 py-5 text-left transition ${form.post_visibility === value ? 'border-[rgba(var(--accent),0.45)] bg-[rgb(var(--accent-soft))]' : 'bg-[rgb(var(--bg-soft))] hover:border-[rgba(var(--accent),0.25)]'}`}
                onClick={() => setForm((current) => ({ ...current, post_visibility: value }))}
              >
                <p className="font-semibold">{label}</p>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">{description}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <div>
            <p className="text-lg font-bold">Notification preferences</p>
            <p className="muted-copy">Stay in the loop without turning every interaction into noise.</p>
          </div>
          <ToggleRow
            label="Likes"
            description="Get notified when someone reacts to your progress updates."
            checked={form.notify_likes}
            onChange={(checked) => setForm((current) => ({ ...current, notify_likes: checked }))}
          />
          <ToggleRow
            label="Comments"
            description="Receive notifications for new comments on your posts."
            checked={form.notify_comments}
            onChange={(checked) => setForm((current) => ({ ...current, notify_comments: checked }))}
          />
          <ToggleRow
            label="Mentions"
            description="Be alerted when someone mentions you inside a circle."
            checked={form.notify_mentions}
            onChange={(checked) => setForm((current) => ({ ...current, notify_mentions: checked }))}
          />
          <ToggleRow
            label="Circle joins"
            description="See when new members join circles you created."
            checked={form.notify_joins}
            onChange={(checked) => setForm((current) => ({ ...current, notify_joins: checked }))}
          />
          <ToggleRow
            label="Weekly digest"
            description="Receive a compact summary of activity and streak momentum."
            checked={form.weekly_digest}
            onChange={(checked) => setForm((current) => ({ ...current, weekly_digest: checked }))}
          />
        </Card>

        <div className="xl:col-span-2 flex justify-end">
          <Button disabled={loadingSettings}>
            <Save size={16} />
            {loadingSettings ? 'Saving...' : 'Save settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
