// client/pages/DepositPaymentPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from '../src/react-router-dom';
import { ArrowLeft, Copy, Check, AlertCircle, QrCode } from 'lucide-react';
import { API_URL } from '../src/config';

export default function DepositPaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine amount - safe access for differing location shapes
  // Some location types only expose pathname; cast to any and fallback to window.location.search
  const locAny = location as any;
  const rawSearch = locAny?.search ?? (typeof window !== 'undefined' ? window.location.search : '');
  const stateAmount = locAny?.state?.amount;
  const queryAmount = new URLSearchParams(rawSearch).get('amount');
  const amount = stateAmount || queryAmount || "500";

  const [upiId, setUpiId] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  // Fetch active payment method and create Razorpay order
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("API_URL =", API_URL);

        // Get active payment method
        const pmRes = await fetch(`${API_URL}/api/payment-methods/next`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!pmRes.ok) throw new Error('Failed to fetch active payment method');
        const pmData = await pmRes.json();
        console.log("PAYMENT METHOD RESPONSE =", pmData);

        if (!pmData.success) throw new Error(pmData.error || 'No active payment method');

        // Normalize payment method object whether backend returns fields at root or under `paymentMethod` or `data`
        const paymentMethod = pmData.paymentMethod || pmData.data || pmData || {};
        const extractedUpiId = paymentMethod.upiId || '';
        const extractedId = paymentMethod._id || '';

        setUpiId(extractedUpiId);
        setPaymentMethodId(extractedId);

        // Determine raw QR path from possible response shapes (do NOT create order here)
        const rawQr = pmData.order?.qrCode || pmData.qrCode || pmData.qrImageUrl || paymentMethod.qrCode || paymentMethod.qrImageUrl || '';
        console.log('RAW QR =', rawQr);

        let qrImageUrl: string | null = null;
        if (rawQr) {
          qrImageUrl = rawQr.startsWith('http') ? encodeURI(rawQr) : `${API_URL}${encodeURI(rawQr)}`;
          setQrCodeUrl(qrImageUrl);
        }

        // Debugging info
        console.log('PAYMENT METHOD =', paymentMethod);
        console.log('QR URL =', qrImageUrl);
      } catch (e: any) {
        setError(e.message || 'Unexpected error');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [token, amount]);

  // Create order only after QR and paymentMethodId are set so QR renders first
  useEffect(() => {
    if (!paymentMethodId) return;
    if (!qrCodeUrl && !upiId) return; // nothing to show/charge

    const createOrder = async () => {
      try {
        setLoading(true);
        const orderRes = await fetch(`${API_URL}/api/payment/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ amount: Number(amount), paymentMethodId })
        });

        if (!orderRes.ok) {
          const errText = await orderRes.text();
          throw new Error(`Failed to create payment order: ${errText}`);
        }

        const orderData = await orderRes.json();
        console.log('ORDER RESPONSE =', orderData);
        if (!orderData.success) throw new Error(orderData.error || 'Order creation failed');
      } catch (e: any) {
        setError(e.message || 'Unexpected error creating order');
      } finally {
        setLoading(false);
      }
    };

    // Call createOrder asynchronously to allow React to render QR first
    createOrder();
  }, [paymentMethodId, qrCodeUrl]);

  const handleCopyUPI = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-[430px] mx-auto min-h-screen bg-gradient-to-b from-[#1c0000] via-[#100000] to-neutral-950 shadow-2xl relative flex flex-col text-neutral-200 md:border-x md:border-white/5">
      {/* Header */}
      <div className="px-4 py-4 bg-neutral-900/90 border-b border-rose-955/20 flex items-center gap-3 shrink-0 select-none">
        <button onClick={() => navigate(-1)} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-extrabold text-[#ffd700] text-sm uppercase tracking-wider font-display">
          UPI DEPOSIT PAYMENT
        </span>
      </div>

      {/* Main Body */}
      <div className="flex-1 p-5 overflow-y-auto space-y-6 text-left">
        {/* Amount Card */}
        <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20 p-5 rounded-2xl flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-5 -mt-5 blur-xl" />
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest mb-1">AMOUNT TO PAY</span>
          <span className="text-3xl font-black text-white font-mono">₹{parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>

        {/* QR / UPI Section */}
        <div className="bg-neutral-900/40 border border-rose-955/15 p-5 rounded-2xl flex flex-col items-center space-y-5">
          <label className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider self-start">SCAN QR CODE TO PAY</label>
          {loading ? (
            <div className="w-48 h-48 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col items-center justify-center space-y-2">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-neutral-400 font-semibold animate-pulse">Loading gateway...</span>
            </div>
          ) : qrCodeUrl ? (
            <div className="bg-white p-3 rounded-2xl shadow-xl border border-neutral-800/20 max-w-[200px] transition-all hover:scale-105 duration-300">
              <img src={qrCodeUrl} alt="Payment QR Code" className="w-full h-auto aspect-square object-contain rounded-xl" />
            </div>
          ) : upiId ? (
            <div className="w-48 h-48 rounded-xl bg-neutral-950/80 border border-amber-500/10 flex flex-col items-center justify-center text-center p-4 space-y-2">
              <span className="text-xs text-zinc-400">No QR available</span>
              <div className="text-white font-mono font-bold text-sm break-words">{upiId}</div>
              <span className="text-[11px] text-zinc-400">Use the UPI ID above to pay</span>
            </div>
          ) : (
            <div className="w-48 h-48 rounded-xl bg-neutral-950/80 border border-rose-600/10 flex flex-col items-center justify-center text-center p-4 space-y-2">
              <AlertCircle className="w-10 h-10 text-rose-500/60" />
              <span className="text-[11px] text-zinc-400 font-medium">No payment method available</span>
            </div>
          )}
        </div>

        {/* UPI Copy Field */}
        <div className="bg-neutral-900/40 border border-rose-955/15 p-5 rounded-2xl space-y-3">
          <label className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">PAY TO UPI ADDRESS</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-neutral-950 border border-rose-955/30 rounded-xl py-3 px-4 text-xs font-bold text-white font-mono flex items-center justify-between truncate select-all">
              {loading ? (
                <span className="text-stone-500 animate-pulse">Fetching UPI ID...</span>
              ) : (
                upiId || 'No UPI ID available'
              )}
            </div>
            <button
              onClick={handleCopyUPI}
              disabled={loading || !upiId}
              className={`p-3 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${copied ? 'bg-emerald-500 border-emerald-400 text-neutral-950 shadow-md' : 'bg-neutral-900 border-rose-955/20 text-neutral-300 hover:border-amber-500/40'}`}
              title="Copy UPI ID"
            >
              {copied ? <Check className="w-5 h-5 stroke-[3]" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Guide Steps */}
        <div className="px-1 space-y-2.5">
          <div className="flex gap-3 text-xs text-zinc-400">
            <span className="w-5 h-5 rounded-full bg-neutral-900 border border-rose-955/20 text-amber-400 flex items-center justify-center shrink-0 font-bold font-mono">1</span>
            <p className="pt-0.5 leading-relaxed">Open any UPI app (GPay, PhonePe, Paytm, BHIM) and scan the QR code or enter the copied UPI ID.</p>
          </div>
          <div className="flex gap-3 text-xs text-zinc-400">
            <span className="w-5 h-5 rounded-full bg-neutral-900 border border-rose-955/20 text-amber-400 flex items-center justify-center shrink-0 font-bold font-mono">2</span>
            <p className="pt-0.5 leading-relaxed">Complete the payment of <strong className="text-white">₹{parseFloat(amount).toFixed(2)}</strong> from your bank account.</p>
          </div>
          <div className="flex gap-3 text-xs text-zinc-400">
            <span className="w-5 h-5 rounded-full bg-neutral-900 border border-rose-955/20 text-amber-400 flex items-center justify-center shrink-0 font-bold font-mono">3</span>
            <p className="pt-0.5 leading-relaxed">Your wallet will be credited automatically once the payment is confirmed.</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs p-4 rounded-xl flex items-center gap-3 shadow-md">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
