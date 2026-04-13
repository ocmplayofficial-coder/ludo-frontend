import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api";
import { useSocket } from "../services/SocketContext";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const { disconnectSockets } = useSocket() || {};

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await authAPI.getProfile();
      if (res.data.success) {
        setUser(res.data.user);
        setName(res.data.user.name || "");
      }
    } catch (err) {
      localStorage.clear();
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) return alert("Name cannot be empty");
    try {
      const res = await authAPI.updateProfile({ name: name.trim() });
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setEditing(false);
      }
    } catch {
      alert("Update failed");
    }
  };

  const copyReferral = () => {
    const code = user?.referral?.code || "TRYPLAYERS";
    navigator.clipboard.writeText(code);
    alert("Referral Code Copied! 🎁");
  };

  if (loading) return <div style={styles.loader}>Loading Profile...</div>;

  return (
    <div style={styles.container}>
      {/* 📡 HEADER */}
      <Header showBack title="MY PROFILE" user={user} />

      <div style={styles.content}>
        {/* 👤 AVATAR & BASIC INFO */}
        <div style={styles.profileHeader}>
          <div style={styles.avatarWrapper}>
            <div style={styles.avatar}>
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <button style={styles.editCircle} onClick={() => setEditing(!editing)}>
              {editing ? "✖" : "✎"}
            </button>
          </div>

          {editing ? (
            <div style={styles.editSection}>
              <input
                style={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Full Name"
                autoFocus
              />
              <button style={styles.saveBtn} onClick={handleSaveProfile}>SAVE CHANGES</button>
            </div>
          ) : (
            <div style={styles.infoSection}>
              <h2 style={styles.userName}>{user?.name || "Ludo Player"}</h2>
              <p style={styles.userPhone}>📞 +91 {user?.phone}</p>
            </div>
          )}
        </div>

        {/* 📊 PERFORMANCE STATS */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>GAMES</span>
            <span style={styles.statValue}>{user?.stats?.gamesPlayed || 0}</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>WINS</span>
            <span style={{...styles.statValue, color: '#2ecc71'}}>{user?.stats?.gamesWon || 0}</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statLabel}>EARNINGS</span>
            <span style={{...styles.statValue, color: '#f1c40f'}}>₹{user?.stats?.totalEarnings || 0}</span>
          </div>
        </div>

        {/* 🎁 REFERRAL BOX */}
        <div style={styles.glassCard}>
          <div style={styles.cardHeader}>
            <span>🎁 REFER & EARN</span>
            <span style={styles.bonusTag}>₹50 BONUS</span>
          </div>
          <p style={styles.cardSub}>Share your code with friends to get cash bonus!</p>
          <div style={styles.referralRow}>
            <div style={styles.codeBox}>{user?.referral?.code || "REF123"}</div>
            <button style={styles.copyBtn} onClick={copyReferral}>COPY</button>
          </div>
        </div>

        {/* ⚙️ QUICK LINKS */}
        <div style={styles.menuList}>
          <div style={styles.menuItem} onClick={() => navigate("/wallet")}>
            <span>💰 My Wallet & History</span>
            <span>→</span>
          </div>
          <div style={styles.menuItem} onClick={() => window.open("https://t.me/", "_blank")}>
            <span>💬 Customer Support</span>
            <span>→</span>
          </div>
          <button
            style={styles.logoutBtn}
            onClick={() => {
              if (disconnectSockets) {
                disconnectSockets();
                console.log("🔌 Socket manually disconnected on logout");
              }
              localStorage.clear();
              window.location.href = "/login";
            }}
          >
            🚪 LOGOUT ACCOUNT
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

const styles = {
  container: { minHeight: "100vh", background: "var(--app-bg)", paddingBottom: "100px" },
  loader: { height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontWeight: "bold" },
  content: { padding: "20px" },
  
  // Profile Header
  profileHeader: { display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "30px" },
  avatarWrapper: { position: "relative", marginBottom: "15px" },
  avatar: { width: "90px", height: "90px", borderRadius: "50%", background: "linear-gradient(45deg, #FFD700, #FFA500)", color: "#000", fontSize: "36px", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center", border: "4px solid rgba(255,255,255,0.1)" },
  editCircle: { position: "absolute", bottom: "0", right: "0", width: "30px", height: "30px", borderRadius: "50%", background: "#fff", border: "none", fontSize: "14px", cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" },
  userName: { color: "var(--text-primary)", fontSize: "22px", fontWeight: "900", margin: "0" },
  userPhone: { color: "var(--text-secondary)", fontSize: "13px", marginTop: "5px" },
  
  // Stats
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" },
  statCard: { background: "var(--surface-alt)", padding: "15px 10px", borderRadius: "15px", textAlign: "center", border: "1px solid var(--surface-border)" },
  statLabel: { display: "block", fontSize: "10px", color: "#aaa", fontWeight: "bold", marginBottom: "5px" },
  statValue: { fontSize: "18px", fontWeight: "900", color: "#fff" },

  // Glass Cards
  glassCard: { background: "var(--surface)", backdropFilter: "blur(10px)", padding: "20px", borderRadius: "20px", border: "1px solid var(--surface-border)", marginBottom: "20px" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "900", color: "var(--accent)", fontSize: "14px", marginBottom: "10px" },
  bonusTag: { background: "#2ecc71", color: "#fff", fontSize: "10px", padding: "2px 8px", borderRadius: "5px" },
  cardSub: { color: "#ccc", fontSize: "11px", marginBottom: "15px" },
  referralRow: { display: "flex", gap: "10px" },
  codeBox: { flex: 1, background: "var(--surface-alt)", padding: "12px", borderRadius: "10px", textAlign: "center", fontWeight: "bold", border: "1px dashed var(--accent)", color: "var(--text-primary)", letterSpacing: "2px" },
  copyBtn: { background: "var(--accent)", border: "none", padding: "0 20px", borderRadius: "10px", fontWeight: "bold", cursor: "pointer" },

  // Menu List
  menuList: { display: "flex", flexDirection: "column", gap: "10px" },
  menuItem: { background: "var(--surface-alt)", padding: "18px", borderRadius: "15px", display: "flex", justifyContent: "space-between", color: "var(--text-primary)", fontWeight: "bold", fontSize: "14px", cursor: "pointer" },
  logoutBtn: { marginTop: "10px", background: "rgba(255, 68, 68, 0.1)", border: "1px solid #ff4444", color: "#ff4444", padding: "15px", borderRadius: "15px", fontWeight: "bold", cursor: "pointer" },

  // Edit Section
  editSection: { width: "100%", textAlign: "center" },
  input: { width: "80%", padding: "12px", borderRadius: "10px", border: "1px solid #FFD700", background: "rgba(0,0,0,0.3)", color: "#fff", textAlign: "center", marginBottom: "10px" },
  saveBtn: { background: "#FFD700", border: "none", padding: "8px 20px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer" }
};

export default Profile;