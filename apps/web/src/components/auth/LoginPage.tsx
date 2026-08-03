import { useState, type FormEvent } from 'react';
import {
  Activity,
  Bot,
  CheckCircle2,
  Cpu,
  LifeBuoy,
  Lock,
  LogIn,
  Mail,
  User,
  UserPlus,
} from 'lucide-react';
import { apiFetch } from '../../lib/api';
import type { AuthUser } from '../../lib/types';

type AuthMode = 'login' | 'signup';

const features = [
  {
    icon: Bot,
    label: 'AI-Powered Auto-Reply',
    desc: 'Groq AI automatically handles common requests',
  },
  {
    icon: Activity,
    label: 'Real-time Dashboard',
    desc: 'Live metrics and team performance at a glance',
  },
  {
    icon: Cpu,
    label: 'Smart Categorization',
    desc: 'AI classifies and prioritizes tickets instantly',
  },
  {
    icon: CheckCircle2,
    label: 'Email Integration',
    desc: 'Full inbound/outbound email threading via Resend',
  },
];

type Props = {
  onLogin: (user: AuthUser) => void;
};

export function LoginPage({ onLogin }: Props) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const body = mode === 'signup' ? { name, email, password } : { email, password };
    const res = await apiFetch(`/api/auth/${mode}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });

    const data = (await res.json().catch(() => ({}))) as { user?: AuthUser; error?: string };
    setIsSubmitting(false);

    if (!res.ok || !data.user) {
      setError(data.error ?? 'Authentication failed.');
      return;
    }

    onLogin(data.user);
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#f1f5f9' }}>
      {/* Left: branding panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-10"
        style={{ background: 'linear-gradient(160deg, #0f1117 0%, #1a1d27 60%, #1e2235 100%)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="flex size-10 items-center justify-center rounded-xl shadow-lg"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            <LifeBuoy className="size-5 text-white" />
          </div>
          <div>
            <p
              className="text-lg font-bold text-white"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              AI Ticketing
            </p>
            <p className="text-xs" style={{ color: '#475569' }}>
              Support Intelligence Platform
            </p>
          </div>
        </div>

        {/* Hero */}
        <div className="space-y-6">
          <div>
            <h2
              className="text-4xl font-bold text-white leading-tight"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Support powered by
              <span
                className="block"
                style={{
                  background: 'linear-gradient(90deg,#6366f1,#a78bfa)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                artificial intelligence
              </span>
            </h2>
            <p className="mt-4 text-base leading-relaxed" style={{ color: '#94a3b8' }}>
              Resolve customer issues faster with AI-driven categorization, automatic replies, and
              smart escalation.
            </p>
          </div>

          <div className="space-y-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.label} className="flex items-start gap-3">
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                    style={{
                      background: 'rgba(99,102,241,0.15)',
                      border: '1px solid rgba(99,102,241,0.3)',
                    }}
                  >
                    <Icon className="size-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{f.label}</p>
                    <p className="text-xs" style={{ color: '#64748b' }}>
                      {f.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs" style={{ color: '#334155' }}>
          © 2025 AI Ticketing — All rights reserved.
        </p>
      </div>

      {/* Right: auth form */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-scale-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div
              className="flex size-9 items-center justify-center rounded-xl"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              <LifeBuoy className="size-5 text-white" />
            </div>
            <p
              className="text-base font-bold text-slate-900"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              AI Ticketing
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
            <h1
              className="text-2xl font-bold text-slate-900 mb-1"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {mode === 'login' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-sm text-slate-500 mb-6">
              {mode === 'login'
                ? 'Sign in to your support workspace'
                : 'Get started with AI-powered support'}
            </p>

            {/* Mode toggle */}
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 mb-6">
              {(['login', 'signup'] as AuthMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError('');
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition cursor-pointer ${mode === m
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  {m === 'login' ? (
                    <LogIn className="size-3.5" />
                  ) : (
                    <UserPlus className="size-3.5" />
                  )}
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} data-testid="auth-form" className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="name"
                      required
                      type="text"
                      autoComplete="name"
                      placeholder="John Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    required
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    required
                    type="password"
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 cursor-pointer"
                style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}
              >
                {mode === 'login' ? <LogIn className="size-4" /> : <UserPlus className="size-4" />}
                {isSubmitting ? 'Working...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {/* Demo credentials hint */}
            <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-600 mb-1.5">Demo accounts</p>
              <div className="space-y-0.5 text-xs text-slate-500">
                <p>
                  <span className="font-mono text-slate-700">rohitsingh971451@gmail.com</span> — Admin
                </p>
                <p>
                  <span className="font-mono text-slate-700">agent@aiticketing.local</span> — Agent
                </p>
                <p>
                  <span className="font-mono text-slate-700">customer@aiticketing.local</span> —
                  Customer
                </p>
                <p className="mt-1 text-slate-400">
                  Password: <span className="font-mono">Password123!</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
