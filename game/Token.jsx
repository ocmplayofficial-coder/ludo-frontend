import React, { useState, useEffect } from "react";

export default function Token({
  color,
  index = 0,
  isActive = false,
  isKilled = false,
  isSmall = false,
  onClick,
}) {
  const [pressed, setPressed] = useState(false);
  const [shake, setShake] = useState(0);

  // 💥 Realistic Kill Shake Animation
  useEffect(() => {
    if (isKilled) {
      let i = 0;
      const interval = setInterval(() => {
        setShake(i % 2 ? 4 : -4);
        i++;
        if (i > 10) {
          clearInterval(interval);
          setShake(0);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isKilled]);

  const tokenColor = getHexColor(color);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (isActive) onClick?.();
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        ...styles.tokenContainer,
        width: isSmall ? 22 : 28,
        height: isSmall ? 30 : 36,
        transform: `translateX(${shake}px) ${pressed ? "scale(0.85)" : "scale(1)"}`,
        cursor: isActive ? "pointer" : "default",
        filter: isKilled ? "grayscale(0.8) opacity(0.4)" : "none",
        zIndex: isActive ? 100 : 10 + index,
        animation: isActive ? "tokenJump 0.6s infinite alternate ease-in-out" : "none",
      }}
    >
      {/* ✨ Dynamic Glow for Active Pieces */}
      {isActive && (
        <div 
          style={{ 
            ...styles.glow, 
            background: `radial-gradient(circle, ${tokenColor}88 0%, transparent 70%)`,
            boxShadow: `0 0 20px 5px ${tokenColor}44` 
          }} 
        />
      )}

      {/* 👤 Premium Pawn Head */}
      <div style={{ ...styles.pawnHead, backgroundColor: tokenColor }}>
        <Avatar color={color} isSmall={isSmall} />
        <div style={styles.shineOverlay} />
      </div>

      {/* 👗 Premium Pawn Body */}
      <div style={{ ...styles.pawnBody, backgroundColor: tokenColor }}>
        <div style={styles.bodyHighlight} />
        {/* Subtle Base Border */}
        <div style={{ ...styles.baseBorder, borderColor: `${tokenColor}aa` }} />
      </div>

      {/* 🌑 Dynamic Shadow */}
      <div style={{
        ...styles.shadow,
        transform: isActive ? "scale(0.7) translateY(5px)" : "scale(1)",
        opacity: isActive ? 0.2 : 0.4
      }} />

      <style>{`
        @keyframes tokenJump {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(-10px) scale(1.05); }
        }
      `}</style>
    </div>
  );
}

const getHexColor = (color) => {
  const colors = {
    red: "#FF3A3A",
    green: "#2ECC71",
    blue: "#3498DB",
    yellow: "#F1C40F",
  };
  return colors[color] || "#ccc";
};

function Avatar({ color, isSmall }) {
  return (
    <svg viewBox="0 0 24 24" style={{ width: isSmall ? "65%" : "75%", height: "75%", filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))" }}>
      <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.15)" />
      <circle cx="8" cy="10" r="1.5" fill="white" />
      <circle cx="16" cy="10" r="1.5" fill="white" />
      <path d="M9 15 Q12 18 15 15" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const styles = {
  tokenContainer: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    userSelect: "none",
  },
  pawnHead: {
    width: "75%",
    height: "42%",
    borderRadius: "50%",
    position: "relative",
    zIndex: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid rgba(255,255,255,0.3)",
    boxShadow: "inset -2px -2px 6px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2)",
  },
  pawnBody: {
    width: "100%",
    height: "58%",
    marginTop: "-12%",
    borderRadius: "50% 50% 25% 25% / 70% 70% 30% 30%",
    border: "1px solid rgba(255,255,255,0.2)",
    boxShadow: "inset -3px -5px 8px rgba(0,0,0,0.5), 0 3px 6px rgba(0,0,0,0.3)",
    zIndex: 2,
    position: "relative",
    overflow: "hidden",
  },
  shineOverlay: {
    position: "absolute",
    top: "10%",
    left: "15%",
    width: "35%",
    height: "35%",
    background: "linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 100%)",
    borderRadius: "50%",
  },
  bodyHighlight: {
    position: "absolute",
    top: "10%",
    left: "20%",
    width: "50%",
    height: "30%",
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: "50%",
    filter: "blur(1px)",
    transform: "rotate(-10deg)",
  },
  baseBorder: {
    position: "absolute",
    bottom: "0",
    width: "100%",
    height: "40%",
    borderBottom: "4px solid",
    borderRadius: "0 0 50% 50%",
    opacity: 0.4,
  },
  glow: {
    position: "absolute",
    width: "180%",
    height: "180%",
    top: "-40%",
    left: "-40%",
    borderRadius: "50%",
    zIndex: -1,
  },
  shadow: {
    position: "absolute",
    bottom: "-5px",
    width: "90%",
    height: "6px",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: "50%",
    filter: "blur(3px)",
    zIndex: 1,
    transition: "all 0.6s ease-in-out",
  }
};