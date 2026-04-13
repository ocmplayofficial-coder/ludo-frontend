import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsDrawer from '../components/SettingsDrawer';
import NotificationBell from './NotificationBell';

const Header = ({
  user,
  showBack = false,
  onBack,
  title = '',
  showSettings = false,
  showPrize = false,
  prizeAmount = 0
}) => {
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Data Clean-up
  const name = user?.name || "Player";
  const phone = user?.phone || "";
  const balance =
    Number(user?.wallet?.deposit || 0) +
    Number(user?.wallet?.winnings || 0) +
    Number(user?.wallet?.bonus || 0);

  return (
    <>
      <div style={styles.headerContainer}>
        
        {/* --- LEFT: Profile or Back --- */}
        <div style={styles.section}>
          {showBack ? (
            <button 
              onClick={() => (typeof onBack === 'function' ? onBack() : navigate(-1))} 
              style={styles.iconBtn}
            >
              <span style={{ fontSize: '22px' }}>←</span>
            </button>
          ) : (
            user && !title && (
              <div style={styles.profileBox} onClick={() => navigate('/profile')}>
                <div style={styles.avatar}>
                  {name.charAt(0).toUpperCase()}
                  <div style={styles.onlineDot} />
                </div>
                <div style={styles.userInfo}>
                  <div style={styles.userName}>{name}</div>
                  <div style={styles.userPhone}>
                    {phone ? `${phone.slice(0, 3)}****${phone.slice(-3)}` : "Verified"}
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* --- CENTER: Title & Logo --- */}
        {title && (
          <div style={styles.headerTitleContainer}>
            <div style={styles.headerTitle}>{title.toUpperCase()}</div>
          </div>
        )}

        {/* --- RIGHT: Wallet & Settings --- */}
        <div style={styles.section}>
          {showPrize && (
            <div style={styles.prizeBadge}>
              <span style={{ marginRight: '4px' }}>🏆</span>
              ₹{prizeAmount}
            </div>
          )}

          {user && (
            <NotificationBell />
          )}

          {user && (
            <div style={styles.walletContainer} onClick={() => navigate('/wallet')}>
              <div style={styles.balanceInfo}>
                <span style={styles.currency}>₹</span>
                <span style={styles.amount}>{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={styles.addMoneyBtn}>+</div>
            </div>
          )}

          {showSettings && (
            <button onClick={() => setIsSettingsOpen(true)} style={styles.settingsBtn}>
              ⚙️
            </button>
          )}
        </div>
      </div>

      {/* --- SETTINGS DRAWER --- */}
      <SettingsDrawer 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        user={user} 
      />
    </>
  );
};

export default Header;

const styles = {
  headerContainer: {
    height: '65px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 15px',
    background: 'rgba(15, 15, 15, 0.85)', // Dark Glass
    backdropFilter: 'blur(15px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  },
  section: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  profileBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '12px', // Modern squircle
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#000',
    fontWeight: '900',
    fontSize: '18px',
    border: '1.5px solid rgba(255,255,255,0.4)',
    position: 'relative',
    boxShadow: '0 4px 10px rgba(255, 215, 0, 0.2)',
  },
  onlineDot: {
    width: '10px',
    height: '10px',
    background: '#4CAF50',
    borderRadius: '50%',
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    border: '2px solid #111',
    boxShadow: '0 0 5px #4CAF50',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: '1.2',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '800',
    color: '#fff',
    letterSpacing: '0.2px',
  },
  userPhone: {
    fontSize: '10px',
    color: '#FFD700',
    fontWeight: '600',
    opacity: 0.8,
  },
  headerTitleContainer: {
    display: 'flex',
    flexItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: '900',
    color: '#FFD700',
    letterSpacing: '2px',
    textShadow: '0 2px 10px rgba(0,0,0,0.5)',
  },
  walletContainer: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '3px 3px 3px 12px',
    borderRadius: '30px',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  balanceInfo: {
    marginRight: '10px',
    display: 'flex',
    alignItems: 'center',
  },
  currency: {
    color: '#FFD700',
    fontSize: '12px',
    marginRight: '3px',
    fontWeight: '900',
  },
  amount: {
    color: '#fff',
    fontSize: '15px',
    fontWeight: '800',
  },
  addMoneyBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: 'linear-gradient(180deg, #FFD700, #FFA500)',
    color: '#000',
    fontWeight: '900',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 10px rgba(255, 165, 0, 0.3)',
  },
  settingsBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    width: '38px',
    height: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    padding: '8px',
  },
  prizeBadge: {
    background: 'rgba(255, 215, 0, 0.1)',
    color: '#FFD700',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '900',
    border: '1px solid rgba(255,215,0,0.3)',
    boxShadow: '0 0 15px rgba(255, 215, 0, 0.1)',
  }
};