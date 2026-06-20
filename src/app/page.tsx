'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ---------------------------------------------------------------------------
// Icons — a single consistent line-icon set (1.5px stroke), drawn locally so
// the project doesn't need an extra dependency.
// ---------------------------------------------------------------------------
const IconScan = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7V5a1 1 0 011-1h2M4 17v2a1 1 0 001 1h2m12-14V5a1 1 0 00-1-1h-2m3 14v2a1 1 0 01-1 1h-2M7 9v6m3-6v6m4-6v6m3-6v6" />
  </svg>
);
const IconArchive = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 6.75v11.5a1 1 0 001 1h14.5a1 1 0 001-1V6.75M3.75 6.75L5.5 3.75h13l1.75 3M10 11h4" />
  </svg>
);
const IconReturn = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l-4-4 4-4m-4 4h10a5 5 0 015 5v1" />
  </svg>
);
const IconChart = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V10m6 9V5m6 14v-7m6 7H3" />
  </svg>
);
const IconLogout = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 17.5l4-4m0 0l-4-4m4 4h-11m4 5.5v.5a2 2 0 01-2 2H6a2 2 0 01-2-2v-12a2 2 0 012-2h4.5a2 2 0 012 2v.5" />
  </svg>
);
const IconSearch = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2m1.7-5.3a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const IconPlus = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
  </svg>
);
const IconCrate = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13.5V19a2 2 0 01-2 2H6a2 2 0 01-2-2v-5.5M3 9.5L7 4h10l4 5.5M3 9.5h18M3 9.5L4 13h16l1-3.5" />
  </svg>
);
const IconClock = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconCard = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.75 8.5h18.5M4.5 5.5h15a1.75 1.75 0 011.75 1.75v9.5A1.75 1.75 0 0119.5 18.5h-15a1.75 1.75 0 01-1.75-1.75v-9.5A1.75 1.75 0 014.5 5.5zM6 14.5h2.5" />
  </svg>
);
const IconUndo = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);
const IconBag = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 8h12l1 12.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 015 20.5L6 8zM8.5 8V6a3.5 3.5 0 117 0v2" />
  </svg>
);
const IconReceipt = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} {...p}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 3.5h12v17l-2.25-1.5L13.5 20.5l-2.25-1.5L9 20.5l-2.25-1.5L6 20.5v-17z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6M9 11.5h6M9 15h4" />
  </svg>
);

const NAV_ITEMS = [
  { id: 'pos', label: 'POS Terminal', icon: IconScan },
  { id: 'inventory', label: 'Stock & Bundles', icon: IconArchive },
  { id: 'refund', label: 'Refunds', icon: IconReturn },
  { id: 'reports', label: 'Reports', icon: IconChart },
] as const;

const PAYMENT_METHODS = ['cash', 'bkash', 'nagad', 'upay', 'rocket', 'bank/card'] as const;

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'refund' | 'reports'>('pos');

  // POS State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'upay' | 'rocket' | 'cash' | 'bank/card'>('cash');
  const [trxId, setTrxId] = useState('');
  const [posMessage, setPosMessage] = useState({ type: '', text: '' });

  // Inventory State
  const [invBarcode, setInvBarcode] = useState('');
  const [invName, setInvName] = useState('');
  const [invCategory, setInvCategory] = useState('');
  const [invPrice, setInvPrice] = useState('');
  const [invQuantity, setInvQuantity] = useState('1');
  const [invMessage, setInvMessage] = useState({ type: '', text: '' });
  const [recentInventory, setRecentInventory] = useState<any[]>([]);
  const [stockSearchQuery, setStockSearchQuery] = useState('');

  // Refund State
  const [refundBarcode, setRefundBarcode] = useState('');
  const [refundItemSales, setRefundItemSales] = useState<any[]>([]);
  const [refundMessage, setRefundMessage] = useState({ type: '', text: '' });

  // Reports State
  const [salesRecord, setSalesRecord] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueByMethod, setRevenueByMethod] = useState<Record<string, number>>({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // --- INVENTORY MEMOIZED FETCH ---
  const fetchRecentInventory = useCallback(async () => {
    const { data } = await supabase
      .from('dresses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);
    if (data) setRecentInventory(data);
  }, []);

  // --- REPORTS MEMOIZED FETCH ---
  const fetchSalesData = useCallback(async () => {
    let query = supabase.from('sales').select(`*, dresses ( name, barcode )`).order('sold_at', { ascending: false });

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      query = query.gte('sold_at', start.toISOString());
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte('sold_at', end.toISOString());
    }

    const { data } = await query;
    if (data) {
      setSalesRecord(data);
      let total = 0;
      const methods: Record<string, number> = { cash: 0, bkash: 0, nagad: 0, upay: 0, rocket: 0, 'bank/card': 0 };

      data.forEach(sale => {
        if (sale.status === 'completed') {
          const amount = Number(sale.amount_paid);
          total += amount;

          // Decode Bank/Card bypass for reporting
          const displayMethod = sale.transaction_id === 'BANK/CARD-SALE' ? 'bank/card' : sale.payment_method;

          if (methods[displayMethod] !== undefined) methods[displayMethod] += amount;
        }
      });
      setTotalRevenue(total);
      setRevenueByMethod(methods);
    }
  }, [startDate, endDate]);

  // --- 24-HOUR AUTO LOGIN SESSION CHECK ---
  useEffect(() => {
    const savedSessionTime = localStorage.getItem('crave_abs_session_start');
    if (savedSessionTime) {
      const loginTimestamp = parseInt(savedSessionTime, 10);
      const continuousDuration = Date.now() - loginTimestamp;
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (continuousDuration < twentyFourHours) {
        setIsAuthenticated(true);
        fetchRecentInventory();
        fetchSalesData();
      } else {
        localStorage.removeItem('crave_abs_session_start');
      }
    }
  }, [fetchRecentInventory, fetchSalesData]);

  // Auth Submit Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "CRAVE_ABS_2026") {
      localStorage.setItem('crave_abs_session_start', Date.now().toString());
      setIsAuthenticated(true);
      fetchRecentInventory();
      fetchSalesData();
    } else {
      alert("Incorrect Admin Password");
    }
  };

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('crave_abs_session_start');
    setIsAuthenticated(false);
    setPassword('');
  };

  // --- POS FUNCTIONS ---
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosMessage({ type: '', text: '' });
    if (!barcodeInput) return;

    const { data, error } = await supabase
      .from('dresses')
      .select('*')
      .eq('barcode', barcodeInput)
      .single();

    if (error || !data) {
      setPosMessage({ type: 'error', text: 'Dress not found! Check the barcode.' });
    } else {
      const existingCartItem = cart.find(item => item.id === data.id);
      const currentCartQty = existingCartItem ? existingCartItem.cartQty : 0;

      if (currentCartQty + 1 > data.quantity) {
         setPosMessage({ type: 'error', text: 'Not enough stock available for this item!' });
      } else {
         if (existingCartItem) {
           setCart(cart.map(item => item.id === data.id ? { ...item, cartQty: item.cartQty + 1 } : item));
         } else {
           setCart([...cart, { ...data, cartQty: 1 }]);
         }
      }
    }
    setBarcodeInput('');
  };

  const updateCartItemQuantity = (id: string, increment: boolean) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = increment ? item.cartQty + 1 : item.cartQty - 1;
        if (newQty <= 0) return item;
        if (newQty > item.quantity) {
          setPosMessage({ type: 'error', text: `Cannot exceed available physical stock (${item.quantity} available).` });
          return item;
        }
        return { ...item, cartQty: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const salesData: any[] = [];
    cart.forEach(item => {
      for(let i = 0; i < item.cartQty; i++) {
        const dbPaymentMethod = paymentMethod === 'bank/card' ? 'cash' : paymentMethod;
        const dbTrxId = paymentMethod === 'bank/card'
          ? 'BANK/CARD-SALE'
          : (paymentMethod === 'cash' ? 'DIRECT-SALE' : trxId);

        salesData.push({
          dress_id: item.id,
          payment_method: dbPaymentMethod,
          transaction_id: dbTrxId,
          amount_paid: item.price,
          status: 'completed'
        });
      }
    });

    const { error: saleError } = await supabase.from('sales').insert(salesData);

    if (saleError) {
      console.error(saleError);
      setPosMessage({ type: 'error', text: 'Checkout failed. Check console for details.' });
      return;
    }

    for (const item of cart) {
      const newQuantity = item.quantity - item.cartQty;
      await supabase
        .from('dresses')
        .update({
          quantity: newQuantity,
          status: newQuantity === 0 ? 'sold' : 'available'
        })
        .eq('id', item.id);
    }

    setPosMessage({ type: 'success', text: 'Sale recorded! Printing receipt...' });

    setTimeout(() => {
      window.print();
      setCart([]);
      setTrxId('');
      fetchRecentInventory();
      fetchSalesData();
    }, 500);
  };

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.cartQty), 0);

  // --- INVENTORY ADD FUNCTIONS ---
  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvMessage({ type: '', text: '' });
    const qty = parseInt(invQuantity);
    const { error } = await supabase.from('dresses').insert([
      {
        barcode: invBarcode,
        name: invName,
        category: invCategory,
        price: parseFloat(invPrice),
        quantity: qty,
        status: qty > 0 ? 'available' : 'sold'
      }
    ]);
    if (error) {
      setInvMessage({ type: 'error', text: 'Failed to add item. Barcode might already exist.' });
    } else {
      setInvMessage({ type: 'success', text: `Successfully stocked ${qty} item(s)!` });
      setInvBarcode(''); setInvName(''); setInvCategory('');
      setInvPrice(''); setInvQuantity('1');
      fetchRecentInventory();
    }
  };

  // --- REFUND FUNCTIONS ---
  const handleRefundSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefundMessage({ type: '', text: '' });
    if (!refundBarcode) return;

    const { data, error } = await supabase
      .from('sales')
      .select(`*, dresses!inner ( id, name, barcode, quantity )`)
      .eq('dresses.barcode', refundBarcode)
      .eq('status', 'completed')
      .order('sold_at', { ascending: false });
    if (error || !data || data.length === 0) {
      setRefundMessage({ type: 'error', text: 'No active sales history found for this barcode.' });
      setRefundItemSales([]);
    } else {
      setRefundItemSales(data);
    }
  };

  const processRefund = async (sale: any) => {
    if (!window.confirm(`Are you sure you want to refund this purchase of ${sale.dresses.name}?`)) return;
    const { error: updateSaleError } = await supabase.from('sales').update({ status: 'refunded' }).eq('id', sale.id);
    if (updateSaleError) {
      setRefundMessage({ type: 'error', text: 'Failed to update sale status.' });
      return;
    }

    const restoredQuantity = sale.dresses.quantity + 1;
    await supabase.from('dresses').update({ quantity: restoredQuantity, status: 'available' }).eq('id', sale.dresses.id);
    setRefundMessage({ type: 'success', text: 'Refund successful! Stock levels updated.' });
    setRefundBarcode('');
    setRefundItemSales([]);
    fetchRecentInventory();
    fetchSalesData();
  };

  useEffect(() => {
    if (activeTab === 'reports' && isAuthenticated) fetchSalesData();
  }, [activeTab, fetchSalesData, isAuthenticated]);

  const clearDateFilters = () => { setStartDate(''); setEndDate(''); };

  const filteredInventory = recentInventory.filter(item =>
    item.name.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
    item.barcode.toLowerCase().includes(stockSearchQuery.toLowerCase())
  );

  const activeLabel = NAV_ITEMS.find(n => n.id === activeTab)?.label ?? '';

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-4">
        <div className="w-full max-w-[400px]">
          <div className="barcode-stripe h-6 w-28 mx-auto mb-8 opacity-70" />
          <div className="bg-canvas px-10 pt-10 pb-9 border border-thread shadow-sm">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl text-ink tracking-tight">CRAVE <em className="not-italic text-brass">ABS</em></h1>
              <p className="text-muted mt-2 text-xs font-mono uppercase tracking-[0.2em]">Admin Console</p>
              <div className="stitch mt-6" />
            </div>
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Admin Password</label>
                <input
                  type="password"
                  placeholder="••••••••••"
                  className="w-full px-4 py-3 bg-paper border border-thread focus:bg-canvas focus:border-brass transition-colors outline-none text-ink font-mono text-center"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full bg-ink text-paper font-bold text-sm uppercase tracking-wider py-3.5 hover:bg-brass-dark transition-colors">
                Access System
              </button>
            </form>
          </div>
          <p className="text-center text-[11px] text-muted mt-6 font-mono uppercase tracking-widest">Mymensingh · Bangladesh</p>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-paper text-ink font-sans print:bg-white">

      <style jsx global>{`
        @media print {
          @page { margin: 0; }
          body { margin: 1.6cm 1cm; }
        }
      `}</style>

      <div className="lg:flex">

        {/* ---- Sidebar (desktop) ---- */}
        <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-canvas border-r border-thread print:hidden">
          <div className="px-7 pt-8 pb-6">
            <h1 className="font-display text-2xl text-ink tracking-tight leading-none">CRAVE <em className="not-italic text-brass">ABS</em></h1>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted mt-2">Admin Console</p>
          </div>
          <div className="stitch mx-7" />

          <nav className="flex-1 px-4 py-6 space-y-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold transition-colors border-l-2 ${
                  activeTab === id
                    ? id === 'refund'
                      ? 'border-oxblood text-oxblood bg-oxblood-light/60'
                      : 'border-brass text-ink bg-brass-light/50'
                    : 'border-transparent text-muted hover:text-ink hover:bg-paper-dim'
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          <div className="stitch mx-7 mb-4" />
          <div className="px-4 pb-7">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold text-oxblood hover:bg-oxblood-light/60 transition-colors"
            >
              <IconLogout className="w-[18px] h-[18px]" />
              Log Out
            </button>
          </div>
        </aside>

        {/* ---- Top bar (mobile / tablet) ---- */}
        <div className="lg:hidden sticky top-0 z-50 bg-canvas border-b border-thread print:hidden">
          <div className="flex items-center justify-between px-5 h-16">
            <h1 className="font-display text-xl text-ink tracking-tight">CRAVE <em className="not-italic text-brass">ABS</em></h1>
            <button onClick={handleLogout} className="text-[11px] font-bold uppercase tracking-wider text-oxblood">
              Log Out
            </button>
          </div>
          <div className="flex overflow-x-auto px-2 pb-2 gap-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 whitespace-nowrap px-3.5 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                  activeTab === id
                    ? id === 'refund' ? 'text-oxblood bg-oxblood-light/60' : 'text-ink bg-brass-light/50'
                    : 'text-muted'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ---- Main content ---- */}
        <div className="lg:pl-64 flex-1 print:pl-0">
          <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-10 pb-16 print:p-0">

            <div className="hidden lg:flex items-baseline justify-between mb-8 print:hidden">
              <h2 className="font-display text-2xl text-ink">{activeLabel}</h2>
              <p className="text-xs font-mono text-muted uppercase tracking-wider">
                {new Date().toLocaleDateString('en-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* TAB 1: POS TERMINAL */}
            {activeTab === 'pos' && (
              <div className="max-w-2xl print:hidden">
                <div className="bg-canvas border border-thread">
                  <div className="px-7 pt-7">
                    {posMessage.text && (
                      <div className={`px-4 py-3 mb-5 text-sm font-semibold border ${posMessage.type === 'error' ? 'bg-oxblood-light text-oxblood border-oxblood/20' : 'bg-moss-light text-moss border-moss/20'}`}>
                        {posMessage.text}
                      </div>
                    )}

                    <form onSubmit={handleBarcodeSubmit} className="mb-7 relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted">
                        <IconScan className="h-5 w-5" />
                      </div>
                      <input
                        type="text" autoFocus
                        placeholder="Scan barcode to add to cart..."
                        className="w-full pl-12 pr-4 py-4 bg-paper border border-thread text-lg font-mono text-ink focus:bg-canvas focus:border-brass transition-colors outline-none placeholder-muted tracking-wider"
                        value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)}
                      />
                    </form>
                  </div>

                  {cart.length === 0 ? (
                    <div className="px-7 pb-12 pt-2 text-center">
                      <IconBag className="w-9 h-9 mx-auto text-thread-dark mb-3" />
                      <p className="text-sm text-muted">Cart is empty — scan an item to begin a sale.</p>
                    </div>
                  ) : (
                    <div className="px-7 pb-7">
                      <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">Current Sale</p>

                      <div className="border border-thread divide-y divide-dashed divide-thread-dark mb-6">
                        {cart.map((item) => (
                          <div key={item.id} className="flex justify-between items-center gap-4 p-4 bg-paper-dim/40">
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-ink text-sm truncate">{item.name}</p>
                              <p className="text-xs text-muted mt-0.5 font-mono">৳{item.price} · {item.quantity} in stock</p>
                            </div>

                            <div className="flex items-center bg-canvas border border-thread">
                              <button type="button" onClick={() => updateCartItemQuantity(item.id, false)} className="w-7 h-8 text-ink font-bold hover:bg-paper-dim transition-colors">-</button>
                              <span className="px-3 font-mono font-bold text-sm text-ink">{item.cartQty}</span>
                              <button type="button" onClick={() => updateCartItemQuantity(item.id, true)} className="w-7 h-8 text-ink font-bold hover:bg-paper-dim transition-colors">+</button>
                            </div>

                            <p className="font-mono font-bold text-ink text-sm min-w-[64px] text-right">৳{item.price * item.cartQty}</p>

                            <button onClick={() => removeFromCart(item.id)} className="text-oxblood text-xs font-bold hover:underline shrink-0">
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-baseline mb-6">
                        <p className="text-sm font-bold text-muted uppercase tracking-wider">Total Due</p>
                        <p className="font-mono text-3xl font-bold text-ink">৳{cartTotal}</p>
                      </div>

                      <p className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3">Payment Method</p>
                      <div className="grid grid-cols-3 gap-2 mb-6">
                        {PAYMENT_METHODS.map((method) => (
                          <button
                            key={method}
                            className={`py-2.5 text-[11px] font-bold uppercase tracking-wider border transition-colors ${
                              paymentMethod === method
                                ? 'bg-ink text-paper border-ink'
                                : 'bg-canvas text-ink border-thread hover:border-thread-dark'
                            }`}
                            onClick={() => setPaymentMethod(method as any)}
                          >
                            {method}
                          </button>
                        ))}
                      </div>

                      {(paymentMethod !== 'cash' && paymentMethod !== 'bank/card') && (
                        <div className="mb-6">
                          <input type="text" placeholder="Mobile banking TrxID" className="w-full px-4 py-3 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono text-sm transition-colors" value={trxId} onChange={(e) => setTrxId(e.target.value)} />
                        </div>
                      )}

                      <button onClick={handleCheckout} className="w-full bg-moss text-white py-4 font-bold text-sm uppercase tracking-wider hover:bg-moss/90 transition-colors flex items-center justify-center gap-2">
                        <IconReceipt className="w-5 h-5" />
                        Complete Sale & Print
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: INVENTORY */}
            {activeTab === 'inventory' && (
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
                  <div className="lg:col-span-5">
                    <div className="bg-canvas p-7 border border-thread">
                      <h3 className="text-base font-bold mb-6 text-ink flex items-center gap-2">
                        <IconPlus className="w-4 h-4 text-brass" />
                        Register New Stock
                      </h3>

                      {invMessage.text && <div className={`px-4 py-3 mb-5 text-sm font-semibold border ${invMessage.type === 'error' ? 'bg-oxblood-light text-oxblood border-oxblood/20' : 'bg-moss-light text-moss border-moss/20'}`}>{invMessage.text}</div>}

                      <form onSubmit={handleAddInventory} className="space-y-5">
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Barcode Tag</label>
                          <input required type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono transition-colors" placeholder="Scan or type..." value={invBarcode} onChange={(e) => setInvBarcode(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Item Title</label>
                          <input required type="text" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors" placeholder="e.g., Premium Cotton Panjabi" value={invName} onChange={(e) => setInvName(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Category</label>
                          <div className="relative">
                            <select required className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink appearance-none transition-colors cursor-pointer" value={invCategory} onChange={(e) => setInvCategory(e.target.value)}>
                              <option value="" disabled>Select a category...</option>
                              <option value="Panjabi">Panjabi</option>
                              <option value="Shirt">Shirt</option>
                              <option value="T-Shirt">T-Shirt</option>
                              <option value="Pant">Pant</option>
                              <option value="0-5">0-5 Years</option>
                              <option value="small baby dress">Small Baby Dress</option>
                              <option value="medium dress">Medium Dress</option>
                              <option value="maximum dress">Maximum Dress</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-muted">
                              <svg className="fill-current h-3.5 w-3.5" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Unit Price (৳)</label>
                            <input required type="number" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono font-bold transition-colors" placeholder="1500" value={invPrice} onChange={(e) => setInvPrice(e.target.value)} />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Bundle Qty</label>
                            <input required type="number" min="1" className="w-full px-4 py-2.5 bg-brass-light/40 border border-brass/40 focus:bg-canvas focus:border-brass outline-none text-ink font-mono font-bold transition-colors" placeholder="Pieces" value={invQuantity} onChange={(e) => setInvQuantity(e.target.value)} />
                          </div>
                        </div>
                        <button type="submit" className="w-full mt-2 bg-ink text-paper py-3.5 font-bold text-sm uppercase tracking-wider hover:bg-brass-dark transition-colors">
                          Save to Database
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="lg:col-span-7">
                    <div className="bg-canvas border border-thread h-full flex flex-col">
                      <div className="flex items-center justify-between px-7 pt-7 mb-5">
                        <h3 className="text-base font-bold text-ink flex items-center gap-2">
                          <IconCrate className="w-4 h-4 text-brass" />
                          Active Stock Database
                        </h3>
                        <span className="text-muted text-xs font-mono font-bold">{recentInventory.length} ITEMS</span>
                      </div>

                      <div className="relative px-7 mb-5">
                        <div className="absolute inset-y-0 left-7 pl-3 flex items-center pointer-events-none text-muted">
                          <IconSearch className="h-4 w-4" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search by title or barcode..."
                          className="w-full pl-10 pr-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink transition-colors text-sm"
                          value={stockSearchQuery}
                          onChange={(e) => setStockSearchQuery(e.target.value)}
                        />
                      </div>

                      <div className="stitch mx-7 mb-1" />

                      <div className="flex-1 overflow-y-auto px-7 py-2 divide-y divide-thread max-h-[560px]">
                        {filteredInventory.length === 0 ? (
                          <div className="text-center py-12 text-muted">
                            <IconArchive className="mx-auto h-9 w-9 mb-3 text-thread-dark" />
                            <p className="text-sm font-medium">No items found matching your search.</p>
                          </div>
                        ) : (
                          filteredInventory.map(item => (
                            <div key={item.id} className="py-4 flex justify-between items-center gap-4">
                              <div className="min-w-0">
                                <p className="font-bold text-ink text-sm truncate">{item.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-muted font-mono">{item.barcode}</span>
                                  <span className="text-xs text-thread-dark">·</span>
                                  <span className="text-xs text-muted">{item.category}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                                <p className="font-mono font-bold text-ink text-sm">৳{item.price}</p>
                                <span className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wide ${item.quantity > 0 ? 'bg-moss-light text-moss' : 'bg-oxblood-light text-oxblood'}`}>
                                  {item.quantity} in stock
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="pb-7" />
                    </div>
                  </div>
               </div>
            )}

            {/* TAB 3: REFUND */}
            {activeTab === 'refund' && (
              <div className="max-w-3xl print:hidden">
                <div className="bg-canvas p-8 border border-oxblood/25">
                  <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-oxblood-light flex items-center justify-center mx-auto mb-4">
                      <IconUndo className="w-6 h-6 text-oxblood" />
                    </div>
                    <h3 className="text-xl font-display text-ink">Refund & Returns Center</h3>
                    <p className="text-muted mt-2 text-sm">Scan an item to pull up its completed sales history.</p>
                  </div>

                  {refundMessage.text && <div className={`px-4 py-3 mb-6 text-sm font-semibold border text-center ${refundMessage.type === 'error' ? 'bg-oxblood-light text-oxblood border-oxblood/20' : 'bg-moss-light text-moss border-moss/20'}`}>{refundMessage.text}</div>}

                  <form onSubmit={handleRefundSearch} className="mb-9 max-w-xl mx-auto flex gap-2">
                    <input type="text" autoFocus placeholder="Scan barcode..." className="flex-1 px-5 py-3.5 bg-paper border border-thread focus:bg-canvas focus:border-oxblood outline-none text-ink font-mono transition-colors text-lg" value={refundBarcode} onChange={(e) => setRefundBarcode(e.target.value)} />
                    <button type="submit" className="bg-oxblood text-white px-7 font-bold text-sm uppercase tracking-wider hover:bg-oxblood/90 transition-colors">Search</button>
                  </form>

                  <div className="divide-y divide-dashed divide-thread-dark max-w-2xl mx-auto">
                    {refundItemSales.map((sale) => (
                      <div key={sale.id} className="py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div>
                          <h4 className="font-bold text-ink text-base">{sale.dresses.name}</h4>
                          <div className="flex flex-col gap-1 mt-2">
                            <p className="text-xs text-muted flex items-center gap-1.5">
                              <IconClock className="w-3.5 h-3.5" />
                              Sold: {new Date(sale.sold_at).toLocaleString('en-BD')}
                            </p>
                            <p className="text-xs text-muted flex items-center gap-1.5 font-mono">
                              <IconCard className="w-3.5 h-3.5" />
                              <span className="uppercase font-bold text-ink">
                                 {sale.transaction_id === 'BANK/CARD-SALE' ? 'BANK/CARD' : sale.payment_method}
                              </span>
                              {(sale.transaction_id !== 'CASH-SALE' && sale.transaction_id !== 'DIRECT-SALE' && sale.transaction_id !== 'BANK/CARD-SALE') && ` | Trx: ${sale.transaction_id}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3">
                          <p className="font-mono text-lg font-bold text-ink">৳{sale.amount_paid}</p>
                          <button onClick={() => processRefund(sale)} className="bg-oxblood-light text-oxblood px-4 py-2 text-xs font-bold uppercase tracking-wide hover:bg-oxblood hover:text-white transition-colors border border-oxblood/20 flex items-center gap-2">
                            <IconUndo className="w-3.5 h-3.5" />
                            Approve Refund
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: REPORTS */}
            {activeTab === 'reports' && (
              <div className="space-y-6 print:hidden">
                <div className="bg-canvas p-5 border border-thread flex flex-wrap items-end gap-5">
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Filter Start Date</label>
                    <input type="date" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono text-sm transition-colors" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">Filter End Date</label>
                    <input type="date" className="w-full px-4 py-2.5 bg-paper border border-thread focus:bg-canvas focus:border-brass outline-none text-ink font-mono text-sm transition-colors" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                  <button onClick={clearDateFilters} className="px-5 py-2.5 border border-thread text-ink hover:border-thread-dark font-bold text-xs uppercase tracking-wider transition-colors bg-canvas whitespace-nowrap">
                    Clear Filters
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-ink p-8 text-paper relative overflow-hidden">
                    <div className="barcode-stripe absolute top-0 right-0 h-full w-24 opacity-[0.06]" style={{ filter: 'invert(1)' }} />
                    <p className="text-xs font-bold uppercase tracking-wider text-thread mb-2">Net Revenue {startDate ? '(Filtered Period)' : '(All Time)'}</p>
                    <p className="font-mono text-4xl sm:text-5xl font-bold tracking-tight">৳{totalRevenue.toLocaleString()}</p>
                  </div>
                  <div className="bg-canvas p-8 border border-thread flex flex-col justify-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Total Successful Sales</p>
                    <div className="flex items-baseline gap-2">
                      <p className="font-mono text-4xl sm:text-5xl font-bold text-ink">{salesRecord.filter(s => s.status === 'completed').length}</p>
                      <p className="text-base font-bold text-muted">Items</p>
                    </div>
                  </div>
                </div>

                <div className="bg-canvas p-7 border border-thread">
                  <h3 className="text-base font-bold mb-6 text-ink flex items-center gap-2">
                    <IconChart className="w-4 h-4 text-brass" />
                    Revenue by Payment Method
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                    {Object.entries(revenueByMethod).map(([method, amount]) => (
                      <div key={method} className="bg-paper-dim p-4 border border-thread text-center">
                        <p className="uppercase text-[10px] font-bold text-muted tracking-wider mb-1.5 whitespace-nowrap">{method}</p>
                        <p className="font-mono text-sm font-bold text-ink">৳{amount.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-canvas border border-thread overflow-hidden">
                  <div className="p-6 border-b border-thread">
                    <h3 className="text-base font-bold text-ink">Master Transaction Ledger</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-muted text-[11px] uppercase tracking-wider border-b border-thread">
                          <th className="p-4 font-bold">Date & Time</th>
                          <th className="p-4 font-bold">Item Details</th>
                          <th className="p-4 font-bold">Method</th>
                          <th className="p-4 font-bold">Status</th>
                          <th className="p-4 font-bold text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-thread">
                        {salesRecord.length === 0 && (
                          <tr><td colSpan={5} className="p-8 text-center text-muted font-medium">No transactions found for this period.</td></tr>
                        )}
                        {salesRecord.map((sale) => (
                          <tr key={sale.id} className={sale.status === 'refunded' ? 'opacity-50' : ''}>
                            <td className="p-4 text-sm text-muted whitespace-nowrap font-mono">{new Date(sale.sold_at).toLocaleString('en-BD')}</td>
                            <td className="p-4">
                              <p className={`text-sm font-bold ${sale.status === 'refunded' ? 'line-through text-muted' : 'text-ink'}`}>{sale.dresses?.name}</p>
                              <span className="text-xs font-mono text-muted">{sale.dresses?.barcode}</span>
                            </td>
                            <td className="p-4">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-ink bg-paper-dim px-2 py-1">
                                {sale.transaction_id === 'BANK/CARD-SALE' ? 'BANK/CARD' : sale.payment_method}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`text-[10px] px-2 py-1 font-bold uppercase tracking-wider ${sale.status === 'refunded' ? 'bg-paper-dim text-muted' : 'bg-moss-light text-moss'}`}>
                                {sale.status}
                              </span>
                            </td>
                            <td className={`p-4 text-right text-sm font-mono font-bold whitespace-nowrap ${sale.status === 'refunded' ? 'line-through text-muted' : 'text-ink'}`}>
                              ৳{sale.amount_paid}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* RECEIPT PRINT LAYOUT */}
      {cart.length > 0 && activeTab === 'pos' && (
        <div className="hidden print:block w-[80mm] text-black font-mono text-sm p-2 mx-auto">
          <div className="text-center font-bold text-xl mb-1 tracking-widest">CRAVE ABS</div>
          <div className="text-center text-xs mb-4 uppercase">Mymensingh, Bangladesh</div>
          <div className="border-b border-dashed border-black my-2"></div>
          <div className="flex justify-between text-xs">
            <span>Date: {new Date().toLocaleDateString()}</span>
            <span>Time: {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="border-b border-dashed border-black my-2"></div>

          <div className="my-2">
            {cart.map((item, index) => (
              <div key={index} className="mb-2">
                <div className="font-bold text-base leading-tight">{item.name}</div>
                <div className="text-xs text-gray-600 mt-1">CAT: {item.category}</div>
                <div className="flex justify-between font-bold mt-1">
                  <span>{item.cartQty}x Item</span>
                  <span>Tk {item.price * item.cartQty}</span>
                </div>
              </div>
            ))
            }
          </div>

          <div className="border-b border-dashed border-black my-2"></div>
          <div className="flex justify-between font-black text-lg uppercase">
            <span>Total:</span>

            <span>Tk {cartTotal}</span>
          </div>
          <div className="text-xs mt-2 uppercase">Paid via: <span className="font-bold">{paymentMethod}</span></div>
          {(paymentMethod !== 'cash' && paymentMethod !== 'bank/card') && <div className="text-xs font-mono mt-1">TrxID: {trxId}</div>}
          <div className="border-b border-dashed border-black my-2 mt-4"></div>
          <div className="text-center text-xs font-bold mt-2">THANK YOU FOR SHOPPING!</div>
          <div className="text-center text-[10px] mt-1">No refunds without receipt.</div>
        </div>
      )}

    </div>
  );
}
