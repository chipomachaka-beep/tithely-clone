-- Treasurer bill payments (money paid out of church funds)
-- Paste this whole file into Supabase dashboard -> SQL Editor -> New query, then click Run.
-- Safe to run more than once. Run it after policies.sql (it uses is_treasurer()).

-- One row per bill the treasurer records. Demo only: no money is actually sent.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  paid_on date not null default current_date,
  payee text not null check (char_length(trim(payee)) between 1 and 100),
  category text not null check (category in ('electricity', 'water', 'other')),
  amount numeric(10, 2) not null check (amount > 0),
  fund text not null check (fund in ('tithe', 'offering', 'building')),
  note text not null default '' check (char_length(note) <= 200),
  -- Who recorded it. Filled in automatically with the signed-in person.
  recorded_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now()
);

alter table public.payments enable row level security;

-- Only the treasurer can see payments. Members get nothing back.
drop policy if exists "treasurer reads payments" on public.payments;
create policy "treasurer reads payments"
  on public.payments for select to authenticated
  using (public.is_treasurer());

-- Only the treasurer can record a payment, and only in their own name.
drop policy if exists "treasurer records payments" on public.payments;
create policy "treasurer records payments"
  on public.payments for insert to authenticated
  with check (public.is_treasurer() and recorded_by = (select auth.uid()));

-- There are no update or delete rules, so once recorded, a payment can't be
-- changed or removed from the app (like a real ledger).
