-- Treasurer receipts
-- Paste this whole file into Supabase dashboard -> SQL Editor -> New query, then click Run.
-- Safe to run more than once.

-- 1. Each donation can have a receipt number (like IH-2026-0001) and the
--    moment the receipt was issued. Both stay empty until the treasurer sends one.
alter table public.donations
  add column if not exists receipt_number text unique,
  add column if not exists receipted_at timestamptz;

-- 2. Donors must not be able to give themselves a receipt when they give.
--    This replaces the "give as yourself" rule from policies.sql with a stricter one.
--    (If you ever re-run policies.sql, run this file again afterwards.)
drop policy if exists "give as yourself" on public.donations;
create policy "give as yourself"
  on public.donations for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and receipt_number is null
    and receipted_at is null
  );

-- 3. Only the treasurer can mark a gift as receipted, and only through this
--    function. There is still no "update" rule on donations, so nobody can
--    edit a gift directly (not even the treasurer); this function is the one
--    door, and it checks for the treasurer before doing anything.
--
--    Receipt numbers count up within each year: IH-2026-0001, IH-2026-0002, ...
--    The year comes from the church's local time (Dickinson, ND is on Mountain Time).
create or replace function public.issue_receipt(gift_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  receipt_year text := to_char(now() at time zone 'America/Denver', 'YYYY');
  existing_number text;
  next_number int;
  new_number text;
begin
  if not public.is_treasurer() then
    raise exception 'Only the treasurer can send receipts.';
  end if;

  -- Make two clicks at the same moment wait their turn, so no number is used twice.
  perform pg_advisory_xact_lock(hashtext('issue_receipt'));

  select receipt_number into existing_number
  from public.donations
  where id = gift_id
  for update;

  if not found then
    raise exception 'Gift not found.';
  end if;

  -- Already receipted? Return the number it already has.
  if existing_number is not null then
    return existing_number;
  end if;

  select coalesce(max(split_part(receipt_number, '-', 3)::int), 0) + 1
  into next_number
  from public.donations
  where receipt_number like 'IH-' || receipt_year || '-%';

  new_number := 'IH-' || receipt_year || '-'
    || lpad(next_number::text, greatest(4, length(next_number::text)), '0');

  update public.donations
  set receipt_number = new_number, receipted_at = now()
  where id = gift_id;

  return new_number;
end;
$$;

-- Only signed-in people may call it (and inside, only the treasurer gets past the check).
revoke execute on function public.issue_receipt(uuid) from public, anon;
grant execute on function public.issue_receipt(uuid) to authenticated;
