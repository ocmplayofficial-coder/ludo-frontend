import React from "react";

const TPPlayerCard = ({ 
  player, 
  isCurrentTurn, 
  isSelf, 
  gameState, // 'betting', 'showdown', 'waiting'
  onAction 
}) => {
  // Safe Data Handling
  const name = player?.name || "Player";
  const balance = Number(player?.balance || 0).toFixed(2);
  const currentBet = Number(player?.currentBet || 0);
  const isPacked = player?.isPacked || false;
  const isWinner = player?.isWinner || false;
  const cards = player?.cards || []; // Only visible if isSelf or during showdown
  const status = player?.status || ""; // "Seen", "Blind", "Side-show"

  return (
    <div
      style={{
        ...styles.card,
        border: isWinner ? '2px solid #FFD700' : isCurrentTurn ? '2px solid #fff' : '1px solid rgba(255,255,255,0.1)',
        opacity: isPacked ? 0.5 : 1,
        transform: isCurrentTurn ? 'scale(1.05) translateY(-5px)' : 'scale(1)',
        boxShadow: isWinner 
          ? '0 0 30px rgba(255,215,0,0.6)' 
          : isCurrentTurn ? '0 10px 20px rgba(0,0,0,0.5)' : 'none'
      }}
    >
      {/* 👑 WINNER BADGE */}
      {isWinner && <div style={styles.winnerBadge}>WINNER 🏆</div>}
      
      {/* 🔴 TURN INDICATOR */}
      {isCurrentTurn && !isPacked && <div style={styles.turnPulse} />}

      <div style={styles.mainInfo}>
        {/* AVATAR SECTION */}
        <div style={styles.avatarWrapper}>
          <img 
            src={player?.avatar || '/assets/avatar-default.png'} 
            style={{...styles.avatar, borderColor: isPacked ? '#555' : '#FFD700'}} 
            alt="P" 
          />
          <div style={{...styles.statusTag, background: status === 'Blind' ? '#3498db' : '#2ecc71'}}>
            {isPacked ? "PACKED" : status.toUpperCase()}
          </div>
        </div>

        {/* NAME & BALANCE */}
        <div style={styles.userDetails}>
          <div style={styles.name}>{isSelf ? "YOU" : name}</div>
          <div style={styles.balance}>₹{balance}</div>
        </div>
      </div>

      {/* 💰 CURRENT BET DISPLAY */}
      <div style={styles.betContainer}>
        <span style={styles.betLabel}>CHIPS:</span>
        <span style={styles.betValue}>🪙 {currentBet}</span>
      </div>

      {/* 🃏 MINI CARDS (Visible for Self or Showdown) */}
      {(isSelf || gameState === 'showdown') && !isPacked && (
        <div style={styles.cardsRow}>
          {cards.length > 0 ? cards.map((card, i) => (
            <div key={i} style={styles.miniCard}>
              <span style={{color: (card.suit === '♥' || card.suit === '♦') ? '#e74c3c' : '#2c3e50'}}>
                {card.value}{card.suit}
              </span>
            </div>
          )) : (
            <>
              <div style={styles.cardBack} />
              <div style={styles.cardBack} />
              <div style={styles.cardBack} />
            </>
          )}
        </div>
      )}

      {/* Glass Shine Effect */}
      <div style={styles.glassShine} />
    </div>
  );
};

const styles = {
  card: {
    width: '145px',
    padding: '12px',
    borderRadius: '20px',
    background: 'linear-gradient(145deg, #2a0000 0%, #1a0000 100%)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    transition: 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.05)'
  },
  winnerBadge: {
    position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)',
    background: 'linear-gradient(90deg, #FFD700, #FFA500)', color: '#000',
    fontSize: '10px', fontWeight: '900', padding: '3px 12px', borderRadius: '10px',
    zIndex: 10, boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
  },
  turnPulse: {
    position: 'absolute', top: '5px', right: '5px', width: '10px', height: '10px',
    background: '#2ecc71', borderRadius: '50%', animation: 'pulse 1s infinite',
    boxShadow: '0 0 10px #2ecc71'
  },
  mainInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatarWrapper: { position: 'relative' },
  avatar: { width: '45px', height: '45px', borderRadius: '50%', border: '2px solid', objectFit: 'cover' },
  statusTag: { 
    position: 'absolute', bottom: '-5px', left: '50%', transform: 'translateX(-50%)',
    fontSize: '8px', fontWeight: 'bold', color: '#fff', padding: '1px 6px', 
    borderRadius: '5px', width: 'max-content' 
  },
  userDetails: { display: 'flex', flexDirection: 'column' },
  name: { fontSize: '12px', fontWeight: 'bold', color: '#fff' },
  balance: { fontSize: '10px', color: '#FFD700', fontWeight: 'bold' },
  
  betContainer: { 
    background: 'rgba(0,0,0,0.3)', padding: '5px 10px', borderRadius: '10px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  betLabel: { fontSize: '9px', color: '#888', fontWeight: 'bold' },
  betValue: { fontSize: '11px', color: '#fff', fontWeight: '900' },
  
  cardsRow: { display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '5px' },
  miniCard: { 
    width: '30px', height: '42px', background: '#fff', borderRadius: '4px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: '900', boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
  },
  cardBack: { 
    width: '30px', height: '42px', background: '#c0392b', borderRadius: '4px',
    border: '1px solid #fff', boxShadow: '0 2px 5px rgba(0,0,0,0.5)' 
  },
  glassShine: { 
    position: 'absolute', inset: 0, 
    background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%)', 
    pointerEvents: 'none' 
  }
};

export default TPPlayerCard;