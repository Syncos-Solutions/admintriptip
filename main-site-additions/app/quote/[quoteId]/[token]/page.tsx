// main-site-additions/app/quote/[quoteId]/[token]/page.tsx
// Copy this file to the main site repo at:
// app/quote/[quoteId]/[token]/page.tsx

import { createClient } from '@supabase/supabase-js';
import { notFound, redirect } from 'next/navigation';
import QuoteConfirmClient from './QuoteConfirmClient';

interface PageProps {
  params: { quoteId: string; token: string };
}

export default async function QuoteConfirmPage({ params }: PageProps) {
  const { quoteId, token } = params;

  // Server-side load with service_role (bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: quote } = await supabase
    .from('booking_quotes')
    .select('*')
    .eq('id', quoteId)
    .eq('confirmation_token', token)
    .single();

  if (!quote) return notFound();
  if (quote.status === 'accepted') {
    // Already confirmed — show success
    return <QuoteConfirmClient quote={quote} alreadyConfirmed />;
  }
  if (quote.status !== 'sent') return notFound();
  if (quote.expires_at && new Date(quote.expires_at) < new Date()) {
    return <QuoteConfirmClient quote={quote} expired />;
  }

  // Load booking details
  const tableMap: Record<string, string> = {
    taxi:   'taxi_bookings',
    tour:   'tour_bookings',
    custom: 'custom_tour_bookings',
  };
  const { data: booking } = await supabase
    .from(tableMap[quote.booking_type])
    .select('*')
    .eq('id', quote.booking_id)
    .single();

  return <QuoteConfirmClient quote={quote} booking={booking} />;
}
