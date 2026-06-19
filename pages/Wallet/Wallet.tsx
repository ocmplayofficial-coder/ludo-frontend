import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, RotateCcw, Wallet as WalletIcon } from 'lucide-react';
import type { User, Transaction } from '../../src/types';

interface WalletProps {
  walletData: {
    walletBalance: number;
    depositCash: number;
    winningCash: number;
    withdrawableBalance: number;
  } | null;
  walletLoading: boolean;
  walletError: string | null;
  userProfile: User | null;
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  searchTxnQuery: string;
  setSearchTxnQuery: (val: string) => void;
  selectedTxnType: string;
  setSelectedTxnType: (val: string) => void;
  setAddCashAmount: (val: string) => void;
  setAddCashStep: (val: any) => void;
  setUtrNumber: (val: string) => void;
  setAddCashModalOpen: (val: boolean) => void;
  setWithdrawAmount: (val: string) => void;
  setWithdrawModalOpen: (val: boolean) => void;
  setConvertAmount: (val: string) => void;
  setConvertModalOpen: (val: boolean) => void;
  triggerAdminTxAction: (txId: string, action: 'APPROVE' | 'REJECT') => void;
}

export default function Wallet({
  walletData,
  walletLoading,
  walletError,
  userProfile,
  filteredTransactions,
  searchTxnQuery,
  setSearchTxnQuery,
  selectedTxnType,
  setSelectedTxnType,
  setAddCashAmount,
  setAddCashStep,
  setUtrNumber,
  setAddCashModalOpen,
  setWithdrawAmount,
  setWithdrawModalOpen,
  setConvertAmount,
  setConvertModalOpen,
  triggerAdminTxAction
}: WalletProps) {
  const navigate = useNavigate();

  if (walletLoading) {
    return (
      <div className="p-10 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-zinc-400 font-bold tracking-wider">LOADING WALLET DATA...</p>
      </div>
    );
  }

  if (walletError) {
    return (
      <div className="p-6 text-center space-y-3 text-left">
        <div className="w-10 h-10 bg-rose-950/40 border border-rose-500/30 text-rose-400 rounded-full flex items-center justify-center mx-auto text-sm font-bold">!</div>
        <p className="text-xs text-rose-300 font-bold uppercase tracking-wider">{walletError}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-neutral-900 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-bold uppercase hover:bg-neutral-850 cursor-pointer">Retry</button>
      </div>
    );
  }

  const balance = walletData ? walletData.walletBalance : (userProfile?.walletBalance ?? 0);
  const depositCash = walletData ? walletData.depositCash : (userProfile?.depositBalance ?? 0);
  const winningCash = walletData ? walletData.winningCash : (userProfile?.winningsBalance ?? 0);

  return (
    <div className="p-3.5 space-y-4 text-left">
      {/* Total Card */}
      <div className="bg-gradient-to-r from-[#ca8a04] to-amber-500 p-5 rounded-2xl text-[#140000] shadow-2xl space-y-1 relative overflow-hidden">
        <span className="text-[9px] font-bold block uppercase tracking-wide opacity-80">TOTAL WALLET BALANCE</span>
        <h2 className="text-2xl font-extrabold tracking-tight font-mono leading-none py-1">
          ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>
        
        <button
          onClick={() => navigate('/wallet/add-cash')}
          className="absolute right-4 top-4 px-3.5 py-1.5 rounded-lg bg-neutral-950 border border-amber-400 text-[#ffd700] hover:bg-neutral-900 font-extrabold text-[10px] uppercase cursor-pointer"
        >
          + Add Cash
        </button>

        <div className="pt-4 grid grid-cols-2 gap-4 border-t border-black/10 text-left">
          <div>
            <span className="text-[8px] opacity-75 font-bold uppercase block">DEPOSIT CASH</span>
            <span className="text-sm font-black font-mono">₹{depositCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="border-l border-black/10 pl-4">
            <span className="text-[8px] opacity-75 font-bold uppercase block">WINNING CASH</span>
            <span className="text-sm font-black font-mono">₹{winningCash.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Buttons and Actions */}
      <div className="grid grid-cols-2 gap-3.5">
        <button
          onClick={() => {
            navigate('/wallet/withdraw');
          }}
          className="py-3 bg-[#1d080a] hover:bg-rose-955/20 border border-rose-500/20 text-rose-300 font-black rounded-xl text-xs uppercase tracking-widest active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <CreditCard className="w-3.5 h-3.5" />
          WITHDRAW
        </button>
        <button
          onClick={() => {
            setConvertAmount("100");
            setConvertModalOpen(true);
          }}
          disabled={winningCash <= 0}
          className="py-3 bg-[#1d080a] hover:bg-rose-955/20 border border-amber-500/20 text-amber-300 font-black rounded-xl text-xs uppercase tracking-widest active:scale-98 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          CONVERT
        </button>
      </div>

      {/* Conversion Bonus Info banner */}
      <div className="bg-neutral-900 border border-rose-955/30 p-3 rounded-xl flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-xs shrink-0">
          🔥
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-amber-450 uppercase leading-none">3% CONVERT BONUS ACTIVE</h4>
          <p className="text-[8.5px] text-zinc-500 leading-normal mt-1">Convert winning cash to deposit balance and receive an extra 3% promo cash automatically!</p>
        </div>
      </div>

      {/* Transactions list header and search filters */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest pl-1">
            TRANSACTION LOGS
          </span>
          <div className="flex gap-1.5">
            <select
              value={selectedTxnType}
              onChange={(e) => setSelectedTxnType(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded px-1.5 py-0.5 text-[8.5px] font-bold text-amber-400 focus:outline-none"
            >
              <option value="ALL">ALL TYPES</option>
              <option value="DEPOSIT">DEPOSITS</option>
              <option value="WITHDRAW">WITHDRAWALS</option>
              <option value="WINNINGS">WINNINGS</option>
              <option value="BONUS">BONUS</option>
            </select>
          </div>
        </div>

        <input
          type="text"
          value={searchTxnQuery}
          onChange={(e) => setSearchTxnQuery(e.target.value)}
          placeholder="Search transaction ID or method..."
          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 px-3 text-xs text-neutral-200 placeholder-zinc-700 focus:outline-none"
        />

        {/* List of items */}
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-0.5 pb-2">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-6 text-[10px] text-zinc-550 italic border border-neutral-850 rounded-xl">
              No transactions match query filter parameters.
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div 
                key={tx.id}
                className="bg-neutral-900 border border-neutral-850 p-3 rounded-xl flex items-center justify-between shadow"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-neutral-100 uppercase leading-none font-mono">
                      {tx.id}
                    </span>
                    <span className={`text-[8px] px-1 py-0.5 rounded font-extrabold uppercase leading-none ${
                      tx.type === 'DEPOSIT' || tx.type === 'WINNINGS' || tx.type === 'BONUS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {tx.type}
                    </span>
                  </div>
                  <span className="text-[8.5px] text-zinc-500 block leading-none pt-0.5">
                    {tx.timestamp} • {tx.method}
                  </span>
                </div>

                <div className="flex flex-col items-end gap-1.5 text-right shrink-0">
                  <span className={`text-xs font-black font-mono leading-none ${
                    tx.type === 'DEPOSIT' || tx.type === 'WINNINGS' || tx.type === 'BONUS' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {tx.type === 'DEPOSIT' || tx.type === 'WINNINGS' || tx.type === 'BONUS' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                  </span>
                  
                  {/* Status checks */}
                  {tx.status === 'PENDING' ? (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => triggerAdminTxAction(tx.id, 'APPROVE')}
                        className="px-1.5 py-0.5 rounded bg-emerald-500 text-neutral-950 font-black text-[7.5px] uppercase cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => triggerAdminTxAction(tx.id, 'REJECT')}
                        className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-black text-[7.5px] uppercase cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className={`text-[8px] font-bold leading-none ${
                      tx.status === 'SUCCESS' ? 'text-emerald-400' : 'text-rose-450'
                    }`}>
                      {tx.status}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
