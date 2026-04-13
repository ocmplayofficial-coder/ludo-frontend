import { useEffect, useState, useCallback, useRef } from "react";
import { socket } from "../services/socket";

// Asset paths
const diceRollAudioUrl = new URL("../assets/dice-roll.mp3", import.meta.url).href;
const moveAudioUrl = new URL("../assets/move.mp3", import.meta.url).href;
const killAudioUrl = new URL("../assets/kill.mp3", import.meta.url).href;
const winAudioUrl = new URL("../assets/win.mp3", import.meta.url).href;

export default function useGame(roomId) {
  const [game, setGame] = useState(null);
  const [dice, setDice] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [validMoves, setValidMoves] = useState([]);
  const [myPlayerInfo, setMyPlayerInfo] = useState(null);
  
  // Audio Refs for high performance
  const sounds = useRef({
    roll: new Audio(diceRollAudioUrl),
    move: new Audio(moveAudioUrl),
    kill: new Audio(killAudioUrl),
    win: new Audio(winAudioUrl)
  });

  const playSound = (type) => {
    const s = sounds.current[type];
    if (s) {
      s.currentTime = 0;
      s.volume = 0.5;
      s.play().catch(() => {});
    }
  };

  // --- Animation Helper: Token ko ek-ek karke move karne ke liye ---
  const animateMovement = async (color, tokenIndex, targetPosition) => {
    setGame((prev) => {
      if (!prev) return prev;
      const newTokens = { ...prev.tokens };
      const currentPos = newTokens[color][tokenIndex].position;
      
      // Agar token home se nikal raha hai (pos: -1 to 0)
      if (currentPos === -1) {
        newTokens[color][tokenIndex].position = 0;
        newTokens[color][tokenIndex].isHome = false;
        playSound('move');
        return { ...prev, tokens: newTokens };
      }

      // TODO: Loop for step-by-step animation can be added here
      // Filhal hum target position set kar rahe hain with sound
      newTokens[color][tokenIndex].position = targetPosition;
      playSound('move');
      return { ...prev, tokens: newTokens };
    });
  };

  useEffect(() => {
    if (!socket.connected) socket.connect();

    // 1. Join & Sync Room
    socket.emit("joinRoom", { roomId });

    socket.on("gameState", (data) => {
      setGame(data.game);
      setValidMoves(data.validMoves || []);
      const me = data.game.players.find(p => p.socketId === socket.id || p.userId === data.userId);
      setMyPlayerInfo(me);
    });

    // 2. Dice Roll Handler
    socket.on("diceRolled", ({ dice: newValue, moves, nextTurnAuto }) => {
      setRolling(true);
      playSound('roll');
      
      // Animation timing sync with Dice.jsx
      setTimeout(() => {
        setDice(newValue);
        setRolling(false);
        setValidMoves(moves || []);
        
        // Agar 6 aaya toh vibration ya special effect trigger kar sakte hain
        if (newValue === 6 && window.navigator.vibrate) {
            window.navigator.vibrate(100);
        }
      }, 800); 
    });

    // 3. Token Move & Animation
    socket.on("tokenMoved", ({ color, tokenIndex, targetPosition, killedToken, isFinished }) => {
      // Clear valid moves immediately to prevent multi-clicks
      setValidMoves([]);
      
      // Step-by-step move trigger
      animateMovement(color, tokenIndex, targetPosition);

      if (killedToken) {
        setTimeout(() => playSound('kill'), 400);
      }
      if (isFinished) {
        setTimeout(() => playSound('win'), 200);
      }
    });

    // 4. Turn Sync
    socket.on("turnChanged", ({ currentTurn, turnsLeft }) => {
      setGame((prev) => ({ 
        ...prev, 
        gameState: { 
            ...prev.gameState,
            currentTurn, 
            turnsLeft 
        },
        diceValue: 0 
      }));
      setValidMoves([]);
      setDice(0); // Reset visual dice
    });

    // 5. Game Over
    socket.on("gameOver", (data) => {
      setGame((prev) => ({ ...prev, gameOver: true, winner: data.winner }));
      playSound('win');
    });

    return () => {
      socket.off("gameState");
      socket.off("diceRolled");
      socket.off("tokenMoved");
      socket.off("turnChanged");
      socket.off("gameOver");
    };
  }, [roomId]);

  // --- External Actions ---
  const rollDice = useCallback(() => {
    // Basic checks: Turn check, rolling state, and game status
    if (rolling || game?.gameState?.currentTurn !== myPlayerInfo?.index || game?.gameOver) {
        return;
    }
    socket.emit("rollDice", { roomId });
  }, [rolling, game, myPlayerInfo, roomId]);

  const moveToken = useCallback((tokenIndex) => {
    if (!validMoves.includes(tokenIndex) || game?.gameOver) return;
    
    // UI par turant response ke liye optimistic move yahan daal sakte hain
    socket.emit("moveToken", { roomId, tokenIndex });
    setValidMoves([]); 
  }, [validMoves, game, roomId]);

  return {
    game,
    dice,
    rolling,
    validMoves,
    isMyTurn: game?.gameState?.currentTurn === myPlayerInfo?.index,
    myColor: myPlayerInfo?.color,
    myInfo: myPlayerInfo,
    actions: {
      rollDice,
      moveToken,
    },
  };
}