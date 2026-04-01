import { CheckCircle2, ChevronRight, CircleDot, Sparkles, UserRound, Users, MessageSquarePlus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button.jsx';
import { Input } from './Input.jsx';
import { Textarea } from './Textarea.jsx';
import { Avatar } from './Avatar.jsx';
import { api } from '../services/api.js';
import { fileToDataUrl } from '../utils/uploads.js';

function buildStateKey(userId) {
  return `skillcircle-onboarding-state:${userId || 'guest'}`;
}

function readState(userId) {
  try {
    return JSON.parse(localStorage.getItem(buildStateKey(userId)) || 'null');
  } catch {
    return null;
  }
}

function writeState(userId, value) {
  localStorage.setItem(buildStateKey(userId), JSON.stringify(value));
}

function stepStatus(done) {
  return done ? <CheckCircle2 size={18} /> : <CircleDot size={18} />;
}

export function OnboardingFlow({
  user,
  circles,
  joinedCirclesCount,
  myPostsCount,
  joinCircle,
  createCircle,
  createPost,
  setUser,
  onComplete,
}) {
  const navigate = useNavigate();
  const initialState = readState(user?.id);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(initialState?.step || 0);
  const [saving, setSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    skills: (user?.skills || []).join(', '),
    avatar_url: user?.avatar_url || '',
  });
  const [circleForm, setCircleForm] = useState({ name: '', description: '' });
  const [postForm, setPostForm] = useState({ content: '', circleId: '' });
  const [message, setMessage] = useState('');

  const discoverCircles = useMemo(() => circles.filter((circle) => !circle.joined).slice(0, 3), [circles]);

  useEffect(() => {
    if (!user?.id) {
      setOpen(false);
      return;
    }

    const stored = readState(user.id);
    setOpen(!stored?.completed && !stored?.skipped);
    setStep(stored?.step || 0);
    setProfileForm({
      name: user?.name || '',
      skills: (user?.skills || []).join(', '),
      avatar_url: user?.avatar_url || '',
    });
  }, [user]);

  if (!open || !user?.id) return null;

  const steps = [
    { id: 'welcome', label: 'Welcome', icon: Sparkles },
    { id: 'profile', label: 'Profile', icon: UserRound },
    { id: 'circles', label: 'Circles', icon: Users },
    { id: 'post', label: 'First post', icon: MessageSquarePlus },
  ];

  const updateStoredStep = (nextStep, extra = {}) => {
    writeState(user.id, { step: nextStep, ...extra });
  };

  const completeFlow = (extra = {}) => {
    writeState(user.id, { step: steps.length - 1, completed: true, ...extra });
    setOpen(false);
    onComplete?.();
  };

  const skipFlow = () => {
    writeState(user.id, { step, skipped: true });
    setOpen(false);
  };

  async function handleProfileSave(event) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const data = await api.put('/profile', {
        name: profileForm.name,
        bio: user?.bio || '',
        avatar_url: profileForm.avatar_url,
        skills: profileForm.skills.split(',').map((item) => item.trim()).filter(Boolean),
      });
      setUser(data.user);
      setMessage('Profile saved.');
      const nextStep = 2;
      setStep(nextStep);
      updateStoredStep(nextStep);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(event) {
    const [file] = Array.from(event.target.files || []);
    if (!file) return;

    setSaving(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const data = await api.post('/media/upload', {
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        dataUrl,
      });
      setProfileForm((current) => ({ ...current, avatar_url: data.media?.url || '' }));
    } finally {
      setSaving(false);
      event.target.value = '';
    }
  }

  async function handleJoinCircle(circleId) {
    setSaving(true);
    try {
      await joinCircle(circleId);
      const nextStep = 3;
      setStep(nextStep);
      updateStoredStep(nextStep);
      navigate('/circles');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCircle(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await createCircle({
        name: circleForm.name,
        description: circleForm.description,
        is_private: false,
      });
      const nextStep = 3;
      setStep(nextStep);
      updateStoredStep(nextStep);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreatePost(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await createPost({
        content: postForm.content,
        image: '',
        circleId: postForm.circleId || null,
      });
      completeFlow();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 px-4 py-6 backdrop-blur-sm">
      <div className="surface-card max-h-[92vh] w-full max-w-4xl overflow-hidden">
        <div className="grid lg:grid-cols-[0.88fr_1.12fr]">
          <div className="bg-[rgb(var(--text))] px-6 py-6 text-white dark:bg-[rgb(var(--accent))]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-white/70">New here?</p>
              <button type="button" className="rounded-full p-2 text-white/75 transition hover:bg-white/10" onClick={skipFlow}>
                <X size={18} />
              </button>
            </div>
            <h2 className="mt-4 font-display text-4xl leading-tight">Welcome to SkillCircle.</h2>
            <p className="mt-4 text-sm leading-7 text-white/76">
              We will get you set up in a minute: shape your profile, find your people, and post your first small win.
            </p>

            <div className="mt-8 space-y-4">
              {steps.map((item, index) => {
                const Icon = item.icon;
                const active = index === step;
                const complete = index < step || (item.id === 'circles' && joinedCirclesCount > 0) || (item.id === 'post' && myPostsCount > 0);
                return (
                  <div key={item.id} className={`rounded-[24px] px-4 py-4 transition ${active ? 'bg-white/12' : 'bg-white/5'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${active ? 'bg-white text-slate-900' : 'bg-white/10 text-white'}`}>
                        {complete ? stepStatus(true) : <Icon size={18} />}
                      </div>
                      <div>
                        <p className="font-semibold">{item.label}</p>
                        <p className="text-sm text-white/70">Step {index + 1} of {steps.length}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="max-h-[92vh] overflow-y-auto px-6 py-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">Onboarding</p>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">You can skip this and come back later from your regular flow.</p>
              </div>
              <Button variant="ghost" onClick={skipFlow}>Skip</Button>
            </div>

            {step === 0 ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-3xl font-bold">Build momentum in public, without the noise.</h3>
                  <p className="mt-3 text-sm leading-7 text-[rgb(var(--muted))]">
                    Post small daily wins, join focused circles, and keep up with messages and notifications from one place.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    ['Post', 'Share quick progress updates instead of polished essays.'],
                    ['Circles', 'Find small communities that make your feed more relevant.'],
                    ['Chat', 'Keep conversations moving with live messages and typing updates.'],
                  ].map(([title, description]) => (
                    <div key={title} className="rounded-[24px] bg-[rgb(var(--bg-soft))] p-4">
                      <p className="font-semibold">{title}</p>
                      <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{description}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => {
                      const nextStep = 1;
                      setStep(nextStep);
                      updateStoredStep(nextStep);
                    }}
                  >
                    Start setup
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <form className="space-y-5" onSubmit={handleProfileSave}>
                <div className="flex items-center gap-4">
                  <Avatar user={{ ...user, avatar_url: profileForm.avatar_url, name: profileForm.name }} size="lg" />
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold">Avatar</span>
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <Input
                  name="onboarding_name"
                  label="Username"
                  value={profileForm.name}
                  onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                />
                <Input
                  name="onboarding_skills"
                  label="Skills"
                  placeholder="React, Product Design, TypeScript"
                  value={profileForm.skills}
                  onChange={(event) => setProfileForm((current) => ({ ...current, skills: event.target.value }))}
                />
                <p className="text-sm text-[rgb(var(--muted))]">{message}</p>
                <div className="flex justify-end">
                  <Button disabled={saving || !profileForm.name.trim()}>
                    {saving ? 'Saving...' : 'Save and continue'}
                  </Button>
                </div>
              </form>
            ) : null}

            {step === 2 ? (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {discoverCircles.map((circle) => (
                    <div key={circle.id} className="rounded-[24px] border bg-[rgb(var(--bg-soft))] p-4">
                      <p className="font-semibold">{circle.name}</p>
                      <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{circle.description}</p>
                      <Button type="button" className="mt-4 w-full" disabled={saving} onClick={() => handleJoinCircle(circle.id)}>
                        Join circle
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="rounded-[28px] border p-5">
                  <p className="text-lg font-bold">Or create one</p>
                  <form className="mt-4 space-y-4" onSubmit={handleCreateCircle}>
                    <Input
                      name="onboarding_circle_name"
                      label="Circle name"
                      value={circleForm.name}
                      onChange={(event) => setCircleForm((current) => ({ ...current, name: event.target.value }))}
                    />
                    <Textarea
                      name="onboarding_circle_description"
                      label="Description"
                      value={circleForm.description}
                      onChange={(event) => setCircleForm((current) => ({ ...current, description: event.target.value }))}
                    />
                    <div className="flex justify-end">
                      <Button disabled={saving || !circleForm.name.trim() || !circleForm.description.trim()}>
                        {saving ? 'Creating...' : 'Create and continue'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <form className="space-y-5" onSubmit={handleCreatePost}>
                <Textarea
                  name="onboarding_post"
                  label="Your first update"
                  maxLength={280}
                  placeholder="Today I finally understood one thing I had been avoiding..."
                  value={postForm.content}
                  onChange={(event) => setPostForm((current) => ({ ...current, content: event.target.value }))}
                />
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">Post to a circle</span>
                  <select
                    className="rounded-2xl border bg-[rgb(var(--bg-elevated))] px-4 py-3 text-sm"
                    value={postForm.circleId}
                    onChange={(event) => setPostForm((current) => ({ ...current, circleId: event.target.value }))}
                  >
                    <option value="">Global feed</option>
                    {circles.filter((circle) => circle.joined).map((circle) => (
                      <option key={circle.id} value={circle.id}>{circle.name}</option>
                    ))}
                  </select>
                </label>
                <div className="rounded-[24px] bg-[rgb(var(--bg-soft))] p-4 text-sm text-[rgb(var(--muted))]">
                  Tip: short and honest works best. One lesson, one win, or one next step is enough.
                </div>
                <div className="flex justify-end">
                  <Button disabled={saving || !postForm.content.trim()}>
                    {saving ? 'Publishing...' : 'Finish onboarding'}
                  </Button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
