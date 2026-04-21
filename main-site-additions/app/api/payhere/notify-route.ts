// main-site-additions/app/api/payhere/notify/route.ts
// Copy to main site: app/api/payhere/notify/route.ts
// PayHere calls this server-to-server after every payment event.
// CRITICAL: Hash verification must pass before any DB update.

import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@supabase/supabase-js';
import { Resend }                    from 'resend';
import crypto                        from 'crypto';

// ── Verify PayHere notification hash ─────────────────────────
// As per PayHere docs:
// Hash = MD5(merchant_id + order_id + amount + currency + status_code + MD5(merchant_secret).toUpperCase())
function verifyPayHereHash(
  merchantId:     string,
  orderId:        string,
  amount:         string,
  currency:       string,
  statusCode:     string,
  merchantSecret: string,
  receivedHash:   string,
): boolean {
  const secretHash = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
  const raw        = `${merchantId}${orderId}${amount}${currency}${statusCode}${secretHash}`;
  const local      = crypto.createHash('md5').update(raw).digest('hex').toUpperCase();
  return local === receivedHash.toUpperCase();
}

// ── Payment confirmed email (inline to avoid import issues) ──
function buildPaymentConfirmedEmail(data: {
  customerName: string; bookingReference: string;
  bookingType: string; currency: string; amount: number;
  paymentType: string; payherePaymentId: string;
}): string {
  const { customerName, bookingReference, bookingType, currency, amount, payherePaymentId } = data;
  const typeLabel: Record<string, string> = {
    taxi:'Taxi Transfer', tour:'Tour Package', custom:'Custom Tour',
  };
  const formatted = new Intl.NumberFormat('en-LK', {
    style:'currency', currency, minimumFractionDigits:2,
  }).format(amount);
  const today = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F7F7F6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F6;padding:40px 16px;">
<tr><td align="center"><table width="100%" style="max-width:600px;">
  <tr><td style="background:#0D0D0D;padding:28px 36px 22px;">
    <p style="margin:0;color:#059669;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Payment Received ✓</p>
    <h1 style="margin:8px 0 0;color:#fff;font-size:22px;font-weight:900;">Payment Confirmed.<br/>Your Journey Awaits.</h1>
  </td></tr>
  <tr><td style="height:3px;background:linear-gradient(to right,#059669,#0E7A45);"></td></tr>
  <tr><td style="background:#fff;padding:28px 36px;">
    <p style="margin:0 0 16px;color:#444;font-size:14px;line-height:1.7;">Dear <strong>${customerName}</strong>,</p>
    <p style="margin:0 0 16px;color:#555;font-size:14px;line-height:1.7;">Your payment for <strong>${typeLabel[bookingType]||bookingType}</strong> has been received.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #059669;margin-bottom:20px;">
      <tr><td style="padding:14px 20px;background:#F0FFF8;border-bottom:1px solid #D1FAE5;">
        <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;">Reference</p>
        <p style="margin:4px 0 0;font-size:14px;font-weight:900;color:#111;font-family:monospace;">${bookingReference}</p>
      </td></tr>
      <tr><td style="display:grid;grid-template-columns:1fr 1fr;padding:14px 20px;">
        <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;">Amount Paid</p>
        <p style="margin:4px 0 8px;font-size:22px;font-weight:900;color:#059669;">${formatted}</p>
        <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;">Date</p>
        <p style="margin:4px 0 8px;font-size:13px;color:#111;">${today}</p>
        <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;">Transaction ID</p>
        <p style="margin:4px 0 0;font-size:11px;color:#555;font-family:monospace;">${payherePaymentId}</p>
      </td></tr>
    </table>
    <p style="margin:0;color:#555;font-size:14px;line-height:1.7;">
      Our team will be in touch with your final booking details and itinerary.<br/>
      Questions? <a href="mailto:srilankantriptip@gmail.com" style="color:#5e17eb;">srilankantriptip@gmail.com</a>
    </p>
  </td></tr>
  <tr><td style="background:#0D0D0D;padding:20px 36px;">
    <p style="margin:0;color:rgba(255,255,255,0.25);font-size:10px;">Sri Lankan TripTip · srilankantriptip.com</p>
  </td></tr>
</table></td></tr></table></body></html>`;
}

export async function POST(req: NextRequest) {
  // ── Parse application/x-www-form-urlencoded from PayHere ──
  let formData: Record<string, string> = {};
  try {
    const text = await req.text();
    const params = new URLSearchParams(text);
    params.forEach((value, key) => { formData[key] = value; });
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const {
    merchant_id,
    order_id,
    payment_id,
    payhere_amount,
    payhere_currency,
    status_code,
    md5sig,
    // customer fields
    custom_1,         // we pass payment DB id here
  } = formData;

  // ── Hash verification — CRITICAL security check ───────────
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  const expectedMerchantId = process.env.PAYHERE_MERCHANT_ID;

  if (!merchantSecret || !expectedMerchantId) {
    console.error('[PAYHERE NOTIFY] Missing merchant env vars.');
    return new NextResponse('Configuration error', { status: 500 });
  }

  if (merchant_id !== expectedMerchantId) {
    console.error('[PAYHERE NOTIFY] Merchant ID mismatch.');
    return new NextResponse('Forbidden', { status: 403 });
  }

  const hashValid = verifyPayHereHash(
    merchant_id, order_id, payhere_amount, payhere_currency,
    status_code, merchantSecret, md5sig,
  );

  if (!hashValid) {
    console.error('[PAYHERE NOTIFY] Hash verification failed.', { order_id, payment_id });
    return new NextResponse('Hash mismatch', { status: 400 });
  }

  // ── Only process successful payments (status_code = 2) ────
  // PayHere status codes: 2=Success, 0=Pending, -1=Cancelled, -2=Failed, -3=Chargedback
  if (status_code !== '2') {
    console.log(`[PAYHERE NOTIFY] Non-success status ${status_code} for order ${order_id}. No DB update.`);
    return new NextResponse('OK', { status: 200 });
  }

  // ── Service-role DB client ────────────────────────────────
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // ── Find payment record by payhere_order_id ───────────────
  const { data: payment, error: pFindErr } = await admin
    .from('booking_payments')
    .select('*')
    .eq('payhere_order_id', order_id)
    .single();

  if (pFindErr || !payment) {
    console.error('[PAYHERE NOTIFY] Payment record not found for order:', order_id);
    return new NextResponse('Not found', { status: 404 });
  }

  // ── Idempotency: skip if already paid ─────────────────────
  if (payment.status === 'paid') {
    console.log('[PAYHERE NOTIFY] Already processed:', order_id);
    return new NextResponse('OK', { status: 200 });
  }

  // ── Verify amount matches (critical anti-fraud check) ─────
  const receivedAmount = parseFloat(payhere_amount);
  const expectedAmount = parseFloat(String(payment.amount));
  if (Math.abs(receivedAmount - expectedAmount) > 0.01) {
    console.error('[PAYHERE NOTIFY] Amount mismatch! Expected:', expectedAmount, 'Got:', receivedAmount);
    return new NextResponse('Amount mismatch', { status: 400 });
  }

  const now = new Date().toISOString();

  // ── Update booking_payments ───────────────────────────────
  const { error: updateErr } = await admin
    .from('booking_payments')
    .update({
      status:             'paid',
      paid_at:            now,
      payhere_payment_id: payment_id,
      payhere_raw:        formData,
    })
    .eq('id', payment.id);

  if (updateErr) {
    console.error('[PAYHERE NOTIFY] Payment update error:', updateErr);
    return new NextResponse('DB error', { status: 500 });
  }

  // ── Update booking table ──────────────────────────────────
  const tableMap: Record<string, string> = {
    taxi:   'taxi_bookings',
    tour:   'tour_bookings',
    custom: 'custom_tour_bookings',
  };

  // Fetch current total_paid_amount to accumulate correctly
  const { data: bookingRow } = await admin
    .from(tableMap[payment.booking_type])
    .select('total_paid_amount, latest_quote_amount')
    .eq('id', payment.booking_id)
    .single();

  const prevPaid    = Number(bookingRow?.total_paid_amount || 0);
  const newPaid     = prevPaid + receivedAmount;
  const quoteAmount = Number(bookingRow?.latest_quote_amount || 0);
  const newStatus   = quoteAmount > 0 && newPaid >= quoteAmount - 0.01 ? 'paid' : 'partially_paid';

  await admin
    .from(tableMap[payment.booking_type])
    .update({
      payment_status:    newPaid >= quoteAmount - 0.01 ? 'paid' : 'partial',
      total_paid_amount: newPaid,
      status:            newStatus,
    })
    .eq('id', payment.booking_id);

  // ── Send payment confirmation email ───────────────────────
  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    await resend.emails.send({
      from:    'TripTip Bookings <bookings@notifications.srilankantriptip.com>',
      to:      [payment.customer_email],
      subject: `Payment Confirmed — ${payment.booking_reference || payment.booking_id} | Sri Lankan TripTip`,
      html: buildPaymentConfirmedEmail({
        customerName:     payment.customer_name,
        bookingReference: payment.booking_reference || payment.booking_id,
        bookingType:      payment.booking_type,
        currency:         payment.currency,
        amount:           receivedAmount,
        paymentType:      payment.payment_type,
        payherePaymentId: payment_id,
      }),
    });
  } catch (e) {
    console.error('[PAYHERE NOTIFY] Confirmation email error:', e);
    // Don't fail — payment is already recorded in DB
  }

  console.log(`[PAYHERE NOTIFY] Payment ${payment_id} recorded successfully for order ${order_id}.`);
  return new NextResponse('OK', { status: 200 });
}
