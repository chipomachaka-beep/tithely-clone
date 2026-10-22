-- Reset the demo to clean, realistic data.
-- Paste this whole file into Supabase dashboard -> SQL Editor -> New query, then click Run
-- (with nothing highlighted). Use the app's project:
--   https://supabase.com/dashboard/project/mwqjroldxkcqqralqlka/sql/new
-- It is all one transaction: if any part fails, nothing changes. Safe to run again.
--
-- After it runs:
--   Members: Maria Lopez, James Carter, Grace Moyo, Daniel Ncube (password test123456)
--   Each has exactly 6 gifts: 2 cash, 2 check, 2 online, across Aug, Sep, and Oct 2026.
--   Maria's two online gifts keep receipts IH-2026-0001 and IH-2026-0002.
--   Two bill payments: MDU (electricity) and City of Dickinson (water).
--   No statements and no Change History entries. The treasurer account is unchanged.

begin;

-- 1. Logins for the two new members. The signup trigger creates their profiles
--    from full_name. Skipped if the email already exists.
do $$
declare
  person record;
  new_id uuid;
begin
  for person in
    select * from (values
      ('grace@example.com', 'Grace Moyo'),
      ('daniel@example.com', 'Daniel Ncube')
    ) as p (email, full_name)
  loop
    if not exists (select 1 from auth.users where email = person.email) then
      new_id := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, email_change, email_change_token_new, recovery_token
      ) values (
        '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
        person.email, extensions.crypt('test123456', extensions.gen_salt('bf')), now(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object('full_name', person.full_name), now(), now(),
        '', '', '', ''
      );
      insert into auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(), new_id, new_id::text,
        jsonb_build_object('sub', new_id::text, 'email', person.email, 'email_verified', true),
        'email', now(), now(), now()
      );
    end if;
  end loop;
end;
$$;

-- Make sure the four members have the right names and the member role.
update public.profiles p
set full_name = m.full_name, role = 'member'
from auth.users u
join (values
  ('maria@example.com', 'Maria Lopez'),
  ('james@example.com', 'James Carter'),
  ('grace@example.com', 'Grace Moyo'),
  ('daniel@example.com', 'Daniel Ncube')
) as m (email, full_name) on m.email = u.email
where p.id = u.id;

-- 2. Clear out old history, statements, and gifts.
--    Maria's two online gifts with receipts IH-2026-0001 and IH-2026-0002 are kept;
--    they become her two online gifts below.
delete from public.change_log;
delete from public.statements;
delete from public.donations
where id not in (
  'f62d1128-553f-42b8-abcb-99f3e2dd2859',  -- Maria, $100 Tithe, online, Oct 5   (IH-2026-0001)
  '849eb112-cc17-4105-a2c2-d238ea3be231'   -- Maria, $50 Building Fund, online, Oct 20 (IH-2026-0002)
);

-- 3. New gifts. Cash and check gifts are dated on Sabbath (Saturday), when the
--    offering plate is passed; online gifts can be any day.
insert into public.donations (user_id, given_on, amount, fund, method, check_number)
select u.id, g.given_on::date, g.amount, g.fund, g.method, g.check_number
from (values
  -- Maria Lopez (plus her two online gifts kept above)
  ('maria@example.com',  '2026-08-08',  40.00, 'offering', 'cash',   null),
  ('maria@example.com',  '2026-08-22', 150.00, 'tithe',    'check',  '2104'),
  ('maria@example.com',  '2026-09-12',  25.00, 'building', 'cash',   null),
  ('maria@example.com',  '2026-09-26', 120.00, 'tithe',    'check',  '2108'),
  -- James Carter
  ('james@example.com',  '2026-08-03', 200.00, 'tithe',    'online', null),
  ('james@example.com',  '2026-08-15',  30.00, 'offering', 'cash',   null),
  ('james@example.com',  '2026-09-05', 180.00, 'tithe',    'check',  '1187'),
  ('james@example.com',  '2026-09-21',  45.00, 'building', 'online', null),
  ('james@example.com',  '2026-10-03',  20.00, 'offering', 'cash',   null),
  ('james@example.com',  '2026-10-17', 175.00, 'tithe',    'check',  '1192'),
  -- Grace Moyo
  ('grace@example.com',  '2026-08-08', 120.00, 'tithe',    'check',  '3051'),
  ('grace@example.com',  '2026-08-30',  35.00, 'offering', 'online', null),
  ('grace@example.com',  '2026-09-12',  60.00, 'building', 'cash',   null),
  ('grace@example.com',  '2026-09-28', 120.00, 'tithe',    'online', null),
  ('grace@example.com',  '2026-10-10',  75.00, 'offering', 'check',  '3056'),
  ('grace@example.com',  '2026-10-17',  25.00, 'building', 'cash',   null),
  -- Daniel Ncube
  ('daniel@example.com', '2026-08-01',  50.00, 'offering', 'cash',   null),
  ('daniel@example.com', '2026-08-24',  90.00, 'tithe',    'online', null),
  ('daniel@example.com', '2026-09-05',  90.00, 'tithe',    'check',  '4410'),
  ('daniel@example.com', '2026-09-19',  20.00, 'building', 'cash',   null),
  ('daniel@example.com', '2026-10-12',  65.00, 'offering', 'online', null),
  ('daniel@example.com', '2026-10-17',  90.00, 'tithe',    'check',  '4415')
) as g (email, given_on, amount, fund, method, check_number)
join auth.users u on u.email = g.email;

-- 4. Bill payments: keep the MDU and City of Dickinson payments, tidied up.
--    Utilities are paid from Offering (the church's local fund), not Building Fund.
delete from public.payments
where id not in (
  '95e1ae82-3cfa-4ceb-b161-88bcd0a73c1a',  -- MDU
  '769de6e3-e70d-4a78-a30d-55fe3f82448f'   -- City of Dickinson
);
update public.payments
set paid_on = '2026-10-06', category = 'electricity', amount = 142.80, fund = 'offering',
    note = 'September electric bill'
where id = '95e1ae82-3cfa-4ceb-b161-88bcd0a73c1a';
update public.payments
set paid_on = '2026-10-14', category = 'water', amount = 64.25, fund = 'offering',
    note = 'September water and sewer bill'
where id = '769de6e3-e70d-4a78-a30d-55fe3f82448f';

-- Lock down three helper functions (only the edit/delete functions use them).
revoke execute on function public.check_change_allowed(text) from authenticated;
revoke execute on function public.check_envelope_gift(public.donations) from authenticated;
revoke execute on function public.statement_sent(uuid, date) from authenticated;

commit;

-- Expected result: one row per member, each with 6 gifts (2 cash, 2 check, 2 online).
select
  p.full_name as member,
  count(d.id) as gifts,
  count(*) filter (where d.method = 'cash') as cash,
  count(*) filter (where d.method = 'check') as checks,
  count(*) filter (where d.method = 'online') as online,
  sum(d.amount) as total
from public.profiles p
left join public.donations d on d.user_id = p.id
where p.role = 'member'
group by p.full_name
order by p.full_name;
