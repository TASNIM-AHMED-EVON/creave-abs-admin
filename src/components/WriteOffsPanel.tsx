'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { hasPermission, actingStaffRole } from '@/lib/permissions';
import { useStaffSession } from '@/lib/staffSession';
import { logAudit } from '@/lib/audit';

const REASONS = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'defective', label: 'Defective' },
  { value: 'lost', label: 'Lost' },
  { value: 'expired', label: 'Expired' },
  { value: 'other', label: 'Other' },
];

export default function WriteOffsPanel() {
  const { currentStaff, requestManagerApproval } = useStaffSession();

  const [barcode, setBarcode] = useState('');
  const [item, setItem] = useState<any>(null);
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('damaged');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<any[]>([]);

  const loadRecent = async () => {
    const { data } = await supabase
      .from('stock_writeoffs')
      .select('*, dresses ( name, barcode, size, color )')
      .order('created_at', { ascending: false })
      .limit(30);
    setRecent(data || []);
  };
  useEffect(() => { loadRecent(); }, []);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setItem(null);
    if (!barcode) return;
    const { data, error } = await supabase.from('dresses').select('*').eq('barcode', barcode).single();
    if (error || !data) {
      setMessage({ type: 'error', text: 'No product with that barcode.' });
    } else {
      setItem(data);
    }
  };

  const submit = async () => {
    if (!item) return;
    const qty = Math.max(parseInt(quantity) || 0, 0);
    if (qty < 1 || qty > item.quantity) {
      setMessage({ type: 'error', text: `Enter a quantity between 1 and ${item.quantity}.` });
      return;
    }
    setBusy(true);

    let approver: { id: string; full_name: string } | null = null;
    if (!hasPermission(actingStaffRole(currentStaff), 'void_action')) {
      approver = await requestManagerApproval(`Writing off ${qty}x ${item.name} as ${reason}`);
      if (!approver) { setBusy(false); return; }
    }

    const newQty = item.quantity - qty;
    await supabase.from('dresses').update({ quantity: newQty, status: newQty === 0 ? 'sold' : item.status }).eq('id', item.id);

    const { error } = await supabase.from('stock_writeoffs').insert([{
      dress_id: item.id, quantity: qty, reason, notes: notes.trim() || null,
      staff_id: currentStaff?.id ?? null, approved_by_staff_id: approver?.id ?? null,
    }]);

    if (error) {
      setMessage({ type: 'error', text: 'Stock was deducted but the write-off record failed to save. Make sure migration_012 has been run.' });
    } else {
      logAudit({
        action: 'void',
        entityType: 'dress',
        entityId: item.id,
        before: { quantity: item.quantity },
        after: { quantity: newQty, written_off: qty, reason },
        reason: notes.trim() || reason,
        actor: currentStaff,
        approvedBy: approver,
      });
      setMessage({ type: 'success', text: `${qty} unit(s) of ${item.name} written off as ${reason}.` });
      setItem(null); setBarcode(''); setQuantity('1'); setNotes('');
      loadRecent();
    }
    setBusy(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <p className="p-label mb-2">Scan the item</p>
        <form onSubmit={search} className="flex gap-2 mb-4">
          <input value={barcode} onChange={e => setBarcode(e.target.value)} placeholder="Barcode..." className="flex-1 px-4 py-2.5 bg-paper border border-thread outline-none focus:border-oxblood font-mono text-sm" />
          <button type="submit" className="px-4 py-2.5 bg-ink text-white text-sm font-bold uppercase hover:bg-ink/90">Search</button>
        </form>

        {item && (
          <div className="p-4 border border-thread bg-paper space-y-3">
            <p className="font-bold text-ink text-sm">{item.name} — {item.size}/{item.color} · {item.quantity} in stock</p>
            <div className="flex gap-3">
              <div>
                <label className="p-label block mb-1">Quantity</label>
                <input type="number" min="1" max={item.quantity} value={quantity} onChange={e => setQuantity(e.target.value)} className="w-24 px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood text-sm" />
              </div>
              <div className="flex-1">
                <label className="p-label block mb-1">Reason</label>
                <select value={reason} onChange={e => setReason(e.target.value)} className="w-full px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood text-sm">
                  {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2} className="w-full px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood text-sm resize-none" />
            <button onClick={submit} disabled={busy} className="w-full px-4 py-3 bg-oxblood text-white text-sm font-bold uppercase tracking-wide hover:bg-oxblood/90 disabled:opacity-50">
              {busy ? 'Recording…' : 'Write Off Stock'}
            </button>
          </div>
        )}
        {message.text && <p className={`text-sm font-semibold mt-2 ${message.type === 'error' ? 'text-oxblood' : 'text-brass'}`}>{message.text}</p>}
      </div>

      <div>
        <p className="p-label mb-2">Recent write-offs</p>
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {recent.map(r => (
            <div key={r.id} className="p-3 border border-thread bg-canvas text-sm">
              <div className="flex justify-between">
                <span className="font-bold text-ink">{r.quantity}x {r.dresses?.name}</span>
                <span className="text-xs text-muted font-mono">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-muted uppercase">{r.reason}{r.notes ? ` — ${r.notes}` : ''}</p>
            </div>
          ))}
          {recent.length === 0 && <p className="text-sm text-muted">No write-offs recorded yet.</p>}
        </div>
      </div>
    </div>
  );
}
