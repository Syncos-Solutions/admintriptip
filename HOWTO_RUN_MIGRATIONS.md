# How to Run the SQL Migrations

You only need to do this **once**. These migrations add the columns and tables that the admin panel needs.

---

## Step 1 — Open Supabase SQL Editor

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click your project → **SQL Editor** in the left sidebar
3. Click **+ New query**

---

## Step 2 — Run the first file: `booking_tables_update.sql`

This adds the new tracking columns (`viewed_at`, `admin_notes`, `quote_status`, `payment_status`, `total_paid_amount`) to your **existing** 3 booking tables.

1. Open the file `supabase/booking_tables_update.sql` from this repo
2. Select **all** the text (Ctrl+A / Cmd+A)
3. Paste it into the Supabase SQL Editor
4. Click **Run** (▶)
5. You should see: `Success. No rows returned`

---

## Step 3 — Run the second file: `booking_quotes.sql`

This creates the new `booking_quotes` table.

1. Click **+ New query** again (fresh editor)
2. Open `supabase/booking_quotes.sql`, select all, paste, click **Run**

---

## Step 4 — Run the third file: `booking_payments.sql`

This creates the new `booking_payments` table.

1. Click **+ New query** again
2. Open `supabase/booking_payments.sql`, select all, paste, click **Run**

---

## That's it ✓

After running all 3 files:
- ✅ Status changes will work in booking detail pages
- ✅ Quotes table is ready to receive quote records
- ✅ Payments table is ready for payment records
- ✅ `viewed_at` tracking works (New dot disappears after opening)

---

## If you see an error

| Error message | Fix |
|---|---|
| `column already exists` | Safe to ignore — the SQL uses `IF NOT EXISTS` |
| `relation already exists` | Safe to ignore — table already created |
| `permission denied` | Make sure you're using the **SQL Editor** in the Supabase Dashboard, not the CLI |
| `policy already exists` | Safe to ignore |
