'use client';
// src/app/(admin)/bookings/page.tsx

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Filter } from 'lucide-react';
import {
  PageHeader, Badge, FilterBar, Pagination,
  EmptyState, PageLoader, NewDot,
} from '@/components/ui';
import { getSupabaseClient } from '@/lib/supabase-client';
import {
  formatDate, formatRelativeTime, formatCurrency,
  bookingTypeLabel, bookingTypeBadgeClass, getCustomerName,
} from '@/lib/utils';
import {
  BOOKING_STATUS_LABEL, BOOKING_STATUS_COLOR,
  type BookingStatus, type AnyBookingRow,
} from '@/types';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: '',                 label: 'All Statuses'       },
  { value: 'new',              label: 'New'                },
  { value: 'under_review',     label: 'Under Review'       },
  { value: 'quote_sent',       label: 'Quote Sent'         },
  { value: 'quote_accepted',   label: 'Quote Accepted'     },
  { value: 'payment_pending',  label: 'Payment Pending'    },
  { value: 'partially_paid',   label: 'Partially Paid'     },
  { value: 'paid',             label: 'Paid'               },
  { value: 'completed',        label: 'Completed'          },
  { value: 'cancelled',        label: 'Cancelled'          },
];

export default function AllBookingsPage() {
  const [rows,    setRows]    = useState<AnyBookingRow[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);

  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatus]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const sb = getSupabaseClient();

    // Fetch all three tables in parallel with filters
    const tables = [
      { table: 'taxi_bookings',         type: 'taxi',   nameCol: 'full_name',  dateCol: 'pickup_datetime'      },
      { table: 'tour_bookings',         type: 'tour',   nameCol: 'full_name',  dateCol: 'preferred_start_date' },
      { table: 'custom_tour_bookings',  type: 'custom', nameCol: null,         dateCol: 'start_date'           },
    ];

    const promises = tables
      .filter(t => !typeFilter || t.type === typeFilter)
      .map(({ table, type, nameCol, dateCol }) => {
        let q = sb.from(table).select(
          `id, booking_reference, created_at, status, email, viewed_at, latest_quote_amount, latest_quote_currency, payment_status, total_paid_amount,
          ${nameCol ? nameCol + ',' : 'first_name, last_name,'}
          ${dateCol}`
        );
        if (statusFilter) q = q.eq('status', statusFilter);
        return q.order('created_at', { ascending: false }).then(({ data }) =>
          (data || []).map((b: Record<string, unknown>) => ({
            id:               b.id                    as string,
            booking_reference:b.booking_reference     as string,
            type:             type                    as 'taxi'|'tour'|'custom',
            customer_name:    nameCol ? (b[nameCol] as string) : `${b.first_name} ${b.last_name}`,
            customer_email:   b.email                 as string,
            created_at:       b.created_at            as string,
            travel_date:      b[dateCol]              as string | null,
            status:           b.status                as BookingStatus,
            quote_amount:     b.latest_quote_amount   as number | null,
            quote_currency:   b.latest_quote_currency as string | null,
            payment_status:   b.payment_status        as string | null,
            total_paid:       b.total_paid_amount     as number | null,
            is_new:           !b.viewed_at,
          }))
        );
      });

    const results = await Promise.all(promises);
    let merged: AnyBookingRow[] = results.flat();

    // Client-side search (reference or name/email)
    if (search.trim()) {
      const q = search.toLowerCase();
      merged = merged.filter(r =>
        r.booking_reference?.toLowerCase().includes(q) ||
        r.customer_name?.toLowerCase().includes(q) ||
        r.customer_email?.toLowerCase().includes(q)
      );
    }

    // Sort by created_at desc
    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setTotal(merged.length);
    setRows(merged.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
    setLoading(false);
  }, [page, search, typeFilter, statusFilter]);

  useEffect(() => { setPage(1); }, [search, typeFilter, statusFilter]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="All Bookings"
        subtitle={`${total} total bookings across all types`}
      />

      <FilterBar>
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search reference, name, email…"
            className="admin-input pl-8 w-64 text-xs"
          />
        </div>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="admin-input admin-select w-40 text-xs"
        >
          <option value="">All Types</option>
          <option value="taxi">Taxi</option>
          <option value="tour">Tours</option>
          <option value="custom">Custom</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatus(e.target.value)}
          className="admin-input admin-select w-44 text-xs"
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {(search || typeFilter || statusFilter) && (
          <button
            onClick={() => { setSearch(''); setTypeFilter(''); setStatus(''); }}
            className="text-xs text-[#5e17eb] hover:underline"
          >
            Clear filters
          </button>
        )}
      </FilterBar>

      {/* Table */}
      <div className="bg-white border-b border-[#E8E4DF]">
        {loading ? (
          <PageLoader />
        ) : rows.length === 0 ? (
          <EmptyState message="No bookings match your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th className="text-left">Reference</th>
                  <th className="text-left">Type</th>
                  <th className="text-left">Customer</th>
                  <th className="text-left">Travel Date</th>
                  <th className="text-left">Received</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Quote / Paid</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {(r as AnyBookingRow & { is_new?: boolean }).is_new && <NewDot />}
                        <Link
                          href={`/bookings/${r.type}/${r.id}`}
                          className="font-mono text-[11px] font-bold text-[#5e17eb] hover:underline tracking-tight"
                        >
                          {r.booking_reference}
                        </Link>
                      </div>
                    </td>
                    <td>
                      <Badge label={bookingTypeLabel(r.type)} className={bookingTypeBadgeClass(r.type)} />
                    </td>
                    <td>
                      <p className="text-xs font-semibold text-[#111]">{r.customer_name}</p>
                      <p className="text-[10px] text-[#888]">{r.customer_email}</p>
                    </td>
                    <td className="text-xs text-[#555]">{formatDate(r.travel_date)}</td>
                    <td className="text-xs text-[#888]">{formatRelativeTime(r.created_at)}</td>
                    <td>
                      <Badge
                        label={BOOKING_STATUS_LABEL[r.status] || r.status}
                        className={BOOKING_STATUS_COLOR[r.status] || ''}
                      />
                    </td>
                    <td>
                      {r.quote_amount ? (
                        <p className="text-xs font-semibold text-[#111]">
                          {formatCurrency(r.quote_amount, r.quote_currency || 'LKR')}
                        </p>
                      ) : (
                        <span className="text-[10px] text-[#BBB]">—</span>
                      )}
                      {r.total_paid && r.total_paid > 0 ? (
                        <p className="text-[10px] text-emerald-600 font-semibold">
                          Paid {formatCurrency(r.total_paid, r.quote_currency || 'LKR')}
                        </p>
                      ) : null}
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/bookings/${r.type}/${r.id}`}
                        className="text-[10px] font-semibold text-[#5e17eb] hover:underline whitespace-nowrap"
                      >
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
