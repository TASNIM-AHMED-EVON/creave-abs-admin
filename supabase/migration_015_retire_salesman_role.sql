-- ============================================================================
-- migration_015_retire_salesman_role.sql
--
-- Collapses the 'salesman' role into 'cashier' — they've had identical
-- permissions for a while now (see src/lib/permissions.ts), 'salesman' was
-- just a legacy name left over from before the granular permission system
-- existed. The app's dropdowns no longer offer 'salesman' as a choice going
-- forward; this migration updates any account/staff row that still has the
-- old value so nothing is left pointing at a role the UI can't select
-- anymore.
--
-- Two separate things get updated, matching the app's two separate role
-- systems:
--   1. Login accounts (auth.users.raw_app_meta_data.role) — decides which
--      tabs a browser can reach.
--   2. Staff PIN identities (staff.role) — decides whether that PIN can
--      approve manager-level actions (discounts, refunds, voids).
--
-- Run this in the Supabase SQL editor. Safe to re-run — if nothing has
-- 'salesman' set, both statements just update zero rows.
-- ============================================================================

-- 1. Login accounts
update auth.users
set raw_app_meta_data = jsonb_set(raw_app_meta_data, '{role}', '"cashier"')
where raw_app_meta_data->>'role' = 'salesman';

-- 2. Staff PIN identities
update staff
set role = 'cashier'
where role = 'salesman';

-- ============================================================================
-- After running this, you can double-check nothing was missed with:
--   select id, email, raw_app_meta_data->>'role' as role from auth.users
--   where raw_app_meta_data->>'role' = 'salesman';
--   select id, full_name, role from staff where role = 'salesman';
-- Both should return zero rows.
-- ============================================================================
