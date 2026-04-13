import React from "react";
import Cell from "./Cell";
import Token from "./Token";

const SIZE = 15;

// Exact Path Mapping (Clockwise)
const PATH = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], 
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], 
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0]
];

const SAFE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

export default function Board({ game, moves, onTokenClick }) {
  if (!game) return null;

  // 1. Logic to handle stacked tokens on the path
  const getTokensAt = (r, c) => {
    const found = [];
    Object.entries(game.tokens).forEach(([color, tokens]) => {
      tokens.forEach((t, i) => {
        if (t.position >= 0 && t.position < 52) {
          const coord = PATH[t.position];
          if (coord[0] === r && coord[1] === c) {
            found.push({ color, index: i, ...t });
          }
        }
      });
    });
    return found;
  };

  // 2. Rendering tokens inside the 6x6 Home Bases
  const renderHomeTokens = (colorName) => {
    return (game.tokens[colorName] || [])
      .map((t, i) => t.isHome ? (
        <div key={i} style={styles.tokenContainer}>
           <Token 
            color={colorName} 
            index={i} 
            isClickable={moves.includes(i) && game.players[game.gameState.currentTurn].color === colorName}
            onClick={() => onTokenClick(i)} 
          />
        </div>
      ) : null);
  };

  const getCellUI = (r, c) => {
    // --- CENTER FINISH AREA (3x3) ---
    if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
      if (r === 7 && c === 7) return <div key="finish" style={styles.centerFinish}>WIN</div>;
      
      // Triangle Colors for Center
      let triColor = "#fff";
      if (r === 6 && c === 7) triColor = "#ff4d4d"; // Red Top
      if (r === 8 && c === 7) triColor = "#3498db"; // Blue Bottom
      if (r === 7 && c === 6) triColor = "#2ecc71"; // Green Left
      if (r === 7 && c === 8) triColor = "#f1c40f"; // Yellow Right
      
      return <div key={`${r}-${c}`} style={{...styles.centerCell, background: triColor}} />;
    }

    // --- HOME BASES (6x6 Corners) ---
    // Note: We only render the base at the top-left of each 6x6 area to avoid duplication
    if (r === 0 && c === 0) return <div key="home-red" style={{...styles.homeBase, gridColumn: '1 / 7', gridRow: '1 / 7', background: '#ff4d4d'}}>{renderHomeTokens("red")}</div>;
    if (r === 0 && c === 9) return <div key="home-green" style={{...styles.homeBase, gridColumn: '10 / 16', gridRow: '1 / 7', background: '#2ecc71'}}>{renderHomeTokens("green")}</div>;
    if (r === 9 && c === 0) return <div key="home-blue" style={{...styles.homeBase, gridColumn: '1 / 7', gridRow: '10 / 16', background: '#3498db'}}>{renderHomeTokens("blue")}</div>;
    if (r === 9 && c === 9) return <div key="home-yellow" style={{...styles.homeBase, gridColumn: '10 / 16', gridRow: '10 / 16', background: '#f1c40f'}}>{renderHomeTokens("yellow")}</div>;

    // Skip rendering if inside the 6x6 blocks (as they are handled by the span above)
    if ((r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c < 6) || (r > 8 && c > 8)) return null;

    // --- PATH CELLS ---
    let bg = "#ffffff";
    const pathIdx = PATH.findIndex(p => p[0] === r && p[1] === c);
    
    // Home Run Paths (Leading to center)
    if (c === 7 && r > 0 && r < 7) bg = "#ff4d4d"; // Red Path
    if (r === 7 && c > 7 && c < 14) bg = "#f1c40f"; // Yellow Path
    if (c === 7 && r > 7 && r < 14) bg = "#3498db"; // Blue Path
    if (r === 7 && c > 0 && c < 7) bg = "#2ecc71"; // Green Path

    // Starting points colors
    if (r === 6 && c === 1) bg = "#ff4d4d";
    if (r === 1 && c === 8) bg = "#2ecc71";
    if (r === 8 && c === 13) bg = "#f1c40f";
    if (r === 13 && c === 6) bg = "#3498db";

    return (
      <Cell
        key={`${r}-${c}`}
        bg={bg}
        isSafe={SAFE_INDICES.includes(pathIdx)}
        tokens={getTokensAt(r, c)}
        onTokenClick={onTokenClick}
      />
    );
  };

  return (
    <div style={styles.boardWrapper}>
      <div style={styles.grid}>
        {Array.from({ length: SIZE }).map((_, r) =>
          Array.from({ length: SIZE }).map((_, c) => getCellUI(r, c))
        )}
      </div>
    </div>
  );
}

const styles = {
  boardWrapper: {
    padding: '8px',
    background: 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)', // Premium dark theme
    borderRadius: '16px',
    boxShadow: '0 15px 35px rgba(0,0,0,0.8)',
    border: '3px solid #444',
    width: 'fit-content',
    margin: 'auto'
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(15, 28px)", // Standard Ludo size
    gridTemplateRows: "repeat(15, 28px)",
    backgroundColor: "#333", // Grid lines
    border: '1px solid #000',
    userSelect: 'none'
  },
  homeBase: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    padding: '12px',
    gap: '10px',
    border: '1px solid rgba(0,0,0,0.3)',
    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyItems: 'center'
  },
  tokenContainer: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  centerFinish: {
    gridColumn: '7 / 10',
    gridRow: '7 / 10',
    background: 'radial-gradient(circle, #fff 0%, #bdc3c7 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '900',
    color: '#2c3e50',
    zIndex: 10,
    boxShadow: '0 0 15px rgba(255,255,255,0.5)',
    border: '2px solid #000'
  },
  centerCell: {
    width: '100%',
    height: '100%',
    border: '0.5px solid #000'
  }
};