-- Step 2: Tables
-- Paste this whole file into Supabase dashboard -> SQL Editor -> New query, then click Run.
-- It is safe to run more than once.

-- One profile per person who signs up. The id matches their Supabase login id.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'member' check (role in ('member', 'treasurer')),
  created_at timestamptz not null default now()
);

-- Every gift. Each one belongs to the person who gave it.
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(10, 2) not null check (amount > 0),
  fund text not null check (fund in ('tithe', 'offering', 'building')),
  given_on date not null default current_date,
  created_at timestamptz not null default now()
);

-- When someone signs up, automatically create their profile.
-- Their name comes from the signup form; if missing, we use their email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Turn on Row Level Security. With no policies yet, the app can't read or
-- write anything until we add rules in steps 3 and 4.
alter table public.profiles enable row level security;
alter table public.donations enable row level security;
