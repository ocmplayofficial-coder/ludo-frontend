/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { playRollSound, playStopSound } from '../audio/AudioManager';

export default function Dice({
  roll,
  isRolling,
  onClick,
  disabled,
  turn,
  turnTimeRemaining
}) {
  // Map roll values to explicit 3D face angles
  const getFaceTransform = (val) => {
    switch (val) {
      case 1: return 'rotateX(10deg) rotateY(15deg) rotateZ(-5deg)';
      case 2: return 'rotateX(190deg) rotateY(15deg) rotateZ(175deg)';
      case 3: return 'rotateX(10deg) rotateY(105deg) rotateZ(-5deg)';
      case 4: return 'rotateX(10deg) rotateY(-75deg) rotateZ(-5deg)';
      case 5: return 'rotateX(-80deg) rotateY(15deg) rotateZ(-5deg)';
      case 6: return 'rotateX(100deg) rotateY(15deg) rotateZ(-5deg)';
      default: return 'rotateX(20deg) rotateY(30deg) rotateZ(-12deg)'; // Tilted default idle look
    }
  };

  const activeRoll = roll || 1;
  const [currentTransform, setCurrentTransform] = useState(getFaceTransform(activeRoll));
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isRolling) {
      setIsAnimating(true);
      const startTime = performance.now();
      let animId;

      const animate = (now) => {
        const elapsed = now - startTime;
        const duration = 900; // Professional casino sequence duration 900ms
        const fraction = Math.min(elapsed / duration, 1);

        // 1. Scale Up & Bounce (translate Y in arc)
        const scale = 1 + Math.sin(fraction * Math.PI) * 0.35; // scales up to 1.35
        const translateY = Math.sin(fraction * Math.PI) * -35; // bounce up to -35px

        // 2. Multi-axis rotatory spin
        const rotX = fraction * 720;
        const rotY = fraction * 1080;
        const rotZ = fraction * 360;

        setCurrentTransform(`translateY(${translateY}px) scale(${scale}) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`);

        if (fraction < 1) {
          animId = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          setCurrentTransform(getFaceTransform(activeRoll));
        }
      };

      animId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animId);
    } else {
      setIsAnimating(false);
      setCurrentTransform(getFaceTransform(activeRoll));
    }
  }, [isRolling, activeRoll]);

const firstRender = useRef(true);

  // Play dice sounds on roll start and stop (skip first render)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (isRolling) {
      playRollSound();
    } else {
      playStopSound();
    }
  }, [isRolling]);

  // Render white pips / dots inside 48x48 dice face
  const renderPips = (num) => {
    const dotStyle = "w-2.5 h-2.5 rounded-full bg-white border border-black/10 shadow-inner shrink-0";
    
    switch (num) {
      case 1:
        return (
          <div className="absolute inset-0 flex items-center justify-center p-1.5">
            <div className={dotStyle} />
          </div>
        );
      case 2:
        return (
          <div className="absolute inset-0 flex justify-between p-2 flex-col h-full items-between">
            <div className={`${dotStyle} self-start`} />
            <div className={`${dotStyle} self-end`} />
          </div>
        );
      case 3:
        return (
          <div className="absolute inset-0 flex justify-between p-2 flex-col h-full">
            <div className={`${dotStyle} self-start`} />
            <div className={`${dotStyle} self-center`} />
            <div className={`${dotStyle} self-end`} />
          </div>
        );
      case 4:
        return (
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 p-2.5 gap-2.5">
            <div className={dotStyle} />
            <div className={dotStyle} />
            <div className={dotStyle} />
            <div className={dotStyle} />
          </div>
        );
      case 5:
        return (
          <div className="absolute inset-0 p-2 h-full flex flex-col justify-between">
            <div className="flex justify-between w-full">
              <div className={dotStyle} />
              <div className={dotStyle} />
            </div>
            <div className="flex justify-center w-full">
              <div className={dotStyle} />
            </div>
            <div className="flex justify-between w-full">
              <div className={dotStyle} />
              <div className={dotStyle} />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="absolute inset-0 grid grid-cols-2 p-2 gap-1 justify-items-center items-center h-full">
            <div className={dotStyle} />
            <div className={dotStyle} />
            <div className={dotStyle} />
            <div className={dotStyle} />
            <div className={dotStyle} />
            <div className={dotStyle} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 relative">
      <style>{`
        .dice-perspective {
          perspective: 600px;
        }
        .dice-cube {
          width: 48px;
          height: 48px;
          position: relative;
          transform-style: preserve-3d;
        }
        .dice-face {
          position: absolute;
          width: 48px;
          height: 48px;
          border: 1.5px solid rgba(0,0,0,0.15);
          border-radius: 12px;
          box-shadow: inset 0 0 8px rgba(255,255,255,0.3), 0 3px 5px rgba(0,0,0,0.25);
        }
      `}</style>

      {/* Outer Glow Color Pad Region */}
      <div 
        onClick={() => {
          if (!disabled && !isRolling) {
            onClick();
          }
        }}
        className={`
          w-28 h-28 rounded-full flex items-center justify-center bg-rose-200/20 shadow-inner relative select-none cursor-pointer transition-all duration-300
          ${!disabled ? 'scale-102 hover:scale-105 hover:bg-rose-200/25 active:scale-95' : 'opacity-80'}
          ${turn === 'red' && !disabled ? 'ring-4 ring-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.5)]' : ''}
          ${turn === 'yellow' && !disabled ? 'ring-4 ring-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : ''}
        `}
      >
        {/* Circular Progress Indicator Line (Rose for Red player, Yellow for opponent) */}
        {turnTimeRemaining !== undefined && (
          <svg className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none z-25" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="46"
              stroke={turn === 'red' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)'}
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              stroke={turn === 'red' ? '#f43f5e' : '#fbbf24'}
              strokeWidth="4"
              fill="transparent"
              strokeDasharray="289"
              strokeDashoffset={289 - (289 * turnTimeRemaining) / 18}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
              style={{
                filter: turn === 'red' ? 'drop-shadow(0 0 4px rgba(244,63,94,0.5))' : 'drop-shadow(0 0 4px rgba(245,158,11,0.5))'
              }}
            />
          </svg>
        )}

        {/* Pulsing visual halo to represent active turn */}
        {!disabled && (
          <span className={`absolute -inset-1 rounded-full animate-ping opacity-60 pointer-events-none ${
            turn === 'red' ? 'bg-rose-500/20' : 'bg-amber-500/20'
          }`} />
        )}
        
        {/* Shimmer flare glow */}
        <span className="absolute inset-1.5 rounded-full bg-radial from-rose-400/20 to-transparent pointer-events-none" />

        <div className="dice-perspective flex items-center justify-center w-14 h-14">
          <div 
            className="dice-cube"
            style={{
              transform: currentTransform,
              transition: isAnimating ? 'none' : 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            {/* Front Face (1) */}
            <div className="dice-face bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600" style={{ transform: 'rotateY(0deg) translateZ(24px)' }}>
              {renderPips(1)}
            </div>
            {/* Back Face (2) */}
            <div className="dice-face bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600" style={{ transform: 'rotateY(180deg) translateZ(24px)' }}>
              {renderPips(2)}
            </div>
            {/* Left Face (3) */}
            <div className="dice-face bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600" style={{ transform: 'rotateY(-90deg) translateZ(24px)' }}>
              {renderPips(3)}
            </div>
            {/* Right Face (4) */}
            <div className="dice-face bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600" style={{ transform: 'rotateY(90deg) translateZ(24px)' }}>
              {renderPips(4)}
            </div>
            {/* Top Face (5) */}
            <div className="dice-face bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600" style={{ transform: 'rotateX(90deg) translateZ(24px)' }}>
              {renderPips(5)}
            </div>
            {/* Bottom Face (6) */}
            <div className="dice-face bg-gradient-to-br from-rose-400 via-rose-500 to-rose-600" style={{ transform: 'rotateX(-90deg) translateZ(24px)' }}>
              {renderPips(6)}
            </div>
          </div>
        </div>
      </div>

      <span className="text-[10px] font-black uppercase text-rose-400 mt-2 tracking-widest leading-none select-none">
        {isRolling ? 'Rolling...' : (!disabled ? 'TAP DICE TO ROLL' : 'Opponent Playing')}
      </span>
    </div>
  );
}
