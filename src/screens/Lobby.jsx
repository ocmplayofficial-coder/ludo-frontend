import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameAPI, authAPI } from '../services/api';
import { useSocket } from '../services/SocketContext';
import Header from '../components/Header';
import GameCard from '../components/GameCard';
import BottomNav from '../components/BottomNav';

const Lobby = () => {
  const [matches, setMatches] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searching, setSearching] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState(0);

  const navigate = useNavigate();
  const { socket, connected } = useSocket();

  const totalBalance = user
    ? Number(user.wallet?.deposit || 0) +
      Number(user.wallet?.winnings || 0) +
      Number(user.wallet?.bonus || 0)
    : 0;

  // 1. Load User Profile
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await authAPI.getProfile();
        setUser(res.data.user);
      } catch (err) {
        navigate('/login');
      }
    };
    loadUser();
  }, [navigate]);

  // 2. Load Matches with Polling
  const loadMatches = useCallback(async () => {
    try {
      const res = await gameAPI.getMatches('all');
      if (res.data.success) {
        setMatches(res.data.matches);
      }
    } catch (err) {
      console.error("Match Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatches();
    const interval = setInterval(loadMatches, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [loadMatches]);

  // 3. Socket Event Handlers
  useEffect(() => {
    if (!socket) return;

    socket.on('matchFound', (data) => {
      setSearching(false);
      navigate(`/game/${data.roomId}`, { replace: true });
    });

    socket.on('waitingForPlayer', () => setSearching(true));
    socket.on('matchmakingError', (err) => {
      setSearching(false);
      alert(err);
    });
    socket.on('onlinePlayers', (count) => setOnlinePlayers(count));

    return () => {
      socket.off('matchFound');
      socket.off('waitingForPlayer');
      socket.off('matchmakingError');
      socket.off('onlinePlayers');
    };
  }, [socket, navigate]);

  // 4. Actions
  const handlePlayGame = async (match) => {
    if (searching) return;

    // Fresh balance check before starting
    if (totalBalance < match.entryFee) {
      return alert('Insufficient balance! Please recharge your wallet.');
    }

    if (!socket || !connected) return alert('Server Connection Lost. Please Refresh.');

    setSearching(true);
    socket.emit('joinMatchmaking', {
      type: match.type,
      entryFee: match.entryFee
    });
  };

  const handleCancel = () => {
    socket?.emit('cancelMatchmaking');
    setSearching(false);
  };

  const filteredMatches = matches.filter(
    m => activeTab === 'all' || m.type === activeTab
  );

  if (loading) return <div style={styles.loader}>Connecting to Arena...</div>;

  return (
    <div style={styles.container}>
      {/* 📡 HEADER */}
      <Header user={user} showSettings={true} />

      {/* 🏆 LOBBY INFO */}
      <div style={styles.onlineInfo}>
        <div style={styles.pulseDot} />
        {onlinePlayers} LIVE PLAYERS
      </div>

      {/* 📑 TABS (Premium Look) */}
      <div style={styles.tabContainer}>
        {['all', 'classic', 'rapid', 'turn'].map(tab => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...styles.tabItem,
              color: activeTab === tab ? '#FFD700' : '#aaa',
              borderBottom: activeTab === tab ? '3px solid #FFD700' : 'none',
              background: activeTab === tab ? 'rgba(255,215,0,0.1)' : 'transparent'
            }}
          >
            {tab.toUpperCase()}
          </div>
        ))}
      </div>

      {/* 🔍 SEARCHING OVERLAY */}
      {searching && (
        <div style={styles.overlay}>
          <div style={styles.searchCard}>
            <div style={styles.spinner} />
            <h2 style={styles.searchTitle}>Searching Opponent...</h2>
            <p style={styles.searchSub}>Matching with players for ₹{filteredMatches[0]?.entryFee} table</p>
            <button onClick={handleCancel} style={styles.cancelBtn}>CANCEL MATCH</button>
          </div>
        </div>
      )}

      {/* 🧩 MATCH CARDS LIST */}
      <div style={styles.scrollArea}>
        {filteredMatches.length === 0 ? (
          <div style={styles.emptyText}>No matches found in this category.</div>
        ) : (
          filteredMatches.map((match, i) => (
            <GameCard
              key={i}
              match={match}
              onPlay={() => handlePlayGame(match)}
              userBalance={totalBalance}
            />
          ))
        )}
      </div>

      {/* 🔻 BOTTOM NAV */}
      <BottomNav activeTab="lobby" />

      <style>{`
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "var(--app-bg)",
    paddingBottom: "90px",
  },
  loader: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFD700', fontWeight: 'bold' },
  onlineInfo: {
    textAlign: 'center',
    color: '#00ff88',
    fontSize: '11px',
    fontWeight: '900',
    padding: '10px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    letterSpacing: '1px'
  },
  pulseDot: { width: 8, height: 8, background: '#00ff88', borderRadius: '50%', boxShadow: '0 0 10px #00ff88', animation: 'pulse 2s infinite' },
  tabContainer: {
    display: 'flex',
    justifyContent: 'center',
    background: 'var(--surface-alt)',
    marginBottom: '15px',
    position: 'sticky',
    top: '65px',
    zIndex: 10
  },
  tabItem: {
    padding: '12px 20px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: '0.3s'
  },
  scrollArea: { padding: '0 15px', display: 'flex', flexDirection: 'column', gap: '10px' },
  emptyText: { textAlign: 'center', color: '#888', marginTop: '50px', fontSize: '14px' },
  
  // Searching Overlay
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: "20px"
  },
  searchCard: {
    background: "var(--surface)", width: "100%", maxWidth: "320px",
    padding: "40px 20px", borderRadius: "25px", textAlign: "center", border: "2px solid var(--accent)", boxShadow: "0 0 30px var(--shadow)"
  },
  spinner: {
    width: "50px", height: "50px", border: "5px solid rgba(255,215,0,0.1)", borderTop: "5px solid #FFD700",
    borderRadius: "50%", margin: "0 auto 20px", animation: "rotate 1s linear infinite"
  },
  searchTitle: { color: "#FFD700", fontSize: "20px", fontWeight: "900", marginBottom: "10px" },
  searchSub: { color: "#ccc", fontSize: "12px", marginBottom: "30px" },
  cancelBtn: {
    background: "var(--surface-alt)", border: "1px solid var(--surface-border)",
    color: "var(--text-primary)", padding: "10px 30px", borderRadius: "20px", fontWeight: "bold", cursor: "pointer"
  }
};

export default Lobby;