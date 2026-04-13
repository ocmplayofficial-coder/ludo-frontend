import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, gameAPI } from "../services/api";
import BottomNav from "../components/BottomNav";
import Header from "../components/Header"; 
import { vibrate } from "../utils/settings";
import { toast } from "sonner"; // 🔥 Added for better error feedback

const modeMeta = {
  classic: {
    title: "CLASSIC MODE",
    sub: "The Traditional Ludo Battle",
    image: "/ludo-classic.png",
    color: "#FF3A3A"
  },
  time: {
    title: "TIME MODE",
    sub: "Fast 5-Min Timer Match",
    image: "/ludo-time.png",
    color: "#3498DB"
  },
  turn: {
    title: "TURN MODE",
    sub: "Fixed 25 Turns Strategy",
    image: "/ludo-turn.png",
    color: "#2ECC71"
  }
};

export default function LudoModes() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modes, setModes] = useState([]);

  useEffect(() => {
    loadUser();
    fetchLudoModes();
  }, []);

  const loadUser = async () => {
    try {
      const res = await authAPI.getProfile();
      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (err) {
      console.log("Auth Error:", err);
      navigate("/login");
    }
  };

  const fetchLudoModes = async () => {
    try {
      setLoading(true);
      // 🔥 FIXED: Changed from getMatches() to getLudoMatches() to sync with your api.js
      const res = await gameAPI.getLudoMatches();
      
      const ludoMatches = res.data?.matches || res.data?.ludo || [];
      
      if (ludoMatches.length === 0) {
        setModes([]);
        return;
      }

      const uniqueTypes = Array.from(new Set(ludoMatches.map((item) => item.type)));

      const dynamicModes = uniqueTypes.map((type) => {
        const meta = modeMeta[type] || {
          title: type.toUpperCase(),
          sub: "Pro Ludo Challenge",
          image: "/ludo-default.png",
          color: "#FFD700"
        };
        
        const tableCount = ludoMatches.filter((match) => match.type === type).length;

        return {
          ...meta,
          type,
          tableCount,
        };
      });

      setModes(dynamicModes);
    } catch (err) {
      console.error("Unable to load ludo modes", err);
      toast.error("Server connection issue. Please try again.");
      setModes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleModeSelect = (modeType) => {
    vibrate(20);
    // User ko dashboard par bhejna jahan tables ki list dikhegi
    navigate("/ludo-dashboard", { state: { mode: modeType } });
  };

  if (loading) return (
    <div style={styles.loader}>
      <div className="animate-bounce">🎲</div>
      <p style={{ marginTop: '10px' }}>Connecting to Arena...</p>
    </div>
  );

  return (
    <div style={styles.container}>
      <Header user={user} showBack={true} showSettings={true} title="LUDO MODES" />

      <div style={styles.hero}>
        <h2 style={styles.heroTitle}>Choose Your Arena</h2>
        <p style={styles.heroSub}>Win real cash with your skills 💰</p>
      </div>

      <div style={styles.cardContainer}>
        {modes.length === 0 ? (
          <div style={styles.noModesCard}>
            <p>No active tables found.</p>
            <button onClick={fetchLudoModes} style={styles.retryBtn}>Retry</button>
          </div>
        ) : (
          modes.map((mode, i) => (
            <div
              key={i}
              style={{
                ...styles.card,
                borderLeft: `6px solid ${mode.color}`,
                backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${mode.image})`,
              }}
              onClick={() => handleModeSelect(mode.type)}
            >
              <div style={styles.cardContent}>
                <h3 style={styles.cardTitle}>{mode.title}</h3>
                <p style={styles.cardSubText}>{mode.sub}</p>
                <span style={styles.tableBadge}>{mode.tableCount} Active Tables</span>
              </div>
              <div style={styles.playIcon}>▶</div>
            </div>
          ))
        )}
      </div>

      <div style={styles.disclaimer}>
        <p>🔞 For 18+ Players Only | Verified Fair Play System ✅</p>
      </div>

      <BottomNav />
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #330000 0%, #000000 100%)",
    paddingBottom: "100px",
  },
  loader: { height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "#FFD700", fontWeight: "bold", background: "#000" },
  hero: { textAlign: "center", padding: "20px 0" },
  heroTitle: { color: "#fff", fontSize: "22px", fontWeight: "900", margin: 0 },
  heroSub: { color: "#FFD700", fontSize: "12px", fontWeight: "bold", opacity: 0.8 },
  cardContainer: { padding: "0 15px", display: "flex", flexDirection: "column", gap: "15px" },
  card: {
    height: "130px",
    borderRadius: "20px",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    cursor: "pointer",
    boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
    position: "relative",
  },
  cardContent: { zIndex: 2 },
  cardTitle: { color: "#fff", fontSize: "20px", fontWeight: "900", margin: 0 },
  cardSubText: { color: "#FFD700", fontSize: "10px", fontWeight: "bold" },
  tableBadge: { fontSize: '9px', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '10px', marginTop: '10px', display: 'inline-block' },
  playIcon: { width: "40px", height: "40px", background: "rgba(255,255,255,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", backdropFilter: "blur(5px)" },
  noModesCard: { textAlign: 'center', padding: '40px', color: '#888', background: 'rgba(255,255,255,0.05)', borderRadius: '20px' },
  retryBtn: { marginTop: '10px', background: '#FFD700', border: 'none', padding: '5px 15px', borderRadius: '5px', fontWeight: 'bold' },
  disclaimer: { textAlign: "center", marginTop: "40px", color: "rgba(255,255,255,0.3)", fontSize: "10px" }
};