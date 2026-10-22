# Tithely Clone: Invitation Hill SDA Church Giving

A bootcamp demo that rebuilds the core of Tithely Giving:

- **Give a donation:** pick an amount and a fund (Tithe, Offering, or Building Fund).
- **See my giving history:** each member sees only their own gifts and total.
- **Treasurer pages** (tabs under the header, treasurer only):
  - **Member dropdown** on Overview, Gifts, and Reports: "All members", or one person's totals, charts, and gifts.
  - **Overview:** each fund's balance (given minus paid out), and this month's money in and out.
  - **Gifts:** every gift, with a Send receipt button.
  - **Record Gift:** enter cash and check gifts from the offering envelope.
  - **Pay Bills:** record bills paid from a fund, and see every payment made.
  - **Reports:** month-by-month trend charts, totals by fund, by payment method, and money in vs. out.
  - **Change History:** every edit and delete, with what changed, the reason, who, and when.
- **Receipts:** the treasurer sends a numbered receipt (IH-2026-0001) for a gift;
  the donor views and prints it from My Giving. No email is sent.
- **Bill payments:** the treasurer records bills paid from a fund (like MDU for
  electricity) and sees each fund's balance. Demo only: no money is sent.
- **Payment methods:** every gift is Online, Cash, or Check (with check number).
  The treasurer records cash and check envelope gifts under a member's name.
- **Monthly statements:** gifts are grouped by month. The treasurer sends a member
  their statement for a month; the member views and prints it from My Giving.

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
| `supabase/payments.sql` | Adds bill payments; only the treasurer can see or record them |
| `supabase/payment-methods.sql` | Adds online / cash / check; only the treasurer can record gifts for others |
| `supabase/statements.sql` | Monthly statements; only the treasurer can send them |
| `supabase/edit-history.sql` | Edit or delete payments and envelope gifts, with a reason and a change history |

If you re-run an earlier file later, run the files after it again too: some later
files replace security rules from earlier ones.

Helpers, only if needed:

- `supabase/reset-demo-data.sql`: resets to clean demo data (four members with six gifts each,
  two bill payments, no statements or history); creates Grace's and Daniel's logins

- `supabase/reset-test-passwords.sql`: sets the test accounts' passwords to `test123456`
- `supabase/remove-duplicate-donations.sql`: removes sample gifts added twice
- `supabase/cleanup-test-data.sql`: removes the exact test rows created while testing
- `supabase/check-setup.sql`: read-only check that you're in the right project and setup has run

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, choose **Add New → Project** and import the repo.
3. Under **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, then click **Deploy**.
4. In Supabase → **Authentication → URL Configuration**, set **Site URL** to
   your Vercel address.
