// main-site-additions/app/api/payhere/checkout/route.ts
// Copy to main site: app/api/payhere/checkout/route.ts
// Generates PayHere hash server-side — merchant secret NEVER exposed to browser.

import { NextRequest, NextResponse } from 'next/server';
import crypto                        from 'crypto';

export async function POST(req: NextRequest) {
  // ── Basic size guard ──────────────────────────────────────
  const cl = req.headers.get('content-length');
  if (cl && parseInt(cl) > 512) {
    return NextResponse.json({ error: 'Too large.' }, { status: 413 });
  }

  let body: { orderId: string; amount: number; currency: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const { orderId, amount, currency } = body;
  if (!orderId || !amount || !currency) {
    return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
  }

  const merchantId     = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  const siteUrl        = process.env.NEXT_PUBLIC_SITE_URL || 'https://srilankantriptip.com';

  if (!merchantId || !merchantSecret) {
    console.error('[PAYHERE] Missing PAYHERE_MERCHANT_ID or PAYHERE_MERCHANT_SECRET');
    return NextResponse.json({ error: 'Payment configuration error.' }, { status: 500 });
  }

  // ── Generate PayHere hash ─────────────────────────────────
  // Hash = MD5(merchant_id + order_id + amount + currency + MD5(secret).toUpperCase())
  const secretMd5   = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
  const amountStr   = Number(amount).toFixed(2);
  const rawString   = `${merchantId}${orderId}${amountStr}${currency}${secretMd5}`;
  const hash        = crypto.createHash('md5').update(rawString).digest('hex').toUpperCase();

  return NextResponse.json({
    hash,
    returnUrl:  `${siteUrl}/payment/success`,
    cancelUrl:  `${siteUrl}/payment/cancel`,
    notifyUrl:  `${siteUrl}/api/payhere/notify`,
  });
}
