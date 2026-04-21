// main-site-additions/app/api/payhere/route.ts
// Copy to MAIN SITE repo at: app/api/payhere/notify/route.ts
//
// PayHere notify_url — server-to-server callback.
// NEVER trust the client for payment status.
// Always verify the hash before marking any payment as paid.

import { NextRequest, NextResponse } from 'next/server';
import { createClient }              from '@supabase/supabase-js';
import { Resend }                    from 'resend';

// ── Verify PayHere notification signature ─────────────────────
// Hash = MD5(merchant_id + order_id + amount + currency + status_code + MD5(secret).toUpperCase())
function verifyPayHereSignature(
  merchantId:     string,
  orderId:        string,
  amount:         string,
  currency:       string,
  statusCode:     string,
  merchantSecret: string,
  receivedHash:   string
): boolean {
  const crypto     = require('crypto');
  const secretHash = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
  const rawString  = `${merchantId}${orderId}${amount}${currency}${statusCode}${secretHash}`;
  const localHash  = crypto.createHash('md5').update(rawString).digest('hex').toUpperCase();
  return localHash === receivedHash.toUpperCase();
}

function paymentConfirmedHtml(
  customerName: string, bookingReference: string, bookingType: string,
  currency: string, amount: number, paymentType: string, payhereId: string
): string {
  const typeLabel: Record<string, string> = {
    taxi: 'Taxi Transfer', tour: 'Tour Package', custom: 'Custom Tour',
  };
  const payTypeLabel: Record<string, string> = {
    full: 'Full Payment', deposit: 'Advance / Deposit', partial: 'Partial Payment',
  };
  const fmt = new Intl.NumberFormat('en-LK', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#F7F7F6;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F6;padding:40px 16px;">
<tr><td align="center"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
  <tr><td style="background:#0D0D0D;padding:30px 40px 22px;">
    <table><tr>
      <td style="background:linear-gradient(135deg,#5e17eb,#1800ad);width:26px;height:26px;text-align:center;vertical-align:middle;">
        <span style="color:#fff;font-size:9px;font-weight:900;">TT</span></td>
      <td style="padding-left:10px;"><p style="margin:0;color:#fff;font-size:12px;font-weight:700;">Sri Lankan TripTip</p></td>
    </tr></table>
    <p style="margin:22px 0 6px;color:#059669;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Payment Confirmed ✓</p>
    <h1 style="margin:0;color:#fff;font-size:24px;font-weight:900;line-height:1.1;">Payment Received.<br/>Your Journey Awaits.</h1>
  </td></tr>
  <tr><td style="height:3px;background:linear-gradient(to right,#059669,#0E7A45);"></td></tr>
  <tr><td style="background:#fff;padding:32px 40px;">
    <p style="margin:0 0 18px;color:#444;font-size:14px;line-height:1.7;">Dear <strong style="color:#111;">${customerName}</strong>,</p>
    <p style="margin:0 0 20px;color:#555;font-size:14px;line-height:1.7;">
      Your payment for the <strong style="color:#111;">${typeLabel[bookingType] || bookingType}</strong> booking has been received. Please keep this as your receipt.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #059669;margin-bottom:24px;">
      <tr><td colspan="2" style="background:#F0FFF8;padding:12px 18px;border-bottom:1px solid #D1FAE5;">
        <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#059669;">✓ Payment Receipt</p>
      </td></tr>
      <tr>
        <td style="padding:12px 18px;border-bottom:1px solid #E8E4DF;border-right:1px solid #E8E4DF;width:50%;">
          <p style="margin:0;font-size:9px;font-weight:700;text-transform:uppercase;color:#888;letter-spacing:2px;">Reference</p>
          <p style="margin:3px 0 0;font-size:12px;font-weight:900;color:#111;font-family:monospace;">${bookingReference}</p>
        </td>
        <td style="padding:12px 18px;border-bottom:1px solid #E8E4DF;">
          <p style="margin:0;font-size:9px;font-weight:700;text-transform:uppercase;color:#888;letter-spacing:2px;">Date</p>
          <p style="margin:3px 0 0;font-size:12px;font-weight:600;color:#111;">${today}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 18px;border-right:1px solid #E8E4DF;">
          <p style="margin:0;font-size:9px;font-weight:700;text-transform:uppercase;color:#888;letter-spacing:2px;">Amount Paid</p>
          <p style="margin:3px 0 0;font-size:20px;font-weight:900;color:#059669;">${fmt}</p>
        </td>
        <td style="padding:12px 18px;">
          <p style="margin:0;font-size:9px;font-weight:700;text-transform:uppercase;color:#888;letter-spacing:2px;">Payment Type</p>
          <p style="margin:3px 0 0;font-size:12px;font-weight:600;color:#111;">${payTypeLabel[paymentType] || paymentType}</p>
        </td>
      </tr>
      <tr><td colspan="2" style="padding:12px 18px;">
        <p style="margin:0;font-size:9px;font-weight:700;text-transform:uppercase;color:#888;letter-spacing:2px;">Transaction ID</p>
        <p style="margin:3px 0 0;font-size:11px;color:#555;font-family:monospace;">${payhereId}</p>
      </td></tr>
    </table>
    <p style="margin:0;color:#555;font-size:14px;line-height:1.7;">
      Our team will be in touch shortly with your full travel details.
      Questions? Email us at <a href="mailto:srilankantriptip@gmail.com" style="color:#5e17eb;">srilankantriptip@gmail.com</a>
    </p>
  </td></tr>
  <tr><td style="background:#0D0D0D;padding:22px 40px;">
    <p style="margin:0;color:rgba(255,255,255,0.3);font-size:11px;">Sri Lankan TripTip · srilankantriptip.com</p>
  </td></tr>
</table></td></tr></table>
</body></html>`;
}

// ── POST — PayHere notify URL ──────────────────────────────────
export async function POST(req: NextRequest) {
  // PayHere sends form-encoded data
  let formData: URLSearchParams;
  try {
    const text = await req.text();
    formData = new URLSearchParams(text);
  } catch {
    return new NextResponse('Bad Request', { status: 400 });
  }

  const merchantId      = formData.get('merchant_id')    || '';
  const orderId         = formData.get('order_id')        || '';
  const paymentId       = formData.get('payment_id')      || '';
  const payhereAmount   = formData.get('payhere_amount')  || '';
  const payhereCurrency = formData.get('payhere_currency')|| '';
  const statusCode      = formData.get('status_code')     || '';
  const md5sig          = formData.get('md5sig')          || '';

  const merchantSecret  = process.env.PAYHERE_MERCHANT_SECRET!;
  const expectedMerchant = process.env.PAYHERE_MERCHANT_ID!;

  // ── Security: verify merchant ID and hash ─────────────────
  if (merchantId !== expectedMerchant) {
    console.error('[PAYHERE] Merchant ID mismatch.');
    return new NextResponse('Forbidden', { status: 403 });
  }

  const isValid = verifyPayHereSignature(
    merchantId, orderId, payhereAmount, payhereCurrency,
    statusCode, merchantSecret, md5sig
  );

  if (!isValid) {
    console.error('[PAYHERE] Invalid hash — possible tampering.');
    return new NextResponse('Forbidden', { status: 403 });
  }

  // Status codes: 2 = success, 0 = pending, -1 = cancelled, -2 = failed, -3 = chargedback
  const isPaid     = statusCode === '2';
  const isCancelled = statusCode === '-1';
  const isFailed   = statusCode === '-2' || statusCode === '-3';

  // ── Load payment record by PayHere order ID ───────────────
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: payment } = await admin
    .from('booking_payments')
    .select('*')
    .eq('payhere_order_id', orderId)
    .single();

  if (!payment) {
    console.error(`[PAYHERE] No payment found for order ${orderId}`);
    return new NextResponse('Not Found', { status: 404 });
  }

  // ── Idempotency: don't process same payment_id twice ──────
  if (payment.payhere_payment_id === paymentId && payment.status === 'paid') {
    console.log(`[PAYHERE] Already processed payment ${paymentId} — skipping.`);
    return new NextResponse('OK', { status: 200 });
  }

  // ── Amount verification ───────────────────────────────────
  const notifiedAmount  = parseFloat(payhereAmount);
  const expectedAmount  = parseFloat(Number(payment.amount).toFixed(2));
  if (Math.abs(notifiedAmount - expectedAmount) > 0.01) {
    console.error(`[PAYHERE] Amount mismatch: expected ${expectedAmount}, got ${notifiedAmount}`);
    return new NextResponse('Amount Mismatch', { status: 400 });
  }

  // ── Determine new status ──────────────────────────────────
  const newStatus = isPaid ? 'paid' : isCancelled ? 'cancelled' : 'failed';

  // ── Update payment record ─────────────────────────────────
  await admin
    .from('booking_payments')
    .update({
      status:             newStatus,
      payhere_payment_id: paymentId,
      payhere_raw:        Object.fromEntries(formData.entries()),
      paid_at:            isPaid ? new Date().toISOString() : null,
    })
    .eq('id', payment.id);

  if (isPaid) {
    // ── Update booking: accumulate paid amount + update status ─
    const tableMap: Record<string, string> = {
      taxi:   'taxi_bookings',
      tour:   'tour_bookings',
      custom: 'custom_tour_bookings',
    };

    // Load current booking to accumulate
    const { data: booking } = await admin
      .from(tableMap[payment.booking_type])
      .select('total_paid_amount, latest_quote_amount')
      .eq('id', payment.booking_id)
      .single();

    const newTotalPaid  = (Number(booking?.total_paid_amount) || 0) + notifiedAmount;
    const quoteAmount   = Number(booking?.latest_quote_amount) || 0;
    const newPayStatus  = quoteAmount > 0 && newTotalPaid >= quoteAmount ? 'paid' : 'partial';
    const newBookStatus = newPayStatus === 'paid' ? 'paid' : 'partially_paid';

    await admin
      .from(tableMap[payment.booking_type])
      .update({
        total_paid_amount: newTotalPaid,
        payment_status:    newPayStatus,
        status:            newBookStatus,
      })
      .eq('id', payment.booking_id);

    // ── Send payment confirmation email ───────────────────────
    const resend = new Resend(process.env.RESEND_API_KEY!);

    const { error: emailErr } = await resend.emails.send({
      from:    'TripTip Bookings <bookings@notifications.srilankantriptip.com>',
      to:      [payment.customer_email],
      subject: `Payment Confirmed — ${payment.booking_reference || payment.booking_id} | Sri Lankan TripTip`,
      html:    paymentConfirmedHtml(
        payment.customer_name,
        payment.booking_reference || payment.booking_id,
        payment.booking_type,
        payment.currency,
        notifiedAmount,
        payment.payment_type,
        paymentId
      ),
    });

    if (emailErr) console.error('[PAYHERE] Confirmation email error:', emailErr);

    // Notify admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await resend.emails.send({
        from:    'TripTip System <system@notifications.srilankantriptip.com>',
        to:      [adminEmail],
        subject: `[Payment Received] ${payment.booking_reference} — ${payment.currency} ${notifiedAmount}`,
        html: `<p style="font-family:Arial;font-size:14px;color:#111;">
          Payment of <strong>${payment.currency} ${notifiedAmount}</strong> received from
          <strong>${payment.customer_name}</strong> for booking
          <strong>${payment.booking_reference}</strong>.<br/><br/>
          PayHere Transaction ID: <code>${paymentId}</code><br/><br/>
          <a href="${process.env.NEXT_PUBLIC_ADMIN_URL}/bookings/${payment.booking_type}/${payment.booking_id}"
            style="color:#5e17eb;">View in Admin Panel →</a>
        </p>`,
      });
    }
  }

  // PayHere expects a 200 OK
  return new NextResponse('OK', { status: 200 });
}
