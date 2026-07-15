-- ============================================================
-- LeaveLedger — Patch: Fix missing RPC + backfill manager profiles
-- Run this ONCE in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── 1. Create the deduct_leave_balance RPC function ──────────
-- Called by the manager approval flow to atomically increment used_days.
-- remaining_days is a GENERATED ALWAYS AS (total_days - used_days) STORED
-- column, so it updates automatically.
create or replace function public.deduct_leave_balance(
  p_employee_id   uuid,
  p_leave_type_id uuid,
  p_year          int,
  p_days          int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.leave_balances
  set    used_days = used_days + p_days
  where  employee_id   = p_employee_id
    and  leave_type_id = p_leave_type_id
    and  year          = p_year;
end;
$$;

-- ── 2. Backfill missing profiles from auth.users ─────────────
-- If a manager (or employee) signed up before the trigger was set up,
-- their profile row won't exist, causing the reviewed_by FK constraint
-- to fail on approval. This inserts any missing rows safely.
insert into public.profiles (id, full_name, email, role, department)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name,
  coalesce(u.email, '')                                                      as email,
  coalesce(u.raw_user_meta_data->>'role', 'employee')                       as role,
  u.raw_user_meta_data->>'department'                                        as department
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;

-- ── 3. Backfill missing employee leave balances ───────────────
-- For employees whose profile was just backfilled (or who somehow missed
-- the trigger), insert missing leave_balance rows for the current year.
insert into public.leave_balances (employee_id, leave_type_id, year, total_days, used_days)
select
  p.id             as employee_id,
  lt.id            as leave_type_id,
  extract(year from now())::int as year,
  lt.default_days  as total_days,
  0                as used_days
from public.profiles p
cross join public.leave_types lt
where p.role = 'employee'
  and not exists (
    select 1
    from   public.leave_balances lb
    where  lb.employee_id   = p.id
      and  lb.leave_type_id = lt.id
      and  lb.year          = extract(year from now())::int
  )
on conflict (employee_id, leave_type_id, year) do nothing;
