import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, MessageCircle, Smile, Gift, Crown, Flame, Eye, EyeOff } from 'lucide-react';
import type { TeenPattiGame, Card, User } from '../../src/types';

interface TeenPattiProps {
  activeTP: TeenPattiGame | null;
  isProcessing: boolean;
  setGameRoute: (val: any) => void;
  setActiveTP: (val: TeenPattiGame | null) => void;
  triggerTPAction_Fold: () => void;
  triggerTPAction_Seen: () => void;
  triggerTPAction_Chaal: () => void;
  triggerTPAction_Show: () => void;
  syncServerProfile: () => void;
  syncTransactions: () => void;
  tpSocket: any;
  userProfile: User | null;
}

// ---- Card Graphic ----
function CardGraphic({ card, faceDown, index }: { card: Card; faceDown: boolean; index: number }) {
  const suitSymbols: Record<string, string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

  if (faceDown) {
    return (
      <div
        className="relative flex-shrink-0"
        style={{
          width: 52,
          height: 76,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #4f0607 0%, #120000 100%)',
          border: '1.5px solid rgba(255,215,0,0.25)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `rotate(${(index - 1) * 6}deg)`,
          transition: 'transform 0.2s',
        }}
      >
        <div style={{
          position: 'absolute', inset: 4,
          border: '1px dashed rgba(255,215,0,0.12)',
          borderRadius: 7,
        }} />
        <Flame style={{ width: 18, height: 18, color: 'rgba(245,158,11,0.3)' }} />
      </div>
    );
  }

  return (
    <div
      className="relative flex-shrink-0"
      style={{
        width: 52,
        height: 76,
        borderRadius: 10,
        background: '#fff',
        border: '1.5px solid #e5e7eb',
        boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '5px 5px 5px 5px',
        transform: `rotate(${(index - 1) * 5}deg) translateY(${index === 1 ? -2 : index === 3 ? -2 : 0}px)`,
        transition: 'transform 0.2s',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: isRed ? '#dc2626' : '#111827', lineHeight: 1 }}>{card.value}</span>
        <span style={{ fontSize: 12, color: isRed ? '#dc2626' : '#111827', lineHeight: 1 }}>{suitSymbols[card.suit]}</span>
      </div>
      <span style={{ fontSize: 22, alignSelf: 'center', color: isRed ? '#dc2626' : '#111827', lineHeight: 1 }}>
        {suitSymbols[card.suit]}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.1, transform: 'rotate(180deg)' }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: isRed ? '#dc2626' : '#111827', lineHeight: 1 }}>{card.value}</span>
        <span style={{ fontSize: 12, color: isRed ? '#dc2626' : '#111827', lineHeight: 1 }}>{suitSymbols[card.suit]}</span>
      </div>
    </div>
  );
}

// ---- Player Avatar ----
function PlayerAvatar({ isMe, isActive, timer }: { isMe: boolean; isActive: boolean; timer?: number }) {
  return (
    <div style={{ position: 'relative', width: 60, height: 60 }}>
      {isActive && (
        <div style={{
          position: 'absolute', inset: -4,
          borderRadius: '50%',
          border: `3px solid ${isMe ? '#10b981' : '#f59e0b'}`,
          boxShadow: `0 0 18px ${isMe ? 'rgba(16,185,129,0.7)' : 'rgba(245,158,11,0.7)'}`,
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      )}
      <div style={{
        width: 60, height: 60, borderRadius: '50%',
        overflow: 'hidden',
        border: `2px solid ${isMe ? 'rgba(16,185,129,0.5)' : 'rgba(255,215,0,0.3)'}`,
        background: isMe ? '#1e1b4b' : '#2d2d30',
        position: 'relative',
      }}>
        {isMe ? (
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            <rect width="100" height="100" fill="#1e1b4b" />
            <path d="M50 32 C41 32, 38 45, 38 52 C38 57, 41 68, 50 68 C59 68, 62 57, 62 52 C62 45, 59 32, 50 32 Z" fill="#fed7aa" />
            <path d="M50 18 C30 18, 28 36, 32 44 C34 38, 40 32, 50 32 C60 32, 66 38, 68 44 C72 36, 70 18, 50 18 Z" fill="#1e1105" />
            <circle cx="46" cy="48" r="2.5" fill="black" />
            <circle cx="54" cy="48" r="2.5" fill="black" />
            <path d="M46 57 C48 59, 52 59, 54 57 Z" fill="#f43f5e" stroke="#f43f5e" strokeWidth="1" />
            <path d="M25 88 C32 80, 42 74, 50 74 C58 74, 68 80, 75 88 L65 100 H35 Z" fill="#ec4899" />
          </svg>
        ) : (
          <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
            <rect width="100" height="100" fill="#2d2d30" />
            <path d="M50 30 C38 30, 36 45, 36 50 C36 55, 38 68, 50 68 C62 68, 64 55, 64 50 C64 45, 62 30, 50 30 Z" fill="#ffd0a1" />
            <path d="M50 24 C34 24, 32 38, 34 46 C36 46, 38 34, 50 34 C62 34, 64 46, 66 46 C68 38, 66 24, 50 24 Z" fill="#3f2305" />
            <circle cx="45" cy="48" r="2.5" fill="black" />
            <circle cx="55" cy="48" r="2.5" fill="black" />
            <path d="M25 88 C32 80, 42 74, 50 74 C58 74, 68 80, 75 88 L65 100 H35 Z" fill="#2563eb" />
          </svg>
        )}
        {isActive && timer !== undefined && timer > 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'monospace', fontWeight: 900,
            color: timer <= 5 ? '#f87171' : '#ffd700',
            fontSize: 18,
          }}>
            {timer}
          </div>
        )}
      </div>
      <span style={{
        position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
        background: isMe ? '#10b981' : '#f59e0b',
        color: '#000',
        fontSize: 7, fontWeight: 900,
        padding: '1px 6px',
        borderRadius: 20,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>
        {isMe ? 'YOU' : 'OPP'}
      </span>
    </div>
  );
}

export default function TeenPatti({
  activeTP,
  isProcessing,
  setGameRoute,
  setActiveTP,
  triggerTPAction_Fold,
  triggerTPAction_Seen,
  triggerTPAction_Chaal,
  triggerTPAction_Show,
  syncServerProfile,
  syncTransactions,
  tpSocket,
  userProfile
}: TeenPattiProps) {

  // Always use freshest game data: merge activeTP with tpSocket.game
  const game: TeenPattiGame | null = useMemo(() => {
    if (!activeTP) return null;
    if (!tpSocket?.game) return activeTP;
    return { ...(activeTP as any), ...(tpSocket.game as any) };
  }, [activeTP, tpSocket?.game]);

  const [chatOpen, setChatOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [myChat, setMyChat] = useState<string | null>(null);
  const [oppChat, setOppChat] = useState<string | null>(null);
  const [myEmoji, setMyEmoji] = useState<string | null>(null);
  const [oppEmoji, setOppEmoji] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const lastActionRef = useRef(0);

  // Compute derived values safely (for use in hooks below)
  const myUserId = userProfile?._id ? userProfile._id.toString() : '';
  const isA = game?.players?.A?.userId === myUserId;
  const me = game ? (isA ? game.players?.A : game.players?.B) : null;
  const opponent = game ? (isA ? game.players?.B : game.players?.A) : null;

  // All hooks MUST be before any conditional return (React rules)
  useEffect(() => {
    if (!tpSocket?.messages?.length) return;
    const lastMsg = tpSocket.messages[tpSocket.messages.length - 1];
    if (!lastMsg) return;
    if (lastMsg.userId === myUserId) {
      setMyChat(lastMsg.text);
      const t = setTimeout(() => setMyChat(null), 3500);
      return () => clearTimeout(t);
    } else {
      setOppChat(lastMsg.text);
      const t = setTimeout(() => setOppChat(null), 3500);
      return () => clearTimeout(t);
    }
  }, [tpSocket?.messages]);

  useEffect(() => {
    if (!tpSocket?.emojiReaction) return;
    const { userId, emoji } = tpSocket.emojiReaction;
    if (userId === myUserId) {
      setMyEmoji(emoji);
      const t = setTimeout(() => setMyEmoji(null), 3000);
      return () => clearTimeout(t);
    } else {
      setOppEmoji(emoji);
      const t = setTimeout(() => setOppEmoji(null), 3000);
      return () => clearTimeout(t);
    }
  }, [tpSocket?.emojiReaction]);

  // Debounced action handler
  const doAction = (fn: () => void) => {
    const now = Date.now();
    if (now - lastActionRef.current < 800) return;
    lastActionRef.current = now;
    setActionLoading(true);
    fn();
    setTimeout(() => setActionLoading(false), 1000);
  };

  // Early returns AFTER all hooks
  if (!game) return null;

  // Waiting screen — show only if no opponent yet
  if (!me || !opponent) {
    return (
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at center, #220002 0%, #090000 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 16, padding: 24, zIndex: 45,
        color: '#f1f5f9',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          border: '4px solid #f59e0b', borderTopColor: 'transparent',
          animation: 'spin 0.9s linear infinite',
        }} />
        <span style={{ fontSize: 10, color: '#f59e0b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
          Finding Opponent
        </span>
        <h2 style={{ fontSize: 16, fontWeight: 900, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>
          Waiting for Match...
        </h2>
        <p style={{ fontSize: 9, color: '#52525b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
          Secure multiplayer session establishing
        </p>
      </div>
    );
  }

  const myTurn = game.turn === myUserId;
  const oppTurn = game.turn === opponent.userId;
  const isMySeen = me.seen;
  const isGameActive = game.status === 'PLAYING' || game.status === 'PLAYING_PENDING';
  const chaalAmount = isMySeen ? (game.currentBet * 2) : game.currentBet;

  const chatTemplates = [
    "Aapka hand kya hai? 😉",
    "Chal beta chaal! 🎲",
    "Pack kar do, safe khelo! 🏳️",
    "Bhai, blind kyu khel rhe ho? 😂",
    "High stakes match only! 🔥",
    "Good game bro!",
  ];

  const emojiTemplates = ["😂", "😎", "😜", "🔥", "👑", "👍", "👎", "😭"];

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: '#070102',
      color: '#f1f5f9',
      display: 'flex', flexDirection: 'column',
      zIndex: 40, overflowY: 'auto', overflowX: 'hidden',
      userSelect: 'none',
      fontFamily: "'Inter', sans-serif",
    }}>

      {/* ===== HEADER ===== */}
      <div style={{
        padding: '10px 14px',
        background: '#0a0000',
        borderBottom: '1px solid rgba(255,215,0,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, zIndex: 30,
      }}>
        <button
          onClick={() => {
            if (confirm('Leaving folds your hand and surrenders active pot. Confirm?')) {
              setGameRoute('TP_ARENA');
              setActiveTP(null);
              syncServerProfile();
            }
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 10px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
            borderRadius: 8, fontSize: 9, fontWeight: 900,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft style={{ width: 12, height: 12 }} /> LEAVE
        </button>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 8, color: '#71717a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block' }}>
            TEEN PATTI • {game.variant}
          </span>
          <span style={{ fontSize: 14, fontWeight: 900, color: '#ffd700', display: 'block', lineHeight: 1.2 }}>
            ₹{game.entryFee} TABLE
          </span>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px',
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 20,
        }}>
          <span style={{ fontSize: 8, color: '#fcd34d', fontWeight: 900, textTransform: 'uppercase' }}>POT</span>
          <span style={{ fontSize: 13, fontWeight: 900, color: '#ffd700', fontFamily: 'monospace' }}>₹{game.pot}</span>
        </div>
      </div>

      {/* ===== TURN BANNER ===== */}
      {isGameActive && !game.winner && (
        <div style={{
          padding: '7px 14px',
          background: myTurn
            ? 'linear-gradient(90deg, rgba(16,185,129,0.12), rgba(16,185,129,0.05))'
            : 'linear-gradient(90deg, rgba(245,158,11,0.1), rgba(245,158,11,0.04))',
          borderBottom: `1px solid ${myTurn ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.15)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          flexShrink: 0,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: myTurn ? '#10b981' : '#f59e0b',
            animation: 'pulse 1s ease-in-out infinite',
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: 10, fontWeight: 900,
            color: myTurn ? '#34d399' : '#fcd34d',
            textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            {myTurn ? '👉 YOUR TURN — Chaal, Seen or Show' : `⌛ ${opponent.username}'s turn...`}
          </span>
        </div>
      )}

      {/* ===== GAME TABLE AREA ===== */}
      <div style={{
        flex: 1,
        background: 'radial-gradient(ellipse at center, #220002 0%, #0d0000 100%)',
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 16px 8px',
        overflow: 'hidden',
      }}>

        {/* Table felt oval */}
        <div style={{
          position: 'absolute',
          left: '10%', right: '10%',
          top: '12%', bottom: '12%',
          background: 'linear-gradient(170deg, #3d0204 0%, #1a0001 100%)',
          borderRadius: '50%',
          border: '10px solid #4a2a0a',
          boxShadow: '0 15px 50px rgba(0,0,0,0.8), inset 0 10px 30px rgba(0,0,0,0.6)',
          zIndex: 0,
        }}>
          <div style={{
            position: 'absolute', inset: 6,
            border: '2px dashed rgba(255,215,0,0.08)',
            borderRadius: '50%',
          }} />
        </div>

        {/* POT CENTER */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2,
          textAlign: 'center',
          background: 'rgba(0,0,0,0.7)',
          border: '1px solid rgba(255,215,0,0.25)',
          borderRadius: 24,
          padding: '8px 18px',
          backdropFilter: 'blur(4px)',
        }}>
          <span style={{ fontSize: 8, color: 'rgba(245,158,11,0.7)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block' }}>TOTAL POT</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'monospace', lineHeight: 1.1 }}>₹{game.pot}</span>
          <span style={{ fontSize: 8, color: '#52525b', fontWeight: 700, display: 'block', textTransform: 'uppercase' }}>Bet: ₹{game.currentBet}</span>
        </div>

        {/* Joker card for JOKER variant */}
        {game.variant === 'JOKER' && game.jokerValue && (
          <div style={{
            position: 'absolute', top: '50%', right: 24,
            transform: 'translateY(-50%)',
            zIndex: 3,
            background: 'rgba(0,0,0,0.7)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 12, padding: '6px 10px',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: 7, color: '#fcd34d', fontWeight: 900, display: 'block', textTransform: 'uppercase' }}>JOKER</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: '#fff', fontFamily: 'monospace' }}>{game.jokerValue}</span>
          </div>
        )}

        {/* ===== OPPONENT AREA (TOP) ===== */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 5, gap: 8 }}>
          {/* Opponent chat bubble */}
          {oppChat && (
            <div style={{
              background: 'rgba(15,10,10,0.95)', border: '1px solid #27272a',
              color: '#e2e8f0', fontSize: 10, fontWeight: 700,
              padding: '6px 12px', borderRadius: 14,
              maxWidth: 170, textAlign: 'center',
              animation: 'bounce 0.5s ease',
            }}>
              {oppChat}
            </div>
          )}
          {oppEmoji && (
            <div style={{ fontSize: 28, animation: 'ping 0.8s ease', opacity: 0.9 }}>{oppEmoji}</div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PlayerAvatar isMe={false} isActive={oppTurn && !game.winner} timer={oppTurn ? game.turnTimerRemaining : undefined} />

            <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{
                  fontSize: 12, fontWeight: 900,
                  color: oppTurn && !game.winner ? '#fcd34d' : '#d4d4d8',
                }}>
                  {opponent.username}
                </span>
                {oppTurn && !game.winner && (
                  <span style={{
                    fontSize: 7, fontWeight: 900, background: '#f59e0b', color: '#000',
                    padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase',
                    letterSpacing: '0.05em', animation: 'pulse 1s infinite',
                  }}>
                    THINKING
                  </span>
                )}
              </div>
              <span style={{ fontSize: 9, color: '#52525b', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                ₹{(opponent.walletBalance ?? 0).toLocaleString('en-IN')} balance
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                <span style={{
                  fontSize: 7, fontWeight: 900,
                  padding: '2px 7px', borderRadius: 20, border: '1px solid',
                  ...(opponent.folded
                    ? { background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }
                    : opponent.seen
                      ? { background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)', color: '#6ee7b7' }
                      : { background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)', color: '#fcd34d' }
                  ),
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {opponent.folded ? '🏳️ FOLDED' : opponent.seen ? '👀 SEEN' : '🙈 BLIND'}
                </span>
                {opponent.lastBet > 0 && !opponent.folded && (
                  <span style={{
                    fontSize: 7, fontWeight: 900, padding: '2px 7px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#a1a1aa', fontFamily: 'monospace',
                    textTransform: 'uppercase',
                  }}>
                    Bet ₹{opponent.lastBet}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Opponent cards */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 4 }}>
            {opponent.cards && opponent.cards.length > 0
              ? opponent.cards.map((card, i) => (
                <CardGraphic key={i} card={card} faceDown={!game.winner && !opponent.folded} index={i} />
              ))
              : [0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 52, height: 76, borderRadius: 10,
                  background: 'linear-gradient(135deg, #3d0204 0%, #120000 100%)',
                  border: '1.5px solid rgba(255,215,0,0.15)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
                  transform: `rotate(${(i - 1) * 6}deg)`,
                }} />
              ))
            }
          </div>
        </div>

        {/* ===== MY AREA (BOTTOM) ===== */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 5, gap: 8 }}>
          {/* My cards */}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 4 }}>
            {me.cards && me.cards.length > 0
              ? me.cards.map((card, i) => (
                <CardGraphic key={i} card={card} faceDown={!isMySeen && !game.winner && !me.folded} index={i} />
              ))
              : [0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 52, height: 76, borderRadius: 10,
                  background: 'linear-gradient(135deg, #3d0204 0%, #120000 100%)',
                  border: '1.5px solid rgba(255,215,0,0.15)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
                  transform: `rotate(${(i - 1) * 6}deg)`,
                }} />
              ))
            }
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, justifyContent: 'flex-end' }}>
                {myTurn && !game.winner && (
                  <span style={{
                    fontSize: 7, fontWeight: 900, background: '#10b981', color: '#000',
                    padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase',
                    letterSpacing: '0.05em', animation: 'pulse 1s infinite',
                  }}>
                    YOUR TURN
                  </span>
                )}
                <span style={{
                  fontSize: 12, fontWeight: 900,
                  color: myTurn && !game.winner ? '#34d399' : '#d4d4d8',
                }}>
                  {me.username} (You)
                </span>
              </div>
              <span style={{ fontSize: 9, color: '#52525b', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                ₹{(me.walletBalance ?? 0).toLocaleString('en-IN')} balance
              </span>
              <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                <span style={{
                  fontSize: 7, fontWeight: 900,
                  padding: '2px 7px', borderRadius: 20, border: '1px solid',
                  ...(me.folded
                    ? { background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#fca5a5' }
                    : isMySeen
                      ? { background: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)', color: '#6ee7b7' }
                      : { background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.25)', color: '#fcd34d' }
                  ),
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  {me.folded ? '🏳️ FOLDED' : isMySeen ? '👀 SEEN' : '🙈 BLIND'}
                </span>
                {me.lastBet > 0 && !me.folded && (
                  <span style={{
                    fontSize: 7, fontWeight: 900, padding: '2px 7px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#a1a1aa', fontFamily: 'monospace',
                    textTransform: 'uppercase',
                  }}>
                    Bet ₹{me.lastBet}
                  </span>
                )}
              </div>
            </div>

            <PlayerAvatar isMe={true} isActive={myTurn && !game.winner} timer={myTurn ? game.turnTimerRemaining : undefined} />
          </div>

          {/* My chat bubble */}
          {myChat && (
            <div style={{
              background: 'rgba(15,10,10,0.95)', border: '1px solid #27272a',
              color: '#e2e8f0', fontSize: 10, fontWeight: 700,
              padding: '6px 12px', borderRadius: 14,
              maxWidth: 170, textAlign: 'center',
              animation: 'bounce 0.5s ease',
            }}>
              {myChat}
            </div>
          )}
          {myEmoji && (
            <div style={{ fontSize: 28, animation: 'ping 0.8s ease', opacity: 0.9 }}>{myEmoji}</div>
          )}
        </div>
      </div>

      {/* ===== ACTION BUTTONS ===== */}
      {isGameActive && !game.winner && !me.folded && (
        <div style={{
          padding: '10px 12px 8px',
          background: '#0a0000',
          borderTop: '1px solid rgba(255,215,0,0.08)',
          flexShrink: 0,
        }}>

          {/* See Cards button — only visible when blind */}
          {!isMySeen && !me.folded && (
            <button
              onClick={() => doAction(triggerTPAction_Seen)}
              style={{
                width: '100%', marginBottom: 8,
                padding: '9px',
                background: 'linear-gradient(90deg, #059669, #10b981)',
                border: 'none',
                color: '#000', fontWeight: 900, fontSize: 11,
                borderRadius: 12, textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              }}
            >
              <Eye style={{ width: 14, height: 14 }} />
              👀 SEE MY CARDS (Seen = 2× bet)
            </button>
          )}

          {/* Main action row: PACK | CHAAL | SHOW */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', gap: 8 }}>
            {/* PACK */}
            <button
              onClick={() => doAction(triggerTPAction_Fold)}
              disabled={!myTurn || actionLoading}
              id="btn-fold"
              style={{
                padding: '13px 0',
                background: myTurn ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.04)',
                border: `1.5px solid ${myTurn ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.12)'}`,
                color: myTurn ? '#fca5a5' : 'rgba(252,165,165,0.3)',
                fontWeight: 900, fontSize: 11,
                borderRadius: 14, textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: myTurn ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
            >
              🏳️ PACK
            </button>

            {/* CHAAL — highlighted and centered */}
            <button
              onClick={() => doAction(triggerTPAction_Chaal)}
              disabled={!myTurn || actionLoading}
              id="btn-chaal"
              style={{
                padding: '13px 0',
                background: myTurn
                  ? 'linear-gradient(135deg, #d97706, #f59e0b)'
                  : 'rgba(245,158,11,0.08)',
                border: `1.5px solid ${myTurn ? 'transparent' : 'rgba(245,158,11,0.15)'}`,
                color: myTurn ? '#000' : 'rgba(245,158,11,0.3)',
                fontWeight: 900, fontSize: 12,
                borderRadius: 14, textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: myTurn ? 'pointer' : 'not-allowed',
                boxShadow: myTurn ? '0 4px 18px rgba(245,158,11,0.35)' : 'none',
                transition: 'all 0.15s',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 1,
              }}
            >
              <span>🎲 CHAAL</span>
              <span style={{ fontSize: 10, fontWeight: 900, opacity: 0.85 }}>₹{chaalAmount}</span>
            </button>

            {/* SHOW */}
            <button
              onClick={() => doAction(triggerTPAction_Show)}
              disabled={!myTurn || !isMySeen || actionLoading}
              id="btn-show"
              style={{
                padding: '13px 0',
                background: (myTurn && isMySeen) ? 'linear-gradient(135deg, #059669, #10b981)' : 'rgba(16,185,129,0.05)',
                border: `1.5px solid ${(myTurn && isMySeen) ? 'transparent' : 'rgba(16,185,129,0.12)'}`,
                color: (myTurn && isMySeen) ? '#000' : 'rgba(16,185,129,0.25)',
                fontWeight: 900, fontSize: 11,
                borderRadius: 14, textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: (myTurn && isMySeen) ? 'pointer' : 'not-allowed',
                boxShadow: (myTurn && isMySeen) ? '0 4px 14px rgba(16,185,129,0.3)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {isMySeen ? '🏁 SHOW' : <><EyeOff style={{ width: 12, height: 12, display: 'inline' }} /> SHOW</>}
            </button>
          </div>

          {/* Disabled state explanation */}
          {!myTurn && !game.winner && (
            <p style={{
              textAlign: 'center', fontSize: 8, color: '#52525b',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
              marginTop: 6,
            }}>
              Buttons active only on YOUR turn
            </p>
          )}
          {!isMySeen && myTurn && (
            <p style={{
              textAlign: 'center', fontSize: 8, color: 'rgba(245,158,11,0.5)',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
              marginTop: 6,
            }}>
              SHOW requires seeing cards first
            </p>
          )}
        </div>
      )}

      {/* ===== SOCIAL BAR ===== */}
      {isGameActive && !game.winner && (
        <div style={{
          padding: '6px 14px 6px',
          background: '#070102',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex', justifyContent: 'center', gap: 20,
          flexShrink: 0,
        }}>
          {[
            { icon: <MessageCircle style={{ width: 13, height: 13 }} />, label: 'CHAT', open: chatOpen, toggle: () => { setChatOpen(p => !p); setEmojiOpen(false); setGiftOpen(false); } },
            { icon: <Smile style={{ width: 13, height: 13 }} />, label: 'EMOJI', open: emojiOpen, toggle: () => { setEmojiOpen(p => !p); setChatOpen(false); setGiftOpen(false); } },
            { icon: <Gift style={{ width: 13, height: 13 }} />, label: 'GIFT', open: giftOpen, toggle: () => { setGiftOpen(p => !p); setChatOpen(false); setEmojiOpen(false); } },
          ].map(({ icon, label, open, toggle }, i) => (
            <button
              key={i}
              onClick={toggle}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                color: open ? '#fcd34d' : '#52525b',
                fontSize: 8, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                background: 'none', border: 'none', cursor: 'pointer',
                transition: 'color 0.15s',
              }}
            >
              {icon} {label}
            </button>
          ))}
        </div>
      )}

      {/* Chat dropdown */}
      {chatOpen && (
        <div style={{
          background: '#0d0000', border: '1px solid #1c1c1e',
          padding: '10px 12px', flexShrink: 0,
        }}>
          <span style={{ fontSize: 8, color: '#52525b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>Quick Chats</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {chatTemplates.map((tpl, i) => (
              <button
                key={i}
                onClick={() => { tpSocket.chat(tpl); setChatOpen(false); }}
                style={{
                  padding: '7px 8px', background: '#141414', border: '1px solid #222',
                  borderRadius: 8, fontSize: 9, fontWeight: 700, color: '#d4d4d8',
                  textAlign: 'left', cursor: 'pointer',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}
              >
                💬 {tpl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Emoji dropdown */}
      {emojiOpen && (
        <div style={{
          background: '#0d0000', border: '1px solid #1c1c1e',
          padding: '10px 12px', flexShrink: 0,
        }}>
          <span style={{ fontSize: 8, color: '#52525b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>Reactions</span>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {emojiTemplates.map((emo, i) => (
              <button
                key={i}
                onClick={() => { tpSocket.emoji(emo); setEmojiOpen(false); }}
                style={{
                  fontSize: 22, padding: 6, background: '#141414', border: '1px solid #222',
                  borderRadius: 10, cursor: 'pointer',
                  transition: 'transform 0.1s',
                }}
              >
                {emo}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gift dropdown */}
      {giftOpen && (
        <div style={{
          background: '#0d0000', border: '1px solid #1c1c1e',
          padding: '10px 12px', flexShrink: 0, textAlign: 'center',
        }}>
          <span style={{ fontSize: 8, color: '#52525b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>Send a Gift</span>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            {[['🍷', 'Wine'], ['🌹', 'Rose'], ['👑', 'Crown']].map(([emoji, name]) => (
              <button
                key={name}
                onClick={() => { tpSocket.chat(`Sent you a ${emoji} ${name}!`); setGiftOpen(false); }}
                style={{
                  padding: '8px 12px', background: '#141414', border: '1px solid rgba(255,215,0,0.1)',
                  borderRadius: 12, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                }}
              >
                <span style={{ fontSize: 22 }}>{emoji}</span>
                <span style={{ fontSize: 8, fontWeight: 700, color: '#71717a' }}>{name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Game Logs */}
      <div style={{
        padding: '8px 12px',
        background: '#070102',
        borderTop: '1px solid rgba(255,255,255,0.03)',
        flexShrink: 0, maxHeight: 70, overflowY: 'auto',
      }}>
        {(game.logs || []).slice(0, 4).map((log, idx) => (
          <p key={idx} style={{
            fontSize: 9, fontFamily: 'monospace', margin: '1px 0', lineHeight: 1.5,
            color: idx === 0 ? '#fcd34d' : '#3f3f46',
          }}>
            🃏 {log}
          </p>
        ))}
      </div>

      {/* ===== WINNER OVERLAY ===== */}
      {game.winner && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(7,1,2,0.96)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 24, zIndex: 50, textAlign: 'center',
          animation: 'fadeIn 0.4s ease',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at center, rgba(251,191,36,0.12) 0, transparent 60%)',
            pointerEvents: 'none',
          }} />

          <div style={{ animation: 'bounce 0.8s ease', marginBottom: 12 }}>
            <Crown style={{ width: 48, height: 48, color: '#ffd700', filter: 'drop-shadow(0 0 12px rgba(251,191,36,0.6))' }} />
          </div>

          {/* Winner/Loser message */}
          {(() => {
            const winnerSeat = game.winner === 'A' ? game.players.A : game.players.B;
            const iWon = winnerSeat.userId === myUserId;
            return (
              <>
                <span style={{ fontSize: 10, color: '#fcd34d', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                  {iWon ? '🎉 YOU WIN!' : '😔 YOU LOSE'}
                </span>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '6px 0 4px', lineHeight: 1 }}>
                  {winnerSeat.username}
                </h2>
                <span style={{ fontSize: 11, color: '#6ee7b7', fontWeight: 700 }}>Won ₹{game.pot}</span>
              </>
            );
          })()}

          {/* Revealed hands */}
          <div style={{
            margin: '18px 0',
            padding: 16,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 20,
            width: '100%', maxWidth: 310,
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {(['A', 'B'] as const).map(seat => (
                <div key={seat} style={{ textAlign: 'center' }}>
                  <span style={{
                    fontSize: 8, color: game.winner === seat ? '#fcd34d' : '#52525b',
                    fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: 6,
                  }}>
                    {game.players[seat].username} {game.winner === seat ? '👑' : ''}
                  </span>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    {game.players[seat].cards.map((c, i) => (
                      <CardGraphic key={i} card={c} faceDown={false} index={i} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 310 }}>
            <button
              onClick={() => {
                setGameRoute('TP_ARENA');
                setActiveTP(null);
                syncServerProfile();
                syncTransactions();
              }}
              style={{
                flex: 1, padding: '13px 0',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#a1a1aa', fontWeight: 900, fontSize: 11,
                borderRadius: 14, textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              Lobby
            </button>
            <button
              onClick={() => {
                setGameRoute('TP_ARENA');
                setActiveTP(null);
                syncServerProfile();
                syncTransactions();
              }}
              style={{
                flex: 1, padding: '13px 0',
                background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                border: 'none',
                color: '#000', fontWeight: 900, fontSize: 11,
                borderRadius: 14, textTransform: 'uppercase', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
              }}
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
