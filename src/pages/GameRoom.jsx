import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../services/SocketContext";

import LudoBoard from "../components/LudoBoard";
import Dice from "../components/Dice";
import PlayerCard from "../components/PlayerCard";
import WinnerResultPopup from "../components/WinnerResultPopup";
import Header from "../components/Header";

export default function GameRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();

  const [game, setGame] = useState(null);
  const [dice, setDice] = useState(1);
  const [moves, setMoves] = useState([]);
  const [isRolling, setIsRolling] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [winnerData, setWinnerData] = useState(null);
  const [noticeMsg, setNoticeMsg] = useState("");
  const [reconnectSeconds, setReconnectSeconds] = useState(0);
  const [matchTimeLeft, setMatchTimeLeft] = useState(0);
  const [turnTimeLeft, setTurnTimeLeft] = useState(0);
  const [user, setUser] = useState(null);

  // 1. Load User
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return navigate("/login");
    setUser(JSON.parse(userStr));
  }, [navigate]);

  // 2. Socket Listeners (Optimized)
  useEffect(() => {
    if (!socket || !connected) return;

    socket.emit("joinRoom", { roomId });

    socket.on("gameState", (data) => {
      const scores = data.gameState?.scores || data.scores || {};
      const players = data.players?.map((player) => ({
        ...player,
        score: scores[player.color] ?? 0,
        points: scores[player.color] ?? 0
      })) || [];

      setGame({
        ...data,
        players,
        gameState: {
          ...(data.gameState || {}),
          scores
        }
      });
      if (data.gameState?.diceValue) setDice(data.gameState.diceValue);
    });

    socket.on("diceRolled", ({ dice: rolledValue, moves: validMoves }) => {
      setIsRolling(true);
      // Wait for Dice animation (Dice.jsx handles the visual shuffle)
      setTimeout(() => {
        setDice(rolledValue);
        setMoves(validMoves || []);
        setIsRolling(false);
      }, 800);
    });

    socket.on("tokenMoved", ({ tokens, scores }) => {
      const payloadScores = scores || {};
      setGame((prev) => {
        const players = prev.players?.map((player) => ({
          ...player,
          score: payloadScores?.[player.color] ?? player.score,
          points: payloadScores?.[player.color] ?? player.points
        })) || prev.players;
        return {
          ...prev,
          tokens,
          players,
          gameState: {
            ...prev.gameState,
            scores: payloadScores,
            diceValue: 0
          }
        };
      });
      setDice(0);
      setMoves([]);
    });

    socket.on("turnChanged", (payload) => {
      const nextTurn = typeof payload === 'object' ? payload.turn : payload;
      setGame((prev) => ({
        ...prev,
        gameState: { ...prev.gameState, currentTurn: nextTurn }
      }));
      setMoves([]); // Clear highlights for new turn
    });

    socket.on("gameTimerUpdate", ({ gameTimer }) => {
      setMatchTimeLeft(Number.isFinite(gameTimer) ? gameTimer : 0);
    });

    socket.on("playerStatusChanged", ({ userId, isOnline, message }) => {
      if (!user || userId === user._id) return;
      setNoticeMsg(message || (isOnline ? "Opponent is back in the game!" : "Opponent disconnected. They have 30 seconds to return."));
      if (!isOnline) {
        setReconnectSeconds(30);
      } else {
        setReconnectSeconds(0);
        setTimeout(() => setNoticeMsg(""), 4000);
      }
    });

    socket.on("playerOfflineWarning", ({ remainingLives, message }) => {
      setNoticeMsg(message || `Opponent missed reconnect. Lives left: ${remainingLives}`);
      setReconnectSeconds(0);
    });

    socket.on("playerBack", ({ message }) => {
      setNoticeMsg(message || "Opponent is back in the game!");
      setReconnectSeconds(0);
      setTimeout(() => setNoticeMsg(""), 4000);
    });

    socket.on("gameOver", (data) => {
      setWinnerData({
        winnerId: data.winnerId || data.winner,
        name: data.name || 'Winner',
        avatar: data.avatar || '/assets/avatar-1.png',
        prize: data.prize || 0,
        color: data.color || 'red',
        message: data.message,
        scores: data.scores || {}
      });
      setShowWinner(true);
    });

    return () => {
      socket.off("gameState");
      socket.off("diceRolled");
      socket.off("tokenMoved");
      socket.off("turnChanged");
      socket.off("gameTimerUpdate");
      socket.off("playerStatusChanged");
      socket.off("playerOfflineWarning");
      socket.off("playerBack");
      socket.off("gameOver");
    };
  }, [socket, connected, roomId, navigate]);

  useEffect(() => {
    if (!game || game.type !== "time" || !game.timeEndAt) return;

    const updateMatchTimer = () => {
      const remaining = Math.max(0, Math.floor((new Date(game.timeEndAt).getTime() - Date.now()) / 1000));
      setMatchTimeLeft(remaining);
    };

    updateMatchTimer();
    const intervalId = setInterval(updateMatchTimer, 1000);

    return () => clearInterval(intervalId);
  }, [game]);

  useEffect(() => {
    if (!game?.gameState?.turnStartTime || !game?.gameState?.turnTimeLimit) {
      setTurnTimeLeft(0);
      return;
    }

    const updateTurnTimer = () => {
      const endTime = new Date(game.gameState.turnStartTime).getTime() + (game.gameState.turnTimeLimit * 1000);
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTurnTimeLeft(remaining);
    };

    updateTurnTimer();
    const intervalId = setInterval(updateTurnTimer, 1000);
    return () => clearInterval(intervalId);
  }, [game]);

  const formatTime = (seconds) => {
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // --- ACTIONS ---
  const handleRollDice = () => {
    if (isRolling || !isMyTurn) return;
    socket.emit("rollDice", { roomId });
  };

  const handleTokenMove = (color, index) => {
    if (!moves.includes(index)) return;
    const token = game.tokens?.[color]?.[index];
    const action = token?.position === -1 ? "LAUNCH" : "MOVE";
    socket.emit("moveToken", { roomId, tokenIndex: index, action });
    setMoves([]); // Optimistic clear
  };

  const handleLeaveRoom = useCallback(() => {
    if (socket && connected) {
      socket.emit("leaveGame", { roomId });
    }
    navigate("/dashboard");
  }, [socket, connected, roomId, navigate]);

  useEffect(() => {
    if (!reconnectSeconds) return;

    const intervalId = setInterval(() => {
      setReconnectSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [reconnectSeconds]);

  if (!game || !user) return <div style={styles.loader}>Initializing Game Table...</div>;

  const currentTurnIndex = game.gameState.currentTurn;
  const isMyTurn = game.players[currentTurnIndex]?.userId === user._id;

  return (
    <div style={styles.container}>
      {/* 📡 Top Header (Prize & Back) */}
      <Header 
        user={user} 
        showBack={true} 
        onBack={handleLeaveRoom}
        showPrize={true} 
        prizeAmount={game.prizeMoney} 
      />

      {/* 🎯 Turns Left Indicator */}
      {(game.type === "time" || game.type === "turn") && (
        <div style={styles.turnsIndicator}>
          {game.type === "time"
            ? `TIME LEFT: ${formatTime(matchTimeLeft)}`
            : `${game.gameState.totalMoves ?? 0}/25 TURNS LEFT`}
        </div>
      )}
      {noticeMsg && (
        <div style={styles.noticeBanner}>
          {noticeMsg}
          {reconnectSeconds > 0 && ` Return in ${reconnectSeconds}s`}
        </div>
      )}

      <div style={styles.mainLayout}>
        {/* Top Players */}
        <div style={styles.playerRow}>
          <PlayerCard 
            player={game.players[0]} 
            isCurrentTurn={currentTurnIndex === 0} 
            isSelf={game.players[0]?.userId === user._id} 
          />
          <PlayerCard 
            player={game.players[1]} 
            isCurrentTurn={currentTurnIndex === 1} 
            isSelf={game.players[1]?.userId === user._id} 
          />
        </div>

        {/* 🧩 THE BOARD */}
        <div style={styles.boardWrapper}>
          <LudoBoard
            tokens={game.tokens}
            moves={moves}
            onTokenClick={handleTokenMove}
            currentTurn={currentTurnIndex}
            players={game.players}
            scores={game.gameState?.scores}
            gameMode={game.type}
            gameTimer={matchTimeLeft}
            timeLeft={turnTimeLeft}
            totalTurns={game.gameState?.totalMoves ?? 0}
          />
        </div>

        {/* Bottom Players */}
        <div style={styles.playerRow}>
          <PlayerCard 
            player={game.players[2]} 
            isCurrentTurn={currentTurnIndex === 2} 
            isSelf={game.players[2]?.userId === user._id} 
          />
          <PlayerCard 
            player={game.players[3]} 
            isCurrentTurn={currentTurnIndex === 3} 
            isSelf={game.players[3]?.userId === user._id} 
          />
        </div>
      </div>

      <WinnerResultPopup
        open={showWinner}
        winnerData={winnerData}
        myUserId={user?._id || user?.id}
        gameMode={game.type}
        onClose={() => setShowWinner(false)}
      />

      {/* 🎲 DICE CONTROLLER AREA */}
      <div style={styles.diceSection}>
        <Dice 
          value={dice} 
          isRolling={isRolling} 
          onRoll={handleRollDice} 
          disabled={!isMyTurn} 
        />
        {isMyTurn && !isRolling && (
          <div style={styles.turnText}>IT'S YOUR TURN! ROLL NOW</div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    width: "100vw",
    background: "linear-gradient(180deg, #440000 0%, #1a0000 100%)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  loader: { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' },
  turnsIndicator: {
    textAlign: "center",
    padding: "10px",
    color: "#FFD700",
    fontWeight: "900",
    fontSize: "12px",
    letterSpacing: "1px",
    background: "rgba(0,0,0,0.3)"
  },
  mainLayout: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "15px",
  },
  playerRow: {
    width: "100%",
    maxWidth: "360px",
    display: "flex",
    justifyContent: "space-between",
    padding: "0 10px",
  },
  boardWrapper: {
    padding: "8px",
    background: "rgba(255,255,255,0.05)",
    borderRadius: "20px",
    boxShadow: "0 0 50px rgba(0,0,0,0.5)",
  },
  noticeBanner: {
    width: "100%",
    maxWidth: "360px",
    padding: "10px 14px",
    borderRadius: "18px",
    background: "rgba(255, 165, 0, 0.18)",
    color: "#FFD966",
    border: "1px solid rgba(255, 165, 0, 0.35)",
    fontSize: "12px",
    fontWeight: "700",
    textAlign: "center",
  },
  diceSection: {
    height: "140px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: "20px"
  },
  turnText: {
    marginTop: "10px",
    color: "#FFD700",
    fontSize: "12px",
    fontWeight: "bold",
    animation: "pulse 1.5s infinite"
  }
};