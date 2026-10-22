-- Final cleanup after testing, plus one small security fix.
-- Paste this whole file into Supabase dashboard -> SQL Editor -> New query, then click Run
-- (with nothing highlighted). Safe to run more than once. It deletes only the exact
-- rows listed by id below, never anything else, and changes no real data.
-- Use the app's project: https://supabase.com/dashboard/project/mwqjroldxkcqqralqlka

begin;

-- 1. Test rows from earlier testing (already removed if you ran the earlier version).
delete from public.payments
where id in (
  'acccc917-65dd-4e80-8142-1d56fb26a963',  -- "Probe (delete me)" $0.01, Offering
  'acc6b5de-9bb7-4f0a-b3b6-bbc90a9e4892'   -- MDU "October electric bill (test)" $120.50, Tithe
);
delete from public.donations
where id = '9d404ffb-9e74-4072-b8db-ddd96d4de7c0';  -- James, $40, Check #1042

-- 2. Test rows from testing Edit, Delete, and the statement lock (all labeled [TEST]).
--    The [TEST] payment and Maria's TEST-3 gift were already deleted through the app;
--    the app can't remove what's left (by design), so it's removed here.
delete from public.donations
where id = '5af59f09-8c50-4fc4-a188-b3aeda5ea6e1';  -- James, $3.50, Check #TEST-2, Jan 15, 2026

delete from public.statements
where id = 'a3c1f283-f6ab-4586-9315-ad63183112f1';  -- James's January 2026 test statement

delete from public.change_log
where id in (
  'dcbb43b9-d5ed-49af-a8ad-27a37471fa4d',  -- Edited [TEST] Payee: $1.23 -> $2.50
  '63beaa42-b10a-493c-893f-5275607cfcd8',  -- Edited James's TEST gift: $3.21 -> $3.50
  '8e56b571-af1c-497e-9207-c59a59f8cb4f',  -- Deleted [TEST] Payee payment
  'f506cf8e-4202-4aeb-a37e-2d1e69e97661'   -- Deleted Maria's TEST-3 gift
);

-- 3. Security fix: these three helpers are only for the edit/delete functions.
--    Supabase lets signed-in users call new functions by default, so turn that off.
revoke execute on function public.check_change_allowed(text) from authenticated;
revoke execute on function public.check_envelope_gift(public.donations) from authenticated;
revoke execute on function public.statement_sent(uuid, date) from authenticated;

commit;

-- Expected result (one row): right_project = true, test_rows_left = 0.
select
  exists (select 1 from public.donations where id = '7f7c657b-9053-46bc-95de-d22cfc7a89c5') as right_project,
  (select count(*) from public.payments
     where id in ('acccc917-65dd-4e80-8142-1d56fb26a963', 'acc6b5de-9bb7-4f0a-b3b6-bbc90a9e4892',
                  '5b15c315-8e1f-45d1-a2f3-847837eee93f')
       or payee like '%[TEST]%' or note like '%[TEST]%')
  + (select count(*) from public.donations
     where id in ('9d404ffb-9e74-4072-b8db-ddd96d4de7c0', '5af59f09-8c50-4fc4-a188-b3aeda5ea6e1',
                  '5830b318-d376-43a1-8b34-d33bcb64578a')
       or check_number like 'TEST%')
  + (select count(*) from public.statements where id = 'a3c1f283-f6ab-4586-9315-ad63183112f1')
  + (select count(*) from public.change_log where reason like '[TEST]%')
    as test_rows_left;
