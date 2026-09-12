import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// GET    /api/staff-accounts      — list every login account + its role
// POST   /api/staff-accounts      — { userId, role } change one account's role
// PUT    /api/staff-accounts      — { email, password, role } create a new login
// PATCH  /api/staff-accounts      — { userId, newPassword } reset a login's password
// DELETE /api/staff-accounts      — { userId } permanently remove a login
//
// This exists because app_metadata.role (the field that decides which tabs
// a login can reach — see src/lib/permissions.ts) can ONLY be written by
// the Supabase Admin API or the SQL editor, never by a signed-in user's own
// session. Before this route, changing anyone's role meant going into the
// Supabase dashboard by hand. This route does it from inside the app instead
// — but because it can grant full admin access to any account, it is the
// single most locked-down endpoint in this codebase:
//   1. The service role key that makes this possible is read ONLY here,
//      server-side, and never sent to the browser.
//   2. Every request is checked against the CALLER's own session token —
//      only an account whose role is already 'admin' may use this route.
//   3. An admin can't use this to demote themselves (prevents accidentally
//      locking yourself out with no other admin able to fix it).
//   4. Same protection applies to DELETE — an admin can't delete their own
//      account through this route either.
//
// Note: deleting a login here does NOT touch that person's staff PIN
// identity (Manage Staff tab) — those are two separate systems on purpose
// (see the comment above AccountsTab in StaffPanel.tsx). If someone who
// resigned also had a PIN, deactivate that separately in Manage Staff so
// their old sales/audit history keeps its attribution instead of pointing
// at a deleted record.
//
// Setup:
//   1. Supabase dashboard -> Settings -> API -> copy the "service_role" key
//      (NOT the anon/public key).
//   2. Add it as an environment variable named SUPABASE_SERVICE_ROLE_KEY:
//        - Locally: .env.local -> SUPABASE_SERVICE_ROLE_KEY=eyJ...
//        - Vercel: Project -> Settings -> Environment Variables (Production
//          + Preview), then redeploy.
//   3. Do NOT prefix it with NEXT_PUBLIC_ — that would ship it to every
//      visitor's browser. This must stay server-only.
// ---------------------------------------------------------------------------

const ALLOWED_ROLES = ['admin', 'manager', 'cashier', 'inventory_clerk'];

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

// Verifies the request's bearer token belongs to a signed-in user whose
// role is 'admin' (an unset role defaults to admin, matching the same
// fallback used client-side in deriveAccountRole — a fresh account with no
// role set yet is still the owner).
async function requireAdminCaller(request: Request, admin: any) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return null;
  const role = (data.user.app_metadata as any)?.role;
  const isAdmin = !role || role === 'admin';
  return isAdmin ? data.user : null;
}

const SERVICE_KEY_MISSING = {
  error: "SUPABASE_SERVICE_ROLE_KEY is not set on the server. Add it to .env.local (dev) or your host's environment variables (production), then redeploy.",
};

export async function GET(request: Request) {
  const admin = getAdminClient();
  if (!admin) return NextResponse.json(SERVICE_KEY_MISSING, { status: 500 });

  const caller = await requireAdminCaller(request, admin);
  if (!caller) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const { data, error } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const accounts = data.users.map((u) => ({
    id: u.id,
    email: u.email,
    role: (u.app_metadata as any)?.role || 'admin',
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
  }));
  return NextResponse.json({ accounts });
}

export async function POST(request: Request) {
  const admin = getAdminClient();
  if (!admin) return NextResponse.json(SERVICE_KEY_MISSING, { status: 500 });

  const caller = await requireAdminCaller(request, admin);
  if (!caller) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const userId = body?.userId;
  const role = body?.role;

  if (!userId || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json(
      { error: `Provide a valid userId and one of: ${ALLOWED_ROLES.join(', ')}` },
      { status: 400 }
    );
  }
  if (userId === caller.id && role !== 'admin') {
    return NextResponse.json(
      { error: "You can't remove your own admin access from here — have another admin account do it, so you don't lock yourself out." },
      { status: 400 }
    );
  }

  const { error } = await admin.auth.admin.updateUserById(userId, { app_metadata: { role } });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  const admin = getAdminClient();
  if (!admin) return NextResponse.json(SERVICE_KEY_MISSING, { status: 500 });

  const caller = await requireAdminCaller(request, admin);
  if (!caller) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const role = body?.role;

  if (!email || password.length < 6 || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json(
      { error: `Provide an email, a password (6+ characters), and one of: ${ALLOWED_ROLES.join(', ')}` },
      { status: 400 }
    );
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // an admin is creating this directly — no confirmation inbox to check
    app_metadata: { role },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, account: { id: data.user?.id, email: data.user?.email, role } });
}

// Reset a forgotten password. The person doesn't need access to their old
// password or any inbox for this — an admin sets a new one directly, then
// tells them what it is.
export async function PATCH(request: Request) {
  const admin = getAdminClient();
  if (!admin) return NextResponse.json(SERVICE_KEY_MISSING, { status: 500 });

  const caller = await requireAdminCaller(request, admin);
  if (!caller) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const userId = body?.userId;
  const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';

  if (!userId || newPassword.length < 6) {
    return NextResponse.json({ error: 'Provide a valid userId and a new password (6+ characters).' }, { status: 400 });
  }

  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// Permanently remove a login — for when someone resigns. This is a real
// delete, not a deactivate: Supabase Auth accounts aren't referenced by any
// foreign key elsewhere in this schema (staff PIN identities are entirely
// separate rows, unaffected), so there's nothing left dangling afterward.
export async function DELETE(request: Request) {
  const admin = getAdminClient();
  if (!admin) return NextResponse.json(SERVICE_KEY_MISSING, { status: 500 });

  const caller = await requireAdminCaller(request, admin);
  if (!caller) return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const userId = body?.userId;
  if (!userId) return NextResponse.json({ error: 'Provide a userId.' }, { status: 400 });

  if (userId === caller.id) {
    return NextResponse.json(
      { error: "You can't delete your own account from here — have another admin account do it." },
      { status: 400 }
    );
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}