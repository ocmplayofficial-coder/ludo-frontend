import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { gameAPI } from "../services/api";

export default function TournamentGameList() {
  const { gameType } = useParams();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joiningId, setJoiningId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const userId = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      return user?._id || user?.id || null;
    } catch {
      return null;
    }
  }, []);

  const fetchTournaments = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const res = await gameAPI.getTournaments(gameType);
      const data = res.data.tournaments || [];
      console.log("Game tournaments:", data);
      setTournaments(data);
    } catch (err) {
      console.error("Error fetching tournaments:", err);
      setError(err.response?.data?.message || "Unable to fetch tournaments");
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [gameType]);

  const handleJoin = async (tournamentId) => {
    if (!tournamentId) {
      setError("Invalid tournament ID");
      return;
    }

    const tournament = tournaments.find((item) => (item._id || item.id) === tournamentId);
    const tournamentName = tournament?.name || tournament?.title || "this tournament";
    if (!window.confirm(`Join ${tournamentName}?`)) return;

    setError("");
    setSuccessMessage("");
    setJoiningId(tournamentId);

    try {
      const res = await gameAPI.joinTournament(tournamentId);
      if (res.data.success) {
        const message = `You joined ${tournamentName}!`;
        setSuccessMessage(message);
        await fetchTournaments();
      }
    } catch (err) {
      console.error("Join failed:", err.response?.data || err);
      const message = err.response?.data?.message || "Unable to join tournament";
      setError(message);
      setSuccessMessage("");
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <div style={styles.page}>
      <button style={styles.backButton} onClick={() => navigate("/tournaments")}>← Back to Selection</button>
      <h3 style={styles.heading}>{gameType?.toUpperCase() || "Tournament"} Tournaments List</h3>

      {loading ? (
        <div style={styles.message}>Loading tournaments...</div>
      ) : error ? (
        <div style={styles.error}>{error}</div>
      ) : tournaments.length === 0 ? (
        <div style={styles.message}>No tournaments available right now.</div>
      ) : (
        <>
          {successMessage && <div style={styles.success}>{successMessage}</div>}
          {tournaments.map((t) => {
            const players = Number(t.playersJoined || (Array.isArray(t.players) ? t.players.length : 0));
            const max = Number(t.maxPlayers || 2);
            const isFull = players >= max;
            const isJoined = userId && Array.isArray(t.players)
              ? t.players.some((player) => player?.toString ? player.toString() === userId : player === userId)
              : false;

            return (
              <div key={t._id || t.id} style={styles.tournamentRowCard}>
                <div>
                  <div style={styles.rowTitle}>{t.name || t.title}</div>
                  <div style={styles.rowMeta}>
                    Entry: ₹{t.entryFee || 0} · Players: {players}/{max} · Status: {t.status || "registration"}
                  </div>
                </div>
                {isFull ? (
                  <button style={{ ...styles.joinBtn, ...styles.fullBtn }}>Full</button>
                ) : (
                  <button
                    style={styles.joinBtn}
                    onClick={() => handleJoin(t._id || t.id)}
                    disabled={joiningId === (t._id || t.id) || isJoined}
                  >
                    {joiningId === (t._id || t.id) ? "Joining..." : isJoined ? "Joined" : "Join"}
                  </button>
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100dvh",
    background: "radial-gradient(circle at top, rgba(255,215,0,0.08), transparent 24%), linear-gradient(180deg, #08020a 0%, #050305 100%)",
    color: "#fff",
    padding: "30px 20px 120px",
    maxWidth: 980,
    margin: "0 auto",
  },
  backButton: {
    marginBottom: 18,
    padding: "10px 16px",
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    cursor: "pointer",
  },
  heading: {
    fontSize: 28,
    fontWeight: 800,
    marginBottom: 20,
  },
  message: {
    padding: 20,
    borderRadius: 18,
    background: "rgba(255,255,255,0.05)",
    color: "#ccc",
    textAlign: "center",
  },
  error: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 18,
    background: "rgba(255,75,75,0.15)",
    color: "#ff9a9a",
  },
  success: {
    padding: 20,
    marginBottom: 20,
    borderRadius: 18,
    background: "rgba(50, 205, 50, 0.12)",
    color: "#b6ffb3",
  },
  tournamentRowCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
  },
  rowTitle: {
    fontSize: 18,
    fontWeight: 800,
    marginBottom: 6,
  },
  rowMeta: {
    color: "#ccc",
    fontSize: 13,
  },
  joinBtn: {
    padding: "12px 20px",
    borderRadius: 16,
    border: "none",
    background: "#FFD700",
    color: "#000",
    fontWeight: 700,
    cursor: "pointer",
  },
  fullBtn: {
    padding: "12px 20px",
    borderRadius: 16,
    border: "none",
    background: "#999",
    color: "#fff",
    fontWeight: 700,
    cursor: "not-allowed",
  },
};
