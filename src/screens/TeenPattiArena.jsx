import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../services/SocketContext';
import WinnerResultPopup from '../components/WinnerResultPopup';
import SettingsDrawer from '../components/SettingsDrawer';
import { Howl } from 'howler';
import { isSoundEnabled } from '../utils/settings';

// Asset URLs
const tpMoveAudioUrl = new URL('../assets/move.mp3', import.meta.url).href;
const tpWinAudioUrl = new URL('../assets/win.mp3', import.meta.url).href;
const tpBetAudioUrl = new URL('../assets/dice-roll.mp3', import.meta.url).href;

export default function TeenPattiArena() {
  const navigate = useNavigate();
  const { socket } = useSocket() || {};
  const { roomId } = useParams();
  
  const mode = roomId.split('_')[1] || 'CLASSIC';
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user?._id || user?.id;
  
  const [game, setGame] = useState({ players: [], pot: 0, currentTurn: 0, status: 'waiting' });
  const [myCards, setMyCards] = useState([]);
  const [isSeen, setIsSeen] = useState(false);
  const [timer, setTimer] = useState(15);
  const [resultOpen, setResultOpen] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const playersRef = useRef([]);

  const sounds = useMemo(() => ({
    card: new Howl({ src: [tpMoveAudioUrl], volume: 0.5 }),
    win: new Howl({ src: [tpWinAudioUrl], volume: 1.0 }),
    bet: new Howl({ src: [tpBetAudioUrl], volume: 0.4 })
  }), []);

  // 1. Logic Integration (Ludo type sync & handlers)
  useEffect(() => {
    if (!socket) return;
    socket.emit("tp_joinRoom", { roomId, userId });
    let gameOverTimer = null;

    const updatePlayerState = (players) => {
      playersRef.current = players;
      setGame((prev) => ({ ...prev, players }));
      const me = players.find((p) => p.userId?.toString() === userId?.toString());
      if (me) {
        setIsSeen(me.isSeen ?? false);
        if (me.cards?.length) setMyCards(me.cards);
      }
    };

    socket.on("tp_gameState", (data) => {
      setGame({
        players: data.players || [],
        pot: data.potAmount ?? 0,
        currentTurn: data.currentTurn ?? 0,
        status: data.status || 'playing'
      });
      updatePlayerState(data.players);
    });

    socket.on("tp_myCards", (cards) => { 
        setMyCards(cards); 
        setIsSeen(true); 
        if (isSoundEnabled()) try { sounds.card.play(); } catch(e) {}
    });

    socket.on("tp_betPlaced", (data) => { 
        setGame(prev => ({ ...prev, pot: data.pot, currentTurn: data.nextTurn })); 
        if (isSoundEnabled()) sounds.bet.play(); 
    });
    
    socket.on("tp_gameOver", (data) => {
      const winnerId = data.winner?.userId?.toString();
      const isIWon = winnerId === userId?.toString();
      const fallbackName = playersRef.current.find((p) => p.userId?.toString() === winnerId)?.name || (isIWon ? user.name || 'You' : 'Opponent');

      setResultData({
        winnerId,
        name: data.winner?.name && data.winner.name !== 'Player' ? data.winner.name : fallbackName,
        status: isIWon ? 'WIN' : 'LOSE',
        prize: data.pot,
        message: isIWon ? 'You won the pot!' : 'You lost this round.',
        color: isIWon ? '#FFD700' : '#ff4444',
        cards: data.winner?.cards || []
      });

      gameOverTimer = setTimeout(() => setResultOpen(true), 1000);
      if (isIWon && isSoundEnabled()) try { sounds.win.play(); } catch(e) {}
    });

    return () => {
      clearTimeout(gameOverTimer);
      socket.off("tp_gameState");
      socket.off("tp_myCards");
      socket.off("tp_betPlaced");
      socket.off("tp_gameOver");
    };
  }, [socket, roomId, userId]);

  const isMyTurn = game.players[game.currentTurn]?.userId?.toString() === userId?.toString();
  const playerMe = game.players.find((p) => p.userId?.toString() === userId?.toString()) || {};
  const playerOpponent = game.players.find((p) => p.userId?.toString() !== userId?.toString()) || {};

  // 2. Timer Logic (Ludo type)
  useEffect(() => {
    if (game.status !== 'playing' || !socket || timer <= 0) {
      return;
    }
    const timeout = setTimeout(() => setTimer((prev) => Math.max(prev - 1, 0)), 1000);
    return () => clearTimeout(timeout);
  }, [timer, game.status, socket]);

  // Turn change pe timer reset
  useEffect(() => { setTimer(15); }, [game.currentTurn]);

  // 3. Handlers
  const handleAction = (type) => {
    if (!socket || (!isMyTurn && type !== 'see')) return;
    if (type === 'see') {
      socket.emit("tp_seeCards", { roomId, userId });
      setIsSeen(true);
    } else {
      const baseAmount = 10; // Ye backend se dynamic hona chahiye table minimum ke hisab se
      const betAmount = isSeen ? baseAmount * 2 : baseAmount;
      socket.emit("tp_placeBet", { roomId, userId, amount: betAmount, action: type });
    }
  };

  const handlePack = () => {
    if (!socket || !isMyTurn) return;
    socket.emit("tp_pack", { roomId, userId });
  };

  const handleBack = () => {
    navigate('/tp-modes');
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div style={styles.arena}>
      <SettingsDrawer isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} user={user} />
      <WinnerResultPopup open={resultOpen} winnerData={resultData} gameMode={mode?.toLowerCase()} myUserId={userId} onClose={() => navigate('/tp-modes')} />

      <div style={styles.topBar}>
        <button style={styles.navIcon} onClick={handleBack}>←</button>
        <div style={styles.topTitle}>{mode?.toUpperCase()} ARENA</div>
        <div style={styles.topActions}>
          <button style={styles.navIcon} onClick={() => setSettingsOpen(true)}>⚙️</button>
          <button style={styles.logoutIconBtn} onClick={handleLogout}>🚪</button>
        </div>
      </div>

      {/* 👱‍♀️ DEALER SECTION (TOP CENTER) */}
      <div style={styles.dealerSection}>
        <div style={styles.dealerGirl}>👩‍💼</div>
        <div style={styles.dealerPlatform}></div>
      </div>

      {/* 💰 CENTER POT (Gold & Coins) */}
      <div style={styles.potContainer}>
         <div style={styles.potDisplay}>
            <span style={styles.coinIcon}>💰</span>
            <span style={styles.potText}>₹{game.pot.toLocaleString()}</span>
         </div>
      </div>

      {/* 🏟️ TABLE AREA (Casino Felt) */}
      <div style={styles.tableWrapper}>
        <div style={styles.feltTable}>
          
          {/* OPPONENT (TOP RIGHT) */}
          <div style={styles.opponentPos}>
            <div style={{...styles.playerAvatar, borderColor: !isMyTurn && game.status === 'playing' ? '#00ff00' : '#fff'}}>
              {playerOpponent.name?.[0] || 'O'}
              {!isMyTurn && game.status === 'playing' && <div style={styles.progressRing} />}
            </div>
            <div style={styles.playerNamePlate}>{playerOpponent.name || 'Opponent'}</div>
            <div style={styles.playerStatusChip}>{playerOpponent.isPacked ? 'PACKED' : playerOpponent.isSeen ? 'SEEN' : 'BLIND'}</div>
            <div style={styles.opponentCardStack}>
               {!playerOpponent.isPacked && [1,2,3].map(i => <div key={i} style={styles.miniCardBack} />)}
            </div>
          </div>

          {/* ME (BOTTOM CENTER - Professional Stacked) */}
          <div style={styles.myPos}>
            <div style={styles.myCardArea}>
                {myCards.length > 0 ? myCards.map((c, i) => (
                    <div key={i} style={styles.card} className="card-animation">
                        <span style={{color: (c.suit === '♥' || c.suit === '♦') ? 'red' : 'black'}}>
                            {isSeen ? `${c.value}${c.suit}` : '🎴'}
                        </span>
                    </div>
                )) : (game.status === 'playing' && <div style={styles.waitingText}>Dealing...</div>)}
            </div>

            <div style={{...styles.playerAvatar, borderColor: isMyTurn ? '#00ff00' : '#fff'}}>
              {user.name?.[0] || 'U'}
              {isMyTurn && game.status === 'playing' && <div style={styles.progressRing} />}
            </div>
            <div style={styles.playerNamePlate}>YOU</div>
            
            {/* ⏱️ LUDO TYPE TIMER */}
            {isMyTurn && game.status === 'playing' && (
                <div style={styles.timeBadge}>{timer}s</div>
            )}
          </div>

        </div>
      </div>

      {/* 🎮 CONTROLS (BOTTOM BAR) */}
      <div style={styles.controlBar}>
        <button style={{...styles.packBtn, opacity: isMyTurn?1:0.5}} onClick={handlePack} disabled={!isMyTurn}>PACK</button>
        
        <div style={styles.mainActions}>
            {!isSeen && myCards.length > 0 && !playerMe.isPacked && (
                <button style={styles.seeBtn} onClick={() => handleAction('see')}>SEE</button>
            )}
            
            <div style={{...styles.betControls, opacity: isMyTurn?1:0.5}}>
                <button disabled={!isMyTurn} style={styles.chaalBtn} onClick={() => handleAction('chaal')}>
                    <span style={styles.betType}>{isSeen ? 'CHAAL' : 'BLIND'}</span>
                    <span style={styles.betVal}>₹{isSeen ? '20' : '10'}</span>
                </button>
            </div>
        </div>

        {isSeen && !playerMe.isPacked && (
            <button style={{...styles.showBtn, opacity: isMyTurn?1:0.5}} onClick={() => socket.emit('tp_show', { roomId, userId })}>SHOW</button>
        )}
      </div>
    </div>
  );
}

const styles = {
  arena: { 
    height: '100vh', background: '#1a0505', display: 'flex', flexDirection: 'column', 
    overflow: 'hidden', fontFamily: 'sans-serif', position: 'relative' 
  },
  dealerSection: { position: 'absolute', top: '5%', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', zIndex: 2 },
  dealerGirl: { fontSize: '50px', filter: 'drop-shadow(0 0 10px gold)' },
  dealerPlatform: { width: '80px', height: '10px', background: '#333', borderRadius: '50%', margin: '0 auto' },
  
  potContainer: { position: 'absolute', top: '35%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 3 },
  potDisplay: { background: 'rgba(0,0,0,0.6)', padding: '5px 20px', borderRadius: '20px', border: '1.5px solid gold', display: 'flex', alignItems: 'center', gap: '10px' },
  potText: { color: 'white', fontWeight: 'bold', fontSize: '18px' },
  coinIcon: { fontSize: '20px' },

  tableWrapper: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  feltTable: { 
    width: '95%', height: '70%', background: '#8b0000', borderRadius: '150px', 
    border: '12px solid #4a2c2a', boxShadow: 'inset 0 0 100px #000, 0 10px 30px rgba(0,0,0,0.5)',
    position: 'relative'
  },

  opponentPos: { position: 'absolute', top: '-10px', right: '15%', textAlign: 'center' },
  myPos: { position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' },

  playerAvatar: { 
    width: '65px', height: '65px', borderRadius: '50%', background: '#222', border: '3px solid #fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '24px', 
    position: 'relative', overflow: 'hidden'
  },
  playerNamePlate: { background: '#000', color: '#fff', fontSize: '12px', padding: '2px 10px', borderRadius: '10px', marginTop: '-10px', zIndex: 2, position: 'relative' },
  playerStatusChip: { color: 'gold', fontSize: '10px', fontWeight: 'bold', marginTop: '5px', textTransform: 'uppercase' },
  topBar: { position: 'absolute', top: '12px', left: '20px', right: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10, background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', padding: '10px 16px', backdropFilter: 'blur(12px)' },
  topTitle: { color: '#fff', fontSize: '14px', fontWeight: '700', letterSpacing: '1px' },
  topActions: { display: 'flex', gap: '10px' },
  navIcon: { background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', borderRadius: '12px', width: '38px', height: '38px', fontSize: '18px', cursor: 'pointer' },
  logoutIconBtn: { background: '#ff4444', color: '#fff', border: 'none', borderRadius: '12px', width: '38px', height: '38px', fontSize: '18px', cursor: 'pointer' },

  opponentCardStack: { display: 'flex', gap: '2px', position: 'absolute', left: '-50px', top: '20px' },
  miniCardBack: { width: '25px', height: '35px', background: '#c00', border: '1px solid #fff', borderRadius: '3px' },

  myCardArea: { display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '10px' },
  card: { width: '60px', height: '85px', background: '#fff', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 'bold', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' },
  waitingText: { color: 'gold', fontSize: '12px', fontStyle: 'italic', position: 'absolute', top: '0' },
  timeBadge: { position: 'absolute', top: '-15px', background: 'gold', color: '#000', padding: '2px 10px', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px' },

  controlBar: { height: '80px', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', zIndex: 5 },
  mainActions: { display: 'flex', alignItems: 'center', gap: '15px' },
  packBtn: { background: '#c00', color: '#fff', border: 'none', borderRadius: '5px', padding: '10px 25px', fontWeight: 'bold' },
  seeBtn: { background: '#28a745', color: '#fff', border: 'none', borderRadius: '5px', padding: '10px 30px', fontWeight: 'bold', fontSize: '18px', boxShadow: '0 0 15px #28a745' },
  chaalBtn: { background: 'linear-gradient(to bottom, #28a745, #1e7e34)', color: '#fff', border: '2px solid gold', borderRadius: '5px', padding: '5px 30px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  betControls: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  betType: { fontSize: '10px', opacity: 0.8 },
  betVal: { fontSize: '16px', fontWeight: 'bold' },
  showBtn: { flex: 1, background: '#00796b', color: '#fff', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  btnRow: { display: 'flex', gap: '10px' }
};