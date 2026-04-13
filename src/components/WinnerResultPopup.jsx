import React, { useEffect } from "react";
import Confetti from "react-confetti";

const WinnerResultPopup = ({ open, winnerData = {}, gameMode = "classic", onClose = () => {}, myUserId }) => {
  
  useEffect(() => {
    if (open) {
      // Logic for playing specific sound (Win vs Loss) can go here
      if (window.navigator.vibrate) {
        window.navigator.vibrate(isIWon ? [100, 50, 100] : 200);
      }
    }
  }, [open]);

  if (!open) return null;

  const { winnerId, name, prize, color, message, scores = {} } = winnerData;
  
  // Logic to determine if current user is the winner
  const isIWon = String(winnerId) === String(myUserId);
  const statusText = isIWon ? "CONGRATULATIONS! 🏆" : "BETTER LUCK NEXT TIME! 💔";
  
  const scoreRows = Object.entries(scores).map(([playerColor, score]) => (
    <div key={playerColor} style={{
        ...styles.scoreRow,
        borderLeft: `4px solid ${playerColor}`
    }}>
      <span style={{ ...styles.scoreLabel, color: playerColor === 'white' ? '#888' : playerColor }}>
        {playerColor.toUpperCase()}
      </span>
      <span style={styles.scoreValue}>{score} PTS</span>
    </div>
  ));

  return (
    <div style={styles.overlay}>
      {/* 🎊 Celebrate only if I won */}
      {isIWon && (
        <Confetti 
          recycle={false} 
          numberOfPieces={300} 
          gravity={0.2}
          colors={['#FFD700', '#FFA500', '#ffffff']}
        />
      )}

      <div style={{
          ...styles.content,
          borderColor: isIWon ? "rgba(255, 215, 0, 0.3)" : "rgba(255, 255, 255, 0.1)"
      }}>
        <div style={styles.badge}>MATCH SUMMARY</div>
        
        <div style={{ 
            ...styles.title, 
            color: isIWon ? "#FFD700" : "#ff4444",
            textShadow: isIWon ? "0 0 20px rgba(255, 215, 0, 0.4)" : "none"
        }}>
            {statusText}
        </div>

        <div style={styles.winnerInfoBox}>
            <div style={styles.subtitle}>Winner: <span style={{color: '#fff'}}>{isIWon ? "YOU" : name}</span></div>
            <div style={{ ...styles.colorIndicator, background: color || '#FFD700' }} />
        </div>

        <div style={styles.prizeSection}>
            <div style={styles.prizeLabel}>TOTAL PRIZE</div>
            <div style={styles.prizeValue}>₹{prize || '0'}</div>
        </div>

        <div style={styles.message}>
            {message || `Game completed in ${gameMode.toUpperCase()} mode`}
        </div>

        <div style={styles.scoreHeader}>FINAL SCOREBOARD</div>
        <div style={styles.scoreBoard}>
            {scoreRows.length > 0 ? scoreRows : <p style={{fontSize: '12px', opacity: 0.5}}>No scores recorded</p>}
        </div>

        <button 
            style={{
                ...styles.button,
                background: isIWon ? "linear-gradient(90deg, #FFD700, #FFA500)" : "#333",
                color: isIWon ? "#000" : "#fff"
            }} 
            onClick={onClose}
        >
          GO TO LOBBY
        </button>
      </div>

      <style>{`
        @keyframes modalEnter {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },
  content: {
    width: "100%",
    maxWidth: "380px",
    background: "linear-gradient(180deg, #1a1a2e 0%, #0a0a0a 100%)",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: "32px",
    padding: "32px 24px",
    textAlign: "center",
    color: "#fff",
    position: "relative",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    animation: "modalEnter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  badge: {
    display: "inline-block",
    marginBottom: "12px",
    color: "rgba(255,255,255,0.4)",
    fontSize: "10px",
    fontWeight: 900,
    letterSpacing: "2px",
    textTransform: "uppercase"
  },
  title: {
    fontSize: "22px",
    fontWeight: 900,
    marginBottom: "24px",
    lineHeight: "1.2"
  },
  winnerInfoBox: {
    background: "rgba(255,255,255,0.03)",
    padding: "15px",
    borderRadius: "20px",
    marginBottom: "20px",
    border: "1px solid rgba(255,255,255,0.05)"
  },
  subtitle: {
    fontSize: "15px",
    fontWeight: 600,
    color: "rgba(255,255,255,0.6)",
  },
  colorIndicator: {
    width: "40px",
    height: "4px",
    margin: "10px auto 0",
    borderRadius: "10px",
  },
  prizeSection: {
    marginBottom: "24px",
  },
  prizeLabel: {
    fontSize: "11px",
    fontWeight: 800,
    color: "#FFD700",
    letterSpacing: "1px",
    marginBottom: "4px"
  },
  prizeValue: {
    fontSize: "42px",
    fontWeight: 900,
    textShadow: "0 0 15px rgba(255,215,0,0.3)"
  },
  message: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.5)",
    marginBottom: "28px",
    fontStyle: "italic"
  },
  scoreHeader: {
    textAlign: "left",
    fontSize: "11px",
    fontWeight: 900,
    color: "rgba(255,255,255,0.3)",
    marginBottom: "12px",
    paddingLeft: "5px"
  },
  scoreBoard: {
    display: "grid",
    gap: "8px",
    marginBottom: "30px",
  },
  scoreRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "12px",
  },
  scoreLabel: {
    fontWeight: 800,
    fontSize: "13px"
  },
  scoreValue: {
    fontWeight: 900,
    fontSize: "14px",
    color: "#fff",
  },
  button: {
    width: "100%",
    padding: "16px 0",
    borderRadius: "18px",
    border: "none",
    fontWeight: 900,
    fontSize: "14px",
    cursor: "pointer",
    transition: "transform 0.2s",
    letterSpacing: "1px"
  }
};

export default WinnerResultPopup;
