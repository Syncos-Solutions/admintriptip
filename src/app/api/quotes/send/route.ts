// src/app/api/quotes/send/route.ts
// Creates a quote record, sends a premium quote email via Resend.
// Protected: called from admin panel only (authenticated session cookie checked).

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient }        from '@supabase/ssr';
import { cookies }                   from 'next/headers';
import { Resend }                    from 'resend';
import { quoteEmail }                from '@/emails/quote-email';
import { generateSecureToken }       from '@/lib/utils';

export async function POST(req: NextRequest) {
  // ── Verify admin session ───────────────────────────────────
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // ── Parse body ─────────────────────────────────────────────
  const body = await req.json();
  const {
    booking_type, booking_id, booking_reference,
    currency, amount, notes_admin,
    customer_email, customer_name,
  } = body;

  if (!booking_type || !booking_id || !currency || !amount || !customer_email) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  // ── Service-role client for DB writes ─────────────────────
  const { createClient } = require('@supabase/supabase-js');
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // ── Generate secure confirmation token ────────────────────
  const confirmation_token = generateSecureToken(40);

  // ── Insert quote ──────────────────────────────────────────
  const { data: quote, error: qErr } = await admin
    .from('booking_quotes')
    .insert({
      booking_type,
      booking_id,
      booking_reference: booking_reference || null,
      currency,
      amount:            Number(amount),
      status:            'sent',
      sent_at:           new Date().toISOString(),
      confirmation_token,
      customer_email,
      customer_name:     customer_name || '',
      notes_admin:       notes_admin || null,
    })
    .select()
    .single();

  if (qErr || !quote) {
    console.error('[QUOTES] Insert error:', qErr);
    return NextResponse.json({ error: 'Failed to save quote.' }, { status: 500 });
  }

  // ── Update booking: quote_status + latest amount ──────────
  const tableMap: Record<string, string> = {
    taxi:   'taxi_bookings',
    tour:   'tour_bookings',
    custom: 'custom_tour_bookings',
  };
  await admin
    .from(tableMap[booking_type])
    .update({
      quote_status:          'sent',
      status:                'quote_sent',
      latest_quote_amount:   Number(amount),
      latest_quote_currency: currency,
    })
    .eq('id', booking_id);

  // ── Send email via Resend ─────────────────────────────────
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://srilankantriptip.com';
  const confirmUrl = `${siteUrl}/quote/${quote.id}/${confirmation_token}`;

  const resend = new Resend(process.env.RESEND_API_KEY!);
  const { error: emailErr } = await resend.emails.send({
    from:    'TripTip Bookings <bookings@notifications.srilankantriptip.com>',
    to:      [customer_email],
    subject: `Your Quote from Sri Lankan TripTip — ${booking_reference || booking_id}`,
    html:    quoteEmail({
      customerName:     customer_name || 'Valued Guest',
      bookingReference: booking_reference || booking_id,
      bookingType:      booking_type,
      currency,
      amount:           Number(amount),
      confirmUrl,
    }),
  });

  if (emailErr) {
    console.error('[QUOTES] Email error:', emailErr);
    // Quote is saved — don't fail; just log
  }

  return NextResponse.json({ success: true, quoteId: quote.id });
}
