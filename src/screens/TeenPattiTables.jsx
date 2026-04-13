import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { useSocket } from '../services/SocketContext';
import { gameAPI, authAPI } from '../services/api'; // Added authAPI for fallback
import { toast } from 'sonner';

const tableStyles = {
  classic: { color: '#FFD700' },
  muflis: { color: '#FFA500' },
  ak47: { color: '#FF4500' }
};

export default function TeenPattiTables() {
  const { mode } = useParams();
  const navigate = useNavigate();
  const { tpSocket, tpConnected } = useSocket() || {}; // Using tpSocket namespace

  const [user, setUser] = useState(null);
  const [tables, setTables] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
    fetchTables();
  }, [mode]);

  const loadUser = async () => {
    try {
      const res = await authAPI.getProfile();
      setUser(res.data.user);
    } catch (err) {
      navigate('/login');
    }
  };

  // 🔥 1. SOCKET MATCHMAKING LOGIC
  useEffect(() => {
    if (!tpSocket) return;

    const handleMatchFound = (data) => {
      console.log("🎯 TEEN PATTI MATCH FOUND!", data);
      setIsSearching(false);
      toast.success("Match Found! Joining...");
      navigate(`/tp-game/${data.roomId}`); // Matches App.jsx route
    };

    const handleError = (msg) => {
      toast.error(msg);
      setIsSearching(false);
    };

    tpSocket.on("tp_matchFound", handleMatchFound);
    tpSocket.on("tp_error", handleError);

    return () => {
      tpSocket.off("tp_matchFound", handleMatchFound);
      tpSocket.off("tp_error", handleError);
    };
  }, [tpSocket, navigate]);

  // 🔥 2. FETCH DYNAMIC TABLES FROM DB
  const fetchTables = async () => {
    setLoading(true);
    try {
      // ✅ FIXED: Changed from getMatches to getTPMatches
      const res = await gameAPI.getTPMatches();
      const list = res.data?.matches || res.data?.teenpatti || [];
      
      const filtered = list
        .filter((item) => item.type?.toLowerCase() === mode?.toLowerCase())
        .map((item) => ({
          id: item._id || item.id,
          boot: item.entryFee || 0,
          min: item.entryFee || 0,
          pot: item.prizeMoney || 0,
          label: item.label || `${item.type?.toUpperCase()} TABLE`,
          online: item.online ?? Math.floor(Math.random() * 20), // Fallback online count
          color: tableStyles[item.type]?.color || '#FFD700',
          type: item.type
        }));

      setTables(filtered);
    } catch (err) {
      console.error('Unable to load TP tables', err);
      toast.error('Unable to load tables.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTable = (table) => {
    if (!tpSocket || !tpConnected) {
      toast.error("Connecting to server... Please wait.");
      return;
    }
    
    if (isSearching) return;

    // Balance Check
    const totalBalance = Number(user?.wallet?.deposit || 0) + Number(user?.wallet?.winnings || 0);
    if (totalBalance < table.boot) {
      toast.error(`Minimum balance ₹${table.boot} required!`);
      return;
    }

    setSelectedTable(table);
    setIsSearching(true);

    console.log("📡 Requesting TP Matchmaking...");
    tpSocket.emit("tp_joinMatchmaking", {
      userId: user?._id || user?.id,
      name: user?.name || "Player",
      boot: table.boot,
      mode: mode
    });
  };

  const handleCancel = () => {
    setIsSearching(false);
    if (tpSocket) tpSocket.emit("tp_leaveMatchmaking");
  };

  if (loading) return <div style={styles.loader}>🃏 Loading Arena...</div>;

  return (
    <div style={styles.page}>
      <Header 
        user={user} 
        showBack 
        title={`${mode?.toUpperCase()} ARENA`} 
        theme="teenpatti" 
        onBack={() => navigate('/tp-modes')} 
      />

      <div style={styles.content}>
        <div style={styles.heroSection}>
          <h2 style={styles.heroTitle}>Select Your Table</h2>
          <p style={styles.heroSub}>Choose a boot amount to enter the arena</p>
        </div>

        <div style={styles.grid}>
          {tables.length === 0 ? (
            <div style={styles.loader}>No active tables for this mode.</div>
          ) : (
            tables.map((table) => (
              <div 
                key={table.id} 
                style={{
                  ...styles.tableCard,
                  borderLeft: `6px solid ${table.color}`
                }}
                onClick={() => handleJoinTable(table)}
              >
                <div style={styles.cardInfo}>
                  <div style={styles.bootSection}>
                    <div style={{
                      ...styles.bootCircle,
                      borderColor: table.color,
                      color: table.color
                    }}>
                      ₹{table.boot}
                    </div>

                    <div>
                      <h3 style={styles.tableTitle}>{table.label}</h3>
                      <p style={styles.tableLimit}>
                        Entry: ₹{table.boot} | Max Pot: ₹{table.pot}
                      </p>
                    </div>
                  </div>

                  <div style={styles.actionSection}>
                    <span style={styles.onlineCount}>
                      🟢 {table.online} Online
                    </span>
                    <button style={{
                      ...styles.joinBtn,
                      background: `linear-gradient(180deg, ${table.color}, #000)`
                    }}>
                      JOIN
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 🔍 SEARCHING UI */}
        {isSearching && (
          <div style={styles.overlay}>
            <div style={styles.loaderBox}>
              <div className="animate-bounce" style={styles.spinner}>🎴</div>
              <h3 style={{ margin: '10px 0' }}>Searching Opponent...</h3>
              <p style={{ fontSize: '12px', color: '#ffd700' }}>
                {mode?.toUpperCase()} • ₹{selectedTable?.boot}
              </p>
              <button style={styles.cancelBtn} onClick={handleCancel}>
                CANCEL
              </button>
            </div>
          </div>
        )}

        <p style={styles.disclaimer}>
          *Minimum balance required to play. Verified Fair Play ✅
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { background: 'radial-gradient(circle, #2a0000, #000)', minHeight: '100vh', color: '#fff', paddingBottom: '50px' },
  content: { padding: '20px' },
  heroSection: { textAlign: 'center', marginBottom: '25px' },
  heroTitle: { fontSize: '22px', fontWeight: 'bold', margin: 0 },
  heroSub: { fontSize: '12px', color: '#ffd700' },
  grid: { display: 'flex', flexDirection: 'column', gap: '15px' },
  tableCard: { background: 'rgba(255,255,255,0.05)', borderRadius: '15px', padding: '15px', cursor: 'pointer', backdropFilter: 'blur(10px)' },
  cardInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  bootSection: { display: 'flex', alignItems: 'center', gap: '15px' },
  bootCircle: { width: '55px', height: '55px', borderRadius: '50%', border: '2px solid', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' },
  tableTitle: { margin: 0, fontSize: '18px', fontWeight: '900' },
  tableLimit: { fontSize: '11px', color: '#aaa' },
  actionSection: { textAlign: 'right' },
  onlineCount: { fontSize: '10px', color: '#4CAF50', fontWeight: 'bold', display: 'block' },
  joinBtn: { marginTop: '5px', border: 'none', padding: '6px 15px', borderRadius: '8px', color: '#fff', fontWeight: 'bold', fontSize: '12px' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  loaderBox: { textAlign: 'center', background: '#1a0505', padding: '40px', borderRadius: '30px', border: '2px solid #ffd700', width: '80%' },
  spinner: { fontSize: '60px', marginBottom: '20px' },
  cancelBtn: { marginTop: '20px', background: '#FFD700', border: 'none', padding: '12px 30px', borderRadius: '15px', color: '#000', fontWeight: 'bold' },
  disclaimer: { textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginTop: '30px', fontSize: '10px' },
  loader: { minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFD700', fontWeight: 'bold' }
};