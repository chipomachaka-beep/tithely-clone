# Tithely Clone: Invitation Hill SDA Church Giving

A bootcamp demo that rebuilds the core of Tithely Giving:

- **Give a donation:** pick an amount and a fund (Tithe, Offering, or Building Fund).
- **See my giving history:** each member sees only their own gifts and total.
- **Treasurer dashboard:** the treasurer sees every gift plus totals per fund.
- **Receipts:** the treasurer sends a numbered receipt (IH-2026-0001) for a gift;
  the donor views and prints it from My Giving. No email is sent.

**Payments are faked.** Clicking "Give" records the donation in the database; no card is charged.

Not built: real payments, text-to-give, recurring giving, tax statement PDFs, pledge campaigns.

## Stack

- [Next.js](https://nextjs.org) (App Router, plain JavaScript and CSS)
- [Supabase](https://supabase.com) for accounts and the Postgres database
- [Vercel](https://vercel.com) for hosting

## Run it locally

1. Copy `.env.example` to `.env.local` and fill in your Supabase Project URL and
   publishable key (Supabase dashboard → Project Settings → API).
2. `npm install`
3. `npm run dev`, then open http://localhost:3000

## Set up the database

In Supabase, turn off **Authentication → Providers → Email → Confirm email**.
Then run these files in **SQL Editor**, in order:

| File | What it does |
|---|---|
| `supabase/schema.sql` | Creates the `profiles` and `donations` tables |
| `supabase/policies.sql` | Security rules: members see their own gifts, treasurers see all |
| `supabase/seed.sql` | Sample gifts (create `maria@example.com` and `james@example.com` first) |
| `supabase/make-treasurer.sql` | Makes `treasurer@example.com` the treasurer (create that user first) |
| `supabase/receipts.sql` | Adds receipt numbers; only the treasurer can issue receipts |

Helpers, only if needed:

- `supabase/reset-test-passwords.sql`: sets the test accounts' passwords to `test123456`
- `supabase/remove-duplicate-donations.sql`: removes sample gifts added twice

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, choose **Add New → Project** and import the repo.
3. Under **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, then click **Deploy**.
4. In Supabase → **Authentication → URL Configuration**, set **Site URL** to
   your Vercel address.
