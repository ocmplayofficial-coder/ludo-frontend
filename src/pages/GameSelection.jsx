import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

export default function GameSelection() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr || userStr === "undefined") {
        navigate("/login");
        return;
      }
      setUser(JSON.parse(userStr));
    } catch (err) {
      navigate("/login");
    }
  }, [navigate]);

  const handleGameSelect = (gameType) => {
    // Haptic feedback feel
    if (window.navigator.vibrate) window.navigator.vibrate(20);
    
    if (gameType === "ludo") {
      navigate("/ludo-dashboard");
    } else if (gameType === "tp") {
      navigate("/tp-modes");
    }
  };

  return (
    <div style={styles.pageWrapper}>
      {/* 📡 PREMIUM HEADER */}
      <Header user={user} showBack={true} title="SELECT GAME" />

      {/* 🏆 HERO SECTION */}
      <div style={styles.heroSection}>
        <p style={styles.heroSub}>CHOOSE YOUR ARENA 💰</p>
        <h1 style={styles.heroTitle}>LUDO PRO ARENA</h1>
      </div>

      <div style={styles.gamesGrid}>
        
        {/* 🎲 LUDO CARD */}
        <div 
          onClick={() => handleGameSelect("ludo")}
          className="game-card"
          style={{...styles.gameCard, border: "1px solid rgba(255, 215, 0, 0.3)"}}
        >
          <div style={styles.badge}>POPULAR</div>
          <div style={styles.cardContent}>
            <div style={styles.iconBox}>🎲</div>
            <div style={styles.textDetails}>
              <h2 style={styles.gameTitle}>LUDO PRO</h2>
              <p style={styles.gameDesc}>Multiplayer • Instant Rewards</p>
            </div>
          </div>
          <div style={styles.infoRow}>
            <div style={styles.infoItem}><b>2-4</b><span>Players</span></div>
            <div style={styles.infoItem}><b>LOW</b><span>Entry</span></div>
            <div style={styles.infoItem}><b>5m</b><span>Rapid</span></div>
          </div>
          <button style={styles.playBtn}>PLAY LUDO</button>
          <div className="shine-effect"></div>
        </div>

        {/* 🃏 TEEN PATTI CARD */}
        <div
          onClick={() => handleGameSelect("tp")}
          className="game-card"
          style={{...styles.gameCard, background: "linear-gradient(135deg, #2a0000 0%, #4a0000 100%)", border: "1px solid rgba(233, 30, 99, 0.3)"}}
        >
          <div style={styles.badgeLive}>LIVE</div>
          <div style={styles.cardContent}>
            <div style={{...styles.iconBox, background: "linear-gradient(45deg, #E91E63, #880E4F)"}}>🃏</div>
            <div style={styles.textDetails}>
              <h2 style={styles.gameTitle}>TEEN PATTI</h2>
              <p style={styles.gameDesc}>Classic Indian Card Game</p>
            </div>
          </div>
          <div style={styles.infoRow}>
            <div style={styles.infoItem}><b>5</b><span>Players</span></div>
            <div style={styles.infoItem}><b>LOW</b><span>Boot</span></div>
            <div style={styles.infoItem}><b>LIVE</b><span>Action</span></div>
          </div>
          <button style={{...styles.playBtn, background: "linear-gradient(90deg, #E91E63, #C2185B)"}}>PLAY CARDS</button>
        </div>

      </div>

      <footer style={styles.footer}>
        <div style={styles.onlineStats}>
           <span className="dot"></span> 2,450+ Players Online
        </div>
      </footer>

      <style>{`
        .game-card {
          transition: all 0.3s ease;
        }
        .game-card:active {
          transform: scale(0.95);
        }
        .dot {
          height: 10px; width: 10px; background-color: #4CAF50;
          border-radius: 50%; display: inline-block; margin-right: 8px;
          box-shadow: 0 0 10px #4CAF50;
        }
        .shine-effect {
          position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.1), transparent);
          transition: 0.5s; pointer-events: none;
        }
        .game-card:hover .shine-effect {
          left: 100%;
        }
      `}</style>
    </div>
  );
}

const styles = {
  pageWrapper: { height: "100dvh", background: "#0a0a0a", color: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" },
  heroSection: { textAlign: "center", padding: "30px 20px" },
  heroSub: { color: "#FFD700", fontSize: "10px", fontWeight: "900", letterSpacing: "2px", textTransform: "uppercase" },
  heroTitle: { fontSize: "28px", fontWeight: "900", marginTop: "5px", letterSpacing: "-0.5px" },
  
  gamesGrid: { padding: "0 20px", display: "flex", flexDirection: "column", gap: "20px", flex: 1, overflowY: "auto" },
  gameCard: {
    background: "rgba(255, 255, 255, 0.03)",
    backdropFilter: "blur(20px)",
    borderRadius: "24px",
    padding: "20px",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 15px 35px rgba(0,0,0,0.5)",
    cursor: "pointer",
  },
  cardContent: { display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" },
  iconBox: { 
    width: "60px", height: "60px", background: "linear-gradient(45deg, #FFD700, #FFA500)", 
    borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px",
    boxShadow: "0 5px 15px rgba(255, 215, 0, 0.2)"
  },
  textDetails: { flex: 1 },
  gameTitle: { fontSize: "22px", fontWeight: "900", color: "#fff", margin: 0 },
  gameDesc: { fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "2px" },
  
  infoRow: {
    display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.3)",
    padding: "12px", borderRadius: "16px", marginBottom: "20px"
  },
  infoItem: { display: "flex", flexDirection: "column", alignItems: "center", fontSize: "10px", color: "#888" },
  
  badge: {
    position: "absolute", top: "12px", right: "-35px", background: "#FFD700", color: "#000",
    padding: "4px 40px", fontSize: "10px", fontWeight: "900", transform: "rotate(45deg)"
  },
  badgeLive: {
    position: "absolute", top: "12px", right: "-35px", background: "#4CAF50", color: "#fff",
    padding: "4px 40px", fontSize: "10px", fontWeight: "900", transform: "rotate(45deg)"
  },
  
  playBtn: {
    width: "100%", padding: "14px", borderRadius: "14px", border: "none",
    background: "linear-gradient(90deg, #FFD700, #FFA500)", color: "#000",
    fontWeight: "900", fontSize: "14px", letterSpacing: "1px", cursor: "pointer"
  },
  footer: { padding: "25px", textAlign: "center" },
  onlineStats: { color: "#fff", fontSize: "13px", fontWeight: "bold", background: "rgba(0,0,0,0.4)", padding: "8px 20px", borderRadius: "30px", display: "inline-block" }
};