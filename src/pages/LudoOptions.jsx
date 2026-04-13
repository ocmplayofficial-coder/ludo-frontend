import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { vibrate } from "../utils/settings";

export default function LudoOptions() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loadingMode, setLoadingMode] = useState("");

  // 1. Optimized User Load
  const loadUser = useCallback(async () => {
    try {
      const res = await API.get("/auth/me"); // Interceptor handles token automatically
      setUser(res.data.user);
    } catch (err) {
      console.error("Auth Session Expired");
      localStorage.clear();
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // 2. Premium Selection Logic
  const handleModeClick = (mode) => {
    if (loadingMode) return;
    
    setLoadingMode(mode);
    vibrate(25); // Premium haptic feel
    
    // Smooth transition delay
    setTimeout(() => {
      navigate("/ludo-dashboard", {
        state: { mode },
      });
    }, 400);
  };

  return (
    <div style={styles.container}>
      {/* 📡 HEADER */}
      <Header user={user} showBack={true} title="LUDO ARENA" />

      {/* 🏆 PROMO BANNER */}
      <div style={styles.promoBanner}>
        <div style={styles.bannerContent}>
          <div style={styles.onlineBadge}>
             <span className="dot-pulse"></span> 1,240 Active Players
          </div>
          <h2 style={styles.promoTitle}>KHELO AUR JEETO!</h2>
          <p style={styles.promoSub}>Instant Withdrawals to Bank Account 🏦</p>
        </div>
        <div style={styles.bannerDecoration}>🎲</div>
      </div>

      <p style={styles.sectionLabel}>CHOOSE GAMEPLAY MODE</p>

      {/* 🎮 MODE SELECTION LIST */}
      <div style={styles.cardList}>
        
        <ModeCard 
          title="CLASSIC" 
          desc="The original ludo experience (Full Game)"
          icon="🎲"
          color="#FF3A3A"
          isActive={loadingMode === "classic"}
          onClick={() => handleModeClick("classic")}
        />

        <ModeCard 
          title="TIME MODE" 
          desc="Points based match (Fast 5-Min)"
          icon="⏱️"
          color="#3498DB"
          isActive={loadingMode === "time"}
          onClick={() => handleModeClick("time")}
        />

        <ModeCard 
          title="TURN MODE" 
          desc="Skill based battle (Fixed 25 Turns)"
          icon="🔄"
          color="#2ECC71"
          isActive={loadingMode === "turn"}
          onClick={() => handleModeClick("turn")}
        />
      </div>

      {/* 🛡️ SECURITY INFO */}
      <div style={styles.footerInfo}>
        <div style={styles.secureCard}>
           <span>🔒 RNG Verified Fair Play</span>
           <span>🛡️ 100% Safe Payments</span>
        </div>
        <p style={styles.disclaimer}>Only for users above 18 years. T&C Apply.</p>
      </div>

      <BottomNav active="lobby" />

      <style>{`
        .dot-pulse { height: 6px; width: 6px; background-color: #00ff00; border-radius: 50%; display: inline-block; margin-right: 6px; box-shadow: 0 0 8px #00ff00; animation: blink 1.5s infinite; }
        @keyframes blink { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
}

// --- Card Sub-Component ---
function ModeCard({ title, desc, icon, color, isActive, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{
        ...styles.card,
        borderColor: isActive ? color : 'rgba(255,255,255,0.05)',
        background: isActive ? `${color}15` : 'rgba(255,255,255,0.03)',
        transform: isActive ? "scale(0.96)" : "scale(1)",
        boxShadow: isActive ? `0 0 20px ${color}33` : '0 10px 30px rgba(0,0,0,0.3)'
      }}
    >
      <div style={styles.cardInner}>
        <div style={{ ...styles.iconBox, background: `linear-gradient(135deg, ${color}, ${color}aa)` }}>
          {icon}
        </div>
        <div style={styles.cardText}>
          <h3 style={styles.cardTitle}>{title}</h3>
          <p style={styles.cardDesc}>{desc}</p>
        </div>
        <div style={{...styles.arrow, color: color}}>
            {isActive ? <div className="loader-dots" /> : "❯"}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { height: "100dvh", background: "#0a0a0a", color: "#fff", display: "flex", flexDirection: "column", overflowY: "auto", paddingBottom: "110px" },
  promoBanner: {
    margin: "20px 15px", padding: "25px", borderRadius: "24px",
    background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
    position: "relative", overflow: "hidden", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 15px 35px rgba(255, 215, 0, 0.2)"
  },
  bannerContent: { zIndex: 2 },
  onlineBadge: { fontSize: "9px", fontWeight: "900", background: "rgba(0,0,0,0.8)", padding: "4px 12px", borderRadius: "20px", color: "#FFD700", textTransform: "uppercase", letterSpacing: "1px" },
  promoTitle: { color: "#000", fontWeight: "900", margin: "10px 0 2px", fontSize: "22px", letterSpacing: "-0.5px" },
  promoSub: { color: "rgba(0,0,0,0.6)", fontSize: "11px", fontWeight: "bold" },
  bannerDecoration: { fontSize: "60px", opacity: 0.2, position: "absolute", right: "-10px", bottom: "-10px", transform: "rotate(-15deg)" },
  
  sectionLabel: { fontSize: "10px", fontWeight: "900", color: "#444", padding: "0 20px", marginBottom: "15px", letterSpacing: "1.5px" },
  cardList: { padding: "0 15px", display: "flex", flexDirection: "column", gap: "15px" },
  card: {
    borderRadius: "20px", cursor: "pointer", transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    border: "2px solid transparent", backdropFilter: "blur(10px)", position: "relative", overflow: "hidden"
  },
  cardInner: { display: "flex", alignItems: "center", padding: "18px", gap: "15px" },
  iconBox: { width: "52px", height: "52px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", boxShadow: "0 5px 15px rgba(0,0,0,0.3)" },
  cardText: { flex: 1 },
  cardTitle: { color: "#fff", margin: 0, fontWeight: "900", fontSize: "18px", letterSpacing: "0.5px" },
  cardDesc: { color: "#666", fontSize: "12px", marginTop: "4px", fontWeight: "500" },
  arrow: { fontWeight: "bold", fontSize: "18px", width: "30px", textAlign: "center" },
  
  footerInfo: { marginTop: "auto", padding: "30px 20px 0" },
  secureCard: { display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", padding: "12px 15px", borderRadius: "15px", fontSize: "10px", color: "#555", fontWeight: "bold" },
  disclaimer: { textAlign: "center", color: "#333", fontSize: "10px", marginTop: "15px" }
};