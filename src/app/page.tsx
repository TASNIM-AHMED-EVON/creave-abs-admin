'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'refund' | 'reports'>('pos');

  // POS State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [currentDress, setCurrentDress] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'upay' | 'rocket' | 'cash'>('cash');
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

  // Auth Handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "CRAVE_ABS_2026") {
      setIsAuthenticated(true);
      fetchRecentInventory();
      fetchSalesData();
    } else {
      alert("Incorrect Admin Password");
    }
  };

  // --- POS FUNCTIONS ---
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosMessage({ type: '', text: '' });
    if (!barcodeInput) return;

    const { data, error } = await supabase.from('dresses').select('*').eq('barcode', barcodeInput).single();

    if (error || !data) {
      setPosMessage({ type: 'error', text: 'Item not found. Please verify the barcode.' });
      setCurrentDress(null);
    } else {
      setCurrentDress(data);
    }
    setBarcodeInput('');
  };

  const handleCheckout = async () => {
    if (!currentDress) return;
    if (currentDress.quantity <= 0) {
      setPosMessage({ type: 'error', text: 'Transaction failed: Item is out of stock.' });
      return;
    }

    const { error: saleError } = await supabase.from('sales').insert([{
      dress_id: currentDress.id,
      payment_method: paymentMethod,
      transaction_id: paymentMethod === 'cash' ? 'CASH-SALE' : trxId,
      amount_paid: currentDress.price,
      status: 'completed'
    }]);

    if (saleError) {
      setPosMessage({ type: 'error', text: 'System error: Checkout failed.' });
      return;
    }

    const newQuantity = currentDress.quantity - 1;
    await supabase.from('dresses').update({ 
      quantity: newQuantity,
      status: newQuantity === 0 ? 'sold' : 'available' 
    }).eq('id', currentDress.id);

    setPosMessage({ type: 'success', text: 'Transaction approved. Initializing printer...' });

    setTimeout(() => {
      window.print();
      setCurrentDress(null);
      setTrxId('');
      fetchRecentInventory();
      fetchSalesData();
    }, 500);
  };

  // --- INVENTORY FUNCTIONS ---
  const fetchRecentInventory = async () => {
    const { data } = await supabase.from('dresses').select('*').order('created_at', { ascending: false }).limit(1000); 
    if (data) setRecentInventory(data);
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvMessage({ type: '', text: '' });
    const qty = parseInt(invQuantity);

    const { error } = await supabase.from('dresses').insert([{
      barcode: invBarcode,
      name: invName,
      category: invCategory,
      price: parseFloat(invPrice),
      quantity: qty,
      status: qty > 0 ? 'available' : 'sold'
    }]);

    if (error) {
      setInvMessage({ type: 'error', text: 'Entry failed. Barcode may already exist in the database.' });
    } else {
      setInvMessage({ type: 'success', text: `Successfully registered ${qty} unit(s).` });
      setInvBarcode(''); setInvName(''); setInvCategory(''); setInvPrice(''); setInvQuantity('1');
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
      setRefundMessage({ type: 'error', text: 'No active transaction history located for this identifier.' });
      setRefundItemSales([]);
    } else {
      setRefundItemSales(data);
    }
  };

  const processRefund = async (sale: any) => {
    if (!window.confirm(`Authorize refund for transaction ${sale.id}?`)) return;

    const { error: updateSaleError } = await supabase.from('sales').update({ status: 'refunded' }).eq('id', sale.id);
    if (updateSaleError) {
      setRefundMessage({ type: 'error', text: 'Authorization failed.' });
      return;
    }

    const restoredQuantity = sale.dresses.quantity + 1;
    await supabase.from('dresses').update({ quantity: restoredQuantity, status: 'available' }).eq('id', sale.dresses.id);

    setRefundMessage({ type: 'success', text: 'Refund authorized and inventory updated.' });
    setRefundBarcode('');
    setRefundItemSales([]);
    fetchRecentInventory();
    fetchSalesData();
  };

  // --- REPORTS FUNCTIONS ---
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
      const methods: Record<string, number> = { cash: 0, bkash: 0, nagad: 0, upay: 0, rocket: 0 };

      data.forEach(sale => {
        if (sale.status === 'completed') {
          const amount = Number(sale.amount_paid);
          total += amount;
          if (methods[sale.payment_method] !== undefined) methods[sale.payment_method] += amount;
        }
      });
      setTotalRevenue(total);
      setRevenueByMethod(methods);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (activeTab === 'reports') fetchSalesData();
  }, [activeTab, fetchSalesData]);

  const clearDateFilters = () => { setStartDate(''); setEndDate(''); };

  const filteredInventory = recentInventory.filter(item => 
    item.name.toLowerCase().includes(stockSearchQuery.toLowerCase()) || 
    item.barcode.toLowerCase().includes(stockSearchQuery.toLowerCase())
  );

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50">
        <div className="bg-white p-10 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-200 w-[400px]">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-zinc-900 tracking-tight">CRAVE ABS</h2>
            <p className="text-zinc-500 mt-1 text-sm">System Authentication</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Admin Credentials</label>
              <input 
                type="password" 
                className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors outline-none text-zinc-900 text-sm" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            <button type="submit" className="w-full bg-zinc-900 text-white font-medium py-2.5 px-4 rounded-lg hover:bg-zinc-800 transition-colors text-sm shadow-sm">
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- MAIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-zinc-50/50 font-sans text-zinc-900 print:bg-white">
      
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-zinc-200 print:hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-8">
              <h1 className="text-lg font-bold text-zinc-900 tracking-tight mr-4">CRAVE ABS</h1>
              <div className="flex space-x-1">
                {(['pos', 'inventory', 'refund', 'reports'] as const).map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)} 
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab 
                        ? 'bg-zinc-100 text-zinc-900'
                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    {tab === 'pos' ? 'Terminal' : tab === 'inventory' ? 'Inventory' : tab === 'refund' ? 'Returns' : 'Analytics'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-subtle-pulse"></span>
               <span className="text-xs font-medium text-zinc-500">System Online</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto mt-8 px-6 pb-12 print:p-0 print:mt-0">
        
        {/* TAB 1: POS TERMINAL */}
        {activeTab === 'pos' && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 print:hidden">
            
            <div className="md:col-span-7">
              <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm animate-fade-in">
                <h2 className="text-base font-semibold mb-4 text-zinc-900">Scan Item</h2>
                
                {posMessage.text && (
                  <div className={`p-3 mb-4 rounded-lg text-sm border ${posMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                    {posMessage.text}
                  </div>
                )}

                <form onSubmit={handleBarcodeSubmit} className="mb-4">
                  <input 
                    type="text" autoFocus 
                    placeholder="Barcode input..." 
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 rounded-lg text-lg font-mono text-zinc-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors outline-none placeholder-zinc-400" 
                    value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} 
                  />
                </form>

                {currentDress && (
                  <div className="mt-6 border-t border-zinc-100 pt-6 animate-fade-in">
                    <h3 className="text-sm font-medium mb-3 text-zinc-500">Transaction Details</h3>
                    <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 mb-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-zinc-900">{currentDress.name}</p>
                          <p className="text-xs text-zinc-500 font-mono mt-1">ID: {currentDress.barcode}</p>
                        </div>
                        <p className="font-semibold text-zinc-900 text-lg">৳ {currentDress.price}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-200">
                        <span className={`w-2 h-2 rounded-full ${currentDress.quantity > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        <p className="text-xs font-medium text-zinc-600">{currentDress.quantity} units available in local inventory</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-5">
               <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm h-full animate-fade-in">
                  <h2 className="text-base font-semibold mb-4 text-zinc-900">Payment Routing</h2>
                  {currentDress ? (
                    currentDress.quantity > 0 ? (
                      <div className="space-y-5 animate-fade-in">
                        <div>
                          <label className="block text-xs font-medium text-zinc-500 mb-2">Method</label>
                          <div className="grid grid-cols-2 gap-2">
                            {['cash', 'bkash', 'nagad', 'upay', 'rocket'].map((method) => (
                              <button 
                                key={method} 
                                className={`py-2 px-3 rounded-md text-xs font-semibold uppercase tracking-wide transition-colors border ${
                                  paymentMethod === method 
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                                }`} 
                                onClick={() => setPaymentMethod(method as any)}
                              >
                                {method}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {paymentMethod !== 'cash' && (
                          <div className="animate-fade-in">
                            <label className="block text-xs font-medium text-zinc-500 mb-2">Transaction ID</label>
                            <input type="text" className="w-full px-3 py-2 bg-white border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 font-mono text-sm" value={trxId} onChange={(e) => setTrxId(e.target.value)} />
                          </div>
                        )}
                        
                        <div className="pt-4 mt-4 border-t border-zinc-100">
                           <div className="flex justify-between items-center mb-4">
                              <span className="text-sm text-zinc-500">Total Due</span>
                              <span className="text-2xl font-bold text-zinc-900">৳ {currentDress.price}</span>
                           </div>
                          <button onClick={handleCheckout} className="w-full bg-zinc-900 text-white py-3 rounded-lg font-medium text-sm hover:bg-zinc-800 transition-colors shadow-sm">
                            Process Payment
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-sm font-medium animate-fade-in">
                        Inventory depleted. Cannot route payment.
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 text-zinc-400">
                       <p className="text-sm">Scan an item to enable payment routing.</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}

        {/* TAB 2: INVENTORY */}
        {activeTab === 'inventory' && (
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
              
              {/* Left Column: Form */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm animate-fade-in">
                  <h2 className="text-base font-semibold mb-5 text-zinc-900">Inventory Registration</h2>
                  
                  {invMessage.text && <div className={`p-3 mb-5 rounded-lg text-sm border ${invMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{invMessage.text}</div>}
                  
                  <form onSubmit={handleAddInventory} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">SKU / Barcode</label>
                      <input required type="text" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-md focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 font-mono text-sm" value={invBarcode} onChange={(e) => setInvBarcode(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">Product Name</label>
                      <input required type="text" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-md focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 text-sm" value={invName} onChange={(e) => setInvName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-500 mb-1.5">Classification</label>
                      <select required className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-md focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 text-sm" value={invCategory} onChange={(e) => setInvCategory(e.target.value)}>
                        <option value="" disabled>Select category...</option>
                        <option value="Panjabi">Panjabi</option>
                        <option value="Shirt">Shirt</option>
                        <option value="T-Shirt">T-Shirt</option>
                        <option value="Pant">Pant</option>
                        <option value="0-5">0-5 Years</option>
                        <option value="small baby dress">Small Baby Dress</option>
                        <option value="medium dress">Medium Dress</option>
                        <option value="maximum dress">Maximum Dress</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Unit Price (৳)</label>
                        <input required type="number" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-md focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 text-sm" value={invPrice} onChange={(e) => setInvPrice(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-500 mb-1.5">Quantity</label>
                        <input required type="number" min="1" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-md focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 text-sm" value={invQuantity} onChange={(e) => setInvQuantity(e.target.value)} />
                      </div>
                    </div>
                    <button type="submit" className="w-full mt-2 bg-zinc-900 text-white py-2.5 rounded-md font-medium text-sm hover:bg-zinc-800 transition-colors shadow-sm">
                      Commit to Database
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: List */}
              <div className="lg:col-span-8 animate-fade-in">
                <div className="bg-white rounded-xl border border-zinc-200 shadow-sm h-full flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-zinc-900">Active Inventory Registry</h2>
                    <div className="relative w-64">
                      <input 
                        type="text" 
                        placeholder="Filter database..." 
                        className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 text-xs"
                        value={stockSearchQuery}
                        onChange={(e) => setStockSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto max-h-[600px]">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-zinc-50/90 backdrop-blur-sm border-b border-zinc-200 z-10">
                        <tr className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          <th className="px-4 py-3">Product Info</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3 text-right">Price</th>
                          <th className="px-4 py-3 text-right">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {filteredInventory.length === 0 ? (
                          <tr><td colSpan={4} className="p-8 text-center text-sm text-zinc-500">No matching records found.</td></tr>
                        ) : (
                          filteredInventory.map(item => (
                            <tr key={item.id} className="hover:bg-zinc-50 transition-colors animate-fade-in">
                              <td className="px-4 py-3">
                                <p className="font-medium text-sm text-zinc-900">{item.name}</p>
                                <p className="text-xs text-zinc-500 font-mono mt-0.5">{item.barcode}</p>
                              </td>
                              <td className="px-4 py-3 text-sm text-zinc-600">{item.category}</td>
                              <td className="px-4 py-3 text-sm font-medium text-zinc-900 text-right">৳{item.price}</td>
                              <td className="px-4 py-3 text-right">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.quantity > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                  {item.quantity}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
           </div>
        )}

        {/* TAB 3: REFUND */}
        {activeTab === 'refund' && (
          <div className="max-w-3xl mx-auto print:hidden">
            <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm animate-fade-in">
              <div className="mb-6">
                <h2 className="text-base font-semibold text-zinc-900">Process Return / Refund</h2>
                <p className="text-zinc-500 mt-1 text-sm">Query completed transactions via barcode identification.</p>
              </div>

              {refundMessage.text && <div className={`p-3 mb-5 rounded-lg text-sm border ${refundMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>{refundMessage.text}</div>}
              
              <form onSubmit={handleRefundSearch} className="mb-8 flex gap-3">
                <input type="text" autoFocus placeholder="Enter item barcode..." className="flex-1 px-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-md focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 font-mono text-sm" value={refundBarcode} onChange={(e) => setRefundBarcode(e.target.value)} />
                <button type="submit" className="bg-zinc-900 text-white px-6 rounded-md font-medium text-sm hover:bg-zinc-800 transition-colors shadow-sm">Query</button>
              </form>

              <div className="space-y-3">
                {refundItemSales.map((sale) => (
                  <div key={sale.id} className="p-4 border border-zinc-200 rounded-lg bg-zinc-50 flex justify-between items-center animate-fade-in">
                    <div>
                      <p className="font-semibold text-zinc-900 text-sm">{sale.dresses.name}</p>
                      <div className="flex gap-4 mt-1">
                        <p className="text-xs text-zinc-500">Date: {new Date(sale.sold_at).toLocaleDateString()}</p>
                        <p className="text-xs text-zinc-500 uppercase">Method: {sale.payment_method}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-medium text-zinc-900">৳{sale.amount_paid}</p>
                      <button onClick={() => processRefund(sale)} className="bg-white border border-zinc-300 text-zinc-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-zinc-100 hover:text-red-600 transition-colors">
                        Revert & Refund
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
            
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-wrap items-end gap-4 animate-fade-in">
              <div className="w-48">
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Date Origin</label>
                <input type="date" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-md text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="w-48">
                <label className="block text-xs font-medium text-zinc-500 mb-1.5">Date Terminus</label>
                <input type="date" className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-md text-sm text-zinc-900 focus:ring-2 focus:ring-indigo-500 outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <button onClick={clearDateFilters} className="px-4 py-2 border border-zinc-300 text-zinc-600 rounded-md hover:bg-zinc-50 font-medium text-sm transition-colors bg-white">
                Reset Params
              </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              <div className="col-span-2 bg-zinc-900 p-6 rounded-xl shadow-sm text-white">
                <p className="text-xs font-medium text-zinc-400 mb-1">Gross Net Revenue {startDate ? '(Filtered)' : '(Lifetime)'}</p>
                <p className="text-4xl font-semibold tracking-tight">৳ {totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                <p className="text-xs font-medium text-zinc-500 mb-1">Transaction Volume</p>
                <p className="text-4xl font-semibold text-zinc-900 tracking-tight">{salesRecord.filter(s => s.status === 'completed').length} <span className="text-lg font-normal text-zinc-400">units</span></p>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden animate-fade-in">
              <div className="p-4 border-b border-zinc-200 bg-zinc-50/50 flex justify-between items-center">
                <h2 className="text-sm font-semibold text-zinc-900">Master Transaction Ledger</h2>
              </div>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-white border-b border-zinc-200 z-10">
                    <tr className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                      <th className="px-5 py-3">Timestamp</th>
                      <th className="px-5 py-3">Item Designation</th>
                      <th className="px-5 py-3">Routing</th>
                      <th className="px-5 py-3">State</th>
                      <th className="px-5 py-3 text-right">Settlement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {salesRecord.length === 0 && (
                      <tr><td colSpan={5} className="p-8 text-center text-sm text-zinc-500">No records available for criteria.</td></tr>
                    )}
                    {salesRecord.map((sale) => (
                      <tr key={sale.id} className="hover:bg-zinc-50 transition-colors animate-fade-in">
                        <td className="px-5 py-3 text-sm text-zinc-600 whitespace-nowrap">{new Date(sale.sold_at).toLocaleString('en-GB')}</td>
                        <td className="px-5 py-3">
                          <p className={`text-sm font-medium ${sale.status === 'refunded' ? 'text-zinc-400' : 'text-zinc-900'}`}>{sale.dresses?.name}</p>
                          <span className="text-xs font-mono text-zinc-400">{sale.dresses?.barcode}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs font-medium text-zinc-600 uppercase">{sale.payment_method}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${sale.status === 'refunded' ? 'bg-zinc-100 text-zinc-500' : 'bg-emerald-50 text-emerald-700'}`}>
                            {sale.status}
                          </span>
                        </td>
                        <td className={`px-5 py-3 text-right text-sm font-medium whitespace-nowrap ${sale.status === 'refunded' ? 'text-zinc-400 line-through' : 'text-zinc-900'}`}>
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
      {currentDress && activeTab === 'pos' && (
        <div className="hidden print:block w-[80mm] text-black font-mono text-sm p-2 mx-auto receipt-block">
          <div className="text-center font-bold text-xl mb-1 tracking-widest">CRAVE ABS</div>
          <div className="text-center text-xs mb-4 uppercase">Khulna, Bangladesh</div>
          <div className="border-b border-dashed border-black my-2"></div>
          <div className="flex justify-between text-xs">
            <span>{new Date().toLocaleDateString()}</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
          <div className="border-b border-dashed border-black my-2"></div>
          <div className="my-2">
            <div className="font-bold text-base leading-tight">{currentDress.name}</div>
            <div className="text-xs text-gray-600 mt-1">SKU: {currentDress.barcode}</div>
            <div className="flex justify-between font-bold mt-2">
              <span>1x Item</span>
              <span>Tk {currentDress.price}</span>
            </div>
          </div>
          <div className="border-b border-dashed border-black my-2"></div>
          <div className="flex justify-between font-bold text-lg uppercase">
            <span>Total</span>
            <span>Tk {currentDress.price}</span>
          </div>
          <div className="text-xs mt-2 uppercase">Method: {paymentMethod}</div>
          {paymentMethod !== 'cash' && <div className="text-xs font-mono mt-1">TRX: {trxId}</div>}
          <div className="border-b border-dashed border-black my-2 mt-4"></div>
          <div className="text-center text-xs font-bold mt-2">THANK YOU</div>
          <div className="text-center text-[10px] mt-1">Retain receipt for returns.</div>
        </div>
      )}
    </div>
  );
}