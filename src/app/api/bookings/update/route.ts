// src/app/api/bookings/update/route.ts
// PATCH — update status, notes, architect, or viewed_at for any booking type.
// Uses service_role key so it works regardless of RLS policies.

import { NextRequest, NextResponse }          from 'next/server';
import { createServerClient, CookieOptions }  from '@supabase/ssr';
import { cookies }                            from 'next/headers';
import { createClient }                       from '@supabase/supabase-js';

const TABLE_MAP: Record<string, string> = {
  taxi:   'taxi_bookings',
  tour:   'tour_bookings',
  custom: 'custom_tour_bookings',
};

// Whitelist every field the admin pages are allowed to write
const ALLOWED_FIELDS = [
  'status',
  'admin_notes',
  'assigned_architect',
  'viewed_at',
];

export async function PATCH(req: NextRequest) {

  // ── Auth: verify admin session from cookie ────────────────
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(_: { name: string; value: string; options?: CookieOptions }[]) {},
      },
    },
  );

  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { booking_type, booking_id, ...updates } = body;

  if (typeof booking_type !== 'string' || !TABLE_MAP[booking_type]) {
    return NextResponse.json({ error: `Invalid booking_type: ${booking_type}` }, { status: 400 });
  }
  if (typeof booking_id !== 'string' || !booking_id) {
    return NextResponse.json({ error: 'Missing booking_id.' }, { status: 400 });
  }

  // Build whitelisted payload
  const payload: Record<string, unknown> = {};
  for (const key of ALLOWED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      payload[key] = updates[key] ?? null;
    }
  }

  if (Object.keys(payload).length === 0) {
    // Nothing to update — treat as success (idempotent)
    return NextResponse.json({ success: true, skipped: true });
  }

  // ── Service-role write — bypasses RLS entirely ────────────
  const adminDb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { error } = await adminDb
    .from(TABLE_MAP[booking_type])
    .update(payload)
    .eq('id', booking_id);

  if (error) {
    console.error(`[BOOKING UPDATE] ${booking_type}/${booking_id}:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}