'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'reports'>('pos');

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
  const [invMessage, setInvMessage] = useState({ type: '', text: '' });
  const [recentInventory, setRecentInventory] = useState<any[]>([]);

  // Reports State
  const [salesRecord, setSalesRecord] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueByMethod, setRevenueByMethod] = useState<Record<string, number>>({});

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

    const { data, error } = await supabase
      .from('dresses')
      .select('*')
      .eq('barcode', barcodeInput)
      .single();

    if (error || !data) {
      setPosMessage({ type: 'error', text: 'Dress not found! Check the barcode.' });
      setCurrentDress(null);
    } else {
      setCurrentDress(data);
    }
    setBarcodeInput('');
  };

  const handleCheckout = async () => {
    if (!currentDress) return;
    if (currentDress.status === 'sold') {
      setPosMessage({ type: 'error', text: 'This dress is already marked as SOLD!' });
      return;
    }

    const { error: saleError } = await supabase.from('sales').insert([
      {
        dress_id: currentDress.id,
        payment_method: paymentMethod,
        transaction_id: paymentMethod === 'cash' ? 'CASH-SALE' : trxId,
        amount_paid: currentDress.price,
      },
    ]);

    if (saleError) {
      setPosMessage({ type: 'error', text: 'Checkout failed.' });
      return;
    }

    await supabase.from('dresses').update({ status: 'sold' }).eq('id', currentDress.id);
    setPosMessage({ type: 'success', text: 'Sale recorded! Printing receipt...' });

    setTimeout(() => {
      window.print();
      setCurrentDress(null);
      setTrxId('');
      fetchRecentInventory();
      fetchSalesData(); // Refresh reports
    }, 500);
  };

  // --- INVENTORY FUNCTIONS ---
  const fetchRecentInventory = async () => {
    const { data } = await supabase
      .from('dresses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setRecentInventory(data);
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvMessage({ type: '', text: '' });

    const { error } = await supabase.from('dresses').insert([
      {
        barcode: invBarcode,
        name: invName,
        category: invCategory,
        price: parseFloat(invPrice),
        status: 'available'
      }
    ]);

    if (error) {
      setInvMessage({ type: 'error', text: 'Failed to add item. Barcode might already exist.' });
    } else {
      setInvMessage({ type: 'success', text: 'Dress added to inventory successfully!' });
      setInvBarcode(''); setInvName(''); setInvCategory(''); setInvPrice('');
      fetchRecentInventory();
    }
  };

  // --- REPORTS FUNCTIONS ---
  const fetchSalesData = async () => {
    // Fetch sales and join with dresses table to get item names
    const { data, error } = await supabase
      .from('sales')
      .select(`
        *,
        dresses ( name, barcode )
      `)
      .order('sold_at', { ascending: false });

    if (data) {
      setSalesRecord(data);
      
      let total = 0;
      const methods: Record<string, number> = {
        cash: 0, bkash: 0, nagad: 0, upay: 0, rocket: 0
      };

      data.forEach(sale => {
        const amount = Number(sale.amount_paid);
        total += amount;
        if (methods[sale.payment_method] !== undefined) {
          methods[sale.payment_method] += amount;
        }
      });

      setTotalRevenue(total);
      setRevenueByMethod(methods);
    }
  };

  // Reload reports when clicking the tab
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchSalesData();
    }
  }, [activeTab]);

  // --- RENDER LOGIN ---
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-96">
          <h2 className="text-2xl font-bold mb-4 text-center text-black">CRAVE ABS Login</h2>
          <input 
            type="password" 
            placeholder="Admin Password" 
            className="w-full p-2 border rounded mb-4 text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-black text-white p-2 rounded hover:bg-gray-800">
            Login
          </button>
        </form>
      </div>
    );
  }

  // --- RENDER DASHBOARD ---
  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Navigation Tabs (Hidden during print) */}
      <div className="bg-white shadow print:hidden">
        <div className="max-w-6xl mx-auto flex space-x-8 p-4">
          <h1 className="text-2xl font-extrabold text-black mr-6">CRAVE ABS</h1>
          <button 
            onClick={() => setActiveTab('pos')}
            className={`font-bold pb-2 ${activeTab === 'pos' ? 'border-b-4 border-black text-black' : 'text-gray-500'}`}
          >
            Terminal (POS)
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`font-bold pb-2 ${activeTab === 'inventory' ? 'border-b-4 border-black text-black' : 'text-gray-500'}`}
          >
            Add Inventory
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`font-bold pb-2 ${activeTab === 'reports' ? 'border-b-4 border-black text-black' : 'text-gray-500'}`}
          >
            Sales Reports
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 p-6 print:p-0 print:mt-0">
        
        {/* TAB 1: POS TERMINAL */}
        {activeTab === 'pos' && (
          <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow print:hidden">
            <h2 className="text-xl font-bold mb-4 border-b pb-2 text-black">Checkout Counter</h2>
            
            {posMessage.text && (
              <div className={`p-3 mb-4 rounded ${posMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {posMessage.text}
              </div>
            )}

            <form onSubmit={handleBarcodeSubmit} className="mb-6">
              <input
                type="text"
                autoFocus
                placeholder="Scan dress barcode here..."
                className="w-full p-4 border-2 border-black rounded text-lg font-mono text-black focus:outline-none"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
              />
            </form>

            {currentDress && (
              <div className="bg-gray-50 p-6 rounded border">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><p className="text-sm text-gray-500">Dress</p><p className="font-bold text-black">{currentDress.name}</p></div>
                  <div><p className="text-sm text-gray-500">Price</p><p className="font-bold text-black text-xl">৳ {currentDress.price}</p></div>
                </div>

                {currentDress.status === 'available' ? (
                  <>
                    <h3 className="text-sm font-bold mb-2 mt-4 text-black">Payment Method</h3>
                    <div className="flex gap-2 mb-4">
                      {['cash', 'bkash', 'nagad', 'upay', 'rocket'].map((method) => (
                        <button
                          key={method}
                          className={`px-4 py-2 rounded text-sm font-bold uppercase border ${paymentMethod === method ? 'bg-black text-white' : 'bg-white text-black'}`}
                          onClick={() => setPaymentMethod(method as any)}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                    {paymentMethod !== 'cash' && (
                      <input
                        type="text"
                        placeholder="MFS TrxID"
                        className="w-full p-2 border rounded mb-4 text-black"
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                      />
                    )}
                    <button onClick={handleCheckout} className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700">
                      Confirm & Print
                    </button>
                  </>
                ) : (
                  <p className="text-red-600 font-bold">This item has already been sold.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INVENTORY MANAGEMENT */}
        {activeTab === 'inventory' && (
           <div className="grid grid-cols-2 gap-6 print:hidden">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4 border-b pb-2 text-black">Register New Dress</h2>
                {invMessage.text && (
                  <div className={`p-3 mb-4 rounded ${invMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {invMessage.text}
                  </div>
                )}
                <form onSubmit={handleAddInventory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Barcode</label>
                    <input required type="text" className="w-full p-2 border rounded text-black" placeholder="Scan or type new barcode" value={invBarcode} onChange={(e) => setInvBarcode(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Dress Name / Title</label>
                    <input required type="text" className="w-full p-2 border rounded text-black" placeholder="e.g. Red Panjabi V2" value={invName} onChange={(e) => setInvName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Category</label>
                    <select required className="w-full p-2 border rounded text-black bg-white" value={invCategory} onChange={(e) => setInvCategory(e.target.value)}>
                      <option value="">Select...</option>
                      <option value="Panjabi">Panjabi</option>
                      <option value="Shirt">Shirt</option>
                      <option value="T-Shirt">T-Shirt</option>
                      <option value="Pant">Pant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Price (BDT)</label>
                    <input required type="number" className="w-full p-2 border rounded text-black" placeholder="1500" value={invPrice} onChange={(e) => setInvPrice(e.target.value)} />
                  </div>
                  <button type="submit" className="w-full bg-black text-white p-3 rounded font-bold hover:bg-gray-800">
                    Save to Database
                  </button>
                </form>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4 border-b pb-2 text-black">Recently Added Stock</h2>
                <div className="space-y-3">
                  {recentInventory.length === 0 ? <p className="text-gray-500 text-sm">No inventory added yet.</p> : null}
                  {recentInventory.map(item => (
                    <div key={item.id} className="p-3 border rounded flex justify-between items-center">
                      <div>
                        <p className="font-bold text-black">{item.name}</p>
                        <p className="text-xs text-gray-500 font-mono">Barcode: {item.barcode}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">৳ {item.price}</p>
                        <p className="text-xs text-gray-500">{item.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        )}

        {/* TAB 3: SALES REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-6 print:hidden">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-black">
                <p className="text-sm text-gray-500 font-bold uppercase">Total Revenue</p>
                <p className="text-3xl font-extrabold text-black mt-2">৳ {totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                <p className="text-sm text-gray-500 font-bold uppercase">Items Sold</p>
                <p className="text-3xl font-extrabold text-black mt-2">{salesRecord.length}</p>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-bold mb-4 text-black border-b pb-2">Revenue by Payment Method</h2>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(revenueByMethod).map(([method, amount]) => (
                  <div key={method} className="bg-gray-50 p-4 rounded text-center border">
                    <p className="uppercase text-xs font-bold text-gray-500 mb-1">{method}</p>
                    <p className="text-lg font-bold text-black">৳ {amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Transactions Log */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-bold mb-4 text-black border-b pb-2">Recent Transactions Log</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 text-sm">
                      <th className="p-3 border-b">Date & Time</th>
                      <th className="p-3 border-b">Item Details</th>
                      <th className="p-3 border-b">Method</th>
                      <th className="p-3 border-b">TrxID</th>
                      <th className="p-3 border-b text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesRecord.length === 0 && (
                      <tr><td colSpan={5} className="p-4 text-center text-gray-500">No sales recorded yet.</td></tr>
                    )}
                    {salesRecord.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50 text-sm">
                        <td className="p-3 border-b text-gray-600">
                          {new Date(sale.sold_at).toLocaleString('en-BD')}
                        </td>
                        <td className="p-3 border-b text-black font-medium">
                          {sale.dresses?.name || 'Unknown Item'}
                          <span className="block text-xs text-gray-400 font-mono">{sale.dresses?.barcode}</span>
                        </td>
                        <td className="p-3 border-b uppercase font-bold text-gray-700">
                          {sale.payment_method}
                        </td>
                        <td className="p-3 border-b font-mono text-gray-500">
                          {sale.transaction_id}
                        </td>
                        <td className="p-3 border-b text-right font-bold text-green-600">
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

      {/* RECEIPT PRINT LAYOUT (Only visible when printing from POS tab) */}
      {currentDress && activeTab === 'pos' && (
        <div className="hidden print:block w-[80mm] text-black font-mono text-sm p-2 mx-auto">
          <div className="text-center font-bold text-lg mb-1">CRAVE ABS</div>
          <div className="text-center text-xs mb-4">Khulna, Bangladesh</div>
          <div className="border-b border-dashed my-2"></div>
          <div className="flex justify-between text-xs">
            <span>Date: {new Date().toLocaleDateString()}</span>
            <span>Time: {new Date().toLocaleTimeString()}</span>
          </div>
          <div className="border-b border-dashed my-2"></div>
          <div className="my-2">
            <div className="font-bold">{currentDress.name}</div>
            <div className="text-xs text-gray-600">Category: {currentDress.category}</div>
            <div className="flex justify-between font-bold mt-1">
              <span>1x Item</span>
              <span>৳ {currentDress.price}</span>
            </div>
          </div>
          <div className="border-b border-dashed my-2"></div>
          <div className="flex justify-between font-bold text-base">
            <span>TOTAL Paid:</span>
            <span>৳ {currentDress.price}</span>
          </div>
          <div className="text-xs mt-1">
            Method: <span className="uppercase font-bold">{paymentMethod}</span>
          </div>
          {paymentMethod !== 'cash' && (
            <div className="text-xs font-mono">TrxID: {trxId}</div>
          )}
          <div className="border-b border-dashed my-2"></div>
          <div className="text-center text-xs font-bold mt-4">Thank You For Shopping At CRAVE ABS!</div>
        </div>
      )}
    </div>
  );
}