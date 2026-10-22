-- Check that this is the right Supabase project and which setup files have run.
-- Paste into SQL Editor and click Run. It only reads; it changes nothing.
-- The result is one row. In the right project, after all files have run,
-- right_project and every "..._ready" column say true, and every "..._left" column says 0.
select
  -- Maria's $30 cash gift from Sep 17, 2026 exists only in the app's real project.
  exists (select 1 from public.donations where id = '7f7c657b-9053-46bc-95de-d22cfc7a89c5') as right_project,
  to_regclass('public.statements') is not null as statements_ready,
  to_regclass('public.change_log') is not null as change_history_ready,
  to_regprocedure('public.edit_envelope_gift(uuid, uuid, date, numeric, text, text, text, text)') is not null as edit_ready,
  (select count(*) from public.payments
    where id in ('acccc917-65dd-4e80-8142-1d56fb26a963', 'acc6b5de-9bb7-4f0a-b3b6-bbc90a9e4892')) as old_test_payments_left,
  (select count(*) from public.donations
    where id = '9d404ffb-9e74-4072-b8db-ddd96d4de7c0') as old_test_gifts_left;
