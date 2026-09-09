-- ============================================================================
-- migration_010_staff_security.sql
-- Staff & security: granular roles, manager PIN overrides, clock in/out +
-- commission tracking, and an audit log of edits/voids/refunds.
--
-- Run this in the Supabase SQL editor (same way migration_003..009 were run).
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE.
-- ============================================================================

-- Supabase installs pgcrypto into its `extensions` schema (not `public`),
-- so every function below sets search_path to include both.
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- 1. Granular roles beyond admin/salesman
-- ---------------------------------------------------------------------------
-- The Supabase Auth account's app_metadata.role already gates which tabs a
-- session can reach (see src/lib/permissions.ts). This just documents the
-- full set of values that field now accepts:
--   admin | manager | cashier | inventory_clerk | salesman
-- No schema change needed for that part — set it per account with:
--   select auth.admin_update_user_by_id('<user-id>', '{"app_metadata": {"role": "manager"}}');
-- (or via the Dashboard: Authentication -> Users -> edit user -> raw app_metadata)

-- `staff` are the individual people who work the register — distinct from
-- the (usually shared) login accounts above. Staff identity is what
-- attributes a sale to a person for commission, clocks them in/out, and is
-- who a "manager PIN override" actually checks against.
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  role text not null default 'cashier'
    check (role in ('admin', 'manager', 'cashier', 'inventory_clerk', 'salesman')),
  pin_hash text, -- set via set_staff_pin(), never written directly from the client
  commission_rate numeric not null default 0, -- percent of amount_paid, e.g. 5 = 5%
  hourly_rate numeric, -- optional, for future payroll use
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Which staff member rang up a sale, for commission reporting. Nullable —
-- older rows and any till not using staff identification stay unattributed.
alter table sales add column if not exists staff_id uuid references staff(id);

-- ---------------------------------------------------------------------------
-- 2. Clock in/out
-- ---------------------------------------------------------------------------
create table if not exists clock_events (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id),
  event_type text not null check (event_type in ('in', 'out')),
  occurred_at timestamptz not null default now(),
  note text
);
create index if not exists clock_events_staff_idx on clock_events(staff_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- 3. Audit log — every edit / void / refund writes one row here
-- ---------------------------------------------------------------------------
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_staff_id uuid references staff(id),
  actor_staff_name text, -- denormalized so the log still reads if staff is later removed
  actor_account_role text, -- app_metadata.role of the logged-in session that performed it
  approved_by_staff_id uuid references staff(id), -- set when a manager PIN override was used
  approved_by_staff_name text,
  action text not null, -- e.g. 'refund', 'void', 'edit', 'discount_override'
  entity_type text not null, -- e.g. 'sale', 'dress'
  entity_id text,
  before jsonb,
  after jsonb,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_created_idx on audit_log(created_at desc);
create index if not exists audit_log_entity_idx on audit_log(entity_type, entity_id);

-- ---------------------------------------------------------------------------
-- 4. PIN management (SECURITY DEFINER — the hash itself is never sent to
--    the client, only these two functions touch pin_hash directly)
-- ---------------------------------------------------------------------------

-- Only an 'admin' session may set/reset a PIN.
create or replace function set_staff_pin(p_staff_id uuid, p_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'admin') <> 'admin' then
    raise exception 'Only an admin account can set staff PINs';
  end if;
  if p_pin !~ '^[0-9]{4,8}$' then
    raise exception 'PIN must be 4-8 digits';
  end if;
  update staff set pin_hash = crypt(p_pin, gen_salt('bf')) where id = p_staff_id;
end;
$$;

-- Verifies a PIN and returns the staff identity if it belongs to an active
-- admin or manager — this is what the "manager override" modal calls.
-- Returns null (no row) on any mismatch, so a wrong PIN never leaks which
-- part was wrong.
create or replace function verify_manager_pin(p_pin text)
returns table (id uuid, full_name text, role text)
language sql
security definer
set search_path = public, extensions
as $$
  select s.id, s.full_name, s.role
  from staff s
  where s.active
    and s.role in ('admin', 'manager')
    and s.pin_hash is not null
    and s.pin_hash = crypt(p_pin, s.pin_hash)
  limit 1;
$$;

-- Verifies a PIN for ANY active staff member (used to identify who's
-- clocking in/out or working the register — not an approval check).
create or replace function verify_staff_pin(p_pin text)
returns table (id uuid, full_name text, role text)
language sql
security definer
set search_path = public, extensions
as $$
  select s.id, s.full_name, s.role
  from staff s
  where s.active
    and s.pin_hash is not null
    and s.pin_hash = crypt(p_pin, s.pin_hash)
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- 5. Row-level security
-- ---------------------------------------------------------------------------
alter table staff enable row level security;
alter table clock_events enable row level security;
alter table audit_log enable row level security;

-- staff: any signed-in session can read (needed for the clock-in/cashier
-- picker and commission report), but pin_hash should never be selected by
-- the client — enforce that in the app by never including it in a select(*)
-- consumer; RLS on Postgres can't hide a single column from an otherwise
-- readable row, so keep the app-side discipline (see StaffPanel.tsx).
drop policy if exists staff_select on staff;
create policy staff_select on staff for select using (auth.role() = 'authenticated');

drop policy if exists staff_admin_write on staff;
create policy staff_admin_write on staff for all
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'admin') in ('admin', 'manager'))
  with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'admin') in ('admin', 'manager'));

drop policy if exists clock_events_all on clock_events;
create policy clock_events_all on clock_events for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists audit_log_insert on audit_log;
create policy audit_log_insert on audit_log for insert
  with check (auth.role() = 'authenticated');

drop policy if exists audit_log_select on audit_log;
create policy audit_log_select on audit_log for select
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'admin') in ('admin', 'manager'));

-- ============================================================================
-- After running this: create at least one staff row with the 'admin' or
-- 'manager' role and a PIN, e.g. from the SQL editor:
--   insert into staff (full_name, role) values ('Owner', 'admin') returning id;
--   select set_staff_pin('<the id above>', '1234');
-- Everyone else can be added from the new Staff tab in the app.
-- ============================================================================
