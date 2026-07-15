-- ============================================================
-- LeaveLedger — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── 1. Profiles ─────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text not null,
  email       text not null,
  role        text not null check (role in ('employee', 'manager')),
  department  text,
  created_at  timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Managers can read ALL profiles (needed for joined queries like profiles(full_name) on leave_requests)
create policy "Managers can read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'manager'
    )
  );

-- Allow insert from server actions (service role context)
create policy "Allow profile insert on signup"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ── 2. Leave Types ───────────────────────────────────────────
create table if not exists public.leave_types (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  default_days  int  not null,
  color         text not null
);

alter table public.leave_types enable row level security;

create policy "Anyone authenticated can read leave types"
  on public.leave_types for select
  using (auth.role() = 'authenticated');

-- Seed leave types
insert into public.leave_types (name, default_days, color) values
  ('Annual',  15, '#6366f1'),
  ('Sick',    10, '#f59e0b'),
  ('Casual',   7, '#10b981')
on conflict (name) do nothing;

-- ── 3. Leave Balances ────────────────────────────────────────
create table if not exists public.leave_balances (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid not null references public.profiles(id) on delete cascade,
  leave_type_id   uuid not null references public.leave_types(id) on delete cascade,
  year            int  not null,
  total_days      int  not null,
  used_days       int  not null default 0,
  remaining_days  int  generated always as (total_days - used_days) stored,
  created_at      timestamptz default now(),
  unique (employee_id, leave_type_id, year)
);

alter table public.leave_balances enable row level security;

-- Employees read their own balances
create policy "Employees can read own balances"
  on public.leave_balances for select
  using (auth.uid() = employee_id);

-- Managers can read ALL employee balances
create policy "Managers can read all balances"
  on public.leave_balances for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'manager'
    )
  );

-- Balances inserted/updated via server actions
create policy "Allow balance insert"
  on public.leave_balances for insert
  with check (
    auth.uid() = employee_id
    or exists (
      select 1 from public.profiles where id = auth.uid() and role = 'manager'
    )
  );

create policy "Allow balance update"
  on public.leave_balances for update
  using (
    auth.uid() = employee_id
    or exists (
      select 1 from public.profiles where id = auth.uid() and role = 'manager'
    )
  );

-- ── 4. Leave Requests ────────────────────────────────────────
create table if not exists public.leave_requests (
  id               uuid primary key default gen_random_uuid(),
  employee_id      uuid not null references public.profiles(id) on delete cascade,
  leave_type_id    uuid not null references public.leave_types(id),
  start_date       date not null,
  end_date         date not null,
  total_days       int  not null,
  reason           text not null,
  status           text not null default 'pending'
                     check (status in ('pending','approved','rejected','cancelled')),
  manager_comment  text,
  reviewed_by      uuid references public.profiles(id),
  reviewed_at      timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table public.leave_requests enable row level security;

-- Employees can read & insert their own requests
create policy "Employees manage own requests"
  on public.leave_requests for select
  using (auth.uid() = employee_id);

create policy "Employees can submit requests"
  on public.leave_requests for insert
  with check (auth.uid() = employee_id);

create policy "Employees can cancel own pending requests"
  on public.leave_requests for update
  using (auth.uid() = employee_id and status = 'pending');

-- Managers can see ALL leave requests from ALL employees
create policy "Managers can view all requests"
  on public.leave_requests for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'manager'
    )
  );

-- Managers can approve/reject any request
create policy "Managers can update requests"
  on public.leave_requests for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'manager'
    )
  );

-- ── 5. Notifications ─────────────────────────────────────────
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  message     text not null,
  is_read     boolean default false,
  created_at  timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users read own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Allow notification insert"
  on public.notifications for insert
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.profiles where id = auth.uid() and role = 'manager'
    )
  );

-- ── 6. Auto-update updated_at on leave_requests ──────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_leave_request_update
  before update on public.leave_requests
  for each row execute procedure public.handle_updated_at();

-- ── 7. Auto-create profile + leave balances on signup ─────────
--
-- This trigger fires immediately after a new row is inserted into
-- auth.users (i.e. every signup). It:
--   1. Reads full_name, role, department from user metadata
--   2. Inserts a row into public.profiles
--   3. Loops over every row in public.leave_types and inserts a
--      leave_balance row for the current calendar year
--
-- SECURITY DEFINER makes it run with the function owner's privileges
-- (postgres superuser), bypassing RLS so it can write to both tables
-- even though auth.users is not in the public schema.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lt       record;
  cur_year int := extract(year from now())::int;
begin
  -- 1. Insert profile row using metadata supplied at signup
  insert into public.profiles (id, full_name, email, role, department)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'role', 'employee'),
    new.raw_user_meta_data->>'department'
  )
  on conflict (id) do nothing;  -- idempotent: skip if profile already exists

  -- 2. For each leave type, insert a leave balance row for the current year
  --    (only for employees — managers don't need personal leave balances)
  if coalesce(new.raw_user_meta_data->>'role', 'employee') = 'employee' then
    for lt in select id, default_days from public.leave_types loop
      insert into public.leave_balances (
        employee_id,
        leave_type_id,
        year,
        total_days,
        used_days
      )
      values (
        new.id,
        lt.id,
        cur_year,
        lt.default_days,
        0
      )
      on conflict (employee_id, leave_type_id, year) do nothing;  -- idempotent
    end loop;
  end if;

  return new;
end;
$$;

-- Drop the trigger first so this script is safely re-runnable
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
