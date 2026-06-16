import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../src/axiosConfig';
import { Coins, Wallet as WalletIcon, Smartphone, ArrowLeft, Settings } from 'lucide-react';
import { User } from '../../src/types.js';
interface HomeProps {
  userProfile: User | null;
  transactions: any[];
  gameRoute: 'LOBBY_CAROUSEL' | 'LUDO_ARENA' | 'LUDO_MATCH' | 'TP_ARENA' | 'LUDO_MATCHMAKING' | 'L_PLAYING' | 'TP_PLAYING';
  setGameRoute: (val: any) => void;
  setCurrentTab: (val: any) => void;
  selectedLudoVariant: 'CLASSIC' | 'TIME' | 'TURN';
  setSelectedLudoVariant: (val: any) => void;
  selectedTPVariant: 'CLASSIC' | 'MUFLIS' | 'AK47';
  setSelectedTPVariant: (val: any) => void;
  onlinePlayersCount: number;
  liveGamesCount: number;
  startLudoMatchmaking: (fee: number) => void;
  startTPMatchmaking: (fee: number) => void;
  setAddCashAmount: (val: string) => void;
  setAddCashStep: (val: any) => void;
  setUtrNumber: (val: string) => void;
  setAddCashModalOpen: (val: boolean) => void;
  setWithdrawAmount: (val: string) => void;
  setWithdrawModalOpen: (val: boolean) => void;
  showAlert: (text: string, type?: 'success' | 'error') => void;
}

export default function Home({
  userProfile,
  transactions,
  gameRoute,
  setGameRoute,
  setCurrentTab,
  selectedLudoVariant,
  setSelectedLudoVariant,
  selectedTPVariant,
  setSelectedTPVariant,
  onlinePlayersCount,
  liveGamesCount,
  startLudoMatchmaking,
  startTPMatchmaking,
  setAddCashAmount,
  setAddCashStep,
  setUtrNumber,
  setAddCashModalOpen,
  setWithdrawAmount,
  setWithdrawModalOpen,
  showAlert
}: HomeProps) {
  const navigate = useNavigate();
  const profile = (userProfile && (userProfile as any).user) ? (userProfile as any).user : userProfile;
  const [arenas, setArenas] = useState<any[]>([]);

  async function loadArenas() {
    try {
      const res = await api.get("/api/admin/arenas", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`
        }
      });

      console.log("ARENA RESPONSE =", res.data);

      if (res.data.success) {
        setArenas(res.data.arenas || []);
      }
    } catch (err) {
      console.error("ARENA LOAD ERROR", err);
    }
  }
  useEffect(() => {
    loadArenas();
  }, []);
  return (
    <div className="p-3.5 space-y-3.5">
      {/* 1. LOBBY CAROUSEL LOBBY */}
      {gameRoute === 'LOBBY_CAROUSEL' && (
        <>
          {/* Huge Wallet balance highlight card */}
          <div className="bg-gradient-to-br from-[#270e0e] to-[#120101] border border-rose-500/20 p-4 rounded-2xl relative shadow-2xl overflow-hidden min-h-[110px] flex flex-col justify-between text-left">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(234,179,8,0.06)_0,transparent_60%)]" />
            <div className="absolute bottom-2 right-3 opacity-15">
              <WalletIcon className="w-16 h-16 text-amber-500" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
                WALLET BALANCE
              </span>
              <h2 className="text-xl font-extrabold text-white tracking-tight font-mono">
                ₹{profile?.walletBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
              </h2>
              <span className="text-[9px] text-zinc-500 block">
                Total withdrawable cash
              </span>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => navigate('/wallet/add-cash')}
                className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-neutral-950 font-extrabold text-[10px] uppercase cursor-pointer"
              >
                + Add Cash
              </button>
              <button
                onClick={() => {
                  setWithdrawAmount("300");
                  setWithdrawModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-neutral-900 border border-rose-955 text-rose-300 hover:bg-neutral-850 font-extrabold text-[10px] uppercase cursor-pointer"
              >
                Withdraw
              </button>
            </div>
          </div>

          {/* Online stat indicator badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-900 p-2.5 rounded-xl border border-rose-955/40 space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-[8px] text-zinc-400 font-bold uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                ONLINE
              </div>
              <span className="text-base font-extrabold block text-white font-mono leading-none pt-0.5">
                {onlinePlayersCount !== null ? onlinePlayersCount : '...'}
              </span>
            </div>
            <div className="bg-neutral-900 p-2.5 rounded-xl border border-rose-955/40 space-y-1 text-left">
              <div className="flex items-center gap-1.5 text-[8px] text-zinc-400 font-bold uppercase">
                <Smartphone className="w-3 h-3 text-amber-500 shrink-0" />
                LIVE GAMES
              </div>
              <span className="text-base font-extrabold block text-white font-mono leading-none pt-0.5">
                {liveGamesCount !== null ? liveGamesCount : '...'}
              </span>
            </div>
          </div>

          {/* ARENA PICKERS ACCORDIONS */}
          <div className="space-y-3 text-left">
            <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest pl-1">
              SELECT ARENA
            </span>

            {/* Ludo Pro selection bar */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-3.5 rounded-2xl flex items-center justify-between shadow-lg text-neutral-950 border border-amber-300 hover:scale-101 transform transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-radial from-amber-300/30 to-transparent pointer-events-none" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#130101] flex items-center justify-center shadow font-bold text-xl">
                  🎲
                </div>
                <div>
                  <h3 className="text-sm font-extrabold leading-none tracking-tight">LUDO PRO</h3>
                  <span className="text-[10px] opacity-80 font-bold mt-0.5 block leading-none">
                    Instant Withdrawal • 24/7
                  </span>
                </div>
              </div>
              <button
                onClick={() => setGameRoute('LUDO_ARENA')}
                className="px-5 py-1.5 bg-[#170101] hover:bg-neutral-955 text-[#ffd700] hover:text-white rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer shadow border border-[#ffd700]/30 transition-all"
                id="btn-trigger-ludo"
              >
                PLAY
              </button>
            </div>

            {/* Teen Patti Poker selection bar */}
            <div className="bg-neutral-900 p-3.5 rounded-2xl flex items-center justify-between shadow border border-rose-955/40 hover:scale-101 transform transition-all duration-300 relative overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#300505] to-[#120000] border border-rose-500/20 flex items-center justify-center shadow text-xl">
                  🃏
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-neutral-200 leading-none">TEEN PATTI</h3>
                  <span className="text-[10px] text-zinc-500 mt-0.5 block leading-none">
                    High Stakes • Live Players
                  </span>
                </div>
              </div>
              <button
                onClick={() => setGameRoute('TP_ARENA')}
                className="px-5 py-1.5 bg-rose-955/40 hover:bg-rose-900/60 border border-rose-500/20 text-rose-300 rounded-lg font-bold text-[10px] uppercase tracking-wider cursor-pointer shadow transition-all"
                id="btn-trigger-tp"
              >
                PLAY
              </button>
            </div>

            {/* Refer & Earn Invite link */}
            <div className="bg-[#240e0e]/90 p-3.5 rounded-2xl flex items-center justify-between border border-rose-955/30 relative">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center text-xs text-amber-400">
                  🎁
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-none text-neutral-100">REFER & EARN</h4>
                  <p className="text-[9px] text-zinc-500 leading-none mt-1">Get ₹50 for every friend join!</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCurrentTab('PROFILE');
                  showAlert("Select Copy Code below to trigger invite cash!");
                }}
                className="text-[9px] px-2.5 py-1 rounded bg-[#ffd700] text-[#130101] font-extrabold uppercase shrink-0 cursor-pointer"
              >
                INVITE
              </button>
            </div>

          </div>
        </>
      )}

      {/* 2. CHOOSE YOUR LUDO ARENA RULES */}
      {gameRoute === 'LUDO_ARENA' && (
        <div className="space-y-5 text-neutral-100 flex flex-col h-full text-left">

          <div className="flex items-center justify-between bg-neutral-955/45 p-1 rounded-xl shrink-0 select-none">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setGameRoute('LOBBY_CAROUSEL')}
                className="text-white hover:text-amber-400 p-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-6 h-6 stroke-[3]" />
              </button>

              <div className="flex flex-col text-left leading-none">
                <span className="text-[#ffd700] text-[15px] font-black tracking-tight leading-tight uppercase font-sans">
                  CHOOSE
                </span>
                <span className="text-[#ffd700] text-[15px] font-black tracking-tight leading-tight uppercase font-sans">
                  YOUR
                </span>
                <span className="text-[#ffd700] text-[14px] font-black tracking-tight leading-tight uppercase font-sans">
                  ARENA
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-neutral-900/90 border border-amber-500/30 pl-3 pr-1.5 py-1 rounded-full shadow-inner">
              <span className="text-[#ffd700] font-black text-xs font-mono tracking-wide leading-none pt-0.5">
                ₹{profile?.walletBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
              </span>
              <button
                onClick={() => navigate('/wallet/add-cash')}
                className="w-5 h-5 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center text-neutral-950 font-black text-xs leading-none transition-transform cursor-pointer"
              >
                +
              </button>
            </div>

            <button
              onClick={() => setCurrentTab('PROFILE')}
              className="text-zinc-400 hover:text-white p-1.5 transition-colors cursor-pointer"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto pr-0.5 max-h-[460px] pb-4 flex-grow">

            {/* CLASSIC BUTTON STAKES CARD */}
            <button
              onClick={() => {
                setSelectedLudoVariant('CLASSIC');
                setGameRoute('LUDO_MATCH');
              }}
              className="w-full relative overflow-hidden h-[135px] rounded-[24px] border border-neutral-800 flex items-center justify-center cursor-pointer transform active:scale-98 transition-all shadow-[0_12px_24px_rgba(0,0,0,0.55)] group text-left block"
            >
              <div className="absolute inset-0 bg-[#0e0202]/80 z-0" />
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-lighten pointer-events-none z-0">
                <rect x="0" y="0" width="40" height="40" fill="#dc2626" />
                <circle cx="12" cy="12" r="4" fill="white" />
                <circle cx="28" cy="12" r="4" fill="white" />
                <circle cx="12" cy="28" r="4" fill="white" />
                <circle cx="28" cy="28" r="4" fill="white" />
                <rect x="60" y="0" width="40" height="40" fill="#fbbf24" />
                <circle cx="72" cy="12" r="4" fill="white" />
                <circle cx="88" cy="12" r="4" fill="white" />
                <circle cx="72" cy="28" r="4" fill="white" />
                <circle cx="88" cy="28" r="4" fill="white" />
                <rect x="0" y="60" width="40" height="40" fill="#10b981" />
                <rect x="60" y="60" width="40" height="40" fill="#2563eb" />
                <polygon points="40,40 50,50 40,60" fill="#dc2626" />
                <polygon points="60,40 50,50 60,60" fill="#2563eb" />
                <polygon points="40,40 50,50 60,40" fill="#fbbf24" />
                <polygon points="40,60 50,50 60,60" fill="#10b981" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15 z-10" />
              <span className="relative z-20 text-white text-4xl font-extrabold tracking-[0.1em] filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform text-center select-none leading-none font-sans font-black">
                CLASSIC
              </span>
            </button>

            {/* TIME BUTTON STAKES CARD */}
            <button
              onClick={() => {
                setSelectedLudoVariant('TIME');
                setGameRoute('LUDO_MATCH');
              }}
              className="w-full relative overflow-hidden h-[135px] rounded-[24px] border border-neutral-800 flex items-center justify-center cursor-pointer transform active:scale-98 transition-all shadow-[0_12px_24px_rgba(0,0,0,0.55)] group text-left block"
            >
              <div className="absolute inset-0 bg-[#061512]/90 z-0" />
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen pointer-events-none z-0">
                <rect x="40" y="0" width="20" height="100" fill="#334155" opacity="0.3" />
                <rect x="0" y="40" width="100" height="20" fill="#334155" opacity="0.3" />
                <rect x="40" y="0" width="10" height="40" fill="#2563eb" opacity="0.4" />
                <rect x="50" y="60" width="10" height="40" fill="#10b981" opacity="0.4" />
                <circle cx="50" cy="50" r="16" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 3" />
                <line x1="50" y1="50" x2="50" y2="40" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                <line x1="50" y1="50" x2="58" y2="50" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15 z-10" />
              <span className="relative z-20 text-white text-4xl font-extrabold tracking-[0.1em] filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform text-center select-none leading-none font-sans font-black">
                TIME
              </span>
            </button>

            {/* TURN BUTTON STAKES CARD */}
            <button
              onClick={() => {
                setSelectedLudoVariant('TURN');
                setGameRoute('LUDO_MATCH');
              }}
              className="w-full relative overflow-hidden h-[135px] rounded-[24px] border border-neutral-800 flex items-center justify-center cursor-pointer transform active:scale-98 transition-all shadow-[0_12px_24px_rgba(0,0,0,0.55)] group text-left block"
            >
              <div className="absolute inset-0 bg-[#160f06]/92 z-0" />
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full object-cover opacity-50 pointer-events-none z-0">
                <rect x="15" y="15" width="70" height="70" rx="3" fill="#78350f" opacity="0.3" />
                <rect x="20" y="20" width="60" height="60" rx="2" fill="#fef3c7" opacity="0.1" />
                <g transform="translate(10, 48) scale(0.6)">
                  <rect x="20" y="10" width="22" height="22" rx="4" fill="white" stroke="#2c1d11" strokeWidth="1.5" />
                  <circle cx="26" cy="16" r="2" fill="black" />
                  <circle cx="36" cy="26" r="2" fill="black" />
                  <circle cx="31" cy="21" r="2.5" fill="#dc2626" />
                  <rect x="50" y="24" width="22" height="22" rx="4" fill="#dc2626" stroke="#2c1d11" strokeWidth="1.5" />
                  <circle cx="61" cy="35" r="2.5" fill="white" />
                </g>
              </svg>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15 z-10" />
              <span className="relative z-20 text-white text-4xl font-extrabold tracking-[0.1em] filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)] group-hover:scale-105 transition-transform text-center select-none leading-none font-sans font-black">
                TURN
              </span>
            </button>

          </div>
        </div>
      )}

      {/* 3. LUDO MATCH SETUP & SELECTION */}
      {gameRoute === 'LUDO_MATCH' && (
        <div className="space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGameRoute('LUDO_ARENA')}
                className="p-1 rounded bg-neutral-900 border border-neutral-800 text-rose-350 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-widest leading-none">
                {selectedLudoVariant} ARENA
              </h3>
            </div>
            <div className="text-[8px] bg-red-500/10 border border-red-500/30 text-rose-450 px-1.5 py-0.5 rounded font-bold">
              3 Active Players
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {/* Room Stakes item 1 */}
            <div className="bg-neutral-900 border border-rose-500/10 rounded-2xl p-4 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-rose-950 pb-2.5">
                <div className="text-[8px] font-extrabold bg-amber-500 text-neutral-950 px-2 py-0.5 rounded-full uppercase">
                  {selectedLudoVariant}
                </div>
                <div className="text-[9px] text-neutral-400 font-medium">
                  👤 2P (Player vs Bot) Room
                </div>
              </div>

              <div className="grid grid-cols-2 text-center items-center py-1">
                <div className="space-y-1">
                  <span className="text-[8px] block font-bold text-zinc-500 uppercase">WINNING PRIZE</span>
                  <span className="text-lg font-black block text-amber-400 font-mono">₹70</span>
                </div>
                <div className="border-l border-rose-955/35 space-y-1">
                  <span className="text-[8px] block font-bold text-zinc-500 uppercase">ENTRY FEE</span>
                  <span className="text-base font-extrabold text-neutral-200 block font-mono">₹50</span>
                </div>
              </div>

              <button
                onClick={() => startLudoMatchmaking(50)}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-neutral-955 font-bold rounded-xl text-xs uppercase tracking-wider shadow-md hover:scale-101 cursor-pointer transition-all"
                id="btn-join-50"
              >
                JOIN ₹50
              </button>
            </div>

            {/* Room Stakes item 2 */}
            {arenas
              .filter(
                (arena: any) =>
                  arena.gameType === "ludo" &&
                  arena.mode?.toUpperCase() === selectedLudoVariant
              )
              .map((arena: any) => (

                <div
                  key={arena.id}
                  className="bg-neutral-900 border border-rose-500/10 rounded-2xl p-4 space-y-4 shadow-xl"
                >

                  <div className="flex items-center justify-between border-b border-rose-950 pb-2.5">
                    <div className="text-[8px] font-extrabold bg-amber-500 text-neutral-950 px-2 py-0.5 rounded-full uppercase">
                      {arena.mode}
                    </div>

                    <div className="text-[9px] text-neutral-400 font-medium">
                      👤 2P Arena
                    </div>
                  </div>

                  <div className="grid grid-cols-2 text-center items-center py-1">

                    <div className="space-y-1">
                      <span className="text-[8px] block font-bold text-zinc-500 uppercase">
                        WINNING PRIZE
                      </span>

                      <span className="text-lg font-black block text-amber-400 font-mono">
                        ₹{arena.winningPrize}
                      </span>
                    </div>

                    <div className="border-l border-rose-955/35 space-y-1">
                      <span className="text-[8px] block font-bold text-zinc-500 uppercase">
                        ENTRY FEE
                      </span>

                      <span className="text-base font-extrabold text-neutral-200 block font-mono">
                        ₹{arena.entryFee}
                      </span>
                    </div>

                  </div>

                  <button
                    onClick={() =>
                      startLudoMatchmaking(
                        Number(arena.entryFee)
                      )
                    }
                    className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-neutral-955 font-bold rounded-xl text-xs uppercase tracking-wider shadow-md"
                  >
                    JOIN ₹{arena.entryFee}
                  </button>

                </div>

              ))}
          </div>
        </div>
      )}

      {/* 4. TEEN PATTI ARENA */}
      {gameRoute === 'TP_ARENA' && (
        <div className="space-y-4 text-left">

          <div className="flex items-center gap-2">
            <button
              onClick={() => setGameRoute('LOBBY_CAROUSEL')}
              className="p-1 rounded bg-neutral-900 border border-neutral-800 text-rose-350 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>

            <h3 className="text-sm font-extrabold text-amber-400 uppercase tracking-widest leading-none">
              TEEN PATTI LOBBY
            </h3>
          </div>

          <div className="space-y-3.5">

            {arenas
              .filter(
                (arena: any) =>
                  arena.gameType === "teenpatti"
              )
              .map((arena: any) => (

                <div
                  key={arena.id}
                  className="bg-gradient-to-br from-[#2f0e0e] to-neutral-900 border border-rose-955/40 p-4 rounded-xl space-y-3.5 shadow-md"
                >

                  <div>
                    <h4 className="text-xs font-extrabold text-white leading-none uppercase">
                      {arena.mode}
                    </h4>

                    <span className="text-[9px] text-zinc-500 mt-1 block">
                      Teen Patti Arena
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-rose-955/30 pt-3">

                    <div>
                      <span className="text-[8px] text-zinc-500 block uppercase font-bold">
                        ENTRY FEE
                      </span>

                      <span className="text-xs font-bold text-amber-400 block font-mono">
                        ₹{arena.entryFee}
                      </span>
                    </div>

                    <div>
                      <span className="text-[8px] text-zinc-500 block uppercase font-bold">
                        WINNING
                      </span>

                      <span className="text-xs font-bold text-emerald-400 block font-mono">
                        ₹{arena.winningPrize}
                      </span>
                    </div>

                    <button
                      onClick={() => {

                        setSelectedTPVariant(
                          arena.mode.toUpperCase()
                        );

                        startTPMatchmaking(
                          Number(arena.entryFee)
                        );
                      }}
                      className="px-4 py-1.5 bg-[#ffd700] hover:bg-amber-500 text-[#170101] font-extrabold rounded-lg text-[10px] uppercase cursor-pointer transition-colors"
                    >
                      PLAY NOW
                    </button>

                  </div>

                </div>

              ))}

            {arenas.filter(
              (arena: any) =>
                arena.gameType === "teenpatti"
            ).length === 0 && (
                <div className="text-center text-zinc-500 py-10">
                  No Teen Patti Arenas Available
                </div>
              )}

          </div>
        </div>
      )}
    </div>
  );
}
