import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { walletAPI } from "../services/api";
import BottomNav from "../components/BottomNav";
import Header from "../components/Header"; // Humara premium header

export default function Transactions() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const API_URL = import.meta.env.VITE_API_URL || "http://16.171.165.109:5001/api";

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      const endpoint = newStatus === "success" 
        ? `${API_URL}/admin/transactions/approve/${id}`
        : `${API_URL}/admin/transactions/reject/${id}`;
      
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
      
      const data = await res.json();
      
      if (data.success) {
        setList((prev) => prev.map((tx) => (tx.id === id ? { ...tx, status: newStatus } : tx)));
        alert(`Transaction ${id} ${newStatus === "success" ? "Approved!" : "Rejected."}`);
      } else {
        alert(`Failed: ${data.message}`);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) setUser(JSON.parse(userStr));

    const loadTransactions = async () => {
      try {
        const res = await walletAPI.getTransactions();
        setList(res.data.transactions || []);
      } catch (err) {
        console.error("❌ TX Load Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, []);

  // Helper to format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + 
           " " + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const filtered = list.filter((tx) => {
    const searchTerm = search.toLowerCase();
    const matchSearch =
      tx.id?.toLowerCase().includes(searchTerm) ||
      tx.type?.toLowerCase().includes(searchTerm) ||
      tx.method?.toLowerCase().includes(searchTerm);
    const matchType = typeFilter === "all" || tx.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div style={styles.container}>
      {/* 📡 PREMIUM HEADER */}
      <Header user={user} showBack={true} title="TRANSACTIONS" />

      <div style={styles.content}>
        <div style={styles.toolbar}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search TXN, type or method..."
            style={styles.searchInput}
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={styles.select}
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="withdraw">Withdrawal</option>
          </select>
        </div>

        {loading ? (
          <div style={styles.center}>
             <div className="spinner" />
             <p style={{marginTop: 10}}>Fetching Passbook...</p>
          </div>
        ) : list.length === 0 ? (
          <div style={styles.center}>
            <div style={{fontSize: 50, opacity: 0.3}}>📄</div>
            <p style={{opacity: 0.6}}>No transaction history found</p>
          </div>
        ) : (
          <div style={styles.listArea}>
            {list.map((tx, i) => {
              const isCredit = tx.type === "deposit" || tx.type === "winning" || tx.type === "referral";
              
              return (
                <div key={i} style={styles.txCard}>
                  <div style={styles.left}>
                    <div style={{
                      ...styles.iconCircle,
                      background: isCredit ? "rgba(46, 204, 113, 0.2)" : "rgba(231, 76, 60, 0.2)",
                      color: isCredit ? "#2ecc71" : "#e74c3c"
                    }}>
                      {isCredit ? "↙" : "↗"}
                    </div>
                    <div>
                      <div style={styles.txTitle}>{tx.type?.toUpperCase()}</div>
                      <div style={styles.txDate}>{formatDate(tx.createdAt)}</div>
                    </div>
                  </div>

                  <div style={styles.right}>
                    <div style={{
                      ...styles.amount,
                      color: isCredit ? "#2ecc71" : "#fff"
                    }}>
                      {isCredit ? "+" : "-"} ₹{tx.amount}
                    </div>
                    <div style={{
                      ...styles.status,
                      color: tx.status === "success" ? "#4CAF50" : tx.status === "pending" ? "#FFD700" : "#ff4444"
                    }}>
                      ● {tx.status?.toUpperCase()}
                    </div>
                    {(tx.type === "withdraw" || tx.type === "withdrawal") && tx.status === "pending" && (
                      <div style={styles.actionRow}>
                        <button
                          style={styles.approveButton}
                          onClick={() => handleStatusUpdate(tx.id, "success")}
                        >
                          Approve
                        </button>
                        <button
                          style={styles.rejectButton}
                          onClick={() => handleStatusUpdate(tx.id, "failed")}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav activeTab="profile" />

      <style>{`
        .spinner {
          width: 30px; height: 30px;
          border: 3px solid rgba(255,215,0,0.1);
          border-top: 3px solid #FFD700;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #440000 0%, #1a0000 100%)",
    paddingBottom: "90px",
  },
  content: { padding: "15px" },
  toolbar: { display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "15px" },
  searchInput: {
    flex: 1,
    minWidth: "180px",
    padding: "10px 14px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff"
  },
  select: {
    minWidth: "150px",
    padding: "10px 14px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff"
  },
  center: { textAlign: "center", marginTop: "100px", color: "#aaa" },
  listArea: { display: "flex", flexDirection: "column", gap: "10px" },
  
  txCard: {
    background: "rgba(255, 255, 255, 0.05)",
    backdropFilter: "blur(10px)",
    padding: "15px",
    borderRadius: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  actionRow: {
    display: "flex",
    gap: "8px",
    marginTop: "10px"
  },
  approveButton: {
    padding: "8px 12px",
    borderRadius: "12px",
    border: "1px solid #2ecc71",
    background: "rgba(46,204,113,0.12)",
    color: "#2ecc71",
    cursor: "pointer"
  },
  rejectButton: {
    padding: "8px 12px",
    borderRadius: "12px",
    border: "1px solid #e74c3c",
    background: "rgba(231,76,60,0.12)",
    color: "#e74c3c",
    cursor: "pointer"
  },
  left: { display: "flex", alignItems: "center", gap: "12px" },
  iconCircle: {
    width: "40px", height: "40px", borderRadius: "12px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "20px", fontWeight: "bold"
  },
  txTitle: { color: "#fff", fontWeight: "900", fontSize: "14px", letterSpacing: "0.5px" },
  txDate: { color: "#888", fontSize: "11px", marginTop: "2px" },
  
  right: { textAlign: "right" },
  amount: { fontSize: "16px", fontWeight: "900" },
  status: { fontSize: "9px", fontWeight: "bold", marginTop: "4px", letterSpacing: "1px" }
};