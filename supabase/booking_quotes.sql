-- supabase/booking_quotes.sql
-- Run in Supabase SQL editor or via CLI: supabase db push

-- ── Create booking_quotes table ────────────────────────────────
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

-- ── Trigger: auto-update updated_at ────────────────────────────
CREATE OR REPLACE FUNCTION update_booking_quotes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER handle_booking_quotes_updated_at
  BEFORE UPDATE ON public.booking_quotes
  FOR EACH ROW EXECUTE FUNCTION update_booking_quotes_updated_at();

-- ── Row Level Security ─────────────────────────────────────────
ALTER TABLE public.booking_quotes ENABLE ROW LEVEL SECURITY;

-- Admin (authenticated users) can do everything
CREATE POLICY "Authenticated full access to booking_quotes"
  ON public.booking_quotes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Anon users: no direct access (main site uses service_role key via API route)
-- No anon SELECT policy → anon cannot read quotes

-- ── Indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS booking_quotes_booking_id_idx ON public.booking_quotes (booking_id);
CREATE INDEX IF NOT EXISTS booking_quotes_token_idx       ON public.booking_quotes (confirmation_token);
CREATE INDEX IF NOT EXISTS booking_quotes_status_idx      ON public.booking_quotes (status);
