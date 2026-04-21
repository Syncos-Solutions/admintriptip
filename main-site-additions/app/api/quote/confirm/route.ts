// main-site-additions/app/api/quote/confirm/route.ts
// Copy to main site repo at: app/api/quote/confirm/route.ts
//
// Called by QuoteConfirmClient when user clicks "Confirm Quote".
// Uses service_role key — never exposes RLS bypass to browser.

import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@supabase/supabase-js';
import { Resend }                    from 'resend';

// ── inline quote-confirmed email (copy of the template) ──────
function confirmedEmail(customerName: string, ref: string, amount: number, currency: string): string {
  const fmt = new Intl.NumberFormat('en-LK', {
    style: 'currency', currency, minimumFractionDigits: 2,
  }).format(amount);
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F7F7F6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
<tr><td align="center"><table style="max-width:600px;width:100%;">
<tr><td style="background:#0D0D0D;padding:28px 36px;">
  <p style="margin:0;color:#059669;font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Quote Confirmed ✓</p>
  <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:900;">Quote Confirmed — Booking Locked In.</h1>
</td></tr>
<tr><td style="height:3px;background:linear-gradient(to right,#059669,#0E7A45);"></td></tr>
<tr><td style="background:#fff;padding:32px 36px;">
  <p style="color:#444;font-size:14px;line-height:1.7;margin:0 0 16px;">Dear <strong>${customerName}</strong>,</p>
  <p style="color:#555;font-size:14px;line-height:1.7;margin:0 0 24px;">
    We have received your confirmation for booking <strong style="font-family:monospace;">${ref}</strong> at
    <strong style="font-size:18px;color:#111;"> ${fmt}</strong>.
    Our team will prepare your payment link and be in touch shortly.
  </p>
  <p style="color:#555;font-size:13px;line-height:1.7;margin:0;">
    Questions? <a href="mailto:srilankantriptip@gmail.com" style="color:#5e17eb;">srilankantriptip@gmail.com</a>
  </p>
</td></tr>
<tr><td style="background:#0D0D0D;padding:20px 36px;">
  <p style="margin:0;color:rgba(255,255,255,0.25);font-size:10px;">Sri Lankan TripTip · srilankantriptip.com</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

export async function POST(req: NextRequest) {
  // ── Basic rate limit (5 per 15 min) ─────────────────────────
  // (reuse main site security.ts if available)

  const { quoteId, token } = await req.json();
  if (!quoteId || !token) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // ── Load quote with token verification ───────────────────────
  const { data: quote, error: qErr } = await admin
    .from('booking_quotes')
    .select('*')
    .eq('id', quoteId)
    .eq('confirmation_token', token)
    .single();

  if (qErr || !quote) {
    return NextResponse.json({ error: 'Quote not found or invalid token.' }, { status: 404 });
  }

  if (quote.status === 'accepted') {
    return NextResponse.json({ success: true, alreadyConfirmed: true });
  }

  if (quote.status !== 'sent') {
    return NextResponse.json({ error: 'This quote is no longer active.' }, { status: 400 });
  }

  if (quote.expires_at && new Date(quote.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This quote has expired.' }, { status: 400 });
  }

  // ── Mark quote as accepted ────────────────────────────────────
  const { error: uErr } = await admin
    .from('booking_quotes')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', quoteId);

  if (uErr) {
    console.error('[QUOTE CONFIRM] Update error:', uErr);
    return NextResponse.json({ error: 'Failed to confirm quote.' }, { status: 500 });
  }

  // ── Update booking ────────────────────────────────────────────
  const tableMap: Record<string, string> = {
    taxi: 'taxi_bookings', tour: 'tour_bookings', custom: 'custom_tour_bookings',
  };
  await admin
    .from(tableMap[quote.booking_type])
    .update({ quote_status: 'accepted', status: 'payment_pending' })
    .eq('id', quote.booking_id);

  // ── Send confirmation email ───────────────────────────────────
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    await resend.emails.send({
      from:    'TripTip Bookings <bookings@notifications.srilankantriptip.com>',
      to:      [quote.customer_email],
      subject: `Quote Confirmed — ${quote.booking_reference || quote.booking_id} | Sri Lankan TripTip`,
      html:    confirmedEmail(
        quote.customer_name,
        quote.booking_reference || quote.booking_id,
        quote.amount,
        quote.currency
      ),
    });
  } catch (e) {
    console.error('[QUOTE CONFIRM] Email error:', e);
  }

  return NextResponse.json({ success: true });
}
