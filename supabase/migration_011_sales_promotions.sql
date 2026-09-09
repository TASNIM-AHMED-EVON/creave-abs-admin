-- ============================================================================
-- migration_011_sales_promotions.sql
-- Sales & promotions: coupon/tiered/bulk/BOGO/seasonal promotion rules,
-- an exchange (swap size/color) workflow, and layaway/installment plans.
--
-- Run this in the Supabase SQL editor. Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Promotions (coupon codes, tiered/bulk pricing, BOGO, seasonal sales)
-- ---------------------------------------------------------------------------
-- One table covers all four request types, distinguished by which fields
-- are set:
--   coupon        requires_code = true,  min_quantity/min_amount usually null
--   tiered/bulk   requires_code = false, min_quantity or min_amount set
--   seasonal sale requires_code = false, starts_at/ends_at set
--   BOGO          buy_qty + get_qty set (get_discount_percent: 100 = free)
-- A promotion can combine these (e.g. a coupon that also requires min_amount).
create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  requires_code boolean not null default false,
  code text unique, -- required (and must be typed at checkout) iff requires_code
  discount_type text not null default 'percent' check (discount_type in ('percent', 'fixed')),
  discount_value numeric not null default 0, -- percent (0-100) or a flat ৳ amount
  min_quantity integer, -- bulk pricing: cart needs at least this many matching units
  min_amount numeric, -- tiered pricing: subtotal needs to reach this amount
  category text, -- optional scope — matches dresses.category; null = whole cart
  buy_qty integer, -- BOGO: buy this many...
  get_qty integer, -- ...get this many at get_discount_percent off
  get_discount_percent numeric, -- BOGO: 100 = free, 50 = half off, etc.
  starts_at timestamptz, -- seasonal window start; null = no start limit
  ends_at timestamptz, -- seasonal window end; null = no end limit
  usage_limit integer, -- total redemptions allowed across all customers; null = unlimited
  times_used integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table sales add column if not exists promotion_id uuid references promotions(id);
alter table sales add column if not exists promo_discount_amount numeric not null default 0;

-- ---------------------------------------------------------------------------
-- 2. Exchanges (swap size/color — its own flow, not a refund)
-- ---------------------------------------------------------------------------
-- Deliberately does NOT touch the original sale's status or amount_paid —
-- the customer already paid for that transaction, so it stays as real
-- revenue in every existing report. An exchange only moves stock (the old
-- unit comes back, the new unit leaves) and settles whatever price
-- difference exists between the two items.
create table if not exists exchanges (
  id uuid primary key default gen_random_uuid(),
  original_sale_id integer references sales(id),
  old_dress_id integer references dresses(id),
  new_dress_id integer references dresses(id),
  price_difference numeric not null default 0, -- new item price - old item's amount_paid
  settlement_method text check (settlement_method in ('none', 'cash', 'store_credit')),
  store_credit_code text,
  staff_id uuid references staff(id),
  approved_by_staff_id uuid references staff(id),
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists exchanges_original_sale_idx on exchanges(original_sale_id);

-- ---------------------------------------------------------------------------
-- 3. Layaway / installment plans
-- ---------------------------------------------------------------------------
-- The reserved item's stock is deducted the moment the layaway starts
-- (same as a normal sale — it's spoken for and shouldn't show as available
-- at the register), and restored if the layaway is cancelled/forfeited.
-- No `sales` row is created until the balance reaches zero, at which point
-- one gets inserted for the full total — so a layaway shows up in revenue
-- reports on the date it's paid off, not the date the deposit was taken.
create table if not exists layaways (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text,
  dress_id integer not null references dresses(id),
  total_amount numeric not null,
  balance_remaining numeric not null,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled', 'forfeited')),
  due_date date,
  staff_id uuid references staff(id),
  completed_sale_id integer references sales(id),
  created_at timestamptz not null default now()
);

create table if not exists layaway_payments (
  id uuid primary key default gen_random_uuid(),
  layaway_id uuid not null references layaways(id),
  amount numeric not null,
  method text,
  staff_id uuid references staff(id),
  paid_at timestamptz not null default now()
);
create index if not exists layaway_payments_layaway_idx on layaway_payments(layaway_id);

-- ---------------------------------------------------------------------------
-- 4. Row-level security
-- ---------------------------------------------------------------------------
-- Exchanges and layaways are day-to-day operational rows (like `sales`
-- itself, which has no RLS) — any signed-in session can read/write them.
-- Promotions are different: anyone can READ them (the checkout screen needs
-- to evaluate active promos), but creating/editing one is restricted to
-- admin/manager, same threshold as `manage_promotions` in the app.
alter table promotions enable row level security;
alter table exchanges enable row level security;
alter table layaways enable row level security;
alter table layaway_payments enable row level security;

drop policy if exists promotions_select on promotions;
create policy promotions_select on promotions for select using (auth.role() = 'authenticated');

drop policy if exists promotions_write on promotions;
create policy promotions_write on promotions for all
  using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'admin') in ('admin', 'manager'))
  with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'admin') in ('admin', 'manager'));

drop policy if exists exchanges_all on exchanges;
create policy exchanges_all on exchanges for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists layaways_all on layaways;
create policy layaways_all on layaways for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists layaway_payments_all on layaway_payments;
create policy layaway_payments_all on layaway_payments for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================================
-- After running this:
-- - Add promotions from the new Promotions tab (Sell group). A tiered/bulk
--   or seasonal rule with no code applies itself automatically at checkout;
--   a coupon needs the customer's code typed into the new field in the cart.
-- - Exchanges and Layaway each get their own tab under Sell.
-- ============================================================================
