import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { Card } from '../components/Card.jsx';
import { Input } from '../components/Input.jsx';
import { useAuthStore } from '../store/authStore.js';

const demoAccounts = [
  {
    email: import.meta.env.VITE_DEMO_USER_1_EMAIL || 'maya@skillcircle.dev',
    password: import.meta.env.VITE_DEMO_USER_1_PASSWORD || 'password123',
  },
  {
    email: import.meta.env.VITE_DEMO_USER_2_EMAIL || 'aarav@skillcircle.dev',
    password: import.meta.env.VITE_DEMO_USER_2_PASSWORD || 'password123',
  },
];

export function AuthPage() {
  const navigate = useNavigate();
  const authenticate = useAuthStore((state) => state.authenticate);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  async function handleSubmit(event) {
    event.preventDefault();
    await authenticate(mode, form);
    navigate('/');
  }

  return (
    <div className="min-h-screen px-4 py-6 lg:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1480px] gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative overflow-hidden rounded-[36px] bg-[rgb(var(--text))] px-8 py-10 text-white shadow-panel sm:px-12 sm:py-12">
          <div className="absolute inset-0 bg-grid bg-[size:22px_22px] opacity-20" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur">
                <Sparkles size={14} />
                Built for disciplined learners
              </div>
              <h1 className="max-w-xl font-display text-5xl leading-tight sm:text-6xl">
                Progress looks better when it has a circle around it.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-8 text-white/72">
                SkillCircle is where focused people post daily learning wins, join high-signal communities, and turn consistency into something visible.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                ['Daily updates', 'Track progress with short, thoughtful logs.'],
                ['Focused circles', 'Communities designed for momentum, not noise.'],
                ['Visible growth', 'A profile that actually reflects what you are learning.'],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <p className="mb-2 font-semibold">{title}</p>
                  <p className="text-sm leading-6 text-white/70">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Card className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[rgb(var(--muted))]">Welcome</p>
            <h2 className="mt-3 text-3xl font-bold">
              {mode === 'login' ? 'Sign in to your momentum.' : 'Create your SkillCircle account.'}
            </h2>
            <p className="mt-2 muted-copy">
              {mode === 'login'
                ? 'Use the seeded demo users or create a fresh account.'
                : 'Start with a clean profile and publish your first learning update.'}
            </p>

            <div className="mt-6 grid grid-cols-2 rounded-2xl bg-[rgb(var(--bg-soft))] p-1">
              <button
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${mode === 'login' ? 'bg-[rgb(var(--bg-elevated))] shadow-sm' : 'text-[rgb(var(--muted))]'}`}
                onClick={() => setMode('login')}
              >
                Login
              </button>
              <button
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${mode === 'signup' ? 'bg-[rgb(var(--bg-elevated))] shadow-sm' : 'text-[rgb(var(--muted))]'}`}
                onClick={() => setMode('signup')}
              >
                Signup
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {mode === 'signup' ? (
                <Input
                  name="name"
                  label="Name"
                  placeholder="Rina Ahmed"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              ) : null}
              <Input
                name="email"
                type="email"
                autoComplete="email"
                label="Email"
                placeholder="maya@skillcircle.dev"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
              />
              <Input
                name="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                label="Password"
                type="password"
                placeholder="password123"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
              {error ? <p className="text-sm font-medium text-rose-500">{error}</p> : null}
              <Button className="w-full justify-center" disabled={loading}>
                {loading ? 'Please wait...' : mode === 'login' ? 'Enter SkillCircle' : 'Create account'}
                <ArrowRight size={16} />
              </Button>
            </form>

            <div className="mt-6 rounded-[24px] bg-[rgb(var(--bg-soft))] p-4">
              <p className="text-sm font-semibold">Demo credentials</p>
              {demoAccounts.map((account, index) => (
                <p key={account.email} className={`${index === 0 ? 'mt-2' : 'mt-1'} text-sm text-[rgb(var(--muted))]`}>
                  {account.email} / {account.password}
                </p>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
