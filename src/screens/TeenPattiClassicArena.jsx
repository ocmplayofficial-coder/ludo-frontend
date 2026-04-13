import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { gameAPI, authAPI } from '../services/api';
import { toast } from 'sonner';

export default function TeenPattiClassicArena() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState('');
  const [classicOptions, setClassicOptions] = useState([]);

  useEffect(() => {
    // 1. Refresh User Data to get latest balance
    const loadData = async () => {
      try {
        const res = await authAPI.getProfile();
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          navigate('/login');
        }
      } catch (err) {
        navigate('/login');
      }
    };
    loadData();
  }, [navigate]);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        // Backend se matches fetch karna
        const res = await gameAPI.getTPMatches(); 
        // Agar backend direct array bhej raha hai toh use karein
        const tables = res.data?.matches || [
          { id: 'tp10', entryFee: 10, label: 'CLASSIC BOOT' },
          { id: 'tp50', entryFee: 50, label: 'PRO BOOT' },
          { id: 'tp100', entryFee: 100, label: 'ROYAL BOOT' }
        ];

        setClassicOptions(tables.map((option) => ({
          ...option,
          prize: option.entryFee * 1.9, // 5% Admin Commission deducted
          players: '2-5'
        })));
      } catch (err) {
        toast.error('Unable to load tables. Connecting to local mock.');
        // Fallback for UI testing
        setClassicOptions([
          { id: 'tp10', entryFee: 10, prize: 19, label: 'CLASSIC BOOT', players: '2-5' },
          { id: 'tp50', entryFee: 50, prize: 95, label: 'PRO BOOT', players: '2-5' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  // Calculate Balance (Deposit + Winnings + Bonus)
  const userBalance = user?.wallet 
    ? (Number(user.wallet.deposit) + Number(user.wallet.winnings) + Number(user.wallet.bonus)) 
    : 0;

  const handleJoin = async (option) => {
    if (joinLoading) return;
    
    if (userBalance < option.entryFee) {
      toast.error(`Low Balance! Please add ₹${option.entryFee - userBalance} more.`);
      return;
    }

    setJoinLoading(true);
    try {
      const body = {
        bootAmount: option.entryFee,
        mode: 'CLASSIC'
      };
      
      const res = await gameAPI.joinTP(body);
      
      if (res.data.success && res.data.roomId) {
        toast.success("Table Joined! Good Luck.");
        // 🔥 Navigate to the Game Screen
        navigate(`/tp-game/${res.data.roomId}`); 
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Server error while joining.');
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white">Loading Arena...</div>;

  return (
    <div style={styles.page}>
      <Header user={user} showBack title="CLASSIC ARENA" theme="teenpatti" />

      <div style={styles.statusBar}>
        <span style={styles.onlineDot} />
        {classicOptions.length} Tables Available | Balance: ₹{userBalance.toFixed(2)}
      </div>

      <div style={styles.content}>
        <div style={styles.cardGrid}>
          {classicOptions.map((option) => {
            const enoughBalance = userBalance >= option.entryFee;
            return (
              <div key={option.id} style={styles.tableCard}>
                <div style={styles.tableLabel}>{option.label}</div>
                <div style={styles.cardBody}>
                  <div>
                    <div style={styles.prizeText}>₹{option.prize}</div>
                    <div style={styles.subText}>WIN ESTIMATE</div>
                  </div>
                  <div>
                    <div style={styles.playersText}>{option.players}</div>
                    <div style={styles.subText}>MAX PLAYERS</div>
                  </div>
                </div>
                <div style={styles.bottomRow}>
                  <div style={styles.waitingText}>● 24/7 Matchmaking</div>
                  <button
                    disabled={!enoughBalance || joinLoading}
                    style={{
                      ...styles.playNowButton,
                      background: enoughBalance ? 'linear-gradient(90deg, #FFD700, #FFA000)' : '#333',
                      color: enoughBalance ? '#000' : '#888',
                      cursor: enoughBalance ? 'pointer' : 'not-allowed'
                    }}
                    onClick={() => handleJoin(option)}
                  >
                    {joinLoading ? 'JOINING...' : enoughBalance ? `PLAY NOW ₹${option.entryFee}` : `LOW BALANCE`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #2a0000 0%, #000000 100%)',
    color: '#fff',
    fontFamily: 'Arial, sans-serif'
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '15px',
    fontSize: '12px',
    color: '#FFD700',
    background: 'rgba(255,215,0,0.05)'
  },
  onlineDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#4CAF50',
    boxShadow: '0 0 10px #4CAF50'
  },
  content: {
    padding: '15px',
  },
  cardGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  tableCard: {
    background: 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
    border: '1px solid rgba(255,215,0,0.1)',
    borderRadius: '20px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  tableLabel: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: '10px',
    letterSpacing: '2px',
    textTransform: 'uppercase'
  },
  cardBody: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prizeText: {
    fontSize: '32px',
    fontWeight: '900',
    color: '#fff',
    textShadow: '0 2px 10px rgba(0,0,0,0.5)'
  },
  playersText: {
    fontSize: '20px',
    fontWeight: 'bold',
  },
  subText: {
    fontSize: '9px',
    color: '#888',
    marginTop: '4px',
  },
  bottomRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px',
    borderTop: '1px solid rgba(255,255,255,0.05)',
    paddingTop: '15px'
  },
  waitingText: {
    fontSize: '10px',
    color: '#4CAF50'
  },
  playNowButton: {
    border: 'none',
    borderRadius: '10px',
    fontWeight: '900',
    padding: '12px 20px',
    fontSize: '12px',
    transition: 'all 0.2s'
  }
};