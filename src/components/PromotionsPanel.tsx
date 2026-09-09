'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { hasPermission, type AccountRole } from '@/lib/permissions';

export type Promotion = {
  id: string;
  name: string;
  requires_code: boolean;
  code: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_quantity: number | null;
  min_amount: number | null;
  category: string | null;
  buy_qty: number | null;
  get_qty: number | null;
  get_discount_percent: number | null;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  times_used: number;
  active: boolean;
  created_at: string;
};

type Kind = 'coupon' | 'tiered' | 'bulk' | 'bogo' | 'seasonal';

function describePromo(p: Promotion): string {
  const bits: string[] = [];
  if (p.requires_code) bits.push(`code "${p.code}"`);
  if (p.min_quantity) bits.push(`buy ${p.min_quantity}+ units`);
  if (p.min_amount) bits.push(`spend ৳${p.min_amount}+`);
  if (p.buy_qty && p.get_qty) bits.push(`buy ${p.buy_qty} get ${p.get_qty} at ${p.get_discount_percent}% off`);
  if (p.starts_at || p.ends_at) bits.push('seasonal window');
  if (p.category) bits.push(`in ${p.category}`);
  const discount = p.buy_qty ? '' : p.discount_type === 'percent' ? `${p.discount_value}% off` : `৳${p.discount_value} off`;
  return [discount, ...bits].filter(Boolean).join(' · ');
}

export default function PromotionsPanel({ accountRole }: { accountRole: AccountRole | null }) {
  const canManage = hasPermission(accountRole, 'manage_promotions');
  const [subtab, setSubtab] = useState<'active' | 'manage'>('active');
  const [promos, setPromos] = useState<Promotion[]>([]);

  const load = async () => {
    const { data } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
    setPromos((data as Promotion[]) || []);
  };
  useEffect(() => { load(); }, []);

  return (
    <div>
      {canManage && (
        <div className="flex gap-2 mb-6 border-b border-thread">
          {(['active', 'manage'] as const).map(t => (
            <button
              key={t}
              onClick={() => setSubtab(t)}
              className={`px-4 py-2.5 text-sm font-bold uppercase tracking-wide border-b-2 transition-colors ${subtab === t ? 'border-oxblood text-oxblood' : 'border-transparent text-muted hover:text-ink'}`}
            >
              {t === 'active' ? 'Active Promotions' : 'Manage'}
            </button>
          ))}
        </div>
      )}
      {subtab === 'active' || !canManage ? (
        <ActiveList promos={promos.filter(p => p.active)} />
      ) : (
        <ManageList promos={promos} reload={load} />
      )}
    </div>
  );
}

function ActiveList({ promos }: { promos: Promotion[] }) {
  const now = Date.now();
  const live = promos.filter(p => {
    if (p.starts_at && new Date(p.starts_at).getTime() > now) return false;
    if (p.ends_at && new Date(p.ends_at).getTime() < now) return false;
    if (p.usage_limit != null && p.times_used >= p.usage_limit) return false;
    return true;
  });
  return (
    <div className="space-y-2">
      {live.map(p => (
        <div key={p.id} className="p-3 border border-thread bg-canvas">
          <p className="font-bold text-ink text-sm">{p.name}</p>
          <p className="text-xs text-muted">{describePromo(p)}</p>
        </div>
      ))}
      {live.length === 0 && <p className="text-sm text-muted">No promotions are currently live. {promos.length > 0 && "(Some exist but are inactive, expired, or used up.)"}</p>}
    </div>
  );
}

const emptyDraft = {
  name: '', kind: 'coupon' as Kind, code: '', discount_type: 'percent' as 'percent' | 'fixed', discount_value: '10',
  min_quantity: '', min_amount: '', category: '', buy_qty: '2', get_qty: '1', get_discount_percent: '100',
  starts_at: '', ends_at: '', usage_limit: '',
};

function ManageList({ promos, reload }: { promos: Promotion[]; reload: () => void }) {
  const [draft, setDraft] = useState(emptyDraft);
  const [message, setMessage] = useState('');

  const set = (k: string, v: string) => setDraft(d => ({ ...d, [k]: v }));

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    const payload: any = {
      name: draft.name.trim(),
      requires_code: draft.kind === 'coupon',
      code: draft.kind === 'coupon' ? draft.code.trim().toUpperCase() : null,
      discount_type: draft.discount_type,
      discount_value: draft.kind === 'bogo' ? 0 : parseFloat(draft.discount_value) || 0,
      min_quantity: draft.kind === 'bulk' && draft.min_quantity ? parseInt(draft.min_quantity) : null,
      min_amount: draft.kind === 'tiered' && draft.min_amount ? parseFloat(draft.min_amount) : null,
      category: draft.category.trim() || null,
      buy_qty: draft.kind === 'bogo' ? parseInt(draft.buy_qty) || null : null,
      get_qty: draft.kind === 'bogo' ? parseInt(draft.get_qty) || null : null,
      get_discount_percent: draft.kind === 'bogo' ? parseFloat(draft.get_discount_percent) || null : null,
      starts_at: draft.kind === 'seasonal' && draft.starts_at ? new Date(draft.starts_at).toISOString() : null,
      ends_at: draft.kind === 'seasonal' && draft.ends_at ? new Date(draft.ends_at).toISOString() : null,
      usage_limit: draft.usage_limit ? parseInt(draft.usage_limit) : null,
    };
    if (payload.requires_code && !payload.code) { setMessage('A coupon needs a code.'); return; }
    const { error } = await supabase.from('promotions').insert([payload]);
    if (error) { setMessage(`Failed to create: ${error.message}`); return; }
    setDraft(emptyDraft);
    setMessage('Created.');
    reload();
  };

  const toggleActive = async (p: Promotion) => {
    await supabase.from('promotions').update({ active: !p.active }).eq('id', p.id);
    reload();
  };

  return (
    <div>
      <form onSubmit={create} className="p-4 border border-thread bg-paper mb-6 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="p-label block mb-1">Name</label>
            <input value={draft.name} onChange={e => set('name', e.target.value)} className="px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood" />
          </div>
          <div>
            <label className="p-label block mb-1">Kind</label>
            <select value={draft.kind} onChange={e => set('kind', e.target.value)} className="px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood">
              <option value="coupon">Coupon code</option>
              <option value="tiered">Tiered pricing (spend threshold)</option>
              <option value="bulk">Bulk pricing (quantity threshold)</option>
              <option value="bogo">BOGO</option>
              <option value="seasonal">Seasonal sale</option>
            </select>
          </div>
          <div>
            <label className="p-label block mb-1">Category (optional)</label>
            <input value={draft.category} onChange={e => set('category', e.target.value)} placeholder="Leave blank for whole cart" className="px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood" />
          </div>
        </div>

        {draft.kind === 'coupon' && (
          <div>
            <label className="p-label block mb-1">Code customers type in</label>
            <input value={draft.code} onChange={e => set('code', e.target.value.toUpperCase())} className="px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood font-mono" />
          </div>
        )}
        {draft.kind === 'bulk' && (
          <div>
            <label className="p-label block mb-1">Minimum quantity in cart</label>
            <input type="number" value={draft.min_quantity} onChange={e => set('min_quantity', e.target.value)} className="w-32 px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood" />
          </div>
        )}
        {draft.kind === 'tiered' && (
          <div>
            <label className="p-label block mb-1">Minimum subtotal (৳)</label>
            <input type="number" value={draft.min_amount} onChange={e => set('min_amount', e.target.value)} className="w-32 px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood" />
          </div>
        )}
        {draft.kind === 'seasonal' && (
          <div className="flex gap-3">
            <div>
              <label className="p-label block mb-1">Starts</label>
              <input type="date" value={draft.starts_at} onChange={e => set('starts_at', e.target.value)} className="px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood" />
            </div>
            <div>
              <label className="p-label block mb-1">Ends</label>
              <input type="date" value={draft.ends_at} onChange={e => set('ends_at', e.target.value)} className="px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood" />
            </div>
          </div>
        )}
        {draft.kind === 'bogo' ? (
          <div className="flex gap-3 items-end">
            <div>
              <label className="p-label block mb-1">Buy</label>
              <input type="number" value={draft.buy_qty} onChange={e => set('buy_qty', e.target.value)} className="w-20 px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood" />
            </div>
            <div>
              <label className="p-label block mb-1">Get</label>
              <input type="number" value={draft.get_qty} onChange={e => set('get_qty', e.target.value)} className="w-20 px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood" />
            </div>
            <div>
              <label className="p-label block mb-1">At % off (100 = free)</label>
              <input type="number" value={draft.get_discount_percent} onChange={e => set('get_discount_percent', e.target.value)} className="w-28 px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood" />
            </div>
          </div>
        ) : (
          <div className="flex gap-3 items-end">
            <div>
              <label className="p-label block mb-1">Discount type</label>
              <select value={draft.discount_type} onChange={e => set('discount_type', e.target.value)} className="px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood">
                <option value="percent">Percent</option>
                <option value="fixed">Fixed ৳ amount</option>
              </select>
            </div>
            <div>
              <label className="p-label block mb-1">Value</label>
              <input type="number" value={draft.discount_value} onChange={e => set('discount_value', e.target.value)} className="w-28 px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood" />
            </div>
          </div>
        )}
        <div>
          <label className="p-label block mb-1">Usage limit (optional)</label>
          <input type="number" value={draft.usage_limit} onChange={e => set('usage_limit', e.target.value)} placeholder="Unlimited" className="w-32 px-3 py-2 bg-canvas border border-thread outline-none focus:border-oxblood" />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-oxblood text-white text-sm font-bold uppercase tracking-wide hover:bg-oxblood/90">Create Promotion</button>
        {message && <p className="text-sm text-muted">{message}</p>}
      </form>

      <div className="space-y-2">
        {promos.map(p => (
          <div key={p.id} className={`flex items-center justify-between gap-3 p-3 border border-thread ${p.active ? 'bg-canvas' : 'bg-paper opacity-60'}`}>
            <div>
              <p className="font-bold text-ink text-sm">{p.name}</p>
              <p className="text-xs text-muted">{describePromo(p)} · used {p.times_used}{p.usage_limit ? `/${p.usage_limit}` : ''}</p>
            </div>
            <button onClick={() => toggleActive(p)} className="px-3 py-2 text-xs font-bold uppercase border border-thread hover:bg-paper transition-colors">
              {p.active ? 'Deactivate' : 'Reactivate'}
            </button>
          </div>
        ))}
        {promos.length === 0 && <p className="text-sm text-muted">No promotions yet.</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checkout-side evaluation, exported for use from the POS cart. Given the
// cart (array of { id, price, cartQty, category }) and a typed-in code
// (optional), returns the single best-matching promotion and the ৳ amount
// it takes off — or null if nothing applies. Coupon codes are checked
// first (explicit customer intent); if the code doesn't match anything
// live, automatic tiered/bulk/BOGO/seasonal promotions are still evaluated
// so the cart isn't penalized for a mistyped code.
export async function evaluateBestPromotion(
  cart: { id: any; price: number; cartQty: number; category?: string }[],
  typedCode: string
): Promise<{ promotion: Promotion; discountAmount: number } | null> {
  const { data } = await supabase.from('promotions').select('*').eq('active', true);
  const all = (data as Promotion[]) || [];
  const now = Date.now();
  const live = all.filter(p => {
    if (p.starts_at && new Date(p.starts_at).getTime() > now) return false;
    if (p.ends_at && new Date(p.ends_at).getTime() < now) return false;
    if (p.usage_limit != null && p.times_used >= p.usage_limit) return false;
    return true;
  });

  const subtotal = cart.reduce((t, i) => t + i.price * i.cartQty, 0);
  const totalQty = cart.reduce((t, i) => t + i.cartQty, 0);

  const scopedSubtotal = (p: Promotion) => p.category
    ? cart.filter(i => i.category === p.category).reduce((t, i) => t + i.price * i.cartQty, 0)
    : subtotal;
  const scopedQty = (p: Promotion) => p.category
    ? cart.filter(i => i.category === p.category).reduce((t, i) => t + i.cartQty, 0)
    : totalQty;

  const candidates: { promotion: Promotion; discountAmount: number }[] = [];

  const code = typedCode.trim().toUpperCase();
  if (code) {
    const match = live.find(p => p.requires_code && p.code?.toUpperCase() === code);
    if (match) {
      const base = scopedSubtotal(match);
      const amt = match.discount_type === 'percent' ? base * (match.discount_value / 100) : Math.min(match.discount_value, base);
      candidates.push({ promotion: match, discountAmount: Math.round(amt) });
    }
  }

  for (const p of live) {
    if (p.requires_code) continue; // coupons only apply via the code path above
    if (p.min_quantity && scopedQty(p) < p.min_quantity) continue;
    if (p.min_amount && scopedSubtotal(p) < p.min_amount) continue;

    if (p.buy_qty && p.get_qty && p.get_discount_percent != null) {
      // BOGO: for every (buy_qty + get_qty) units in scope, get_qty of them
      // are discounted by get_discount_percent. Uses the cheapest matching
      // units for the discounted slots (standard BOGO convention).
      const scopedItems = (p.category ? cart.filter(i => i.category === p.category) : cart)
        .flatMap(i => Array(i.cartQty).fill(i.price)).sort((a, b) => a - b);
      const groupSize = p.buy_qty + p.get_qty;
      const groups = Math.floor(scopedItems.length / groupSize);
      if (groups < 1) continue;
      const discountedUnits = groups * p.get_qty;
      const amt = scopedItems.slice(0, discountedUnits).reduce((t, price) => t + price * (p.get_discount_percent! / 100), 0);
      candidates.push({ promotion: p, discountAmount: Math.round(amt) });
    } else {
      const base = scopedSubtotal(p);
      const amt = p.discount_type === 'percent' ? base * (p.discount_value / 100) : Math.min(p.discount_value, base);
      candidates.push({ promotion: p, discountAmount: Math.round(amt) });
    }
  }

  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => b.discountAmount - a.discountAmount)[0];
}
