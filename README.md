# Sri Lankan TripTip — Admin Panel

Separate Next.js 14 admin application deployed at `admin.srilankantriptip.com`.

---

## Quick Setup

### 1. Clone & Install
```bash
git clone <your-admin-repo>
cd srilankantriptip-admin
npm install
```

### 2. Environment Variables
Copy `.env.local.example` to `.env.local` and fill in all values:
```bash
cp .env.local.example .env.local
```

All variables required:
| Variable                       | Description                          |
|-------------------------------|--------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`    | Your Supabase project URL            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key                 |
| `SUPABASE_SERVICE_ROLE_KEY`   | Supabase service role (server only) |
| `RESEND_API_KEY`              | Resend API key for emails           |
| `NEXT_PUBLIC_SITE_URL`        | https://srilankantriptip.com         |
| `NEXT_PUBLIC_ADMIN_URL`       | https://admin.srilankantriptip.com  |
| `PAYHERE_MERCHANT_ID`         | PayHere merchant ID                 |
| `PAYHERE_MERCHANT_SECRET`     | PayHere secret (server only)        |
| `PAYHERE_SANDBOX`             | Set to `true` for sandbox mode      |

### 3. Run Database Migrations
Run these SQL files in your Supabase SQL Editor **in order**:
```
1. supabase/booking_tables_update.sql   ← Adds new columns to existing tables
2. supabase/booking_quotes.sql          ← Creates booking_quotes table
3. supabase/booking_payments.sql        ← Creates booking_payments table
```

### 4. Create Admin Users
In Supabase Dashboard → Authentication → Users → Invite:
- Add each admin's email
- They will receive an invite email to set a password

### 5. Run Locally
```bash
npm run dev
# Open http://localhost:3001
```

### 6. Deploy to Vercel
```bash
vercel deploy --prod
```
Set environment variables in Vercel Dashboard → Settings → Environment Variables.
Point custom domain `admin.srilankantriptip.com` to this deployment.

---

## Main Site Additions

After setting up the admin panel, copy these files to the **main site** repository:

```
main-site-additions/app/quote/[quoteId]/[token]/page.tsx           → app/quote/[quoteId]/[token]/page.tsx
main-site-additions/app/quote/[quoteId]/[token]/QuoteConfirmClient.tsx → app/quote/[quoteId]/[token]/QuoteConfirmClient.tsx
main-site-additions/app/pay/[paymentId]/[token]/page.tsx           → app/pay/[paymentId]/[token]/page.tsx
main-site-additions/app/pay/[paymentId]/[token]/PaymentPageClient.tsx → app/pay/[paymentId]/[token]/PaymentPageClient.tsx
main-site-additions/app/api/quote/route.ts                          → app/api/quote/confirm/route.ts
main-site-additions/app/api/payhere/checkout-route.ts               → app/api/payhere/checkout/route.ts
main-site-additions/app/api/payhere/notify-route.ts                 → app/api/payhere/notify/route.ts
```

Also add to main site `.env.local`:
```
PAYHERE_MERCHANT_ID=your_id
PAYHERE_MERCHANT_SECRET=your_secret
PAYHERE_SANDBOX=true
```

---

## Admin Workflow

### New Booking Arrives
1. Admin sees **New** dot on booking in list
2. Opens booking detail page
3. Reviews all customer info
4. Changes status → `Under Review`

### Sending a Quote
1. On booking detail → **Send New Quote**
2. Enter amount + currency
3. Click **Send Quote** → email sent to customer with confirm link
4. Customer visits `srilankantriptip.com/quote/[id]/[token]`
5. Customer clicks **Confirm Quote**
6. Admin sees status updated → `Quote Accepted`

### Creating a Payment Link
1. On booking detail → **Create Payment Link**
2. Choose: Full / Deposit / Partial + amount
3. Click **Send Payment Link** → email sent to customer
4. Customer visits `srilankantriptip.com/pay/[id]/[token]`
5. Checks T&C → clicks **Pay Now** → redirected to PayHere sandbox
6. PayHere calls notify URL → payment recorded automatically
7. Confirmation email sent to customer
8. Admin sees booking status → `Paid`

### Going Live with PayHere
1. Get live merchant credentials from PayHere
2. Set `PAYHERE_SANDBOX=false` in both main site and admin `.env.local`
3. Update `PAYHERE_MERCHANT_ID` and `PAYHERE_MERCHANT_SECRET` with live values
4. No code changes needed — the toggle is purely env-based

---

## File Structure

```
src/
├── app/
│   ├── login/page.tsx              ← Login page
│   ├── (admin)/
│   │   ├── layout.tsx              ← Admin shell (sidebar + topbar)
│   │   ├── dashboard/page.tsx      ← KPIs + charts
│   │   ├── bookings/
│   │   │   ├── page.tsx            ← All bookings list
│   │   │   ├── taxi/               ← Taxi list + detail
│   │   │   ├── tours/              ← Tours list + detail
│   │   │   └── custom/             ← Custom list + detail (day plans)
│   │   ├── reports/page.tsx        ← PDF export
│   │   └── blog/                   ← Blog CRUD + block editor
│   └── api/
│       ├── quotes/send/route.ts    ← Send quote + email
│       └── payments/route.ts       ← Create payment + email
├── components/
│   ├── layout/Sidebar.tsx
│   ├── layout/TopBar.tsx
│   └── ui/index.tsx                ← All UI primitives
├── emails/                         ← 4 premium email templates
├── lib/                            ← Supabase clients, utils
└── types/index.ts                  ← All shared TypeScript types
```
