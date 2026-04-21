'use client';
// src/app/(admin)/bookings/taxi/[id]/page.tsx

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter }              from 'next/navigation';
import Link                                  from 'next/link';
import { ArrowLeft, Send, CreditCard, Save, CheckCircle } from 'lucide-react';
import {
  PageHeader, Card, SectionLabel, Badge, Button,
  Select, Textarea, Modal, Input, PageLoader,
} from '@/components/ui';
import { getSupabaseClient } from '@/lib/supabase-client';
import { formatDate, formatDateTime, formatRelativeTime, formatCurrency, cn } from '@/lib/utils';
import {
  BOOKING_STATUS_LABEL, BOOKING_STATUS_COLOR, BOOKING_STATUS_FLOW,
  QUOTE_STATUS_COLOR, PAYMENT_STATUS_COLOR,
  type TaxiBooking, type BookingQuote, type BookingPayment, type BookingStatus,
} from '@/types';

export default function TaxiDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [booking,   setBooking]   = useState<TaxiBooking | null>(null);
  const [quotes,    setQuotes]    = useState<BookingQuote[]>([]);
  const [payments,  setPayments]  = useState<BookingPayment[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [saveError, setSaveError] = useState('');
  const [status,    setStatus]    = useState('');
  const [notes,     setNotes]     = useState('');

  const [quoteModal,    setQuoteModal]    = useState(false);
  const [quoteCurrency, setQCurrency]    = useState('LKR');
  const [quoteAmount,   setQAmount]      = useState('');
  const [quoteNotes,    setQNotes]       = useState('');
  const [sendingQuote,  setSendingQuote] = useState(false);
  const [quoteError,    setQuoteError]   = useState('');

  const [payModal,   setPayModal]   = useState(false);
  const [payCurr,    setPCurr]     = useState('LKR');
  const [payAmt,     setPayAmt]    = useState('');
  const [payType,    setPayType]   = useState('full');
  const [sendingPay, setSendingPay] = useState(false);
  const [payError,   setPayError]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const sb = getSupabaseClient();
    const [{ data: b }, { data: q }, { data: p }] = await Promise.all([
      sb.from('taxi_bookings').select('*').eq('id', id).single(),
      sb.from('booking_quotes').select('*').eq('booking_id', id).order('created_at', { ascending: false }),
      sb.from('booking_payments').select('*').eq('booking_id', id).order('created_at', { ascending: false }),
    ]);
    if (!b) { router.push('/bookings/taxi'); return; }
    const bk = b as TaxiBooking;
    setBooking(bk);
    setQuotes((q || []) as BookingQuote[]);
    setPayments((p || []) as BookingPayment[]);
    setStatus(bk.status);
    setNotes(bk.admin_notes || '');
    // Mark as viewed (fire-and-forget — uses service_role via API)
    if (!bk.viewed_at) {
      fetch('/api/bookings/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_type: 'taxi', booking_id: id, viewed_at: new Date().toISOString() }),
      }).catch(() => {});
    }
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  // ── Save status + notes via service-role API ──────────────
  const saveChanges = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res  = await fetch('/api/bookings/update', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_type: 'taxi',
          booking_id:   id,
          status,
          admin_notes:  notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || 'Save failed. Please try again.');
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        load();
      }
    } catch {
      setSaveError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Send quote ────────────────────────────────────────────
  const sendQuote = async () => {
    if (!quoteAmount || !booking) return;
    setSendingQuote(true);
    setQuoteError('');
    try {
      const res  = await fetch('/api/quotes/send', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_type:      'taxi',
          booking_id:        id,
          booking_reference: booking.booking_reference,
          currency:          quoteCurrency,
          amount:            parseFloat(quoteAmount),
          notes_admin:       quoteNotes || null,
          customer_email:    booking.email,
          customer_name:     booking.full_name,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setQuoteError(data.error || 'Failed to send quote.'); return; }
      setQuoteModal(false);
      setQAmount('');
      setQNotes('');
      load();
    } catch {
      setQuoteError('Network error. Please try again.');
    } finally {
      setSendingQuote(false);
    }
  };

  // ── Send payment link ─────────────────────────────────────
  const sendPaymentLink = async () => {
    if (!payAmt || !booking) return;
    setSendingPay(true);
    setPayError('');
    try {
      const res  = await fetch('/api/payments', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_type:      'taxi',
          booking_id:        id,
          booking_reference: booking.booking_reference,
          quote_id:          quotes.find(q => q.status === 'accepted')?.id || null,
          currency:          payCurr,
          amount:            parseFloat(payAmt),
          payment_type:      payType,
          customer_email:    booking.email,
          customer_name:     booking.full_name,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setPayError(data.error || 'Failed to send payment link.'); return; }
      setPayModal(false);
      setPayAmt('');
      load();
    } catch {
      setPayError('Network error. Please try again.');
    } finally {
      setSendingPay(false);
    }
  };

  if (loading) return <PageLoader />;
  if (!booking) return null;

  const currentIdx       = BOOKING_STATUS_FLOW.indexOf(status as BookingStatus);
  const flowNoCancelled  = BOOKING_STATUS_FLOW.filter(s => s !== 'cancelled');

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={booking.booking_reference}
        subtitle={`Taxi Transfer · ${booking.full_name}`}
        actions={
          <Link href="/bookings/taxi"
            className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[#111] transition-colors">
            <ArrowLeft size={13} /> Back
          </Link>
        }
      />

      <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── Main column ─────────────────────────────────── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Booking info */}
          <Card>
            <SectionLabel>Booking Details</SectionLabel>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {([
                ['Reference',   booking.booking_reference],
                ['Full Name',   booking.full_name],
                ['Email',       booking.email],
                ['Phone',       booking.phone],
                ['Contact Via', booking.preferred_contact  || '—'],
                ['Vehicle',     booking.vehicle_preference || '—'],
                ['Pickup',      booking.pickup_location],
                ['Destination', booking.destination],
                ['Date & Time', formatDateTime(booking.pickup_datetime)],
                ['Adults',      String(booking.adults)],
                ['Children',    String(booking.children)],
                ['Luggage',     booking.luggage_type || '—'],
                ['Received',    formatRelativeTime(booking.created_at)],
                ['Viewed',      booking.viewed_at ? formatRelativeTime(booking.viewed_at) : 'Not yet'],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label}>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#888] mb-0.5">{label}</p>
                  <p className="text-xs font-medium text-[#111]">{value}</p>
                </div>
              ))}
            </div>
            {booking.additional_notes && (
              <div className="mt-4 pt-4 border-t border-[#F0EDE9]">
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#888] mb-1">Customer Notes</p>
                <p className="text-xs text-[#555] leading-relaxed">{booking.additional_notes}</p>
              </div>
            )}
          </Card>

          {/* Quotes */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Quotations</SectionLabel>
              <Button size="sm" onClick={() => setQuoteModal(true)}>
                <Send size={12} /> Send Quote
              </Button>
            </div>
            {quotes.length === 0 ? (
              <p className="text-xs text-[#888] text-center py-6">No quotes sent yet.</p>
            ) : (
              <table className="admin-table w-full">
                <thead><tr>
                  <th className="text-left">Date</th>
                  <th className="text-left">Amount</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Accepted</th>
                </tr></thead>
                <tbody>
                  {quotes.map(q => (
                    <tr key={q.id}>
                      <td className="text-xs text-[#555]">{formatDate(q.created_at)}</td>
                      <td className="text-xs font-semibold">{formatCurrency(q.amount, q.currency)}</td>
                      <td><Badge label={q.status} className={QUOTE_STATUS_COLOR[q.status] || ''} /></td>
                      <td className="text-xs text-[#888]">{q.accepted_at ? formatDate(q.accepted_at) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* Payments */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Payments</SectionLabel>
              <Button size="sm" variant="secondary" onClick={() => setPayModal(true)}>
                <CreditCard size={12} /> Payment Link
              </Button>
            </div>
            {payments.length === 0 ? (
              <p className="text-xs text-[#888] text-center py-6">No payments yet.</p>
            ) : (
              <table className="admin-table w-full">
                <thead><tr>
                  <th className="text-left">Date</th>
                  <th className="text-left">Type</th>
                  <th className="text-left">Amount</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Paid At</th>
                </tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td className="text-xs">{formatDate(p.created_at)}</td>
                      <td className="text-xs capitalize text-[#555]">{p.payment_type}</td>
                      <td className="text-xs font-semibold">{formatCurrency(p.amount, p.currency)}</td>
                      <td><Badge label={p.status} className={PAYMENT_STATUS_COLOR[p.status] || ''} /></td>
                      <td className="text-xs text-[#888]">{p.paid_at ? formatDate(p.paid_at) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        {/* ── Side column ─────────────────────────────────── */}
        <div className="space-y-5">

          <Card>
            <SectionLabel>Booking Status</SectionLabel>
            <Select
              label="Change Status"
              value={status}
              onChange={e => setStatus(e.target.value)}
              options={BOOKING_STATUS_FLOW.map(s => ({ value: s, label: BOOKING_STATUS_LABEL[s] }))}
            />

            {/* Visual progress trail */}
            <div className="mt-4 space-y-1.5">
              {flowNoCancelled.map(s => {
                const done = BOOKING_STATUS_FLOW.indexOf(s) <= currentIdx && status !== 'cancelled';
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 flex-shrink-0', done ? 'bg-[#5e17eb]' : 'bg-[#E8E4DF]')} />
                    <span className={cn('text-[11px]', done ? 'text-[#111] font-medium' : 'text-[#BBB]')}>
                      {BOOKING_STATUS_LABEL[s]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4">
              <Textarea
                label="Internal Notes"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Visible to admin team only…"
                rows={3}
              />
            </div>

            {saveError && (
              <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 text-xs text-red-700">
                {saveError}
              </div>
            )}

            <Button className="w-full mt-3" onClick={saveChanges} loading={saving}>
              {saved ? <><CheckCircle size={13} /> Saved</> : <><Save size={13} /> Save Changes</>}
            </Button>
          </Card>

          <Card>
            <SectionLabel>Financial Summary</SectionLabel>
            <div className="space-y-3">
              {([
                ['Quote Amount', booking.latest_quote_amount
                  ? formatCurrency(booking.latest_quote_amount, booking.latest_quote_currency || 'LKR')
                  : '—'],
                ['Total Paid', booking.total_paid_amount && booking.total_paid_amount > 0
                  ? formatCurrency(booking.total_paid_amount, booking.latest_quote_currency || 'LKR')
                  : '—'],
                ['Balance Due', booking.latest_quote_amount
                  ? formatCurrency(
                      booking.latest_quote_amount - (booking.total_paid_amount || 0),
                      booking.latest_quote_currency || 'LKR',
                    )
                  : '—'],
              ] as [string, string][]).map(([l, v]) => (
                <div key={l} className="flex justify-between items-baseline">
                  <span className="text-xs text-[#888]">{l}</span>
                  <span className="text-xs font-semibold text-[#111]">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Quote modal ────────────────────────────────────── */}
      <Modal open={quoteModal} onClose={() => { setQuoteModal(false); setQuoteError(''); }} title="Send Quote to Customer">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Currency" value={quoteCurrency}
              onChange={e => setQCurrency(e.target.value)}
              options={[{ value: 'LKR', label: 'LKR' }, { value: 'USD', label: 'USD' }]} />
            <Input label="Amount" type="number" value={quoteAmount}
              onChange={e => setQAmount(e.target.value)} placeholder="e.g. 25000" />
          </div>
          <Textarea label="Internal Note (optional)" value={quoteNotes}
            onChange={e => setQNotes(e.target.value)} rows={2}
            placeholder="For internal reference only…" />
          <div className="bg-[#F7F7F6] border border-[#E8E4DF] p-3 text-xs text-[#555]">
            Email with "Confirm Quote" button will be sent to <strong>{booking.email}</strong>.
          </div>
          {quoteError && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 text-xs text-red-700">{quoteError}</div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setQuoteModal(false); setQuoteError(''); }}>Cancel</Button>
            <Button onClick={sendQuote} loading={sendingQuote} disabled={!quoteAmount}>
              <Send size={13} /> Send Quote
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Payment modal ───────────────────────────────────── */}
      <Modal open={payModal} onClose={() => { setPayModal(false); setPayError(''); }} title="Create Payment Link">
        <div className="space-y-4">
          <Select label="Payment Type" value={payType} onChange={e => setPayType(e.target.value)}
            options={[
              { value: 'full',    label: 'Full Payment'      },
              { value: 'deposit', label: 'Advance / Deposit' },
              { value: 'partial', label: 'Partial Payment'   },
            ]} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Currency" value={payCurr}
              onChange={e => setPCurr(e.target.value)}
              options={[{ value: 'LKR', label: 'LKR' }, { value: 'USD', label: 'USD' }]} />
            <Input label="Amount" type="number" value={payAmt}
              onChange={e => setPayAmt(e.target.value)} placeholder="e.g. 25000" />
          </div>
          <div className="bg-[#F7F7F6] border border-[#E8E4DF] p-3 text-xs text-[#555]">
            Secure PayHere payment link emailed to <strong>{booking.email}</strong>.
          </div>
          {payError && (
            <div className="px-3 py-2 bg-red-50 border border-red-200 text-xs text-red-700">{payError}</div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setPayModal(false); setPayError(''); }}>Cancel</Button>
            <Button onClick={sendPaymentLink} loading={sendingPay} disabled={!payAmt}>
              <CreditCard size={13} /> Send Payment Link
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}