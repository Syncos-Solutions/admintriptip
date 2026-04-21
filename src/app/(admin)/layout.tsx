'use client';
// src/app/(admin)/layout.tsx
// Client shell for the admin panel.
// Verifies the user session client-side; middleware handles server-side protection.

import { useState, useEffect } from 'react';
import { useRouter }           from 'next/navigation';
import Sidebar                 from '@/components/layout/Sidebar';
import TopBar                  from '@/components/layout/TopBar';
import { getSupabaseClient }   from '@/lib/supabase-client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router                        = useRouter();
  const [userEmail, setUserEmail]     = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ready, setReady]             = useState(false);

  useEffect(() => {
    let cancelled = false;

    getSupabaseClient()
      .auth.getUser()
      .then(({ data, error }) => {
        if (cancelled) return;

        if (error || !data.user) {
          // Not authenticated — middleware should have caught this,
          // but handle client-side too for defence in depth.
          router.replace('/login');
          return;
        }

        setUserEmail(data.user.email ?? '');
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) router.replace('/login');
      });

    return () => { cancelled = true; };
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#F7F7F6] flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 border-2 border-[#5e17eb] border-t-transparent animate-spin" />
        <p className="text-xs text-[#888]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F7F6]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          onMenuOpen={() => setSidebarOpen(true)}
          userEmail={userEmail}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}