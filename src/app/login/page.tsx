'use client';
// src/app/login/page.tsx
//
// FIX: useSearchParams() must be inside a child component wrapped with
// <Suspense> in Next.js 14+. Calling it directly in the page causes the
// "missing-suspense-with-csr-bailout" build error during static generation.

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams }     from 'next/navigation';
import { getSupabaseClient }              from '@/lib/supabase-client';

// ── Inner component — owns useSearchParams() ──────────────────
function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get('redirect') || '/dashboard';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [checking, setChecking] = useState(true);

  // Already logged in → forward immediately
  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(redirect);
      else           setChecking(false);
    });
  }, [redirect, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = getSupabaseClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Invalid email or password. Please try again.');
      setLoading(false);
      return;
    }

    router.replace(redirect);
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-[#F7F7F6] flex items-center justify-center">
        <div
          className="w-6 h-6 border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#5e17eb', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex">

      {/* ── Left brand panel ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 relative overflow-hidden">
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize:  '28px 28px',
          }}
        />
        {/* Ambient glow */}
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(94,23,235,0.18) 0%, transparent 65%)',
          }}
        />

        {/* Brand mark */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-8 h-8 flex items-center justify-center text-white text-xs font-black"
              style={{ background: 'linear-gradient(135deg,#5e17eb,#1800ad)' }}
            >
              TT
            </div>
            <span className="text-white font-syne font-bold tracking-wide text-sm">
              Sri Lankan TripTip
            </span>
          </div>
          <div
            className="h-px w-10 mt-3"
            style={{ background: 'linear-gradient(to right,#5e17eb,#1800ad)' }}
          />
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <p className="text-[10px] font-bold tracking-[0.35em] uppercase text-[#5e17eb] mb-4">
            Admin Panel
          </p>
          <h1
            className="font-syne font-black text-white leading-[1.0] tracking-tight mb-5"
            style={{ fontSize: 'clamp(36px,4vw,54px)' }}
          >
            Manage Every<br />
            <span
              style={{
                background: 'linear-gradient(135deg,#5e17eb,#1800ad)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Booking &amp; Journey.
            </span>
          </h1>
          <p className="text-white/40 text-sm font-light leading-relaxed max-w-xs">
            Bookings, quotes, payments, blog — all in one clean workspace
            designed for the TripTip team.
          </p>
        </div>

        {/* Footer note */}
        <div className="relative z-10">
          <p className="text-white/20 text-xs tracking-widest uppercase">
            Restricted Access — Authorised Personnel Only
          </p>
        </div>
      </div>

      {/* ── Right login panel ────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F7F7F6]">

        {/* Mobile brand */}
        <div className="lg:hidden mb-10 text-center">
          <div
            className="w-10 h-10 flex items-center justify-center text-white text-sm font-black mx-auto mb-3"
            style={{ background: 'linear-gradient(135deg,#5e17eb,#1800ad)' }}
          >
            TT
          </div>
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#5e17eb]">
            Sri Lankan TripTip Admin
          </p>
        </div>

        <div className="w-full max-w-[360px]">

          {/* Header */}
          <div className="mb-8">
            <div
              className="w-8 h-[2px] mb-5"
              style={{ background: 'linear-gradient(to right,#5e17eb,#1800ad)' }}
            />
            <h2 className="font-syne font-black text-2xl text-[#111] tracking-tight mb-1">
              Sign in
            </h2>
            <p className="text-sm text-[#888] font-light">
              Enter your admin credentials to continue.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">

            {error && (
              <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold tracking-[0.18em] uppercase text-[#888] mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="admin-input"
                placeholder="admin@srilankantriptip.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-[0.18em] uppercase text-[#888] mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="admin-input"
                placeholder="••••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white text-sm font-bold tracking-[0.12em] uppercase transition-opacity disabled:opacity-60 mt-2"
              style={{ background: 'linear-gradient(135deg,#5e17eb,#1800ad)' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-[#BBBBBB]">
            Access restricted to authorised staff only.
            <br />
            Contact your system administrator for access.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Page — wraps LoginForm in Suspense ────────────────────────
// This satisfies Next.js 14+ static generation requirement.
// The fallback is a neutral loading screen — never a flash of
// unstyled content because LoginForm starts in "checking" state anyway.
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F7F6] flex items-center justify-center">
          <div
            className="w-6 h-6 border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#5e17eb', borderTopColor: 'transparent' }}
          />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}