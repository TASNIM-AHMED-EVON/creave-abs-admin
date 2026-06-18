'use client';
import { useState, useEffect } from 'react';
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
  const [invQuantity, setInvQuantity] = useState('1'); // Default to 1, can be set to 5-10 for bundles
  const [invMessage, setInvMessage] = useState({ type: '', text: '' });
  const [recentInventory, setRecentInventory] = useState<any[]>([]);

  // Refund State
  const [refundBarcode, setRefundBarcode] = useState('');
  const [refundItemSales, setRefundItemSales] = useState<any[]>([]);
  const [refundMessage, setRefundMessage] = useState({ type: '', text: '' });

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
    if (currentDress.quantity <= 0) {
      setPosMessage({ type: 'error', text: 'This item is Out of Stock!' });
      return;
    }

    // 1. Log the individual sale item
    const { error: saleError } = await supabase.from('sales').insert([
      {
        dress_id: currentDress.id,
        payment_method: paymentMethod,
        transaction_id: paymentMethod === 'cash' ? 'CASH-SALE' : trxId,
        amount_paid: currentDress.price,
        status: 'completed'
      },
    ]);

    if (saleError) {
      setPosMessage({ type: 'error', text: 'Checkout failed.' });
      return;
    }

    // 2. Deduct 1 from stock quantity
    const newQuantity = currentDress.quantity - 1;
    await supabase
      .from('dresses')
      .update({ 
        quantity: newQuantity,
        status: newQuantity === 0 ? 'sold' : 'available' 
      })
      .eq('id', currentDress.id);

    setPosMessage({ type: 'success', text: 'Sale recorded! Printing receipt...' });

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
      .select(`
        *,
        dresses!inner ( id, name, barcode, quantity )
      `)
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

    // 1. Mark the specific transaction as refunded
    const { error: updateSaleError } = await supabase
      .from('sales')
      .update({ status: 'refunded' })
      .eq('id', sale.id);

    if (updateSaleError) {
      setRefundMessage({ type: 'error', text: 'Failed to update sale status.' });
      return;
    }

    // 2. Put 1 item back into the active stock bundle
    const restoredQuantity = sale.dresses.quantity + 1;
    await supabase
      .from('dresses')
      .update({ 
        quantity: restoredQuantity,
        status: 'available' 
      })
      .eq('id', sale.dresses.id);

    setRefundMessage({ type: 'success', text: 'Refund successful! Stock levels updated.' });
    setRefundBarcode('');
    setRefundItemSales([]);
    fetchRecentInventory();
    fetchSalesData();
  };

  // --- REPORTS FUNCTIONS ---
  const fetchSalesData = async () => {
    const { data } = await supabase
      .from('sales')
      .select(`
        *,
        dresses ( name, barcode )
      `)
      .order('sold_at', { ascending: false });

    if (data) {
      setSalesRecord(data);
      
      let total = 0;
      const methods: Record<string, number> = { cash: 0, bkash: 0, nagad: 0, upay: 0, rocket: 0 };

      data.forEach(sale => {
        // Only add up revenue from COMPLETED non-refunded transactions
        if (sale.status === 'completed') {
          const amount = Number(sale.amount_paid);
          total += amount;
          if (methods[sale.payment_method] !== undefined) {
            methods[sale.payment_method] += amount;
          }
        }
      });

      setTotalRevenue(total);
      setRevenueByMethod(methods);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') fetchSalesData();
  }, [activeTab]);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-96">
          <h2 className="text-2xl font-bold mb-4 text-center text-black">CRAVE ABS Login</h2>
          <input type="password" placeholder="Admin Password" className="w-full p-2 border rounded mb-4 text-black" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" className="w-full bg-black text-white p-2 rounded hover:bg-gray-800">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      {/* Navigation Tabs */}
      <div className="bg-white shadow print:hidden">
        <div className="max-w-6xl mx-auto flex space-x-8 p-4">
          <h1 className="text-2xl font-extrabold text-black mr-6">CRAVE ABS</h1>
          <button onClick={() => setActiveTab('pos')} className={`font-bold pb-2 ${activeTab === 'pos' ? 'border-b-4 border-black text-black' : 'text-gray-500'}`}>Terminal (POS)</button>
          <button onClick={() => setActiveTab('inventory')} className={`font-bold pb-2 ${activeTab === 'inventory' ? 'border-b-4 border-black text-black' : 'text-gray-500'}`}>Add Stock / Bundles</button>
          <button onClick={() => setActiveTab('refund')} className={`font-bold pb-2 ${activeTab === 'refund' ? 'border-b-4 border-red-600 text-red-600' : 'text-gray-500'}`}>Refund Center</button>
          <button onClick={() => setActiveTab('reports')} className={`font-bold pb-2 ${activeTab === 'reports' ? 'border-b-4 border-black text-black' : 'text-gray-500'}`}>Sales Reports</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-8 p-6 print:p-0 print:mt-0">
        
        {/* TAB 1: POS TERMINAL */}
        {activeTab === 'pos' && (
          <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow print:hidden">
            <h2 className="text-xl font-bold mb-4 border-b pb-2 text-black">Checkout Counter</h2>
            {posMessage.text && <div className={`p-3 mb-4 rounded ${posMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{posMessage.text}</div>}
            <form onSubmit={handleBarcodeSubmit} className="mb-6">
              <input type="text" autoFocus placeholder="Scan barcode to sell..." className="w-full p-4 border-2 border-black rounded text-lg font-mono text-black focus:outline-none" value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} />
            </form>
            {currentDress && (
              <div className="bg-gray-50 p-6 rounded border">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><p className="text-sm text-gray-500">Dress</p><p className="font-bold text-black">{currentDress.name}</p></div>
                  <div><p className="text-sm text-gray-500">Price</p><p className="font-bold text-black text-xl">৳ {currentDress.price}</p></div>
                  <div><p className="text-sm text-gray-500">Available Stock Pieces</p><p className={`font-bold ${currentDress.quantity > 0 ? 'text-blue-600' : 'text-red-600'}`}>{currentDress.quantity} items left</p></div>
                </div>
                {currentDress.quantity > 0 ? (
                  <>
                    <h3 className="text-sm font-bold mb-2 mt-4 text-black">Payment Method</h3>
                    <div className="flex gap-2 mb-4">
                      {['cash', 'bkash', 'nagad', 'upay', 'rocket'].map((method) => (
                        <button key={method} className={`px-4 py-2 rounded text-sm font-bold uppercase border ${paymentMethod === method ? 'bg-black text-white' : 'bg-white text-black'}`} onClick={() => setPaymentMethod(method as any)}>{method}</button>
                      ))}
                    </div>
                    {paymentMethod !== 'cash' && <input type="text" placeholder="MFS TrxID" className="w-full p-2 border rounded mb-4 text-black" value={trxId} onChange={(e) => setTrxId(e.target.value)} />}
                    <button onClick={handleCheckout} className="w-full bg-green-600 text-white p-3 rounded font-bold hover:bg-green-700">Confirm & Print</button>
                  </>
                ) : (
                  <p className="text-red-600 font-bold">This item bundle is completely sold out!</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INVENTORY / BUNDLE MANAGEMENT */}
        {activeTab === 'inventory' && (
           <div className="grid grid-cols-2 gap-6 print:hidden">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4 border-b pb-2 text-black">Register Dress / Bundle</h2>
                {invMessage.text && <div className={`p-3 mb-4 rounded ${invMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{invMessage.text}</div>}
                <form onSubmit={handleAddInventory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Barcode Tag</label>
                    <input required type="text" className="w-full p-2 border rounded text-black" placeholder="Scan bundle barcode tag" value={invBarcode} onChange={(e) => setInvBarcode(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700">Dress Title</label>
                    <input required type="text" className="w-full p-2 border rounded text-black" placeholder="e.g., Premium Cotton Panjabi" value={invName} onChange={(e) => setInvName(e.target.value)} />
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700">Price Per Piece (BDT)</label>
                      <input required type="number" className="w-full p-2 border rounded text-black" placeholder="1500" value={invPrice} onChange={(e) => setInvPrice(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700">Bundle Quantity Size</label>
                      <input required type="number" min="1" className="w-full p-2 border rounded text-black font-bold text-blue-600" placeholder="e.g. 5 or 10 pieces" value={invQuantity} onChange={(e) => setInvQuantity(e.target.value)} />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-black text-white p-3 rounded font-bold hover:bg-gray-800">Save Bundle to System</button>
                </form>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4 border-b pb-2 text-black">Active Dress Stock</h2>
                <div className="space-y-3">
                  {recentInventory.map(item => (
                    <div key={item.id} className="p-3 border rounded flex justify-between items-center">
                      <div>
                        <p className="font-bold text-black">{item.name}</p>
                        <p className="text-xs text-gray-500 font-mono">Barcode: {item.barcode}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">৳ {item.price}</p>
                        <p className={`text-xs px-2 py-0.5 rounded font-bold inline-block ${item.quantity > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>{item.quantity} In Stock</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
           </div>
        )}

        {/* TAB 3: REFUND CENTER */}
        {activeTab === 'refund' && (
          <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow print:hidden">
            <h2 className="text-xl font-bold mb-4 border-b pb-2 text-red-600">Customer Item Returns & Refunds</h2>
            {refundMessage.text && <div className={`p-3 mb-4 rounded ${refundMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{refundMessage.text}</div>}
            
            <form onSubmit={handleRefundSearch} className="mb-6 flex gap-2">
              <input type="text" autoFocus placeholder="Scan the dress barcode to find purchases..." className="w-full p-3 border-2 border-red-200 rounded font-mono text-black focus:outline-none focus:border-red-500" value={refundBarcode} onChange={(e) => setRefundBarcode(e.target.value)} />
              <button type="submit" className="bg-red-600 text-white px-6 rounded font-bold hover:bg-red-700">Find</button>
            </form>

            <div className="space-y-4">
              {refundItemSales.map((sale) => (
                <div key={sale.id} className="p-4 border border-red-100 rounded-lg bg-red-50/50 flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-black text-md">{sale.dresses.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">Sold at: {new Date(sale.sold_at).toLocaleString('en-BD')}</p>
                    <p className="text-xs font-mono text-gray-600">Method: <span className="uppercase font-bold">{sale.payment_method}</span> | TrxID: {sale.transaction_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-red-600 mb-2">৳ {sale.amount_paid}</p>
                    <button onClick={() => processRefund(sale)} className="bg-white border border-red-600 text-red-600 px-4 py-1.5 rounded text-xs font-bold hover:bg-red-600 hover:text-white transition">Approve & Return to Stock</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SALES REPORTS */}
        {activeTab === 'reports' && (
          <div className="space-y-6 print:hidden">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-black">
                <p className="text-sm text-gray-500 font-bold uppercase">Net Revenue (Excluding Refunds)</p>
                <p className="text-3xl font-extrabold text-black mt-2">৳ {totalRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                <p className="text-sm text-gray-500 font-bold uppercase">Total Items Sold</p>
                <p className="text-3xl font-extrabold text-black mt-2">{salesRecord.filter(s => s.status === 'completed').length} items</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-bold mb-4 text-black border-b pb-2">Net Revenue Breakdown</h2>
              <div className="grid grid-cols-5 gap-4">
                {Object.entries(revenueByMethod).map(([method, amount]) => (
                  <div key={method} className="bg-gray-50 p-4 rounded text-center border">
                    <p className="uppercase text-xs font-bold text-gray-500 mb-1">{method}</p>
                    <p className="text-lg font-bold text-black">৳ {amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-bold mb-4 text-black border-b pb-2">Master Ledger</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 text-sm">
                      <th className="p-3 border-b">Date & Time</th>
                      <th className="p-3 border-b">Item Details</th>
                      <th className="p-3 border-b">Method</th>
                      <th className="p-3 border-b">Status</th>
                      <th className="p-3 border-b text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesRecord.map((sale) => (
                      <tr key={sale.id} className={`text-sm ${sale.status === 'refunded' ? 'bg-red-50/40 line-through text-gray-400' : 'hover:bg-gray-50 text-black'}`}>
                        <td className="p-3 border-b">{new Date(sale.sold_at).toLocaleString('en-BD')}</td>
                        <td className="p-3 border-b font-medium">
                          {sale.dresses?.name}
                          <span className="block text-xs font-mono text-gray-400">{sale.dresses?.barcode}</span>
                        </td>
                        <td className="p-3 border-b uppercase font-bold">{sale.payment_method}</td>
                        <td className="p-3 border-b">
                          <span className={`text-xs px-2 py-0.5 rounded font-bold uppercase ${sale.status === 'refunded' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{sale.status}</span>
                        </td>
                        <td className={`p-3 border-b text-right font-bold ${sale.status === 'refunded' ? 'text-gray-400' : 'text-green-600'}`}>৳ {sale.amount_paid}</td>
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
          <div className="text-xs mt-1">Method: <span className="uppercase font-bold">{paymentMethod}</span></div>
          {paymentMethod !== 'cash' && <div className="text-xs font-mono">TrxID: {trxId}</div>}
          <div className="border-b border-dashed my-2"></div>
          <div className="text-center text-xs font-bold mt-4">Thank You For Shopping At CRAVE ABS!</div>
        </div>
      )}
    </div>
  );
}