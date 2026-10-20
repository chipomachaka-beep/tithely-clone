-- Step 6: Make the treasurer account.
-- Before running: create a user in Supabase dashboard -> Authentication -> Users
-- -> Add user -> Create new user, with "Auto Confirm User" checked:
--   treasurer@example.com   password: test123456
-- Then paste this file into SQL Editor and click Run.
--
-- To make someone else a treasurer later, change the email below and run it again.

update public.profiles p
set role = 'treasurer', full_name = 'Church Treasurer'
from auth.users u
where u.id = p.id and u.email = 'treasurer@example.com';
