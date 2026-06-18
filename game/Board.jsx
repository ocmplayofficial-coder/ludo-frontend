/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, Star, Heart } from 'lucide-react';
import Token from './Token.jsx';

// 52 common track cells matching standard Ludo paths
const LUDO_TRACK_COORDS = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7], // Green start corner
  [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14], // Blue start corner
  [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7], // Yellow start corner
  [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0], // Red starting entry
  [6, 0]
];

// Normalized Pos mapped to grid coordinate for RED
function getRedCoordinate(position) {
  if (position === -1) return [0, 0];
  if (position >= 0 && position <= 50) {
    return LUDO_TRACK_COORDS[(position + 39) % 52];
  }
  // Red Home Path (Green bottom arm runway)
  if (position === 51) return [13, 7];
  if (position === 52) return [12, 7];
  if (position === 53) return [11, 7];
  if (position === 54) return [10, 7];
  if (position === 55) return [9, 7];
  if (position === 56) return [8, 7];
  return [7, 7]; // Center home
}

// Normalized Pos mapped to grid coordinate for YELLOW
function getYellowCoordinate(position) {
  if (position === -1) return [0, 0];
  if (position >= 0 && position <= 50) {
    return LUDO_TRACK_COORDS[(position + 13) % 52];
  }
  // Yellow Home Path (Blue top arm runway)
  if (position === 51) return [1, 7];
  if (position === 52) return [2, 7];
  if (position === 53) return [3, 7];
  if (position === 54) return [4, 7];
  if (position === 55) return [5, 7];
  if (position === 56) return [6, 7];
  return [7, 7]; // Center home
}

const SAFE_CELLS = [0, 8, 13, 21, 26, 34, 39, 47];

// Web Audio API Sound Synthesizer for high fidelity retro pops
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

export function playMoveSound() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(290, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(740, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.start();
    osc.stop(ctx.currentTime + 0.11);
  } catch (e) {
    console.error("Audio step error:", e);
  }
}

export function playDiceSound() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    for (let i = 0; i < 7; i++) {
      const time = now + i * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'triangle';
      const pitch = 220 + Math.random() * 260;
      osc.frequency.setValueAtTime(pitch, time);

      gain.gain.setValueAtTime(0.11, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.04);

      osc.start(time);
      osc.stop(time + 0.05);
    }
  } catch (e) {
    console.error("Audio roll error:", e);
  }
}

export function playSafeZoneSound() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((pitch, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, now + idx * 0.08);

      gain.gain.setValueAtTime(0.14, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.22);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.25);
    });
  } catch (e) {
    console.error("Audio safe-zone error:", e);
  }
}

// Helpers to know if a coordinate is considered a star or home-path safe zone
function isPositionSafe(color, position) {
  if (position === -1) return false;
  if (position >= 51) return true; // Safe in Home runway / Pocket
  const trackIndex = color === 'red' ? (position + 39) % 52 : (position + 13) % 52;
  return SAFE_CELLS.includes(trackIndex);
}

export default function Board({ game, myColor, onTokenClick, isProcessing }) {
  const activeColor = myColor || 'red';

  const hasRed = !!game?.players?.red;
  const hasYellow = !!game?.players?.yellow;
  const bothPlayersReady = hasRed && hasYellow;

  console.log('WAIT CHECK', {
    currentUserColor: myColor,
    players: game?.players,
    waitingForPlayers: game?.waitingForPlayers,
    bothPlayersJoined: game?.bothPlayersJoined,
    gameStatus: game?.status,
  });

  // Toggle Board Style mode (royal classic cream light theme default vs dark luxury pitch-black theme)
  const [isAlternateTheme, setIsAlternateTheme] = React.useState(true);

  // Set up the state for the tokens that we actually render on the board to enable step-by-step box hops
  const [visualTokens, setVisualTokens] = React.useState(() => game?.tokens || []);
  const activeIntervalsRef = React.useRef([]);

  // Update visualTokens step-by-step when game.tokens changes
  React.useEffect(() => {
    if (!game?.tokens) return;

    // Clear all previously running animation intervals to prevent leaks
    activeIntervalsRef.current.forEach(id => clearInterval(id));
    activeIntervalsRef.current = [];

    if (visualTokens.length === 0) {
      setVisualTokens(game.tokens);
      return;
    }

    const newVisuals = [...visualTokens];
    let hasStartedAnyStep = false;

    game.tokens.forEach((targetTok) => {
      const idx = newVisuals.findIndex(t => t.id === targetTok.id);
      if (idx === -1) return;

      const visTok = newVisuals[idx];
      const startPos = visTok.position;
      const targetPos = targetTok.position;

      if (startPos !== targetPos) {
        if (targetPos === -1 || targetPos < startPos) {
          setVisualTokens(prev => prev.map(t => t.id === targetTok.id ? { ...targetTok } : t));
        } else {
          hasStartedAnyStep = true;
          let step = startPos;

          const intervalId = setInterval(() => {
            step = step === -1 ? 0 : step + 1;

            setVisualTokens(prev => {
              return prev.map(t => {
                if (t.id === targetTok.id) {
                  return { ...t, position: step };
                }
                return t;
              });
            });

            if (step >= targetPos) {
              const isSafe = isPositionSafe(targetTok.color, targetPos);
              if (isSafe) {
                try {
                  playSafeZoneSound();
                } catch (err) { }
              } else {
                try {
                  playMoveSound();
                } catch (err) { }
              }
              clearInterval(intervalId);
              activeIntervalsRef.current = activeIntervalsRef.current.filter(id => id !== intervalId);
            } else {
              try {
                playMoveSound();
              } catch (err) { }
            }
          }, 220);
          activeIntervalsRef.current.push(intervalId);
        }
      }
    });

    if (!hasStartedAnyStep) {
      setVisualTokens(game.tokens);
    } else {
      setVisualTokens(prev => {
        return prev.map(vt => {
          const matchingTarget = game?.tokens?.find(t => t.id === vt.id);
          if (!matchingTarget) return vt;
          const isAnimating = matchingTarget.position > vt.position && vt.position !== -1;
          return isAnimating ? vt : { ...matchingTarget };
        });
      });
    }

    return () => {
      activeIntervalsRef.current.forEach(id => clearInterval(id));
    };
  }, [game?.tokens]);

  const getPlayerScore = (color) => {
    const tokens = visualTokens.filter(t => t.color === color);
    const scoreSum = tokens.reduce((acc, t) => {
      if (t.position === -1) return acc;
      if (t.position === 57) return acc + 57;
      return acc + t.position;
    }, 0);
    return scoreSum;
  };

  const isTokenPlayable = (tok) => {
    return (
      tok.color === activeColor &&
      game.turn === activeColor &&
      game.diceHasRolled &&
      (tok.position !== -1 || game.diceRoll === 6) &&
      (tok.position + (game.diceRoll || 0) <= 57)
    );
  };

  function getTokenCoordinates(token) {
    if (token.position === -1) {
      return [-2, -2];
    }
    return token.color === 'red' ? getRedCoordinate(token.position) : getYellowCoordinate(token.position);
  }

  function getTokensAt(row, col) {
    return visualTokens.filter(tok => {
      if (tok.position === -1) return false;
      const coord = getTokenCoordinates(tok);
      return coord[0] === row && coord[1] === col;
    });
  }

  const redTokensInBase = visualTokens.filter(t => t.color === 'red' && t.position === -1);
  const yellowTokensInBase = visualTokens.filter(t => t.color === 'yellow' && t.position === -1);

  const gridCells = [];

  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      if (
        (r < 6 && c < 6) || // Top-Left Base (Yellow)
        (r < 6 && c > 8) || // Top-Right Base (Blue)
        (r > 8 && c < 6) || // Bottom-Left Base (Green)
        (r > 8 && c > 8)    // Bottom-Right Base (Red)
      ) {
        continue;
      }

      let cellClass = "flex items-center justify-center relative select-none rounded-[3px] transition-all duration-250 ";
      let bgStyle = isAlternateTheme
        ? "bg-white border border-neutral-200 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
        : "bg-gradient-to-br from-[#1c1d28] to-[#12131d] border border-neutral-800/40 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]";
      let cellElement = null;

      if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
        if (r === 7 && c === 7) {
          bgStyle = "bg-[#7f000e] border-2 border-[#ffd700] rounded-full scale-105 z-10 shadow-[0_4px_12px_rgba(0,0,0,0.3)] flex items-center justify-center";
          cellClass += " border-none";
          cellElement = (
            <svg viewBox="0 0 24 24" className="w-5.5 h-5.5 text-white fill-white animate-pulse filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
          );
        } else {
          if (r === 7 && c === 6) {
            bgStyle = isAlternateTheme
              ? "bg-[#3b82f6] border border-blue-300"
              : "bg-gradient-to-r from-blue-650/25 to-blue-550/10 border border-blue-500/20";
          } else if (r === 7 && c === 8) {
            bgStyle = isAlternateTheme
              ? "bg-[#10b981] border border-emerald-300"
              : "bg-gradient-to-l from-emerald-650/25 to-emerald-550/10 border border-emerald-500/20";
          } else if (r === 6 && c === 7) {
            bgStyle = isAlternateTheme
              ? "bg-[#fbbf24] border border-amber-300"
              : "bg-gradient-to-b from-amber-600/35 to-amber-550/10 border border-amber-500/20 shadow-[0_0_4px_rgba(245,158,11,0.15)]";
          } else if (r === 8 && c === 7) {
            bgStyle = isAlternateTheme
              ? "bg-[#ef4444] border border-rose-300"
              : "bg-gradient-to-t from-rose-650/25 to-rose-550/10 border border-rose-500/20 shadow-[0_0_4px_rgba(239,68,68,0.15)]";
          } else {
            bgStyle = isAlternateTheme ? "bg-[#eaeaea] border border-neutral-300" : "bg-[#181114] border border-neutral-900/50";
          }
        }
      }
      else {
        if (r === 7 && c >= 1 && c <= 5) {
          bgStyle = isAlternateTheme
            ? "bg-[#3b82f6] border border-blue-400"
            : "bg-gradient-to-r from-blue-600/15 via-blue-500/10 to-blue-550/5 border border-blue-500/10";
        }
        else if (r === 7 && c >= 9 && c <= 13) {
          bgStyle = isAlternateTheme
            ? "bg-[#10b981] border border-emerald-400"
            : "bg-gradient-to-l from-emerald-600/15 via-emerald-500/10 to-emerald-555/5 border border-emerald-500/10";
        }
        else if (r >= 1 && r <= 5 && c === 7) {
          bgStyle = isAlternateTheme
            ? "bg-[#ffcd1e] border border-amber-400"
            : "bg-gradient-to-b from-amber-600/30 via-amber-500/22 to-amber-500/10 border border-amber-500/30 shadow-[inset_0_1.5px_3px_rgba(245,158,11,0.15)]";
        }
        else if (r >= 9 && r <= 13 && c === 7) {
          bgStyle = isAlternateTheme
            ? "bg-[#ef4444] border border-rose-450"
            : "bg-gradient-to-t from-rose-600/30 via-rose-500/22 to-rose-500/10 border border-rose-500/30 shadow-[inset_0_1.5px_3px_rgba(239,68,68,0.15)]";
        }
        else if (r === 13 && c === 6) {
          bgStyle = isAlternateTheme
            ? "bg-[#ef4444] border border-rose-500"
            : "bg-gradient-to-br from-rose-500/35 to-rose-600/10 border border-rose-400/40";
        }
        else if (r === 1 && c === 8) {
          bgStyle = isAlternateTheme
            ? "bg-[#ffcd1e] border border-amber-400"
            : "bg-gradient-to-br from-amber-500/35 to-amber-600/10 border border-amber-400/40";
        }
        else if (r === 6 && c === 1) {
          bgStyle = isAlternateTheme ? "bg-[#3b82f6] border border-blue-300" : "bg-blue-500/12 border border-blue-500/15";
        }
        else if (r === 8 && c === 13) {
          bgStyle = isAlternateTheme ? "bg-[#10b981] border border-emerald-300" : "bg-emerald-500/12 border border-emerald-500/15";
        }
      }

      const isTrackCell = LUDO_TRACK_COORDS.some((coord, idx) => {
        if (coord[0] === r && coord[1] === c) {
          if (SAFE_CELLS.includes(idx)) {
            if (idx === 39) {
              bgStyle = isAlternateTheme
                ? "bg-[#ef4444] border border-rose-600 shadow-md text-white"
                : "bg-gradient-to-br from-rose-600/35 to-rose-800/15 border-2 border-rose-500/40 shadow-[0_0_8px_rgba(239,68,68,0.25)]";
              cellElement = (
                <div className="flex flex-col items-center justify-center relative scale-80 pointer-events-none">
                  <Star className="w-3.5 h-3.5 text-white fill-amber-300 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
                  <span className="absolute text-[5px] font-black text-white uppercase tracking-wider top-[10.5px] scale-[0.65] font-sans">START</span>
                </div>
              );
            } else if (idx === 13) {
              bgStyle = isAlternateTheme
                ? "bg-[#ffcd1e] border border-amber-600 shadow-md text-white"
                : "bg-gradient-to-br from-amber-600/35 to-amber-800/15 border-2 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.25)]";
              cellElement = (
                <div className="flex flex-col items-center justify-center relative scale-80 pointer-events-none">
                  <Star className="w-3.5 h-3.5 text-white fill-amber-300 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />
                  <span className="absolute text-[5px] font-black text-white uppercase tracking-wider top-[10.5px] scale-[0.65] font-sans">START</span>
                </div>
              );
            } else {
              bgStyle = isAlternateTheme
                ? "bg-white border border-neutral-200 shadow-inner"
                : "bg-gradient-to-b from-amber-500/15 to-neutral-900 border border-amber-500/35 shadow-[inset_0_1px_3px_rgba(245,158,11,0.05)]";
              cellElement = (
                <Star className="w-3.5 h-3.5 text-[#d97706] fill-[#fbc11d] filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.15)] animate-pulse" />
              );
            }
          }
          return true;
        }
        return false;
      });

      const activeTokens = getTokensAt(r, c);

      gridCells.push(
        <div
          key={`cell-${r}-${c}`}
          className={`${cellClass} ${bgStyle} aspect-square h-full w-full relative`}
          style={{ gridRowStart: r + 1, gridColumnStart: c + 1 }}
        >
          {cellElement}

          {activeTokens.length > 0 && (
            <div className={`absolute inset-0 flex items-center justify-center z-20 ${activeTokens.length > 1 ? 'scale-[0.88]' : ''}`}>
              {activeTokens.map((tok, index) => {
                const isPlayable = isTokenPlayable(tok);
                const total = activeTokens.length;

                let tx = 0;
                let ty = 0;
                if (total > 1) {
                  const angle = (index * (2 * Math.PI)) / total - Math.PI / 4;
                  tx = Math.cos(angle) * 3;
                  ty = Math.sin(angle) * 1.5;
                }

                return (
                  <div
                    key={tok.id}
                    className="absolute transition-all duration-300"
                    style={{
                      transform: `translate(${tx}px, ${ty}px)`,
                      zIndex: 10 + index + (isPlayable ? 15 : 0)
                    }}
                  >
                    <Token
                      color={tok.color}
                      isPlayable={isPlayable}
                      disabled={!isPlayable || isProcessing}
                      onClick={() => onTokenClick(tok.id)}
                      size={total > 1 ? 'small' : 'normal'}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div
      className={`w-full max-w-[350px] aspect-square mx-auto border-[5px] rounded-[30px] p-2 transition-colors duration-300 relative select-none ${isAlternateTheme
        ? "bg-white border-[#f0f0f3] shadow-[0_15px_45px_-10px_rgba(0,0,0,0.4)]"
        : "bg-[#12131a] border-[#fbc11d]/20 shadow-[0_20px_40px_rgba(0,0,0,0.65),0_0_25px_rgba(251,193,29,0.06)]"
        }`}
    >
      <button
        onClick={() => setIsAlternateTheme(!isAlternateTheme)}
        className="absolute top-[-28px] right-1 flex items-center gap-1 px-2.5 py-1 rounded-full border font-sans font-bold text-[8.5px] tracking-wide cursor-pointer transition-all duration-300 z-50 shadow-md transform hover:scale-105 active:scale-95"
        style={{
          backgroundColor: isAlternateTheme ? '#1e293b' : '#ffffff',
          color: isAlternateTheme ? '#ffffff' : '#0f172a',
          borderColor: isAlternateTheme ? '#334155' : '#e2e8f0'
        }}
      >
        <span>{isAlternateTheme ? "🌙 Luxury Theme" : "💡 Light Mode"}</span>
      </button>

      <div
        className={`grid grid-cols-15 grid-rows-15 w-full h-full gap-[2.5px] rounded-2xl overflow-hidden relative border transition-colors duration-300 ${isAlternateTheme
          ? "bg-[#d4d4d8] border-neutral-200"
          : "bg-[#0c0d12] border-white/5"
          }`}
      >

        <div
          className="bg-gradient-to-br from-[#3b82f6] via-[#1d5ec9] to-[#0f3c88] rounded-2xl border-2 border-blue-400/40 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden"
          style={{ gridRow: '1 / span 6', gridColumn: '1 / span 6' }}
        >
          <div className="absolute inset-0 opacity-15 border-[8px] border-black/30 pointer-events-none rounded-xl" />
          <div className="w-13 h-13 rounded-full bg-white/10 border-2 border-[#fff]/20 flex items-center justify-center relative z-10 shadow-lg">
            <div className="w-7 h-7 rounded-full bg-neutral-950/20" />
          </div>
        </div>

        <div
          className="bg-gradient-to-br from-[#fbc11d] via-[#dca010] to-[#996c00] rounded-2xl border-2 border-amber-400/40 p-2 flex flex-col justify-between shadow-2xl text-white font-sans overflow-hidden relative"
          style={{ gridRow: '1 / span 6', gridColumn: '10 / span 6' }}
        >
          <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

          <div className="absolute left-[-1.5px] bottom-[3.5px] px-2 py-0.5 bg-gradient-to-r from-[#ffe42e] to-[#f5b307] border border-amber-300 text-neutral-950 font-black text-[7.5px] rounded-r-md uppercase flex items-center justify-center transform -rotate-[5deg] shadow-lg z-30 tracking-wider">
            {activeColor === 'yellow' ? 'SELF' : 'OPPONENT'}
          </div>

          <div className="flex items-center justify-between w-full relative z-10">
            <div className="flex items-center gap-0.5 bg-black/20 px-1.5 py-0.5 rounded-full border border-white/5">
              {[1, 2, 3].map((heart) => {
                const isActive = (game.yellowLives ?? 3) >= heart;
                return (
                  <Heart
                    key={heart}
                    className={`w-2.5 h-2.5 transition-all duration-500 transform ${
                      isActive
                        ? 'text-rose-500 fill-rose-500 scale-100 rotate-0 filter drop-shadow-[0_0_4px_rgba(244,63,94,0.6)]'
                        : 'text-neutral-500 fill-none scale-50 rotate-45 opacity-10'
                    }`}
                  />
                );
              })}
            </div>
            <span className="text-[6px] font-black uppercase text-amber-900 bg-white px-1.5 py-0.5 rounded-full tracking-wider shadow-md">
              LAST MOVER
            </span>
          </div>

          <div className="flex items-center justify-between space-x-1 w-full my-auto relative z-10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#fb923c] to-[#fed7aa] border-[1.5px] border-white/60 shadow-lg p-0.5 overflow-hidden flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M15 45 C15 15, 85 15, 85 45 C85 45, 90 20, 75 10 C60 0, 40 0, 25 10 C10 20, 15 45, 15 45 Z" fill="#18181b" />
                <circle cx="50" cy="55" r="32" fill="#fed7aa" />
                <ellipse cx="40" cy="53" r="4.5" rx="3.5" ry="4.5" fill="#18181b" />
                <ellipse cx="60" cy="53" r="4.5" rx="3.5" ry="4.5" fill="#18181b" />
                <ellipse cx="36" cy="62" rx="4" ry="2" fill="#fca5a5" opacity="0.6" />
                <ellipse cx="64" cy="62" rx="4" ry="2" fill="#fca5a5" opacity="0.6" />
                <path d="M43 68 Q50 75 57 68" fill="none" stroke="#18181b" strokeWidth="3" strokeLinecap="round" />
                <path d="M30 87 L50 78 L70 87 C70 87, 65 98, 50 98 C35 98, 30 87, 30 87 Z" fill="#f97316" />
              </svg>
            </div>

            <div className="bg-white/95 rounded-lg px-2 py-0.5 shadow-md border border-neutral-100 flex flex-col items-center justify-center min-w-[48px]">
              <span className="text-[6px] uppercase font-bold text-neutral-400 tracking-wider">Score</span>
              <span className="text-xs font-black text-neutral-800 leading-none mt-0.5">{game.scores?.yellow ?? 0}</span>
            </div>
          </div>

          <div className="w-full flex items-center justify-between gap-1 mt-0.5 relative z-10">
            <div className="flex-1 bg-black/20 border border-white/5 py-0.5 px-1.5 rounded-md text-center text-[7.5px] font-mono font-bold tracking-wider text-amber-100 truncate">
              {(bothPlayersReady ? (game?.players?.yellow?.username || 'Opponent') : 'Waiting for opponent...')}
            </div>

            <div className="flex gap-0.5 p-0.5 bg-black/25 rounded-md min-w-[34px] min-h-[16px] justify-center items-center border border-white/5">
              {yellowTokensInBase.map((tok) => {
                const isPlayable = isTokenPlayable(tok);
                return (
                  <div key={tok.id} className="w-3.5 h-3.5 flex items-center justify-center">
                    <Token
                      color="yellow"
                      isPlayable={isPlayable}
                      disabled={!isPlayable || isProcessing}
                      onClick={() => onTokenClick(tok.id)}
                      size="small"
                    />
                  </div>
                );
              })}
              {yellowTokensInBase.length === 0 && (
                <span className="text-[5.5px] font-black text-emerald-400 tracking-wider text-center leading-none uppercase">Out</span>
              )}
            </div>
          </div>
        </div>

        <div
          className="bg-gradient-to-br from-[#ef4444] via-[#dc2626] to-[#991b1b] rounded-2xl border-2 border-rose-500/40 p-2 flex flex-col justify-between shadow-2xl text-white font-sans overflow-hidden relative"
          style={{ gridRow: '10 / span 6', gridColumn: '1 / span 6' }}
        >
          <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

          <div className="absolute left-[-1.5px] bottom-[3.5px] px-2 py-0.5 bg-gradient-to-r from-[#ffe42e] to-[#f5b307] border border-amber-300 text-neutral-950 font-black text-[7.5px] rounded-r-md uppercase flex items-center justify-center transform -rotate-[5deg] shadow-lg z-30 tracking-wider">
            {activeColor === 'red' ? 'SELF' : 'OPPONENT'}
          </div>

          <div className="flex items-center justify-between w-full relative z-10">
            <div className="flex items-center gap-0.5 bg-black/20 px-1.5 py-0.5 rounded-full border border-white/5">
              {[1, 2, 3].map((heart) => {
                const isActive = (game.redLives ?? 3) >= heart;
                return (
                  <Heart
                    key={heart}
                    className={`w-2.5 h-2.5 transition-all duration-500 transform ${
                      isActive
                        ? 'text-rose-500 fill-rose-500 scale-100 rotate-0 filter drop-shadow-[0_0_4px_rgba(244,63,94,0.6)]'
                        : 'text-neutral-500 fill-none scale-50 rotate-45 opacity-10'
                    }`}
                  />
                );
              })}
            </div>

            <span className="text-[6.5px] font-black uppercase text-rose-900 bg-white px-1.5 py-0.5 rounded-full tracking-wider shadow-md">
              FIRST MOVER
            </span>
          </div>

          <div className="flex items-center justify-between space-x-1 w-full my-auto relative z-10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ec4899] to-[#f472b6] border-[1.5px] border-white/60 shadow-lg p-0.5 overflow-hidden flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <path d="M20 40 Q50 15 80 40 L80 70 Q50 90 20 70 Z" fill="#3f3f46" />
                <circle cx="50" cy="54" r="32" fill="#fed7aa" />
                <path d="M18 38 C28 20, 72 20, 82 38" fill="none" stroke="#27272a" strokeWidth="8" strokeLinecap="round" />
                <circle cx="41" cy="53" r="3.5" fill="#27272a" />
                <circle cx="59" cy="53" r="3.5" fill="#27272a" />
                <ellipse cx="36" cy="62" rx="4.5" ry="2.5" fill="#f43f5e" opacity="0.4" />
                <ellipse cx="64" cy="62" rx="4.5" ry="2.5" fill="#f43f5e" opacity="0.4" />
                <path d="M45 66 Q50 72 55 66" fill="none" stroke="#27272a" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M30 87 L50 76 L70 87 C70 87, 65 98, 50 98 C35 98, 30 87, 30 87 Z" fill="#a855f7" />
              </svg>
            </div>

            <div className="bg-white/95 rounded-lg px-2 py-0.5 shadow-md border border-neutral-100 flex flex-col items-center justify-center min-w-[48px]">
              <span className="text-[6px] uppercase font-bold text-neutral-400 tracking-wider">Score</span>
              <span className="text-xs font-black text-neutral-800 leading-none mt-0.5">{game.scores?.red ?? 0}</span>
            </div>
          </div>

          <div className="w-full flex items-center justify-end gap-1.5 mt-0.5 pl-6 relative z-10">
            <div className="flex gap-0.5 bg-black/15 px-1 py-0.5 rounded-md">
              <span className="w-1.5 h-1 bg-rose-455 opacity-60 rounded-sm" />
              <span className="w-1.5 h-1 bg-rose-455 opacity-60 rounded-sm" />
              <span className="w-1.5 h-1 bg-rose-455 opacity-60 rounded-sm" />
            </div>

            <div className="flex gap-0.5 p-0.5 bg-black/25 rounded-md min-w-[34px] min-h-[16px] justify-center items-center border border-white/5">
              {redTokensInBase.map((tok) => {
                const isPlayable = isTokenPlayable(tok);
                return (
                  <div key={tok.id} className="w-3.5 h-3.5 flex items-center justify-center">
                    <Token
                      color="red"
                      isPlayable={isPlayable}
                      disabled={!isPlayable || isProcessing}
                      onClick={() => onTokenClick(tok.id)}
                      size="small"
                    />
                  </div>
                );
              })}
              {redTokensInBase.length === 0 && (
                <span className="text-[5.5px] font-black text-emerald-400 tracking-wider text-center leading-none uppercase">Out</span>
              )}
            </div>
          </div>
        </div>

        <div
          className="bg-gradient-to-br from-[#15a374] via-[#097753] to-[#044c35] rounded-2xl border-2 border-emerald-500/40 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden"
          style={{ gridRow: '10 / span 6', gridColumn: '10 / span 6' }}
        >
          <div className="absolute inset-0 opacity-15 border-[8px] border-black/30 pointer-events-none rounded-xl" />
          <div className="w-13 h-13 rounded-full bg-white/10 border-2 border-[#fff]/20 flex items-center justify-center relative z-10 shadow-lg">
            <div className="w-7 h-7 rounded-full bg-neutral-950/20" />
          </div>
        </div>

        {gridCells}
      </div>

      <div className="absolute top-1 left-2 flex items-center gap-1.5 opacity-40 pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full bg-[#fbc11d] anim-pulse" />
        <span className="text-[7.5px] font-bold text-white tracking-wide">RNG Secured Board</span>
      </div>
    </div>
  );
}
