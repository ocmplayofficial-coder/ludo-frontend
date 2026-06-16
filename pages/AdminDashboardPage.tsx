import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Check, X, Shield, Mail, Lock, User, Calendar, Wallet } from 'lucide-react';
import { API_URL } from '../src/config';

interface DepositRequest {
  _id: string;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  user: {
    _id: string;
    username: string;
    phoneNumber: string;
  };
  paymentMethod: {
    _id: string;
    upiId: string;
    qrImage: string;
    type: string;
  };
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  // Dashboard state
  const [requests, setRequests] = useState<DepositRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const adminToken = localStorage.getItem("adminToken");

  useEffect(() => {
    if (adminToken) {
      setIsAdmin(true);
      fetchDepositRequests(adminToken);
    }
  }, [adminToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("adminToken", data.token);
        setIsAdmin(true);
        fetchDepositRequests(data.token);
      } else {
        throw new Error(data.error || "Login failed. Check your admin credentials.");
      }
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsAdmin(false);
    setRequests([]);
  };

  const fetchDepositRequests = async (token: string) => {
    setLoadingRequests(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/deposit-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests(data.depositRequests || []);
      } else {
        throw new Error(data.message || "Failed to load deposit requests");
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || "Error fetching requests", type: 'error' });
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleAction = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setActionLoadingId(requestId);
    setFeedbackMsg(null);

    try {
      const res = await fetch(`${API_URL}/api/admin/deposit-requests/${requestId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMsg({
          text: `Deposit request of ₹${data.depositRequest.amount} was successfully ${action === 'APPROVE' ? 'APPROVED' : 'REJECTED'}.`,
          type: 'success'
        });
        // Refresh local requests list
        fetchDepositRequests(token);
      } else {
        throw new Error(data.message || `Failed to ${action.toLowerCase()} request`);
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || "Action failed", type: 'error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'ALL') return true;
    return req.status === filter;
  });

  // Render Login state
  if (!isAdmin) {
    return (
      <div className="w-full max-w-[430px] mx-auto min-h-screen bg-gradient-to-b from-[#1c0000] via-[#100000] to-neutral-950 shadow-2xl relative flex flex-col text-neutral-200 md:border-x md:border-white/5 justify-center px-6">
        <div className="bg-neutral-900/80 border border-rose-955/20 p-6 rounded-3xl space-y-6 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col items-center space-y-2">
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black tracking-widest text-white uppercase font-display">ADMIN PANEL</h2>
            <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Access authorized personnel only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">ADMIN EMAIL</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-zinc-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@ocmplay.com"
                  required
                  className="w-full bg-neutral-950 border border-rose-955/30 rounded-xl py-3 pl-11 pr-4 text-xs font-semibold text-white outline-none focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">PASSWORD</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-zinc-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-neutral-950 border border-rose-955/30 rounded-xl py-3 pl-11 pr-4 text-xs font-semibold text-white outline-none focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            {loginError && (
              <div className="bg-rose-950/40 border border-rose-500/30 text-rose-200 text-[10px] p-3 rounded-xl flex items-center gap-2">
                <X className="w-3.5 h-3.5 text-rose-450 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-neutral-950 font-black rounded-xl text-xs uppercase tracking-widest shadow-lg active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {loginLoading ? 'Authenticating...' : 'LOG IN TO ADMIN'}
            </button>
          </form>

          <button
            onClick={() => navigate('/')}
            className="text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer block mx-auto font-bold uppercase tracking-wider"
          >
            Back to Game Lobby
          </button>
        </div>
      </div>
    );
  }

  // Render Admin Dashboard
  return (
    <div className="w-full max-w-[430px] mx-auto min-h-screen bg-gradient-to-b from-[#1c0000] via-[#100000] to-neutral-950 shadow-2xl relative flex flex-col text-neutral-200 md:border-x md:border-white/5">
      {/* Header */}
      <div className="px-4 py-4 bg-neutral-900/90 border-b border-rose-955/20 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-400">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-[#ffd700] text-xs uppercase tracking-wider font-display">
            ADMIN DEPOSITS
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="p-3 bg-neutral-900/40 border-b border-rose-955/10 grid grid-cols-4 gap-1.5 shrink-0">
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`py-1.5 rounded-lg text-[9px] font-bold tracking-wider transition-all cursor-pointer ${
              filter === t 
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'bg-neutral-900/50 border border-rose-955/10 text-neutral-400 hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Main Request list */}
      <div className="flex-grow p-4 overflow-y-auto space-y-3.5">
        {feedbackMsg && (
          <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs shadow-md ${
            feedbackMsg.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' 
              : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
          }`}>
            {feedbackMsg.type === 'success' ? <Check className="w-4 h-4 text-emerald-400" /> : <X className="w-4 h-4 text-rose-400" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {loadingRequests ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-2">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider animate-pulse">Fetching deposit requests...</span>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-20 bg-neutral-900/20 border border-dashed border-rose-955/10 rounded-2xl flex flex-col items-center justify-center p-6 space-y-2">
            <Wallet className="w-10 h-10 text-zinc-650" />
            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">No deposit requests found</span>
            <span className="text-[10px] text-zinc-650 font-medium">All requests for this filter type have been cleared.</span>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req._id}
              className="bg-neutral-900/80 border border-rose-955/10 p-4 rounded-2xl space-y-3.5 shadow-lg flex flex-col text-left"
            >
              {/* User details & Amount */}
              <div className="flex justify-between items-start border-b border-rose-955/5 pb-2.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-bold text-white">{req.user?.username || 'Unknown User'}</span>
                  </div>
                  <span className="text-[9px] text-zinc-500 font-mono block pl-5">{req.user?.phoneNumber || '-'}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-amber-400 font-mono">₹{req.amount.toFixed(2)}</span>
                  <span className={`text-[8px] font-extrabold block px-1 py-0.5 rounded uppercase font-mono mt-0.5 tracking-wider ${
                    req.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                    req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {req.status}
                  </span>
                </div>
              </div>

              {/* Payment Method Details & Date */}
              <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 font-medium bg-neutral-950/40 p-2.5 rounded-xl border border-rose-955/5">
                <div>
                  <span className="text-[8px] text-zinc-600 block uppercase tracking-wider">UPI ID</span>
                  <span className="font-mono text-white break-all">{req.paymentMethod?.upiId || 'Direct / Unknown'}</span>
                </div>
                <div>
                  <span className="text-[8px] text-zinc-600 block uppercase tracking-wider">REQUESTED AT</span>
                  <span className="flex items-center gap-1 mt-0.5 font-mono text-white">
                    <Calendar className="w-3 h-3 text-zinc-500" />
                    {new Date(req.createdAt).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {req.status === 'PENDING' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(req._id, 'APPROVE')}
                    disabled={actionLoadingId !== null}
                    className="flex-1 py-2 bg-emerald-500 text-neutral-950 font-black rounded-xl text-[10px] uppercase tracking-wider shadow active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(req._id, 'REJECT')}
                    disabled={actionLoadingId !== null}
                    className="flex-1 py-2 bg-rose-500 text-white font-black rounded-xl text-[10px] uppercase tracking-wider shadow active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5 stroke-[3]" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Back button */}
      <div className="p-4 bg-neutral-900/50 border-t border-rose-955/10 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="w-full py-3 bg-neutral-900 border border-rose-955/20 text-neutral-350 hover:text-white font-bold rounded-xl text-[10px] uppercase tracking-wider shadow transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Lobby
        </button>
      </div>
    </div>
  );
}
