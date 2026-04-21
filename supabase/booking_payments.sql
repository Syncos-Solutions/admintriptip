-- supabase/booking_payments.sql

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

  -- PayHere fields
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

-- Trigger
CREATE OR REPLACE FUNCTION update_booking_payments_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER handle_booking_payments_updated_at
  BEFORE UPDATE ON public.booking_payments
  FOR EACH ROW EXECUTE FUNCTION update_booking_payments_updated_at();

-- RLS
ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated full access to booking_payments"
  ON public.booking_payments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS booking_payments_booking_id_idx    ON public.booking_payments (booking_id);
CREATE INDEX IF NOT EXISTS booking_payments_token_idx         ON public.booking_payments (payment_link_token);
CREATE INDEX IF NOT EXISTS booking_payments_payhere_order_idx ON public.booking_payments (payhere_order_id);
CREATE INDEX IF NOT EXISTS booking_payments_status_idx        ON public.booking_payments (status);
