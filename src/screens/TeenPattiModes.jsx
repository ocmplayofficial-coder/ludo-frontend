import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { authAPI, gameAPI } from '../services/api';
import { toast } from 'sonner';

const modeStyles = {
  classic: {
    title: 'CLASSIC ARENA',
    desc: 'Traditional 3-Card Poker',
    image: '/tp_classic_bg.jpg',
    color: '#c41d24'
  },
  muflis: {
    title: 'MUFLIS LOWBALL',
    desc: 'Lowest Hand Wins Strategy',
    image: '/tp_muflis_bg.jpg',
    color: '#1b5e20'
  },
  ak47: {
    title: 'AK-47 JOKERS',
    desc: 'A, K, 4, 7 Are Wild Cards',
    image: '/tp_ak47_bg.jpg',
    color: '#01579b'
  }
};

export default function TeenPattiModes() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [modes, setModes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUser();
    fetchModes();
  }, []);

  const loadUser = async () => {
    try {
      const res = await authAPI.getProfile();
      setUser(res.data.user);
    } catch (err) {
      console.error("Failed to load profile:", err);
      navigate('/login');
    }
  };

  const fetchModes = async () => {
    try {
      setLoading(true);
      // 🔥 FIXED: Changed from getMatches() to getTPMatches() to sync with your api.js
      const res = await gameAPI.getTPMatches();
      
      // Backend standard: res.data.matches ya res.data.teenpatti
      const list = res.data?.matches || res.data?.teenpatti || [];

      if (list.length === 0) {
        // Fallback dummy modes agar backend se data na aaye toh (Testing ke liye)
        const dummyModes = ['classic', 'muflis', 'ak47'].map(type => ({
          id: type,
          ...modeStyles[type],
          online: Math.floor(Math.random() * 100),
          type
        }));
        setModes(dummyModes);
        return;
      }

      const mapped = list.map((item) => {
        const style = modeStyles[item.type] || {
          title: item.label || item.type?.toUpperCase(),
          desc: 'Play Teen Patti now',
          image: '/tp_default_bg.jpg',
          color: '#777'
        };

        return {
          id: item.type,
          title: style.title,
          desc: style.desc,
          image: style.image,
          color: style.color,
          online: item.online ?? 0,
          type: item.type
        };
      });

      setModes(mapped);
    } catch (err) {
      console.error('Unable to fetch Teen Patti modes', err);
      setError('Unable to load Teen Patti modes right now.');
      toast.error("Failed to fetch arenas.");
    } finally {
      setLoading(false);
    }
  };

  const handleModeClick = (modeId) => {
    // Navigate to table selection for that specific mode
    // Path match: /tp-selection/:mode
    navigate(`/tp-selection/${modeId.toLowerCase()}`);
  };

  if (loading) {
    return <div style={styles.loader}>
        <div className="animate-spin">🃏</div>
        <p>Loading Teen Patti arenas...</p>
    </div>;
  }

  return (
    <div style={styles.page}>
      <Header 
        user={user} 
        showBack 
        showSettings 
        title="TEEN PATTI LOBBY" 
        theme="teenpatti" 
        onBack={() => navigate('/dashboard')} 
      />
      
      <div style={styles.content}>
        <div style={styles.heroSection}>
          <h2 style={styles.heroTitle}>Choose Your Arena</h2>
          <p style={styles.heroSub}>Win real cash with your skills 💰</p>
        </div>

        <div style={styles.grid}>
          {modes.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>No active arenas.</div>
          ) : (
            modes.map((mode) => (
              <div 
                key={mode.id} 
                style={{...styles.modeCard, borderLeft: `6px solid ${mode.color}`}}
                onClick={() => handleModeClick(mode.id)}
              >
                <div style={{
                  ...styles.cardBg, 
                  backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.95) 35%, rgba(0,0,0,0.4) 100%), url(${mode.image})`
                }}>
                  <div style={styles.cardOverlay}>
                    <div style={styles.cardTextContent}>
                      <h3 style={styles.cardTitle}>{mode.title}</h3>
                      <p style={styles.cardDesc}>{mode.desc}</p>
                      <span style={styles.onlineStatus}>🟢 {mode.online} Players Online</span>
                    </div>
                    
                    <div style={styles.playIconBox}>
                      <div style={styles.playBtnCircle}>▶</div>
                      <span style={styles.playText}>PLAY NOW</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={styles.footerInfo}>
          🔞 For 18+ Players Only | Verified Fair Play System ✅
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#1a0505', minHeight: '100vh', height: '100vh', overflowY: 'auto', color: '#fff', fontFamily: 'Arial, sans-serif', paddingBottom: '90px' },
  loader: { height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#ffd700', background: '#1a0505' },
  content: { padding: '20px' },
  heroSection: { textAlign: 'center', marginBottom: '25px', marginTop: '10px' },
  heroTitle: { fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#fff' },
  heroSub: { fontSize: '13px', color: '#ffd700', marginTop: '5px' },
  grid: { display: 'flex', flexDirection: 'column', gap: '20px' },
  modeCard: { height: '140px', borderRadius: '16px', overflow: 'hidden', position: 'relative', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.5)', backgroundColor: '#333' },
  cardBg: { width: '100%', height: '100%', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex' },
  cardOverlay: { flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' },
  cardTextContent: { display: 'flex', flexDirection: 'column', gap: '4px' },
  cardTitle: { margin: 0, fontSize: '20px', fontWeight: '900', letterSpacing: '1px' },
  cardDesc: { margin: 0, fontSize: '11px', color: '#ffd700', fontWeight: 'bold' },
  onlineStatus: { fontSize: '10px', color: '#4CAF50', marginTop: '5px', fontWeight: 'bold' },
  playIconBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' },
  playBtnCircle: { width: '45px', height: '45px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '20px', color: '#fff', border: '2px solid rgba(255,215,0,0.4)' },
  playText: { fontSize: '10px', fontWeight: 'bold', color: '#fff' },
  footerInfo: { textAlign: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '30px' }
};