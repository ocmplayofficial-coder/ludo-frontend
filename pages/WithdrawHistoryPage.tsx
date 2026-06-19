// client/pages/WithdrawHistoryPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Landmark, CreditCard, AlertTriangle, Loader2 } from 'lucide-react';
import { API_URL } from '../src/config';

interface WithdrawRequest {
  _id: string;
  method: 'UPI' | 'BANK';
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  upiId?: string;
  accountNumber?: string;
  bankName?: string;
  remarks?: string;
  createdAt: string;
}

export default function WithdrawHistoryPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');

  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/withdraw/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.withdraws || []);
      } else {
        throw new Error(data.message || 'Failed to load history.');
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [token]);

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-amber-500/10 border border-amber-500/35 text-amber-400',
      APPROVED: 'bg-emerald-500/10 border border-emerald-500/35 text-emerald-400',
      REJECTED: 'bg-rose-500/10 border border-rose-500/35 text-rose-450'
    };
    return (
      <span className={`px-2 py-0.5 text-[8.5px] font-extrabold rounded-md uppercase tracking-wider ${colors[status] || 'bg-neutral-800 text-zinc-400'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="w-full max-w-[430px] mx-auto min-h-screen bg-gradient-to-b from-[#1a0000] via-[#100000] to-neutral-955 shadow-2xl relative flex flex-col text-neutral-200 md:border-x md:border-white/5">
      {/* Header */}
      <div className="px-4 py-4 bg-neutral-900/90 border-b border-rose-955/20 flex items-center gap-3 shrink-0 select-none">
        <button onClick={() => navigate(-1)} className="text-neutral-450 hover:text-white transition-colors cursor-pointer p-1">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-extrabold text-[#ffd700] text-xs uppercase tracking-wider font-display">
          Withdrawal History
        </span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-left pb-10">
        {error && (
          <div className="bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-450 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-2">
            <Loader2 className="animate-spin text-amber-500 w-8 h-8" />
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Loading history...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 bg-neutral-900/20 border border-dashed border-rose-955/10 rounded-2xl flex flex-col items-center justify-center p-6 space-y-2">
            <div className="w-12 h-12 rounded-full bg-neutral-950 border border-rose-955/20 flex items-center justify-center text-zinc-650">
              <Landmark className="w-6 h-6" />
            </div>
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">No withdrawal requests found</span>
            <p className="text-[9px] text-zinc-650 font-medium">Your withdrawal requests will appear here once submitted.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div 
                key={req._id}
                className="bg-neutral-900/50 border border-rose-955/10 p-3.5 rounded-2xl space-y-3 shadow-md"
              >
                {/* Method & Amount */}
                <div className="flex justify-between items-center border-b border-rose-955/5 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-neutral-950 border border-rose-955/15 rounded-lg flex items-center justify-center text-zinc-400">
                      {req.method === 'UPI' ? <CreditCard className="w-4 h-4 text-amber-500/80" /> : <Landmark className="w-4 h-4 text-amber-500/80" />}
                    </div>
                    <div>
                      <span className="text-xs font-black text-white leading-none block">{req.method} Withdrawal</span>
                      <span className="text-[8.5px] text-zinc-500 leading-none mt-0.5 block font-mono">
                        {req.method === 'UPI' 
                          ? req.upiId 
                          : `${req.bankName} (...${req.accountNumber?.slice(-4)})`}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-[#ffd700] font-mono block">₹{req.amount.toFixed(2)}</span>
                    <span className="text-[8px] text-zinc-500 block font-mono mt-0.5">
                      {new Date(req.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Status and remarks */}
                <div className="flex justify-between items-center">
                  {getStatusBadge(req.status)}
                  
                  {req.status === 'REJECTED' && req.remarks && (
                    <span className="text-[8px] text-rose-300 font-semibold italic max-w-[240px] truncate text-right">
                      Reason: {req.remarks}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
