-- supabase/booking_tables_update.sql
-- Adds tracking columns to existing booking tables.
-- Safe to run multiple times (uses IF NOT EXISTS).

-- ─────────────────────────────────────────────────────────────
-- taxi_bookings
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.taxi_bookings
  ADD COLUMN IF NOT EXISTS viewed_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes           TEXT,
  ADD COLUMN IF NOT EXISTS quote_status          TEXT DEFAULT 'none'
    CHECK (quote_status IN ('none','sent','accepted','rejected')),
  ADD COLUMN IF NOT EXISTS latest_quote_amount   NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS latest_quote_currency TEXT DEFAULT 'LKR',
  ADD COLUMN IF NOT EXISTS payment_status        TEXT DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','partial','paid')),
  ADD COLUMN IF NOT EXISTS total_paid_amount     NUMERIC(14,2) DEFAULT 0;

-- ─────────────────────────────────────────────────────────────
-- tour_bookings
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.tour_bookings
  ADD COLUMN IF NOT EXISTS viewed_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes           TEXT,
  ADD COLUMN IF NOT EXISTS quote_status          TEXT DEFAULT 'none'
    CHECK (quote_status IN ('none','sent','accepted','rejected')),
  ADD COLUMN IF NOT EXISTS latest_quote_amount   NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS latest_quote_currency TEXT DEFAULT 'LKR',
  ADD COLUMN IF NOT EXISTS payment_status        TEXT DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','partial','paid')),
  ADD COLUMN IF NOT EXISTS total_paid_amount     NUMERIC(14,2) DEFAULT 0;

-- ─────────────────────────────────────────────────────────────
-- custom_tour_bookings
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.custom_tour_bookings
  ADD COLUMN IF NOT EXISTS viewed_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes           TEXT,
  ADD COLUMN IF NOT EXISTS assigned_architect    TEXT,
  ADD COLUMN IF NOT EXISTS quote_status          TEXT DEFAULT 'none'
    CHECK (quote_status IN ('none','sent','accepted','rejected')),
  ADD COLUMN IF NOT EXISTS latest_quote_amount   NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS latest_quote_currency TEXT DEFAULT 'LKR',
  ADD COLUMN IF NOT EXISTS payment_status        TEXT DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','partial','paid')),
  ADD COLUMN IF NOT EXISTS total_paid_amount     NUMERIC(14,2) DEFAULT 0;

-- ─────────────────────────────────────────────────────────────
-- RLS additions for authenticated admin access
-- ─────────────────────────────────────────────────────────────
-- Allow authenticated users to update bookings (status, notes, etc.)

CREATE POLICY IF NOT EXISTS "Admin can update taxi_bookings"
  ON public.taxi_bookings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Admin can update tour_bookings"
  ON public.tour_bookings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Admin can update custom_tour_bookings"
  ON public.custom_tour_bookings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Admin can read all taxi_bookings"
  ON public.taxi_bookings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Admin can read all tour_bookings"
  ON public.tour_bookings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY IF NOT EXISTS "Admin can read all custom_tour_bookings"
  ON public.custom_tour_bookings
  FOR SELECT
  TO authenticated
  USING (true);
