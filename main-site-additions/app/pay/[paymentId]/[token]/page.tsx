// main-site-additions/app/pay/[paymentId]/[token]/page.tsx
// Copy to main site: app/pay/[paymentId]/[token]/page.tsx

import { createClient } from '@supabase/supabase-js';
import { notFound }     from 'next/navigation';
import PaymentPageClient from './PaymentPageClient';

interface PageProps {
  params: { paymentId: string; token: string };
}

export default async function PaymentPage({ params }: PageProps) {
  const { paymentId, token } = params;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: payment } = await admin
    .from('booking_payments')
    .select('*')
    .eq('id', paymentId)
    .eq('payment_link_token', token)
    .single();

  if (!payment) return notFound();

  const tableMap: Record<string, string> = {
    taxi: 'taxi_bookings', tour: 'tour_bookings', custom: 'custom_tour_bookings',
  };
  const { data: booking } = await admin
    .from(tableMap[payment.booking_type as string] || 'taxi_bookings')
    .select('*')
    .eq('id', payment.booking_id)
    .single();

  const merchantId = process.env.PAYHERE_MERCHANT_ID || '';
  const isSandbox  = process.env.PAYHERE_SANDBOX !== 'false';
  const completed  = payment.status !== 'pending';

  return (
    <PaymentPageClient
      payment={payment as Record<string, unknown>}
      booking={booking as Record<string, unknown> | null}
      merchantId={merchantId}
      isSandbox={isSandbox}
      completed={completed}
    />
  );
}
