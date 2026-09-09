'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { hasPermission, actingStaffRole } from '@/lib/permissions';
import { useStaffSession } from '@/lib/staffSession';
import { logAudit } from '@/lib/audit';

type Layaway = {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  dress_id: number;
  total_amount: number;
  balance_remaining: number;
  status: 'active' | 'completed' | 'cancelled' | 'forfeited';
  due_date: string | null;
  created_at: string;
  dresses?: { name: string; barcode: string; size: string | null; color: string | null };
};

export default function LayawayPanel() {
  const { currentStaff, requestManagerApproval } = useStaffSession();

  const [barcode, setBarcode] = useState('');
  const [item, setItem] = useState<any>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deposit, setDeposit] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  const [layaways, setLayaways] = useState<Layaway[]>([]);
  const [paymentDrafts, setPaymentDrafts] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase
      .from('layaways')
      .select('*, dresses ( name, barcode, size, color )')
      .order('created_at', { ascending: false });
    setLayaways((data as Layaway[]) || []);
  };
  useEffect(() => { load(); }, []);

  const searchItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setItem(null);
    if (!barcode) return;
    const { data, error } = await supabase.from('dresses').select('*').eq('barcode', barcode).single();
    if (error || !data) {
      setMessage({ type: 'error', text: 'No product with that barcode.' });
    } else if (data.quantity < 1) {
      setMessage({ type: 'error', text: `${data.name} has no stock available to reserve.` });
    } else {
      setItem(data);
    }
  };

  const startLayaway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !customerName.trim()) return;
    const depositAmt = Math.max(parseFloat(deposit) || 0, 0);
    if (depositAmt > item.price) { setMessage({ type: 'error', text: 'Deposit can\'t exceed the item price.' }); return; }
    setBusy(true);

    // Stock is spoken for immediately, same as a normal sale.
    const newQty = item.quantity - 1;
    await supabase.from('dresses').update({ quantity: newQty, status: newQty === 0 ? 'sold' : 'available' }).eq('id', item.id);

    const { data: layaway, error } = await supabase.from('layaways').insert([{
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim() || null,
      dress_id: item.id,
      total_amount: item.price,
      balance_remaining: item.price - depositAmt,
      due_date: dueDate || null,
      staff_id: currentStaff?.id ?? null,
    }]).select().single();

    if (error || !layaway) {
      setMessage({ type: 'error', text: 'Failed to start layaway. Make sure migration_011 has been run.' });
      // Roll back the stock hold since the plan was never created.
      await supabase.from('dresses').update({ quantity: item.quantity, status: item.status }).eq('id', item.id);
    } else {
      if (depositAmt > 0) {
        await supabase.from('layaway_payments').insert([{ layaway_id: layaway.id, amount: depositAmt, method: 'cash', staff_id: currentStaff?.id ?? null }]);
      }
      setMessage({ type: 'success', text: `Layaway started for ${customerName}. Balance remaining: ৳${item.price - depositAmt}.` });
      setItem(null); setBarcode(''); setCustomerName(''); setCustomerPhone(''); setDeposit(''); setDueDate('');
      load();
    }
    setBusy(false);
  };

  const addPayment = async (l: Layaway) => {
    const amt = parseFloat(paymentDrafts[l.id]);
    if (!amt || amt <= 0) return;
    const applied = Math.min(amt, l.balance_remaining);
    const newBalance = l.balance_remaining - applied;
    await supabase.from('layaway_payments').insert([{ layaway_id: l.id, amount: applied, method: 'cash', staff_id: currentStaff?.id ?? null }]);

    if (newBalance <= 0) {
      // Paid off — record the actual sale now, on today's date, for full
      // total (deposit + every installment already add up to total_amount).
      const { data: sale } = await supabase.from('sales').insert([{
        dress_id: l.dress_id,
        payment_method: 'cash',
        amount_paid: l.total_amount,
        discount_amount: 0,
        tax_amount: 0,
        status: 'completed',
        staff_id: currentStaff?.id ?? null,
      }]).select().single();
      await supabase.from('layaways').update({ balance_remaining: 0, status: 'completed', completed_sale_id: sale?.id ?? null }).eq('id', l.id);
    } else {
      await supabase.from('layaways').update({ balance_remaining: newBalance }).eq('id', l.id);
    }
    setPaymentDrafts(prev => ({ ...prev, [l.id]: '' }));
    load();
  };

  const endLayaway = async (l: Layaway, outcome: 'cancelled' | 'forfeited') => {
    const label = outcome === 'cancelled' ? 'Cancel (refund deposit) this layaway' : 'Forfeit (keep deposit) this layaway';
    if (!window.confirm(`${label} for ${l.customer_name}? The reserved stock will be returned to available inventory.`)) return;

    let approver: { id: string; full_name: string } | null = null;
    if (!hasPermission(actingStaffRole(currentStaff), 'void_action')) {
      approver = await requestManagerApproval(`${outcome === 'cancelled' ? 'Cancelling' : 'Forfeiting'} ${l.customer_name}'s layaway`);
      if (!approver) return;
    }

    const { data: dress } = await supabase.from('dresses').select('quantity').eq('id', l.dress_id).single();
    if (dress) {
      await supabase.from('dresses').update({ quantity: dress.quantity + 1, status: 'available' }).eq('id', l.dress_id);
    }
    await supabase.from('layaways').update({ status: outcome }).eq('id', l.id);

    logAudit({
      action: 'void',
      entityType: 'layaway',
      entityId: l.id,
      before: { status: l.status, balance_remaining: l.balance_remaining },
      after: { status: outcome },
      actor: currentStaff,
      approvedBy: approver,
    });
    load();
  };

  const active = layaways.filter(l => l.status === 'active');
  const history = layaways.filter(l => l.status !== 'active');

  return (
    <div className="space-y-8">
      <div>
        <p className="p-label mb-2">Start a new layaway</p>
        {!item ? (
          <form onSubmit={searchItem} className="flex gap-2 max-w-lg">
            <input value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Scan the item to reserve..." className="flex-1 px-4 py-2.5 bg-paper border border-thread outline-none focus:border-oxblood font-mono" />
            <button type="submit" className="px-4 py-2.5 bg-oxblood text-white text-sm font-bold uppercase hover:bg-oxblood/90">Search</button>
          </form>
        ) : (
          <form onSubmit={startLayaway} className="max-w-lg p-4 border border-thread bg-paper space-y-3">
            <div className="flex justify-between items-center">
              <p className="font-bold text-ink text-sm">{item.name} — ৳{item.price}</p>
              <button type="button" onClick={() => setItem(null)} className="text-xs text-muted underline">change</button>
            </div>
            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name" required className="w-full px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood text-sm" />
            <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone (optional)" className="w-full px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood text-sm" />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="p-label block mb-1">Deposit today (৳)</label>
                <input type="number" value={deposit} onChange={e => setDeposit(e.target.value)} className="w-full px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood text-sm" />
              </div>
              <div className="flex-1">
                <label className="p-label block mb-1">Due date (optional)</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood text-sm" />
              </div>
            </div>
            <button type="submit" disabled={busy} className="w-full px-4 py-3 bg-brass text-white text-sm font-bold uppercase tracking-wide hover:bg-brass/90 disabled:opacity-50">
              {busy ? 'Starting…' : 'Start Layaway'}
            </button>
          </form>
        )}
        {message.text && <p className={`text-sm font-semibold mt-2 ${message.type === 'error' ? 'text-oxblood' : 'text-brass'}`}>{message.text}</p>}
      </div>

      <div>
        <p className="p-label mb-2">Active layaways</p>
        <div className="space-y-2">
          {active.map(l => (
            <div key={l.id} className="p-3 border border-thread bg-canvas">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <p className="font-bold text-ink text-sm">{l.customer_name} {l.customer_phone && <span className="text-muted font-normal">· {l.customer_phone}</span>}</p>
                  <p className="text-xs text-muted">{l.dresses?.name} — {l.dresses?.size} / {l.dresses?.color} · total ৳{l.total_amount}{l.due_date && ` · due ${l.due_date}`}</p>
                </div>
                <p className="font-mono text-sm font-bold text-oxblood">৳{l.balance_remaining} left</p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number" placeholder="Payment amount" value={paymentDrafts[l.id] || ''}
                  onChange={e => setPaymentDrafts(prev => ({ ...prev, [l.id]: e.target.value }))}
                  className="w-36 px-3 py-2 bg-paper border border-thread outline-none focus:border-oxblood text-sm"
                />
                <button onClick={() => addPayment(l)} className="px-3 py-2 text-xs font-bold uppercase bg-brass text-white hover:bg-brass/90">Record Payment</button>
                <button onClick={() => endLayaway(l, 'cancelled')} className="px-3 py-2 text-xs font-bold uppercase border border-thread hover:bg-paper ml-auto">Cancel</button>
                <button onClick={() => endLayaway(l, 'forfeited')} className="px-3 py-2 text-xs font-bold uppercase border border-oxblood/30 text-oxblood hover:bg-oxblood hover:text-white">Forfeit</button>
              </div>
            </div>
          ))}
          {active.length === 0 && <p className="text-sm text-muted">No active layaways.</p>}
        </div>
      </div>

      <div>
        <p className="p-label mb-2">History</p>
        <div className="space-y-1">
          {history.slice(0, 20).map(l => (
            <div key={l.id} className="flex justify-between text-sm p-2 border border-thread/50">
              <span>{l.customer_name} — {l.dresses?.name}</span>
              <span className={`uppercase text-xs font-bold ${l.status === 'completed' ? 'text-brass' : 'text-oxblood'}`}>{l.status}</span>
            </div>
          ))}
          {history.length === 0 && <p className="text-sm text-muted">Nothing here yet.</p>}
        </div>
      </div>
    </div>
  );
}
