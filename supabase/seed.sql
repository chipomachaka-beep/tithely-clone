-- Step 3: Sample data (typed in by hand)
-- Before running: create two users in Supabase dashboard -> Authentication -> Users
-- -> Add user -> Create new user, with "Auto Confirm User" checked:
--   maria@example.com   (any password)
--   james@example.com   (any password)
-- Then paste this whole file into SQL Editor and click Run.

-- TEMPORARY: let anyone read donations and names so the step 3 page works
-- before we have logins. Step 4 deletes these and adds the real rules.
drop policy if exists "temp: anyone can read profiles" on public.profiles;
create policy "temp: anyone can read profiles"
  on public.profiles for select using (true);

drop policy if exists "temp: anyone can read donations" on public.donations;
create policy "temp: anyone can read donations"
  on public.donations for select using (true);

-- Give the two test users real names (the dashboard's "Add user" doesn't ask for one).
update public.profiles p set full_name = 'Maria Lopez'
  from auth.users u where u.id = p.id and u.email = 'maria@example.com';
update public.profiles p set full_name = 'James Carter'
  from auth.users u where u.id = p.id and u.email = 'james@example.com';

-- A few donations, matched to each user by email.
insert into public.donations (user_id, amount, fund, given_on)
select u.id, d.amount, d.fund, d.given_on::date
from (values
  ('maria@example.com', 100.00, 'tithe',    '2026-10-05'),
  ('maria@example.com',  25.00, 'offering', '2026-10-12'),
  ('james@example.com', 200.00, 'tithe',    '2026-10-05'),
  ('james@example.com',  75.00, 'building', '2026-10-11'),
  ('james@example.com',  20.00, 'offering', '2026-10-12')
) as d (email, amount, fund, given_on)
join auth.users u on u.email = d.email;
