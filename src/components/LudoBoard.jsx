import React, { useState, useEffect } from "react";
import { getTokenCoords } from "../utils/positionMap";
import { getTheme, getBoardThemeStyles } from "../utils/settings";

const colors = { red: "#FF0000", green: "#008000", blue: "#00A2E8", yellow: "#FFD700", white: "#FFFFFF" };
const tokenColors = { red: "#ff3b3b", green: "#00a854", blue: "#00a2e8", yellow: "#f5d300" };

export default function LudoBoard({ 
  tokens = {}, 
  moves = [], 
  onTokenClick = () => {}, 
  currentTurn, 
  players = [],
  scores = {},
  gameMode = "classic", // 🔥 Modes: "classic", "time", "turn"
  timeLeft = 30,
  gameTimer = 300,      // 5 min overall timer for Time Mode
  totalTurns = 25       // Max turns for Turn Mode
}) {
  const [boardTheme, setBoardTheme] = useState(getTheme());

  useEffect(() => {
    const handleSettingsChange = () => setBoardTheme(getTheme());
    window.addEventListener('gameSettingsChanged', handleSettingsChange);
    return () => window.removeEventListener('gameSettingsChanged', handleSettingsChange);
  }, []);

  const boardThemeStyles = getBoardThemeStyles(boardTheme);
  // Logic to show scoreboard only for points-based modes
  const isPointsMode = gameMode === "time" || gameMode === "turn";

  const formatTime = (seconds) => {
    const mins = Math.floor((seconds || 0) / 60);
    const secs = (seconds || 0) % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const cellMarkers = {
    "6-1": { symbol: "→", color: colors.red },
    "1-8": { symbol: "↓", color: colors.green },
    "8-13": { symbol: "←", color: colors.yellow },
    "13-6": { symbol: "↑", color: colors.blue },
    "8-2": { symbol: "★", color: colors.blue },
    "2-6": { symbol: "★", color: colors.red },
    "6-12": { symbol: "★", color: colors.green },
    "12-8": { symbol: "★", color: colors.yellow }
  };

  const renderCell = (r, c) => {
    const isHomeBase = (r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c < 6) || (r > 8 && c > 8);
    const isCenter = (r >= 6 && r <= 8 && c >= 6 && c <= 8);

    if (isHomeBase || isCenter) return <div key={`${r}-${c}`} />;

    const bg = (r === 7 && c > 0 && c < 7) ? colors.red :
               (c === 7 && r > 0 && r < 7) ? colors.green :
               (r === 7 && c > 7 && c < 14) ? colors.yellow :
               (c === 7 && r > 7 && r < 14) ? colors.blue :
               (r === 6 && c === 1) ? colors.red :
               (r === 1 && c === 8) ? colors.green :
               (r === 8 && c === 13) ? colors.yellow :
               (r === 13 && c === 6) ? colors.blue : colors.white;

    const marker = cellMarkers[`${r}-${c}`];

    return (
      <div key={`${r}-${c}`} style={{ ...styles.cell, background: bg }}>
        {marker && <span style={{ color: marker.color, fontWeight: 'bold' }}>{marker.symbol}</span>}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* 📊 Top Status Bar - Adaptive UI */}
      <div style={styles.statusBar}>
          {gameMode === "time" ? (
          <div style={{ ...styles.timer, color: (gameTimer || 0) < 60 ? 'red' : 'gold', fontWeight: 'bold' }}>
            ⏳ {formatTime(gameTimer)}
          </div>
        ) : (
          <div style={styles.timer}>
            ⏱️ {Number.isFinite(timeLeft) ? timeLeft : 0}s
          </div>
        )}

        {isPointsMode && (
          <div style={styles.scoreRow}>
            {players.map((p, i) => (
              <div key={i} style={{ 
                  ...styles.scoreBox, 
                  backgroundColor: p.color || '#444',
                  border: currentTurn === i ? '2px solid gold' : '1px solid transparent'
              }}>
                {scores[p.color] ?? p.score ?? 0} pts
              </div>
            ))}
          </div>
        )}

        {gameMode === "turn" && <div style={styles.turnInfo}>{totalTurns} Turns Left</div>}
      </div>

      <div style={{ ...styles.board, ...boardThemeStyles }}>
        {/* Path Grid */}
        <div style={styles.grid}>
          {Array.from({ length: 15 }).map((_, r) =>
            Array.from({ length: 15 }).map((_, c) => renderCell(r, c))
          )}
        </div>

        {/* Center Victory Area */}
        <div style={styles.centerArea}>
          <div style={{ ...styles.triangle, ...styles.triLeft, borderLeftColor: colors.red }} />
          <div style={{ ...styles.triangle, ...styles.triTop, borderTopColor: colors.green }} />
          <div style={{ ...styles.triangle, ...styles.triRight, borderRightColor: colors.yellow }} />
          <div style={{ ...styles.triangle, ...styles.triBottom, borderBottomColor: colors.blue }} />
        </div>

        {/* Home Bases */}
        <HomeBase color={colors.red} top="0" left="0" />
        <HomeBase color={colors.green} top="0" right="0" />
        <HomeBase color={colors.blue} bottom="0" left="0" />
        <HomeBase color={colors.yellow} bottom="0" right="0" />

        {/* Tokens Overlay */}
        {Object.entries(tokens).flatMap(([color, tokenArray]) =>
          tokenArray.map((token, index) => {
            const coords = getTokenCoords(token, color, index);
            const isClickable = players[currentTurn]?.color === color && moves.includes(index);

            // Hide tokens in home base if they are already out (Points mode logic)
            if (gameMode !== "classic" && token.position === -1) return null;

            return (
              <div
                key={`${color}-${index}`}
                onClick={() => isClickable && onTokenClick(color, index)}
                style={{
                  ...styles.token,
                  left: `${coords.x}%`,
                  top: `${coords.y}%`,
                  backgroundColor: tokenColors[color],
                  border: isClickable ? '2.5px solid gold' : '1.5px solid #fff',
                  zIndex: isClickable ? 300 : 250,
                  boxShadow: isClickable ? "0 0 10px gold" : "0 2px 4px rgba(0,0,0,0.3)"
                }}
              >
                <div style={styles.innerDot} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function HomeBase({ color, top, left, right, bottom }) {
  return (
    <div style={{ ...styles.homeBase, background: color, top, left, right, bottom }}>
      <div style={styles.whiteBox}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={styles.tokenSpot}>
            <div style={{ ...styles.innerDot, backgroundColor: color }} />
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  statusBar: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#222', borderRadius: '12px', marginBottom: '8px', border: '1px solid #444' },
  scoreRow: { display: 'flex', gap: '8px' },
  scoreBox: { padding: '4px 12px', borderRadius: '8px', color: '#fff', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center' },
  timer: { fontWeight: 'bold', fontSize: '14px' },
  turnInfo: { fontSize: '12px', color: 'gold', fontWeight: 'bold' },
  board: { width: '100%', aspectRatio: '1/1', position: 'relative', background: '#fff', border: '2px solid #000' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(15, 1fr)', gridTemplateRows: 'repeat(15, 1fr)', width: '100%', height: '100%', position: 'absolute' },
  cell: { border: '0.5px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  homeBase: { width: '40%', height: '40%', position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #000', zIndex: 10 },
  whiteBox: { width: "70%", height: "70%", background: "#fff", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "10px", border: "1px solid #000" },
  tokenSpot: { border: '1px solid #ddd', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  token: { position: 'absolute', width: '7.5%', height: '7.5%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'translate(-50%, -50%)', transition: 'all 0.3s ease' },
  innerDot: { width: '60%', height: '60%', borderRadius: '50%' },
  centerArea: { position: 'absolute', top: '40%', left: '40%', width: '20%', height: '20%', border: '1px solid #000', zIndex: 10, background: '#fff', overflow: 'hidden' },
  triangle: { position: 'absolute', width: 0, height: 0, borderStyle: 'solid' },
  triLeft: { borderWidth: '45px 0 45px 45px', left: 0, top: 0 },
  triTop: { borderWidth: '45px 45px 0 45px', top: 0, left: 0 },
  triRight: { borderWidth: '45px 45px 45px 0', right: 0, top: 0 },
  triBottom: { borderWidth: '0 45px 45px 45px', bottom: 0, left: 0 }
};