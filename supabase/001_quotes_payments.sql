-- ============================================================
-- MIGRATION: booking_quotes + booking_payments
-- Admin Panel — Sri Lankan TripTip
-- Run in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── EXTEND BOOKING TABLES ─────────────────────────────────────
-- Add convenience columns to all 3 booking tables

ALTER TABLE public.taxi_bookings
  ADD COLUMN IF NOT EXISTS viewed_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes           TEXT,
  ADD COLUMN IF NOT EXISTS quote_status          TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS latest_quote_amount   NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS latest_quote_currency TEXT DEFAULT 'LKR',
  ADD COLUMN IF NOT EXISTS payment_status        TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS total_paid_amount     NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.tour_bookings
  ADD COLUMN IF NOT EXISTS viewed_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes           TEXT,
  ADD COLUMN IF NOT EXISTS quote_status          TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS latest_quote_amount   NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS latest_quote_currency TEXT DEFAULT 'LKR',
  ADD COLUMN IF NOT EXISTS payment_status        TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS total_paid_amount     NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.custom_tour_bookings
  ADD COLUMN IF NOT EXISTS viewed_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS admin_notes           TEXT,
  ADD COLUMN IF NOT EXISTS quote_status          TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS latest_quote_amount   NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS latest_quote_currency TEXT DEFAULT 'LKR',
  ADD COLUMN IF NOT EXISTS payment_status        TEXT DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS total_paid_amount     NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assigned_architect    TEXT;

-- ── BOOKING QUOTES TABLE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.booking_quotes (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Which booking this quote is for
  booking_type         TEXT        NOT NULL CHECK (booking_type IN ('taxi','tour','custom')),
  booking_id           UUID        NOT NULL,
  booking_reference    TEXT,

  -- Customer (denormalised for email sending without joins)
  customer_email       TEXT        NOT NULL,
  customer_name        TEXT        NOT NULL,

  -- Quote details
  currency             TEXT        NOT NULL DEFAULT 'LKR',
  amount               NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  notes_admin          TEXT,

  -- Workflow
  status               TEXT        NOT NULL DEFAULT 'draft'
                                   CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  sent_at              TIMESTAMPTZ,
  accepted_at          TIMESTAMPTZ,
  expires_at           TIMESTAMPTZ,

  -- Secure token for user confirmation URL (set when sending)
  -- URL: srilankantriptip.com/quote/{id}/{confirmation_token}
  confirmation_token   TEXT        UNIQUE
);

-- Auto-update trigger
CREATE TRIGGER booking_quotes_updated_at
  BEFORE UPDATE ON public.booking_quotes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.booking_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on booking_quotes"
  ON public.booking_quotes FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_quotes_booking_id   ON public.booking_quotes (booking_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status       ON public.booking_quotes (status);
CREATE INDEX IF NOT EXISTS idx_quotes_token        ON public.booking_quotes (confirmation_token);
CREATE INDEX IF NOT EXISTS idx_quotes_customer     ON public.booking_quotes (customer_email);

COMMENT ON TABLE  public.booking_quotes             IS 'Price quotes sent to customers from admin panel';
COMMENT ON COLUMN public.booking_quotes.confirmation_token IS 'One-time token for user to confirm via main site URL';

-- ── BOOKING PAYMENTS TABLE ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.booking_payments (
  id                   UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Which booking
  booking_type         TEXT        NOT NULL CHECK (booking_type IN ('taxi','tour','custom')),
  booking_id           UUID        NOT NULL,
  booking_reference    TEXT,
  quote_id             UUID        REFERENCES public.booking_quotes(id) ON DELETE SET NULL,

  -- Customer (denormalised)
  customer_email       TEXT        NOT NULL,
  customer_name        TEXT        NOT NULL,

  -- Payment details
  currency             TEXT        NOT NULL DEFAULT 'LKR',
  amount               NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  payment_type         TEXT        NOT NULL CHECK (payment_type IN ('full','deposit','partial')),
  notes_admin          TEXT,

  -- Workflow
  status               TEXT        NOT NULL DEFAULT 'pending'
                                   CHECK (status IN ('pending','paid','failed','cancelled','refunded')),
  requested_at         TIMESTAMPTZ DEFAULT NOW(),
  paid_at              TIMESTAMPTZ,

  -- PayHere integration
  payhere_order_id     TEXT        UNIQUE,  -- our payment ID sent to PayHere
  payhere_payment_id   TEXT,               -- PayHere's own payment ID from notify
  payhere_raw          JSONB,              -- raw PayHere notify payload

  -- Secure token for public payment page URL
  -- URL: srilankantriptip.com/pay/{id}/{payment_link_token}
  payment_link_token   TEXT        UNIQUE
);

-- Auto-update trigger
CREATE TRIGGER booking_payments_updated_at
  BEFORE UPDATE ON public.booking_payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access on booking_payments"
  ON public.booking_payments FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_booking_id     ON public.booking_payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status         ON public.booking_payments (status);
CREATE INDEX IF NOT EXISTS idx_payments_token          ON public.booking_payments (payment_link_token);
CREATE INDEX IF NOT EXISTS idx_payments_payhere_order  ON public.booking_payments (payhere_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer       ON public.booking_payments (customer_email);
CREATE INDEX IF NOT EXISTS idx_payments_paid_at        ON public.booking_payments (paid_at);

COMMENT ON TABLE  public.booking_payments              IS 'Payment records with PayHere integration';
COMMENT ON COLUMN public.booking_payments.payment_link_token IS 'One-time token for public payment page URL';
COMMENT ON COLUMN public.booking_payments.payhere_order_id   IS 'Our order ID sent to PayHere checkout';
COMMENT ON COLUMN public.booking_payments.payhere_payment_id IS 'PayHere payment ID from notify callback';

-- ── ADMIN USERS TABLE (optional role tracking) ────────────────
-- Supabase Auth handles passwords; this table stores role/metadata
CREATE TABLE IF NOT EXISTS public.admin_users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  role       TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','editor')),
  full_name  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can read own record"
  ON public.admin_users FOR SELECT
  TO authenticated USING (id = auth.uid());

CREATE POLICY "Admin users full access"
  ON public.admin_users FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

COMMENT ON TABLE public.admin_users IS 'Admin panel user metadata and roles';
