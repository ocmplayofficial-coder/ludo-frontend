import React from "react";
import Token from "./Token";

export default function Cell({
  tokens = [],
  isSafe = false,
  isValid = false,
  bg,
  onTokenClick,
}) {
  
  // 1. Dynamic Stacking Layout (Optimized for 1 to 4 tokens)
  const getContainerStyle = (count) => {
    let gridConfig = {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    };

    if (count > 1) {
      gridConfig = {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: count > 2 ? "1fr 1fr" : "1fr",
        gap: "1px",
        padding: "2px",
      };
    }

    return {
      ...gridConfig,
      width: "100%",
      height: "100%",
      position: "relative",
      zIndex: 10
    };
  };

  // Safe Cell Style (Star Background)
  const getSafeColor = () => {
    if (bg === "#ff4d4d") return "#c0392b"; // Red safe
    if (bg === "#2ecc71") return "#27ae60"; // Green safe
    if (bg === "#3498db") return "#2980b9"; // Blue safe
    if (bg === "#f1c40f") return "#f39c12"; // Yellow safe
    return "#bdc3c7"; // Neutral safe
  };

  return (
    <div
      style={{
        ...styles.cell,
        background: bg || "#ffffff",
        // Valid Move Glow Effect (Ludo Pro Premium)
        boxShadow: isValid
          ? "inset 0 0 10px rgba(255, 255, 255, 0.9), 0 0 20px rgba(255, 215, 0, 0.8)"
          : "inset 0 0 2px rgba(0,0,0,0.1)",
        border: isValid ? "2px solid #FFD700" : "0.5px solid rgba(0,0,0,0.15)",
        transform: isValid ? "scale(1.1) zIndex(20)" : "scale(1)",
        zIndex: isValid ? 50 : 1,
      }}
    >
      {/* 🛡️ PREMIUM SAFE STAR */}
      {isSafe && (
        <div style={styles.starWrapper}>
          <svg width="22" height="22" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: getSafeColor(), stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 0.5 }} />
              </linearGradient>
            </defs>
            <path 
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
              fill="url(#starGrad)"
              stroke="rgba(0,0,0,0.2)"
              strokeWidth="1"
            />
          </svg>
        </div>
      )}

      {/* 🎯 TOKENS RENDERER */}
      <div style={getContainerStyle(tokens.length)}>
        {tokens.map((t, i) => (
          <div 
            key={`${t.color}-${i}`} 
            style={{ 
              width: "100%", 
              height: "100%", 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center' 
            }}
          >
            <Token
              color={t.color}
              index={t.index}
              isSmall={tokens.length > 1}
              isActive={isValid} // Glow if move is valid
              onClick={() => onTokenClick?.(t.index)}
            />
          </div>
        ))}
      </div>

      {/* Subtle Overlay for better contrast */}
      <div style={styles.overlay} />
    </div>
  );
}

const styles = {
  cell: {
    width: "100%",
    height: "100%",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    cursor: "pointer",
    boxSizing: "border-box",
    overflow: "visible", // Taaki scaled token bahar dikhe
  },
  starWrapper: {
    position: "absolute",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.6,
    pointerEvents: "none",
    zIndex: 1,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(to bottom right, rgba(255,255,255,0.2), transparent)',
    pointerEvents: 'none',
    zIndex: 2
  }
};