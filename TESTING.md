# Testing: Second Account Test

The core promise of this app: **a member gives, and the treasurer sees it.**
This test proves it on the live site with two different people logged in at once.

Live site: https://tithely-clone.vercel.app

## Test accounts

| Email | Password | Role |
|---|---|---|
| maria@example.com | test123456 | member |
| james@example.com | test123456 | member |
| treasurer@example.com | test123456 | treasurer |

Forgot a password? Run `supabase/reset-test-passwords.sql` in the Supabase SQL Editor.

## Steps

You need two separate browser sessions, because each one can only be logged in as
one person. Use a normal window for the member and a private (incognito) window
for the treasurer.

1. **Treasurer, private window:** log in as `treasurer@example.com` and open
   **Dashboard**. Write down the **All funds** total and the **Building Fund** total.
2. **Member, normal window:** log in as `maria@example.com` and click **Give**.
3. Choose **$50** and **Building Fund**, then click **Give $50.00**.
4. **Member:** you land on **My Giving** with "Thank you! Your gift has been
   recorded." The new $50.00 Building Fund gift is at the top, dated today.
5. **Treasurer:** refresh the Dashboard.

## Expected result

- **All funds** goes up by $50.00, and the gift count goes up by 1.
- **Building Fund** goes up by $50.00.
- The top row of **All Gifts** is today's date, Maria Lopez, Building Fund, $50.00.

## Security checks

- **Logged out:** visiting `/give`, `/history`, or `/dashboard` sends you to the login page.
- **Member:** Maria's **My Giving** shows only her own gifts, never James's.
- **Member:** Maria has no **Dashboard** link, and going to `/dashboard` sends her to **My Giving**.

## Results

**October 20, 2026: passed.**

- Maria gave $50 to Building Fund in a normal window.
- The treasurer refreshed the Dashboard in a private window and saw the gift.
  **All funds** went from $445.00 to **$495.00**.
- Logged-out visitors to `/give`, `/history`, and `/dashboard` were sent to the login page.
- In step 6 testing, Maria was sent to **My Giving** from `/dashboard` and had no
  **Dashboard** link.
