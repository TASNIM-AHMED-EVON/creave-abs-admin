'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

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

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-slate-100 w-[400px] transition-all transform hover:shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">CRAVE ABS</h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">Secure Admin Portal</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input 
                type="password" 
                placeholder="Enter Admin Password" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all outline-none text-slate-900 text-center font-medium placeholder-slate-400" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 shadow-md">
              Access System
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 print:bg-white">
      
      <style jsx global>{`
        @media print {
          @page { margin: 0; }
          body { margin: 1.6cm 1cm; }
        }
      `}</style>

      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter mr-6">CRAVE ABS</h1>
              {(['pos', 'inventory', 'refund', 'reports'] as const).map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)} 
                  className={`relative px-1 py-5 text-sm font-bold uppercase tracking-wider transition-colors duration-200 ${
                    activeTab === tab 
                      ? tab === 'refund' ? 'text-red-600' : 'text-slate-900'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab === 'pos' ? 'Terminal (POS)' : tab === 'inventory' ? 'Stock & Bundles' : tab === 'refund' ? 'Refunds' : 'Reports'}
                  {activeTab === tab && (
                    <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-t-full ${tab === 'refund' ? 'bg-red-600' : 'bg-slate-900'}`} />
                  )}
                </button>
              ))}
            </div>
            
            {/* Quick Session Logout */}
            <button 
              onClick={handleLogout}
              className="text-xs font-bold uppercase tracking-wider text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200/60 transition-all cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto mt-8 px-6 pb-12 print:p-0 print:mt-0">
        
        {/* TAB 1: POS TERMINAL */}
        {activeTab === 'pos' && (
          <div className="max-w-3xl mx-auto print:hidden">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 transition-all">
              <h2 className="text-2xl font-bold mb-6 text-slate-800">Checkout Counter</h2>
              
              {posMessage.text && (
                <div className={`p-4 mb-6 rounded-xl text-sm font-semibold border ${posMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                  {posMessage.text}
                </div>
              )}

              <form onSubmit={handleBarcodeSubmit} className="mb-8 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                </div>
                <input 
                  type="text" autoFocus 
                  placeholder="Scan barcode to add to cart..." 
                  className="w-full pl-12 pr-4 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all outline-none placeholder-slate-400 tracking-wider shadow-inner" 
                  value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} 
                />
              </form>

              {cart.length > 0 && (
                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <h3 className="text-sm font-bold mb-4 text-slate-700 uppercase tracking-wider">Shopping Cart</h3>
                  
                  <div className="space-y-3 mb-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                          <p className="text-xs text-slate-500 mt-1">Base: ৳ {item.price} (Stock: {item.quantity} available)</p>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                            <button 
                              type="button"
                              onClick={() => updateCartItemQuantity(item.id, false)}
                              className="w-7 h-7 bg-white rounded-md text-slate-700 font-bold hover:bg-slate-50 transition-colors flex items-center justify-center border border-slate-200/60 shadow-sm"
                            >
                              -
                            </button>
                            <span className="px-3 font-mono font-bold text-sm text-slate-900">{item.cartQty}</span>
                            <button 
                              type="button"
                              onClick={() => updateCartItemQuantity(item.id, true)}
                              className="w-7 h-7 bg-white rounded-md text-slate-700 font-bold hover:bg-slate-50 transition-colors flex items-center justify-center border border-slate-200/60 shadow-sm"
                            >
                              +
                            </button>
                          </div>
                          
                          <div className="text-right min-w-[80px]">
                            <p className="font-black text-slate-900">৳ {item.price * item.cartQty}</p>
                          </div>

                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 text-xs font-bold hover:underline ml-2"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-slate-200 pt-6 mb-6">
                    <p className="text-lg font-bold text-slate-700">Total Price</p>
                    <p className="text-3xl font-black text-slate-900">৳ {cartTotal}</p>
                  </div>

                  <div className="pt-2">
                    <h3 className="text-sm font-bold mb-3 text-slate-700 uppercase tracking-wider">Select Payment Method</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                      {['cash', 'bkash', 'nagad', 'upay', 'rocket', 'bank/card'].map((method) => (
                        <button 
                          key={method} 
                          className={`py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border text-center ${
                            paymentMethod === method 
                              ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105' 
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                          }`} 
                          onClick={() => setPaymentMethod(method as any)}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                    
                    {(paymentMethod !== 'cash' && paymentMethod !== 'bank/card') && (
                      <div className="mb-6 animate-in slide-in-from-top-2 duration-200">
                        <input type="text" placeholder="Enter Mobile Banking TrxID" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none text-slate-900 font-mono text-sm" value={trxId} onChange={(e) => setTrxId(e.target.value)} />
                      </div>
                    )}
                    
                    <button onClick={handleCheckout} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      Complete Sale & Print
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: INVENTORY */}
        {activeTab === 'inventory' && (
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:hidden">
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                  <h2 className="text-xl font-bold mb-6 text-slate-900 flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    Register New Stock
                  </h2>
                  
                  {invMessage.text && <div className={`p-4 mb-6 rounded-xl text-sm font-semibold border ${invMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>{invMessage.text}</div>}
                  
                  <form onSubmit={handleAddInventory} className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Barcode Tag</label>
                      <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none text-slate-900 font-mono transition-all" placeholder="Scan or type..." value={invBarcode} onChange={(e) => setInvBarcode(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Item Title</label>
                      <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none text-slate-900 transition-all" placeholder="e.g., Premium Cotton Panjabi" value={invName} onChange={(e) => setInvName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                      <div className="relative">
                        <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none text-slate-900 appearance-none transition-all cursor-pointer" value={invCategory} onChange={(e) => setInvCategory(e.target.value)}>
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
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Unit Price (৳)</label>
                        <input required type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none text-slate-900 font-bold transition-all" placeholder="1500" value={invPrice} onChange={(e) => setInvPrice(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Bundle Qty</label>
                        <input required type="number" min="1" className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600 outline-none text-blue-700 font-bold transition-all" placeholder="Pieces" value={invQuantity} onChange={(e) => setInvQuantity(e.target.value)} />
                      </div>
                    </div>
                    <button type="submit" className="w-full mt-4 bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 shadow-md hover:shadow-lg transition-all duration-200">
                      Save to Database
                    </button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                      Active Stock Database
                    </h2>
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{recentInventory.length} Items</span>
                  </div>
                  
                  <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Search by title or barcode..." 
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none text-slate-900 transition-all text-sm"
                      value={stockSearchQuery}
                      onChange={(e) => setStockSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[600px] custom-scrollbar">
                    {filteredInventory.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <svg className="mx-auto h-12 w-12 mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                        <p className="text-sm font-medium">No items found matching your search.</p>
                      </div>
                    ) : (
                      filteredInventory.map(item => (
                        <div key={item.id} className="p-4 border border-slate-100 rounded-2xl flex justify-between items-center bg-white hover:border-slate-300 hover:shadow-sm transition-all duration-200 group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition-colors">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{item.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">{item.barcode}</span>
                                <span className="text-xs text-slate-400">• {item.category}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-2">
                            <p className="font-black text-slate-900">৳ {item.price}</p>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold shadow-sm ${item.quantity > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                              {item.quantity} In Stock
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
           </div>
        )}

        {/* TAB 3: REFUND */}
        {activeTab === 'refund' && (
          <div className="max-w-4xl mx-auto print:hidden">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-red-100">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                  <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" /></svg>
                </div>
                <h2 className="text-2xl font-black text-slate-900">Refund & Returns Center</h2>
                <p className="text-slate-500 mt-2 text-sm">Scan an item to pull up its completed sales history.</p>
              </div>

              {refundMessage.text && <div className={`p-4 mb-6 rounded-xl text-sm font-semibold border text-center ${refundMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>{refundMessage.text}</div>}
              
              <form onSubmit={handleRefundSearch} className="mb-10 max-w-2xl mx-auto flex gap-3">
                <input type="text" autoFocus placeholder="Scan barcode..." className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 outline-none text-slate-900 font-mono transition-all text-lg" value={refundBarcode} onChange={(e) => setRefundBarcode(e.target.value)} />
                <button type="submit" className="bg-red-600 text-white px-8 rounded-xl font-bold hover:bg-red-700 transition-all shadow-sm">Search</button>
              </form>

              <div className="space-y-4 max-w-3xl mx-auto">
                {refundItemSales.map((sale) => (
                  <div key={sale.id} className="p-5 border border-slate-200 rounded-2xl bg-white flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:border-red-200 transition-colors">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{sale.dresses.name}</h4>
                      <div className="flex flex-col gap-1 mt-2">
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Sold: {new Date(sale.sold_at).toLocaleString('en-BD')}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                          <span className="uppercase font-bold text-slate-700">
                             {sale.transaction_id === 'BANK/CARD-SALE' ? 'BANK/CARD' : sale.payment_method}
                          </span> 
                          {(sale.transaction_id !== 'CASH-SALE' && sale.transaction_id !== 'DIRECT-SALE' && sale.transaction_id !== 'BANK/CARD-SALE') && ` | Trx: ${sale.transaction_id}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
                      <p className="text-xl font-black text-slate-900">৳ {sale.amount_paid}</p>
                      <button onClick={() => processRefund(sale)} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-600 hover:text-white transition-colors border border-red-100 hover:border-red-600 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
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
          <div className="space-y-8 print:hidden">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-wrap items-end gap-6">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Filter Start Date</label>
                <input type="date" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none text-slate-700 font-medium transition-all" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Filter End Date</label>
                <input type="date" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none text-slate-700 font-medium transition-all" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <button onClick={clearDateFilters} className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-bold text-sm transition-colors bg-white shadow-sm whitespace-nowrap">
                Clear Filters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-md text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
                <p className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-2">Net Revenue {startDate ? '(Filtered Period)' : '(All Time)'}</p>
                <p className="text-5xl font-black tracking-tight">৳ {totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
                <p className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">Total Successful Sales</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-black text-slate-900">{salesRecord.filter(s => s.status === 'completed').length}</p>
                  <p className="text-lg font-bold text-slate-400">Items</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold mb-6 text-slate-900 flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                Revenue by Payment Method
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
                {Object.entries(revenueByMethod).map(([method, amount]) => (
                  <div key={method} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center hover:border-slate-300 transition-colors">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                      <span className="text-xs font-black text-slate-600 uppercase">{method.charAt(0)}</span>
                    </div>
                    <p className="uppercase text-[10px] font-bold text-slate-400 tracking-wider mb-1 whitespace-nowrap">{method}</p>
                    <p className="text-base font-bold text-slate-900">৳ {amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-900">Master Transaction Ledger</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white text-slate-400 text-xs uppercase tracking-wider border-b border-slate-100">
                      <th className="p-5 font-bold">Date & Time</th>
                      <th className="p-5 font-bold">Item Details</th>
                      <th className="p-5 font-bold">Method</th>
                      <th className="p-5 font-bold">Status</th>
                      <th className="p-5 font-bold text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salesRecord.length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">No transactions found for this period.</td></tr>
                    )}
                    {salesRecord.map((sale) => (
                      <tr key={sale.id} className={`transition-colors ${sale.status === 'refunded' ? 'bg-slate-50 opacity-60' : 'hover:bg-slate-50'}`}>
                        <td className="p-5 text-sm text-slate-600 whitespace-nowrap">{new Date(sale.sold_at).toLocaleString('en-BD')}</td>
                        <td className="p-5">
                          <p className={`text-sm font-bold ${sale.status === 'refunded' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{sale.dresses?.name}</p>
                          <span className="text-xs font-mono text-slate-400">{sale.dresses?.barcode}</span>
                        </td>
                        <td className="p-5">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-1 rounded">
                            {sale.transaction_id === 'BANK/CARD-SALE' ? 'BANK/CARD' : sale.payment_method}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${sale.status === 'refunded' ? 'bg-slate-200 text-slate-500' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                            {sale.status}
                          </span>
                        </td>
                        <td className={`p-5 text-right text-sm font-bold whitespace-nowrap ${sale.status === 'refunded' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          ৳ {sale.amount_paid}
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
            ))}
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