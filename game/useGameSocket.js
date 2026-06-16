import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from './socketInstance.js';
import { API_URL } from '../src/config';

// ------------------------------------------------------------
//  useGameSocket – singleton Socket.IO client for the /ludo namespace
// ------------------------------------------------------------
export default function useGameSocket(matchId) {
  const [game, setGame] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  // Read token snapshot so effect can re-run when user logs in (sessionStorage is updated)
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');

  // Track current matchId in a ref to filter stale events
  const matchIdRef = useRef(matchId);
  useEffect(() => {
    matchIdRef.current = matchId;
  }, [matchId]);

  // ------------------------------------------------------------
  // 1️⃣ Initialise the socket only once (on hook mount)
  // ------------------------------------------------------------
  useEffect(() => {
    console.log('Connecting to Socket.IO namespace /ludo');
    const socket = getSocket();

    // If no socket (no token yet), bail out — effect will re-run when `token` changes
    if (!socket) {
      console.warn("⚠️ Socket not ready yet (no token)");
      return;
    }

    // Avoid attaching listeners multiple times for the same singleton socket
    if (socketRef.current === socket) {
      // ensure connected flag is accurate
      setIsConnected(socket.connected);
      return;
    }
    socketRef.current = socket;

    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
      console.log('✅ Socket connected (id =', socket.id, ')');
      console.log('useGameSocket: listeners attached for socket', socket.id);
      // Join game will be handled by the matchId effect
    };

    const handleGameUpdate = (updatedGame) => {
      console.log("RESULT_RECEIVED", Date.now());
      if (!updatedGame || updatedGame.matchId !== matchIdRef.current) {
        console.warn('Discarding stale GAME_UPDATE for', updatedGame?.matchId, 'Expected:', matchIdRef.current);
        return;
      }
      console.log('SOCKET GAME_UPDATE RECEIVED', {
        matchId: updatedGame?.matchId,
        turn: updatedGame?.turn,
        diceHasRolled: updatedGame?.diceHasRolled,
        winner: updatedGame?.winner,
      });
      setGame(prev => ({ ...(prev || {}), ...(updatedGame || {}) }));
    };

    const handleGameStarted = (startedGame) => {
      if (!startedGame || startedGame.roomId !== matchIdRef.current && startedGame.matchId !== matchIdRef.current) {
         console.warn('Discarding stale GAME_STARTED for', startedGame?.roomId || startedGame?.matchId);
         return;
      }
      console.log('SOCKET GAME_STARTED RECEIVED', {
        matchId: startedGame?.matchId,
        turn: startedGame?.turn,
        players: startedGame?.players,
      });
      setGame((prev) => ({ ...(prev || {}), ...startedGame }));
    };

    const handleMatchFound = (payload) => {
      if (!payload || payload.roomId !== matchIdRef.current) {
         console.warn('Discarding stale MATCH_FOUND for', payload?.roomId);
         return;
      }
      console.log('SOCKET MATCH_FOUND RECEIVED', payload);
      setGame((prev) => prev ? { ...prev, players: payload.players, roomId: payload.roomId } : { players: payload.players, roomId: payload.roomId });
    };

    const handlePlayerJoined = (payload) => {
      if (!payload || payload.roomId !== matchIdRef.current) {
         console.warn('Discarding stale PLAYER_JOINED for', payload?.roomId);
         return;
      }
      console.log('SOCKET PLAYER_JOINED RECEIVED', payload);
      if (payload.players) {
        setGame((prev) => prev ? { ...prev, players: payload.players } : { players: payload.players });
      }
    };

    const handleConnectError = (err) => {
      console.error('Socket.IO connection error:', err);
      setError('Socket.IO connection error');
    };

    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('GAME_UPDATE', handleGameUpdate);
    socket.on('GAME_STARTED', handleGameStarted);
    socket.on('MATCH_FOUND', handleMatchFound);
    socket.on('PLAYER_JOINED', handlePlayerJoined);
    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);

    // Cleanup when the component unmounts. Remove listeners but keep singleton socket alive.
    return () => {
      console.log('🛑 Cleanup useGameSocket hook – removing listeners, keeping singleton socket alive');
      try {
        socket.off('connect', handleConnect);
        socket.off('GAME_UPDATE', handleGameUpdate);
        socket.off('GAME_STARTED', handleGameStarted);
        socket.off('MATCH_FOUND', handleMatchFound);
        socket.off('PLAYER_JOINED', handlePlayerJoined);
        socket.off('connect_error', handleConnectError);
        socket.off('disconnect', handleDisconnect);
        // Clear socketRef so listeners can reattach if component remounts
        socketRef.current = null;
      } catch (err) {
        /* ignore cleanup errors */
      }
    };
  }, [token]); // re-run when token becomes available/changes

  // ------------------------------------------------------------
  // 3️⃣ Polling fallback: if server-side matchmaking assigned an opponent
  // but this client didn't receive the socket events, fetch authoritative
  // game state every 1.5s until players are populated.
  // ------------------------------------------------------------
  useEffect(() => {
    let pollId = null;
    const hasRed = !!(game && game.players && game.players.red);
    const hasYellow = !!(game && game.players && game.players.yellow);
    const bothPlayersReady = hasRed && hasYellow;
    const shouldPoll = game && game.matchId && game.players && !bothPlayersReady;
    if (shouldPoll) {
      const fetchOnce = async () => {
        try {
          const res = await fetch(`${API_URL}/api/game/ludo/${game.matchId}`);
            if (res.ok) {
            const full = await res.json();
            if (full && full.players && (full.players.yellow || full.players.red)) {
              if (full.matchId !== matchIdRef.current) return;
              console.log('POLL: fetched authoritative game state', full.matchId);
              setGame(prev => ({ ...(prev || {}), ...(full || {}) }));
            }
          }
        } catch (err) {
          // ignore transient errors
        }
      };

      // initial immediate fetch and then interval
      fetchOnce();
      pollId = setInterval(fetchOnce, 1500);
    }

    return () => {
      if (pollId) clearInterval(pollId);
    };
  }, [game?.matchId, game?.players?.red, game?.players?.yellow]);

  // ------------------------------------------------------------
  // 2️⃣ Whenever matchId changes (or becomes available) tell the server to join.
  // ------------------------------------------------------------
  useEffect(() => {
    setGame(null); // Reset game state for the new match ID
    
    if (!matchId) return;
    const socket = socketRef.current;
    if (socket && socket.connected) {
      console.log('Emitting JOIN_GAME for changed matchId', matchId, 'via socket', socket.id);
      try {
        socket.emit('JOIN_GAME', { matchId }, (ack) => console.log('JOIN_GAME_ACK', { matchId, socketId: socket.id, ack }));
      } catch (err) {
        console.warn('JOIN_GAME emit failed', err);
      }
    }
    
    return () => {
      if (socket && socket.connected) {
        console.log('Emitting LEAVE_GAME for old matchId', matchId, 'via socket', socket.id);
        socket.emit('LEAVE_GAME', { matchId });
      }
    };
  }, [matchId]);

  // ------------------------------------------------------------
  // 2.b️⃣ If we have a matchId but the hook's `game` is empty or missing opponent,
  // fetch authoritative game state once from the API. This covers cases where
  // the socket join or broadcasts were missed.
  // ------------------------------------------------------------
  useEffect(() => {
    if (!matchId) return;
    // If we already have a complete game state, nothing to do
    const hasOpponent = game && game.players && (game.players.red && game.players.yellow);
    if (hasOpponent) return;

    let cancelled = false;
    const tryFetch = async () => {
      try {
        console.log('useGameSocket: fetching authoritative game state for', matchId);
        const res = await fetch(`${API_URL}/api/game/ludo/${matchId}`);
        if (!res.ok) return;
        const full = await res.json();
        if (!cancelled && full) {
          if (full.matchId !== matchIdRef.current) return;
          console.log('useGameSocket: fetched full game', full.matchId);
          setGame(prev => ({ ...(prev || {}), ...(full || {}) }));
        }
      } catch (err) {
        console.warn('useGameSocket: failed fetching authoritative game state', err);
      }
    };

    // Wait a short time to allow socket join path to deliver first
    const t = setTimeout(tryFetch, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [matchId]);

  // ------------------------------------------------------------
  // Helper actions – roll, move, timeout, leave
  // ------------------------------------------------------------
  const roll = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ROLL', { matchId });
    }
  }, [matchId]);

  const move = useCallback((tokenId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('MOVE', { matchId, tokenId });
    }
  }, [matchId]);

  const timeout = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('TIMEOUT', { matchId });
    }
  }, [matchId]);

  const leave = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('LEAVE_GAME', { matchId });
    }
  }, [matchId]);

  return {
    game,
    isConnected,
    error,
    roll,
    move,
    timeout,
    leave,
  };
}
