'use client';
// src/app/(admin)/dashboard/page.tsx

import { useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Car, Map, Compass, CreditCard, TrendingUp,
  Calendar, FileText, Users, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { PageHeader, StatCard, Card, SectionLabel, Badge, PageLoader } from '@/components/ui';
import { getSupabaseClient } from '@/lib/supabase-client';
import {
  formatCurrency, formatRelativeTime,
  bookingTypeLabel, bookingTypeBadgeClass,
  getCustomerName,
} from '@/lib/utils';
import { BOOKING_STATUS_COLOR, BOOKING_STATUS_LABEL, type BookingStatus } from '@/types';

// ── Custom tooltip ─────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: Record<string, unknown>) {
  if (!active || !payload) return null;
  const items = payload as { name: string; value: number; color: string }[];
  return (
    <div className="bg-[#111] px-4 py-3 text-xs text-white min-w-[140px]">
      <p className="font-bold mb-2 text-white/60 text-[10px] uppercase tracking-wider">{label as string}</p>
      {items.map(p => (
        <div key={p.name} className="flex justify-between gap-4 mb-1">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

interface DashStats {
  total:       number;
  taxi:        number;
  tour:        number;
  custom:      number;
  newCount:    number;
  revenueTotal: number;
  revenueMonth: number;
  paidCount:   number;
  monthBookings: number;
}

export default function DashboardPage() {
  const [stats,       setStats]       = useState<DashStats | null>(null);
  const [chartData,   setChartData]   = useState<Record<string, number | string>[]>([]);
  const [recentBooks, setRecentBooks] = useState<Record<string, unknown>[]>([]);
  const [recentPays,  setRecentPays]  = useState<Record<string, unknown>[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [period,      setPeriod]      = useState<'7d'|'30d'|'90d'>('30d');

  const load = useCallback(async () => {
    setLoading(true);
    const sb = getSupabaseClient();
    const now = new Date();
    const fromDate = new Date(now);
    if (period === '7d')  fromDate.setDate(fromDate.getDate() - 7);
    if (period === '30d') fromDate.setDate(fromDate.getDate() - 30);
    if (period === '90d') fromDate.setDate(fromDate.getDate() - 90);

    // Fetch all three booking tables in parallel
    const [
      { data: taxi   },
      { data: tour   },
      { data: custom },
      { data: pays   },
    ] = await Promise.all([
      sb.from('taxi_bookings').select('id,created_at,status,total_paid_amount').order('created_at', { ascending: false }),
      sb.from('tour_bookings').select('id,created_at,status,total_paid_amount').order('created_at', { ascending: false }),
      sb.from('custom_tour_bookings').select('id,created_at,status,total_paid_amount').order('created_at', { ascending: false }),
      sb.from('booking_payments').select('id,created_at,amount,currency,status,paid_at').eq('status','paid'),
    ]);

    const allBookings = [
      ...(taxi   || []).map((b: Record<string, unknown>) => ({ ...b, type: 'taxi'   })),
      ...(tour   || []).map((b: Record<string, unknown>) => ({ ...b, type: 'tour'   })),
      ...(custom || []).map((b: Record<string, unknown>) => ({ ...b, type: 'custom' })),
    ];

    const totalRevenue = (pays || []).reduce((sum: number, p: Record<string, unknown>) =>
      p.currency === 'LKR' ? sum + Number(p.amount) : sum + Number(p.amount) * 320, 0);

    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
    const monthRevenue = (pays || [])
      .filter((p: Record<string, unknown>) => new Date(p.paid_at as string) > monthAgo)
      .reduce((sum: number, p: Record<string, unknown>) =>
        p.currency === 'LKR' ? sum + Number(p.amount) : sum + Number(p.amount) * 320, 0);

    setStats({
      total:         allBookings.length,
      taxi:          (taxi   || []).length,
      tour:          (tour   || []).length,
      custom:        (custom || []).length,
      newCount:      allBookings.filter((b: Record<string, unknown>) => b.status === 'new').length,
      revenueTotal:  totalRevenue,
      revenueMonth:  monthRevenue,
      paidCount:     (pays || []).length,
      monthBookings: allBookings.filter((b: Record<string, unknown>) =>
        new Date(b.created_at as string) > monthAgo).length,
    });

    // Build chart data (last 7/30/90 days bucketed by day/week)
    const buckets: Record<string, { taxi:number; tour:number; custom:number; revenue:number }> = {};
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = period === '90d'
        ? `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleDateString('en-US',{month:'short'})}`
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!buckets[key]) buckets[key] = { taxi:0, tour:0, custom:0, revenue:0 };
    }

    allBookings.forEach((b: Record<string, unknown>) => {
      const d = new Date(b.created_at as string);
      if (d < fromDate) return;
      const key = period === '90d'
        ? `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleDateString('en-US',{month:'short'})}`
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (buckets[key]) buckets[key][b.type as 'taxi'|'tour'|'custom']++;
    });

    (pays || []).forEach((p: Record<string, unknown>) => {
      if (!p.paid_at) return;
      const d = new Date(p.paid_at as string);
      if (d < fromDate) return;
      const key = period === '90d'
        ? `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleDateString('en-US',{month:'short'})}`
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (buckets[key]) buckets[key].revenue += Number(p.amount);
    });

    const chart = Object.entries(buckets).map(([label, v]) => ({
      label, ...v, total: v.taxi + v.tour + v.custom,
    }));
    setChartData(chart);

    // Recent bookings (across all types — latest 8)
    const recent = allBookings
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
        new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime())
      .slice(0, 8);
    setRecentBooks(recent);

    setRecentPays((pays || []).slice(0, 5));
    setLoading(false);
  }, [period]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Overview of all bookings and revenue" />
        <PageLoader />
      </div>
    );
  }

  const s = stats!;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of all bookings and revenue"
        actions={
          <div className="flex gap-1">
            {(['7d','30d','90d'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                  period === p
                    ? 'text-white'
                    : 'bg-white border border-[#E8E4DF] text-[#888] hover:text-[#111]'
                }`}
                style={period === p ? { background: 'linear-gradient(135deg,#5e17eb,#1800ad)' } : {}}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        }
      />

      <div className="p-6 space-y-6">

        {/* ── KPI row ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Bookings"
            value={s.total}
            sub={`${s.monthBookings} this month`}
            accent icon={<FileText size={16} />}
          />
          <StatCard
            label="Revenue (LKR)"
            value={formatCurrency(s.revenueTotal, 'LKR').replace('LKR','Rs.')}
            sub={`Rs.${(s.revenueMonth/1000).toFixed(0)}K this month`}
            accent icon={<TrendingUp size={16} />}
          />
          <StatCard
            label="New Bookings"
            value={s.newCount}
            sub="Awaiting review"
            icon={<Users size={16} />}
          />
          <StatCard
            label="Payments Received"
            value={s.paidCount}
            sub={`${s.taxi}T · ${s.tour}To · ${s.custom}C`}
            icon={<CreditCard size={16} />}
          />
        </div>

        {/* ── Booking type row ──────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center bg-sky-50"><Car size={16} className="text-sky-600" /></div>
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#888]">Taxi</p>
                <p className="font-syne font-black text-xl">{s.taxi}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center bg-violet-50"><Map size={16} className="text-violet-600" /></div>
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#888]">Tours</p>
                <p className="font-syne font-black text-xl">{s.tour}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center bg-amber-50"><Compass size={16} className="text-amber-600" /></div>
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#888]">Custom</p>
                <p className="font-syne font-black text-xl">{s.custom}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Charts ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* Bookings over time */}
          <Card>
            <SectionLabel>Bookings Over Time</SectionLabel>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ left:-20, bottom:0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE9" />
                <XAxis dataKey="label" tick={{ fontSize:10, fill:'#888' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize:10, fill:'#888' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize:11 }} />
                <Bar dataKey="taxi"   name="Taxi"   fill="#0EA5E9" maxBarSize={24} />
                <Bar dataKey="tour"   name="Tour"   fill="#7C3AED" maxBarSize={24} />
                <Bar dataKey="custom" name="Custom" fill="#D97706" maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Revenue over time */}
          <Card>
            <SectionLabel>Revenue (LKR) Over Time</SectionLabel>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ left:-10, bottom:0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#5e17eb" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#5e17eb" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE9" />
                <XAxis dataKey="label" tick={{ fontSize:10, fill:'#888' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize:10, fill:'#888' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="revenue" name="Revenue (LKR)"
                  stroke="#5e17eb" strokeWidth={2}
                  fill="url(#revGrad)" dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* ── Recent activity ───────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* Recent bookings */}
          <Card padding={false}>
            <div className="px-5 py-4 border-b border-[#F0EDE9] flex justify-between items-center">
              <SectionLabel>Recent Bookings</SectionLabel>
              <Link href="/bookings" className="text-xs text-[#5e17eb] hover:underline flex items-center gap-1">
                View all <ArrowRight size={11} />
              </Link>
            </div>
            <table className="admin-table w-full">
              <tbody>
                {recentBooks.length === 0 && (
                  <tr><td colSpan={4} className="text-center text-xs text-[#888] py-8">No bookings yet.</td></tr>
                )}
                {recentBooks.map((b: Record<string, unknown>) => (
                  <tr key={`${b.type}-${b.id}`}>
                    <td>
                      <div className="flex items-center gap-2">
                        {!b.viewed_at && (
                          <span className="w-1.5 h-1.5 bg-[#5e17eb] pulse-ring flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-xs font-semibold text-[#111]">
                            {getCustomerName(b) || '—'}
                          </p>
                          <p className="text-[10px] text-[#888]">
                            {formatRelativeTime(b.created_at as string)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge
                        label={bookingTypeLabel(b.type as 'taxi'|'tour'|'custom')}
                        className={bookingTypeBadgeClass(b.type as 'taxi'|'tour'|'custom')}
                      />
                    </td>
                    <td>
                      <Badge
                        label={BOOKING_STATUS_LABEL[b.status as BookingStatus] || String(b.status)}
                        className={BOOKING_STATUS_COLOR[b.status as BookingStatus] || ''}
                      />
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/bookings/${b.type}/${b.id}`}
                        className="text-[10px] text-[#5e17eb] hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Recent payments */}
          <Card padding={false}>
            <div className="px-5 py-4 border-b border-[#F0EDE9]">
              <SectionLabel>Recent Payments</SectionLabel>
            </div>
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th className="text-left">Customer</th>
                  <th className="text-left">Amount</th>
                  <th className="text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPays.length === 0 && (
                  <tr><td colSpan={3} className="text-center text-xs text-[#888] py-8">No payments yet.</td></tr>
                )}
                {recentPays.map((p: Record<string, unknown>) => (
                  <tr key={p.id as string}>
                    <td>
                      <p className="text-xs font-semibold text-[#111]">{p.customer_name as string}</p>
                      <p className="text-[10px] text-[#888]">{p.customer_email as string}</p>
                    </td>
                    <td>
                      <p className="text-xs font-semibold">
                        {formatCurrency(Number(p.amount), String(p.currency))}
                      </p>
                    </td>
                    <td>
                      <Badge
                        label="Paid"
                        className="bg-emerald-50 text-emerald-700 border border-emerald-200"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
