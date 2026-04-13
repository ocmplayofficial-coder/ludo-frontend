import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../services/SocketContext";

import Dice from "../components/Dice";
import PlayerCard from "../components/PlayerCard";
import GameBoard from "../components/LudoBoard";
import CelebrationPopup from "../components/CelebrationPopup";
import Header from "../components/Header"; // Humara premium header

const Game = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket() || {};

  const [game, setGame] = useState(null);
  const [localTokens, setLocalTokens] = useState(null);
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [validMoves, setValidMoves] = useState([]);
  const [error, setError] = useState("");
  const [overallTime, setOverallTime] = useState(300);
  const [user, setUser] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const [winnerData, setWinnerData] = useState(null);
  const [turnTimeLeft, setTurnTimeLeft] = useState(0);
  const [hasRolled, setHasRolled] = useState(false);
  
  const joinedRef = useRef(false);

  const attachScoresToPlayers = (players = [], scores = {}) => {
    return players.map((player) => ({
      ...player,
      score: scores[player.color] ?? player.score ?? 0,
      points: scores[player.color] ?? player.points ?? 0
    }));
  };

  // 1. Load User
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return navigate("/login");
    setUser(JSON.parse(userStr));
  }, [navigate]);

  // 2. 🚶‍♂️ Smooth Token Walking Animation
  const animateToken = useCallback(async (color, tokenIndex, newSteps, finalTokensState) => {
    if (!localTokens) return;

    let tempTokens = JSON.parse(JSON.stringify(localTokens));
    let startSteps = tempTokens[color][tokenIndex].steps;

    // Direct Jump if coming out of home (steps 0 to 1)
    if (startSteps === 0 && newSteps === 1) {
      setLocalTokens(finalTokensState);
      return;
    }

    // Incremental Walk
    for (let s = startSteps + 1; s <= newSteps; s++) {
      tempTokens[color][tokenIndex].steps = s;
      setLocalTokens({ ...tempTokens });
      
      // Move sound play logic here if needed
      await new Promise((resolve) => setTimeout(resolve, 200)); 
    }

    // Final Sync (Handles kills and stacking positions accurately)
    setLocalTokens(finalTokensState);
  }, [localTokens]);

  // 3. Socket Logic
  useEffect(() => {
    if (!socket || !connected || !roomId) return;

    if (!joinedRef.current) {
      joinedRef.current = true;
      socket.emit("joinRoom", { roomId });
    }

    socket.on("gameState", (data) => {
      const scores = data?.gameState?.scores || data?.scores || {};
      const playersWithScores = attachScoresToPlayers(data.players || [], scores);

      setGame({
        ...data,
        players: playersWithScores,
        gameState: {
          ...(data.gameState || {}),
          scores
        }
      });
      setLocalTokens(data.tokens);
      setHasRolled(false);
      if (data?.diceValue) setDiceValue(data.diceValue);
      if (data?.type === "time") {
        const initialTime = data?.timeEndAt
          ? Math.max(0, Math.ceil((new Date(data.timeEndAt).getTime() - Date.now()) / 1000))
          : 300;
        setOverallTime(initialTime);
      }
    });

    socket.on("diceRolled", ({ dice, moves, turn, turnStartTime, turnTimeLimit, totalMoves }) => {
      setIsRolling(true);
      setHasRolled(true);
      setError("");
      setTimeout(() => {
        setDiceValue(dice);
        setValidMoves(moves || []);
        setGame(prev => prev ? {
          ...prev,
          gameState: {
            ...prev.gameState,
            diceValue: dice,
            currentTurn: turn,
            turnStartTime,
            turnTimeLimit,
            totalMoves
          }
        } : prev);
        setIsRolling(false);
      }, 800);
    });

    socket.on("tokenMoved", ({ tokens, color, tokenIndex, newSteps, totalMoves, nextTurn, scores }) => {
      const payloadScores = scores || {};
      if (color && tokenIndex !== undefined && typeof newSteps === "number") {
        animateToken(color, tokenIndex, newSteps, tokens);
      } else {
        setLocalTokens(tokens);
      }
      setGame((prev) => {
        const playersWithScores = attachScoresToPlayers(prev?.players || [], payloadScores);
        return prev ? {
          ...prev,
          tokens,
          players: playersWithScores,
          gameState: {
            ...prev.gameState,
            totalMoves: totalMoves ?? prev.gameState.totalMoves,
            currentTurn: typeof nextTurn === 'number' ? nextTurn : prev.gameState.currentTurn,
            scores: payloadScores,
            diceValue: 0
          }
        } : prev;
      });
      setValidMoves([]);
      setHasRolled(false);
    });

    socket.on("error_msg", (msg) => {
      setError(msg);
      setIsRolling(false);
    });
    socket.on("error", (msg) => {
      setError(msg);
      setIsRolling(false);
    });

    socket.on("turnChanged", ({ turn, turnStartTime, turnTimeLimit, totalMoves, message }) => {
      setGame((prev) => prev ? {
        ...prev,
        gameState: {
          ...prev.gameState,
          currentTurn: turn,
          turnStartTime,
          turnTimeLimit,
          totalMoves
        }
      } : prev);
      setValidMoves([]);
      setError(message || "");
      setHasRolled(false);
    });
    socket.on("turnMissedAlert", ({ message }) => {
      setError(message || "Turn skipped due to timeout.");
    });

    socket.on("gameTimerUpdate", ({ gameTimer }) => {
      setOverallTime(Number.isFinite(gameTimer) ? gameTimer : 0);
    });

    socket.on("gameOver", (data) => {
      if (data.reason === "Opponent Left" || (data.message && data.message.toLowerCase().includes("disconnect"))) {
        alert("Badhai ho! Opponent game chhod kar chala gaya, aap jeet gaye!");
      }

      setWinnerData({
        winnerId: data.winnerId || data.winner || data.userId || null,
        name: data.name || 'YOU',
        prize: data.prize || 0,
        avatar: data.avatar || '/assets/avatar-1.png',
        message: data.message || (data.reason === "Opponent Left" ? "Opponent disconnected. You won!" : undefined)
      });
      setShowWinner(true);
      setGame((prev) => prev ? { ...prev, status: 'finished' } : prev);
    });

    return () => {
      socket.off("gameState");
      socket.off("diceRolled");
      socket.off("tokenMoved");
      socket.off("gameTimerUpdate");
      socket.off("turnChanged");
      socket.off("gameOver");
      socket.off("error");
      socket.off("error_msg");
    };
  }, [socket, connected, roomId, animateToken, navigate]);

  useEffect(() => {
    if (!game?.gameState?.turnStartTime || !game?.gameState?.turnTimeLimit) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - game.gameState.turnStartTime) / 1000);
      const left = Math.max(0, (game.gameState.turnTimeLimit || 0) - elapsed);
      setTurnTimeLeft(left);
    }, 500);

    return () => clearInterval(interval);
  }, [game]);

  // Actions
  const handleRollDice = () => {
    if (!socket || isRolling || hasRolled || !game?.players || !game?.gameState) return;
    const playerIndex = game.players.findIndex((p) => p.userId.toString() === user._id);
    if (playerIndex !== game.gameState.currentTurn) return; // Prevent extra emits
    socket.emit("rollDice", { roomId });
  };

  const handleTokenClick = (color, tokenIndex) => {
    const myPlayerIndex = game?.players?.findIndex((p) => p.userId.toString() === user._id);
    const myColor = game?.players?.[myPlayerIndex]?.color;
    if (!myColor || color !== myColor) return;

    const token = localTokens?.[color]?.[tokenIndex];
    if (!token) return;

    const canLaunch = diceValue === 6 && token.position === -1;
    const canMove = validMoves.includes(tokenIndex);
    if (!canLaunch && !canMove) return;

    socket.emit("moveToken", { roomId, tokenIndex });
    setValidMoves([]);
  };

  if (!game || !user || !localTokens) return <div style={styles.loading}>Connecting to Arena...</div>;

  const myPlayerIndex = game.players?.findIndex((p) => p.userId.toString() === user._id);
  const myColor = game.players?.[myPlayerIndex]?.color;
  const isMyTurn = game.gameState.currentTurn === myPlayerIndex;
  const hasActiveTokens = myColor ? localTokens?.[myColor]?.some((t) => t.status === "active") : false;

  return (
    <div style={styles.container}>
      <CelebrationPopup
        isOpen={showWinner}
        winnerData={winnerData}
        myUserId={user?._id}
        gameType="ludo"
        onClose={() => {
          setShowWinner(false);
          navigate('/dashboard');
        }}
      />
      {/* 📡 Top Nav */}
      <Header user={user} showBack={true} title="LUDO PRO MATCH" />

      {/* 🏆 Prize & Turns Info */}
      <div style={styles.statusRow}>
        <div style={styles.prizeBadge}>🏆 ₹{game.prizeMoney}</div>
        {game.type === "turn" && (
          <div style={styles.turnBadge}>{game.gameState.totalMoves || 0}/25 TURNS</div>
        )}
        {(game.type === "classic" || game.type === "turn") && (
          <div style={styles.timerBadge}>⏱️ {turnTimeLeft}s</div>
        )}
      </div>

      {/* 🧩 Ludo Board */}
      <div style={styles.boardArea}>
        <GameBoard
          tokens={localTokens}
          moves={validMoves}
          onTokenClick={handleTokenClick}
          currentTurn={game.gameState.currentTurn}
          players={game.players}
          gameMode={game.type}
          scores={game.gameState?.scores}
          timeLeft={turnTimeLeft}
          gameTimer={overallTime}
        />
      </div>

      {/* 👥 Players & Dice Section */}
      <div style={styles.bottomSection}>
        <div style={styles.playerGrid}>
          {game.players?.map((p, i) => (
            <PlayerCard
              key={i}
              player={p}
              isCurrentTurn={i === game.gameState.currentTurn}
              isSelf={i === myPlayerIndex}
            />
          ))}
        </div>

        <div style={styles.diceArea}>
          <Dice
            value={diceValue}
            isRolling={isRolling}
            onRoll={handleRollDice}
            disabled={!isMyTurn || isRolling || hasRolled}
            isMyTurn={isMyTurn}
            hasRolled={hasRolled}
          />
          {isMyTurn && !isRolling && (
             <div style={styles.turnHint}>Your Turn! Tap Dice</div>
          )}
          {!isMyTurn && !isRolling && (
             <div style={styles.turnHint}>Opponent's turn</div>
          )}
          {isMyTurn && !isRolling && validMoves.length === 0 && diceValue > 0 && (
             <div style={styles.turnHint}>No valid moves — turn will pass</div>
          )}
          {isMyTurn && !hasActiveTokens && !isRolling && (
             <div style={styles.turnHint}>Roll a 6 to launch a goti</div>
          )}
        </div>
      </div>

      {error && <div style={styles.errorToast}>{error}</div>}
    </div>
  );
};

const styles = {
  container: {
    height: "100vh",
    width: "100vw",
    background: "linear-gradient(180deg, #440000 0%, #1a0000 100%)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  loading: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFD700', fontWeight: 'bold' },
  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 20px",
    background: "rgba(0,0,0,0.2)"
  },
  prizeBadge: { background: "#FFD700", color: "#000", padding: "4px 15px", borderRadius: "20px", fontWeight: "900", fontSize: "14px" },
  turnBadge: { color: "#fff", fontWeight: "bold", fontSize: "12px", border: "1px solid rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px" },
  timerBadge: { color: "#fff", fontWeight: "bold", fontSize: "12px", border: "1px solid rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px", marginLeft: "8px" },
  boardArea: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "10px",
    width: "100%",
    maxWidth: "540px",
    margin: "0 auto"
  },
  bottomSection: {
    background: "rgba(0,0,0,0.4)",
    padding: "15px",
    borderTopLeftRadius: "25px",
    borderTopRightRadius: "25px",
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  },
  playerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px"
  },
  diceArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: "10px"
  },
  turnHint: { color: "#FFD700", fontSize: "12px", fontWeight: "bold", marginTop: "8px", animation: "pulse 1.5s infinite" },
  errorToast: { position: "fixed", bottom: "100px", left: "50%", transform: "translateX(-50%)", background: "#ff4444", color: "#fff", padding: "8px 20px", borderRadius: "20px", fontSize: "12px", zIndex: 1000 }
};

export default Game;