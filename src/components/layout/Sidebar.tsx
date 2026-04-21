'use client';
// src/components/layout/Sidebar.tsx

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  Map,
  Compass,
  FileText,
  BookOpen,
  X,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface SidebarProps {
  open:    boolean;
  onClose: () => void;
}

const NAV = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard',  href: '/dashboard',       icon: LayoutDashboard },
      { label: 'Reports',    href: '/reports',          icon: TrendingUp      },
    ],
  },
  {
    section: 'Bookings',
    items: [
      { label: 'All Bookings',      href: '/bookings',         icon: FileText  },
      { label: 'Taxi Transfers',    href: '/bookings/taxi',    icon: Car       },
      { label: 'Tours',             href: '/bookings/tours',   icon: Map       },
      { label: 'Custom Planning',   href: '/bookings/custom',  icon: Compass   },
    ],
  },
  {
    section: 'Content',
    items: [
      { label: 'Blog Posts', href: '/blog', icon: BookOpen },
    ],
  },
];

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const content = (
    <div className="flex flex-col h-full" style={{ background: '#0D0D0D' }}>

      {/* ── Brand ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#5e17eb,#1800ad)' }}
          >
            TT
          </div>
          <div>
            <p className="text-white text-xs font-syne font-bold leading-none tracking-wide">
              TripTip
            </p>
            <p className="text-white/35 text-[9px] tracking-widest uppercase leading-none mt-0.5">
              Admin
            </p>
          </div>
        </div>
        {/* Mobile close */}
        <button
          onClick={onClose}
          className="lg:hidden p-1 text-white/40 hover:text-white transition-colors"
          aria-label="Close sidebar"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {NAV.map(group => (
          <div key={group.section} className="mb-5">
            <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-white/25 px-3 mb-2">
              {group.section}
            </p>
            {group.items.map(item => {
              const Icon   = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`sidebar-link ${active ? 'active' : ''}`}
                >
                  <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight size={12} className="opacity-50" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Bottom brand mark ──────────────────────────────── */}
      <div className="px-5 py-4 border-t border-white/[0.06]">
        <p className="text-white/15 text-[9px] tracking-widest uppercase">
          Sri Lankan TripTip
        </p>
        <p className="text-white/10 text-[9px] mt-0.5">
          admin.srilankantriptip.com
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[220px] flex-shrink-0 flex-col h-screen sticky top-0 border-r border-white/[0.04]">
        {content}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <aside className="relative w-[220px] h-full animate-slide-in">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
