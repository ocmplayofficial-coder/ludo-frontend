import { useParams } from "react-router-dom";
import Board from "../game/Board";
import Dice from "../game/Dice";
import useGameSocket from "../game/useGameSocket";
import { useState, useEffect } from "react";

export default function GamePage() {
  const { roomId } = useParams();
  // useGameSocket se saara live data fetch ho raha hai
  const { game, dice, rolling, validMoves, actions, isMyTurn, myColor } = useGameSocket(roomId);
  
  if (!game) return (
    <div style={styles.loading}>
      <div className="loader"></div>
      <p>Ludo Pro Server se jud rahe hain...</p>
    </div>
  );

  // Players ko unke index ke hisaab se map karna (Standard Ludo Positions)
  const players = game.players || [];

  return (
    <div style={styles.appWrapper}>
      {/* 📡 TOP NAVIGATION (Signal + Prize) */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <div style={styles.prizeBadge}>🏆 ₹{game.prizeMoney || "0.00"}</div>
        </div>
        <div style={styles.roomInfo}>
          <span style={styles.roomLabel}>ROOM ID:</span>
          <span style={styles.roomValue}>{roomId}</span>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.timerBadge}>⏳ {game.turnsLeft || 0} Turns</div>
        </div>
      </header>

      {/* 🧩 MAIN CONTENT AREA */}
      <main style={styles.mainContainer}>
        <div style={styles.gameLayout}>
          
          {/* Top Players (Red & Green) */}
          <div style={styles.playerRow}>
             <PlayerPanel player={players[0]} isCurrent={game.currentTurn === 0} position="top-left" />
             <PlayerPanel player={players[1]} isCurrent={game.currentTurn === 1} position="top-right" />
          </div>

          {/* THE BOARD CONTAINER */}
          <div style={{
            ...styles.boardBox,
            boxShadow: isMyTurn ? `0 0 30px ${myColor}44` : "0 0 40px rgba(0,0,0,0.5)"
          }}>
            <Board 
              game={game} 
              moves={validMoves}
              onTokenClick={(index) => actions.moveToken(index)}
            />
          </div>

          {/* Bottom Players (Blue & Yellow) */}
          <div style={styles.playerRow}>
             <PlayerPanel player={players[2]} isCurrent={game.currentTurn === 2} position="bottom-left" />
             <PlayerPanel player={players[3]} isCurrent={game.currentTurn === 3} position="bottom-right" />
          </div>
        </div>
      </main>

      {/* 🎲 BOTTOM DICE AREA */}
      <footer style={styles.footer}>
        <div style={{ 
          ...styles.diceContainer, 
          opacity: isMyTurn ? 1 : 0.6,
          transform: isMyTurn ? 'scale(1.1)' : 'scale(0.9)'
        }}>
          {isMyTurn && !rolling && (
             <div style={{...styles.turnArrow, color: myColor}}>⬇️ YOUR TURN ⬇️</div>
          )}
          <Dice 
            value={dice} 
            isRolling={rolling} 
            onRoll={actions.rollDice}
            disabled={!isMyTurn}
            turnColor={myColor}
          />
        </div>
      </footer>

      {/* Internal CSS for Animations */}
      <style>{`
        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #FFD700;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// 👤 Individual Player Panel
function PlayerPanel({ player, isCurrent, position }) {
  if (!player) return <div style={styles.emptyPlayer} />;

  return (
    <div style={{ 
      ...styles.playerCard, 
      borderColor: isCurrent ? '#FFD700' : 'rgba(255,255,255,0.1)',
      backgroundColor: isCurrent ? 'rgba(255,215,0,0.15)' : 'rgba(0,0,0,0.5)',
    }}>
      <div style={{ ...styles.avatar, backgroundColor: player.color }}>
        {player.name?.[0].toUpperCase()}
      </div>
      <div style={styles.playerInfo}>
        <div style={styles.pName}>{player.name}</div>
        <div style={styles.pScore}>₹{player.walletBalance || 0}</div>
      </div>
      {isCurrent && <div style={styles.activePulse} />}
    </div>
  );
}

const styles = {
  appWrapper: {
    height: "100dvh",
    width: "100vw",
    background: "radial-gradient(circle, #3a0000 0%, #000000 100%)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif"
  },
  loading: { height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#000' },
  header: {
    height: "70px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 15px",
    background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(10px)",
    borderBottom: "2px solid rgba(255,255,255,0.05)"
  },
  prizeBadge: { background: "linear-gradient(90deg, #FFD700, #FFA500)", color: "#000", padding: "6px 16px", borderRadius: "30px", fontWeight: "900", fontSize: "14px" },
  roomInfo: { textAlign: "center" },
  roomLabel: { color: "#888", fontSize: "10px", display: "block" },
  roomValue: { color: "#FFD700", fontWeight: "bold", fontSize: "12px", letterSpacing: "1px" },
  timerBadge: { background: "#E91E63", padding: "6px 16px", borderRadius: "30px", fontWeight: "bold", fontSize: "12px", boxShadow: "0 0 15px rgba(233, 30, 99, 0.4)" },
  mainContainer: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "10px" },
  gameLayout: { width: "100%", maxWidth: "450px", display: "flex", flexDirection: "column", gap: "15px" },
  playerRow: { display: "flex", justifyContent: "space-between", width: "100%" },
  boardBox: { 
    padding: "6px", 
    background: "#111", 
    borderRadius: "12px", 
    border: "2px solid #222",
    transition: "all 0.5s ease"
  },
  footer: { height: "130px", display: "flex", justifyContent: "center", alignItems: "center", paddingBottom: "20px" },
  diceContainer: { position: "relative", transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)" },
  turnArrow: { position: "absolute", top: "-30px", width: "150px", left: "-45px", fontWeight: "900", fontSize: "12px", textAlign: "center", animation: "bounce 1s infinite" },
  
  playerCard: {
    width: "45%",
    height: "55px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    padding: "6px",
    border: "2px solid transparent",
    position: "relative",
    transition: "all 0.3s ease"
  },
  avatar: { width: "38px", height: "38px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", border: "2px solid rgba(255,255,255,0.3)", fontSize: "18px" },
  playerInfo: { marginLeft: "10px", overflow: "hidden" },
  pName: { fontSize: "11px", fontWeight: "bold", whiteSpace: "nowrap", textOverflow: "ellipsis" },
  pScore: { fontSize: "12px", color: "#FFD700", fontWeight: "900" },
  activePulse: { position: "absolute", top: "2px", right: "2px", width: "8px", height: "8px", background: "#00FF00", borderRadius: "50%", boxShadow: "0 0 10px #00FF00" },
  emptyPlayer: { width: "45%", height: "55px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px dashed rgba(255,255,255,0.1)" }
};