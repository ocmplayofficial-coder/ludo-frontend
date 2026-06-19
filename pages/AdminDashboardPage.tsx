// client/pages/AdminDashboardPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, LogOut, Check, X, Shield, Mail, Lock, User, 
  Calendar, Wallet, Search, ArrowUpDown, ChevronLeft, ChevronRight, Eye 
} from 'lucide-react';
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
    qrCode: string;
    type: string;
  };
}

interface WithdrawRequest {
  _id: string;
  userId: {
    _id: string;
    username: string;
    phoneNumber: string;
  } | string | null;
  username: string;
  email: string;
  method: 'UPI' | 'BANK';
  amount: number;
  accountHolderName: string;
  upiId?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  branchName?: string;
  mobileNumber?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface TPArena {
  id: string;
  gameType: 'teenpatti';
  mode: 'CLASSIC' | 'MUFLIS' | 'JOKER';
  entryFee: number;
  winningPrize: number;
  active: boolean;
  createdAt?: string;
}

interface TPLiveMatch {
  matchId: string;
  variant: 'CLASSIC' | 'MUFLIS' | 'JOKER';
  pot: number;
  entryFee: number;
  status: string;
  players: Array<{
    userId: string;
    username: string;
    avatar: string;
    seen: boolean;
    folded: boolean;
  }>;
}

interface TPMatchHistory {
  _id: string;
  matchId: string;
  variant: 'CLASSIC' | 'MUFLIS' | 'JOKER';
  entryFee: number;
  pot: number;
  players: Array<{
    userId: string;
    username: string;
    avatar: string;
    winnings: number;
    seen: boolean;
    folded: boolean;
  }>;
  winnerId?: string;
  winnerName?: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);

  // Active Menu: 'deposits' or 'withdrawals' or 'teenpatti'
  const [activeMenu, setActiveMenu] = useState<'deposits' | 'withdrawals' | 'teenpatti'>('deposits');

  // Deposit Requests State
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState<boolean>(false);
  const [depositActionLoadingId, setDepositActionLoadingId] = useState<string | null>(null);
  const [depositFilter, setDepositFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  // Withdrawal Requests State
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [loadingWithdraws, setLoadingWithdraws] = useState<boolean>(false);
  const [withdrawActionLoadingId, setWithdrawActionLoadingId] = useState<string | null>(null);
  const [withdrawFilter, setWithdrawFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [withdrawSearch, setWithdrawSearch] = useState<string>('');
  const [withdrawSortBy, setWithdrawSortBy] = useState<string>('-createdAt');
  const [withdrawPage, setWithdrawPage] = useState<number>(1);
  const [withdrawLimit] = useState<number>(5);
  const [withdrawPages, setWithdrawPages] = useState<number>(1);
  const [withdrawTotal, setWithdrawTotal] = useState<number>(0);

  // Teen Patti States
  const [tpSubMenu, setTpSubMenu] = useState<'stats' | 'arenas' | 'live' | 'history'>('stats');
  const [tpStats, setTpStats] = useState<{
    onlinePlayers: number;
    activeTables: number;
    totalBets: number;
    totalRevenue: number;
  } | null>(null);
  const [loadingTpStats, setLoadingTpStats] = useState<boolean>(false);

  const [tpArenas, setTpArenas] = useState<TPArena[]>([]);
  const [loadingTpArenas, setLoadingTpArenas] = useState<boolean>(false);

  const [tpLiveMatches, setTpLiveMatches] = useState<TPLiveMatch[]>([]);
  const [loadingTpLive, setLoadingTpLive] = useState<boolean>(false);

  const [tpHistory, setTpHistory] = useState<TPMatchHistory[]>([]);
  const [loadingTpHistory, setLoadingTpHistory] = useState<boolean>(false);

  // Arena Modal States
  const [arenaModalOpen, setArenaModalOpen] = useState<boolean>(false);
  const [editingArena, setEditingArena] = useState<TPArena | null>(null);
  const [arenaMode, setArenaMode] = useState<'CLASSIC' | 'MUFLIS' | 'JOKER'>('CLASSIC');
  const [arenaEntryFee, setArenaEntryFee] = useState<string>('');
  const [arenaWinningPrize, setArenaWinningPrize] = useState<string>('');
  const [arenaActive, setArenaActive] = useState<boolean>(true);
  const [arenaError, setArenaError] = useState<string | null>(null);
  const [arenaLoading, setArenaLoading] = useState<boolean>(false);

  // Detail & Rejection Modal States
  const [selectedWithdraw, setSelectedWithdraw] = useState<WithdrawRequest | null>(null);
  const [rejectionModalOpen, setRejectionModalOpen] = useState<boolean>(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionRemarks, setRejectionRemarks] = useState<string>('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  // Alerts
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const adminToken = localStorage.getItem("adminToken");

  useEffect(() => {
    if (adminToken) {
      setIsAdmin(true);
      fetchDepositRequests(adminToken);
      fetchWithdrawRequests(adminToken, 1);
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
        fetchWithdrawRequests(data.token, 1);
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
    setDepositRequests([]);
    setWithdrawRequests([]);
  };

  // ----------------------------------------------------------------
  // Teen Patti API Calls
  // ----------------------------------------------------------------
  const fetchTPStats = async (token: string) => {
    setLoadingTpStats(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/teenpatti/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTpStats({
          onlinePlayers: data.onlinePlayers,
          activeTables: data.activeTables,
          totalBets: data.totalBets,
          totalRevenue: data.totalRevenue
        });
      }
    } catch (err: any) {
      console.error("Error fetching TP stats:", err);
    } finally {
      setLoadingTpStats(false);
    }
  };

  const fetchTPArenas = async (token: string) => {
    setLoadingTpArenas(true);
    try {
      const res = await fetch(`${API_URL}/api/teenpatti/arenas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTpArenas(data.arenas || []);
      }
    } catch (err: any) {
      console.error("Error fetching TP arenas:", err);
    } finally {
      setLoadingTpArenas(false);
    }
  };

  const fetchTPLiveMatches = async (token: string) => {
    setLoadingTpLive(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/teenpatti/live-matches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTpLiveMatches(data.matches || []);
      }
    } catch (err: any) {
      console.error("Error fetching TP live matches:", err);
    } finally {
      setLoadingTpLive(false);
    }
  };

  const fetchTPHistory = async (token: string) => {
    setLoadingTpHistory(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/teenpatti/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTpHistory(data.history || []);
      }
    } catch (err: any) {
      console.error("Error fetching TP history:", err);
    } finally {
      setLoadingTpHistory(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token && activeMenu === 'teenpatti') {
      if (tpSubMenu === 'stats') fetchTPStats(token);
      if (tpSubMenu === 'arenas') fetchTPArenas(token);
      if (tpSubMenu === 'live') fetchTPLiveMatches(token);
      if (tpSubMenu === 'history') fetchTPHistory(token);
    }
  }, [activeMenu, tpSubMenu, adminToken]);

  const handleCreateOrEditArena = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    if (!arenaEntryFee || !arenaWinningPrize) {
      setArenaError("All fields are required");
      return;
    }

    setArenaLoading(true);
    setArenaError(null);

    const payload = {
      mode: arenaMode,
      entryFee: Number(arenaEntryFee),
      winningPrize: Number(arenaWinningPrize),
      active: arenaActive
    };

    try {
      const url = editingArena 
        ? `${API_URL}/api/admin/teenpatti/arenas/${editingArena.id}/edit`
        : `${API_URL}/api/admin/teenpatti/arenas/create`;
      const method = editingArena ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMsg({
          text: `Arena successfully ${editingArena ? 'updated' : 'created'}!`,
          type: 'success'
        });
        setArenaModalOpen(false);
        fetchTPArenas(token);
      } else {
        throw new Error(data.error || "Failed to process arena action");
      }
    } catch (err: any) {
      setArenaError(err.message || "Failed to save arena");
    } finally {
      setArenaLoading(false);
    }
  };

  const handleDeleteArena = async (arenaId: string) => {
    if (!window.confirm("Are you sure you want to delete this arena?")) return;
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/teenpatti/arenas/${arenaId}/delete`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMsg({ text: "Arena deleted successfully", type: 'success' });
        fetchTPArenas(token);
      } else {
        throw new Error(data.error || "Failed to delete arena");
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || "Delete failed", type: 'error' });
    }
  };

  const openCreateModal = () => {
    setEditingArena(null);
    setArenaMode('CLASSIC');
    setArenaEntryFee('');
    setArenaWinningPrize('');
    setArenaActive(true);
    setArenaError(null);
    setArenaModalOpen(true);
  };

  const openEditModal = (arena: TPArena) => {
    setEditingArena(arena);
    setArenaMode(arena.mode);
    setArenaEntryFee(arena.entryFee.toString());
    setArenaWinningPrize(arena.winningPrize.toString());
    setArenaActive(arena.active);
    setArenaError(null);
    setArenaModalOpen(true);
  };

  // ----------------------------------------------------------------
  // Deposits API Call
  // ----------------------------------------------------------------
  const fetchDepositRequests = async (token: string) => {
    setLoadingDeposits(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/deposit-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDepositRequests(data.depositRequests || []);
      } else {
        throw new Error(data.message || "Failed to load deposit requests");
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || "Error fetching deposits", type: 'error' });
    } finally {
      setLoadingDeposits(false);
    }
  };

  const handleDepositAction = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setDepositActionLoadingId(requestId);
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
        fetchDepositRequests(token);
      } else {
        throw new Error(data.message || `Failed to ${action.toLowerCase()} request`);
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || "Action failed", type: 'error' });
    } finally {
      setDepositActionLoadingId(null);
    }
  };

  // ----------------------------------------------------------------
  // Withdrawals API Call
  // ----------------------------------------------------------------
  const fetchWithdrawRequests = async (token: string, targetPage: number = withdrawPage, statusFilter = withdrawFilter, querySearch = withdrawSearch, sort = withdrawSortBy) => {
    setLoadingWithdraws(true);
    setFeedbackMsg(null);
    try {
      const queryParams = new URLSearchParams({
        status: statusFilter,
        search: querySearch,
        sortBy: sort,
        page: targetPage.toString(),
        limit: withdrawLimit.toString()
      });

      const res = await fetch(`${API_URL}/api/admin/withdraws?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWithdrawRequests(data.withdraws || []);
        setWithdrawPages(data.pagination?.pages || 1);
        setWithdrawPage(data.pagination?.page || 1);
        setWithdrawTotal(data.pagination?.total || 0);
      } else {
        throw new Error(data.message || "Failed to load withdraw requests");
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || "Error fetching withdrawals", type: 'error' });
    } finally {
      setLoadingWithdraws(false);
    }
  };

  const handleWithdrawApprove = async (id: string) => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    setWithdrawActionLoadingId(id);
    setFeedbackMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/withdraws/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMsg({
          text: `Withdraw request of ₹${data.withdraw.amount} was APPROVED successfully!`,
          type: 'success'
        });
        // Close modal if open
        setSelectedWithdraw(null);
        fetchWithdrawRequests(token);
      } else {
        throw new Error(data.message || "Failed to approve withdrawal request");
      }
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || "Action failed", type: 'error' });
    } finally {
      setWithdrawActionLoadingId(null);
    }
  };

  const handleWithdrawReject = async () => {
    const token = localStorage.getItem("adminToken");
    if (!token || !rejectingId) return;

    if (!rejectionRemarks.trim()) {
      setRejectionError("Please provide a reason/remarks for rejection.");
      return;
    }

    setWithdrawActionLoadingId(rejectingId);
    setRejectionError(null);
    setFeedbackMsg(null);

    try {
      const res = await fetch(`${API_URL}/api/admin/withdraws/${rejectingId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ remarks: rejectionRemarks })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMsg({
          text: `Withdraw request of ₹${data.withdraw.amount} was REJECTED with reason: ${rejectionRemarks}`,
          type: 'success'
        });
        setRejectionModalOpen(false);
        setRejectingId(null);
        setRejectionRemarks('');
        setSelectedWithdraw(null);
        fetchWithdrawRequests(token);
      } else {
        throw new Error(data.message || "Failed to reject withdrawal request");
      }
    } catch (err: any) {
      setRejectionError(err.message || "Action failed");
    } finally {
      setWithdrawActionLoadingId(null);
    }
  };

  const triggerRejectionModal = (id: string) => {
    setRejectingId(id);
    setRejectionRemarks('');
    setRejectionError(null);
    setRejectionModalOpen(true);
  };

  const toggleWithdrawSort = () => {
    const sort = withdrawSortBy === '-createdAt' ? 'createdAt' : '-createdAt';
    setWithdrawSortBy(sort);
    if (adminToken) fetchWithdrawRequests(adminToken, 1, withdrawFilter, withdrawSearch, sort);
  };

  const handleWithdrawFilterChange = (status: typeof withdrawFilter) => {
    setWithdrawFilter(status);
    if (adminToken) fetchWithdrawRequests(adminToken, 1, status, withdrawSearch, withdrawSortBy);
  };

  const handleWithdrawSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminToken) fetchWithdrawRequests(adminToken, 1, withdrawFilter, withdrawSearch, withdrawSortBy);
  };

  const handleWithdrawPageChange = (page: number) => {
    if (adminToken) fetchWithdrawRequests(adminToken, page, withdrawFilter, withdrawSearch, withdrawSortBy);
  };

  const filteredDeposits = depositRequests.filter(req => {
    if (depositFilter === 'ALL') return true;
    return req.status === depositFilter;
  });

  // Render Login state
  if (!isAdmin) {
    return (
      <div className="w-full max-w-[430px] mx-auto min-h-screen bg-gradient-to-b from-[#1c0000] via-[#100000] to-neutral-955 shadow-2xl relative flex flex-col text-neutral-200 md:border-x md:border-white/5 justify-center px-6">
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
                <X className="w-3.5 h-3.5 text-rose-455 shrink-0" />
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
    <div className="w-full max-w-[430px] mx-auto min-h-screen bg-gradient-to-b from-[#1c0000] via-[#100000] to-neutral-950 shadow-2xl relative flex flex-col text-neutral-200 md:border-x md:border-white/5 overflow-hidden">
      
      {/* Dynamic Header */}
      <div className="px-4 py-4 bg-neutral-900/90 border-b border-rose-955/20 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-400">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-[#ffd700] text-xs uppercase tracking-wider font-display">
            ADMIN PANEL
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="text-neutral-400 hover:text-rose-450 transition-colors cursor-pointer flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      {/* Tab Switcher - "Sidebar" Equivalent for mobile-responsive */}
      <div className="flex border-b border-rose-955/15 bg-neutral-950 select-none shrink-0 font-display">
        <button
          onClick={() => { setActiveMenu('deposits'); setFeedbackMsg(null); }}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer border-b-2 ${
            activeMenu === 'deposits' 
              ? 'border-amber-500 text-amber-400 bg-neutral-900/40' 
              : 'border-transparent text-zinc-500 hover:text-zinc-350'
          }`}
        >
          💰 Deposits
        </button>
        <button
          onClick={() => { setActiveMenu('withdrawals'); setFeedbackMsg(null); }}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer border-b-2 ${
            activeMenu === 'withdrawals' 
              ? 'border-amber-500 text-amber-400 bg-neutral-900/40' 
              : 'border-transparent text-zinc-500 hover:text-zinc-355'
          }`}
        >
          💸 Withdraws
        </button>
        <button
          onClick={() => { setActiveMenu('teenpatti'); setFeedbackMsg(null); }}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer border-b-2 ${
            activeMenu === 'teenpatti' 
              ? 'border-amber-500 text-amber-400 bg-neutral-900/40' 
              : 'border-transparent text-zinc-500 hover:text-zinc-355'
          }`}
        >
          🃏 Teen Patti
        </button>
      </div>

      {/* Main Panel Content Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {feedbackMsg && (
          <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs shadow-md text-left ${
            feedbackMsg.type === 'success' 
              ? 'bg-emerald-955/40 border-emerald-500/30 text-emerald-200' 
              : 'bg-rose-955/40 border-rose-500/30 text-rose-200'
          }`}>
            {feedbackMsg.type === 'success' ? <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <X className="w-4 h-4 text-rose-455 shrink-0 mt-0.5" />}
            <span className="font-semibold">{feedbackMsg.text}</span>
          </div>
        )}

        {/* -------------------- MENU 1: DEPOSITS -------------------- */}
        {activeMenu === 'deposits' && (
          <>
            {/* Filter Tabs */}
            <div className="grid grid-cols-4 gap-1.5 shrink-0">
              {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDepositFilter(t)}
                  className={`py-1.5 rounded-lg text-[8.5px] font-black tracking-wider transition-all cursor-pointer ${
                    depositFilter === t 
                      ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                      : 'bg-neutral-900/50 border border-rose-955/10 text-neutral-450 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {loadingDeposits ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-2">
                  <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider animate-pulse">Fetching deposit requests...</span>
                </div>
              ) : filteredDeposits.length === 0 ? (
                <div className="text-center py-20 bg-neutral-900/20 border border-dashed border-rose-955/10 rounded-2xl flex flex-col items-center justify-center p-6 space-y-2">
                  <Wallet className="w-9 h-9 text-zinc-650" />
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">No deposit requests found</span>
                </div>
              ) : (
                filteredDeposits.map((req) => (
                  <div
                    key={req._id}
                    className="bg-neutral-900/80 border border-rose-955/10 p-4 rounded-2xl space-y-3.5 shadow-lg flex flex-col text-left"
                  >
                    <div className="flex justify-between items-start border-b border-rose-955/5 pb-2.5">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-xs font-bold text-white">{req.user?.username || 'Unknown User'}</span>
                        </div>
                        <span className="text-[9px] text-zinc-500 font-mono block pl-5">{req.user?.phoneNumber || '-'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-amber-450 font-mono">₹{req.amount.toFixed(2)}</span>
                        <span className={`text-[8px] font-extrabold block px-1.5 py-0.5 rounded uppercase font-mono mt-0.5 tracking-wider text-center ${
                          req.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                          req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-455'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                    </div>

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

                    {req.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDepositAction(req._id, 'APPROVE')}
                          disabled={depositActionLoadingId !== null}
                          className="flex-1 py-2 bg-emerald-500 text-neutral-950 font-black rounded-xl text-[10px] uppercase tracking-wider shadow active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleDepositAction(req._id, 'REJECT')}
                          disabled={depositActionLoadingId !== null}
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
          </>
        )}

        {/* -------------------- MENU 2: WITHDRAWALS -------------------- */}
        {activeMenu === 'withdrawals' && (
          <>
            {/* Searching, Sorting, and Status Panel */}
            <div className="space-y-3.5 bg-neutral-900/40 border border-rose-955/10 p-4 rounded-2xl text-left">
              <form onSubmit={handleWithdrawSearch} className="flex gap-2">
                <div className="relative flex items-center flex-1">
                  <Search className="w-4 h-4 text-zinc-650 absolute left-3" />
                  <input
                    type="text"
                    value={withdrawSearch}
                    onChange={e => setWithdrawSearch(e.target.value)}
                    placeholder="Search username..."
                    className="w-full bg-neutral-950 border border-rose-955/15 focus:border-amber-500 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-700 focus:outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 bg-neutral-950 border border-rose-955/20 hover:border-amber-500 text-amber-450 hover:text-white rounded-xl text-[10px] uppercase font-black transition-colors cursor-pointer"
                >
                  Search
                </button>
              </form>

              <div className="flex justify-between items-center gap-2">
                {/* Sort Toggle Button */}
                <button
                  onClick={toggleWithdrawSort}
                  className="px-3 py-2 bg-neutral-950 border border-rose-955/15 rounded-xl text-[9px] text-zinc-450 font-black uppercase hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <ArrowUpDown className="w-3 h-3 text-amber-550" />
                  Date {withdrawSortBy === '-createdAt' ? 'Newest' : 'Oldest'}
                </button>

                {/* Status Selection Switcher */}
                <select
                  value={withdrawFilter}
                  onChange={(e) => handleWithdrawFilterChange(e.target.value as any)}
                  className="bg-neutral-950 border border-rose-955/15 rounded-xl px-3 py-2 text-[9px] text-[#ffd700] font-black focus:outline-none uppercase shrink-0"
                >
                  <option value="PENDING">PENDING STATUS</option>
                  <option value="APPROVED">APPROVED STATUS</option>
                  <option value="REJECTED">REJECTED STATUS</option>
                  <option value="ALL">ALL STATUSES</option>
                </select>
              </div>
            </div>

            {/* Withdraw Requests List */}
            <div className="space-y-3">
              {loadingWithdraws ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-2">
                  <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider animate-pulse">Fetching withdraw requests...</span>
                </div>
              ) : withdrawRequests.length === 0 ? (
                <div className="text-center py-20 bg-neutral-900/20 border border-dashed border-rose-955/10 rounded-2xl flex flex-col items-center justify-center p-6 space-y-2">
                  <Wallet className="w-9 h-9 text-zinc-650" />
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">No withdrawal requests found</span>
                  <p className="text-[9px] text-zinc-650">No requests match selected filters.</p>
                </div>
              ) : (
                withdrawRequests.map((req) => (
                  <div
                    key={req._id}
                    className="bg-neutral-900/80 border border-rose-955/10 p-4 rounded-2xl space-y-3 shadow-lg flex flex-col text-left transition-all hover:border-rose-950/40"
                  >
                    {/* Header Row */}
                    <div className="flex justify-between items-start border-b border-rose-955/5 pb-2">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block leading-none">{req.method} Method</span>
                        <h4 className="text-xs font-black text-white pt-1">{req.username}</h4>
                        <span className="text-[8.5px] text-zinc-500 block font-mono">
                          {req.email || '-'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-black text-amber-450 font-mono">₹{req.amount.toFixed(2)}</span>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase font-mono tracking-wider ml-1 mt-1 ${
                          req.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                          req.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-455'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                    </div>

                    {/* Details Row */}
                    <div className="flex justify-between items-center text-[9px] text-zinc-400 font-medium">
                      <span>Requested: {new Date(req.createdAt).toLocaleDateString('en-IN')}</span>
                      
                      {/* View Details Button */}
                      <button
                        onClick={() => setSelectedWithdraw(req)}
                        className="px-2 py-1 bg-neutral-950 border border-rose-955/15 hover:border-[#ffd700] text-[#ffd700] rounded-lg font-bold uppercase text-[8px] flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        View Details
                      </button>
                    </div>

                    {/* Action buttons */}
                    {req.status === 'PENDING' && (
                      <div className="flex gap-2 pt-1 border-t border-rose-955/5">
                        <button
                          onClick={() => handleWithdrawApprove(req._id)}
                          disabled={withdrawActionLoadingId !== null}
                          className="flex-1 py-2 bg-emerald-500 text-neutral-950 font-black rounded-xl text-[10px] uppercase tracking-wider shadow active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          Approve
                        </button>
                        <button
                          onClick={() => triggerRejectionModal(req._id)}
                          disabled={withdrawActionLoadingId !== null}
                          className="flex-1 py-2 bg-rose-500 text-white font-black rounded-xl text-[10px] uppercase tracking-wider shadow active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
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

            {/* Pagination Controls */}
            {withdrawPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-rose-955/5 select-none text-left shrink-0">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider font-mono">
                  Showing {withdrawRequests.length} of {withdrawTotal} requests
                </span>
                
                <div className="flex gap-1.5">
                  <button
                    disabled={withdrawPage === 1}
                    onClick={() => handleWithdrawPageChange(withdrawPage - 1)}
                    className="p-1.5 bg-neutral-900 border border-rose-955/15 hover:border-amber-500 rounded-lg text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="px-3 py-1 bg-neutral-950 border border-rose-955/15 rounded-lg text-[10px] font-extrabold text-amber-450 font-mono">
                    {withdrawPage} / {withdrawPages}
                  </span>

                  <button
                    disabled={withdrawPage === withdrawPages}
                    onClick={() => handleWithdrawPageChange(withdrawPage + 1)}
                    className="p-1.5 bg-neutral-900 border border-rose-955/15 hover:border-amber-500 rounded-lg text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* -------------------- MENU 3: TEEN PATTI -------------------- */}
        {activeMenu === 'teenpatti' && (
          <>
            {/* Teen Patti Sub-Menu Tabs */}
            <div className="grid grid-cols-4 gap-1.5 shrink-0 bg-neutral-950 p-1 rounded-xl border border-rose-955/10">
              {(['stats', 'arenas', 'live', 'history'] as const).map((sub) => (
                <button
                  key={sub}
                  onClick={() => setTpSubMenu(sub)}
                  className={`py-1.5 rounded-lg text-[9px] font-black tracking-wider transition-all cursor-pointer uppercase ${
                    tpSubMenu === sub 
                      ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {sub === 'live' ? '🔴 Live' : sub}
                </button>
              ))}
            </div>

            {/* 1. Stats View */}
            {tpSubMenu === 'stats' && (
              <div className="space-y-4">
                {loadingTpStats ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-2">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider animate-pulse">Loading stats...</span>
                  </div>
                ) : tpStats ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-neutral-900/80 border border-rose-955/10 p-4 rounded-2xl flex flex-col justify-between shadow-lg text-left">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Players Online</span>
                      <span className="text-2xl font-black text-white mt-2 font-mono">{tpStats.onlinePlayers}</span>
                    </div>
                    <div className="bg-neutral-900/80 border border-rose-955/10 p-4 rounded-2xl flex flex-col justify-between shadow-lg text-left">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Active Tables</span>
                      <span className="text-2xl font-black text-white mt-2 font-mono">{tpStats.activeTables}</span>
                    </div>
                    <div className="bg-neutral-900/80 border border-rose-955/10 p-4 rounded-2xl flex flex-col justify-between shadow-lg text-left">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Total Bets</span>
                      <span className="text-2xl font-black text-amber-500 mt-2 font-mono">₹{tpStats.totalBets}</span>
                    </div>
                    <div className="bg-neutral-900/80 border border-rose-955/10 p-4 rounded-2xl flex flex-col justify-between shadow-lg text-left">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Est. Revenue</span>
                      <span className="text-2xl font-black text-emerald-400 mt-2 font-mono">₹{tpStats.totalRevenue}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 text-zinc-550 font-bold uppercase tracking-wider text-xs">Failed to load statistics</div>
                )}
              </div>
            )}

            {/* 2. Arenas View */}
            {tpSubMenu === 'arenas' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Arenas ({tpArenas.length})</span>
                  <button
                    onClick={openCreateModal}
                    className="px-3 py-1.5 bg-amber-500 text-neutral-950 font-black rounded-lg text-[9px] uppercase tracking-wider shadow active:scale-98 transition-all cursor-pointer flex items-center gap-1"
                  >
                    + Create Arena
                  </button>
                </div>

                {loadingTpArenas ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-2">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider animate-pulse">Loading arenas...</span>
                  </div>
                ) : tpArenas.length === 0 ? (
                  <div className="text-center py-20 bg-neutral-900/20 border border-dashed border-rose-955/10 rounded-2xl flex flex-col items-center justify-center p-6 space-y-2">
                    <span className="text-xs text-zinc-550 font-bold uppercase tracking-wider">No arenas found</span>
                    <p className="text-[9px] text-zinc-650">Create one above or visit lobby to trigger auto-seeding.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tpArenas.map((arena) => (
                      <div
                        key={arena.id}
                        className="bg-neutral-900/80 border border-rose-955/10 p-3 rounded-2xl flex items-center justify-between shadow-lg text-left"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase font-mono ${
                              arena.mode === 'CLASSIC' ? 'bg-amber-500/10 text-amber-400' :
                              arena.mode === 'MUFLIS' ? 'bg-rose-500/10 text-rose-400' : 'bg-purple-500/10 text-purple-400'
                            }`}>
                              {arena.mode}
                            </span>
                            <span className={`text-[8px] font-bold ${arena.active ? 'text-emerald-400' : 'text-zinc-500'}`}>
                              ● {arena.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="flex gap-4 mt-1">
                            <div>
                              <span className="text-[8px] text-zinc-550 block font-bold uppercase leading-none">ENTRY FEE:</span>
                              <span className="font-mono font-bold text-white text-[11px]">₹{arena.entryFee}</span>
                            </div>
                            <div>
                              <span className="text-[8px] text-zinc-550 block font-bold uppercase leading-none">PRIZE:</span>
                              <span className="font-mono font-bold text-amber-500 text-[11px]">₹{arena.winningPrize}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-1.5">
                          <button
                            onClick={() => openEditModal(arena)}
                            className="px-2 py-1 bg-neutral-950 border border-rose-955/20 hover:border-amber-500 text-amber-500 hover:text-white rounded-lg text-[9px] font-bold uppercase cursor-pointer transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteArena(arena.id)}
                            className="px-2 py-1 bg-neutral-955 border border-rose-955/20 hover:bg-rose-950 hover:border-rose-500 text-rose-455 hover:text-white rounded-lg text-[9px] font-bold uppercase cursor-pointer transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Live Matches View */}
            {tpSubMenu === 'live' && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-white uppercase tracking-wider block text-left">Live Matches ({tpLiveMatches.length})</span>

                {loadingTpLive ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-2">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider animate-pulse">Fetching live matches...</span>
                  </div>
                ) : tpLiveMatches.length === 0 ? (
                  <div className="text-center py-20 bg-neutral-900/20 border border-dashed border-rose-955/10 rounded-2xl flex flex-col items-center justify-center p-6 space-y-2">
                    <span className="text-xs text-zinc-550 font-bold uppercase tracking-wider">No active matches at the moment</span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {tpLiveMatches.map((match) => (
                      <div
                        key={match.matchId}
                        className="bg-neutral-900/80 border border-rose-955/10 p-3.5 rounded-2xl space-y-2.5 shadow-lg text-left"
                      >
                        <div className="flex justify-between items-start border-b border-rose-955/5 pb-2">
                          <div>
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block leading-none">{match.variant}</span>
                            <span className="text-[8px] text-zinc-500 block font-mono mt-1">ID: {match.matchId}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] text-zinc-550 block font-bold uppercase leading-none">CURRENT POT</span>
                            <span className="text-sm font-black text-white font-mono">₹{match.pot}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          {match.players && match.players.map((p, idx) => (
                            <div key={idx} className="bg-neutral-950/40 p-2 rounded-xl border border-rose-955/5 flex flex-col">
                              <span className="text-white font-bold truncate">{p.username || 'Waiting Player'}</span>
                              <div className="flex gap-1.5 mt-1 text-[8px] uppercase font-bold">
                                <span className={p.folded ? 'text-rose-455' : 'text-emerald-400'}>
                                  {p.folded ? 'Folded' : 'Active'}
                                </span>
                                <span className="text-zinc-500">|</span>
                                <span className="text-amber-500">
                                  {p.seen ? 'Seen' : 'Blind'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. Match History View */}
            {tpSubMenu === 'history' && (
              <div className="space-y-4">
                <span className="text-xs font-bold text-white uppercase tracking-wider block text-left">Match History ({tpHistory.length})</span>

                {loadingTpHistory ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-2">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[10px] text-zinc-555 font-bold uppercase tracking-wider animate-pulse">Loading history...</span>
                  </div>
                ) : tpHistory.length === 0 ? (
                  <div className="text-center py-20 bg-neutral-900/20 border border-dashed border-rose-955/10 rounded-2xl flex flex-col items-center justify-center p-6 space-y-2">
                    <span className="text-xs text-zinc-550 font-bold uppercase tracking-wider">No completed matches found</span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {tpHistory.map((match) => (
                      <div
                        key={match._id}
                        className="bg-neutral-900/80 border border-rose-955/10 p-3.5 rounded-2xl space-y-2 shadow-lg text-left"
                      >
                        <div className="flex justify-between items-start border-b border-rose-955/5 pb-2">
                          <div>
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block leading-none">{match.variant}</span>
                            <span className="text-[8px] text-zinc-550 block mt-1">
                              Pot: <span className="font-mono text-white font-bold">₹{match.pot}</span> (Fee: ₹{match.entryFee})
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] text-zinc-555 block font-bold uppercase leading-none">WINNER</span>
                            <span className="text-xs font-black text-emerald-400 block">{match.winnerName || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[9px] text-zinc-400 font-medium">
                          <span>Players: {match.players?.map(p => p.username).join(' vs ') || 'Unknown'}</span>
                          <span className="font-mono">{new Date(match.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* -------------------- VIEW DETAILS MODAL -------------------- */}
      {selectedWithdraw && (
        <div className="absolute inset-0 bg-neutral-950/90 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="w-full max-w-xs rounded-2xl bg-[#220d0d] border border-rose-955/40 p-5 space-y-4 shadow-2xl text-left my-auto">
            
            <div className="flex items-center justify-between border-b border-rose-955/10 pb-2">
              <span className="text-xs font-black text-[#ffd700] uppercase tracking-wider flex items-center gap-1.5">
                👁 Withdrawal Details
              </span>
              <button 
                onClick={() => setSelectedWithdraw(null)} 
                className="text-zinc-500 hover:text-white cursor-pointer p-0.5 transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-zinc-300">
              <div className="grid grid-cols-2 gap-2 bg-neutral-950/40 p-2.5 rounded-xl border border-rose-955/5">
                <div>
                  <span className="text-[8px] text-zinc-550 block font-bold uppercase leading-none">USER NAME:</span>
                  <span className="font-bold text-white pt-1 block">{selectedWithdraw.username}</span>
                </div>
                <div>
                  <span className="text-[8px] text-zinc-550 block font-bold uppercase leading-none">USER ID:</span>
                  <span className="font-mono text-zinc-400 pt-1 block truncate">
                    {typeof selectedWithdraw.userId === 'object' && selectedWithdraw.userId ? (selectedWithdraw.userId as any)._id : String(selectedWithdraw.userId)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-neutral-950/40 p-2.5 rounded-xl border border-rose-955/5">
                <div>
                  <span className="text-[8px] text-zinc-550 block font-bold uppercase leading-none">METHOD:</span>
                  <span className="font-bold text-amber-450 pt-1 block uppercase">{selectedWithdraw.method}</span>
                </div>
                <div>
                  <span className="text-[8px] text-zinc-550 block font-bold uppercase leading-none">AMOUNT:</span>
                  <span className="font-black text-white pt-1 block font-mono text-sm">₹{selectedWithdraw.amount.toFixed(2)}</span>
                </div>
              </div>

              {/* UPI Details */}
              {selectedWithdraw.method === 'UPI' ? (
                <div className="bg-neutral-950/45 p-3 rounded-xl border border-rose-955/10 space-y-2">
                  <div>
                    <span className="text-[8px] text-zinc-550 block font-bold uppercase leading-none">ACCOUNT HOLDER NAME:</span>
                    <span className="font-semibold text-white pt-1 block">{selectedWithdraw.accountHolderName}</span>
                  </div>
                  <div>
                    <span className="text-[8px] text-zinc-550 block font-bold uppercase leading-none">UPI ID:</span>
                    <span className="font-mono font-bold text-amber-400 pt-1 block break-all">{selectedWithdraw.upiId}</span>
                  </div>
                </div>
              ) : (
                /* Bank Details */
                <div className="bg-neutral-950/45 p-3 rounded-xl border border-rose-955/10 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[8px] text-zinc-550 block font-bold uppercase leading-none">HOLDER NAME:</span>
                      <span className="font-semibold text-white pt-0.5 block truncate">{selectedWithdraw.accountHolderName}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-zinc-550 block font-bold uppercase leading-none">MOBILE NO:</span>
                      <span className="font-mono text-white pt-0.5 block">{selectedWithdraw.mobileNumber || '-'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[8px] text-zinc-550 block font-bold uppercase leading-none">ACCOUNT NUMBER:</span>
                    <span className="font-mono font-bold text-white pt-0.5 block break-all">{selectedWithdraw.accountNumber}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-rose-955/5 pt-2">
                    <div>
                      <span className="text-[8px] text-zinc-550 block font-bold uppercase leading-none">IFSC CODE:</span>
                      <span className="font-mono font-bold text-amber-450 pt-0.5 block uppercase">{selectedWithdraw.ifscCode}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-zinc-550 block font-bold uppercase leading-none">BANK NAME:</span>
                      <span className="font-semibold text-white pt-0.5 block truncate">{selectedWithdraw.bankName}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[8px] text-zinc-550 block font-bold uppercase leading-none">BRANCH NAME:</span>
                    <span className="font-semibold text-zinc-300 pt-0.5 block">{selectedWithdraw.branchName}</span>
                  </div>
                </div>
              )}

              <div className="bg-neutral-955 p-2.5 rounded-xl border border-rose-955/5 text-[10px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-bold">STATUS:</span>
                  <span className="font-mono font-bold">{selectedWithdraw.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-bold">DATE REQUESTED:</span>
                  <span className="font-mono text-zinc-400">
                    {new Date(selectedWithdraw.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                {selectedWithdraw.status === 'REJECTED' && (
                  <div className="border-t border-rose-955/5 pt-1 mt-1 text-left">
                    <span className="text-rose-455 font-bold block uppercase text-[8px] leading-none">REJECTION REASON:</span>
                    <span className="text-rose-200 text-[10px] leading-relaxed block mt-1 italic">
                      "{selectedWithdraw.remarks}"
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions inside Details Modal if Pending */}
            {selectedWithdraw.status === 'PENDING' && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleWithdrawApprove(selectedWithdraw._id)}
                  disabled={withdrawActionLoadingId !== null}
                  className="flex-1 py-2 bg-emerald-500 text-neutral-950 font-black rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-3 h-3 stroke-[3]" /> Approve
                </button>
                <button
                  onClick={() => triggerRejectionModal(selectedWithdraw._id)}
                  disabled={withdrawActionLoadingId !== null}
                  className="flex-1 py-2 bg-rose-500 text-white font-black rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <X className="w-3 h-3 stroke-[3]" /> Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------- REJECTION REMARKS MODAL -------------------- */}
      {rejectionModalOpen && (
        <div className="absolute inset-0 bg-neutral-955/95 flex items-center justify-center p-4 z-55">
          <div className="w-full max-w-xs rounded-2xl bg-[#220d0d] border border-rose-500/35 p-5 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-rose-500/10 pb-2">
              <span className="text-xs font-black text-rose-400 uppercase tracking-wider">
                🚫 Reject Request
              </span>
              <button 
                onClick={() => { setRejectionModalOpen(false); setRejectingId(null); }} 
                className="text-zinc-500 hover:text-white cursor-pointer p-0.5 transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] text-zinc-400 leading-normal">
                Please enter the reason for rejecting this withdrawal request. This remark will be displayed to the user on their withdrawal history page.
              </p>

              <div className="space-y-1">
                <label className="text-[8px] text-zinc-500 block font-bold">REJECTION REASON</label>
                <textarea
                  rows={3}
                  value={rejectionRemarks}
                  onChange={e => setRejectionRemarks(e.target.value)}
                  placeholder="E.g. Invalid UPI ID / Incorrect IFSC Code"
                  className="w-full bg-neutral-950 border border-rose-955/20 focus:border-rose-500 rounded-xl py-2 px-3 text-xs text-white placeholder-zinc-700 focus:outline-none transition-colors resize-none leading-relaxed"
                />
              </div>

              {rejectionError && (
                <div className="text-[9px] text-rose-400 font-semibold italic">
                  * {rejectionError}
                </div>
              )}
            </div>

            <button
              onClick={handleWithdrawReject}
              disabled={withdrawActionLoadingId !== null}
              className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition-all active:scale-98"
            >
              Confirm Rejection
            </button>
          </div>
        </div>
      )}

      {/* -------------------- CREATE/EDIT ARENA MODAL -------------------- */}
      {arenaModalOpen && (
        <div className="absolute inset-0 bg-neutral-955/95 flex items-center justify-center p-4 z-55">
          <div className="w-full max-w-xs rounded-2xl bg-[#220d0d] border border-rose-500/35 p-5 space-y-4 shadow-2xl text-left my-auto">
            <div className="flex items-center justify-between border-b border-rose-500/10 pb-2">
              <span className="text-xs font-black text-[#ffd700] uppercase tracking-wider">
                {editingArena ? '📝 Edit Arena' : '✨ Create TPArena'}
              </span>
              <button 
                onClick={() => setArenaModalOpen(false)} 
                className="text-zinc-500 hover:text-white cursor-pointer p-0.5 transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrEditArena} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[8px] text-zinc-550 block font-bold">VARIANT MODE</label>
                <select
                  value={arenaMode}
                  onChange={e => setArenaMode(e.target.value as any)}
                  className="w-full bg-neutral-950 border border-rose-955/20 focus:border-amber-500 rounded-xl py-2 px-3 text-xs text-white uppercase focus:outline-none"
                >
                  <option value="CLASSIC">CLASSIC</option>
                  <option value="MUFLIS">MUFLIS</option>
                  <option value="JOKER">JOKER</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] text-zinc-550 block font-bold">ENTRY FEE (₹)</label>
                <input
                  type="number"
                  value={arenaEntryFee}
                  onChange={e => setArenaEntryFee(e.target.value)}
                  placeholder="e.g. 100"
                  required
                  className="w-full bg-neutral-950 border border-rose-955/20 focus:border-amber-500 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] text-zinc-550 block font-bold">WINNING PRIZE (₹)</label>
                <input
                  type="number"
                  value={arenaWinningPrize}
                  onChange={e => setArenaWinningPrize(e.target.value)}
                  placeholder="e.g. 180"
                  required
                  className="w-full bg-neutral-950 border border-rose-955/20 focus:border-amber-500 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="arenaActive"
                  checked={arenaActive}
                  onChange={e => setArenaActive(e.target.checked)}
                  className="rounded border-rose-955/20 text-amber-500 focus:ring-amber-500 bg-neutral-950"
                />
                <label htmlFor="arenaActive" className="text-[10px] text-zinc-400 font-bold select-none cursor-pointer">
                  Active in Lobby
                </label>
              </div>

              {arenaError && (
                <div className="text-[9px] text-rose-400 font-semibold italic">
                  * {arenaError}
                </div>
              )}

              <button
                type="submit"
                disabled={arenaLoading}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                {arenaLoading ? 'Saving...' : editingArena ? 'Update Arena' : 'Create Arena'}
              </button>
            </form>
          </div>
        </div>
      )}

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
