import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

export default function Lobby() {
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState({ ludo: [], teenpatti: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 1. Auth Persistence & Safety Check
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr || userStr === "undefined") {
      navigate("/login");
      return;
    }
    try {
      setUser(JSON.parse(userStr));
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const API_BASE = import.meta.env.VITE_API_URL || "http://16.171.165.109:5001/api";

  // 2. Optimized Match Loading (Polling)
  useEffect(() => {
    const loadMatches = async () => {
      try {
        const res = await axios.get(`${API_BASE}/game/matches`);
        setMatches(res.data);
      } catch (err) {
        console.error("Match fetching error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
    const interval = setInterval(loadMatches, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGameNavigation = (path) => {
    if (window.navigator.vibrate) window.navigator.vibrate(20);
    navigate(path);
  };

  if (loading && !matches.ludo) return (
    <div style={styles.loader}>
      <div className="lobby-spinner"></div>
      <p>Ludo Pro Arena Taiyaar Ho Raha Hai...</p>
    </div>
  );

  return (
    <div style={styles.pageWrapper}>
      {/* 📡 PREMIUM HEADER */}
      <Header user={user} showSettings={true} title="LUDO PRO ARENA" />

      {/* 🎰 PROMO BANNER (India's #1 Ludo) */}
      <div style={styles.promoBanner}>
        <div style={styles.promoContent}>
           <h2 style={styles.promoTitle}>INDIA'S #1 LUDO PRO</h2>
           <p style={styles.promoSub}>Kheliye aur Jeetiye Lakhon Daily 💰</p>
           <div style={styles.secureBadge}>🛡️ 100% SECURE & VERIFIED</div>
        </div>
        <div style={styles.bannerShine}></div>
      </div>

      <div style={styles.sectionTitle}>
        <span>SELECT YOUR GAME ARENA</span>
        <span style={{ color: '#4CAF50', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span className="online-dot"></span> {Math.floor(Math.random() * 500) + 2400} Players Online
        </span>
      </div>

      {/* 🕹️ MAIN GAMES SELECTION */}
      <div style={styles.gamesGrid}>
        
        {/* 🎲 LUDO PRO CARD */}
        <div style={styles.mainGameCard} onClick={() => handleGameNavigation("/ludo-modes")}>
          <div style={styles.gameIconBox}>🎲</div>
          <div style={styles.gameDetails}>
            <h3 style={styles.gameName}>LUDO PRO</h3>
            <p style={styles.gameTags}>Classic • Time • Turn Based</p>
          </div>
          <button style={styles.playNowBtn}>PLAY NOW ❯</button>
        </div>

        {/* 🃏 TEEN PATTI CARD */}
        <div style={styles.tpGameCard} onClick={() => handleGameNavigation("/tp-modes")}>
          <div style={{...styles.gameIconBox, background: '#1a1a1a'}}>🃏</div>
          <div style={styles.gameDetails}>
            <h3 style={{...styles.gameName, color: '#fff'}}>TEEN PATTI</h3>
            <p style={{...styles.gameTags, color: 'rgba(255,255,255,0.5)'}}>Classic • Muflis • AK47</p>
          </div>
          <button style={styles.tpPlayBtn}>PLAY NOW ❯</button>
          <div style={styles.liveBadge}>LIVE</div>
        </div>

        {/* 📢 CUSTOMER SUPPORT ROW */}
        <div style={styles.supportRow}>
          <div style={styles.supportCard} onClick={() => window.open('https://t.me/yourlink', '_blank')}>
            <div style={{...styles.supportIcon, color: '#0088cc'}}>Telegram</div>
            <div style={styles.supportInfo}>
              <h3 style={styles.supportTitle}>Telegram</h3>
              <p style={styles.supportStatus}>Online 24/7</p>
            </div>
          </div>
          <div style={styles.supportCard} onClick={() => window.open('https://wa.me/', '_blank')}>
            <div style={{...styles.supportIcon, color: '#25D366'}}>WhatsApp</div>
            <div style={styles.supportInfo}>
              <h3 style={styles.supportTitle}>WhatsApp</h3>
              <p style={styles.supportStatus}>Online 24/7</p>
            </div>
          </div>
        </div>
      </div>

      {/* 📜 DISCLAMER */}
      <footer style={styles.footerContainer}>
        <p style={styles.disclaimer}>
          🔞 This game involves financial risk. Please play responsibly.<br/>
          Assam, Odisha, Telangana, and Andhra Pradesh users are not allowed.
        </p>
        <p style={styles.version}>Ludo Pro Arena v1.5.2 | Gajraj Foundation</p>
      </footer>

      <BottomNav active="lobby" />

      <style>{`
        .online-dot { width: 8px; height: 8px; background: #4CAF50; border-radius: 50%; box-shadow: 0 0 10px #4CAF50; animation: pulse 1.5s infinite; }
        .lobby-spinner { width: 40px; height: 40px; border: 4px solid #333; border-top-color: #FFD700; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 15px; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const styles = {
  pageWrapper: { minHeight: "100vh", background: "#0a0a0a", color: "#fff", paddingBottom: "110px", display: 'flex', flexDirection: 'column' },
  loader: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#FFD700' },
  
  promoBanner: {
    margin: '15px', padding: '25px', borderRadius: '25px',
    background: 'linear-gradient(135deg, #FF3A3A 0%, #FF8C00 100%)',
    position: 'relative', overflow: 'hidden', boxShadow: '0 10px 30px rgba(255, 58, 58, 0.3)'
  },
  bannerShine: { position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)', animation: 'shine 3s infinite' },
  promoTitle: { fontSize: '24px', fontWeight: '900', margin: 0, letterSpacing: '0.5px', textShadow: '0 2px 4px rgba(0,0,0,0.2)' },
  promoSub: { fontSize: '14px', margin: '6px 0', fontWeight: 'bold', color: '#fff' },
  secureBadge: { display: 'inline-block', background: 'rgba(0,0,0,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '10px', fontWeight: 'bold', marginTop: '10px' },
  
  sectionTitle: { padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', fontWeight: '900', color: '#555', letterSpacing: '1px' },
  gamesGrid: { padding: '0 15px', display: 'flex', flexDirection: 'column', gap: '15px' },
  
  mainGameCard: {
    background: 'linear-gradient(90deg, #FFD700, #FFA500)',
    borderRadius: '24px', padding: '18px', display: 'flex', alignItems: 'center', cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(0,0,0,0.4)', transition: 'transform 0.2s'
  },
  tpGameCard: {
    background: 'linear-gradient(90deg, #2a0000, #4a0000)',
    borderRadius: '24px', padding: '18px', display: 'flex', alignItems: 'center', cursor: 'pointer',
    boxShadow: '0 8px 25px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', position: 'relative'
  },
  liveBadge: { position: 'absolute', top: '10px', right: '10px', background: '#FF3A3A', color: '#fff', fontSize: '8px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '10px' },
  
  gameIconBox: { width: '55px', height: '55px', background: '#fff', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginRight: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
  gameDetails: { flex: 1 },
  gameName: { color: '#000', margin: 0, fontSize: '20px', fontWeight: '900' },
  gameTags: { color: 'rgba(0,0,0,0.5)', margin: '2px 0 0', fontSize: '11px', fontWeight: 'bold' },
  
  playNowBtn: { border: 'none', background: '#000', color: '#fff', padding: '10px 18px', borderRadius: '15px', fontSize: '11px', fontWeight: '900' },
  tpPlayBtn: { border: 'none', background: '#FFD700', color: '#000', padding: '10px 18px', borderRadius: '15px', fontSize: '11px', fontWeight: '900' },
  
  supportRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '5px' },
  supportCard: { background: '#121212', borderRadius: '20px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' },
  supportIcon: { fontSize: '11px', fontWeight: '900' },
  supportTitle: { margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#fff' },
  supportStatus: { margin: 0, fontSize: '10px', color: '#4CAF50', fontWeight: 'bold' },
  
  footerContainer: { marginTop: '40px', padding: '0 30px', textAlign: 'center' },
  disclaimer: { fontSize: '10px', color: '#444', lineHeight: '1.6', marginBottom: '15px' },
  version: { fontSize: '9px', color: '#222', letterSpacing: '1px' }
};