import React from 'react';
import { Trophy, Settings, Coins, ArrowLeft, CheckCircle, ShieldAlert, X } from 'lucide-react';
import { User, LudoGame } from '../../src/types.js';
import Board from '../../game/Board.jsx';
import LudoDice3D from '../../game/Dice.jsx';

interface LudoProps {
  userProfile: User | null;
  activeLudo: LudoGame | null;
  ludoTurnTimeRemaining: number;
  isRollingDice: boolean;
  isProcessing: boolean;
  ludoSettingsOpen: boolean;
  setLudoSettingsOpen: (val: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  vibrationEnabled: boolean;
  setVibrationEnabled: (val: boolean) => void;
  handleLudoDiceRollWithAnim: () => void;
  triggerLudoMove: (tokenId: number) => void;
  handleLudoLeaveGame: () => void;
  setGameRoute: (val: any) => void;
  resetGameState: () => void;
  syncServerProfile: () => void;
  syncTransactions: () => void;
}

const formatLudoTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function Ludo({
  userProfile,
  activeLudo,
  ludoTurnTimeRemaining,
  isRollingDice,
  isProcessing,
  ludoSettingsOpen,
  setLudoSettingsOpen,
  soundEnabled,
  setSoundEnabled,
  vibrationEnabled,
  setVibrationEnabled,
  handleLudoDiceRollWithAnim,
  triggerLudoMove,
  handleLudoLeaveGame,
  setGameRoute,
  resetGameState,
  syncServerProfile,
  syncTransactions
}: LudoProps) {
  console.log("GAME_DATA", activeLudo);
  console.log("PLAYERS", activeLudo?.players);
  console.log("YELLOW", activeLudo?.players?.yellow);

  const myUserId = userProfile?._id ? (userProfile._id.toString ? userProfile._id.toString() : userProfile._id) : (userProfile?.id ? userProfile.id.toString() : null);
  const redId = activeLudo?.players?.red?.userId ? (activeLudo.players.red.userId.toString ? activeLudo.players.red.userId.toString() : activeLudo.players.red.userId) : null;
  const yellowId = activeLudo?.players?.yellow?.userId ? (activeLudo.players.yellow.userId.toString ? activeLudo.players.yellow.userId.toString() : activeLudo.players.yellow.userId) : null;
  const myColor = myUserId === redId ? 'red' : myUserId === yellowId ? 'yellow' : null;
  const opponent = myColor === 'red' ? activeLudo?.players?.yellow || null : activeLudo?.players?.red || null;
  const opponentName = opponent?.username || 'Opponent';

  // Show waiting screen only when game object is missing, matchmaking in progress,
  // or one of the player slots is not yet filled. Rely on both players being
  // present (red & yellow) to hide the waiting UI.
  const hasRed = !!activeLudo?.players?.red;
  const hasYellow = !!activeLudo?.players?.yellow;
  const bothPlayersReady = hasRed && hasYellow;

  if (!activeLudo || !activeLudo.players || activeLudo.status === "MATCHMAKING" || !bothPlayersReady) {
    console.log("WAIT CHECK", {
      currentUserId: myUserId,
      players: activeLudo?.players,
      waitingForPlayers: activeLudo?.waitingForPlayers,
      bothPlayersJoined: activeLudo?.bothPlayersJoined,
      gameStatus: activeLudo?.status,
    });

    return (
      <div className="waiting-screen flex flex-col items-center justify-center h-full w-full bg-[#3a010d] text-neutral-200 font-sans p-6 text-center space-y-4">
        <div className="w-10 h-10 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
        <p className="text-sm font-bold tracking-wide">Waiting for opponent...</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-[#3a010d] text-neutral-100 flex flex-col z-40 leading-none select-none overflow-hidden font-sans relative">
      <div className="absolute inset-0 opacity-[0.22] pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(135deg, #51010a 25%, transparent 25%), 
          linear-gradient(225deg, #51010a 25%, transparent 25%), 
          linear-gradient(45deg, #51010a 25%, transparent 25%), 
          linear-gradient(315deg, #51010a 25%, #230004 25%)
        `,
        backgroundPosition: "20px 0, 20px 0, 0 0, 0 0",
        backgroundSize: "40px 40px",
        backgroundRepeat: "repeat"
      }} />

      {/* Game header bar */}
      <div className="px-4 py-3.5 bg-neutral-900/95 border-b border-rose-955/40 flex items-center justify-between shrink-0 relative z-30 text-left">
        <button
          onClick={() => setLudoSettingsOpen(true)}
          className="p-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-xl transition-all duration-200 outline-none cursor-pointer border border-neutral-700/25 active:scale-95"
          id="btn-ludo-settings"
          title="Settings"
        >
          <Settings className="w-4 h-4 animate-[spin_8s_linear_infinite]" />
        </button>

        <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/15 border border-amber-500/40 px-4 py-1.5 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.15)] select-none">
          <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
          <span className="text-[10px] text-amber-100 uppercase tracking-wider font-extrabold">
            Prize: <span className="text-amber-400 text-xs font-black">₹{(activeLudo.winningPrize ?? 0).toFixed(2)}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-neutral-800/80 px-2.5 py-1.5 rounded-xl border border-neutral-700/30">
          <div className="flex items-end gap-[1.5px] h-2.5">
            <span className="w-[2px] h-[3px] bg-emerald-400 rounded-[1px]" />
            <span className="w-[2px] h-[5px] bg-emerald-400 rounded-[1px]" />
            <span className="w-[2px] h-[7px] bg-emerald-400 rounded-[1px]" />
            <span className="w-[2px] h-[9px] bg-emerald-400 rounded-[1px]" />
          </div>
          <span className="text-[8px] font-black uppercase text-emerald-400 tracking-wider">
            Signal Strong
          </span>
        </div>
      </div>

      <div className="bg-[#1f0105] py-2 px-4 border-b border-rose-955/20 shadow-inner flex justify-center items-center font-bold font-sans">
        {activeLudo.variant === 'TURN' && (
          <div className="text-center">
            <span className="text-[11px] font-black text-emerald-400 tracking-wide uppercase px-3 py-1 bg-emerald-955/40 rounded-full border border-emerald-500/20 shadow-sm animate-pulse">
              🟢 {activeLudo.movesRemaining} Turns Remaining
            </span>
          </div>
        )}

        {activeLudo.variant === 'TIME' && (
          <div className="text-center">
            <span className="text-[11px] font-black text-rose-400 tracking-wide uppercase px-3 py-1 bg-rose-955/40 rounded-full border border-rose-500/20 shadow-sm animate-pulse">
              ⏰ Time Left: <span className="font-mono text-white text-xs">{formatLudoTime(activeLudo.timerRemaining ?? 0)}</span>
            </span>
          </div>
        )}

        {activeLudo.variant === 'CLASSIC' && (
          <div className="text-center">
            <span className="text-[9px] font-extrabold text-neutral-400 tracking-widest uppercase">
              👑 CLASSIC SPEED BATTLE RULING
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between space-y-4 relative z-10">
        <div className="text-center my-0.5">
          <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full animate-pulse ${
            activeLudo.turn === 'red' 
              ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' 
              : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
          }`}>
            {activeLudo.turn === myColor 
              ? `${myColor === 'red' ? '❤️' : '💛'} YOUR TURN TO ROLL` 
              : `${myColor === 'red' ? '💛' : '❤️'} ${opponentName.toUpperCase()} IS THINKING...`
            }
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center relative">
          <Board 
            game={activeLudo} 
            onTokenClick={triggerLudoMove} 
            isProcessing={isProcessing}
            myColor={myColor}
          />
          {activeLudo.winner && (() => {
            const myScore = myColor === 'red' ? (activeLudo.scores?.red ?? 0) : (activeLudo.scores?.yellow ?? 0);
            const opponentScore = myColor === 'red' ? (activeLudo.scores?.yellow ?? 0) : (activeLudo.scores?.red ?? 0);
            const totalScore = myScore + opponentScore;
            const myPercentage = totalScore === 0 ? 50 : Math.round((myScore / totalScore) * 100);
            const opponentPercentage = 100 - myPercentage;

            const isVictory = activeLudo.winner === myColor;
            const isDraw = activeLudo.winner === 'draw';

            return (
              <div className={`absolute inset-x-2 inset-y-1 backdrop-blur-md z-50 text-center flex flex-col justify-between overflow-hidden rounded-[28px] p-5 shadow-[0_24px_50px_rgba(0,0,0,0.95)] border border-white/5 animate-fade-in animate-duration-300 ${
                isVictory 
                  ? 'bg-neutral-950/96 border-amber-500/35 shadow-amber-500/5' 
                  : isDraw
                    ? 'bg-neutral-950/96 border-sky-500/25 shadow-sky-500/5'
                    : 'bg-neutral-950/96 border-rose-500/25 shadow-rose-500/5'
              }`}>
                {/* Backing dynamic radial lighting gradient */}
                <div className={`absolute inset-0 pointer-events-none opacity-40 mix-blend-screen bg-[radial-gradient(circle_at_top,var(--tw-gradient-stops))] ${
                  isVictory 
                    ? 'from-amber-500/20 via-transparent to-transparent' 
                    : isDraw
                      ? 'from-sky-500/20 via-transparent to-transparent'
                      : 'from-rose-500/20 via-transparent to-transparent'
                }`} />

                {/* Header Trophy/Warning/Draw */}
                <div className="flex flex-col items-center space-y-2.5 z-10 pt-2 shrink-0">
                  {isVictory ? (
                    <div className="relative">
                      <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full scale-150 animate-pulse" />
                      <div className="relative p-3 bg-gradient-to-br from-amber-400/20 to-yellow-600/30 rounded-2xl border border-amber-400/40 shadow-lg animate-bounce">
                        <Trophy className="w-8 h-8 text-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]" />
                      </div>
                    </div>
                  ) : isDraw ? (
                    <div className="relative">
                      <div className="absolute inset-0 bg-sky-500/15 blur-xl rounded-full scale-150 animate-pulse" />
                      <div className="relative p-3 bg-gradient-to-br from-sky-400/20 to-blue-600/30 rounded-2xl border border-sky-450/40 shadow-lg">
                        <CheckCircle className="w-8 h-8 text-sky-450 drop-shadow-[0_2px_10px_rgba(56,189,248,0.5)]" />
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-0 bg-rose-500/15 blur-xl rounded-full scale-150 animate-pulse" />
                      <div className="relative p-3 bg-gradient-to-br from-rose-500/25 to-red-700/25 rounded-2xl border border-rose-500/30 shadow-lg">
                        <ShieldAlert className="w-8 h-8 text-rose-500 drop-shadow-[0_2px_10px_rgba(239,68,68,0.5)]" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-0.5">
                    <h3 className={`text-xl font-black uppercase tracking-widest leading-none bg-gradient-to-r bg-clip-text text-transparent ${
                      isVictory 
                        ? 'from-amber-200 via-yellow-400 to-amber-500' 
                        : isDraw
                          ? 'from-sky-200 via-sky-400 to-blue-500'
                          : 'from-rose-500 via-rose-400 to-red-500'
                    }`}>
                      {isVictory ? 'Victory!' : isDraw ? 'Match Draw' : 'Defeat'}
                    </h3>
                    <p className={`text-[10px] font-extrabold tracking-wide ${
                      isVictory ? 'text-amber-300/80' : isDraw ? 'text-sky-300/80' : 'text-rose-300/80'
                    }`}>
                      {isVictory 
                        ? (activeLudo.variant === 'TIME' ? "TIMER EXPIRED • HIGHEST SCORE" : "CONGRATULATIONS CHAMPION!")
                        : isDraw
                          ? "TIMER EXPIRED • SCORES WERE EQUAL"
                          : (activeLudo.variant === 'TIME' ? `TIMER EXPIRED • ${opponentName.toUpperCase()} SCORED HIGHER` : "BETTER LUCK NEXT MATCH!")
                      }
                    </p>
                  </div>
                </div>

                {/* Stake/Earnings Card */}
                {isVictory ? (
                  <div className="z-10 mx-2 bg-gradient-to-br from-emerald-950/20 to-neutral-900/40 border border-emerald-500/20 rounded-2xl p-2.5 flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <Coins className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-left">
                        <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider block">Winnings Credited</span>
                        <span className="text-[9px] text-emerald-400 font-mono font-bold">Direct to Wallet</span>
                      </div>
                    </div>
                    <span className="text-xl font-black text-emerald-400 font-mono tracking-tight drop-shadow-[0_2px_4px_rgba(16,185,129,0.2)]">
                      +₹{(activeLudo.winningPrize ?? 0).toFixed(2)}
                    </span>
                  </div>
                ) : isDraw ? (
                  <div className="z-10 mx-2 bg-gradient-to-br from-sky-955/20 to-neutral-900/40 border border-sky-500/20 rounded-2xl p-2.5 flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-sky-500/10 rounded-xl border border-sky-500/20">
                        <Coins className="w-4 h-4 text-sky-400" />
                      </div>
                      <div className="text-left">
                        <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider block">Entry Refunded</span>
                        <span className="text-[9px] text-sky-400 font-mono font-bold">Returned to Wallet</span>
                      </div>
                    </div>
                    <span className="text-xl font-black text-sky-400 font-mono tracking-tight drop-shadow-[0_2px_4px_rgba(56,189,248,0.2)]">
                      +₹{(activeLudo.entryFee ?? 0).toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <div className="z-10 mx-2 bg-gradient-to-br from-neutral-950/40 to-neutral-900/20 border border-white/5 rounded-2xl p-2.5 flex flex-col justify-center shadow-inner">
                    <span className="text-[9px] text-rose-300/80 font-medium">
                      Unfortunate defeat! Let's practice and play again to recover stakes.
                    </span>
                  </div>
                )}

                {/* Interactive Scoreboard */}
                <div className={`z-10 bg-neutral-950/70 border rounded-2xl p-3.5 space-y-3 shadow-inner ${
                  isVictory ? 'border-amber-500/10' : isDraw ? 'border-sky-500/10' : 'border-rose-900/20'
                }`}>
                  <span className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-widest block text-center border-b border-neutral-800 pb-2">
                    📊 MATCH SUMMARY
                  </span>

                  <div className="flex items-center justify-between gap-1">
                    {/* Player (Self) */}
                    <div className="flex-1 flex flex-col items-center">
                      <div className="relative">
                        <div className="w-7 h-7 rounded-full bg-emerald-650/20 border-2 border-emerald-500 flex items-center justify-center text-xs font-bold text-emerald-200 shadow-md">
                          {userProfile?.username?.[0] || 'Y'}
                        </div>
                        <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border border-neutral-950 flex items-center justify-center text-[7px] text-white font-bold ${
                          myColor === 'red' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}>
                          {myColor === 'red' ? 'R' : 'Y'}
                        </span>
                      </div>
                      <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider mt-1.5 truncate max-w-[70px]">
                        {userProfile?.username?.split('_')[0] || 'YOU'}
                      </span>
                      <span className={`text-base font-black font-mono mt-0.5 ${isVictory ? 'text-emerald-400 drop-shadow-[0_2px_4px_rgba(16,185,129,0.2)]' : 'text-zinc-500'}`}>
                        {myScore}
                      </span>
                    </div>

                    <div className="px-1 flex flex-col items-center">
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">VS</span>
                      <div className="w-[1px] h-6 bg-neutral-800 my-0.5" />
                    </div>

                    {/* Opponent */}
                    <div className="flex-1 flex flex-col items-center">
                      <div className="relative">
                        <div className="w-7 h-7 rounded-full bg-zinc-700/20 border-2 border-zinc-500 flex items-center justify-center text-xs font-bold text-zinc-200 shadow-md">
                          {opponentName?.[0] || 'O'}
                        </div>
                        <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border border-neutral-950 flex items-center justify-center text-[7px] text-white font-bold ${
                          myColor === 'red' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}>
                          {myColor === 'red' ? 'Y' : 'R'}
                        </span>
                      </div>
                      <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider mt-1.5 truncate max-w-[70px]">
                        {(opponentName && opponentName.split ? opponentName.split('_')[0] : 'OPPONENT')}
                      </span>
                      <span className={`text-base font-black font-mono mt-0.5 ${(!isVictory && !isDraw) ? 'text-[#ffd700] drop-shadow-[0_2px_4px_rgba(251,191,36,0.2)]' : 'text-zinc-500'}`}>
                        {opponentScore}
                      </span>
                    </div>
                  </div>

                  {/* Progress Ratio Bar */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${myPercentage}%` }} 
                        className={`h-full transition-all duration-500 ${
                          myColor === 'red' 
                            ? 'bg-gradient-to-r from-red-500 to-rose-500' 
                            : 'bg-gradient-to-r from-yellow-400 to-amber-500'
                        }`} 
                      />
                      <div 
                        style={{ width: `${opponentPercentage}%` }} 
                        className={`h-full transition-all duration-500 ${
                          myColor === 'red' 
                            ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                            : 'bg-gradient-to-r from-red-500 to-rose-500'
                        }`} 
                      />
                    </div>
                    <div className="flex justify-between text-[7px] text-zinc-500 font-mono">
                      <span>{myPercentage}% YOU</span>
                      <span>{opponentPercentage}% OPPONENT</span>
                    </div>
                  </div>
                </div>

                {/* Fairness Seal */}
                <div className="z-10 flex flex-col items-center">
                  <div className="flex items-center gap-1 bg-neutral-900/60 px-3 py-1 rounded-full border border-neutral-800/80">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span className="text-[7.5px] font-mono font-bold tracking-wide text-zinc-400 uppercase">
                      RNG Certified Seed Handshake OK
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setGameRoute('LOBBY_CAROUSEL');
                    syncServerProfile();
                    syncTransactions();
                    resetGameState();
                  }}
                  className={`w-full py-3 text-neutral-955 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer z-10 shrink-0 shadow-lg hover:shadow-none active:scale-95 duration-200 ${
                    isVictory 
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-amber-500/20' 
                      : isDraw
                        ? 'bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 shadow-sky-500/20'
                        : 'bg-gradient-to-r from-zinc-300 to-zinc-400 hover:from-zinc-400 hover:to-zinc-500 shadow-zinc-500/10'
                  }`}
                  id="btn-victory-lobby"
                >
                  CONTINUE TO LOBBY
                </button>
              </div>
            );
          })()}
        </div>

        {/* Action dice controller bar */}
        <div className="space-y-3 shrink-0">
                {!activeLudo.winner && (
            <div className="flex flex-col items-center justify-center space-y-2 py-1.5">
              <div className="flex items-center gap-1">
                {activeLudo.turn === myColor ? (
                  <span className="text-[10px] text-emerald-400 font-extrabold uppercase animate-pulse bg-emerald-955/60 px-3.5 py-1 rounded-full border border-emerald-500/20 tracking-wider">
                    🟢 Roll or Lose Turn: {ludoTurnTimeRemaining}s Remaining
                  </span>
                ) : (
                  <span className="text-[10px] text-sky-400 font-extrabold uppercase animate-pulse bg-sky-955/40 px-3.5 py-1 rounded-full border border-sky-500/10 tracking-wider">
                    {opponent ? `${(opponentName && opponentName.split ? opponentName.split('_')[0] : 'OPPONENT')}'s Turn` : 'Waiting for Opponent...'}
                  </span>
                )}
              </div>

              <div className="relative p-2 rounded-full border-2 border-dashed border-rose-500/20 bg-neutral-950/60 shadow-inner">
                <LudoDice3D
                  roll={activeLudo.diceRoll}
                  isRolling={isRollingDice}
                  onClick={handleLudoDiceRollWithAnim}
                  disabled={activeLudo.turn !== myColor || activeLudo.diceHasRolled || isProcessing}
                  turn={activeLudo.turn}
                  turnTimeRemaining={ludoTurnTimeRemaining}
                />
              </div>
            </div>
          )}

          {/* Scrolling Mini logger */}
          <div className="h-14 overflow-y-auto bg-neutral-950/90 p-2.5 rounded-2xl border border-neutral-900 select-none text-[9px] font-mono leading-relaxed text-zinc-400 gap-1 flex flex-col justify-center text-left">
            {(activeLudo.logs ?? []).slice(0, 2).map((log, idx) => (
              <p key={idx} className={`${idx === 0 ? 'text-amber-400 font-bold' : 'text-neutral-500'}`}>
                📢 {log}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* SETTINGS GEAR MODAL OVERLAY */}
      {ludoSettingsOpen && (
        <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in animate-duration-200">
          <div className="w-full max-w-[300px] bg-[#1a1b22] border-2 border-[#fbbf24]/40 rounded-2xl p-5 shadow-2xl relative flex flex-col space-y-4 text-left">
            <div className="text-center">
              <h4 className="text-base font-extrabold text-[#fbbf24] uppercase tracking-wider">
                Arena Settings
              </h4>
              <p className="text-[8px] text-neutral-400 font-mono mt-0.5">Game Room ID: {activeLudo.matchId}</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-neutral-900/60 rounded-xl border border-white/5">
              <div>
                <span className="text-[11px] font-bold text-neutral-200 block">Game Sound Effect</span>
                <span className="text-[8px] text-neutral-400">Match alerts & rolling dice</span>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-10 h-5 rounded-full transition-colors relative outline-none cursor-pointer ${soundEnabled ? 'bg-emerald-500' : 'bg-neutral-800'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${soundEnabled ? 'right-0.5' : 'left-0.5'}`} style={{ right: soundEnabled ? '2px' : 'auto', left: soundEnabled ? 'auto' : '2px' }} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-neutral-900/60 rounded-xl border border-white/5">
              <div>
                <span className="text-[11px] font-bold text-neutral-200 block">Haptic Feedback</span>
                <span className="text-[8px] text-neutral-400">Vibrations on turns & roll</span>
              </div>
              <button
                onClick={() => setVibrationEnabled(!vibrationEnabled)}
                className={`w-10 h-5 rounded-full transition-colors relative outline-none cursor-pointer ${vibrationEnabled ? 'bg-emerald-500' : 'bg-neutral-800'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${vibrationEnabled ? 'right-0.5' : 'left-0.5'}`} style={{ right: vibrationEnabled ? '2px' : 'auto', left: vibrationEnabled ? 'auto' : '2px' }} />
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={handleLudoLeaveGame}
                className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-700 text-white font-extrabold text-[10px] rounded-xl uppercase tracking-wider shadow-md cursor-pointer hover:brightness-110 active:scale-95"
                id="btn-settings-leave"
              >
                Leave Game (Fold Hand)
              </button>
            </div>

            <button
              onClick={() => setLudoSettingsOpen(false)}
              className="absolute top-2 right-2 text-neutral-400 hover:text-white p-1 rounded-full bg-neutral-800 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
