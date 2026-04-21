// src/app/api/payments/route.ts
// Creates a booking_payments record and sends a payment link email.

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient }        from '@supabase/ssr';
import { cookies }                   from 'next/headers';
import { Resend }                    from 'resend';
import { paymentRequestEmail }       from '@/emails/payment-request-email';
import { generateSecureToken }       from '@/lib/utils';

export async function POST(req: NextRequest) {
  // ── Auth check ────────────────────────────────────────────
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    booking_type, booking_id, booking_reference, quote_id,
    currency, amount, payment_type,
    customer_email, customer_name, notes_admin,
  } = body;

  if (!booking_type || !booking_id || !currency || !amount || !customer_email) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const { createClient } = require('@supabase/supabase-js');
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const payment_link_token = generateSecureToken(40);

  // Generate a PayHere order ID: TT-PAY-{timestamp}-{rand}
  const payhereOrderId = `TT-PAY-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;

  const { data: payment, error: pErr } = await admin
    .from('booking_payments')
    .insert({
      booking_type,
      booking_id,
      booking_reference: booking_reference || null,
      quote_id:          quote_id || null,
      currency,
      amount:            Number(amount),
      payment_type:      payment_type || 'full',
      status:            'pending',
      payhere_order_id:  payhereOrderId,
      requested_at:      new Date().toISOString(),
      customer_email,
      customer_name:     customer_name || '',
      payment_link_token,
      notes_admin:       notes_admin || null,
    })
    .select()
    .single();

  if (pErr || !payment) {
    console.error('[PAYMENTS] Insert error:', pErr);
    return NextResponse.json({ error: 'Failed to save payment.' }, { status: 500 });
  }

  // Update booking status → payment_pending
  const tableMap: Record<string, string> = {
    taxi:   'taxi_bookings',
    tour:   'tour_bookings',
    custom: 'custom_tour_bookings',
  };
  await admin
    .from(tableMap[booking_type])
    .update({ status: 'payment_pending', payment_status: 'unpaid' })
    .eq('id', booking_id);

  // Send payment link email
  const siteUrl  = process.env.NEXT_PUBLIC_SITE_URL || 'https://srilankantriptip.com';
  const payUrl   = `${siteUrl}/pay/${payment.id}/${payment_link_token}`;

  const resend = new Resend(process.env.RESEND_API_KEY!);
  const { error: emailErr } = await resend.emails.send({
    from:    'TripTip Bookings <bookings@notifications.srilankantriptip.com>',
    to:      [customer_email],
    subject: `Payment Request — ${booking_reference || booking_id} | Sri Lankan TripTip`,
    html:    paymentRequestEmail({
      customerName:     customer_name || 'Valued Guest',
      bookingReference: booking_reference || booking_id,
      bookingType:      booking_type,
      currency,
      amount:           Number(amount),
      paymentType:      payment_type || 'full',
      payUrl,
    }),
  });

  if (emailErr) console.error('[PAYMENTS] Email error:', emailErr);

  return NextResponse.json({ success: true, paymentId: payment.id, orderId: payhereOrderId });
}
