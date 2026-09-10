-- ============================================================================
-- migration_012_customers_loyalty_writeoffs.sql
-- Customer CRM + loyalty points, and damaged/defective stock write-offs.
--
-- (Multi-location stock was already covered by migration_009's `locations`
-- and transfer tables, and low-stock is now surfaced as a header badge in
-- the app — no schema changes needed for either of those.)
--
-- Run this in the Supabase SQL editor. Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Customers
-- ---------------------------------------------------------------------------
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  notes text,
  loyalty_points integer not null default 0,
  total_spent numeric not null default 0,
  visit_count integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists customers_phone_idx on customers(phone);
create index if not exists customers_name_idx on customers(name);

-- Every completed sale can now be tied to the customer who made it (nullable
-- — walk-in sales with no customer looked up stay unattributed, same as
-- staff_id already works).
alter table sales add column if not exists customer_id uuid references customers(id);

-- One row per point-earning or point-spending event, so the running balance
-- on `customers.loyalty_points` is always explainable after the fact —
-- same idea as `gift_card_transactions` already in this app.
create table if not exists loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  type text not null check (type in ('earn', 'redeem', 'adjust')),
  points integer not null, -- positive for earn/positive adjust, negative for redeem/negative adjust
  related_sale_id integer references sales(id),
  note text,
  staff_id uuid references staff(id),
  created_at timestamptz not null default now()
);
create index if not exists loyalty_transactions_customer_idx on loyalty_transactions(customer_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 2. Stock write-offs (damaged / defective / lost / expired)
-- ---------------------------------------------------------------------------
create table if not exists stock_writeoffs (
  id uuid primary key default gen_random_uuid(),
  dress_id integer not null references dresses(id),
  quantity integer not null check (quantity > 0),
  reason text not null check (reason in ('damaged', 'defective', 'lost', 'expired', 'other')),
  notes text,
  staff_id uuid references staff(id),
  approved_by_staff_id uuid references staff(id),
  created_at timestamptz not null default now()
);
create index if not exists stock_writeoffs_dress_idx on stock_writeoffs(dress_id);
create index if not exists stock_writeoffs_created_idx on stock_writeoffs(created_at desc);

-- ---------------------------------------------------------------------------
-- No RLS on these three tables, matching how `sales`, `dresses`, and every
-- other day-to-day operational table in this app already works — access is
-- controlled in the app itself (PIN overrides, role checks), not at the
-- database layer, everywhere except the admin-only tables from
-- migration_010/011 (staff, audit_log, promotions).
-- ============================================================================
