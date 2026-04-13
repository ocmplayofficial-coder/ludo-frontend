import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

const initialPlayers = [
  { id: "P-001", name: "Player_Alpha", email: "alpha@game.com", level: 42, wins: 156, losses: 44, coins: 12500, status: "active" },
  { id: "P-005", name: "GameMaster", email: "master@game.com", level: 65, wins: 310, losses: 90, coins: 45000, status: "active" },
];

export default function Players() {
  const navigate = useNavigate();
  const [data, setData] = useState(initialPlayers);
  const [search, setSearch] = useState("");
  const [adjAmount, setAdjAmount] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [message, setMessage] = useState("");

  const filtered = data.filter((player) =>
    player.name.toLowerCase().includes(search.toLowerCase()) ||
    player.email.toLowerCase().includes(search.toLowerCase())
  );

  const openAdjust = (player) => {
    setSelectedPlayer(player);
    setAdjAmount("");
    setMessage("");
  };

  const closeAdjust = () => {
    setSelectedPlayer(null);
    setAdjAmount("");
    setMessage("");
  };

  const updateBalance = () => {
    const amount = parseInt(adjAmount, 10);
    if (Number.isNaN(amount)) {
      setMessage("Invalid amount. Use numbers only.");
      return;
    }

    setData((prev) => prev.map((player) =>
      player.id === selectedPlayer.id
        ? { ...player, coins: player.coins + amount }
        : player
    ));

    setMessage(`Wallet of ${selectedPlayer.name} updated by ${amount} coins.`);
    setAdjAmount("");
  };

  const totalPlayers = data.length;
  const activePlayers = data.filter((p) => p.status === "active").length;
  const vipPlayers = data.filter((p) => p.level >= 50).length;
  const bannedPlayers = data.filter((p) => p.status !== "active").length;

  return (
    <div style={styles.container}>
      <Header user={null} showBack title="PLAYERS" />

      <div style={styles.content}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.pageTitle}>Game Users</h1>
            <p style={styles.pageSubtitle}>Monitor and manage player wallets</p>
          </div>
        </div>

        <div style={styles.statsGrid}>
          <div style={{ ...styles.statCard, borderColor: "#3b82f6" }}>
            <div style={styles.statLabel}>Total Players</div>
            <div style={styles.statValue}>{totalPlayers}</div>
          </div>
          <div style={{ ...styles.statCard, borderColor: "#16a34a" }}>
            <div style={styles.statLabel}>Active Now</div>
            <div style={styles.statValue}>{activePlayers}</div>
          </div>
          <div style={{ ...styles.statCard, borderColor: "#eab308" }}>
            <div style={styles.statLabel}>VIP Players</div>
            <div style={styles.statValue}>{vipPlayers}</div>
          </div>
          <div style={{ ...styles.statCard, borderColor: "#ef4444" }}>
            <div style={styles.statLabel}>Banned</div>
            <div style={styles.statValue}>{bannedPlayers}</div>
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.tableHeaderRow}>
            <div style={styles.tableTitle}>Player List</div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name/email..."
              style={styles.searchInput}
            />
          </div>

          <div style={styles.table}>
            <div style={{ ...styles.tableRow, ...styles.tableHead }}>
              <div style={styles.cell}>Player</div>
              <div style={styles.cell}>Coins</div>
              <div style={styles.cell}>W/L</div>
              <div style={styles.cell}>Status</div>
              <div style={styles.cell}>Actions</div>
            </div>

            {filtered.map((player) => (
              <div key={player.id} style={styles.tableRow}>
                <div style={styles.playerCell}>
                  <div style={styles.avatar}>{player.name.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <div style={styles.playerName}>{player.name}</div>
                    <div style={styles.playerEmail}>{player.email}</div>
                  </div>
                </div>
                <div style={styles.cell}>₹{player.coins.toLocaleString()}</div>
                <div style={styles.cell}>{player.wins}W / {player.losses}L</div>
                <div style={styles.cell}>
                  <span style={player.status === "active" ? styles.badgeActive : styles.badgeInactive}>{player.status}</span>
                </div>
                <div style={styles.cell}>
                  <button style={styles.actionButton} onClick={() => openAdjust(player)}>Adjust Wallet</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedPlayer && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <div>
                  <h2 style={styles.modalTitle}>Adjust Wallet: {selectedPlayer.name}</h2>
                  <p style={styles.modalSub}>Current Balance: ₹{selectedPlayer.coins.toLocaleString()}</p>
                </div>
                <button style={styles.closeButton} onClick={closeAdjust}>×</button>
              </div>

              <div style={styles.modalBody}>
                <input
                  type="number"
                  placeholder="Example: 500 or -500"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  style={styles.modalInput}
                />
                <button style={styles.updateButton} onClick={updateBalance}>Update Balance</button>
                {message && <div style={styles.message}>{message}</div>}
                <p style={styles.note}>Use a minus sign (-) to deduct coins from the wallet.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #440000 0%, #1a0000 100%)",
    paddingBottom: "90px"
  },
  content: {
    padding: "15px",
    maxWidth: "1200px",
    margin: "0 auto"
  },
  headerRow: {
    marginBottom: "18px"
  },
  pageTitle: {
    color: "#fff",
    fontSize: "24px",
    margin: 0
  },
  pageSubtitle: {
    color: "#ccc",
    marginTop: "6px",
    fontSize: "14px"
  },
  statsGrid: {
    display: "grid",
    gap: "14px",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    marginBottom: "18px"
  },
  statCard: {
    padding: "18px",
    borderRadius: "18px",
    border: "1px solid",
    background: "rgba(255,255,255,0.06)"
  },
  statLabel: {
    color: "#aaa",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.8px"
  },
  statValue: {
    marginTop: "10px",
    fontSize: "24px",
    color: "#fff",
    fontWeight: "800"
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    borderRadius: "22px",
    padding: "20px",
    border: "1px solid rgba(255,255,255,0.08)"
  },
  tableHeaderRow: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "18px"
  },
  tableTitle: {
    color: "#fff",
    fontSize: "16px",
    fontWeight: "700"
  },
  searchInput: {
    minWidth: "220px",
    padding: "10px 14px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff"
  },
  table: {
    display: "grid",
    gap: "12px"
  },
  tableRow: {
    display: "grid",
    gridTemplateColumns: "2.6fr 1fr 1fr 1fr 1fr",
    gap: "12px",
    alignItems: "center",
    padding: "14px 0",
    borderBottom: "1px solid rgba(255,255,255,0.08)"
  },
  tableHead: {
    color: "#999",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.9px"
  },
  cell: {
    color: "#fff",
    fontSize: "14px"
  },
  playerCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "12px",
    background: "#8b0000",
    color: "#fff",
    display: "grid",
    placeItems: "center",
    fontWeight: "700"
  },
  playerName: {
    fontWeight: "700",
    color: "#fff",
    fontSize: "14px"
  },
  playerEmail: {
    fontSize: "12px",
    color: "#aaa"
  },
  badgeActive: {
    padding: "4px 10px",
    borderRadius: "999px",
    background: "rgba(34,197,94,0.15)",
    color: "#22c55e",
    fontSize: "12px"
  },
  badgeInactive: {
    padding: "4px 10px",
    borderRadius: "999px",
    background: "rgba(239,68,68,0.15)",
    color: "#f43f5e",
    fontSize: "12px"
  },
  actionButton: {
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    cursor: "pointer"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000
  },
  modal: {
    width: "100%",
    maxWidth: "520px",
    background: "#111",
    borderRadius: "24px",
    padding: "24px",
    border: "1px solid rgba(255,255,255,0.12)"
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginBottom: "18px"
  },
  modalTitle: {
    color: "#fff",
    fontSize: "18px",
    margin: 0
  },
  modalSub: {
    color: "#aaa",
    marginTop: "6px",
    fontSize: "13px"
  },
  closeButton: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: "24px",
    lineHeight: 1,
    cursor: "pointer"
  },
  modalBody: {
    display: "grid",
    gap: "12px"
  },
  modalInput: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff"
  },
  updateButton: {
    padding: "12px 16px",
    borderRadius: "14px",
    border: "none",
    background: "#22c55e",
    color: "#000",
    fontWeight: "700",
    cursor: "pointer"
  },
  message: {
    color: "#a3e635",
    fontSize: "13px"
  },
  note: {
    color: "#aaa",
    fontSize: "12px"
  }
};
