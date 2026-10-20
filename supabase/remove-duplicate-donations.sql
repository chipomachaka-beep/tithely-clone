-- Helper: remove duplicate sample donations created by running seed.sql more than once.
-- Two gifts count as duplicates when they have the same giver, amount, fund and date.
-- The oldest copy of each is kept. Only touches the two test users.
-- Paste into Supabase dashboard -> SQL Editor -> New query, then click Run.

delete from public.donations
where id in (
  select id
  from (
    select
      d.id,
      row_number() over (
        partition by d.user_id, d.amount, d.fund, d.given_on
        order by d.created_at, d.id
      ) as copy_number
    from public.donations d
    join auth.users u on u.id = d.user_id
    where u.email in ('maria@example.com', 'james@example.com')
  ) numbered
  where copy_number > 1
);
