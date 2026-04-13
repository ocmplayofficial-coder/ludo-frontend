import React, { useState } from 'react';
import { isSoundEnabled, playAudio } from '../utils/settings';

const GameCard = ({ match, onPlay, userBalance, buttonText = "PLAY NOW" }) => {
  const [loading, setLoading] = useState(false);

  // 💰 Balance Check Logic
  const canPlay = userBalance >= match.entryFee;

  const handlePlay = async () => {
    if (!canPlay || loading) return;

    try {
      setLoading(true);
      
      // 🔊 Click Sound & Haptic Feedback
      if (isSoundEnabled()) {
        playAudio(new Audio("/assets/click.mp3"));
      }
      if (window.navigator.vibrate) {
        window.navigator.vibrate(20); // Light tap feel
      }
      
      await onPlay({
        matchId: match.id,
        type: match.type,
        entryFee: match.entryFee
      });

    } catch (err) {
      console.error("Match join karne mein dikkat:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      ...styles.card,
      border: canPlay ? "1px solid rgba(255, 215, 0, 0.2)" : "1px solid rgba(255, 255, 255, 0.05)"
    }}>
      {/* 🔴 LIVE INDICATOR (Top Right) */}
      <div style={styles.liveIndicator}>
        <span style={styles.pulseDot} />
        LIVE
      </div>

      <div style={styles.header}>
        <div style={styles.badge}>
          <span style={styles.modeText}>{match.type.toUpperCase()}</span>
        </div>
        <div style={styles.infoIcons}>
          {match.turns && <span style={styles.tag}>🔄 {match.turns}</span>}
          {match.players && <span style={styles.tag}>👤 {match.players}P</span>}
        </div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.prizeSection}>
          <div style={styles.label}>WINNING PRIZE</div>
          <div style={styles.prizeAmount}>₹{match.prizeMoney}</div>
        </div>

        <div style={styles.divider} />

        <div style={styles.entrySection}>
          <div style={styles.label}>ENTRY FEE</div>
          <div style={{...styles.entryValue, color: canPlay ? '#fff' : '#ff4d4d'}}>
            ₹{match.entryFee}
          </div>
        </div>
      </div>

      <div style={styles.statusRow}>
        <div style={styles.onlineStatus}>
          <span style={styles.onlineDot} />
          {match.onlinePlayers || "0"} Players Online
        </div>
      </div>

      {/* ⚡ PREMIUM ACTION BUTTON */}
      <button
        onClick={handlePlay}
        disabled={!canPlay || loading}
        style={{
          ...styles.button,
          background: canPlay 
            ? "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)" 
            : "#222",
          boxShadow: canPlay ? "0 10px 20px rgba(255, 165, 0, 0.2)" : "none",
          cursor: canPlay ? "pointer" : "not-allowed",
          opacity: loading ? 0.8 : 1
        }}
      >
        {loading ? (
          <div style={styles.loaderContainer}>
             <div className="btn-spinner"></div>
             <span style={styles.loadingText}>WAITING...</span>
          </div>
        ) : (
          <div style={styles.btnContent}>
            <span style={styles.btnMainText}>{buttonText}</span>
            <div style={styles.btnPriceBadge}>₹{match.entryFee}</div>
          </div>
        )}
      </button>

      {!canPlay && (
        <div style={styles.errorBox}>
          ⚠️ Low Balance! Please Recharge
        </div>
      )}

      {/* Internal CSS for Animations */}
      <style>{`
        @keyframes pulseLive {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
        .btn-spinner {
          width: 16px; height: 16px; border: 2px solid #000;
          border-top: 2px solid transparent; border-radius: 50%;
          animation: spin 0.8s linear infinite; margin-right: 10px;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const styles = {
  card: {
    background: "rgba(30, 30, 30, 0.6)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "20px",
    marginBottom: "16px",
    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
    position: "relative",
    overflow: "hidden",
    transition: "transform 0.2s ease"
  },
  liveIndicator: {
    position: 'absolute', top: '15px', right: '15px',
    display: 'flex', alignItems: 'center', gap: '5px',
    fontSize: '10px', fontWeight: '900', color: '#ff4d4d',
    background: 'rgba(255, 77, 77, 0.1)', padding: '2px 8px', borderRadius: '10px'
  },
  pulseDot: { width: '6px', height: '6px', background: '#ff4d4d', borderRadius: '50%', animation: 'pulseLive 1.5s infinite' },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" },
  badge: { background: "rgba(255, 215, 0, 0.1)", padding: "5px 12px", borderRadius: "10px", border: "1px solid rgba(255, 215, 0, 0.2)" },
  modeText: { color: "#FFD700", fontSize: "11px", fontWeight: "900", letterSpacing: "1px" },
  tag: { fontSize: "10px", color: "#888", marginLeft: "6px", background: "#000", padding: "4px 10px", borderRadius: "20px", fontWeight: "bold" },
  mainContent: { display: "flex", alignItems: "center", justifyContent: "space-around", padding: "15px 0", background: "rgba(0,0,0,0.3)", borderRadius: "16px", marginBottom: "15px" },
  label: { fontSize: "9px", color: "#666", fontWeight: "bold", textTransform: "uppercase", marginBottom: "4px" },
  prizeAmount: { fontSize: "26px", fontWeight: "900", color: "#FFD700" },
  entryValue: { fontSize: "18px", fontWeight: "bold" },
  divider: { width: "1px", height: "35px", background: "rgba(255,255,255,0.05)" },
  statusRow: { marginBottom: "15px" },
  onlineStatus: { fontSize: "12px", color: "#2ecc71", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: "bold" },
  onlineDot: { width: "8px", height: "8px", background: "#2ecc71", borderRadius: "50%", boxShadow: "0 0 10px #2ecc71" },
  button: { width: "100%", height: "54px", border: "none", borderRadius: "16px", transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)" },
  btnContent: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px", color: "#000" },
  btnMainText: { fontWeight: "900", fontSize: "15px", letterSpacing: "0.5px" },
  btnPriceBadge: { background: "rgba(0,0,0,0.1)", padding: "6px 12px", borderRadius: "10px", fontWeight: "900", fontSize: "14px" },
  errorBox: { background: "rgba(255, 77, 77, 0.1)", color: "#ff4d4d", fontSize: "11px", textAlign: "center", marginTop: "12px", padding: "8px", borderRadius: "10px", fontWeight: "bold", border: "1px solid rgba(255, 77, 77, 0.2)" },
  loaderContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: "#000", fontWeight: "900", fontSize: "14px" }
};

export default GameCard;