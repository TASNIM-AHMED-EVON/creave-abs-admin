'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStaffSession } from '@/lib/staffSession';
import { useNotify } from '@/lib/notify';
import { hasPermission, type AccountRole } from '@/lib/permissions';

type StaffRow = {
  id: string;
  full_name: string;
  role: string;
  commission_rate: number;
  hourly_rate: number | null;
  active: boolean;
  created_at: string;
};

type ClockEvent = { id: string; staff_id: string; event_type: 'in' | 'out'; occurred_at: string; note: string | null };
type AuditRow = {
  id: string; action: string; entity_type: string; entity_id: string | null;
  actor_staff_name: string | null; actor_account_role: string | null;
  approved_by_staff_name: string | null; reason: string | null; created_at: string;
  before: any; after: any;
};

const SUBTAB_LABEL: Record<string, string> = {
  clock: 'Clock In / Out',
  manage: 'Manage Staff',
  accounts: 'Account Logins',
  commission: 'Commission Report',
  audit: 'Audit Log',
};

// Maps the left-nav tab id that was clicked to which sub-view opens first —
// StaffPanel still lets the user switch between sub-views freely afterward.
const NAV_TAB_TO_SUBTAB: Record<string, string> = {
  'staff-clock': 'clock',
  'staff-manage': 'manage',
  'staff-commission': 'commission',
  'staff-accounts': 'accounts',
  'audit-log': 'audit',
};

export default function StaffPanel({ accountRole, navTab }: { accountRole: AccountRole | null; navTab?: string }) {
  const { currentStaff, identifyStaff, clearStaff } = useStaffSession();
  const canManage = hasPermission(accountRole, 'manage_staff');
  const canViewAudit = hasPermission(accountRole, 'view_audit_log');
  // Deliberately stricter than canManage — this tab can grant full admin
  // access to any login, so only an actual admin account sees it, not
  // managers who otherwise have broad staff-management rights.
  const isAdminAccount = accountRole === 'admin';
  // Commission Report shows payroll-sensitive numbers across EVERY staff
  // member, not just the one PIN a cashier might register — so it stays
  // manager+ only even though cashiers now have canManage (manage_staff)
  // for adding/deactivating staff.
  const canViewCommission = accountRole === 'admin' || accountRole === 'manager';

  const availableSubtabs = ['clock', ...(canManage ? ['manage'] : []), ...(canViewCommission ? ['commission'] : []), ...(isAdminAccount ? ['accounts'] : []), ...(canViewAudit ? ['audit'] : [])];
  const [subtab, setSubtab] = useState<string>(() => (navTab && NAV_TAB_TO_SUBTAB[navTab]) || 'clock');
  useEffect(() => { if (!availableSubtabs.includes(subtab)) setSubtab('clock'); }, [canManage, canViewCommission, canViewAudit, isAdminAccount]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (navTab && NAV_TAB_TO_SUBTAB[navTab]) setSubtab(NAV_TAB_TO_SUBTAB[navTab]); }, [navTab]);

  return (
    <div>
      <div className="flex gap-2 mb-6 border-b border-thread">
        {availableSubtabs.map(t => (
          <button
            key={t}
            onClick={() => setSubtab(t)}
            className={`px-4 py-2.5 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${subtab === t ? 'border-oxblood text-oxblood' : 'border-transparent text-muted hover:text-ink'}`}
          >
            {SUBTAB_LABEL[t]}
          </button>
        ))}
      </div>
      {subtab === 'clock' && <ClockTab currentStaff={currentStaff} identifyStaff={identifyStaff} clearStaff={clearStaff} />}
      {subtab === 'manage' && canManage && <ManageTab />}
      {subtab === 'accounts' && isAdminAccount && <AccountsTab />}
      {subtab === 'commission' && canViewCommission && <CommissionTab />}
      {subtab === 'audit' && canViewAudit && <AuditTab />}
    </div>
  );
}

// ---------------------------------------------------------------------------
function ClockTab({ currentStaff, identifyStaff, clearStaff }: any) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [events, setEvents] = useState<ClockEvent[]>([]);
  const [busy, setBusy] = useState(false);

  const loadEvents = async (staffId: string) => {
    const since = new Date(); since.setHours(0, 0, 0, 0);
    const { data } = await supabase.from('clock_events').select('*').eq('staff_id', staffId).gte('occurred_at', since.toISOString()).order('occurred_at', { ascending: false });
    setEvents((data as ClockEvent[]) || []);
  };

  useEffect(() => { if (currentStaff) loadEvents(currentStaff.id); }, [currentStaff?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const match = await identifyStaff(pin);
    if (!match) setError('PIN not recognized.');
    setPin('');
  };

  const lastEvent = events[0]?.event_type;
  const isClockedIn = lastEvent === 'in';

  const punch = async (type: 'in' | 'out') => {
    if (!currentStaff) return;
    setBusy(true);
    await supabase.from('clock_events').insert([{ staff_id: currentStaff.id, event_type: type }]);
    await loadEvents(currentStaff.id);
    setBusy(false);
  };

  if (!currentStaff) {
    return (
      <form onSubmit={handleIdentify} className="max-w-xs">
        <label className="p-label mb-1 block">Enter your PIN to clock in/out</label>
        <input
          type="password" inputMode="numeric" maxLength={8} autoFocus value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
          className="w-full px-4 py-3 bg-paper border border-thread focus:border-oxblood outline-none font-mono text-lg tracking-widest text-center mb-2"
          placeholder="PIN"
        />
        {error && <p className="text-xs text-oxblood font-semibold mb-2">{error}</p>}
        <button type="submit" disabled={pin.length < 4} className="w-full px-4 py-2.5 bg-oxblood text-white text-sm font-bold uppercase tracking-wide hover:bg-oxblood/90 disabled:opacity-50">
          Continue
        </button>
      </form>
    );
  }

  return (
    <div className="max-w-md">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-display text-lg text-ink">{currentStaff.full_name}</p>
          <p className="text-xs text-muted uppercase tracking-wide">{currentStaff.role} · {isClockedIn ? 'Clocked in' : 'Clocked out'}</p>
        </div>
        <button onClick={clearStaff} className="text-xs text-muted underline hover:text-ink">Not you?</button>
      </div>
      <button
        onClick={() => punch(isClockedIn ? 'out' : 'in')}
        disabled={busy}
        className={`w-full px-4 py-3.5 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-50 ${isClockedIn ? 'bg-oxblood hover:bg-oxblood/90' : 'bg-brass hover:bg-brass/90'}`}
      >
        {isClockedIn ? 'Clock Out' : 'Clock In'}
      </button>
      <div className="mt-6">
        <p className="p-label mb-2">Today</p>
        {events.length === 0 ? (
          <p className="text-sm text-muted">No punches yet today.</p>
        ) : (
          <ul className="space-y-1">
            {events.map(ev => (
              <li key={ev.id} className="flex justify-between text-sm font-mono">
                <span className={ev.event_type === 'in' ? 'text-brass' : 'text-oxblood'}>{ev.event_type === 'in' ? 'IN' : 'OUT'}</span>
                <span className="text-muted">{new Date(ev.occurred_at).toLocaleTimeString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Account Logins — admin-only. Lets an admin change which role a *login*
// (email/password account) has — admin / manager / cashier / inventory
// clerk — without needing the Supabase dashboard. This is different from
// "Manage Staff" above: that manages individual PIN identities used for
// per-person attribution at the till; this manages the shared login
// accounts that decide which tabs a browser can even reach.
//
// Requires SUPABASE_SERVICE_ROLE_KEY to be set on the server (see
// src/app/api/staff-accounts/route.ts) — only the server can list/edit
// other people's login accounts, the browser never gets that key.
// ---------------------------------------------------------------------------
const ASSIGNABLE_ROLES = ['admin', 'manager', 'cashier', 'inventory_clerk'];

function AccountsTab() {
  const { confirm } = useNotify();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  // New-login form state, kept separate from the existing-accounts list
  // above so editing one doesn't interfere with the other.
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('cashier');
  const [creating, setCreating] = useState(false);

  // Which account's "reset password" row is currently expanded, and the
  // draft password typed into it.
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [resetDraft, setResetDraft] = useState('');
  const [resetBusy, setResetBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Every action below needs the caller's current session token — this just
  // saves repeating the same two lines in each one.
  const authedFetch = async (method: string, body: any) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    const res = await fetch('/api/staff-accounts', {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    return { res, body: await res.json() };
  };

  // Right after a fresh sign-in there can be a brief window where this
  // component mounts before the browser's Supabase session has fully
  // settled — getSession() comes back empty, or the token it returns gets
  // a transient 403 from the server. A manual page reload always "fixed"
  // it because by the time you reload and click back in, that window has
  // long passed. Retrying automatically does the same thing without
  // making the person notice or do it themselves.
  const load = async (attempt = 1) => {
    setLoading(true);
    if (attempt === 1) setMessage({ type: '', text: '' });

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      if (attempt < 4) { setTimeout(() => load(attempt + 1), 400 * attempt); return; }
      setLoading(false);
      setMessage({ type: 'error', text: 'Not signed in yet — try switching tabs and back.' });
      return;
    }

    try {
      const res = await fetch('/api/staff-accounts', { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json();
      if (!res.ok) {
        // A 403 this early is almost always the same startup race, not an
        // actual permissions problem — retry quietly before showing an
        // error an admin would otherwise (wrongly) think is permanent.
        if (res.status === 403 && attempt < 3) { setTimeout(() => load(attempt + 1), 500 * attempt); return; }
        setMessage({ type: 'error', text: body.error || 'Failed to load accounts.' });
      } else {
        setAccounts(body.accounts);
        setDrafts(Object.fromEntries(body.accounts.map((a: any) => [a.id, a.role])));
      }
    } catch {
      setMessage({ type: 'error', text: 'Could not reach the server. Is SUPABASE_SERVICE_ROLE_KEY set?' });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const saveRole = async (userId: string) => {
    setSavingId(userId);
    setMessage({ type: '', text: '' });
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    try {
      const res = await fetch('/api/staff-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, role: drafts[userId] }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: body.error || 'Failed to update role.' });
      } else {
        setMessage({ type: 'success', text: 'Role updated.' });
        load();
      }
    } catch {
      setMessage({ type: 'error', text: 'Could not reach the server.' });
    }
    setSavingId(null);
  };

  const createAccount = async () => {
    setCreating(true);
    setMessage({ type: '', text: '' });
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    try {
      const res = await fetch('/api/staff-accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: newEmail.trim(), password: newPassword, role: newRole }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: body.error || 'Failed to create account.' });
      } else {
        setMessage({ type: 'success', text: `Account created for ${newEmail.trim()}. Share the password with them directly — it won't be shown again here.` });
        setNewEmail('');
        setNewPassword('');
        setNewRole('cashier');
        load();
      }
    } catch {
      setMessage({ type: 'error', text: 'Could not reach the server.' });
    }
    setCreating(false);
  };

  const resetPassword = async (userId: string) => {
    if (resetDraft.length < 6) { setMessage({ type: 'error', text: 'New password needs to be at least 6 characters.' }); return; }
    setResetBusy(true);
    setMessage({ type: '', text: '' });
    try {
      const { res, body } = await authedFetch('PATCH', { userId, newPassword: resetDraft });
      if (!res.ok) {
        setMessage({ type: 'error', text: body.error || 'Failed to reset password.' });
      } else {
        setMessage({ type: 'success', text: 'Password reset — tell them the new one directly, it won\'t be shown again here.' });
        setResettingId(null);
        setResetDraft('');
      }
    } catch {
      setMessage({ type: 'error', text: 'Could not reach the server.' });
    }
    setResetBusy(false);
  };

  const deleteAccount = async (userId: string, email: string) => {
    if (!(await confirm({ message: `Permanently delete the login for "${email}"? They won't be able to sign in anymore. This doesn't touch their staff PIN or past sales history — only the login itself.`, danger: true }))) return;
    setDeletingId(userId);
    setMessage({ type: '', text: '' });
    try {
      const { res, body } = await authedFetch('DELETE', { userId });
      if (!res.ok) {
        setMessage({ type: 'error', text: body.error || 'Failed to delete account.' });
      } else {
        setMessage({ type: 'success', text: `Removed ${email}.` });
        load();
      }
    } catch {
      setMessage({ type: 'error', text: 'Could not reach the server.' });
    }
    setDeletingId(null);
  };

  if (loading) return <p className="text-sm text-muted">Loading accounts…</p>;

  return (
    <div>
      <p className="text-sm text-muted mb-4">
        These are login accounts (email + password) — the everyday sign-in for the app, separate from staff PIN identities above.
        Each one's role decides which tabs it can reach.
      </p>

      {/* Create a new login — the piece that used to require the Supabase
          dashboard entirely; opening an account for a manager, cashier, or
          inventory clerk now takes just this form. */}
      <div className="p-card p-4 mb-5">
        <p className="p-label mb-3">Create New Login</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            type="email" placeholder="Email" value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="p-input text-sm sm:col-span-2"
          />
          <input
            type="password" placeholder="Password (6+ characters)" value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="p-input text-sm"
          />
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="p-input text-sm">
            {ASSIGNABLE_ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
          </select>
        </div>
        <button
          onClick={createAccount}
          disabled={creating || !newEmail.trim() || newPassword.length < 6}
          className="p-btn p-btn-primary mt-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {creating ? 'Creating…' : 'Create Account'}
        </button>
        <p className="text-xs text-muted mt-2">
          They'll sign in with this email and password directly — no confirmation email, no separate setup step.
          Tell them the password yourself; it isn't stored anywhere retrievable after this.
        </p>
      </div>

      {message.text && (
        <div className={`p-alert mb-4 ${message.type === 'error' ? 'text-oxblood' : 'text-moss'}`}>{message.text}</div>
      )}
      {accounts.length === 0 && !message.text ? (
        <p className="text-sm text-muted">No accounts found.</p>
      ) : (
        <div className="space-y-2">
          {accounts.map((a: any) => (
            <div key={a.id} className="p-card p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-ink text-sm">{a.email}</p>
                  <p className="text-xs text-muted">
                    Currently: <span className="font-bold uppercase">{a.role}</span>
                    {a.last_sign_in_at && <> · last signed in {new Date(a.last_sign_in_at).toLocaleDateString()}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={drafts[a.id] ?? a.role}
                    onChange={(e) => setDrafts({ ...drafts, [a.id]: e.target.value })}
                    className="p-input text-xs py-1.5"
                  >
                    {ASSIGNABLE_ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
                  </select>
                  <button
                    onClick={() => saveRole(a.id)}
                    disabled={savingId === a.id || (drafts[a.id] ?? a.role) === a.role}
                    className="p-btn p-btn-primary py-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {savingId === a.id ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setResettingId(resettingId === a.id ? null : a.id); setResetDraft(''); }}
                    className="p-btn p-btn-ghost py-1.5 text-xs"
                  >
                    Reset Password
                  </button>
                  <button
                    onClick={() => deleteAccount(a.id, a.email)}
                    disabled={deletingId === a.id}
                    className="p-btn p-btn-danger py-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {deletingId === a.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
              {/* Someone forgot their password — set a new one directly, no
                  email/inbox involved. Only shown when this row's Reset
                  Password button has been clicked. */}
              {resettingId === a.id && (
                <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--card-border)' }}>
                  <input
                    type="text"
                    placeholder="New password (6+ characters)"
                    value={resetDraft}
                    onChange={(e) => setResetDraft(e.target.value)}
                    className="p-input text-xs flex-1"
                  />
                  <button
                    onClick={() => resetPassword(a.id)}
                    disabled={resetBusy || resetDraft.length < 6}
                    className="p-btn p-btn-primary py-1.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {resetBusy ? 'Setting…' : 'Set New Password'}
                  </button>
                  <button onClick={() => { setResettingId(null); setResetDraft(''); }} className="p-btn p-btn-ghost py-1.5 text-xs">Cancel</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ManageTab() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('cashier');
  const [rate, setRate] = useState('0');
  const [message, setMessage] = useState('');
  const [pinDrafts, setPinDrafts] = useState<Record<string, string>>({});
  const [attendanceRow, setAttendanceRow] = useState<StaffRow | null>(null);

  const load = async () => {
    const { data } = await supabase.from('staff').select('id, full_name, role, commission_rate, hourly_rate, active, created_at').order('created_at', { ascending: false });
    setStaff((data as StaffRow[]) || []);
  };
  useEffect(() => { load(); }, []);

  const addStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from('staff').insert([{ full_name: name.trim(), role, commission_rate: parseFloat(rate) || 0 }]);
    if (error) { setMessage('Failed to add staff. Make sure migration_010 has been run.'); return; }
    setName(''); setRate('0'); setMessage('Added.');
    load();
  };

  const toggleActive = async (row: StaffRow) => {
    await supabase.from('staff').update({ active: !row.active }).eq('id', row.id);
    load();
  };

  const setPin = async (row: StaffRow) => {
    const pin = pinDrafts[row.id];
    if (!pin || pin.length < 4) return;
    const { error } = await supabase.rpc('set_staff_pin', { p_staff_id: row.id, p_pin: pin });
    setMessage(error ? `Failed to set PIN for ${row.full_name}: ${error.message}` : `PIN set for ${row.full_name}.`);
    setPinDrafts(prev => ({ ...prev, [row.id]: '' }));
  };

  return (
    <div>
      <form onSubmit={addStaff} className="flex flex-wrap items-end gap-3 mb-6 p-4 border border-thread bg-paper">
        <div>
          <label className="p-label block mb-1">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood" />
        </div>
        <div>
          <label className="p-label block mb-1">Role</label>
          <select value={role} onChange={e => setRole(e.target.value)} className="px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood">
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="cashier">Cashier</option>
            <option value="inventory_clerk">Inventory Clerk</option>
            <option value="salesman">Salesman</option>
          </select>
        </div>
        <div>
          <label className="p-label block mb-1">Commission %</label>
          <input value={rate} onChange={e => setRate(e.target.value)} type="number" step="0.1" className="w-24 px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood" />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-oxblood text-white text-sm font-bold uppercase tracking-wide hover:bg-oxblood/90">Add Staff</button>
      </form>
      {message && <p className="text-sm text-muted mb-4">{message}</p>}
      <div className="space-y-2">
        {staff.map(row => (
          <div key={row.id} className={`flex flex-wrap items-center gap-3 p-3 border border-thread ${row.active ? 'bg-canvas' : 'bg-paper opacity-60'}`}>
            <div className="min-w-[10rem]">
              <p className="font-bold text-ink text-sm">{row.full_name}</p>
              <p className="text-xs text-muted uppercase">{row.role} · {row.commission_rate}% commission</p>
            </div>
            <input
              type="password" inputMode="numeric" maxLength={8} placeholder="New PIN"
              value={pinDrafts[row.id] || ''}
              onChange={e => setPinDrafts(prev => ({ ...prev, [row.id]: e.target.value.replace(/\D/g, '') }))}
              className="w-28 px-3 py-2 bg-paper border border-thread outline-none focus:border-oxblood text-sm font-mono"
            />
            <button onClick={() => setPin(row)} className="px-3 py-2 text-xs font-bold uppercase border border-brass/30 text-brass hover:bg-brass hover:text-white transition-colors">Set PIN</button>
            <button onClick={() => setAttendanceRow(row)} className="px-3 py-2 text-xs font-bold uppercase border border-thread text-ink hover:bg-paper transition-colors">Attendance</button>
            <button onClick={() => toggleActive(row)} className="px-3 py-2 text-xs font-bold uppercase border border-thread hover:bg-paper transition-colors ml-auto">
              {row.active ? 'Deactivate' : 'Reactivate'}
            </button>
          </div>
        ))}
        {staff.length === 0 && <p className="text-sm text-muted">No staff yet — add one above.</p>}
      </div>
      {attendanceRow && <AttendanceModal row={attendanceRow} onClose={() => setAttendanceRow(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Attendance — "how many days were they present vs absent" for a date
// range, built from clock_events (the same table Clock In/Out already
// writes to — this just aggregates it instead of showing only today).
// A day counts as "present" if there's at least one 'in' event that date;
// everything else in the range counts as absent. This is what lets a
// manager or cashier actually calculate a Salesman's work shifts, since
// Salesmen have no other footprint in the app to go by.
// ---------------------------------------------------------------------------
function AttendanceModal({ row, onClose }: { row: StaffRow; onClose: () => void }) {
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0, 10); });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<{ date: string; present: boolean; firstIn: string | null; lastOut: string | null }[]>([]);

  const run = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('clock_events')
      .select('event_type, occurred_at')
      .eq('staff_id', row.id)
      .gte('occurred_at', `${from}T00:00:00`)
      .lte('occurred_at', `${to}T23:59:59`)
      .order('occurred_at', { ascending: true });

    const byDate: Record<string, { firstIn: string | null; lastOut: string | null }> = {};
    (data || []).forEach((ev: any) => {
      const d = ev.occurred_at.slice(0, 10);
      if (!byDate[d]) byDate[d] = { firstIn: null, lastOut: null };
      if (ev.event_type === 'in' && !byDate[d].firstIn) byDate[d].firstIn = ev.occurred_at;
      if (ev.event_type === 'out') byDate[d].lastOut = ev.occurred_at;
    });

    // Walk every calendar date in the range (not just the ones with
    // events) so absent days show up as explicitly absent, not just missing.
    const result: typeof days = [];
    const cursor = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      const entry = byDate[key];
      result.push({ date: key, present: !!entry?.firstIn, firstIn: entry?.firstIn || null, lastOut: entry?.lastOut || null });
      cursor.setDate(cursor.getDate() + 1);
    }
    setDays(result.reverse()); // most recent first
    setLoading(false);
  };
  useEffect(() => { run(); }, [from, to]); // eslint-disable-line react-hooks/exhaustive-deps

  const presentCount = days.filter(d => d.present).length;
  const absentCount = days.length - presentCount;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-canvas border border-thread rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-thread shrink-0">
          <div>
            <h3 className="text-sm font-bold text-ink">Attendance</h3>
            <p className="text-xs text-muted mt-0.5">{row.full_name} · {row.role}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink text-lg leading-none">×</button>
        </div>

        <div className="px-5 py-3 flex items-end gap-2 border-b border-thread shrink-0">
          <div>
            <label className="p-label block mb-1">From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-2.5 py-1.5 bg-paper border border-thread outline-none focus:border-oxblood text-xs" />
          </div>
          <div>
            <label className="p-label block mb-1">To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-2.5 py-1.5 bg-paper border border-thread outline-none focus:border-oxblood text-xs" />
          </div>
          <div className="ml-auto text-right">
            <p className="text-lg font-bold text-ink leading-none">{loading ? '—' : presentCount}<span className="text-muted text-xs font-normal"> / {days.length} days present</span></p>
            <p className="text-xs text-oxblood mt-0.5">{loading ? '' : `${absentCount} absent`}</p>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading ? (
            <p className="text-sm text-muted text-center py-10">Loading…</p>
          ) : (
            <table className="p-table w-full">
              <thead><tr><th>Date</th><th>Status</th><th>Clocked In</th><th>Clocked Out</th></tr></thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d.date}>
                    <td className="font-mono text-xs">{new Date(`${d.date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                    <td>
                      <span className={`p-badge ${d.present ? 'p-badge-success' : 'p-badge-danger'}`}>{d.present ? 'Present' : 'Absent'}</span>
                    </td>
                    <td className="text-xs text-muted">{d.firstIn ? new Date(d.firstIn).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '—'}</td>
                    <td className="text-xs text-muted">{d.lastOut ? new Date(d.lastOut).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
function CommissionTab() {
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<{ staff_id: string; full_name: string; commission_rate: number; sale_count: number; total: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    const { data: sales } = await supabase
      .from('sales')
      .select('staff_id, amount_paid, sold_at, status')
      .not('staff_id', 'is', null)
      .neq('status', 'refunded')
      .gte('sold_at', `${from}T00:00:00`)
      .lte('sold_at', `${to}T23:59:59`);
    const { data: staffRows } = await supabase.from('staff').select('id, full_name, commission_rate');
    const byStaff: Record<string, { count: number; total: number }> = {};
    (sales || []).forEach((s: any) => {
      const key = s.staff_id;
      if (!byStaff[key]) byStaff[key] = { count: 0, total: 0 };
      byStaff[key].count += 1;
      byStaff[key].total += Number(s.amount_paid) || 0;
    });
    const result = (staffRows || [])
      .filter((s: any) => byStaff[s.id])
      .map((s: any) => ({
        staff_id: s.id,
        full_name: s.full_name,
        commission_rate: s.commission_rate,
        sale_count: byStaff[s.id].count,
        total: byStaff[s.id].total,
      }))
      .sort((a: any, b: any) => b.total - a.total);
    setRows(result);
    setLoading(false);
  };
  useEffect(() => { run(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div>
          <label className="p-label block mb-1">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-2 bg-paper border border-thread outline-none focus:border-oxblood" />
        </div>
        <div>
          <label className="p-label block mb-1">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-2 bg-paper border border-thread outline-none focus:border-oxblood" />
        </div>
        <button onClick={run} className="px-4 py-2.5 bg-oxblood text-white text-sm font-bold uppercase tracking-wide hover:bg-oxblood/90">
          {loading ? 'Loading…' : 'Run'}
        </button>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted border-b border-thread">
            <th className="py-2">Staff</th>
            <th className="py-2 text-right">Sales</th>
            <th className="py-2 text-right">Revenue</th>
            <th className="py-2 text-right">Rate</th>
            <th className="py-2 text-right">Commission</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.staff_id} className="border-b border-thread/50">
              <td className="py-2 font-bold text-ink">{r.full_name}</td>
              <td className="py-2 text-right font-mono">{r.sale_count}</td>
              <td className="py-2 text-right font-mono">৳{r.total.toFixed(2)}</td>
              <td className="py-2 text-right font-mono">{r.commission_rate}%</td>
              <td className="py-2 text-right font-mono font-bold text-brass">৳{(r.total * r.commission_rate / 100).toFixed(2)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={5} className="py-6 text-center text-muted">No attributed sales in this range.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
function AuditTab() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [actionFilter, setActionFilter] = useState('');

  const load = async () => {
    let query = supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200);
    if (actionFilter) query = query.eq('action', actionFilter);
    const { data } = await query;
    setRows((data as AuditRow[]) || []);
  };
  useEffect(() => { load(); }, [actionFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="mb-4">
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="px-3 py-2 bg-paper border border-thread outline-none focus:border-oxblood text-sm">
          <option value="">All actions</option>
          <option value="edit">Edits</option>
          <option value="void">Voids</option>
          <option value="refund">Refunds</option>
          <option value="discount_override">Discount overrides</option>
        </select>
      </div>
      <div className="space-y-2 max-h-[32rem] overflow-y-auto">
        {rows.map(r => (
          <div key={r.id} className="p-3 border border-thread bg-canvas text-sm">
            <div className="flex justify-between items-baseline">
              <span className="font-bold uppercase text-xs tracking-wide text-oxblood">{r.action}</span>
              <span className="text-xs text-muted font-mono">{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <p className="text-ink mt-1">
              {r.entity_type}{r.entity_id ? ` #${r.entity_id}` : ''}
              {r.actor_staff_name ? ` — by ${r.actor_staff_name}` : r.actor_account_role ? ` — ${r.actor_account_role} account` : ''}
              {r.approved_by_staff_name ? `, approved by ${r.approved_by_staff_name}` : ''}
            </p>
            {r.reason && <p className="text-xs text-muted mt-0.5">Reason: {r.reason}</p>}
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-muted">No audit entries yet.</p>}
      </div>
    </div>
  );
}
