-- Step 3: Sample data (typed in by hand)
-- Before running: create two users in Supabase dashboard -> Authentication -> Users
-- -> Add user -> Create new user, with "Auto Confirm User" checked:
--   maria@example.com   (any password)
--   james@example.com   (any password)
-- Then paste this whole file into SQL Editor and click Run.
-- Safe to run more than once: gifts that already exist are skipped.
-- (In step 3 this file also added a temporary "anyone can read" rule.
-- That was removed in step 4; see policies.sql for the real rules.)

-- Give the two test users real names (the dashboard's "Add user" doesn't ask for one).
update public.profiles p set full_name = 'Maria Lopez'
  from auth.users u where u.id = p.id and u.email = 'maria@example.com';
update public.profiles p set full_name = 'James Carter'
  from auth.users u where u.id = p.id and u.email = 'james@example.com';

-- A few donations, matched to each user by email.
-- The "where not exists" part skips any gift that's already there.
insert into public.donations (user_id, amount, fund, given_on)
select u.id, d.amount, d.fund, d.given_on::date
from (values
  ('maria@example.com', 100.00, 'tithe',    '2026-10-05'),
  ('maria@example.com',  25.00, 'offering', '2026-10-12'),
  ('james@example.com', 200.00, 'tithe',    '2026-10-05'),
  ('james@example.com',  75.00, 'building', '2026-10-11'),
  ('james@example.com',  20.00, 'offering', '2026-10-12')
) as d (email, amount, fund, given_on)
join auth.users u on u.email = d.email
where not exists (
  select 1 from public.donations existing
  where existing.user_id = u.id
    and existing.amount = d.amount
    and existing.fund = d.fund
    and existing.given_on = d.given_on::date
);
