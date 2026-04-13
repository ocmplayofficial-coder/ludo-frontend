import { useEffect, useState, useRef } from "react";
import { playAudio } from "../utils/settings";

const diceRollAudioUrl = new URL("../../assets/dice-roll.mp3", import.meta.url).href;

export default function Dice({ value, isRolling, onRoll, disabled, isMyTurn, hasRolled, playerColor = "red" }) {
  const [displayValue, setDisplayValue] = useState(1);
  const [rotation, setRotation] = useState(0);
  const audioRef = useRef(new Audio(diceRollAudioUrl));

  useEffect(() => {
    let interval;
    if (isRolling) {
      // 🔊 Audio handling
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.5;
      playAudio(audioRef.current);

      // 🎲 Fast random shuffle animation
      interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
        setRotation((prev) => prev + 45); // Smooth rotation
      }, 60);
    } else {
      setDisplayValue(value || 1);
      setRotation(0);
      if (interval) clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isRolling, value]);

  const handleClick = () => {
    if (disabled || isRolling || hasRolled) return;
    
    // 📳 Vibration on click (Mobile only)
    if (window.navigator.vibrate) window.navigator.vibrate(15);
    
    onRoll();
  };

  const getDotColor = () => {
    if (disabled) return "#7f8c8d";
    const colors = {
      red: "#e74c3c",
      green: "#27ae60",
      blue: "#2980b9",
      yellow: "#f39c12"
    };
    return colors[playerColor] || "#222";
  };

  const renderDots = () => {
    const dotsMap = {
      1: [[1, 1]],
      2: [[0, 0], [2, 2]],
      3: [[0, 0], [1, 1], [2, 2]],
      4: [[0, 0], [0, 2], [2, 0], [2, 2]],
      5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
      6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
    };

    return dotsMap[displayValue]?.map((dot, i) => (
      <div
        key={i}
        style={{
          ...styles.dot,
          backgroundColor: getDotColor(),
          gridRow: dot[0] + 1,
          gridColumn: dot[1] + 1,
        }}
      />
    ));
  };

  return (
    <div style={styles.container}>
      <div
        onClick={handleClick}
        style={{
          ...styles.dice,
          transform: `rotate(${rotation}deg) scale(${isRolling ? 1.2 : 1})`,
          opacity: disabled ? 0.5 : 1,
          cursor: (disabled || hasRolled) ? "not-allowed" : "pointer",
          // 3D Shadow and Active Border
          border: isMyTurn && !hasRolled ? `2px solid ${getDotColor()}` : "1.5px solid rgba(0,0,0,0.1)",
          boxShadow: isRolling 
            ? `0 15px 35px ${getDotColor()}66` 
            : isMyTurn && !hasRolled 
              ? `0 0 20px ${getDotColor()}44` 
              : "0 6px 12px rgba(0,0,0,0.2), inset 0 -4px 0 rgba(0,0,0,0.1)",
        }}
      >
        <div style={styles.grid}>{renderDots()}</div>
      </div>

      <div style={{
        ...styles.text,
        color: isMyTurn && !hasRolled ? getDotColor() : "#888",
        animation: isMyTurn && !hasRolled && !isRolling ? "dicePulse 1.2s infinite" : "none"
      }}>
        {isRolling ? "ROLLING..." : hasRolled ? "DONE" : disabled ? "WAITING..." : "YOUR TURN"}
      </div>

      <style>{`
        @keyframes dicePulse {
          0% { opacity: 0.5; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.5; transform: scale(0.9); }
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
    justifyContent: "center",
    width: 110,
    perspective: "1000px" // Adds 3D feel
  },
  dice: {
    width: 65,
    height: 65,
    borderRadius: 14,
    background: "linear-gradient(145deg, #ffffff, #f0f0f0)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    position: "relative",
    zIndex: 10,
  },
  grid: {
    width: "70%",
    height: "70%",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gridTemplateRows: "repeat(3, 1fr)",
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: "50%",
    margin: "auto",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)",
    transition: "background-color 0.3s ease"
  },
  text: {
    marginTop: 10,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    textAlign: "center"
  },
};