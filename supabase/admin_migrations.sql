-- ============================================================
-- MIGRATION: booking_quotes + booking_payments
-- Admin panel: supabase/admin_migrations.sql
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── BOOKING QUOTES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.booking_quotes (
  id                   UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           TIMESTAMPTZ  DEFAULT NOW() NOT NULL,
  updated_at           TIMESTAMPTZ  DEFAULT NOW() NOT NULL,

  booking_type         TEXT         NOT NULL CHECK (booking_type IN ('taxi','tour','custom')),
  booking_id           UUID         NOT NULL,
  booking_reference    TEXT,

  currency             TEXT         DEFAULT 'LKR' NOT NULL,
  amount               NUMERIC(12,2) NOT NULL,

  status               TEXT         DEFAULT 'draft' NOT NULL
                                    CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  sent_at              TIMESTAMPTZ,
  accepted_at          TIMESTAMPTZ,
  expires_at           TIMESTAMPTZ,

  -- Secure token used in confirmation URL
  confirmation_token   TEXT UNIQUE,

  customer_email       TEXT         NOT NULL,
  customer_name        TEXT         NOT NULL,
  notes_admin          TEXT
);

CREATE TRIGGER booking_quotes_updated_at
  BEFORE UPDATE ON public.booking_quotes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.booking_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to quotes"
  ON public.booking_quotes FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_quotes_booking_id    ON public.booking_quotes (booking_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status         ON public.booking_quotes (status);
CREATE INDEX IF NOT EXISTS idx_quotes_confirm_token  ON public.booking_quotes (confirmation_token);

COMMENT ON TABLE  public.booking_quotes IS 'Price quotes sent to customers for all booking types';
COMMENT ON COLUMN public.booking_quotes.confirmation_token IS 'Secure random string used in quote confirmation URL';


-- ── BOOKING PAYMENTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.booking_payments (
  id                   UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           TIMESTAMPTZ  DEFAULT NOW() NOT NULL,
  updated_at           TIMESTAMPTZ  DEFAULT NOW() NOT NULL,

  booking_type         TEXT         NOT NULL CHECK (booking_type IN ('taxi','tour','custom')),
  booking_id           UUID         NOT NULL,
  booking_reference    TEXT,
  quote_id             UUID         REFERENCES public.booking_quotes(id) ON DELETE SET NULL,

  currency             TEXT         DEFAULT 'LKR' NOT NULL,
  amount               NUMERIC(12,2) NOT NULL,

  payment_type         TEXT         DEFAULT 'full' NOT NULL
                                    CHECK (payment_type IN ('full','deposit','partial')),
  status               TEXT         DEFAULT 'pending' NOT NULL
                                    CHECK (status IN ('pending','paid','failed','cancelled','refunded')),

  -- PayHere fields
  payhere_order_id     TEXT UNIQUE,
  payhere_payment_id   TEXT,
  payhere_raw          JSONB,

  requested_at         TIMESTAMPTZ  DEFAULT NOW(),
  paid_at              TIMESTAMPTZ,

  customer_email       TEXT         NOT NULL,
  customer_name        TEXT         NOT NULL,

  -- Secure token used in payment link URL
  payment_link_token   TEXT UNIQUE,

  notes_admin          TEXT
);

CREATE TRIGGER booking_payments_updated_at
  BEFORE UPDATE ON public.booking_payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to payments"
  ON public.booking_payments FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id    ON public.booking_payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status        ON public.booking_payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_link_token    ON public.booking_payments (payment_link_token);
CREATE INDEX IF NOT EXISTS idx_payments_ph_order      ON public.booking_payments (payhere_order_id);

COMMENT ON TABLE  public.booking_payments IS 'Payment requests and PayHere transaction records';
COMMENT ON COLUMN public.booking_payments.payment_link_token IS 'Secure random token used in public payment link URL';
COMMENT ON COLUMN public.booking_payments.payhere_raw IS 'Raw PayHere notify_url payload for audit trail';


-- ── ADD CONVENIENCE COLUMNS TO BOOKING TABLES ────────────────
-- These allow fast filtering without joining quotes/payments.
-- Nullable — updated by admin API routes when quotes/payments change.

ALTER TABLE public.taxi_bookings
  ADD COLUMN IF NOT EXISTS viewed_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes         TEXT,
  ADD COLUMN IF NOT EXISTS quote_status        TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS latest_quote_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS latest_quote_currency TEXT DEFAULT 'LKR',
  ADD COLUMN IF NOT EXISTS payment_status      TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS total_paid_amount   NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.tour_bookings
  ADD COLUMN IF NOT EXISTS viewed_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes         TEXT,
  ADD COLUMN IF NOT EXISTS quote_status        TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS latest_quote_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS latest_quote_currency TEXT DEFAULT 'LKR',
  ADD COLUMN IF NOT EXISTS payment_status      TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS total_paid_amount   NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.custom_tour_bookings
  ADD COLUMN IF NOT EXISTS viewed_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS quote_status        TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS latest_quote_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS latest_quote_currency TEXT DEFAULT 'LKR',
  ADD COLUMN IF NOT EXISTS payment_status      TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS total_paid_amount   NUMERIC(12,2) DEFAULT 0;


-- ── ALLOW AUTHENTICATED FULL ACCESS ON BOOKING TABLES ────────
-- Existing RLS only allowed certain operations. We add full admin access.

CREATE POLICY IF NOT EXISTS "Admin select all taxi bookings"
  ON public.taxi_bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Admin update taxi bookings"
  ON public.taxi_bookings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Admin select all tour bookings"
  ON public.tour_bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Admin update tour bookings"
  ON public.tour_bookings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Admin select all custom bookings"
  ON public.custom_tour_bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "Admin update custom bookings"
  ON public.custom_tour_bookings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
