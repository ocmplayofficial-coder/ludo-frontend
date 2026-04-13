import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  isSoundEnabled, 
  isVibrationEnabled, 
  getTheme, 
  getAppTheme, 
  getSpeed, 
  setSetting 
} from '../utils/settings';

export default function SettingsDrawer({ isOpen, onClose, user }) {
  const navigate = useNavigate();

  // 1. Initial States with persistent storage sync
  const [settings, setSettings] = useState({
    sound: isSoundEnabled(),
    vibration: isVibrationEnabled(),
    theme: getTheme(),
    appTheme: getAppTheme(),
    speed: getSpeed(),
  });

  // 2. Settings Save Handler with global event broadcast
  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSetting(key, value);
    
    // Broadcast for Board.jsx and other listeners
    window.dispatchEvent(new CustomEvent('gameSettingsChanged', { 
      detail: { key, value } 
    }));

    // Haptic feedback for setting change
    if (key === 'vibration' && value && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  };

  if (!isOpen) return null;

  // Reusable Component for Selectors (Theme/Speed)
  const OptionBtn = ({ label, current, onClick }) => {
    const isActive = current === label;
    return (
      <button
        onClick={() => onClick(label)}
        style={{
          ...styles.selectorBtn,
          background: isActive ? '#FFD700' : 'rgba(255,255,255,0.05)',
          color: isActive ? '#000' : '#ccc',
          borderColor: isActive ? '#FFD700' : 'rgba(255,255,255,0.1)',
          boxShadow: isActive ? '0 0 10px rgba(255,215,0,0.3)' : 'none'
        }}
      >
        {label}
      </button>
    );
  };

  const computedBalance =
    Number(user?.wallet?.deposit || 0) +
    Number(user?.wallet?.winnings || 0) +
    Number(user?.wallet?.bonus || 0);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.drawer} onClick={(e) => e.stopPropagation()}>
        
        {/* --- DRAWER HEADER --- */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
             <button onClick={onClose} style={styles.closeBtn}>✕</button>
             <span style={styles.headerTitle}>GAME SETTINGS</span>
          </div>
          <div style={styles.versionTag}>v1.5.1</div>
        </div>

        <div style={styles.content}>
          
          {/* 💰 ACCOUNT QUICK INFO */}
          <div style={styles.accountCard}>
             <div style={styles.balanceRow} onClick={() => { navigate('/wallet'); onClose(); }}>
                <span style={styles.icon}>💰</span>
                <div style={styles.flexColumn}>
                   <p style={styles.itemTitle}>Wallet Balance</p>
                   <p style={styles.itemValue}>₹{computedBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <span style={styles.arrow}>❯</span>
             </div>
          </div>

          {/* 🔊 AUDIO & TACTILE */}
          <div style={styles.group}>
             <p style={styles.groupLabel}>PREFERENCES</p>
             
             <div style={styles.menuItem} onClick={() => updateSetting('sound', !settings.sound)}>
                <div style={styles.itemLeft}><span style={styles.icon}>🔊</span><p style={styles.itemTitle}>Game Sounds</p></div>
                <div style={{...styles.toggle, backgroundColor: settings.sound ? '#2ecc71' : '#444'}}>
                   <div style={{...styles.toggleCircle, transform: settings.sound ? 'translateX(20px)' : 'translateX(0)'}} />
                </div>
             </div>

             <div style={styles.menuItem} onClick={() => updateSetting('vibration', !settings.vibration)}>
                <div style={styles.itemLeft}><span style={styles.icon}>📳</span><p style={styles.itemTitle}>Haptic Feedback</p></div>
                <div style={{...styles.toggle, backgroundColor: settings.vibration ? '#2ecc71' : '#444'}}>
                   <div style={{...styles.toggleCircle, transform: settings.vibration ? 'translateX(20px)' : 'translateX(0)'}} />
                </div>
             </div>
          </div>

          {/* 🎨 VISUALS */}
          <div style={styles.group}>
            <p style={styles.groupLabel}>BOARD THEME</p>
            <div style={styles.optionsRow}>
              {['Classic', 'Wooden', 'Neon', 'Royal'].map(t => (
                <OptionBtn key={t} label={t} current={settings.theme} onClick={(v) => updateSetting('theme', v)} />
              ))}
            </div>
          </div>

          <div style={styles.group}>
            <p style={styles.groupLabel}>APP APPEARANCE</p>
            <div style={styles.optionsRow}>
              {['Dark', 'Light', 'System'].map(t => (
                <OptionBtn key={t} label={t} current={settings.appTheme} onClick={(v) => updateSetting('appTheme', v)} />
              ))}
            </div>
          </div>

          <hr style={styles.hr} />

          {/* 🚀 OTHERS */}
          <div style={styles.menuItem} onClick={() => { navigate('/support'); onClose(); }}>
            <div style={styles.itemLeft}><span style={styles.icon}>🎧</span><p style={styles.itemTitle}>Help & Support</p></div>
            <span style={styles.arrow}>❯</span>
          </div>

          <div style={styles.menuItem} onClick={() => { navigate('/refer'); onClose(); }}>
            <div style={styles.itemLeft}><span style={styles.icon}>👥</span><p style={styles.itemTitle}>Refer & Earn Coins</p></div>
            <span style={styles.arrow}>❯</span>
          </div>

          {/* 🚪 LOGOUT */}
          <div style={styles.footer}>
            <button style={styles.logoutBtn} onClick={() => { localStorage.clear(); navigate('/login'); }}>
              LOGOUT ACCOUNT
            </button>
            <p style={styles.copyright}>Ludo Pro Arena © 2026<br/>Gajraj Foundation Pvt. Ltd.</p>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', justifyContent: 'flex-end' },
  drawer: { width: '85%', maxWidth: '340px', height: '100%', background: '#111', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)', borderLeft: '1px solid rgba(255,255,255,0.1)' },
  header: { padding: '25px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '15px' },
  headerTitle: { fontSize: '16px', fontWeight: '900', color: '#FFD700', letterSpacing: '1px' },
  closeBtn: { background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' },
  versionTag: { fontSize: '10px', color: '#555', background: '#222', padding: '2px 8px', borderRadius: '10px' },
  content: { flex: 1, overflowY: 'auto', paddingBottom: '30px' },
  accountCard: { margin: '20px', padding: '15px', background: 'rgba(255,215,0,0.05)', borderRadius: '20px', border: '1px solid rgba(255,215,0,0.1)' },
  balanceRow: { display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' },
  flexColumn: { flex: 1 },
  itemValue: { color: '#fff', fontSize: '18px', fontWeight: '900', margin: 0 },
  menuItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', cursor: 'pointer', transition: 'background 0.2s' },
  itemLeft: { display: 'flex', alignItems: 'center', gap: '15px' },
  icon: { fontSize: '20px' },
  itemTitle: { color: '#eee', fontSize: '14px', fontWeight: '600', margin: 0 },
  arrow: { color: '#444', fontSize: '12px' },
  toggle: { width: '44px', height: '24px', borderRadius: '12px', padding: '3px', cursor: 'pointer', transition: '0.4s ease' },
  toggleCircle: { width: '18px', height: '18px', background: '#fff', borderRadius: '50%', transition: '0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55)', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' },
  hr: { border: 'none', borderTop: '1px solid rgba(255,255,255,0.05)', margin: '15px 20px' },
  group: { padding: '15px 20px' },
  groupLabel: { color: '#555', fontSize: '10px', fontWeight: '900', marginBottom: '15px', letterSpacing: '1px' },
  optionsRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  selectorBtn: { padding: '8px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.3s ease' },
  footer: { marginTop: '20px', padding: '0 20px', textAlign: 'center' },
  logoutBtn: { width: '100%', background: 'rgba(255, 77, 77, 0.1)', color: '#ff4d4d', border: '1px solid rgba(255, 77, 77, 0.2)', padding: '14px', borderRadius: '15px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', letterSpacing: '1px' },
  copyright: { marginTop: '20px', color: '#333', fontSize: '10px', lineHeight: '1.6' }
};