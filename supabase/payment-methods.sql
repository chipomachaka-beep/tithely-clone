-- Payment methods for gifts, and envelope gifts entered by the treasurer
-- Paste this whole file into Supabase dashboard -> SQL Editor -> New query, then click Run.
-- Safe to run more than once. Run it after receipts.sql.

-- 1. How each gift was given. Every existing gift becomes "online", and so
--    does every gift members make themselves on the Give page.
alter table public.donations
  add column if not exists method text not null default 'online',
  add column if not exists check_number text;

alter table public.donations
  drop constraint if exists donations_method_valid,
  drop constraint if exists donations_check_number_valid;

alter table public.donations
  add constraint donations_method_valid
    check (method in ('online', 'cash', 'check')),
  -- A check number is only allowed on check gifts, and is 1 to 20 characters.
  add constraint donations_check_number_valid
    check (
      check_number is null
      or (method = 'check' and char_length(check_number) between 1 and 20)
    );

-- 2. Members giving on the site: only in their own name, only "online",
--    and never with a receipt already filled in.
--    This replaces the "give as yourself" rule from receipts.sql.
--    (If you ever re-run policies.sql or receipts.sql, run this file again afterwards.)
drop policy if exists "give as yourself" on public.donations;
create policy "give as yourself"
  on public.donations for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and method = 'online'
    and check_number is null
    and receipt_number is null
    and receipted_at is null
  );

-- 3. The treasurer can record envelope gifts (cash or check) for any member.
--    Receipts still come only from the Send receipt button.
drop policy if exists "treasurer records envelope gifts" on public.donations;
create policy "treasurer records envelope gifts"
  on public.donations for insert to authenticated
  with check (
    public.is_treasurer()
    and method in ('cash', 'check')
    and receipt_number is null
    and receipted_at is null
  );
