-- ============================================================
-- FILE: supabase/STEP_1_run_this_first.sql
-- 
-- PURPOSE: Fix admin panel visibility + add tracking columns.
-- 
-- HOW TO RUN:
--   1. Go to https://supabase.com → your project
--   2. Click "SQL Editor" in left sidebar
--   3. Click "New query"
--   4. Paste this ENTIRE file
--   5. Click "Run" (green button, top right)
--   6. You should see "Success. No rows returned"
--   7. Done — refresh your admin panel
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- PART A: Fix RLS so admin (authenticated users) can read
--         and update all bookings.
--         This is WHY your bookings are invisible — the anon
--         key can INSERT (booking form works) but cannot SELECT.
-- ────────────────────────────────────────────────────────────

-- Taxi bookings
DROP POLICY IF EXISTS "Admin read taxi_bookings"   ON public.taxi_bookings;
DROP POLICY IF EXISTS "Admin update taxi_bookings" ON public.taxi_bookings;

CREATE POLICY "Admin read taxi_bookings"
  ON public.taxi_bookings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admin update taxi_bookings"
  ON public.taxi_bookings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Tour bookings
DROP POLICY IF EXISTS "Admin read tour_bookings"   ON public.tour_bookings;
DROP POLICY IF EXISTS "Admin update tour_bookings" ON public.tour_bookings;

CREATE POLICY "Admin read tour_bookings"
  ON public.tour_bookings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admin update tour_bookings"
  ON public.tour_bookings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

-- Custom tour bookings
DROP POLICY IF EXISTS "Admin read custom_tour_bookings"   ON public.custom_tour_bookings;
DROP POLICY IF EXISTS "Admin update custom_tour_bookings" ON public.custom_tour_bookings;

CREATE POLICY "Admin read custom_tour_bookings"
  ON public.custom_tour_bookings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admin update custom_tour_bookings"
  ON public.custom_tour_bookings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);


-- ────────────────────────────────────────────────────────────
-- PART B: Add new admin tracking columns to booking tables.
--         Uses "IF NOT EXISTS" — safe to run multiple times.
-- ────────────────────────────────────────────────────────────

-- taxi_bookings
ALTER TABLE public.taxi_bookings
  ADD COLUMN IF NOT EXISTS viewed_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes            TEXT,
  ADD COLUMN IF NOT EXISTS quote_status           TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS latest_quote_amount    NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS latest_quote_currency  TEXT DEFAULT 'LKR',
  ADD COLUMN IF NOT EXISTS payment_status         TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS total_paid_amount      NUMERIC(14,2) DEFAULT 0;

-- tour_bookings
ALTER TABLE public.tour_bookings
  ADD COLUMN IF NOT EXISTS viewed_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes            TEXT,
  ADD COLUMN IF NOT EXISTS quote_status           TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS latest_quote_amount    NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS latest_quote_currency  TEXT DEFAULT 'LKR',
  ADD COLUMN IF NOT EXISTS payment_status         TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS total_paid_amount      NUMERIC(14,2) DEFAULT 0;

-- custom_tour_bookings
ALTER TABLE public.custom_tour_bookings
  ADD COLUMN IF NOT EXISTS viewed_at              TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes            TEXT,
  ADD COLUMN IF NOT EXISTS assigned_architect     TEXT,
  ADD COLUMN IF NOT EXISTS quote_status           TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS latest_quote_amount    NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS latest_quote_currency  TEXT DEFAULT 'LKR',
  ADD COLUMN IF NOT EXISTS payment_status         TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS total_paid_amount      NUMERIC(14,2) DEFAULT 0;


-- ────────────────────────────────────────────────────────────
-- PART C: Create quotes + payments tables (if not yet created)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.booking_quotes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  booking_type         TEXT NOT NULL CHECK (booking_type IN ('taxi','tour','custom')),
  booking_id           UUID NOT NULL,
  booking_reference    TEXT,
  currency             TEXT NOT NULL DEFAULT 'LKR',
  amount               NUMERIC(14,2) NOT NULL,
  status               TEXT NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  sent_at              TIMESTAMPTZ,
  accepted_at          TIMESTAMPTZ,
  expires_at           TIMESTAMPTZ,
  confirmation_token   TEXT UNIQUE,
  customer_email       TEXT NOT NULL,
  customer_name        TEXT NOT NULL,
  notes_admin          TEXT
);

CREATE TABLE IF NOT EXISTS public.booking_payments (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  booking_type         TEXT NOT NULL CHECK (booking_type IN ('taxi','tour','custom')),
  booking_id           UUID NOT NULL,
  booking_reference    TEXT,
  quote_id             UUID REFERENCES public.booking_quotes(id) ON DELETE SET NULL,
  currency             TEXT NOT NULL DEFAULT 'LKR',
  amount               NUMERIC(14,2) NOT NULL,
  payment_type         TEXT NOT NULL DEFAULT 'full'
                         CHECK (payment_type IN ('full','deposit','partial')),
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','paid','failed','cancelled','refunded')),
  payhere_order_id     TEXT UNIQUE,
  payhere_payment_id   TEXT,
  payhere_raw          JSONB,
  requested_at         TIMESTAMPTZ DEFAULT NOW(),
  paid_at              TIMESTAMPTZ,
  customer_email       TEXT NOT NULL,
  customer_name        TEXT NOT NULL,
  payment_link_token   TEXT UNIQUE,
  notes_admin          TEXT
);

-- RLS for new tables
ALTER TABLE public.booking_quotes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full booking_quotes"   ON public.booking_quotes;
DROP POLICY IF EXISTS "Admin full booking_payments" ON public.booking_payments;

CREATE POLICY "Admin full booking_quotes"
  ON public.booking_quotes FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Admin full booking_payments"
  ON public.booking_payments FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS bq_booking_id_idx ON public.booking_quotes  (booking_id);
CREATE INDEX IF NOT EXISTS bq_token_idx      ON public.booking_quotes  (confirmation_token);
CREATE INDEX IF NOT EXISTS bp_booking_id_idx ON public.booking_payments(booking_id);
CREATE INDEX IF NOT EXISTS bp_token_idx      ON public.booking_payments(payment_link_token);
CREATE INDEX IF NOT EXISTS bp_order_idx      ON public.booking_payments(payhere_order_id);

-- ────────────────────────────────────────────────────────────
-- Done. Refresh your admin panel — bookings will now appear.
-- ────────────────────────────────────────────────────────────
