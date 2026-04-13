import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { authAPI } from "../services/api";

// API Base URL (Aap ise environment variable mein bhi rakh sakte hain)
const API_BASE = import.meta.env.VITE_API_URL || "http://16.171.165.109:5001/api";

export default function GamePage() {
  const navigate = useNavigate();
  const { roomId } = useParams();

  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  // 1. Auth & Security Check
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authAPI.getProfile();
        if (res.data.success) {
          setUser(res.data.user);
          setBalance(Number(res.data.user.wallet?.balance || 0));
          localStorage.setItem("user", JSON.stringify(res.data.user));
          return;
        }
      } catch (err) {
        console.error("Profile fetch failed:", err);
      }
      navigate("/login");
    };

    const userStr = localStorage.getItem("user");
    if (!userStr || userStr === "undefined") {
      fetchProfile();
      return;
    }

    try {
      setUser(JSON.parse(userStr));
    } catch {
      fetchProfile();
    }

    fetchProfile();
  }, [navigate]);

  // 2. Fetch Game State (Polling optimized with useCallback)
  const fetchGame = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/game/${roomId}`);
      setGame(res.data);
      
      // AUTO-START: Agar players full hain, toh game arena mein bhej do
      if (res.data.players && res.data.players.length >= 2) {
          // Ek chota delay taaki user ko "Matched" status dikhe
          setTimeout(() => navigate(`/play/${roomId}`), 1500);
      }
    } catch (err) {
      console.error("Ludo-Pro: Game load error", err);
    } finally {
      setLoading(false);
    }
  }, [roomId, navigate]);

  useEffect(() => {
    if (roomId) {
      fetchGame();
      const interval = setInterval(fetchGame, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [roomId, fetchGame]);

  // 3. Join Match Action
  const handleJoin = async () => {
    if (!user || joining) return;
    try {
      setJoining(true);
      const res = await axios.post(`${API_BASE}/game/join`, { 
        roomId, 
        userId: user._id 
      });
      setGame(res.data);
      
      // Haptic Feedback for Join
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    } catch (err) {
      alert(err.response?.data?.msg || "Join failed. Check balance.");
    } finally {
      setJoining(false);
    }
  };

  if (loading) return (
    <div style={styles.loaderContainer}>
      <div className="game-spinner" />
      <p>Searching for Room...</p>
    </div>
  );

  const walletBalance = balance;

  const playersCount = game?.players?.length || 0;
  const isFull = playersCount >= 2;
  const isMeJoined = game?.players?.some(p => p.userId === user?._id);

  return (
    <div style={styles.pageWrapper}>
      {/* --- PREMIUM HEADER --- */}
      <div style={styles.topBar}>
        <button onClick={() => navigate("/dashboard")} style={styles.backBtn}>
          ← EXIT LOBBY
        </button>
        <div style={styles.walletInfo}>
          <span style={{opacity: 0.8, fontSize: '10px'}}>BALANCE:</span>
          <span style={{fontSize: '15px'}}> ₹{walletBalance.toFixed(2)}</span>
        </div>
      </div>

      {/* --- MATCHMAKING ARENA --- */}
      <div style={styles.matchArea}>
        <div style={styles.modeBadge}>{game?.type?.toUpperCase() || "CLASSIC"}</div>
        <div style={styles.roomID}>ROOM: <span style={{color: '#FFD700'}}>{roomId}</span></div>
        
        <div style={styles.vsContainer}>
          {/* Player 1 (You or Opponent) */}
          <div style={styles.playerSlot}>
            <div style={{...styles.avatarCircle, borderColor: game?.players[0] ? '#2ecc71' : '#444'}}>
              <div style={{...styles.avatarInner, background: game?.players[0]?.color || '#333'}}>
                {game?.players[0] ? (game.players[0].name?.[0].toUpperCase() || "P") : "?"}
              </div>
            </div>
            <div style={styles.pLabel}>{game?.players[0]?.name || "Searching..."}</div>
          </div>

          <div style={styles.vsCircle}>
             <div style={styles.vsText}>VS</div>
             <div style={styles.vsGlow} />
          </div>

          {/* Player 2 (Waiting) */}
          <div style={styles.playerSlot}>
            <div style={{
                ...styles.avatarCircle, 
                borderColor: game?.players[1] ? '#2ecc71' : '#FFD700',
                animation: !game?.players[1] ? "pulseGlow 1.5s infinite" : "none"
            }}>
              <div style={{...styles.avatarInner, background: game?.players[1]?.color || '#1a1a1a'}}>
                {game?.players[1] ? (game.players[1].name?.[0].toUpperCase() || "P") : "?"}
              </div>
            </div>
            <div style={styles.pLabel}>{game?.players[1]?.name || "Waiting..."}</div>
          </div>
        </div>
      </div>

      {/* --- PRIZE BOARD --- */}
      <div style={styles.prizeBoard}>
         <div style={styles.prizeInner}>
            <p style={styles.prizeSub}>WINNING PRIZE</p>
            <h2 style={styles.prizeMain}>₹{game?.prizeMoney || 0}</h2>
            <div style={styles.entryLine}>Entry Fee: ₹{game?.entryFee || 0}</div>
         </div>
      </div>

      {/* --- FOOTER ACTIONS --- */}
      <div style={styles.footer}>
        {!isMeJoined ? (
          <button 
            onClick={handleJoin} 
            disabled={joining}
            style={styles.joinBtn}
          >
            {joining ? "JOINING..." : "JOIN NOW"}
          </button>
        ) : isFull ? (
          <div style={styles.startBanner}>
            <span style={styles.pulseText}>MATCH FOUND! STARTING...</span>
          </div>
        ) : (
          <div style={styles.waitingContainer}>
            <div className="search-loader" />
            <p>LOOKING FOR OPPONENTS...</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 0px #FFD700; transform: scale(1); }
          50% { box-shadow: 0 0 20px #FFD700; transform: scale(1.05); }
          100% { box-shadow: 0 0 0px #FFD700; transform: scale(1); }
        }
        @keyframes vsPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .search-loader {
          width: 20px; height: 20px; border: 3px solid #FFD700;
          border-top: 3px solid transparent; border-radius: 50%;
          animation: spin 0.8s linear infinite; margin-bottom: 10px;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const styles = {
  pageWrapper: { height: "100dvh", background: "#0a0a0a", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", overflow: "hidden" },
  loaderContainer: { height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#000" },
  topBar: { width: "100%", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  backBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "8px 15px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold" },
  walletInfo: { display: "flex", flexDirection: "column", alignItems: "flex-end", background: "rgba(255,215,0,0.1)", padding: "5px 15px", borderRadius: "12px", border: "1px solid rgba(255,215,0,0.2)" },
  
  matchArea: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%" },
  modeBadge: { background: "#E91E63", padding: "4px 15px", borderRadius: "20px", fontSize: "10px", fontWeight: "bold", letterSpacing: "1px", marginBottom: "10px" },
  roomID: { fontSize: "12px", opacity: 0.6, marginBottom: "30px" },
  
  vsContainer: { display: "flex", alignItems: "center", gap: "25px", marginBottom: "40px" },
  playerSlot: { display: "flex", flexDirection: "column", alignItems: "center", width: "90px" },
  avatarCircle: { width: "80px", height: "80px", borderRadius: "50%", padding: "4px", border: "2px solid", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.5s ease" },
  avatarInner: { width: "100%", height: "100%", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "bold", border: "2px solid rgba(255,255,255,0.1)" },
  pLabel: { marginTop: "12px", fontSize: "12px", fontWeight: "600", color: "#888", textAlign: "center" },
  
  vsCircle: { width: "50px", height: "50px", borderRadius: "50%", background: "#fff", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" },
  vsText: { fontWeight: "900", fontSize: "18px", zIndex: 2, animation: "vsPulse 1s infinite" },
  vsGlow: { position: "absolute", width: "100%", height: "100%", background: "#fff", borderRadius: "50%", opacity: 0.3, filter: "blur(10px)" },
  
  prizeBoard: { width: "80%", maxWidth: "320px", background: "rgba(255,255,255,0.03)", borderRadius: "24px", padding: "20px", border: "1px solid rgba(255,255,255,0.05)", textAlign: "center" },
  prizeSub: { fontSize: "11px", color: "#666", fontWeight: "bold", letterSpacing: "1px" },
  prizeMain: { fontSize: "38px", color: "#FFD700", fontWeight: "900", margin: "5px 0" },
  entryLine: { fontSize: "12px", opacity: 0.5 },
  
  footer: { padding: "40px 20px", width: "100%", display: "flex", justifyContent: "center" },
  joinBtn: { width: "100%", maxWidth: "300px", height: "55px", borderRadius: "18px", border: "none", background: "linear-gradient(90deg, #FFD700, #FFA500)", color: "#000", fontWeight: "900", fontSize: "16px", boxShadow: "0 10px 25px rgba(255, 165, 0, 0.3)", cursor: "pointer" },
  startBanner: { color: "#2ecc71", fontWeight: "900", fontSize: "16px", textAlign: "center" },
  waitingContainer: { display: "flex", flexDirection: "column", alignItems: "center", color: "#FFD700", fontWeight: "bold", fontSize: "11px", letterSpacing: "1px" }
};