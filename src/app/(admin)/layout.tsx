'use client';
// src/app/(admin)/layout.tsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopBar  from '@/components/layout/TopBar';
import { getSupabaseClient } from '@/lib/supabase-client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router        = useRouter();
  const [userEmail,   setUserEmail]   = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ready,       setReady]       = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace('/login'); return; }
      setUserEmail(data.user.email ?? '');
      setReady(true);
    });
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#F7F7F6] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#5e17eb] border-t-transparent animate-spin" />
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
