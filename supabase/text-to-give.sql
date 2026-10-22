-- Text to Give: allow "text" as a payment method.
-- Paste this whole file into Supabase dashboard -> SQL Editor -> New query, then click Run
-- (with nothing highlighted). Use the app's project:
--   https://supabase.com/dashboard/project/mwqjroldxkcqqralqlka/sql/new
-- Safe to run more than once. Run it after payment-methods.sql.

begin;

-- 1. Gifts can now be online, cash, check, or text.
alter table public.donations drop constraint if exists donations_method_valid;
alter table public.donations
  add constraint donations_method_valid
    check (method in ('online', 'cash', 'check', 'text'));

-- 2. Members giving for themselves (on the Give page, or by the Text to Give
--    demo): only in their own name, only "online" or "text", never with a check
--    number or a receipt already filled in.
--    This replaces the "give as yourself" rule from payment-methods.sql.
drop policy if exists "give as yourself" on public.donations;
create policy "give as yourself"
  on public.donations for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and method in ('online', 'text')
    and check_number is null
    and receipt_number is null
    and receipted_at is null
  );

commit;

-- Expected result: one row, text_allowed = true.
select pg_get_constraintdef(oid) like '%text%' as text_allowed
from pg_constraint
where conname = 'donations_method_valid';
