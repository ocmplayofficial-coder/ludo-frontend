import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTokenCoords } from '../utils/positionMap'; 
import { isSoundEnabled } from '../utils/settings';
import BoardImage from '../assets/game/ludo-board.png'; 
import { Howl } from 'howler';
import CelebrationPopup from '../components/CelebrationPopup';

// Pre-define audio URLs
const diceRollAudioUrl = new URL('../assets/dice-roll.mp3', import.meta.url).href;
const moveAudioUrl = new URL('../assets/move.mp3', import.meta.url).href;
const killAudioUrl = new URL('../assets/kill.mp3', import.meta.url).href;
const winAudioUrl = new URL('../assets/win.mp3', import.meta.url).href;

export default function GameArena({ socket }) {
  const navigate = useNavigate();
  const { roomId } = useParams(); // URL se room ID lene ka standard tarika
  
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const myUserId = currentUser._id || currentUser.id;

  const [gameState, setGameState] = useState(null);
  const [tokens, setTokens] = useState({ red: [], green: [] });
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);

  // Celebration States
  const [showWinner, setShowWinner] = useState(false);
  const [winnerData, setWinnerData] = useState(null);

  // Memoize sounds for zero-lag performance
  const sounds = useMemo(() => ({
    dice: new Howl({ src: [diceRollAudioUrl], html5: false, volume: 0.5 }),
    move: new Howl({ src: [moveAudioUrl], html5: false, volume: 0.5 }),
    kill: new Howl({ src: [killAudioUrl], html5: false, volume: 0.8 }),
    win: new Howl({ src: [winAudioUrl], html5: false, volume: 1.0 }),
  }), []);

  const playSound = useCallback((type) => {
    if (isSoundEnabled() && sounds[type]) {
      try { sounds[type].play(); } catch(e) { console.warn("Audio error", e); }
    }
  }, [sounds]);

  useEffect(() => {
    if (!socket) return;

    // Join room explicitly
    socket.emit("joinRoom", { roomId });

    socket.on("gameState", (data) => {
      setGameState(data);
      if (data.tokens) setTokens(data.tokens);
    });

    socket.on("diceRolled", (data) => {
      playSound('dice');
      setDiceValue(data.dice);
      setIsRolling(true);
      
      // Local sync
      setGameState(prev => prev ? ({
        ...prev,
        gameState: { ...prev.gameState, diceValue: data.dice }
      }) : prev);
      
      setTimeout(() => setIsRolling(false), 800); // 800ms match animation
    });

    socket.on("tokenMoved", (data) => {
      setTokens(data.tokens);
      playSound('move');

      if (data.killed) {
        setTimeout(() => playSound('kill'), 400);
      }

      setGameState(prev => prev ? ({
        ...prev,
        gameState: {
          ...prev.gameState,
          currentTurn: data.nextTurn ?? prev.gameState.currentTurn,
          diceValue: 0
        }
      }) : prev);
      
      setDiceValue(0); // Reset visual dice
    });

    socket.on("turnChanged", (data) => {
      setGameState(prev => prev ? ({
        ...prev,
        gameState: { ...prev.gameState, currentTurn: data.turn, diceValue: 0 }
      }) : prev);
      setDiceValue(0);
    });

    socket.on("gameOver", (data) => {
      playSound('win');
      setWinnerData({
        name: data.winnerName || (data.winnerId === myUserId ? "YOU" : "Opponent"),
        prize: data.prizeAmount || gameState?.prizeMoney || "0",
        avatar: data.winnerAvatar,
        id: data.winnerId
      });
      setShowWinner(true);
    });

    socket.on("error", (msg) => {
      console.error("Ludo-Pro Socket Error:", msg);
    });

    return () => {
      socket.off("gameState");
      socket.off("diceRolled");
      socket.off("tokenMoved");
      socket.off("turnChanged");
      socket.off("gameOver");
      socket.off("error");
    };
  }, [socket, roomId, myUserId, playSound, gameState]);

  const handleDiceClick = () => {
    if (!gameState || isRolling || showWinner || diceValue > 0) return;
    
    const turn = gameState.gameState.currentTurn;
    const currentPlayer = gameState.players[turn];

    if (currentPlayer && currentPlayer.userId === myUserId) {
      socket.emit("rollDice", { roomId });
    }
  };

  const handleTokenClick = (color, index) => {
    if (!gameState || showWinner || isRolling) return;
    
    const turn = gameState.gameState.currentTurn;
    const currentPlayer = gameState.players[turn];
    
    if (!currentPlayer || currentPlayer.userId !== myUserId || currentPlayer.color !== color) return;

    // Movement emit to backend
    socket.emit("moveToken", { roomId, tokenIndex: index });
  };

  if (!gameState) return (
    <div style={styles.loading}>
      <div className="spinner"></div>
      <p style={styles.loadingText}>Arena taiyaar ho raha hai...</p>
    </div>
  );

  const turnIdx = gameState.gameState.currentTurn;
  const currentPlayer = gameState.players[turnIdx];
  const isMyTurn = currentPlayer?.userId === myUserId;

  return (
    <div style={styles.container}>
      <CelebrationPopup 
        isOpen={showWinner} 
        winnerData={winnerData} 
        gameType="ludo" 
        onClose={() => navigate('/dashboard')} 
      />

      <div style={styles.header}>
        <div style={styles.prizeBadge}>🏆 ₹{gameState.prizeMoney || "0"}</div>
        <div style={{...styles.statusText, color: isMyTurn ? '#FFD700' : '#888'}}>
           {isMyTurn ? "AAPKI BAARI HAI" : `${currentPlayer?.name || 'Opponent'} ki turn...`}
        </div>
      </div>

      <div style={styles.boardWrapper}>
        <img src={BoardImage} alt="Board" style={styles.boardImg} />

        {['red', 'green', 'blue', 'yellow'].map(color => (
          tokens[color]?.map((t, i) => {
            const coords = getTokenCoords(t, color, i);
            const turnColor = currentPlayer?.color;
            const isTurnOwner = isMyTurn && turnColor === color;
            
            // Highlight logical condition
            const canThisMove = isTurnOwner && diceValue > 0 && (
               (t.position >= 0 && t.position + diceValue <= 57) || 
               (t.position === -1 && diceValue === 6)
            );

            return (
              <div
                key={`${color}-${i}`}
                onClick={() => handleTokenClick(color, i)}
                style={{
                  ...styles.token,
                  backgroundColor: getHexColor(color),
                  left: `${coords.x}%`,
                  top: `${coords.y}%`,
                  border: canThisMove ? '3px solid #fff' : '1.5px solid rgba(0,0,0,0.2)',
                  boxShadow: canThisMove 
                    ? `0 0 15px ${getHexColor(color)}, 0 0 30px white` 
                    : '0 3px 6px rgba(0,0,0,0.4)',
                  zIndex: canThisMove ? 200 : 100 + i,
                  animation: canThisMove ? 'pulseJump 1s infinite' : 'none',
                  cursor: canThisMove ? 'pointer' : 'default',
                }}
              >
                <div style={styles.innerToken} />
              </div>
            );
          })
        ))}
      </div>

      <div style={styles.diceSection}>
        <div 
          onClick={handleDiceClick} 
          style={{
            ...styles.dice, 
            borderColor: isMyTurn ? '#FFD700' : '#333',
            transform: isRolling ? 'scale(1.1) rotate(360deg)' : 'scale(1)',
          }}
        >
           {isRolling ? "🎲" : (
             diceValue === 0 ? "TAP" : (
               <img 
                src={`/assets/dice-${diceValue}.png`} 
                alt={diceValue} 
                style={styles.diceImg}
                onError={(e) => { e.target.style.display='none'; e.target.parentNode.innerText = diceValue }}
               />
             )
           )}
        </div>
        <p style={{...styles.turnText, color: isMyTurn ? '#FFD700' : '#555'}}>
          {isMyTurn ? (diceValue > 0 ? "Token Chalein" : "Goti nikaalein!") : "Intezaar..."}
        </p>
      </div>

      <style>{`
        @keyframes pulseJump {
          0% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.2) translateY(-8px); }
          100% { transform: scale(1) translateY(0); }
        }
        .spinner {
          width: 45px; height: 45px; border: 5px solid #222;
          border-top: 5px solid #FFD700; border-radius: 50%;
          animation: spin 1s linear infinite; margin-bottom: 15px;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const getHexColor = (c) => {
    const map = { red: '#ff3b3b', green: '#2ecc71', blue: '#3498db', yellow: '#f1c40f' };
    return map[c] || '#fff';
};

const styles = {
  container: { height: '100dvh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' },
  loading: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' },
  loadingText: { color: '#FFD700', fontSize: '14px', fontWeight: 'bold' },
  header: { width: '100%', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  prizeBadge: { background: 'linear-gradient(to right, #FFD700, #FFA500)', color: '#000', padding: '8px 18px', borderRadius: '30px', fontWeight: '900', fontSize: '15px' },
  statusText: { fontSize: '14px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' },
  boardWrapper: { position: 'relative', width: '92vw', maxWidth: '400px', aspectRatio: '1/1', background: '#222', borderRadius: '15px', border: '4px solid #1a1a1a' },
  boardImg: { width: '100%', height: '100%', borderRadius: '10px' },
  token: { 
    position: 'absolute', width: '8.5%', height: '8.5%', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28)'
  },
  innerToken: { width: '65%', height: '65%', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', background: 'rgba(0,0,0,0.1)' },
  diceSection: { marginTop: 'auto', marginBottom: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  dice: { 
    width: '70px', height: '70px', background: '#fff', borderRadius: '16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '24px', fontWeight: 'bold', border: '3px solid #333',
    transition: 'all 0.2s ease', cursor: 'pointer'
  },
  diceImg: { width: '80%' },
  turnText: { marginTop: '10px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }
};