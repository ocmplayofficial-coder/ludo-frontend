import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { gameAPI, authAPI } from "../services/api";
import { useSocket } from "../services/SocketContext";
import Header from "../components/Header";
import GameCard from "../components/GameCard";

export default function LudoDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, connected } = useSocket() || {};

  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [online, setOnline] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [selectedColor, setSelectedColor] = useState('red'); // Default color set
  const [rejoinRoomId, setRejoinRoomId] = useState(null);

  const hasNavigated = useRef(false);
  const hasCheckedActiveGame = useRef(false);
  const mode = location.state?.mode || "classic";

  // 1. Load User Profile
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await authAPI.getProfile();
        setUser(res.data.user);
      } catch (err) {
        console.error("Auth session expired");
        localStorage.clear();
        navigate("/login");
      }
    };
    loadUser();
  }, [navigate]);

  // 2. Fetch Matches with optimized polling
  const fetchMatches = useCallback(async () => {
    try {
      const res = await gameAPI.getLiveTables(mode);
      if (res.data.success && res.data.tables) {
        const filtered = res.data.tables.map((table) => ({
          ...table,
          gameMode: table.type,
          type: table.type,
          prizeMoney: table.prizeMoney,
          players: table.playersJoined || table.players?.length || table.maxPlayers
        }));
        setMatches(filtered);
      }
    } catch (err) {
      console.log("❌ Table fetch error:", err);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    fetchMatches();
    const timer = setInterval(fetchMatches, 8000); // 8 sec refresh
    return () => clearInterval(timer);
  }, [fetchMatches]);

  // 3. Socket Event Handlers
  useEffect(() => {
    if (!socket) return;

    socket.emit("GET_ONLINE_COUNT");
    socket.on("onlinePlayers", (count) => setOnline(count));
    socket.on("UPDATE_ONLINE_COUNT", (data) => {
      console.log("Dynamic Online Count:", data.count);
      setOnline(data.count);
    });

    socket.on("matchFound", (data) => {
      if (!data?.roomId || hasNavigated.current) return;
      hasNavigated.current = true;
      
      if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
      
      setSearching(false);
      navigate(`/ludo/board/${data.roomId}`, { replace: true });
    });

    socket.on("waiting", () => setSearching(true));

    socket.on("LOOKING_FOR_OPPONENT", () => setSearching(true));

    socket.on("GAME_STARTING", (data) => {
      console.log("🚀 Match Found! Data received:", data);
      if (!data?.roomId || hasNavigated.current) return;
      hasNavigated.current = true;
      setSearching(false);
      navigate(`/ludo/board/${data.roomId}`, { replace: true });
    });

    socket.on("GAME_ERROR", (data) => {
      setSearching(false);
      setError(data?.message || "Unable to join game");
    });

    socket.on("error", (msg) => {
      setSearching(false);
      setError(msg || "Unable to join matchmaking");
    });

    return () => {
      socket.off("onlinePlayers");
      socket.off("UPDATE_ONLINE_COUNT");
      socket.off("matchFound");
      socket.off("waiting");
      socket.off("LOOKING_FOR_OPPONENT");
      socket.off("GAME_STARTING");
      socket.off("GAME_ERROR");
      socket.off("error");
    };
  }, [socket, navigate]);

  // 4. Recovery Logic for active sessions
  useEffect(() => {
    if (!socket || !connected || !user || hasCheckedActiveGame.current) return;

    const handleActiveGame = (data) => {
      if (data?.roomId) setRejoinRoomId(data.roomId);
    };

    socket.on("activeGameFound", handleActiveGame);
    socket.emit("checkActiveGame", { userId: user._id });
    hasCheckedActiveGame.current = true;

    return () => socket.off("activeGameFound", handleActiveGame);
  }, [socket, connected, user]);

  const computedWalletBalance =
    Number(user?.wallet?.deposit || 0) +
    Number(user?.wallet?.winnings || 0) +
    Number(user?.wallet?.bonus || 0);

  // 5. Start Play Action
  const handlePlay = async (match) => {
    setError("");
    if (!connected) return setError("Server se jud rahe hain... koshish karein.");
    if (searching) return;

    // Security & Balance Check
    if (computedWalletBalance < Number(match.entryFee)) {
      return setError("❌ Low Balance! Recharge karke kheliye.");
    }

    if (!selectedColor) return setError("Goti ka rang chunna zaroori hai!");

    try {
      hasNavigated.current = false;
      setSearching(true);
      
      socket.emit("JOIN_GAME", {
        gameType: "ludo",
        gameMode: String(match.gameMode || match.type),
        entryFee: Number(match.entryFee)
      });
    } catch (err) {
      setError("Matchmaking failed. Try again.");
      setSearching(false);
    }
  };

  return (
    <div style={styles.pageWrapper}>
      <Header user={user} showBack={true} title={`${mode.toUpperCase()} ARENA`} />

      {/* 📡 Status Bar */}
      <div style={styles.statusRow}>
        <div style={styles.onlineBadge}>
           <span className="pulse-dot"></span> {online || '250+'} Active Players
        </div>
      </div>

      {/* ⚠️ Rejoin Active Game */}
      {rejoinRoomId && (
        <div className="rejoin-anim" style={styles.rejoinBanner}>
          <div style={{flex: 1}}>
             <p style={{margin: 0, fontWeight: '900', fontSize: '14px'}}>MATCH IN PROGRESS</p>
             <p style={{margin: 0, fontSize: '11px', opacity: 0.8}}>Aapka game abhi chal raha hai!</p>
          </div>
          <button style={styles.rejoinBtn} onClick={() => navigate(`/ludo/board/${rejoinRoomId}`)}>
            REJOIN
          </button>
        </div>
      )}

      {error && <div style={styles.errorBanner}>{error}</div>}

      {/* 🎨 Color Picker with Visual Tokens */}
      <div style={styles.colorPickerSection}>
        <span style={styles.colorPickerLabel}>SELECT YOUR LUDO COLOR</span>
        <div style={styles.colorButtons}>
          {[
            { id: 'red', bg: '#FF3A3A' },
            { id: 'green', bg: '#2ECC71' },
            { id: 'blue', bg: '#3498DB' },
            { id: 'yellow', bg: '#F1C40F' }
          ].map((color) => (
            <button
              key={color.id}
              onClick={() => setSelectedColor(color.id)}
              style={{
                ...styles.colorButton,
                background: color.bg,
                border: selectedColor === color.id ? '3px solid #fff' : '2.5px solid transparent',
                transform: selectedColor === color.id ? 'scale(1.1)' : 'scale(1)',
                boxShadow: selectedColor === color.id ? `0 0 15px ${color.bg}` : 'none'
              }}
            >
              <div style={styles.tokenDot} />
            </button>
          ))}
        </div>
      </div>

      {/* 🎮 LIST OF TABLES */}
      <div style={styles.matchList}>
        {loading ? (
           <div style={styles.loaderContainer}>
              <div className="skeleton-card" />
              <div className="skeleton-card" />
           </div>
        ) : matches.length === 0 ? (
          <div style={styles.emptyText}>Dukh ki baat hai, abhi koi table active nahi hai.</div>
        ) : (
          matches.map((m, i) => (
            <GameCard
              key={i}
              match={{ ...m, entryFee: m.entryFee, prizeMoney: m.prizeMoney, type: m.type || m.gameMode }}
              userBalance={computedWalletBalance}
              buttonText="JOIN"
              onPlay={() => handlePlay(m)}
            />
          ))
        )}
      </div>

      {/* 🔍 MATCHMAKING OVERLAY */}
      {searching && (
        <div style={styles.overlay}>
          <div style={styles.searchCard}>
            <div className="search-radar">
               <div className="radar-circle" />
               <div className="radar-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            </div>
            <h2 style={styles.searchTitle}>Opponent Mil Raha Hai...</h2>
            <p style={styles.searchSub}>Matching you with a skilled player</p>
            <button onClick={() => { setSearching(false); socket?.emit("cancelMatchmaking"); }} style={styles.cancelBtn}>
              CANCEL
            </button>
          </div>
        </div>
      )}

      <style>{`
        .pulse-dot { height: 8px; width: 8px; background: #00ff88; border-radius: 50%; display: inline-block; margin-right: 8px; box-shadow: 0 0 10px #00ff88; animation: p 1.5s infinite; }
        @keyframes p { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }
        
        .rejoin-anim { animation: slideUp 0.5s ease; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .search-radar { position: relative; width: 100px; height: 100px; margin: 0 auto 30px; display: flex; alignItems: center; justifyContent: center; }
        .radar-circle { position: absolute; inset: 0; border: 2px solid #FFD700; border-radius: 50%; animation: radar 2s infinite linear; }
        .radar-avatar { width: 50px; height: 50px; background: #FFD700; color: #000; border-radius: 50%; display: flex; alignItems: center; justifyContent: center; font-weight: 900; font-size: 20px; }
        @keyframes radar { 0% { transform: scale(0.5); opacity: 1; } 100% { transform: scale(2); opacity: 0; } }

        .skeleton-card { height: 120px; background: rgba(255,255,255,0.05); border-radius: 20px; margin-bottom: 12px; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 0.8; } 100% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}

const styles = {
  pageWrapper: { height: "100dvh", background: "#0a0a0a", color: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" },
  statusRow: { padding: "15px 20px 5px", display: "flex", justifyContent: "center" },
  onlineBadge: { background: "rgba(0, 255, 136, 0.1)", color: "#00ff88", padding: "6px 16px", borderRadius: "30px", fontSize: "11px", fontWeight: "900", border: "1px solid rgba(0, 255, 136, 0.2)" },
  
  colorPickerSection: { padding: "15px 20px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  colorPickerLabel: { fontSize: "10px", fontWeight: "900", color: "#555", letterSpacing: "1px", display: "block", marginBottom: "12px" },
  colorButtons: { display: "flex", gap: "12px" },
  colorButton: { flex: 1, height: "45px", borderRadius: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)" },
  tokenDot: { width: "12px", height: "12px", background: "rgba(255,255,255,0.4)", borderRadius: "50%", border: "2px solid rgba(0,0,0,0.1)" },
  
  matchList: { flex: 1, overflowY: "auto", padding: "20px 15px 120px" },
  emptyText: { textAlign: "center", marginTop: "50px", opacity: 0.4, fontSize: "13px" },
  errorBanner: { margin: "10px 15px", padding: "12px", background: "rgba(255, 58, 58, 0.15)", color: "#ff3a3a", borderRadius: "12px", textAlign: "center", fontSize: "12px", fontWeight: "bold", border: "1px solid rgba(255, 58, 58, 0.3)" },
  

  rejoinBanner: { margin: "10px 15px", padding: "15px 20px", background: "linear-gradient(90deg, #FFD700, #FFA500)", color: "#000", borderRadius: "18px", display: "flex", alignItems: "center", boxShadow: "0 10px 20px rgba(0,0,0,0.3)" },
  rejoinBtn: { padding: "10px 20px", background: "#000", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "900", fontSize: "12px" },
  
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  searchCard: { background: "#111", width: "85%", maxWidth: "340px", padding: "40px 25px", borderRadius: "32px", textAlign: "center", border: "2px solid #333" },
  searchTitle: { color: "#FFD700", fontSize: "20px", fontWeight: "900", marginBottom: "10px" },
  searchSub: { color: "#888", fontSize: "12px", marginBottom: "40px" },
  cancelBtn: { width: "100%", background: "#222", color: "#fff", padding: "15px", borderRadius: "16px", border: "none", fontWeight: "bold" }
};