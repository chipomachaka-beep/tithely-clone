-- Step 4: Real security rules (Row Level Security policies)
-- Paste this whole file into SQL Editor and click Run. Safe to run more than once.

-- Remove the temporary "anyone can read" rules from step 3.
drop policy if exists "temp: anyone can read profiles" on public.profiles;
drop policy if exists "temp: anyone can read donations" on public.donations;

-- Helper: is the person making this request a treasurer?
-- "security definer" lets it look at profiles without tripping over the
-- profiles rules below (which would otherwise call it again forever).
create or replace function public.is_treasurer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'treasurer'
  );
$$;

-- PROFILES: you can see your own; treasurers can see everyone's.
-- There is no update rule, so nobody can make themselves a treasurer from the app.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

drop policy if exists "treasurer reads all profiles" on public.profiles;
create policy "treasurer reads all profiles"
  on public.profiles for select to authenticated
  using (public.is_treasurer());

-- DONATIONS: you can see your own; treasurers can see everyone's.
drop policy if exists "read own donations" on public.donations;
create policy "read own donations"
  on public.donations for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "treasurer reads all donations" on public.donations;
create policy "treasurer reads all donations"
  on public.donations for select to authenticated
  using (public.is_treasurer());

-- You can only add donations in your own name (used by the Give form in step 5).
drop policy if exists "give as yourself" on public.donations;
create policy "give as yourself"
  on public.donations for insert to authenticated
  with check (user_id = (select auth.uid()));
