'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { hasPermission, type AccountRole } from '@/lib/permissions';
import { useStaffSession } from '@/lib/staffSession';
import { LOYALTY_REDEEM_VALUE } from '@/lib/loyalty';

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  loyalty_points: number;
  total_spent: number;
  visit_count: number;
  created_at: string;
};

export default function CustomersPanel({ accountRole }: { accountRole: AccountRole | null }) {
  const { currentStaff } = useStaffSession();
  const canAdjust = hasPermission(accountRole, 'manage_customers');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loyaltyLog, setLoyaltyLog] = useState<any[]>([]);
  const [adjustDraft, setAdjustDraft] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [message, setMessage] = useState('');

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const search = async () => {
    if (!query.trim()) { setResults([]); return; }
    const { data } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(25);
    setResults((data as Customer[]) || []);
  };
  useEffect(() => { const t = setTimeout(search, 300); return () => clearTimeout(t); }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCustomer = async (c: Customer) => {
    setSelected(c);
    const { data: sales } = await supabase
      .from('sales')
      .select('*, dresses ( name, size, color )')
      .eq('customer_id', c.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setHistory(sales || []);
    const { data: loyalty } = await supabase
      .from('loyalty_transactions')
      .select('*')
      .eq('customer_id', c.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setLoyaltyLog(loyalty || []);
  };

  const createCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const { data, error } = await supabase.from('customers').insert([{
      name: newName.trim(), phone: newPhone.trim() || null, email: newEmail.trim() || null,
    }]).select().single();
    if (error) { setMessage('Failed to create customer. Make sure migration_012 has been run.'); return; }
    setNewName(''); setNewPhone(''); setNewEmail('');
    setResults(r => [data as Customer, ...r]);
    openCustomer(data as Customer);
  };

  const adjustPoints = async () => {
    if (!selected) return;
    const delta = parseInt(adjustDraft);
    if (!delta) return;
    await supabase.from('customers').update({ loyalty_points: selected.loyalty_points + delta }).eq('id', selected.id);
    await supabase.from('loyalty_transactions').insert([{
      customer_id: selected.id, type: 'adjust', points: delta, note: adjustNote || null, staff_id: currentStaff?.id ?? null,
    }]);
    setAdjustDraft(''); setAdjustNote('');
    openCustomer({ ...selected, loyalty_points: selected.loyalty_points + delta });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <p className="p-label mb-2">Find a customer</p>
        <input
          value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or phone…"
          className="w-full px-4 py-2.5 bg-paper border border-thread outline-none focus:border-oxblood text-sm mb-3"
        />
        <div className="space-y-1 mb-6">
          {results.map(c => (
            <button key={c.id} onClick={() => openCustomer(c)} className={`w-full text-left p-3 border transition-colors ${selected?.id === c.id ? 'border-oxblood bg-canvas' : 'border-thread bg-canvas hover:border-oxblood/50'}`}>
              <p className="font-bold text-ink text-sm">{c.name}</p>
              <p className="text-xs text-muted">{c.phone || 'no phone'} · {c.loyalty_points} pts · ৳{c.total_spent} lifetime</p>
            </button>
          ))}
          {query.trim() && results.length === 0 && <p className="text-sm text-muted">No matches — add them below.</p>}
        </div>

        <p className="p-label mb-2">Add new customer</p>
        <form onSubmit={createCustomer} className="p-4 border border-thread bg-paper space-y-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" required className="w-full px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood text-sm" />
          <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Phone" className="w-full px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood text-sm" />
          <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email (optional)" className="w-full px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood text-sm" />
          <button type="submit" className="px-4 py-2.5 bg-oxblood text-white text-sm font-bold uppercase tracking-wide hover:bg-oxblood/90">Add Customer</button>
        </form>
        {message && <p className="text-sm text-muted mt-2">{message}</p>}
      </div>

      <div>
        {!selected ? (
          <p className="text-sm text-muted">Select a customer to see their history.</p>
        ) : (
          <div>
            <h4 className="font-display text-lg text-ink">{selected.name}</h4>
            <p className="text-xs text-muted mb-4">{selected.phone} {selected.email && `· ${selected.email}`}</p>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-3 border border-thread bg-canvas text-center">
                <p className="font-mono font-bold text-lg text-brass">{selected.loyalty_points}</p>
                <p className="text-[10px] uppercase text-muted">Points (≈৳{selected.loyalty_points * LOYALTY_REDEEM_VALUE})</p>
              </div>
              <div className="p-3 border border-thread bg-canvas text-center">
                <p className="font-mono font-bold text-lg text-ink">৳{selected.total_spent}</p>
                <p className="text-[10px] uppercase text-muted">Lifetime spend</p>
              </div>
              <div className="p-3 border border-thread bg-canvas text-center">
                <p className="font-mono font-bold text-lg text-ink">{selected.visit_count}</p>
                <p className="text-[10px] uppercase text-muted">Visits</p>
              </div>
            </div>

            {canAdjust && (
              <div className="flex gap-2 mb-6">
                <input type="number" placeholder="+/- points" value={adjustDraft} onChange={e => setAdjustDraft(e.target.value)} className="w-28 px-3 py-2 bg-paper border border-thread outline-none focus:border-oxblood text-sm" />
                <input placeholder="Reason (optional)" value={adjustNote} onChange={e => setAdjustNote(e.target.value)} className="flex-1 px-3 py-2 bg-paper border border-thread outline-none focus:border-oxblood text-sm" />
                <button onClick={adjustPoints} className="px-3 py-2 text-xs font-bold uppercase border border-brass/30 text-brass hover:bg-brass hover:text-white">Adjust</button>
              </div>
            )}

            <p className="p-label mb-2">Purchase history</p>
            <div className="space-y-1 mb-6 max-h-64 overflow-y-auto">
              {history.map(s => (
                <div key={s.id} className="flex justify-between text-sm p-2 border border-thread/50">
                  <span>{s.dresses?.name} — {s.dresses?.size}/{s.dresses?.color}</span>
                  <span className="font-mono">৳{s.amount_paid}</span>
                </div>
              ))}
              {history.length === 0 && <p className="text-sm text-muted">No purchases on record yet.</p>}
            </div>

            <p className="p-label mb-2">Loyalty activity</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {loyaltyLog.map(l => (
                <div key={l.id} className="flex justify-between text-sm p-2 border border-thread/50">
                  <span className="capitalize">{l.type}{l.note ? ` — ${l.note}` : ''}</span>
                  <span className={`font-mono font-bold ${l.points >= 0 ? 'text-brass' : 'text-oxblood'}`}>{l.points >= 0 ? '+' : ''}{l.points}</span>
                </div>
              ))}
              {loyaltyLog.length === 0 && <p className="text-sm text-muted">No point activity yet.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
