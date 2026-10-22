-- Edit and delete with a change history (treasurer only)
-- Paste this whole file into Supabase dashboard -> SQL Editor -> New query, then click Run.
-- Safe to run more than once. Run it after payments.sql, payment-methods.sql,
-- and statements.sql.
--
-- Every edit or delete of a bill payment or an envelope gift goes through one of
-- the four functions below. Each one, all at once or not at all:
--   1. checks the caller is the treasurer,
--   2. refuses gifts that already have a receipt, gifts in a month whose
--      statement was already sent, and online gifts members gave,
--   3. requires a short reason,
--   4. writes what changed, the reason, who, and when to the change history.
-- There are no update or delete rules on the tables themselves, so these
-- functions are the only way to change or remove a row.

-- Older direct-delete rules (from delete-rules.sql, if it was ever run) would let
-- rows be deleted without a reason or history, so remove them.
drop policy if exists "treasurer deletes payments" on public.payments;
drop policy if exists "treasurer deletes unreceipted envelope gifts" on public.donations;

-- 1. The change history.
create table if not exists public.change_log (
  id uuid primary key default gen_random_uuid(),
  record_type text not null check (record_type in ('payment', 'gift')),
  record_id uuid not null,
  action text not null check (action in ('edit', 'delete')),
  -- Who or what the row was about, e.g. "MDU" or "Maria Lopez".
  summary text not null,
  -- Edits: {"amount": {"from": 120, "to": 125}, ...} for each changed field.
  -- Deletes: {"deleted": {...every field of the removed row...}}.
  changes jsonb not null,
  reason text not null check (char_length(trim(reason)) between 3 and 200),
  changed_by uuid not null default auth.uid() references public.profiles (id),
  changed_at timestamptz not null default now()
);

alter table public.change_log enable row level security;

-- Only the treasurer can read the history. Nobody can write to it directly;
-- only the functions below add to it, and nothing can change or remove it.
drop policy if exists "treasurer reads change log" on public.change_log;
create policy "treasurer reads change log"
  on public.change_log for select to authenticated
  using (public.is_treasurer());

-- Shared checks used by all four functions.
create or replace function public.check_change_allowed(reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_treasurer() then
    raise exception 'Only the treasurer can edit or delete.';
  end if;
  if reason is null or char_length(trim(reason)) < 3 then
    raise exception 'Please give a short reason (at least 3 characters).';
  end if;
  if char_length(trim(reason)) > 200 then
    raise exception 'Please keep the reason to 200 characters or fewer.';
  end if;
end;
$$;

-- Adds {"field": {"from": old, "to": new}} to a diff when the value changed.
create or replace function public.add_change(diff jsonb, field text, old_value anyelement, new_value anyelement)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select case
    when old_value is not distinct from new_value then diff
    else diff || jsonb_build_object(field, jsonb_build_object('from', old_value, 'to', new_value))
  end;
$$;

-- 2. Bill payments.
create or replace function public.edit_payment(
  payment_id uuid,
  new_paid_on date,
  new_payee text,
  new_category text,
  new_amount numeric,
  new_fund text,
  new_note text,
  reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  before_row public.payments;
  diff jsonb := '{}';
begin
  perform public.check_change_allowed(reason);

  select * into before_row from public.payments where id = payment_id for update;
  if not found then
    raise exception 'That payment could not be found.';
  end if;

  new_payee := trim(new_payee);
  new_note := coalesce(trim(new_note), '');
  diff := public.add_change(diff, 'paid_on', before_row.paid_on, new_paid_on);
  diff := public.add_change(diff, 'payee', before_row.payee, new_payee);
  diff := public.add_change(diff, 'category', before_row.category, new_category);
  diff := public.add_change(diff, 'amount', before_row.amount, round(new_amount, 2));
  diff := public.add_change(diff, 'fund', before_row.fund, new_fund);
  diff := public.add_change(diff, 'note', before_row.note, new_note);
  if diff = '{}' then
    raise exception 'Nothing was changed.';
  end if;

  update public.payments
  set paid_on = new_paid_on, payee = new_payee, category = new_category,
      amount = round(new_amount, 2), fund = new_fund, note = new_note
  where id = payment_id;

  insert into public.change_log (record_type, record_id, action, summary, changes, reason)
  values ('payment', payment_id, 'edit', before_row.payee, diff, trim(reason));
end;
$$;

create or replace function public.delete_payment(payment_id uuid, reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  before_row public.payments;
begin
  perform public.check_change_allowed(reason);

  select * into before_row from public.payments where id = payment_id for update;
  if not found then
    raise exception 'That payment could not be found.';
  end if;

  delete from public.payments where id = payment_id;

  insert into public.change_log (record_type, record_id, action, summary, changes, reason)
  values (
    'payment', payment_id, 'delete', before_row.payee,
    jsonb_build_object('deleted', to_jsonb(before_row) - 'id' - 'created_at' - 'recorded_by'),
    trim(reason)
  );
end;
$$;

-- 3. Envelope gifts (cash or check gifts the treasurer recorded).
--    Gifts with a receipt already sent, gifts in a month whose statement was
--    already sent to that member, and online gifts can't be changed.

-- True if this member's statement for this gift date's month has been sent.
create or replace function public.statement_sent(member_id uuid, gift_date date)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.statements s
    where s.user_id = member_id and s.month = to_char(gift_date, 'YYYY-MM')
  );
$$;

create or replace function public.check_envelope_gift(before_row public.donations)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if before_row.receipt_number is not null then
    raise exception 'This gift already has a receipt (%), so it can''t be edited or deleted.', before_row.receipt_number;
  end if;
  if before_row.method not in ('cash', 'check') then
    raise exception 'Only cash or check gifts recorded by the treasurer can be edited or deleted.';
  end if;
  if public.statement_sent(before_row.user_id, before_row.given_on) then
    raise exception 'The % statement has already been sent to this member, so this gift can''t be edited or deleted.',
      to_char(before_row.given_on, 'FMMonth YYYY');
  end if;
end;
$$;

create or replace function public.edit_envelope_gift(
  gift_id uuid,
  new_user_id uuid,
  new_given_on date,
  new_amount numeric,
  new_fund text,
  new_method text,
  new_check_number text,
  reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  before_row public.donations;
  diff jsonb := '{}';
  giver text;
begin
  perform public.check_change_allowed(reason);

  select * into before_row from public.donations where id = gift_id for update;
  if not found then
    raise exception 'That gift could not be found.';
  end if;
  perform public.check_envelope_gift(before_row);

  if new_method not in ('cash', 'check') then
    raise exception 'An envelope gift must be cash or check.';
  end if;
  -- Cash gifts never have a check number.
  if new_method = 'cash' then
    new_check_number := null;
  else
    new_check_number := nullif(trim(new_check_number), '');
    if new_check_number is null then
      raise exception 'Please enter the check number.';
    end if;
  end if;

  -- Don't move a gift into a month whose statement was already sent.
  if public.statement_sent(new_user_id, new_given_on) then
    raise exception 'The % statement has already been sent to that member, so a gift can''t be moved into that month.',
      to_char(new_given_on, 'FMMonth YYYY');
  end if;

  diff := public.add_change(diff, 'user_id', before_row.user_id, new_user_id);
  diff := public.add_change(diff, 'given_on', before_row.given_on, new_given_on);
  diff := public.add_change(diff, 'amount', before_row.amount, round(new_amount, 2));
  diff := public.add_change(diff, 'fund', before_row.fund, new_fund);
  diff := public.add_change(diff, 'method', before_row.method, new_method);
  diff := public.add_change(diff, 'check_number', before_row.check_number, new_check_number);
  if diff = '{}' then
    raise exception 'Nothing was changed.';
  end if;

  update public.donations
  set user_id = new_user_id, given_on = new_given_on, amount = round(new_amount, 2),
      fund = new_fund, method = new_method, check_number = new_check_number
  where id = gift_id;

  select full_name into giver from public.profiles where id = before_row.user_id;
  insert into public.change_log (record_type, record_id, action, summary, changes, reason)
  values ('gift', gift_id, 'edit', coalesce(giver, 'Unknown'), diff, trim(reason));
end;
$$;

create or replace function public.delete_envelope_gift(gift_id uuid, reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  before_row public.donations;
  giver text;
begin
  perform public.check_change_allowed(reason);

  select * into before_row from public.donations where id = gift_id for update;
  if not found then
    raise exception 'That gift could not be found.';
  end if;
  perform public.check_envelope_gift(before_row);

  delete from public.donations where id = gift_id;

  select full_name into giver from public.profiles where id = before_row.user_id;
  insert into public.change_log (record_type, record_id, action, summary, changes, reason)
  values (
    'gift', gift_id, 'delete', coalesce(giver, 'Unknown'),
    jsonb_build_object('deleted', to_jsonb(before_row) - 'id' - 'created_at' - 'receipt_number' - 'receipted_at'),
    trim(reason)
  );
end;
$$;

-- Only signed-in people may call these (and inside, only the treasurer gets past the check).
revoke execute on function public.edit_payment(uuid, date, text, text, numeric, text, text, text) from public, anon;
revoke execute on function public.delete_payment(uuid, text) from public, anon;
revoke execute on function public.edit_envelope_gift(uuid, uuid, date, numeric, text, text, text, text) from public, anon;
revoke execute on function public.delete_envelope_gift(uuid, text) from public, anon;
revoke execute on function public.check_change_allowed(text) from public, anon;
revoke execute on function public.check_envelope_gift(public.donations) from public, anon;
revoke execute on function public.statement_sent(uuid, date) from public, anon;
-- Supabase also lets signed-in users call new functions by default; these three
-- are helpers for the functions above, so nobody should call them directly.
revoke execute on function public.check_change_allowed(text) from authenticated;
revoke execute on function public.check_envelope_gift(public.donations) from authenticated;
revoke execute on function public.statement_sent(uuid, date) from authenticated;
grant execute on function public.edit_payment(uuid, date, text, text, numeric, text, text, text) to authenticated;
grant execute on function public.delete_payment(uuid, text) to authenticated;
grant execute on function public.edit_envelope_gift(uuid, uuid, date, numeric, text, text, text, text) to authenticated;
grant execute on function public.delete_envelope_gift(uuid, text) to authenticated;
