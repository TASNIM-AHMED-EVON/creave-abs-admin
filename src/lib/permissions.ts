// ---------------------------------------------------------------------------
// Granular role permissions (beyond admin/salesman).
//
// AccountRole is what lives in a Supabase Auth session's
// app_metadata.role — it gates which tabs/nav items that *login* can reach.
// Set it per account from the SQL editor or the Dashboard:
//   Authentication -> Users -> edit user -> raw app_metadata -> {"role": "manager"}
// An account with no role set is still treated as 'admin', unchanged from
// before this file existed.
//
// This is deliberately separate from `staff` (src/lib/staffSession.tsx),
// which identifies the individual person working the register (for
// commission, clock-in/out, and manager-PIN approval) even when several
// people share one login.
// ---------------------------------------------------------------------------

export type AccountRole = 'admin' | 'manager' | 'cashier' | 'inventory_clerk' | 'salesman';

export type Permission =
  | 'view_purchases'
  | 'manage_settings'
  | 'edit_inventory'
  | 'apply_discount'
  | 'process_refund'
  | 'void_action'
  | 'manage_staff'
  | 'view_audit_log';

// Permissions each role has WITHOUT needing a manager PIN override.
// 'admin' implicitly has everything (see hasPermission) and isn't listed.
const ROLE_PERMISSIONS: Record<Exclude<AccountRole, 'admin'>, Permission[]> = {
  manager: ['view_purchases', 'edit_inventory', 'apply_discount', 'process_refund', 'void_action', 'manage_staff', 'view_audit_log'],
  inventory_clerk: ['view_purchases', 'edit_inventory'],
  cashier: [],
  // Preserves the original behavior of the 'salesman' account exactly.
  salesman: [],
};

// IMPORTANT: only an explicit 'admin' auto-grants everything. A missing/null
// role must NOT silently behave like admin — that would defeat every PIN
// check below whenever nobody has identified themselves yet.
export function hasPermission(role: AccountRole | null | undefined, permission: Permission): boolean {
  if (role === 'admin') return true;
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// Who is actually performing a sensitive action (discount/refund/void) —
// the individually PIN-identified staff member if one is clocked in,
// otherwise nobody (never the shared login account). This is what makes
// the PIN system meaningful on a single shared login: if Rina hasn't
// clocked in, the system does NOT assume "whoever is logged into the
// browser" (usually the shop's one admin account) is Rina — it requires
// a PIN before any of these three actions proceed.
export function actingStaffRole(currentStaff: { role: string } | null | undefined): AccountRole | null {
  if (!currentStaff) return null;
  return KNOWN_ROLES.includes(currentStaff.role as AccountRole) ? (currentStaff.role as AccountRole) : null;
}
const KNOWN_ROLES: AccountRole[] = ['admin', 'manager', 'cashier', 'inventory_clerk', 'salesman'];

// tab id -> permission required to reach it. A tab with no entry here is
// open to every signed-in role (POS, sell tabs, membership, reports, etc.
// stay exactly as open as they were for 'salesman' before).
export const TAB_PERMISSIONS: Partial<Record<string, Permission>> = {
  'products-add': 'edit_inventory',
  'products-labels': 'edit_inventory',
  'products-price': 'edit_inventory',
  'products-reorder': 'edit_inventory',
  'products-locations': 'edit_inventory',
  'products-units': 'edit_inventory',
  'products-categories': 'edit_inventory',
  'products-brands': 'edit_inventory',
  'purchases-requisition': 'view_purchases',
  'purchases-order': 'view_purchases',
  'purchases-list': 'view_purchases',
  'purchases-add': 'view_purchases',
  'purchases-return': 'view_purchases',
  'purchases-suppliers': 'view_purchases',
  'settings-business': 'manage_settings',
  'settings-invoice': 'manage_settings',
  'settings-barcode': 'manage_settings',
  'settings-tax': 'manage_settings',
  'settings-currency': 'manage_settings',
  'staff-manage': 'manage_staff',
  'audit-log': 'view_audit_log',
  // 'staff-clock' has no entry — every role can clock themselves in/out.
};

// Nav-group ids that are entirely hidden unless the role can reach at least
// one tab inside them (mirrors the old SALESMAN_ALLOWED_IDS behavior, but
// generalized to every role instead of just 'salesman').
export function canReachTab(role: AccountRole | null | undefined, tab: string): boolean {
  const required = TAB_PERMISSIONS[tab];
  if (!required) return true;
  return hasPermission(role, required);
}
