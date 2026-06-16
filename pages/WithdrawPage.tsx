// client/pages/WithdrawPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from '../src/react-router-dom';
import { ArrowLeft, Check, Copy, AlertCircle, Loader2 } from 'lucide-react';
import { API_URL } from '../src/config';

export default function WithdrawPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's withdraw requests
  useEffect(() => {
    const fetchRequests = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/withdraw`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setRequests(data.withdraws || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [token]);

  const handleSubmit = async () => {
    if (!token) return;
    if (!amount || Number(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (!upiId.trim()) {
      setError('Enter your UPI ID');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(amount), upiId: upiId.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Withdraw request submitted');
        // Refresh list
        setRequests(prev => [{ withdrawRequest: data.withdrawRequest, ...data.withdrawRequest }, ...prev]);
        setAmount('');
        setUpiId('');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(data.message || data.error || 'Failed');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-amber-500/20 text-amber-400',
      APPROVED: 'bg-emerald-500/20 text-emerald-400',
      REJECTED: 'bg-rose-500/20 text-rose-400'
    };
    return (
      <span className={`px-2 py-1 text-xs rounded ${colors[status] || 'bg-gray-500/20'} `}> {status} </span>
    );
  };

  return (
    <div className="w-full max-w-[460px] mx-auto min-h-screen bg-gradient-to-b from-[#1a0000] via-[#100000] to-neutral-950 shadow-2xl relative flex flex-col text-neutral-200 md:border-x md:border-white/5">
      {/* Header */}
      <div className="px-4 py-4 bg-neutral-900/90 border-b border-rose-955/20 flex items-center gap-3 shrink-0 select-none">
        <button onClick={() => navigate(-1)} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="font-extrabold text-[#ffd700] text-sm uppercase tracking-wider font-display">
          REQUEST WITHDRAWAL
        </span>
      </div>

      <div className="flex-1 p-5 overflow-y-auto space-y-6 text-left">
        {/* Form */}
        <div className="bg-neutral-900/40 border border-rose-955/15 p-5 rounded-2xl space-y-4">
          <label className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">Amount (₹)</label>
          <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount" className="w-full bg-neutral-950 border border-rose-955/30 rounded-xl py-2 px-3 text-sm text-white focus:outline-none" />
          <label className="text-[10px] text-zinc-400 block font-bold uppercase tracking-wider">UPI ID</label>
          <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="example@upi" className="w-full bg-neutral-950 border border-rose-955/30 rounded-xl py-2 px-3 text-sm text-white focus:outline-none" />
          <button onClick={handleSubmit} disabled={submitting} className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="animate-spin" /> : 'Submit Withdraw Request'}
          </button>
        </div>

        {/* Errors / Success */}
        {error && (
          <div className="bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs p-4 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs p-4 rounded-xl flex items-center gap-3">
            <Check className="w-5 h-5" />
            <span>{success}</span>
          </div>
        )}

        {/* List of requests */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-amber-300">Your Withdraw Requests</h3>
          {loading ? (
            <div className="flex items-center gap-2 text-neutral-400"><Loader2 className="animate-spin" /> Loading...</div>
          ) : (
            requests.length === 0 ? (
              <p className="text-sm text-neutral-400">No withdraw requests yet.</p>
            ) : (
              <ul className="space-y-2">
                {requests.map((req) => (
                  <li key={req._id} className="bg-neutral-900/30 border border-rose-955/15 p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <span className="text-xs text-neutral-300">₹{req.amount}</span> • <span className="text-xs text-neutral-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                    {statusBadge(req.status)}
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </div>
    </div>
  );
}
