-- Monthly statements
-- Paste this whole file into Supabase dashboard -> SQL Editor -> New query, then click Run.
-- Safe to run more than once. Run it after policies.sql (it uses is_treasurer()).

-- One row each time the treasurer sends a member their statement for a month.
-- The statement itself is built from that member's gifts in that month.
create table if not exists public.statements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- The month, written like "2026-10".
  month text not null check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  sent_at timestamptz not null default now(),
  -- Who sent it. Filled in automatically with the signed-in treasurer.
  sent_by uuid not null default auth.uid() references public.profiles (id),
  -- A member gets at most one statement per month.
  unique (user_id, month)
);

alter table public.statements enable row level security;

-- Members see only their own statements; the treasurer sees everyone's.
drop policy if exists "read own or treasurer reads statements" on public.statements;
create policy "read own or treasurer reads statements"
  on public.statements for select to authenticated
  using (user_id = (select auth.uid()) or public.is_treasurer());

-- Only the treasurer can send a statement, and only in their own name.
drop policy if exists "treasurer sends statements" on public.statements;
create policy "treasurer sends statements"
  on public.statements for insert to authenticated
  with check (public.is_treasurer() and sent_by = (select auth.uid()));

-- No update or delete rules: once sent, a statement stays sent.
