// main-site-additions/app/api/quote/confirm/route.ts
// Copy to main site: app/api/quote/confirm/route.ts
// Called by the QuoteConfirmClient when user clicks "Confirm Quote"

import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@supabase/supabase-js';
import { Resend }                    from 'resend';

// ── Helper: lazy import email from admin emails folder ─────────
// In the main site, copy the email template or inline it below.
function buildQuoteConfirmedEmail(data: {
  customerName: string;
  bookingReference: string;
  bookingType: string;
  currency: string;
  amount: number;
}): string {
  const { customerName, bookingReference, bookingType, currency, amount } = data;
  const typeLabel: Record<string, string> = {
    taxi: 'Taxi Transfer', tour: 'Tour Package', custom: 'Custom Tour',
  };
  const formattedAmount = new Intl.NumberFormat('en-LK', {
    style: 'currency', currency, minimumFractionDigits: 2,
  }).format(amount);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><title>Quote Confirmed</title></head>
<body style="margin:0;padding:0;background:#F7F7F6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F6;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
  <tr><td style="background:#0D0D0D;padding:32px 40px 24px;">
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="background:linear-gradient(135deg,#5e17eb,#1800ad);width:26px;height:26px;text-align:center;vertical-align:middle;">
        <span style="color:#fff;font-size:9px;font-weight:900;">TT</span></td>
      <td style="padding-left:10px;color:#fff;font-size:12px;font-weight:700;">Sri Lankan TripTip</td>
    </tr></table>
    <h1 style="color:#fff;font-size:22px;font-weight:900;margin:20px 0 0;line-height:1.1;">
      Quote Confirmed.<br/>We&rsquo;re Preparing Your Journey.
    </h1>
  </td></tr>
  <tr><td style="height:3px;background:linear-gradient(to right,#059669,#0E7A45);"></td></tr>
  <tr><td style="background:#fff;padding:32px 40px;">
    <p style="margin:0 0 16px;color:#444;font-size:14px;line-height:1.7;">
      Dear <strong style="color:#111;">${customerName}</strong>,
    </p>
    <p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.7;">
      Your <strong style="color:#111;">${typeLabel[bookingType] || bookingType}</strong> quote has been confirmed.
      Reference: <strong style="color:#111;font-family:monospace;">${bookingReference}</strong>
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E8E4DF;margin-bottom:20px;">
      <tr><td style="padding:14px 20px;background:#F0FFF8;">
        <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;">Confirmed Amount</p>
        <p style="margin:4px 0 0;font-size:24px;font-weight:900;color:#059669;">${formattedAmount}</p>
      </td></tr>
    </table>
    <p style="margin:0;color:#555;font-size:14px;line-height:1.7;">
      Our team will send you a secure payment link shortly to complete your booking.
      Questions? <a href="mailto:srilankantriptip@gmail.com" style="color:#5e17eb;">srilankantriptip@gmail.com</a>
    </p>
  </td></tr>
  <tr><td style="background:#0D0D0D;padding:20px 40px;">
    <p style="margin:0;color:rgba(255,255,255,0.25);font-size:10px;">Sri Lankan TripTip · srilankantriptip.com</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

export async function POST(req: NextRequest) {
  // ── Security: basic payload guard ─────────────────────────
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 1024) {
    return NextResponse.json({ error: 'Payload too large.' }, { status: 413 });
  }

  let body: { quoteId: string; token: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const { quoteId, token } = body;
  if (!quoteId || !token || typeof quoteId !== 'string' || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing quoteId or token.' }, { status: 400 });
  }

  // ── Service-role DB access ────────────────────────────────
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Load and validate quote
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
    return NextResponse.json({ success: true, message: 'Already confirmed.' });
  }
  if (quote.status !== 'sent') {
    return NextResponse.json({ error: 'This quote cannot be confirmed.' }, { status: 409 });
  }
  if (quote.expires_at && new Date(quote.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This quote has expired.' }, { status: 410 });
  }

  const now = new Date().toISOString();

  // ── Update quote status ───────────────────────────────────
  const { error: updateErr } = await admin
    .from('booking_quotes')
    .update({ status: 'accepted', accepted_at: now })
    .eq('id', quoteId);

  if (updateErr) {
    console.error('[QUOTE CONFIRM] Update error:', updateErr);
    return NextResponse.json({ error: 'Failed to confirm quote.' }, { status: 500 });
  }

  // ── Update related booking ────────────────────────────────
  const tableMap: Record<string, string> = {
    taxi:   'taxi_bookings',
    tour:   'tour_bookings',
    custom: 'custom_tour_bookings',
  };
  await admin
    .from(tableMap[quote.booking_type])
    .update({
      quote_status: 'accepted',
      status:       'quote_accepted',
    })
    .eq('id', quote.booking_id);

  // ── Send confirmation email to customer ───────────────────
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    await resend.emails.send({
      from:    'TripTip Bookings <bookings@notifications.srilankantriptip.com>',
      to:      [quote.customer_email],
      subject: `Quote Confirmed — ${quote.booking_reference || quote.booking_id} | Sri Lankan TripTip`,
      html: buildQuoteConfirmedEmail({
        customerName:     quote.customer_name,
        bookingReference: quote.booking_reference || quote.booking_id,
        bookingType:      quote.booking_type,
        currency:         quote.currency,
        amount:           Number(quote.amount),
      }),
    });
  } catch (e) {
    // Email failure should not block confirmation — already saved in DB
    console.error('[QUOTE CONFIRM] Email error:', e);
  }

  return NextResponse.json({ success: true });
}
