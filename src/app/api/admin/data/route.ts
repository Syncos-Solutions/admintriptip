// src/app/api/admin/data/route.ts
// Central server-side data API — dashboard + all-bookings list.
// Uses service_role key → bypasses RLS. Auth-gated via session cookie.
//
// FIX: Supabase's TypeScript client can't infer types from dynamic select
// strings at compile time — it produces a ParserError type. Each query now
// uses a fixed, literal select string and the result is cast to a plain
// typed interface immediately, keeping TypeScript happy throughout.

import { NextRequest, NextResponse }         from 'next/server';
import { createServerClient, CookieOptions } from '@supabase/ssr';
import { cookies }                           from 'next/headers';
import { createClient }                      from '@supabase/supabase-js';

// ── Plain row interfaces ─────────────────────────────────────
// These are what the DB returns for admin list views.
// We never rely on Supabase's generic inference here.

interface BookingBaseRow {
  id:                    string;
  booking_reference:     string;
  created_at:            string;
  status:                string;
  email:                 string;
  viewed_at:             string | null;
  total_paid_amount:     number | null;
  latest_quote_amount:   number | null;
  latest_quote_currency: string | null;
  payment_status:        string | null;
}

interface TaxiTourRow extends BookingBaseRow {
  full_name: string;
}

interface CustomRow extends BookingBaseRow {
  first_name: string;
  last_name:  string;
}

interface TaxiTourDashRow {
  id:                string;
  booking_reference: string;
  created_at:        string;
  status:            string;
  email:             string;
  viewed_at:         string | null;
  total_paid_amount: number | null;
  full_name:         string;
}

interface CustomDashRow {
  id:                string;
  booking_reference: string;
  created_at:        string;
  status:            string;
  email:             string;
  viewed_at:         string | null;
  total_paid_amount: number | null;
  first_name:        string;
  last_name:         string;
}

// ── Auth helper ──────────────────────────────────────────────
async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(_: { name: string; value: string; options?: CookieOptions }[]) {},
      },
    },
  );
  const { data: { user } } = await sb.auth.getUser();
  return !!user;
}

// ── Service-role DB client ───────────────────────────────────
function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sp     = new URL(req.url).searchParams;
  const action = sp.get('action') || '';
  const db     = adminDb();

  // ───────────────────────────────────────────────────────────
  // DASHBOARD
  // ───────────────────────────────────────────────────────────
  if (action === 'dashboard') {

    const DASH_BASE = 'id,booking_reference,created_at,status,email,viewed_at,total_paid_amount';

    const [t, to, cu, pays] = await Promise.all([

      db.from('taxi_bookings')
        .select(`${DASH_BASE},full_name`)
        .order('created_at', { ascending: false }),

      db.from('tour_bookings')
        .select(`${DASH_BASE},full_name`)
        .order('created_at', { ascending: false }),

      db.from('custom_tour_bookings')
        .select(`${DASH_BASE},first_name,last_name`)
        .order('created_at', { ascending: false }),

      db.from('booking_payments')
        .select('id,created_at,paid_at,amount,currency,customer_name,customer_email,booking_reference,status')
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })
        .limit(20),
    ]);

    // Cast to our interfaces — avoids Supabase ParserError propagation
    return NextResponse.json({
      taxi:     (t.data    as unknown as TaxiTourDashRow[]) || [],
      tour:     (to.data   as unknown as TaxiTourDashRow[]) || [],
      custom:   (cu.data   as unknown as CustomDashRow[])   || [],
      payments: pays.data || [],
    });
  }

  // ───────────────────────────────────────────────────────────
  // ALL BOOKINGS — merged, filtered, paginated
  // ───────────────────────────────────────────────────────────
  if (action === 'bookings_all') {
    const typeF   = sp.get('type')   || '';
    const statusF = sp.get('status') || '';
    const search  = sp.get('search') || '';
    const page    = Math.max(1, parseInt(sp.get('page') || '1'));
    const size    = Math.min(50, parseInt(sp.get('size') || '20'));

    // Fixed select strings — no dynamic column injection
    const TAXI_TOUR_COLS = [
      'id', 'booking_reference', 'created_at', 'status', 'email',
      'viewed_at', 'latest_quote_amount', 'latest_quote_currency',
      'payment_status', 'total_paid_amount', 'full_name',
    ].join(',');

    const CUSTOM_COLS = [
      'id', 'booking_reference', 'created_at', 'status', 'email',
      'viewed_at', 'latest_quote_amount', 'latest_quote_currency',
      'payment_status', 'total_paid_amount', 'first_name', 'last_name',
    ].join(',');

    // ── Taxi ──
    let taxiRows: TaxiTourRow[] = [];
    if (!typeF || typeF === 'taxi') {
      let q = db.from('taxi_bookings').select(TAXI_TOUR_COLS);
      if (statusF) q = q.eq('status', statusF) as typeof q;
      if (search)  q = q.or(
        `booking_reference.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%`,
      ) as typeof q;
      const { data } = await q.order('created_at', { ascending: false }).limit(500);
      taxiRows = (data as unknown as TaxiTourRow[]) || [];
    }

    // ── Tours ──
    let tourRows: TaxiTourRow[] = [];
    if (!typeF || typeF === 'tour') {
      let q = db.from('tour_bookings').select(TAXI_TOUR_COLS);
      if (statusF) q = q.eq('status', statusF) as typeof q;
      if (search)  q = q.or(
        `booking_reference.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%`,
      ) as typeof q;
      const { data } = await q.order('created_at', { ascending: false }).limit(500);
      tourRows = (data as unknown as TaxiTourRow[]) || [];
    }

    // ── Custom ──
    let customRows: CustomRow[] = [];
    if (!typeF || typeF === 'custom') {
      let q = db.from('custom_tour_bookings').select(CUSTOM_COLS);
      if (statusF) q = q.eq('status', statusF) as typeof q;
      if (search)  q = q.or(
        `booking_reference.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`,
      ) as typeof q;
      const { data } = await q.order('created_at', { ascending: false }).limit(500);
      customRows = (data as unknown as CustomRow[]) || [];
    }

    // ── Merge & shape ──
    interface MergedRow {
      id:                string;
      booking_reference: string;
      type:              string;
      customer_name:     string;
      customer_email:    string;
      created_at:        string;
      travel_date:       string | null;
      status:            string;
      quote_amount:      number | null;
      quote_currency:    string | null;
      payment_status:    string | null;
      total_paid:        number | null;
      is_new:            boolean;
    }

    const merged: MergedRow[] = [
      ...taxiRows.map(b => ({
        id:                b.id,
        booking_reference: b.booking_reference,
        type:              'taxi',
        customer_name:     b.full_name || '',
        customer_email:    b.email     || '',
        created_at:        b.created_at,
        travel_date:       null,
        status:            b.status,
        quote_amount:      b.latest_quote_amount   ?? null,
        quote_currency:    b.latest_quote_currency ?? null,
        payment_status:    b.payment_status        ?? null,
        total_paid:        b.total_paid_amount      ?? null,
        is_new:            !b.viewed_at,
      })),
      ...tourRows.map(b => ({
        id:                b.id,
        booking_reference: b.booking_reference,
        type:              'tour',
        customer_name:     b.full_name || '',
        customer_email:    b.email     || '',
        created_at:        b.created_at,
        travel_date:       null,
        status:            b.status,
        quote_amount:      b.latest_quote_amount   ?? null,
        quote_currency:    b.latest_quote_currency ?? null,
        payment_status:    b.payment_status        ?? null,
        total_paid:        b.total_paid_amount      ?? null,
        is_new:            !b.viewed_at,
      })),
      ...customRows.map(b => ({
        id:                b.id,
        booking_reference: b.booking_reference,
        type:              'custom',
        customer_name:     `${b.first_name || ''} ${b.last_name || ''}`.trim(),
        customer_email:    b.email     || '',
        created_at:        b.created_at,
        travel_date:       null,
        status:            b.status,
        quote_amount:      b.latest_quote_amount   ?? null,
        quote_currency:    b.latest_quote_currency ?? null,
        payment_status:    b.payment_status        ?? null,
        total_paid:        b.total_paid_amount      ?? null,
        is_new:            !b.viewed_at,
      })),
    ].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    const total = merged.length;
    const rows  = merged.slice((page - 1) * size, page * size);

    return NextResponse.json({ rows, total });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}