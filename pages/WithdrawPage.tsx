// client/pages/WithdrawPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, AlertCircle, Loader2, History, Landmark, CreditCard } from 'lucide-react';
import { API_URL } from '../src/config';

export default function WithdrawPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  // User Profile Winnings Balance (withdrawable)
  const [winningsBalance, setWinningsBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState<boolean>(true);

  // Form Fields
  const [method, setMethod] = useState<'UPI' | 'BANK'>('UPI');
  const [amount, setAmount] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>('');
  const [upiId, setUpiId] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState<string>('');
  const [ifscCode, setIfscCode] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [branchName, setBranchName] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');

  // States
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch current winnings balance
  const fetchProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setWinningsBalance(data.winningsBalance || 0);
      }
    } catch (e: any) {
      console.error("Error fetching balance:", e);
    } finally {
      setLoadingBalance(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setSuccess(null);

    // Common validations
    if (!accountHolderName.trim()) {
      setError('Account Holder Name is required.');
      return;
    }

    const valAmount = parseFloat(amount);
    if (isNaN(valAmount) || valAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    if (valAmount < 100) {
      setError('Minimum withdrawal amount is ₹100.');
      return;
    }

    if (valAmount > winningsBalance) {
      setError(`Amount cannot exceed your withdrawable balance of ₹${winningsBalance.toFixed(2)}.`);
      return;
    }

    // Method specific validations
    const payload: any = {
      method,
      amount: valAmount,
      accountHolderName: accountHolderName.trim()
    };

    if (method === 'UPI') {
      if (!upiId.trim()) {
        setError('UPI ID is required.');
        return;
      }
      if (!upiId.includes('@')) {
        setError('Please enter a valid UPI ID (e.g. name@upi).');
        return;
      }
      payload.upiId = upiId.trim();
    } else {
      if (!accountNumber.trim()) {
        setError('Account Number is required.');
        return;
      }
      if (accountNumber.trim() !== confirmAccountNumber.trim()) {
        setError('Account Number and Confirm Account Number do not match.');
        return;
      }
      if (!ifscCode.trim()) {
        setError('IFSC Code is required.');
        return;
      }

      // IFSC regex check
      const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (!ifscRegex.test(ifscCode.toUpperCase().trim())) {
        setError('Invalid IFSC Code format. (E.g. SBIN0001234)');
        return;
      }

      if (!bankName.trim()) {
        setError('Bank Name is required.');
        return;
      }
      if (!branchName.trim()) {
        setError('Branch Name is required.');
        return;
      }
      if (!mobileNumber.trim()) {
        setError('Mobile Number is required.');
        return;
      }
      if (mobileNumber.trim().length < 10) {
        setError('Mobile Number must be at least 10 digits.');
        return;
      }

      payload.accountNumber = accountNumber.trim();
      payload.confirmAccountNumber = confirmAccountNumber.trim();
      payload.ifscCode = ifscCode.toUpperCase().trim();
      payload.bankName = bankName.trim();
      payload.branchName = branchName.trim();
      payload.mobileNumber = mobileNumber.trim();
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/withdraw/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Withdrawal request submitted successfully!');
        // Refresh balance display
        fetchProfile();
        // Reset inputs
        setAmount('');
        setAccountHolderName('');
        setUpiId('');
        setAccountNumber('');
        setConfirmAccountNumber('');
        setIfscCode('');
        setBankName('');
        setBranchName('');
        setMobileNumber('');
        // Redirect to history after short delay
        setTimeout(() => {
          navigate('/wallet/withdraw-history');
        }, 1500);
      } else {
        throw new Error(data.message || data.error || 'Failed to submit withdrawal request.');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[430px] mx-auto min-h-screen bg-gradient-to-b from-[#1a0000] via-[#100000] to-neutral-950 shadow-2xl relative flex flex-col text-neutral-200 md:border-x md:border-white/5">
      {/* Header */}
      <div className="px-4 py-4 bg-neutral-900/90 border-b border-rose-955/20 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-neutral-450 hover:text-white transition-colors cursor-pointer p-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-extrabold text-[#ffd700] text-xs uppercase tracking-wider font-display">
            Withdraw Money
          </span>
        </div>
        <button
          onClick={() => navigate('/wallet/withdraw-history')}
          className="text-[#ffd700]/80 hover:text-[#ffd700] flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
        >
          <History className="w-3.5 h-3.5" />
          History
        </button>
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-5 text-left pb-10">
        {/* Balance Display */}
        <div className="bg-[#240e0e] border border-rose-500/20 p-4.5 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="space-y-0.5">
            <span className="text-[9px] text-zinc-400 font-bold block uppercase tracking-wider">Withdrawable Balance</span>
            <span className="text-xl font-extrabold text-[#ffd700] font-mono leading-none pt-1 block">
              {loadingBalance ? 'Loading...' : `₹${winningsBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
            <Landmark className="w-5 h-5" />
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-1.5 rounded-xl border border-rose-955/15 shrink-0">
          <button
            type="button"
            onClick={() => { setMethod('UPI'); setError(null); }}
            className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              method === 'UPI' 
                ? 'bg-amber-500 text-neutral-950 shadow-md font-bold' 
                : 'text-neutral-450 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            UPI
          </button>
          <button
            type="button"
            onClick={() => { setMethod('BANK'); setError(null); }}
            className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              method === 'BANK' 
                ? 'bg-amber-500 text-neutral-950 shadow-md font-bold' 
                : 'text-neutral-450 hover:text-white'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            Bank Account
          </button>
        </div>

        {/* Errors / Success Alerts */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-500/30 text-rose-200 text-[11px] p-3.5 rounded-xl flex items-start gap-2.5 shadow-md">
            <AlertCircle className="w-4 h-4 text-rose-450 shrink-0 mt-0.5" />
            <span className="font-semibold leading-tight">{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-[11px] p-3.5 rounded-xl flex items-start gap-2.5 shadow-md">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span className="font-semibold leading-tight">{success}</span>
          </div>
        )}

        {/* Withdrawal Form */}
        <form onSubmit={handleSubmit} className="bg-neutral-900/60 border border-rose-955/15 p-5 rounded-2xl space-y-4 shadow-md">
          {/* Account Holder Name */}
          <div className="space-y-1">
            <label className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider pl-1">Account Holder Name</label>
            <input
              type="text"
              required
              value={accountHolderName}
              onChange={e => setAccountHolderName(e.target.value)}
              placeholder="Enter bank account name"
              className="w-full bg-neutral-950 border border-rose-955/20 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-700 focus:outline-none transition-colors"
            />
          </div>

          {method === 'UPI' ? (
            /* UPI Fields */
            <div className="space-y-1">
              <label className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider pl-1">UPI ID</label>
              <input
                type="text"
                required
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="example@upi"
                className="w-full bg-neutral-950 border border-rose-955/20 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-700 focus:outline-none transition-colors"
              />
            </div>
          ) : (
            /* Bank Fields */
            <>
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider pl-1">Account Number</label>
                <input
                  type="password"
                  required
                  value={accountNumber}
                  onChange={e => setAccountNumber(e.target.value)}
                  placeholder="Enter Account Number"
                  className="w-full bg-neutral-950 border border-rose-955/20 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-700 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider pl-1">Confirm Account Number</label>
                <input
                  type="text"
                  required
                  value={confirmAccountNumber}
                  onChange={e => setConfirmAccountNumber(e.target.value)}
                  placeholder="Confirm Account Number"
                  className="w-full bg-neutral-950 border border-rose-955/20 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-700 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider pl-1">IFSC Code</label>
                  <input
                    type="text"
                    required
                    value={ifscCode}
                    onChange={e => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="E.g. SBIN0001234"
                    className="w-full bg-neutral-950 border border-rose-955/20 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-700 focus:outline-none transition-colors font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider pl-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={e => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit number"
                    className="w-full bg-neutral-950 border border-rose-955/20 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-700 focus:outline-none transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider pl-1">Bank Name</label>
                  <input
                    type="text"
                    required
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    placeholder="E.g. SBI"
                    className="w-full bg-neutral-950 border border-rose-955/20 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-700 focus:outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider pl-1">Branch Name</label>
                  <input
                    type="text"
                    required
                    value={branchName}
                    onChange={e => setBranchName(e.target.value)}
                    placeholder="E.g. Connaught Place"
                    className="w-full bg-neutral-950 border border-rose-955/20 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-zinc-700 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          {/* Amount Field */}
          <div className="space-y-1 pt-1.5">
            <label className="text-[9px] text-zinc-400 block font-bold uppercase tracking-wider pl-1">Withdraw Amount (₹)</label>
            <input
              type="number"
              required
              min="100"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Minimum ₹100"
              className="w-full bg-neutral-950 border border-rose-955/20 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-xs text-[#ffd700] font-black focus:outline-none transition-colors font-mono"
            />
            <span className="text-[8px] text-zinc-550 block font-semibold pl-1">Limit: ₹100 - ₹5,00,000 per request.</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-3 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-widest shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" /> Submitting Request...
              </>
            ) : (
              'Submit Withdrawal Request'
            )}
          </button>
        </form>

        {/* Withdrawal details note */}
        <div className="p-4 bg-neutral-900/30 border border-rose-955/10 rounded-xl space-y-1.5">
          <h4 className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Important Note:</h4>
          <ul className="list-disc pl-3.5 text-[9px] text-zinc-400 space-y-1 font-medium leading-relaxed">
            <li>Ensure account details/UPI ID is correct. The platform is not responsible for incorrect details.</li>
            <li>Approval can take up to 2-24 hours depending on the bank verification queue.</li>
            <li>Winnings balance is deducted only after admin approval.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
