'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useStaffSession } from '@/lib/staffSession';
import { hasPermission, actingStaffRole } from '@/lib/permissions';
import { logAudit } from '@/lib/audit';

function generateGiftCardCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'GC-';
  for (let i = 0; i < 10; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function ExchangePanel() {
  const { currentStaff, requestManagerApproval } = useStaffSession();

  const [originalBarcode, setOriginalBarcode] = useState('');
  const [originalSales, setOriginalSales] = useState<any[]>([]);
  const [selectedSale, setSelectedSale] = useState<any>(null);

  const [newBarcode, setNewBarcode] = useState('');
  const [newItem, setNewItem] = useState<any>(null);

  const [settlement, setSettlement] = useState<'cash' | 'store_credit'>('cash');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  const searchOriginal = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!originalBarcode) return;
    const { data, error } = await supabase
      .from('sales')
      .select(`*, dresses!inner ( id, name, barcode, size, color, category )`)
      .eq('dresses.barcode', originalBarcode)
      .eq('status', 'completed')
      .order('sold_at', { ascending: false });
    if (error || !data || data.length === 0) {
      setMessage({ type: 'error', text: 'No completed sale found for that barcode.' });
      setOriginalSales([]);
    } else {
      setOriginalSales(data);
    }
  };

  const searchNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    if (!newBarcode) return;
    const { data, error } = await supabase.from('dresses').select('*').eq('barcode', newBarcode).eq('status', 'available').gt('quantity', 0).single();
    if (error || !data) {
      setMessage({ type: 'error', text: 'No in-stock item found for that barcode.' });
      setNewItem(null);
    } else {
      setNewItem(data);
    }
  };

  const priceDifference = selectedSale && newItem ? Number(newItem.price) - Number(selectedSale.amount_paid) : 0;

  const confirmExchange = async () => {
    if (!selectedSale || !newItem) return;
    setBusy(true);
    setMessage({ type: '', text: '' });

    // Store paying the customer back (negative difference) needs the same
    // approval a cash refund would — a straight even swap or the customer
    // paying more does not.
    let approver: { id: string; full_name: string } | null = null;
    if (priceDifference < 0 && !hasPermission(actingStaffRole(currentStaff), 'process_refund')) {
      approver = await requestManagerApproval(`Exchange settling ৳${Math.abs(priceDifference)} back to the customer`);
      if (!approver) { setBusy(false); return; }
    }

    let storeCreditCode: string | null = null;
    if (priceDifference < 0 && settlement === 'store_credit') {
      storeCreditCode = generateGiftCardCode();
      const { data: gc, error: gcError } = await supabase.from('gift_cards').insert([{
        code: storeCreditCode, initial_balance: Math.abs(priceDifference), current_balance: Math.abs(priceDifference),
        source: 'issued_as_credit', status: 'active',
      }]).select().single();
      if (gcError || !gc) {
        setMessage({ type: 'error', text: 'Failed to issue store credit.' });
        setBusy(false);
        return;
      }
      await supabase.from('gift_card_transactions').insert([{ gift_card_id: gc.id, type: 'issue', amount: Math.abs(priceDifference) }]);
    }

    // Move stock: the old unit comes back, the new unit leaves.
    await supabase.from('dresses').update({ quantity: selectedSale.dresses.quantity + 1, status: 'available' }).eq('id', selectedSale.dresses.id);
    const newQty = newItem.quantity - 1;
    await supabase.from('dresses').update({ quantity: newQty, status: newQty === 0 ? 'sold' : 'available' }).eq('id', newItem.id);

    const { error: insertError } = await supabase.from('exchanges').insert([{
      original_sale_id: selectedSale.id,
      old_dress_id: selectedSale.dresses.id,
      new_dress_id: newItem.id,
      price_difference: priceDifference,
      settlement_method: priceDifference === 0 ? 'none' : settlement,
      store_credit_code: storeCreditCode,
      staff_id: currentStaff?.id ?? null,
      approved_by_staff_id: approver?.id ?? null,
      reason: reason || null,
    }]);

    if (insertError) {
      setMessage({ type: 'error', text: 'Stock was moved but the exchange record failed to save — check the exchanges table.' });
    } else {
      logAudit({
        action: 'exchange',
        entityType: 'sale',
        entityId: selectedSale.id,
        before: { dress: selectedSale.dresses.name, size: selectedSale.dresses.size, color: selectedSale.dresses.color },
        after: { dress: newItem.name, size: newItem.size, color: newItem.color, price_difference: priceDifference },
        reason: reason || undefined,
        actor: currentStaff,
        approvedBy: approver,
      });
      setMessage({
        type: 'success',
        text: priceDifference > 0
          ? `Exchange done — collect ৳${priceDifference} from the customer.`
          : priceDifference < 0
            ? (storeCreditCode ? `Exchange done — store credit issued: ${storeCreditCode} for ৳${Math.abs(priceDifference)}.` : `Exchange done — refund ৳${Math.abs(priceDifference)} in cash.`)
            : 'Exchange done — even swap, nothing owed either way.',
      });
      setSelectedSale(null); setNewItem(null); setOriginalSales([]); setOriginalBarcode(''); setNewBarcode(''); setReason('');
    }
    setBusy(false);
  };

  return (
    <div className="max-w-2xl space-y-8">
      {/* Step 1 */}
      <div>
        <p className="p-label mb-2">1. Scan the item being returned</p>
        <form onSubmit={searchOriginal} className="flex gap-2">
          <input value={originalBarcode} onChange={e => setOriginalBarcode(e.target.value)} placeholder="Scan barcode..." className="flex-1 px-4 py-2.5 bg-paper border border-thread outline-none focus:border-oxblood font-mono" />
          <button type="submit" className="px-4 py-2.5 bg-oxblood text-white text-sm font-bold uppercase hover:bg-oxblood/90">Search</button>
        </form>
        {originalSales.length > 0 && !selectedSale && (
          <div className="mt-3 space-y-2">
            {originalSales.map((s: any) => (
              <button key={s.id} onClick={() => setSelectedSale(s)} className="w-full text-left p-3 border border-thread bg-canvas hover:border-oxblood transition-colors">
                <p className="font-bold text-sm text-ink">{s.dresses.name} — {s.dresses.size} / {s.dresses.color}</p>
                <p className="text-xs text-muted">Sold for ৳{s.amount_paid} on {new Date(s.sold_at).toLocaleDateString()}</p>
              </button>
            ))}
          </div>
        )}
        {selectedSale && (
          <div className="mt-3 p-3 border border-brass bg-canvas flex justify-between items-center">
            <div>
              <p className="font-bold text-sm text-ink">{selectedSale.dresses.name} — {selectedSale.dresses.size} / {selectedSale.dresses.color}</p>
              <p className="text-xs text-muted">Sold for ৳{selectedSale.amount_paid}</p>
            </div>
            <button onClick={() => { setSelectedSale(null); setOriginalSales([]); }} className="text-xs text-muted underline">Change</button>
          </div>
        )}
      </div>

      {/* Step 2 */}
      {selectedSale && (
        <div>
          <p className="p-label mb-2">2. Scan the replacement item</p>
          <form onSubmit={searchNew} className="flex gap-2">
            <input value={newBarcode} onChange={e => setNewBarcode(e.target.value)} placeholder="Scan barcode..." className="flex-1 px-4 py-2.5 bg-paper border border-thread outline-none focus:border-oxblood font-mono" />
            <button type="submit" className="px-4 py-2.5 bg-oxblood text-white text-sm font-bold uppercase hover:bg-oxblood/90">Search</button>
          </form>
          {newItem && (
            <div className="mt-3 p-3 border border-brass bg-canvas">
              <p className="font-bold text-sm text-ink">{newItem.name} — {newItem.size} / {newItem.color}</p>
              <p className="text-xs text-muted">Price ৳{newItem.price}</p>
            </div>
          )}
        </div>
      )}

      {/* Step 3 */}
      {selectedSale && newItem && (
        <div className="p-4 border border-thread bg-paper space-y-3">
          <p className="font-display text-lg text-ink">
            {priceDifference > 0 && `Customer owes ৳${priceDifference} more`}
            {priceDifference < 0 && `Store owes customer ৳${Math.abs(priceDifference)}`}
            {priceDifference === 0 && 'Even swap — nothing owed'}
          </p>
          {priceDifference < 0 && (
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1.5"><input type="radio" checked={settlement === 'cash'} onChange={() => setSettlement('cash')} /> Cash refund</label>
              <label className="flex items-center gap-1.5"><input type="radio" checked={settlement === 'store_credit'} onChange={() => setSettlement('store_credit')} /> Store credit</label>
            </div>
          )}
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason (optional)" className="w-full px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood text-sm" />
          <button onClick={confirmExchange} disabled={busy} className="w-full px-4 py-3 bg-brass text-white text-sm font-bold uppercase tracking-wide hover:bg-brass/90 disabled:opacity-50">
            {busy ? 'Processing…' : 'Confirm Exchange'}
          </button>
        </div>
      )}

      {message.text && (
        <p className={`text-sm font-semibold ${message.type === 'error' ? 'text-oxblood' : 'text-brass'}`}>{message.text}</p>
      )}
    </div>
  );
}
