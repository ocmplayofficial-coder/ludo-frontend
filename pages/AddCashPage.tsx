import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Check, AlertCircle } from 'lucide-react';

export default function AddCashPage() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>("500");
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingBalance, setFetchingBalance] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  const fetchWallet = async () => {
    try {
      setFetchingBalance(true);
      setError(null);
      const res = await fetch("/api/wallet", {
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error("Failed to fetch wallet info");
      const data = await res.json();
      setBalance(data.walletBalance);
    } catch (err: any) {
      setError(err.message || "Could not retrieve wallet balance");
    } finally {
      setFetchingBalance(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleDeposit = async () => {
    const depAmt = parseFloat(amount);
    if (isNaN(depAmt) || depAmt <= 0) {
      setError("Please enter a valid deposit amount.");
      return;
    }
    if (depAmt < 10) {
      setError("Minimum deposit amount is ₹10.");
      return;
    }

    if (paymentMethod === 'upi') {
      navigate('/wallet/deposit-payment', { state: { amount: depAmt.toString() } });
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          amount: depAmt,
          method: paymentMethod === 'upi' ? "UPI Gateway" : paymentMethod === 'card' ? "Credit/Debit Card" : "Net Banking"
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`₹${depAmt.toFixed(2)} added successfully!`);
        // Refresh local balance
        fetchWallet();
        // Redirect back after a brief delay
        setTimeout(() => {
          navigate(-1);
        }, 1500);
      } else {
        throw new Error(data.error || "Deposit transaction failed");
      }
    } catch (err: any) {
      setError(err.message || "Error processing payment request");
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  return (
    <div className="w-full max-w-[430px] mx-auto min-h-screen bg-gradient-to-b from-[#1c0000] via-[#100000] to-neutral-950 shadow-2xl relative flex flex-col text-neutral-200 md:border-x md:border-white/5">
      {/* Header */}
      <div className="px-4 py-4 bg-neutral-900/90 border-b border-rose-955/20 flex items-center gap-3 shrink-0 select-none">
        <button
          onClick={() => navigate(-1)}
          className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-extrabold text-[#ffd700] text-sm uppercase tracking-wider font-display">
          ADD CASH TO WALLET
        </span>
      </div>

      {/* Main Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-5 text-left">
        {/* Wallet Balance Info */}
        <div className="bg-neutral-900/80 border border-amber-500/20 p-4 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">CURRENT BALANCE</span>
              <span className="text-xl font-extrabold text-white font-mono">
                {fetchingBalance ? (
                  <span className="text-sm text-stone-500 animate-pulse">Fetching...</span>
                ) : (
                  `₹${balance?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}`
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Amount Input Section */}
        <div className="bg-neutral-900/40 border border-rose-955/15 p-4 rounded-2xl space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">ENTER AMOUNT TO ADD</label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-xl font-black text-amber-400">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="100"
                className="w-full bg-neutral-950 border border-rose-955/30 rounded-xl py-3.5 pl-10 pr-4 text-lg font-bold text-white outline-none focus:border-amber-500 transition-all font-mono"
              />
            </div>
          </div>

          {/* Quick Amounts Grid */}
          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer font-mono text-center ${
                  amount === amt.toString()
                    ? 'bg-amber-500 border-amber-400 text-neutral-950 shadow-md'
                    : 'bg-neutral-900 border-rose-955/20 text-neutral-300 hover:border-amber-500/40'
                }`}
              >
                +₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Methods Section */}
        <div className="bg-neutral-900/40 border border-rose-955/15 p-4 rounded-2xl space-y-3">
          <label className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">SELECT PAYMENT METHOD</label>
          
          <div className="space-y-2">
            {/* UPI Option */}
            <div
              onClick={() => setPaymentMethod('upi')}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                paymentMethod === 'upi' ? 'bg-amber-500/5 border-amber-500/40' : 'bg-neutral-900/50 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⚡</span>
                <div>
                  <h4 className="text-xs font-bold text-white">UPI Gateway</h4>
                  <p className="text-[9px] text-zinc-500">Google Pay, PhonePe, Paytm, BHIM</p>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                paymentMethod === 'upi' ? 'border-amber-500 bg-amber-500 text-neutral-950' : 'border-neutral-700'
              }`}>
                {paymentMethod === 'upi' && <Check className="w-2.5 h-2.5 stroke-[4]" />}
              </div>
            </div>

            {/* Card Option */}
            <div
              onClick={() => setPaymentMethod('card')}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                paymentMethod === 'card' ? 'bg-amber-500/5 border-amber-500/40' : 'bg-neutral-900/50 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">💳</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Credit / Debit Card</h4>
                  <p className="text-[9px] text-zinc-500">Visa, Mastercard, RuPay, Maestro</p>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                paymentMethod === 'card' ? 'border-amber-500 bg-amber-500 text-neutral-950' : 'border-neutral-700'
              }`}>
                {paymentMethod === 'card' && <Check className="w-2.5 h-2.5 stroke-[4]" />}
              </div>
            </div>

            {/* Net Banking Option */}
            <div
              onClick={() => setPaymentMethod('netbanking')}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                paymentMethod === 'netbanking' ? 'bg-amber-500/5 border-amber-500/40' : 'bg-neutral-900/50 border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🏦</span>
                <div>
                  <h4 className="text-xs font-bold text-white">Net Banking</h4>
                  <p className="text-[9px] text-zinc-500">All major Indian banks supported</p>
                </div>
              </div>
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                paymentMethod === 'netbanking' ? 'border-amber-500 bg-amber-500 text-neutral-950' : 'border-neutral-700'
              }`}>
                {paymentMethod === 'netbanking' && <Check className="w-2.5 h-2.5 stroke-[4]" />}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications / Errors */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs p-3 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs p-3 rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      {/* Footer / Continue button */}
      <div className="p-4 bg-neutral-900/50 border-t border-rose-955/10">
        <button
          onClick={handleDeposit}
          disabled={loading || fetchingBalance}
          className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-widest shadow-lg active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Processing Transaction...' : `Pay ₹${parseFloat(amount || '0').toFixed(2)}`}
        </button>
      </div>
    </div>
  );
}
