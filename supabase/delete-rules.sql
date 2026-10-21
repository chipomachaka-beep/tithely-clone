-- Delete rules: only the treasurer can delete, and only certain rows.
-- Paste this whole file into Supabase dashboard -> SQL Editor -> New query, then click Run.
-- Safe to run more than once. Run it after payments.sql and payment-methods.sql.

-- Payments: the treasurer can delete any recorded bill payment.
drop policy if exists "treasurer deletes payments" on public.payments;
create policy "treasurer deletes payments"
  on public.payments for delete to authenticated
  using (public.is_treasurer());

-- Gifts: the treasurer can delete only envelope gifts (cash or check, which
-- only the treasurer can record) that have no receipt yet. Online gifts that
-- members gave, and any gift with a receipt sent, can never be deleted.
drop policy if exists "treasurer deletes unreceipted envelope gifts" on public.donations;
create policy "treasurer deletes unreceipted envelope gifts"
  on public.donations for delete to authenticated
  using (
    public.is_treasurer()
    and method in ('cash', 'check')
    and receipt_number is null
  );

-- Members have no delete rule at all, so they can't delete anything.
