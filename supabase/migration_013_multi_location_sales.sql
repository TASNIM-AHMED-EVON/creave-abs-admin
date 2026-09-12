-- ============================================================================
-- migration_013_multi_location_sales.sql  (v2 — fixed id type mismatch)
--
-- Closes the gap between migration_009's location_stock/stock_transfers
-- tables and the actual POS checkout flow: until now, a sale deducted from
-- `dresses.quantity` (one shared number for the whole business) and never
-- touched `location_stock` or recorded which shop rang it up. This migration:
--   1. Tags every sale with which location made it.
--   2. Gives each staff member a "home" location (used to default the
--      in-app location switcher when they clock in).
--   3. Updates verify_staff_pin / verify_manager_pin to also return that
--      home location, so the client doesn't need a second round trip.
--
-- v2 fix: migration_009's `locations.id` turned out to be `bigint`
-- (auto-incrementing), not `uuid` like the newer tables (customers, staff,
-- etc.) — v1 of this file assumed uuid and Postgres rejected the foreign
-- keys with a type-mismatch error. Every location_id column below is now
-- `bigint` to match. If your `locations.id` is something else entirely,
-- run this first to check:
--   select data_type from information_schema.columns
--   where table_name = 'locations' and column_name = 'id';
--
-- `dresses.quantity` remains the authoritative total-stock-across-the-
-- business number — reorder alerts, the POS product grid, etc. keep working
-- exactly as before. `location_stock` becomes an accurate *breakdown* of
-- that total by shop, kept in sync by both transfers (already worked) and
-- now sales too (see the checkout code change alongside this migration).
--
-- Run this in the Supabase SQL editor, same as migration_003..012.
-- Safe to re-run: every statement is guarded with IF NOT EXISTS / OR REPLACE.
-- ============================================================================

-- Defensive only — these three should already exist from migration_009.
-- IF NOT EXISTS makes this a no-op on your database (locations,
-- location_stock, and stock_transfers are already there) — it only matters
-- if this migration is ever run against a brand-new database.
create table if not exists locations (
  id bigint generated always as identity primary key,
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists location_stock (
  id bigint generated always as identity primary key,
  location_id bigint not null references locations(id) on delete cascade,
  dress_id uuid not null references dresses(id) on delete cascade,
  quantity numeric not null default 0,
  updated_at timestamptz not null default now(),
  unique (location_id, dress_id)
);

create table if not exists stock_transfers (
  id bigint generated always as identity primary key,
  dress_id uuid not null references dresses(id),
  from_location_id bigint references locations(id),
  to_location_id bigint not null references locations(id),
  quantity numeric not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 1. Which location rang up each sale
-- ---------------------------------------------------------------------------
alter table sales add column if not exists location_id bigint references locations(id);
create index if not exists sales_location_idx on sales(location_id);

-- ---------------------------------------------------------------------------
-- 2. Each staff member's home location
-- ---------------------------------------------------------------------------
alter table staff add column if not exists location_id bigint references locations(id);

-- ---------------------------------------------------------------------------
-- 3. verify_staff_pin / verify_manager_pin now also return location_id.
--    Must drop first — Postgres won't let you change a function's return
--    row shape with just CREATE OR REPLACE.
-- ---------------------------------------------------------------------------
drop function if exists verify_staff_pin(text);
create function verify_staff_pin(p_pin text)
returns table (id uuid, full_name text, role text, location_id bigint)
language sql
security definer
set search_path = public, extensions
as $$
  select s.id, s.full_name, s.role, s.location_id
  from staff s
  where s.active
    and s.pin_hash is not null
    and s.pin_hash = crypt(p_pin, s.pin_hash)
  limit 1;
$$;

drop function if exists verify_manager_pin(text);
create function verify_manager_pin(p_pin text)
returns table (id uuid, full_name text, role text, location_id bigint)
language sql
security definer
set search_path = public, extensions
as $$
  select s.id, s.full_name, s.role, s.location_id
  from staff s
  where s.active
    and s.role in ('admin', 'manager')
    and s.pin_hash is not null
    and s.pin_hash = crypt(p_pin, s.pin_hash)
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- 4. RLS (defensive — matches migration_009's originals if it already ran)
-- ---------------------------------------------------------------------------
alter table locations enable row level security;
alter table location_stock enable row level security;
alter table stock_transfers enable row level security;

drop policy if exists locations_all on locations;
create policy locations_all on locations for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists location_stock_all on location_stock;
create policy location_stock_all on location_stock for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists stock_transfers_all on stock_transfers;
create policy stock_transfers_all on stock_transfers for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================================
-- After running this:
--   1. Settings -> Locations: make sure every physical shop has a row (you
--      likely already did this for Stock Transfer).
--   2. Staff tab: set each staff member's home location so the location
--      switcher in the header defaults correctly when they clock in/PIN in.
--   3. Stock Transfer tab: make sure every product's current stock is
--      actually assigned to a location via a transfer (an "initial
--      assignment" transfer, per the existing tab) — location_stock rows
--      only exist for products that have been explicitly assigned. Anything
--      never assigned won't decrement anywhere when sold at a specific
--      location (it'll still deduct from the business-wide total, it just
--      won't move a per-shop number that was never set in the first place).
-- ============================================================================
