import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { gameAPI } from "../services/api";
import Header from "../components/Header";

const Result = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return navigate("/login");
    setUser(JSON.parse(userStr));

    const stateResult = location.state?.result;
    if (stateResult) {
      setResult(stateResult);
      setLoading(false);
    } else {
      fetchGameResult();
    }
  }, [roomId, navigate, location.state]);

  const fetchGameResult = async () => {
    try {
      const res = await gameAPI.getGame(roomId);
      if (res?.data?.success) {
        setResult(res.data.game);
      }
    } catch (err) {
      console.error("Result Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const maskPhone = (phone) => {
    if (!phone) return "Player";
    return `+91 ${phone.slice(0, 3)}****${phone.slice(-3)}`;
  };

  const getRankings = useCallback(() => {
    if (!result?.players) return [];

    return result.players
      .map((player) => {
        const score = result?.gameState?.scores?.[player.color] || 0;
        const isWinner = player.userId?._id === result?.winner?.userId?._id || player.userId === result?.winner?.userId;

        return {
          user: player.userId,
          phone: player.phone,
          score,
          color: player.color,
          isWinner,
          winnings: isWinner ? (result?.prizeMoney || 0) : 0,
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, position: index + 1 }));
  }, [result]);

  if (loading) return <div style={styles.loader}>Finalizing Scores...</div>;
  if (!result) return <div style={styles.loader}>No Result Found</div>;

  const rankings = getRankings();
  const winner = rankings.find(r => r.isWinner) || rankings[0];
  const amIWinner = winner?.user?._id === user?._id || winner?.user === user?._id;

  return (
    <div style={styles.container}>
      {/* 📡 HEADER */}
      <Header user={user} showBack={true} title="MATCH RESULT" />

      <div style={styles.content}>
        {/* 🏆 WINNER CELEBRATION */}
        <div style={styles.victoryCard}>
          <div style={styles.trophyIcon}>🏆</div>
          <h1 style={styles.winnerStatus}>
            {amIWinner ? "YOU WON!" : "MATCH OVER"}
          </h1>
          <div style={styles.winnerAvatar}>
             {winner?.phone?.charAt(0) || "W"}
          </div>
          <h2 style={styles.winnerPhone}>{maskPhone(winner?.phone)}</h2>
          <div style={styles.prizeWon}>₹{winner?.winnings.toFixed(2)}</div>
          <p style={styles.wonLabel}>Total Winnings Credited</p>
        </div>

        {/* 📊 LEADERBOARD */}
        <div style={styles.leaderboard}>
          <h3 style={styles.sectionTitle}>SCOREBOARD</h3>
          {rankings.map((r) => (
            <div 
              key={r.position} 
              style={{
                ...styles.rankRow,
                borderLeft: `5px solid ${r.color}`,
                background: r.isWinner ? "rgba(255, 215, 0, 0.15)" : "rgba(255,255,255,0.05)"
              }}
            >
              <div style={styles.rankNum}>#{r.position}</div>
              <div style={styles.playerInfo}>
                <span style={styles.pPhone}>{maskPhone(r.phone)}</span>
                <span style={styles.pScore}>{r.score} Pts</span>
              </div>
              <div style={{...styles.winAmount, color: r.isWinner ? "#FFD700" : "#aaa"}}>
                {r.isWinner ? `+₹${r.winnings}` : "₹0"}
              </div>
            </div>
          ))}
        </div>

        {/* 🎮 ACTIONS */}
        <div style={styles.actionRow}>
          <button style={styles.homeBtn} onClick={() => navigate("/dashboard")}>
            GO HOME
          </button>
          <button style={styles.playBtn} onClick={() => navigate("/ludo-modes")}>
            PLAY AGAIN
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes shine { from { left: -100%; } to { left: 100%; } }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #440000 0%, #1a0000 100%)",
    paddingBottom: "40px"
  },
  loader: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFD700', fontWeight: 'bold' },
  content: { padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" },
  
  // Winner Section
  victoryCard: {
    width: "100%",
    maxWidth: "340px",
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
    borderRadius: "24px",
    padding: "30px 20px",
    textAlign: "center",
    border: "1px solid rgba(255,215,0,0.3)",
    marginBottom: "30px",
    position: "relative",
    overflow: "hidden"
  },
  trophyIcon: { fontSize: "60px", marginBottom: "10px", animation: "bounce 2s infinite ease-in-out" },
  winnerStatus: { fontSize: "24px", fontWeight: "900", color: "#FFD700", letterSpacing: "2px", margin: "0 0 15px 0" },
  winnerAvatar: { width: "70px", height: "70px", borderRadius: "50%", background: "#FFD700", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "30px", fontWeight: "bold", margin: "0 auto 10px", border: "3px solid #fff" },
  winnerPhone: { fontSize: "16px", color: "#fff", margin: "0 0 10px 0" },
  prizeWon: { fontSize: "32px", fontWeight: "900", color: "#FFD700", textShadow: "0 0 15px rgba(255,215,0,0.4)" },
  wonLabel: { fontSize: "11px", color: "#aaa", textTransform: "uppercase", fontWeight: "bold", marginTop: "5px" },

  // Leaderboard
  leaderboard: { width: "100%", maxWidth: "340px" },
  sectionTitle: { fontSize: "12px", color: "#aaa", fontWeight: "bold", marginBottom: "15px", letterSpacing: "1px", textAlign: "center" },
  rankRow: {
    display: "flex",
    alignItems: "center",
    padding: "15px",
    borderRadius: "15px",
    marginBottom: "10px",
    backdropFilter: "blur(5px)",
  },
  rankNum: { width: "30px", fontSize: "16px", fontWeight: "900", color: "#FFD700" },
  playerInfo: { flex: 1, display: "flex", flexDirection: "column" },
  pPhone: { fontSize: "14px", fontWeight: "bold", color: "#fff" },
  pScore: { fontSize: "11px", color: "#aaa" },
  winAmount: { fontSize: "16px", fontWeight: "bold" },

  // Actions
  actionRow: { width: "100%", maxWidth: "340px", display: "flex", gap: "15px", marginTop: "20px" },
  homeBtn: { flex: 1, padding: "15px", borderRadius: "30px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: "bold", cursor: "pointer" },
  playBtn: { flex: 1, padding: "15px", borderRadius: "30px", border: "none", background: "linear-gradient(90deg, #FFD700, #FFA500)", color: "#000", fontWeight: "900", cursor: "pointer", boxShadow: "0 10px 20px rgba(0,0,0,0.3)" }
};

export default Result;