'use client';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  // Inventory State
  const [barcodeInput, setBarcodeInput] = useState('');
  const [currentDress, setCurrentDress] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'upay' | 'rocket' | 'cash'>('cash');
  const [trxId, setTrxId] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Handle Simple Password Auth
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "CRAVE_ABS_2026") { // Replace with your desired password
      setIsAuthenticated(true);
    } else {
      alert("Incorrect Admin Password");
    }
  };

  // Handle Barcode Scan / Lookup
  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    
    if (!barcodeInput) return;

    const { data, error } = await supabase
      .from('dresses')
      .select('*')
      .eq('barcode', barcodeInput)
      .single();

    if (error || !data) {
      setMessage({ type: 'error', text: 'Dress not found with this barcode!' });
      setCurrentDress(null);
    } else {
      setCurrentDress(data);
    }
    setBarcodeInput('');
  };

  // Process Sale & Trigger Print
  const handleCheckout = async () => {
    if (!currentDress) return;
    if (currentDress.status === 'sold') {
      setMessage({ type: 'error', text: 'This dress is already marked as SOLD!' });
      return;
    }

    // 1. Insert into Sales
    const { error: saleError } = await supabase.from('sales').insert([
      {
        dress_id: currentDress.id,
        payment_method: paymentMethod,
        transaction_id: paymentMethod === 'cash' ? 'CASH-SALE' : trxId,
        amount_paid: currentDress.price,
      },
    ]);

    if (saleError) {
      setMessage({ type: 'error', text: 'Checkout failed. Please try again.' });
      return;
    }

    // 2. Update Dress Status
    await supabase
      .from('dresses')
      .update({ status: 'sold' })
      .eq('id', currentDress.id);

    setMessage({ type: 'success', text: 'Sale recorded successfully! Printing receipt...' });

    // 3. Trigger External Printing Machine via Browser Print Window
    setTimeout(() => {
      window.print();
      setCurrentDress(null);
      setTrxId('');
    }, 500);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-md w-96">
          <h2 className="text-2xl font-bold mb-4 text-center text-black">CRAVE ABS Admin</h2>
          <input 
            type="password" 
            placeholder="Enter Admin Password" 
            className="w-full p-2 border rounded mb-4 text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="w-full bg-black text-white p-2 rounded hover:bg-gray-800">
            Access Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 print:bg-white print:p-0">
      {/* POS Screen View (Hidden during printing) */}
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow print:hidden">
        <header className="border-b pb-4 mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-gray-900">CRAVE ABS — POS System</h1>
          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">Admin Connected</span>
        </header>

        {/* System Messages */}
        {message.text && (
          <div className={`p-3 mb-4 rounded ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message.text}
          </div>
        )}

        {/* Barcode Scanner Input */}
        <form onSubmit={handleBarcodeSubmit} className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Scan Dress Barcode</label>
          <input
            type="text"
            autoFocus
            placeholder="Click here and beep barcode..."
            className="w-full p-4 border-2 border-black rounded text-lg font-mono text-black focus:outline-none focus:ring-2 focus:ring-gray-400"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
          />
        </form>

        {/* Scanned Item Details & Payment Confirmation */}
        {currentDress && (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-black">Current Scanned Item</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-500 text-sm">Product Name</p>
                <p className="text-lg font-semibold text-black">{currentDress.name}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Category</p>
                <p className="text-lg font-semibold text-black">{currentDress.category}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Price</p>
                <p className="text-xl font-bold text-black">৳ {currentDress.price}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Current Status</p>
                <p className={`capitalize font-bold ${currentDress.status === 'available' ? 'text-green-600' : 'text-red-600'}`}>
                  {currentDress.status}
                </p>
              </div>
            </div>

            {currentDress.status === 'available' && (
              <div className="border-t pt-4">
                <h3 className="text-md font-semibold mb-3 text-black">Select Payment Method</h3>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {['cash', 'bkash', 'nagad', 'upay', 'rocket'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      className={`p-2 rounded text-sm font-bold uppercase border ${paymentMethod === method ? 'bg-black text-white' : 'bg-white text-black border-gray-300'}`}
                      onClick={() => setPaymentMethod(method as any)}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {paymentMethod !== 'cash' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">MFS Transaction ID (TrxID)</label>
                    <input
                      type="text"
                      placeholder="e.g. AX76K981"
                      className="w-full p-2 border rounded font-mono text-black"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                    />
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  className="w-full bg-green-600 text-white p-3 rounded font-bold text-lg hover:bg-green-700 transition"
                >
                  Confirm Payment & Print Receipt
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RECEIPT PRINT LAYOUT (Hidden on screen, optimized for 58mm/80mm thermal receipt printers) */}
      {currentDress && (
        <div className="hidden print:block w-[80mm] text-black font-mono text-sm p-2 mx-auto">
          <div className="text-center font-bold text-lg mb-1">CRAVE ABS</div>
          <div className="text-center text-xs mb-4">Dhaka, Bangladesh</div>
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
          <div className="text-center text-[10px] text-gray-500">Powered by CRAVE POS System</div>
        </div>
      )}
    </div>
  );
}