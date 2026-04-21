'use client';
// src/app/(admin)/bookings/custom/[id]/page.tsx

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, CreditCard, Save, CheckCircle, MapPin } from 'lucide-react';
import {
  PageHeader, Card, SectionLabel, Badge, Button, Select,
  Textarea, Modal, Input, PageLoader,
} from '@/components/ui';
import { getSupabaseClient } from '@/lib/supabase-client';
import { formatDate, formatRelativeTime, formatCurrency, cn } from '@/lib/utils';
import {
  BOOKING_STATUS_LABEL, BOOKING_STATUS_COLOR, BOOKING_STATUS_FLOW,
  QUOTE_STATUS_COLOR, PAYMENT_STATUS_COLOR,
  type CustomBooking, type BookingQuote, type BookingPayment,
} from '@/types';

export default function CustomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [booking,  setBooking]  = useState<CustomBooking | null>(null);
  const [quotes,   setQuotes]   = useState<BookingQuote[]>([]);
  const [payments, setPayments] = useState<BookingPayment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [status,   setStatus]   = useState('');
  const [notes,    setNotes]    = useState('');
  const [architect, setArchitect] = useState('');

  const [quoteModal,    setQuoteModal]    = useState(false);
  const [quoteCurrency, setQCurrency]    = useState('LKR');
  const [quoteAmount,   setQAmount]      = useState('');
  const [sendingQuote,  setSendingQuote] = useState(false);

  const [payModal,  setPayModal]  = useState(false);
  const [payCurr,   setPCurr]    = useState('LKR');
  const [payAmt,    setPayAmt]   = useState('');
  const [payType,   setPayType]  = useState('full');
  const [sendingPay, setSendingPay] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const sb = getSupabaseClient();
    const [{ data: b }, { data: q }, { data: p }] = await Promise.all([
      sb.from('custom_tour_bookings').select('*').eq('id', id).single(),
      sb.from('booking_quotes').select('*').eq('booking_id', id).order('created_at', { ascending: false }),
      sb.from('booking_payments').select('*').eq('booking_id', id).order('created_at', { ascending: false }),
    ]);
    if (!b) { router.push('/bookings/custom'); return; }
    setBooking(b as CustomBooking);
    setQuotes((q || []) as BookingQuote[]);
    setPayments((p || []) as BookingPayment[]);
    setStatus((b as CustomBooking).status);
    setNotes((b as CustomBooking).admin_notes || '');
    setArchitect((b as CustomBooking).assigned_architect || '');
    if (!(b as CustomBooking).viewed_at)
      await sb.from('custom_tour_bookings').update({ viewed_at: new Date().toISOString() }).eq('id', id);
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const saveChanges = async () => {
    setSaving(true);
    await getSupabaseClient().from('custom_tour_bookings')
      .update({ status, admin_notes: notes, assigned_architect: architect }).eq('id', id);
    setSaved(true); setTimeout(() => setSaved(false), 2500); setSaving(false); load();
  };

  const sendQuote = async () => {
    if (!quoteAmount || !booking) return;
    setSendingQuote(true);
    await fetch('/api/quotes/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_type: 'custom', booking_id: id,
        booking_reference: booking.booking_reference,
        currency: quoteCurrency, amount: parseFloat(quoteAmount),
        customer_email: booking.email,
        customer_name: `${booking.first_name} ${booking.last_name}`,
      }),
    });
    setSendingQuote(false); setQuoteModal(false); setQAmount(''); load();
  };

  const sendPaymentLink = async () => {
    if (!payAmt || !booking) return;
    setSendingPay(true);
    await fetch('/api/payments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_type: 'custom', booking_id: id,
        booking_reference: booking.booking_reference,
        quote_id: quotes.find(q => q.status === 'accepted')?.id || null,
        currency: payCurr, amount: parseFloat(payAmt), payment_type: payType,
        customer_email: booking.email,
        customer_name: `${booking.first_name} ${booking.last_name}`,
      }),
    });
    setSendingPay(false); setPayModal(false); setPayAmt(''); load();
  };

  if (loading) return <PageLoader />;
  if (!booking) return null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={booking.booking_reference}
        subtitle={`Custom Planning · ${booking.first_name} ${booking.last_name} · ${booking.total_days} Days`}
        actions={
          <Link href="/bookings/custom"
            className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[#111]">
            <ArrowLeft size={13} /> Back
          </Link>
        }
      />

      <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">

          {/* Customer info */}
          <Card>
            <SectionLabel>Customer Details</SectionLabel>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                ['Reference',    booking.booking_reference],
                ['Name',         `${booking.salutation || ''} ${booking.first_name} ${booking.last_name}`.trim()],
                ['Email',        booking.email],
                ['Phone',        booking.phone],
                ['Contact Via',  booking.contact_method || '—'],
                ['Pickup',       booking.pickup_location],
                ['Start Date',   formatDate(booking.start_date)],
                ['Adults',       String(booking.adults)],
                ['Children',     String(booking.children)],
                ['Luggage',      booking.luggage_type || '—'],
                ['Total Days',   String(booking.total_days)],
                ['Submitted',    formatRelativeTime(booking.created_at)],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-[10px] font-bold tracking-widest uppercase text-[#888] mb-0.5">{l}</p>
                  <p className="text-xs text-[#111] font-medium">{v}</p>
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

          {/* Day plans itinerary */}
          <Card>
            <SectionLabel>Day-by-Day Itinerary ({booking.total_days} Days)</SectionLabel>
            <div className="space-y-3">
              {(booking.day_plans || []).map((day, i) => (
                <div key={i} className="border border-[#F0EDE9] bg-[#F9F8F7]">
                  {/* Day header */}
                  <div
                    className="flex items-center gap-3 px-4 py-2.5"
                    style={{ background: 'linear-gradient(135deg,rgba(94,23,235,0.06),rgba(24,0,173,0.04))' }}
                  >
                    <div
                      className="w-6 h-6 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#5e17eb,#1800ad)' }}
                    >
                      {day.day}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-[#5e17eb]" />
                      <span className="text-xs font-bold text-[#111]">{day.destination || `Day ${day.day}`}</span>
                    </div>
                  </div>
                  {/* Day content */}
                  <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      ['Activities',      day.activities     ],
                      ['Accommodation',   day.accommodation  ],
                      ['Notes',           day.notes          ],
                    ].filter(([, v]) => v).map(([l, v]) => (
                      <div key={l}>
                        <p className="text-[9px] font-bold tracking-widest uppercase text-[#888] mb-0.5">{l}</p>
                        <p className="text-xs text-[#555]">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quotes */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Quotations</SectionLabel>
              <Button size="sm" onClick={() => setQuoteModal(true)}>
                <Send size={12} /> Send Quote
              </Button>
            </div>
            {quotes.length === 0
              ? <p className="text-xs text-[#888] text-center py-4">No quotes sent yet.</p>
              : <table className="admin-table w-full"><thead><tr>
                  <th className="text-left">Date</th><th className="text-left">Amount</th>
                  <th className="text-left">Status</th><th className="text-left">Accepted</th>
                </tr></thead><tbody>
                {quotes.map(q => (
                  <tr key={q.id}>
                    <td className="text-xs">{formatDate(q.created_at)}</td>
                    <td className="text-xs font-semibold">{formatCurrency(q.amount, q.currency)}</td>
                    <td><Badge label={q.status} className={QUOTE_STATUS_COLOR[q.status] || ''} /></td>
                    <td className="text-xs text-[#888]">{q.accepted_at ? formatDate(q.accepted_at) : '—'}</td>
                  </tr>
                ))}
                </tbody></table>}
          </Card>

          {/* Payments */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <SectionLabel>Payments</SectionLabel>
              <Button size="sm" variant="secondary" onClick={() => setPayModal(true)}>
                <CreditCard size={12} /> Payment Link
              </Button>
            </div>
            {payments.length === 0
              ? <p className="text-xs text-[#888] text-center py-4">No payments yet.</p>
              : <table className="admin-table w-full"><thead><tr>
                  <th className="text-left">Date</th><th className="text-left">Type</th>
                  <th className="text-left">Amount</th><th className="text-left">Status</th>
                </tr></thead><tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td className="text-xs">{formatDate(p.created_at)}</td>
                    <td className="text-xs capitalize">{p.payment_type}</td>
                    <td className="text-xs font-semibold">{formatCurrency(p.amount, p.currency)}</td>
                    <td><Badge label={p.status} className={PAYMENT_STATUS_COLOR[p.status] || ''} /></td>
                  </tr>
                ))}
                </tbody></table>}
          </Card>
        </div>

        {/* Right col */}
        <div className="space-y-5">
          <Card>
            <SectionLabel>Booking Status</SectionLabel>
            <Select label="Current Status" value={status}
              onChange={e => setStatus(e.target.value)}
              options={BOOKING_STATUS_FLOW.map(s => ({ value: s, label: BOOKING_STATUS_LABEL[s] }))} />
            <div className="mt-3">
              <label className="block text-[10px] font-bold tracking-widest uppercase text-[#888] mb-1.5">
                Assigned Architect
              </label>
              <input value={architect} onChange={e => setArchitect(e.target.value)}
                className="admin-input text-xs" placeholder="Travel architect name…" />
            </div>
            <div className="mt-3">
              <Textarea label="Internal Notes" value={notes}
                onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Notes visible to admin team only…" />
            </div>
            <Button className="w-full mt-3" onClick={saveChanges} loading={saving}>
              {saved ? <><CheckCircle size={13} /> Saved</> : <><Save size={13} /> Save Changes</>}
            </Button>
          </Card>
          <Card>
            <SectionLabel>Financial Summary</SectionLabel>
            <div className="space-y-3">
              {[
                ['Quote Amount', booking.latest_quote_amount
                  ? formatCurrency(booking.latest_quote_amount, booking.latest_quote_currency||'LKR') : '—'],
                ['Total Paid', booking.total_paid_amount && booking.total_paid_amount > 0
                  ? formatCurrency(booking.total_paid_amount, booking.latest_quote_currency||'LKR') : '—'],
              ].map(([l,v]) => (
                <div key={l} className="flex justify-between">
                  <span className="text-xs text-[#888]">{l}</span>
                  <span className="text-xs font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Quote Modal */}
      <Modal open={quoteModal} onClose={() => setQuoteModal(false)} title="Send Quote">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select label="Currency" value={quoteCurrency} onChange={e => setQCurrency(e.target.value)}
              options={[{value:'LKR',label:'LKR'},{value:'USD',label:'USD'}]} />
            <Input label="Amount" type="number" value={quoteAmount}
              onChange={e => setQAmount(e.target.value)} placeholder="Total tour cost" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setQuoteModal(false)}>Cancel</Button>
            <Button onClick={sendQuote} loading={sendingQuote} disabled={!quoteAmount}>
              <Send size={13} /> Send Quote
            </Button>
          </div>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal open={payModal} onClose={() => setPayModal(false)} title="Create Payment Link">
        <div className="space-y-4">
          <Select label="Payment Type" value={payType} onChange={e => setPayType(e.target.value)}
            options={[{value:'full',label:'Full'},{value:'deposit',label:'Deposit'},{value:'partial',label:'Partial'}]} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Currency" value={payCurr} onChange={e => setPCurr(e.target.value)}
              options={[{value:'LKR',label:'LKR'},{value:'USD',label:'USD'}]} />
            <Input label="Amount" type="number" value={payAmt}
              onChange={e => setPayAmt(e.target.value)} placeholder="Payment amount" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setPayModal(false)}>Cancel</Button>
            <Button onClick={sendPaymentLink} loading={sendingPay} disabled={!payAmt}>
              <CreditCard size={13} /> Send Link
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
