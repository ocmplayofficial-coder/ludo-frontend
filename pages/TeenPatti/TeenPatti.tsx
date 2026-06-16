import React from 'react';
import { ArrowLeft, Flame } from 'lucide-react';
import { TeenPattiGame, Card } from '../../src/types.js';

interface TeenPattiProps {
  activeTP: TeenPattiGame | null;
  isProcessing: boolean;
  setGameRoute: (val: any) => void;
  setActiveTP: (val: TeenPattiGame | null) => void;
  triggerTPAction_Fold: () => void;
  triggerTPAction_Seen: () => void;
  triggerTPAction_Chaal: () => void;
  triggerTPAction_Show: () => void;
  syncServerProfile: () => void;
  syncTransactions: () => void;
}

export default function TeenPatti({
  activeTP,
  isProcessing,
  setGameRoute,
  setActiveTP,
  triggerTPAction_Fold,
  triggerTPAction_Seen,
  triggerTPAction_Chaal,
  triggerTPAction_Show,
  syncServerProfile,
  syncTransactions
}: TeenPattiProps) {
  if (!activeTP) return null;

  const renderCardGraphic = (card: Card, index: number, isPeekingHidden: boolean) => {
    const suitSymbols = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
    const suitColors = { 
      hearts: 'text-rose-500', 
      diamonds: 'text-rose-500', 
      clubs: 'text-neutral-300', 
      spades: 'text-neutral-300' 
    };

    if (isPeekingHidden) {
      return (
        <div key={index} className="w-14 h-20 rounded-lg bg-gradient-to-br from-[#400c0c] to-[#170101] border-2 border-red-800/60 shadow-lg flex items-center justify-center relative overflow-hidden transition-all duration-300 scale-95 hover:scale-100">
          <div className="absolute inset-1.5 border border-dashed border-red-700/30 rounded" />
          <Flame className="w-6 h-6 text-red-500/30 animate-pulse" />
        </div>
      );
    }

    return (
      <div key={index} className="w-14 h-20 rounded-lg bg-neutral-900 border-2 border-neutral-700 shadow-md flex flex-col justify-between p-1.5 text-xs select-none hover:scale-105 active:scale-95 transition-transform duration-200">
        <span className={`${suitColors[card.suit]} font-bold leading-none`}>
          {card.value}
        </span>
        <span className={`text-xl self-center ${suitColors[card.suit]} leading-none`}>
          {suitSymbols[card.suit]}
        </span>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 bg-[#0d1f11] text-neutral-100 flex flex-col z-40 leading-none select-none">
      {/* Game header */}
      <div className="px-3.5 py-4 bg-neutral-900/90 border-b border-rose-955/20 flex items-center justify-between shrink-0 text-left">
        <button
          onClick={() => {
            if (confirm("Folding stakes folds active bets. Leave?")) {
              setGameRoute('LOBBY_CAROUSEL');
              setActiveTP(null);
              syncServerProfile();
            }
          }}
          className="px-2.5 py-1 bg-[#100101] border border-neutral-800 text-rose-300 text-[10px] rounded hover:bg-neutral-850 cursor-pointer flex items-center gap-1"
          id="btn-fold-back"
        >
          <ArrowLeft className="w-3 h-3" /> FOLD
        </button>

        <div className="text-center">
          <span className="text-[8px] text-zinc-500 block font-bold leading-none uppercase">TEEN PATTI • {activeTP.variant}</span>
          <span className="text-xs font-bold text-[#ffd700] mt-0.5 leading-none block">₹{activeTP.pot} POT STAKES</span>
        </div>

        <div className="text-[8px] text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
          RNG CERTIFIED
        </div>
      </div>

      {/* Big Poker table layout */}
      <div className="flex-1 overflow-y-auto p-3.5 flex flex-col justify-between space-y-4">
        
        {/* Opponent Bot section */}
        <div className="text-center space-y-2.5">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-500 text-neutral-955 flex items-center justify-center font-bold text-[10px]">
              🤖
            </div>
            <span className="text-xs font-bold text-neutral-300">
              ProBot Player (Cards Hidden)
            </span>
          </div>

          {/* Bot Card Deck elements */}
          <div className="flex justify-center gap-2">
            {activeTP.botHand.map((card, idx) => 
              renderCardGraphic(card, idx, !activeTP.winner) // Hidden until resolution/show
            )}
          </div>
        </div>

        {/* Pot Indicator Bubble */}
        <div className="flex justify-center pb-1">
          <div className="px-5 py-2 rounded-full bg-radial from-amber-600/30 to-rose-950/20 border-2 border-[#ffd700]/30 shadow-lg text-center select-none animate-pulse">
            <span className="text-[8px] block font-bold text-amber-300 uppercase leading-none">TOTAL POT VALUES</span>
            <span className="text-base font-extrabold text-white font-mono mt-0.5 block leading-none">₹{activeTP.pot}</span>
          </div>
        </div>

        {/* Player Hand & Controls section */}
        <div className="space-y-4">
          
          {/* Your Card Deck elements */}
          <div className="space-y-2 group">
            <div className="flex justify-center gap-2.5">
              {activeTP.playerHand.map((card, idx) => 
                renderCardGraphic(card, idx, !activeTP.playerSeen) // Hidden until seen checks
              )}
            </div>
            <div className="text-center">
              {!activeTP.playerSeen && !activeTP.winner && (
                <button
                  onClick={triggerTPAction_Seen}
                  className="px-3.5 py-1 text-[10px] bg-emerald-500 hover:bg-emerald-600 text-neutral-955 rounded font-black uppercase cursor-pointer transition-colors shrink-0 outline-none leading-none inline-block shadow-lg"
                  id="btn-seen-cards"
                >
                  👀 See Cards (Action increases Chaal Bet by 2x)
                </button>
              )}
            </div>
          </div>

          {/* State Finished winner labels */}
          {activeTP.winner && (
            <div className="bg-neutral-900/90 border border-amber-500/20 rounded-xl p-3 text-center space-y-2.5 shadow-xl">
              <span className="text-xs font-bold text-[#ffd700] uppercase block tracking-wide">
                🏁 STAKES HAND SETTLED
              </span>
              <p className="text-xs text-neutral-200">
                {activeTP.winner === 'player' ? '🎉 You are the Pot Winner!' : '🤖 opponent Bot claimed the Poker hand!'}
              </p>
              <button
                onClick={() => {
                  setGameRoute('LOBBY_CAROUSEL');
                  setActiveTP(null);
                  syncServerProfile();
                  syncTransactions();
                }}
                className="px-5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-[#140101] font-bold text-[10px] rounded uppercase cursor-pointer tracking-wider shrink-0"
              >
                Return Lobby
              </button>
            </div>
          )}

          {/* Poker betting control panel */}
          {!activeTP.winner && (
            <div className="grid grid-cols-3 gap-2 shrink-0">
              <button
                onClick={triggerTPAction_Fold}
                className="py-3.5 bg-rose-955/20 border border-rose-500/20 hover:bg-rose-900/40 text-rose-300 font-extrabold text-xs rounded-xl uppercase tracking-wider cursor-pointer"
                id="btn-fold-chaal"
              >
                FOLD
              </button>
              <button
                onClick={triggerTPAction_Chaal}
                className="py-3.5 bg-[#ffd700] hover:bg-amber-500 text-neutral-955 font-black text-xs rounded-xl uppercase tracking-wider cursor-pointer shadow-lg"
                id="btn-place-chaal"
              >
                CHAAL (₹{activeTP.playerSeen ? activeTP.currentBet * 2 : activeTP.currentBet})
              </button>
              <button
                onClick={triggerTPAction_Show}
                className="py-3.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-955 font-extrabold text-xs rounded-xl uppercase tracking-wider cursor-pointer shadow-md"
                id="btn-show-cards"
              >
                SHOWDOWN
              </button>
            </div>
          )}

          {/* Recent log messages line */}
          <div className="h-14 overflow-y-auto bg-neutral-950/80 p-2.5 rounded-xl border border-emerald-950/20 text-[9px] font-mono leading-relaxed text-zinc-400 text-left">
            {activeTP.logs.slice(0, 3).map((log, idx) => (
              <p key={idx} className={`${idx === 0 ? 'text-emerald-400 font-semibold' : 'text-neutral-400'}`}>
                🃏 {log}
              </p>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
