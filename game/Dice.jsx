import React, { useEffect, useState, useRef, useCallback } from "react";

// Audio asset handling
const diceRollAudioUrl = new URL("../assets/dice-roll.mp3", import.meta.url).href;

export default function Dice({ value = 1, isRolling, onRoll, disabled, turnColor = "red" }) {
  const [display, setDisplay] = useState(1);
  const audioRef = useRef(null);

  // 1. Optimized Audio handling
  const playRollSound = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(diceRollAudioUrl);
    }
    audioRef.current.currentTime = 0;
    audioRef.current.volume = 0.5;
    audioRef.current.play().catch(() => {});
  };

  const handleRoll = useCallback(() => {
    if (disabled || isRolling) return;
    playRollSound();
    onRoll?.();
  }, [onRoll, disabled, isRolling]);

  // 2. Realistic Rolling Animation Logic
  useEffect(() => {
    let interval;
    if (isRolling) {
      interval = setInterval(() => {
        setDisplay(Math.floor(Math.random() * 6) + 1);
      }, 70); // Slightly faster for excitement
    } else {
      setDisplay(value || 1);
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRolling, value]);

  // 3. Dot Color Logic based on Player's turn
  const getDotColor = () => {
    if (disabled) return "#7f8c8d";
    const colors = {
      red: "#e74c3c",
      green: "#27ae60",
      blue: "#2980b9",
      yellow: "#f39c12"
    };
    return colors[turnColor] || "#333";
  };

  // 4. Correct Ludo Dice Dots Mapping
  const renderDots = (num) => {
    const dotPositions = {
      1: [4],
      2: [2, 6],
      3: [2, 4, 6],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };

    return (
      <div style={styles.diceGrid}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={styles.dotCell}>
            {dotPositions[num]?.includes(i) && (
              <div style={{ ...styles.dot, backgroundColor: getDotColor() }} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div
        onClick={handleRoll}
        style={{
          ...styles.diceBody,
          background: disabled 
            ? "linear-gradient(145deg, #f0f0f0, #dcdcdc)" 
            : "linear-gradient(145deg, #ffffff, #e6e6e6)",
          animation: isRolling ? "diceShake 0.15s infinite" : "none",
          cursor: disabled ? "default" : "pointer",
          border: disabled ? "1px solid #ccc" : `2px solid ${getDotColor()}44`,
          boxShadow: isRolling 
            ? `0 0 25px ${getDotColor()}66, 0 8px 15px rgba(0,0,0,0.2)` 
            : "0 5px 12px rgba(0,0,0,0.15), inset 0 -3px 0 rgba(0,0,0,0.1)",
        }}
      >
        {renderDots(display)}
      </div>
      
      {/* 🟢 Status Label */}
      {!disabled && !isRolling && (
        <div style={{ ...styles.hintText, color: getDotColor() }}>Tap to Roll</div>
      )}
      
      <style>{`
        @keyframes diceShake {
          0% { transform: scale(1.1) rotate(0deg) translate(0,0); }
          25% { transform: scale(1.1) rotate(5deg) translate(2px, -2px); }
          50% { transform: scale(1.1) rotate(-5deg) translate(-2px, 2px); }
          75% { transform: scale(1.1) rotate(3deg) translate(1px, 1px); }
          100% { transform: scale(1.1) rotate(0deg) translate(0,0); }
        }
        @keyframes hintPulse {
          0% { opacity: 0.6; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1); }
          100% { opacity: 0.6; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    perspective: "1000px", // 3D depth
  },
  diceBody: {
    width: 60,
    height: 60,
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    position: "relative",
    zIndex: 5,
  },
  diceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gridTemplateRows: "repeat(3, 1fr)",
    width: "75%",
    height: "75%",
  },
  dotCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: "11px",
    height: "11px",
    borderRadius: "50%",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3)",
    transition: "background-color 0.3s ease",
  },
  hintText: {
    fontSize: "11px",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    animation: "hintPulse 1.5s infinite ease-in-out",
    textShadow: "0 0 10px rgba(255,255,255,0.8)",
  }
};