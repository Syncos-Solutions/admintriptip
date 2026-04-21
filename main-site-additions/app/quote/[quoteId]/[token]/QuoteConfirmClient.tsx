'use client';
// main-site-additions/app/quote/[quoteId]/[token]/QuoteConfirmClient.tsx
// Copy to main site repo alongside page.tsx

import { useState } from 'react';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface Props {
  quote:            Record<string, unknown>;
  booking?:         Record<string, unknown> | null;
  alreadyConfirmed?: boolean;
  expired?:          boolean;
}

const typeLabel: Record<string, string> = {
  taxi: 'Taxi Transfer', tour: 'Tour Package', custom: 'Custom Planning Tour',
};

export default function QuoteConfirmClient({ quote, booking, alreadyConfirmed, expired }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const formattedAmount = new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: String(quote.currency || 'LKR'),
    minimumFractionDigits: 2,
  }).format(Number(quote.amount));

  const handleConfirm = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/quote/confirm', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ quoteId: quote.id, token: quote.confirmation_token }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Confirmation failed.');
      setConfirmed(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── States ─────────────────────────────────────────────────
  if (alreadyConfirmed || confirmed) {
    return (
      <div className="min-h-screen bg-[#F7F7F6] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#E8E4DF] shadow-sm">
          <div style={{ background: 'linear-gradient(135deg,#059669,#0E7A45)', height: '3px' }} />
          <div className="p-8 text-center">
            <div className="w-12 h-12 flex items-center justify-center bg-emerald-50 mx-auto mb-4">
              <CheckCircle className="text-emerald-600" size={24} />
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif' }} className="text-xl font-bold text-[#111] mb-3">
              Quote Confirmed
            </h1>
            <p className="text-sm text-[#555] leading-relaxed mb-4">
              Thank you for confirming your quote for booking
              <strong className="text-[#111] font-mono ml-1">
                {String(quote.booking_reference || quote.booking_id)}
              </strong>.
            </p>
            <p className="text-sm text-[#555] leading-relaxed">
              Our team will prepare your payment link and contact you shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-[#F7F7F6] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#E8E4DF] shadow-sm text-center p-8">
          <Clock className="text-amber-500 mx-auto mb-4" size={32} />
          <h1 style={{ fontFamily: 'Georgia, serif' }} className="text-xl font-bold text-[#111] mb-3">
            Quote Expired
          </h1>
          <p className="text-sm text-[#555]">
            This quote has expired. Please contact us at{' '}
            <a href="mailto:srilankantriptip@gmail.com" className="text-[#5e17eb]">
              srilankantriptip@gmail.com
            </a>{' '}
            to request a new quote.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F6] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border border-[#E8E4DF] shadow-sm">

        {/* Header */}
        <div style={{ background: '#0D0D0D', padding: '28px 32px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{
              width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg,#5e17eb,#1800ad)',
              color: '#fff', fontSize: 9, fontWeight: 900,
            }}>TT</div>
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>Sri Lankan TripTip</span>
          </div>
          <p style={{ color: '#5e17eb', fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', margin: '0 0 6px' }}>
            Your Quote
          </p>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 900, margin: 0, lineHeight: 1.1 }}>
            Review &amp; Confirm<br/>Your Journey Quote.
          </h1>
        </div>
        <div style={{ height: 3, background: 'linear-gradient(to right,#5e17eb,#1800ad)' }} />

        <div className="p-8">
          {/* Quote summary */}
          <div className="border border-[#E8E4DF] mb-6">
            <div className="px-5 py-4 bg-[#F7F7F6] border-b border-[#E8E4DF]">
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#888] mb-1">Booking Reference</p>
              <p className="font-mono text-sm font-black text-[#111]">
                {String(quote.booking_reference || quote.booking_id)}
              </p>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#888] mb-1">Booking Type</p>
                <p className="text-sm font-semibold text-[#111]">
                  {typeLabel[String(quote.booking_type)] || String(quote.booking_type)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-widest uppercase text-[#888] mb-1">Quoted Amount</p>
                <p className="text-2xl font-black text-[#111]" style={{ fontFamily: 'Georgia, serif' }}>
                  {formattedAmount}
                </p>
              </div>
            </div>
          </div>

          {/* Booking info */}
          {booking && (
            <div className="bg-[#F7F7F6] border border-[#E8E4DF] p-4 mb-6">
              <p className="text-[10px] font-bold tracking-widest uppercase text-[#888] mb-3">Booking Details</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['Customer', String((booking.full_name || `${booking.first_name} ${booking.last_name}`) || '')],
                  ['Email',    String(booking.email || '')],
                  ['Pickup',   String(booking.pickup_location || '')],
                  quote.booking_type === 'taxi'
                    ? ['Destination', String(booking.destination || '')]
                    : ['Start Date',  String(booking.preferred_start_date || booking.start_date || '—')],
                ].map(([l, v]) => (
                  <div key={l}>
                    <p className="text-[#888] font-semibold mb-0.5">{l}</p>
                    <p className="text-[#111]">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Terms note */}
          <p className="text-xs text-[#555] leading-relaxed mb-6 border-l-2 border-[#5e17eb] pl-3">
            By confirming this quote, you agree to proceed with the booking at the quoted price.
            A payment link will be sent to you after confirmation to complete your booking.
          </p>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 p-3 mb-4 text-xs text-red-700">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full py-3.5 text-white text-sm font-bold tracking-widest uppercase transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#5e17eb,#1800ad)' }}
          >
            {loading ? 'Confirming…' : 'Confirm Quote →'}
          </button>

          <p className="text-center text-xs text-[#888] mt-4">
            Questions?{' '}
            <a href="mailto:srilankantriptip@gmail.com" className="text-[#5e17eb]">
              srilankantriptip@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
