/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export default function Token({
  color,
  isPlayable,
  onClick,
  disabled,
  size = 'normal'
}) {
  const colorGradients = {
    red: {
      head: 'from-rose-400 via-rose-500 to-rose-600',
      body: 'from-rose-500 via-rose-600 to-rose-700',
      shadow: 'rgba(239,68,68,0.3)',
      ringGlow: 'ring-rose-400'
    },
    yellow: {
      head: 'from-amber-300 via-amber-400 to-amber-600',
      body: 'from-amber-400 via-amber-500 to-amber-700',
      shadow: 'rgba(245,158,11,0.3)',
      ringGlow: 'ring-amber-400'
    },
    green: {
      head: 'from-emerald-300 via-emerald-400 to-emerald-600',
      body: 'from-emerald-400 via-emerald-500 to-emerald-700',
      shadow: 'rgba(16,185,129,0.3)',
      ringGlow: 'ring-emerald-400'
    },
    blue: {
      head: 'from-sky-300 via-blue-400 to-blue-600',
      body: 'from-sky-400 via-blue-500 to-blue-700',
      shadow: 'rgba(59,130,246,0.3)',
      ringGlow: 'ring-blue-400'
    }
  }[color || 'green'];

  const sizeClass = size === 'small' ? {
    box: 'w-4 h-4',
    head: 'w-2 h-2',
    collar: 'w-2.5 h-[2px]',
    body: 'w-3 h-3.5',
    shadowY: '1px'
  } : {
    box: 'w-7 h-7',
    head: 'w-3 h-3',
    collar: 'w-3.5 h-[3px]',
    body: 'w-4 h-4.5',
    shadowY: '1.5px'
  };

  return (
    <button
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        relative flex flex-col items-center justify-center shrink-0 ${sizeClass.box} select-none transition-all duration-300
        ${isPlayable ? 'cursor-pointer hover:scale-130 active:scale-95 animate-bounce z-30' : 'cursor-not-allowed scale-100'}
      `}
    >
      {/* Playable Outer Ring Glow */}
      {isPlayable && (
        <span className={`absolute -inset-0.5 rounded-full bg-white/25 animate-ping opacity-75 ${colorGradients.ringGlow}`} />
      )}

      {/* Styled Peg Shadow */}
      <span 
        className="absolute bottom-0 w-4 h-1.5 rounded-full opacity-60 transition-all duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, ${colorGradients.shadow} 0%, transparent 80%)`,
          transform: isPlayable ? `translateY(${sizeClass.shadowY}) scale(0.95)` : 'translateY(0.5px) scale(0.9)'
        }}
      />

      {/* Actual Pawn/Peg Graphic */}
      <div className="flex flex-col items-center justify-center -space-y-0.5 relative z-10">
        {/* Shiny Head */}
        <div 
          className={`
            ${sizeClass.head} rounded-full bg-gradient-to-br ${colorGradients.head}
            border border-white/30 shadow-md transition-all duration-300 relative overflow-hidden
            ${isPlayable ? 'brightness-110' : ''}
          `}
        >
          {/* Specular Highlight glare */}
          <span className="absolute top-[1px] left-[1.5px] w-1 h-[2px] bg-white/60 rounded-full rotate-[-45deg] pointer-events-none" />
        </div>
        
        {/* Gold or white collar ring */}
        <div className={`${sizeClass.collar} rounded-full border border-white/20 bg-amber-400 opacity-90 z-20 shadow-sm`} />

        {/* Glossy Body */}
        <div 
          className={`
            ${sizeClass.body} bg-gradient-to-b ${colorGradients.body}
            rounded-t-full rounded-b-[4px] border border-white/20 shadow-md transition-all duration-300 relative overflow-hidden
            ${isPlayable ? 'brightness-115 shadow-[0_0_8px_rgba(251,191,36,0.3)]' : ''}
          `}
        >
          {/* Vertical gloss sheen shine */}
          <span className="absolute inset-y-0 left-[2px] w-0.5 bg-white/15 pointer-events-none" />
        </div>
      </div>
    </button>
  );
}
