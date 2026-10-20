-- Helper: reset the two test users' passwords to test123456.
-- Only changes the password. Users, profiles and donations are left alone.
-- Paste into Supabase dashboard -> SQL Editor -> New query, then click Run.

update auth.users
set
  encrypted_password = extensions.crypt('test123456', extensions.gen_salt('bf')),
  updated_at = now()
where email in ('maria@example.com', 'james@example.com');
