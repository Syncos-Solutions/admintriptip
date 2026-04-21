-- ================================================================
-- STEP 1 OF 3 — booking_tables_update.sql
-- Run this FIRST in: Supabase Dashboard → SQL Editor → New query
-- ================================================================
-- What this does:
--   • Adds admin tracking columns to your 3 existing booking tables
--   • Fixes RLS so admin users can READ and UPDATE all bookings
-- ================================================================

-- ── taxi_bookings ─────────────────────────────────────────────
ALTER TABLE public.taxi_bookings
  ADD COLUMN IF NOT EXISTS viewed_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes           TEXT,
  ADD COLUMN IF NOT EXISTS quote_status          TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS latest_quote_amount   NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS latest_quote_currency TEXT DEFAULT 'LKR',
  ADD COLUMN IF NOT EXISTS payment_status        TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS total_paid_amount     NUMERIC(14,2) DEFAULT 0;

-- ── tour_bookings ─────────────────────────────────────────────
ALTER TABLE public.tour_bookings
  ADD COLUMN IF NOT EXISTS viewed_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes           TEXT,
  ADD COLUMN IF NOT EXISTS quote_status          TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS latest_quote_amount   NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS latest_quote_currency TEXT DEFAULT 'LKR',
  ADD COLUMN IF NOT EXISTS payment_status        TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS total_paid_amount     NUMERIC(14,2) DEFAULT 0;

-- ── custom_tour_bookings ──────────────────────────────────────
ALTER TABLE public.custom_tour_bookings
  ADD COLUMN IF NOT EXISTS viewed_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes           TEXT,
  ADD COLUMN IF NOT EXISTS assigned_architect    TEXT,
  ADD COLUMN IF NOT EXISTS quote_status          TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS latest_quote_amount   NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS latest_quote_currency TEXT DEFAULT 'LKR',
  ADD COLUMN IF NOT EXISTS payment_status        TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS total_paid_amount     NUMERIC(14,2) DEFAULT 0;

-- ================================================================
-- FIX RLS — allow authenticated admin users to read + update
-- ================================================================

-- SELECT policies (READ — this is what was causing bookings to not show)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'taxi_bookings' AND policyname = 'Admin read taxi_bookings'
  ) THEN
    CREATE POLICY "Admin read taxi_bookings"
      ON public.taxi_bookings FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tour_bookings' AND policyname = 'Admin read tour_bookings'
  ) THEN
    CREATE POLICY "Admin read tour_bookings"
      ON public.tour_bookings FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'custom_tour_bookings' AND policyname = 'Admin read custom_tour_bookings'
  ) THEN
    CREATE POLICY "Admin read custom_tour_bookings"
      ON public.custom_tour_bookings FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- UPDATE policies (WRITE — for status changes, admin notes, etc.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'taxi_bookings' AND policyname = 'Admin update taxi_bookings'
  ) THEN
    CREATE POLICY "Admin update taxi_bookings"
      ON public.taxi_bookings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tour_bookings' AND policyname = 'Admin update tour_bookings'
  ) THEN
    CREATE POLICY "Admin update tour_bookings"
      ON public.tour_bookings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'custom_tour_bookings' AND policyname = 'Admin update custom_tour_bookings'
  ) THEN
    CREATE POLICY "Admin update custom_tour_bookings"
      ON public.custom_tour_bookings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ── Verify it worked (you should see 6 rows) ──────────────────
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE tablename IN ('taxi_bookings','tour_bookings','custom_tour_bookings')
  AND roles = '{authenticated}'
ORDER BY tablename, cmd;
