import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PullToRefresh from "react-simple-pull-to-refresh";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import Card from "../components/Card";
import { authAPI, adminAPI, gameAPI } from "../services/api";
import { useSocket } from "../services/SocketContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { socket } = useSocket() || {};

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onlinePlayers, setOnlinePlayers] = useState(0);
  const [activeGames, setActiveGames] = useState(0);

  const refreshUserProfile = async () => {
    try {
      const res = await authAPI.getProfile();
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error("Profile refresh failed:", err);
    }
  };

  // Admin state
  const [adminData, setAdminData] = useState({
    users: [],
    totalDeposits: 0,
    totalWithdrawals: 0,
    netRevenue: 0,
    onlinePlayers: 0,
    liveLudo: 0,
    liveTP: 0,
    totalProfit: 0,
    recentMatches: [],
  });

  const styles = useMemo(() => getStyles(), []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await authAPI.getProfile();
        if (res.data.success) {
          setUser(res.data.user);
          localStorage.setItem("user", JSON.stringify(res.data.user));

          const isAdmin = res.data.user?.role === "admin" || res.data.user?.role === "super-admin";
          
          if (isAdmin) {
            const [statsRes, usersRes, dashboardRes] = await Promise.all([
              adminAPI.getFinancialStats(),
              adminAPI.getUsers(),
              adminAPI.getDashboardStats(),
            ]);

            setAdminData({
              users: usersRes.data.users || usersRes.data || [],
              totalDeposits: statsRes.data.totalDeposits || 0,
              totalWithdrawals: statsRes.data.totalWithdrawals || 0,
              netRevenue: statsRes.data.netRevenue || 0,
              onlinePlayers: dashboardRes.data?.onlinePlayers || 0,
              liveLudo: dashboardRes.data?.liveLudo || 0,
              liveTP: dashboardRes.data?.liveTP || dashboardRes.data?.liveTeenPatti || 0,
              totalProfit: dashboardRes.data?.totalProfit || dashboardRes.data?.adminProfit || 0,
              recentMatches: dashboardRes.data?.recentMatches || [],
            });
          }
        }
      } catch (err) {
        console.error("Load failed:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  useEffect(() => {
    refreshUserProfile();

    const handleFocus = () => refreshUserProfile();
    window.addEventListener("focus", handleFocus);

    const intervalId = setInterval(refreshUserProfile, 10000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(intervalId);
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    await refreshUserProfile();
    if (socket) {
      socket.emit("get_lobby_stats");
    }
  }, [socket]);

  // Socket for real-time stats
  useEffect(() => {
    if (!socket) return;
    socket.on("lobby_stats_update", (data) => {
      setOnlinePlayers(data.onlinePlayers || 0);
      setActiveGames(data.activeGames || 0);
    });
    socket.on("UPDATE_STATS", (data) => {
      setOnlinePlayers(data.online || 0);
      setActiveGames(data.liveGames || 0);
    });
    socket.emit("get_lobby_stats");
    return () => {
      socket.off("lobby_stats_update");
      socket.off("UPDATE_STATS");
    };
  }, [socket]);

  const isAdmin = user?.role === "admin" || user?.role === "super-admin";
  const totalBalance = user?.wallet
    ? (Number(user.wallet.deposit) + Number(user.wallet.winnings) + Number(user.wallet.bonus)).toFixed(2)
    : "0.00";

  if (loading) return <div style={styles.loader}>🚀 Loading OSMPLAY...</div>;

  return (
    <div style={isAdmin ? styles.adminContainer : styles.playerContainer}>
      {isAdmin && (
        <>
          <div style={styles.bgShapeTop} />
          <div style={styles.bgShapeBottom} />
        </>
      )}
      
      <Header user={user} showSettings={true} title={isAdmin ? "ADMIN PANEL" : "DASHBOARD"} />

      {isAdmin ? (
        // ADMIN DASHBOARD
        <div style={styles.adminContent}>
          <div style={styles.heroSection}>
            <img src="/osmplay_logo.svg" alt="OSMPLAY" style={styles.logo} />
            <h1 style={styles.adminTitle}>OSMPLAY ADMIN</h1>
            <p style={styles.adminSubtitle}>Gaming Management Dashboard</p>
          </div>

          <div style={styles.statRow}>
            <div style={{ ...styles.statCard, borderLeft: "6px solid #4CAF50" }}>
              <span style={styles.statLabel}>Total Deposits</span>
              <h2 style={styles.statValue}>₹{Number(adminData.totalDeposits).toLocaleString('en-IN')}</h2>
              <div style={styles.statIcon}>💰</div>
            </div>
            <div style={{ ...styles.statCard, borderLeft: "6px solid #f44336" }}>
              <span style={styles.statLabel}>Total Withdrawals</span>
              <h2 style={styles.statValue}>₹{Number(adminData.totalWithdrawals).toLocaleString('en-IN')}</h2>
              <div style={styles.statIcon}>💸</div>
            </div>
            <div style={{ ...styles.statCard, borderLeft: "6px solid #FFD700" }}>
              <span style={styles.statLabel}>Net Revenue</span>
              <h2 style={{ ...styles.statValue, color: '#FFD700' }}>₹{Number(adminData.netRevenue).toLocaleString('en-IN')}</h2>
              <div style={styles.statIcon}>⭐</div>
            </div>
          </div>

          <div style={styles.tableCard}>
            <div style={styles.tableHeaderRow}>
              <h3 style={styles.tableTitle}>Players Database</h3>
              <span style={styles.tableCount}>{adminData.users.length} players</span>
            </div>
            <div style={styles.scrollWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Username</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Wallet</th>
                    <th style={styles.th}>Winnings</th>
                  </tr>
                </thead>
                <tbody>
                  {adminData.users.length > 0 ? (
                    adminData.users.slice(0, 20).map((player, idx) => (
                      <tr key={player._id || idx} style={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
                        <td style={styles.td}>{player.name || "Unknown"}</td>
                        <td style={styles.td}>{player.phone || "-"}</td>
                        <td style={styles.td}>₹{Number(player.wallet?.deposit || 0).toLocaleString('en-IN')}</td>
                        <td style={styles.td}>₹{Number(player.wallet?.winnings || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={styles.noDataCell}>Loading Players...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ ...styles.tableCard, marginTop: '24px' }}>
            <div style={styles.tableHeaderRow}>
              <h3 style={styles.tableTitle}>Recent Activity</h3>
              <span style={styles.tableCount}>{adminData.recentMatches?.length || 0} latest games</span>
            </div>
            <div style={styles.scrollWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Game</th>
                    <th style={styles.th}>Room</th>
                    <th style={styles.th}>Mode</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Entry</th>
                    <th style={styles.th}>Prize</th>
                    <th style={styles.th}>Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(adminData.recentMatches) && adminData.recentMatches.length > 0 ? (
                    adminData.recentMatches.map((match, idx) => (
                      <tr key={match.id || idx} style={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
                        <td style={styles.td}>{(match.gameType || 'ludo').toUpperCase()}</td>
                        <td style={styles.td}>{match.roomId || '-'}</td>
                        <td style={styles.td}>{(match.mode || match.type || 'classic').toUpperCase()}</td>
                        <td style={styles.td}>{match.status || '-'}</td>
                        <td style={styles.td}>₹{Number(match.entryFee || 0).toLocaleString('en-IN')}</td>
                        <td style={styles.td}>₹{Number(match.prizeMoney || 0).toLocaleString('en-IN')}</td>
                        <td style={styles.td}>{match.winner || 'TBD'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={styles.noDataCell}>No recent games yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // PLAYER DASHBOARD
        <PullToRefresh onRefresh={handleRefresh} pullingContent="" refreshingContent="">
          <div style={styles.playerContent}>
            <div style={styles.statsGrid}>
              <Card
                title="WALLET BALANCE"
                value={`₹${totalBalance}`}
                icon="💰"
                description="Total withdrawable cash"
                onClick={() => navigate("/wallet")}
              />
              <div style={styles.statsRow}>
                <Card title="ONLINE" value={onlinePlayers > 0 ? onlinePlayers : "742"} icon="🟢" />
                <Card title="LIVE GAMES" value={activeGames > 0 ? activeGames : "28"} icon="🎮" />
              </div>
            </div>

            <div style={styles.sectionHeader}>
              <span style={styles.sectionTitle}>SELECT ARENA</span>
              <div style={styles.line} />
            </div>

            <div style={styles.gameGrid}>
              <div
                style={{ ...styles.gameCard, background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)" }}
                onClick={() => navigate("/ludo-modes")}
              >
                <div style={styles.gameIcon}>🎲</div>
                <div style={styles.gameInfo}>
                  <h3 style={styles.gameTitle}>LUDO PRO</h3>
                  <p style={styles.gameSub}>Instant Withdrawal • 24/7</p>
                </div>
                <div style={styles.playBtn}>PLAY</div>
              </div>

              <div
                style={{ ...styles.gameCard, background: "linear-gradient(135deg, #2a0000 0%, #4a0000 100%)", border: "1px solid rgba(255,255,255,0.1)" }}
                onClick={() => navigate("/tp-modes")}
              >
                <div style={{ ...styles.gameIcon, background: "rgba(255,255,255,0.1)" }}>🃏</div>
                <div style={styles.gameInfo}>
                  <h3 style={{ ...styles.gameTitle, color: "#fff" }}>TEEN PATTI</h3>
                  <p style={{ ...styles.gameSub, color: "#aaa" }}>High Stakes • Live Players</p>
                </div>
                <div style={{ ...styles.playBtn, background: "#FFD700", color: "#000" }}>PLAY</div>
              </div>

              <div
                style={{ ...styles.gameCard, background: "linear-gradient(135deg, #1f2a38 0%, #111a24 100%)", border: "1px solid rgba(255,215,0,0.16)" }}
                onClick={() => navigate("/tournaments")}
              >
                <div style={{ ...styles.gameIcon, background: "rgba(255,215,0,0.14)", color: "#FFD700" }}>🏆</div>
                <div style={styles.gameInfo}>
                  <h3 style={{ ...styles.gameTitle, color: "#FFD700" }}>Tournaments</h3>
                  <p style={{ ...styles.gameSub, color: "#ccc" }}>Select Ludo or Teen Patti</p>
                </div>
                <div style={{ ...styles.playBtn, background: "#FFD700", color: "#000" }}>
                  OPEN
                </div>
              </div>
            </div>


            <div style={styles.promoBanner}>
              <div style={styles.promoContent}>
                <h4 style={{ margin: 0, fontSize: "14px" }}>REFER & EARN 🎁</h4>
                <p style={{ margin: 0, fontSize: "10px", color: "#888" }}>Get ₹50 for every friend join!</p>
              </div>
              <button onClick={() => navigate("/profile")} style={styles.inviteBtn}>INVITE</button>
            </div>
          </div>
        </PullToRefresh>
      )}

      <BottomNav />
    </div>
  );
}

const getStyles = () => ({
  playerContainer: {
    position: "relative",
    height: "100vh",
    background: "radial-gradient(circle at top, rgba(255,215,0,0.08), transparent 24%), linear-gradient(180deg, #08020a 0%, #050305 100%)",
    color: "#fff",
    paddingBottom: "120px",
    overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  },
  adminContainer: {
    minHeight: "100vh",
    background: "radial-gradient(circle at top, #07191d 0%, #04110f 35%, #020706 100%)",
    color: "#fff",
    overflow: "hidden",
    position: "relative",
    paddingBottom: "110px",
  },
  bgShapeTop: {
    position: "absolute",
    top: "-80px",
    right: "-80px",
    width: "280px",
    height: "280px",
    background: "radial-gradient(circle, rgba(255,215,0,0.25), transparent 55%)",
    filter: "blur(30px)",
    pointerEvents: "none",
  },
  bgShapeBottom: {
    position: "absolute",
    bottom: "-100px",
    left: "-100px",
    width: "340px",
    height: "340px",
    background: "radial-gradient(circle, rgba(0,255,138,0.18), transparent 55%)",
    filter: "blur(40px)",
    pointerEvents: "none",
  },
  loader: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#FFD700",
    fontWeight: "bold",
    background: "#000",
  },

  // ADMIN STYLES
  adminContent: {
    position: "relative",
    zIndex: 2,
    padding: "24px 20px 40px",
    maxWidth: "1180px",
    margin: "0 auto",
  },
  heroSection: {
    textAlign: "center",
    padding: "30px 20px 20px",
    marginBottom: "20px",
  },
  logo: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    border: "3px solid rgba(255,215,0,0.7)",
    boxShadow: "0 0 30px rgba(255,215,0,0.22)",
    marginBottom: "14px",
  },
  adminTitle: {
    margin: 0,
    fontSize: "26px",
    fontWeight: "900",
    color: "#fff",
  },
  adminSubtitle: {
    margin: "8px auto 0",
    fontSize: "13px",
    color: "#d3af38",
  },
  statRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "18px",
    marginBottom: "28px",
  },
  statCard: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "20px",
    padding: "20px",
    minHeight: "120px",
    position: "relative",
    boxShadow: "0 20px 45px rgba(0,0,0,0.18)",
  },
  statLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#ffd700",
    textTransform: "uppercase",
  },
  statValue: {
    margin: "10px 0 0",
    fontSize: "26px",
    fontWeight: "900",
    color: "#fff",
  },
  statIcon: {
    position: "absolute",
    right: 16,
    top: 16,
    fontSize: "24px",
    opacity: 0.35,
  },
  tableCard: {
    background: "rgba(255,255,255,0.06)",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: "20px",
    boxShadow: "0 25px 70px rgba(0,0,0,0.2)",
  },
  tableHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  tableTitle: {
    margin: 0,
    fontSize: "16px",
    color: "#fff",
    fontWeight: "900",
  },
  tableCount: {
    color: "#d3af38",
    fontWeight: "700",
    fontSize: "12px",
  },
  scrollWrapper: {
    height: "320px",
    overflowY: "auto",
    borderRadius: "16px",
    background: "rgba(0,0,0,0.2)",
    padding: "6px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "600px",
    color: "#fff",
  },
  th: {
    position: "sticky",
    top: 0,
    background: "rgba(4,11,15,0.96)",
    color: "#ffd700",
    padding: "12px 14px",
    fontSize: "11px",
    textAlign: "left",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    zIndex: 1,
  },
  td: {
    padding: "12px 14px",
    fontSize: "12px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    color: "#f5f5f5",
  },
  trOdd: {
    background: "rgba(255,255,255,0.02)",
  },
  trEven: {
    background: "transparent",
  },
  noDataCell: {
    textAlign: "center",
    padding: "20px",
    color: "#ffd700",
  },

  // PLAYER STYLES
  playerContent: {
    padding: "0 0 0 0",
  },
  statsGrid: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  statsRow: {
    display: "flex",
    gap: "15px",
  },
  sectionHeader: {
    padding: "10px 20px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  sectionTitle: {
    fontSize: "10px",
    fontWeight: "900",
    color: "#666",
    letterSpacing: "2px",
    whiteSpace: "nowrap",
  },
  line: {
    height: "1px",
    background: "#222",
    width: "100%",
  },
  gameGrid: {
    padding: "0 20px",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
  },
  selectionScreen: {
    margin: "0 20px 20px",
    padding: "20px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  backBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "18px",
    padding: "10px 14px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },
  selectionTitle: {
    margin: 0,
    marginBottom: "18px",
    fontSize: "22px",
    fontWeight: "900",
    color: "#fff",
  },
  selectionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
  },
  selectBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 18px",
    minHeight: "170px",
    borderRadius: "24px",
    cursor: "pointer",
    gap: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    transition: "transform 0.2s ease",
  },
  ludoBg: {
    background: "linear-gradient(135deg, rgba(255,215,0,0.12), rgba(255,255,255,0.04))",
  },
  tpBg: {
    background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
  },
  selectionIcon: {
    width: "60px",
    height: "60px",
    objectFit: "contain",
  },
  selectionLabel: {
    color: "#fff",
    fontWeight: "800",
    fontSize: "14px",
    textAlign: "center",
  },
  listScreen: {
    margin: "0 20px 20px",
    padding: "20px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  listTitle: {
    margin: 0,
    marginBottom: "16px",
    fontSize: "20px",
    fontWeight: "900",
    color: "#fff",
  },
  tournamentScroll: {
    display: "grid",
    gap: "14px",
  },
  tournamentItemRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "18px",
    borderRadius: "20px",
    background: "rgba(0,0,0,0.2)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "900",
    color: "#fff",
  },
  meta: {
    margin: "8px 0 0",
    fontSize: "13px",
    color: "#ccc",
  },
  slots: {
    margin: "6px 0 0",
    fontSize: "12px",
    color: "#aaa",
  },
  joinNowBtn: {
    minWidth: "120px",
    border: "none",
    borderRadius: "16px",
    padding: "14px 18px",
    background: "#FFD700",
    color: "#000",
    fontWeight: "800",
    cursor: "pointer",
  },
  tournamentDropdown: {
    background: "rgba(255,215,0,0.15)",
    borderColor: "rgba(255,215,0,0.28)",
    color: "#FFD700",
  },
  tournamentListPanel: {
    margin: "0 20px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    padding: "16px",
  },
  tournamentListHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "8px",
  },
  tournamentMeta: {
    fontSize: "12px",
    color: "#aaa",
  },
  tournamentCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "16px",
    background: "rgba(0,0,0,0.25)",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  tournamentTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "800",
    color: "#fff",
  },
  tournamentSubtext: {
    margin: "6px 0 0",
    fontSize: "12px",
    color: "#ccc",
  },
  viewJoinBtn: {
    minWidth: "110px",
    border: "none",
    borderRadius: "16px",
    padding: "12px 18px",
    background: "#FFD700",
    color: "#000",
    fontWeight: "800",
    cursor: "pointer",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    zIndex: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  modalContent: {
    width: "100%",
    maxWidth: "520px",
    background: "rgba(10,10,10,0.98)",
    borderRadius: "24px",
    padding: "24px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "20px",
  },
  modalTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "900",
    color: "#fff",
  },
  modalSubtext: {
    margin: "8px 0 0",
    color: "#ccc",
    fontSize: "13px",
  },
  modalCloseBtn: {
    width: "40px",
    height: "40px",
    borderRadius: "14px",
    border: "none",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: "22px",
    cursor: "pointer",
  },
  modalBody: {
    display: "grid",
    gap: "12px",
    marginBottom: "20px",
  },
  modalStat: {
    padding: "14px 16px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "14px",
  },
  modalDescription: {
    color: "#bbb",
    fontSize: "13px",
    lineHeight: "1.6",
  },
  modalFooter: {
    display: "flex",
    gap: "10px",
  },
  ludoTournamentList: {
    margin: "0 20px 15px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "18px",
    padding: "12px",
    maxHeight: "260px",
    overflowY: "auto",
  },
  ludoOptionItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "14px 16px",
    background: "rgba(255,255,255,0.06)",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  optionItem: {
    padding: "14px 18px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
    fontWeight: "700",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  gameCard: {
    padding: "18px",
    borderRadius: "24px",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
    boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
  },
  gameIcon: {
    width: "50px",
    height: "50px",
    background: "rgba(255,255,255,0.2)",
    borderRadius: "15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "24px",
    marginRight: "15px",
  },
  gameInfo: {
    flex: 1,
  },
  gameTitle: {
    margin: 0,
    fontSize: "18px",
    fontWeight: "900",
    color: "#000",
  },
  gameSub: {
    margin: 0,
    fontSize: "10px",
    color: "rgba(0,0,0,0.6)",
    fontWeight: "bold",
  },
  playBtn: {
    padding: "8px 18px",
    background: "#000",
    color: "#fff",
    borderRadius: "10px",
    fontSize: "11px",
    fontWeight: "900",
    border: "none",
    cursor: "pointer",
  },
  promoBanner: {
    margin: "25px 20px",
    padding: "18px",
    background: "rgba(255,255,255,0.04)",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  promoContent: {
    flex: 1,
  },
  inviteBtn: {
    background: "#FFD700",
    border: "none",
    padding: "8px 15px",
    borderRadius: "10px",
    fontWeight: "900",
    fontSize: "11px",
    cursor: "pointer",
  },
});
