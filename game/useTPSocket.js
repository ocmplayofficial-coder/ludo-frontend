import { useState, useEffect, useRef, useCallback } from 'react';
import { getTPSocket } from './tpSocketInstance.js';

export default function useTPSocket(matchId) {
  const [game, setGame] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [emojiReaction, setEmojiReaction] = useState(null);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const matchIdRef = useRef(matchId);

  useEffect(() => {
    matchIdRef.current = matchId;
  }, [matchId]);

  useEffect(() => {
    console.log('Connecting to Socket.IO namespace /teenpatti');
    const socket = getTPSocket();

    if (!socket) {
      console.warn("⚠️ Teen Patti Socket not ready yet");
      return;
    }

    if (socketRef.current === socket) {
      setIsConnected(socket.connected);
      return;
    }
    socketRef.current = socket;

    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
      console.log('✅ Teen Patti Socket connected (id =', socket.id, ')');
    };

    const handleGameUpdate = (updatedGame) => {
      if (!updatedGame || updatedGame.matchId !== matchIdRef.current) return;
      setGame(prev => ({ ...(prev || {}), ...(updatedGame || {}) }));
    };

    const handleMatchFound = (payload) => {
      if (!payload || payload.roomId !== matchIdRef.current) return;
      setGame((prev) => ({ ...(prev || {}), players: payload.players }));
    };

    const handleGameStart = (payload) => {
      if (!payload || payload.roomId !== matchIdRef.current) return;
      setGame((prev) => ({ ...(prev || {}), turn: payload.turn, status: 'PLAYING' }));
    };

    const handleChatMessage = (payload) => {
      setMessages((prev) => [...prev, payload]);
    };

    const handleEmojiReaction = (payload) => {
      setEmojiReaction(payload);
    };

    const handleConnectError = (err) => {
      console.error('Teen Patti Socket.IO connection error:', err);
      setError('Socket.IO connection error');
    };

    const handleDisconnect = () => setIsConnected(false);

    const handleServerError = (payload) => {
      console.error('Teen Patti Server Error:', payload);
      setError(payload.message || 'Server error');
      if (window.showAlert) {
        window.showAlert(payload.message || 'Server error', 'error');
      }
    };

    socket.on('connect', handleConnect);
    socket.on('GAME_UPDATE', handleGameUpdate);
    socket.on('MATCH_FOUND', handleMatchFound);
    socket.on('GAME_START', handleGameStart);
    socket.on('CHAT_MESSAGE', handleChatMessage);
    socket.on('EMOJI_REACTION', handleEmojiReaction);
    socket.on('ERROR', handleServerError);
    socket.on('connect_error', handleConnectError);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('GAME_UPDATE', handleGameUpdate);
      socket.off('MATCH_FOUND', handleMatchFound);
      socket.off('GAME_START', handleGameStart);
      socket.off('CHAT_MESSAGE', handleChatMessage);
      socket.off('EMOJI_REACTION', handleEmojiReaction);
      socket.off('ERROR', handleServerError);
      socket.off('connect_error', handleConnectError);
      socket.off('disconnect', handleDisconnect);
      socketRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    setGame(null);
    setMessages([]);
    setEmojiReaction(null);

    if (!matchId) return;
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('JOIN_GAME', { matchId });
    }
  }, [matchId]);

  const seeCards = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('SEE_CARDS', { matchId });
    }
  }, [matchId]);

  const placeBet = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('PLACE_BET', { matchId });
    }
  }, [matchId]);

  const pack = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('PACK', { matchId });
    }
  }, [matchId]);

  const show = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('SHOW', { matchId });
    }
  }, [matchId]);

  const chat = useCallback((message) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('CHAT_MESSAGE', { matchId, message });
    }
  }, [matchId]);

  const emoji = useCallback((emojiValue) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('EMOJI_REACTION', { matchId, emoji: emojiValue });
    }
  }, [matchId]);

  return {
    game,
    isConnected,
    messages,
    emojiReaction,
    error,
    seeCards,
    placeBet,
    pack,
    show,
    chat,
    emoji
  };
}
