'use client';
// src/components/layout/TopBar.tsx

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Bell, LogOut, User, ChevronDown } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase-client';

interface TopBarProps {
  onMenuOpen:   () => void;
  userEmail:    string;
  pageTitle?:   string;
  newBookings?: number;
}

export default function TopBar({
  onMenuOpen,
  userEmail,
  pageTitle,
  newBookings = 0,
}: TopBarProps) {
  const router       = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const initials = userEmail.slice(0, 2).toUpperCase();

  return (
    <header className="h-14 bg-white border-b border-[#E8E4DF] flex items-center justify-between px-5 flex-shrink-0">

      {/* Left */}
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuOpen}
          className="lg:hidden p-1.5 text-[#888] hover:text-[#111] transition-colors"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>

        {pageTitle && (
          <h1 className="font-syne font-bold text-[15px] text-[#111] tracking-tight hidden sm:block">
            {pageTitle}
          </h1>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">

        {/* New bookings bell */}
        {newBookings > 0 && (
          <button className="relative p-2 text-[#888] hover:text-[#5e17eb] transition-colors">
            <Bell size={17} />
            <span
              className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center text-white text-[9px] font-bold"
              style={{ background: '#5e17eb' }}
            >
              {newBookings > 9 ? '9+' : newBookings}
            </span>
          </button>
        )}

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#F4F4F4] transition-colors"
          >
            <div
              className="w-6 h-6 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#5e17eb,#1800ad)' }}
            >
              {initials}
            </div>
            <span className="text-xs font-medium text-[#444] hidden sm:block max-w-[160px] truncate">
              {userEmail}
            </span>
            <ChevronDown size={13} className="text-[#888]" />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
              <div
                className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#E8E4DF] z-40 shadow-dropdown animate-fade-in"
              >
                <div className="px-4 py-3 border-b border-[#F0EDE9]">
                  <p className="text-[11px] text-[#888] leading-none mb-1">Signed in as</p>
                  <p className="text-xs font-semibold text-[#111] truncate">{userEmail}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[#DC2626] hover:bg-red-50 transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
