'use client';
// src/app/(admin)/bookings/taxi/page.tsx

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { PageHeader, Badge, FilterBar, Pagination, EmptyState, PageLoader, NewDot } from '@/components/ui';
import { getSupabaseClient } from '@/lib/supabase-client';
import { formatDate, formatRelativeTime, formatCurrency } from '@/lib/utils';
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_COLOR, type BookingStatus, type TaxiBooking } from '@/types';

const PAGE_SIZE = 20;

export default function TaxiBookingsPage() {
  const [rows,    setRows]    = useState<TaxiBooking[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const sb = getSupabaseClient();
    let q = sb
      .from('taxi_bookings')
      .select('*', { count: 'exact' });
    if (status) q = q.eq('status', status);
    if (search) q = q.or(
      `booking_reference.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%`
    );
    const { data, count } = await q
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    setRows((data as TaxiBooking[]) || []);
    setTotal(count || 0);
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => { setPage(1); }, [search, status]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Taxi Transfers"
        subtitle={`${total} transfer bookings`}
      />
      <FilterBar>
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search reference, name, email…"
            className="admin-input pl-8 w-64 text-xs"
          />
        </div>
        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="admin-input admin-select w-44 text-xs"
        >
          <option value="">All Statuses</option>
          {Object.entries(BOOKING_STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </FilterBar>

      <div className="bg-white">
        {loading ? <PageLoader /> : rows.length === 0 ? <EmptyState message="No taxi bookings found." /> : (
          <div className="overflow-x-auto">
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th className="text-left">Reference</th>
                  <th className="text-left">Customer</th>
                  <th className="text-left">Pickup → Destination</th>
                  <th className="text-left">Pickup Date</th>
                  <th className="text-left">Received</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Quote</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {!r.viewed_at && <NewDot />}
                        <Link href={`/bookings/taxi/${r.id}`}
                          className="font-mono text-[11px] font-bold text-[#5e17eb] hover:underline">
                          {r.booking_reference}
                        </Link>
                      </div>
                    </td>
                    <td>
                      <p className="text-xs font-semibold text-[#111]">{r.full_name}</p>
                      <p className="text-[10px] text-[#888]">{r.email}</p>
                    </td>
                    <td className="max-w-[200px]">
                      <p className="text-xs text-[#555] truncate">{r.pickup_location}</p>
                      <p className="text-[10px] text-[#888] truncate">→ {r.destination}</p>
                    </td>
                    <td className="text-xs text-[#555]">{formatDate(r.pickup_datetime)}</td>
                    <td className="text-xs text-[#888]">{formatRelativeTime(r.created_at)}</td>
                    <td>
                      <Badge
                        label={BOOKING_STATUS_LABEL[r.status] || r.status}
                        className={BOOKING_STATUS_COLOR[r.status] || ''}
                      />
                    </td>
                    <td className="text-xs text-[#555]">
                      {r.latest_quote_amount
                        ? formatCurrency(r.latest_quote_amount, r.latest_quote_currency || 'LKR')
                        : <span className="text-[#BBB]">—</span>}
                    </td>
                    <td className="text-right">
                      <Link href={`/bookings/taxi/${r.id}`}
                        className="text-[10px] font-semibold text-[#5e17eb] hover:underline">
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>
    </div>
  );
}
