import React from "react";

const PlayerCard = ({ player, isCurrentTurn, isSelf, onClick }) => {
  // Safe Data Handling with Defaults
  const name = player?.userId?.name || player?.name || "Player";
  const phone = player?.userId?.phone || player?.phone || "";
  const isOnline = player?.isOnline ?? true;
  const score = player?.score || 0;
  const color = player?.color || "#888";

  const getPhoneDisplay = (num) => {
    if (!num || num === "0000000000") return name;
    return `${num.slice(0, 3)}****${num.slice(-3)}`;
  };

  return (
    <div
      onClick={onClick}
      style={{
        ...styles.card,
        // Active Turn Glow Effect (Premium Golden Glow)
        border: isCurrentTurn ? `2.5px solid #FFD700` : "1px solid rgba(255,255,255,0.1)",
        boxShadow: isCurrentTurn
          ? `0 0 25px ${color}66, inset 0 0 15px rgba(255, 215, 0, 0.3)`
          : "0 8px 32px rgba(0,0,0,0.4)",
        transform: isCurrentTurn ? "scale(1.08) translateY(-2px)" : "scale(1)",
        zIndex: isCurrentTurn ? 100 : 10,
      }}
    >
      {/* 🔴 TURN BADGE */}
      {isCurrentTurn && (
        <div style={{ ...styles.turnBadge, backgroundColor: color === '#FFD700' ? '#000' : '#FFD700', color: color === '#FFD700' ? '#FFD700' : '#000' }}>
          <span style={styles.pulseDot} />
          TURN
        </div>
      )}

      {/* --- LEFT: Avatar & Identity --- */}
      <div style={styles.left}>
        <div style={{ ...styles.avatarWrapper, borderColor: color }}>
          <div style={{ ...styles.avatar, background: color }}>
            {name.charAt(0).toUpperCase()}
          </div>
          <div style={{ 
            ...styles.onlineDot, 
            backgroundColor: isOnline ? "#4CAF50" : "#ff4d4d",
            boxShadow: isOnline ? "0 0 8px #4CAF50" : "none" 
          }} />
        </div>

        <div style={styles.info}>
          <div style={styles.name}>{getPhoneDisplay(phone)}</div>
          {isSelf && <div style={styles.youTag}>MY SLOT</div>}
        </div>
      </div>

      {/* --- RIGHT: Score Tracker --- */}
      <div style={styles.right}>
        <div style={styles.scoreContainer}>
          <div style={styles.scoreLabel}>PTS</div>
          <div style={{ ...styles.scoreValue, color: color === '#FFFFFF' ? '#FFD700' : color }}>{score}</div>
        </div>
      </div>

      {/* Glossy Overlay Effect */}
      <div style={styles.gloss} />
    </div>
  );
};

const styles = {
  card: {
    width: 140,
    height: 60,
    padding: "6px 12px",
    borderRadius: "16px",
    background: "rgba(20, 20, 20, 0.7)",
    backdropFilter: "blur(15px)",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    cursor: "pointer",
    userSelect: "none",
  },
  turnBadge: {
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "9px",
    fontWeight: "900",
    padding: "2px 10px",
    borderRadius: "0 0 10px 10px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
    letterSpacing: "0.5px",
  },
  pulseDot: {
    width: "6px",
    height: "6px",
    background: "currentColor",
    borderRadius: "50%",
    animation: "pulseTurn 1s infinite",
  },
  left: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    zIndex: 2,
  },
  avatarWrapper: {
    position: "relative",
    padding: "2px",
    borderRadius: "12px",
    border: "2px solid",
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "16px",
    color: "#fff",
    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
  },
  onlineDot: {
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    position: "absolute",
    top: "-3px",
    right: "-3px",
    border: "2px solid #1a1a1a",
  },
  info: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  name: { fontSize: "11px", fontWeight: "800", opacity: 0.9, whiteSpace: "nowrap" },
  youTag: {
    fontSize: "7px",
    color: "#FFD700",
    fontWeight: "900",
    letterSpacing: "0.5px",
    marginTop: "2px"
  },
  right: {
    zIndex: 2,
  },
  scoreContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  scoreLabel: {
    fontSize: "8px",
    color: "rgba(255,255,255,0.4)",
    fontWeight: "900",
  },
  scoreValue: {
    fontSize: "18px",
    fontWeight: "900",
    lineHeight: "1",
    marginTop: "2px",
    textShadow: "0 0 10px rgba(0,0,0,0.5)"
  },
  gloss: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)",
    zIndex: 1,
    pointerEvents: "none"
  },
};

// Injection of animations
if (typeof document !== 'undefined') {
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes pulseTurn {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.4); opacity: 0.6; }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

export default PlayerCard;