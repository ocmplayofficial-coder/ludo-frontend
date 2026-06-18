import React, { useState, useEffect } from 'react';
import { initializeAudio } from '../audio/AudioManager';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  User,
  Transaction,
  LudoGame,
  TeenPattiGame
} from './types.js';
import useGameSocket from '../game/useGameSocket.js';
import axiosInstance from './axiosConfig';
import { API_URL } from './config';
import {
  Trophy,
  Coins,
  ArrowLeft,
  Settings,
  User as UserIcon,
  Wallet as WalletIcon,
  CheckCircle,
  X,
  AlertTriangle,
  ChevronLeft
} from 'lucide-react';

// Modular Pages Imports
import Login from '../pages/Login/Login.tsx';
import Home from '../pages/Home/Home.tsx';
import Wallet from '../pages/Wallet/Wallet.tsx';
import Profile from '../pages/Profile/Profile.tsx';
import Support from '../pages/Support/Support.tsx';
import Ludo from '../pages/Ludo/Ludo.tsx';
import TeenPatti from '../pages/TeenPatti/TeenPatti.tsx';
import AddCashPage from '../pages/AddCashPage.tsx';
import DepositPaymentPage from '../pages/DepositPaymentPage.tsx';
import AdminDashboardPage from '../pages/AdminDashboardPage.tsx';

const formatLudoTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = sessionStorage.getItem("token");
  const headers = {
    ...options.headers,
    ...(token ? { "Authorization": `Bearer ${token}` } : {})
  };
  const fullUrl = url.startsWith('/api') ? `${API_URL}${url}` : url;
  return fetch(fullUrl, { ...options, headers });
};

export default function App() {
  const navigate = useNavigate();

  // Wallet State
  const [walletData, setWalletData] = useState<{
    walletBalance: number;
    depositCash: number;
    winningCash: number;
    withdrawableBalance: number;
  } | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const syncWallet = async () => {
    setWalletLoading(true);
    setWalletError(null);
    try {
      const res = await authFetch("/api/wallet");
      if (res.ok) {
        const data = await res.json();
        setWalletData(data);
        setUserProfile(prev => prev ? {
          ...prev,
          walletBalance: data.walletBalance,
          depositBalance: data.depositCash,
          winningsBalance: data.winningCash
        } : null);
      } else {
        setWalletError("Failed to fetch wallet balance from API");
      }
    } catch (e) {
      setWalletError("Wallet API unreachable");
    } finally {
      setWalletLoading(false);
    }
  };

  // ====== GLOBAL STATE APP STATES ======
  const [authState, setAuthState] = useState<'SPLASH' | 'LOGIN_PHONE' | 'LOGIN_OTP' | 'MAIN'>('SPLASH');
  const [currentTab, setCurrentTab] = useState<'LOBBY' | 'WALLET' | 'PROFILE' | 'CHAT'>('LOBBY');

  // Simulated Inputs
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [referralInput, setReferralInput] = useState("");
  const [otpTimer, setOtpTimer] = useState(30);

  // Core Data models from Express
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTxnQuery, setSearchTxnQuery] = useState("");
  const [selectedTxnType, setSelectedTxnType] = useState("ALL");

  // Game UI/Flow routers
  const [gameRoute, setGameRoute] = useState<'LOBBY_CAROUSEL' | 'LUDO_ARENA' | 'LUDO_MATCH' | 'LUDO_MATCHMAKING' | 'L_PLAYING' | 'TP_ARENA' | 'TP_PLAYING'>('LOBBY_CAROUSEL');
  const [selectedLudoVariant, setSelectedLudoVariant] = useState<'CLASSIC' | 'TIME' | 'TURN'>('CLASSIC');
  const [selectedTPVariant, setSelectedTPVariant] = useState<'CLASSIC' | 'MUFLIS' | 'AK47'>('CLASSIC');

  // Match objects synced with server
  const [activeLudo, setActiveLudo] = useState<LudoGame | null>(null);
  const [activeTP, setActiveTP] = useState<TeenPattiGame | null>(null);
  const [matchmakingProgress, setMatchmakingProgress] = useState(0);

  // WebSocket Integration Hook
  const socket = useGameSocket(activeLudo?.matchId);

  // Initialize Web Audio API on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      initializeAudio();
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  useEffect(() => {
    if (socket.game) {
      setActiveLudo(prev => ({ ...(prev || {}), ...(socket.game || {}) }));
    }
  }, [socket.game]);
  useEffect(() => {
    if (!activeLudo || activeLudo.status !== 'PLAYING') {
      prevRedLivesRef.current = 3;
      prevYellowLivesRef.current = 3;
      return;
    }

    const currentRed = activeLudo.redLives ?? 3;
    const currentYellow = activeLudo.yellowLives ?? 3;

    const myUserId = userProfile?._id ? (userProfile._id.toString ? userProfile._id.toString() : userProfile._id) : (userProfile?.id ? userProfile.id.toString() : null);
    const redId = activeLudo?.players?.red?.userId ? (activeLudo.players.red.userId.toString ? activeLudo.players.red.userId.toString() : activeLudo.players.red.userId) : null;
    const yellowId = activeLudo?.players?.yellow?.userId ? (activeLudo.players.yellow.userId.toString ? activeLudo.players.yellow.userId.toString() : activeLudo.players.yellow.userId) : null;
    const myColor = myUserId === redId ? 'red' : myUserId === yellowId ? 'yellow' : null;

    if (currentRed < prevRedLivesRef.current) {
      if (myColor === 'red') {
        showAlert("⚠ Missed Turn", "error");
      } else {
        showAlert("⚠ Opponent Missed Turn", "error");
      }
    }

    if (currentYellow < prevYellowLivesRef.current) {
      if (myColor === 'yellow') {
        showAlert("⚠ Missed Turn", "error");
      } else {
        showAlert("⚠ Opponent Missed Turn", "error");
      }
    }

    prevRedLivesRef.current = currentRed;
    prevYellowLivesRef.current = currentYellow;
  }, [activeLudo, userProfile]);


  // Alerts and UI logs (moved up to avoid TDZ in effects below)
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRollingDice, setIsRollingDice] = useState(false);
  const [canRoll, setCanRoll] = useState(false);

  // Recompute canRoll and reset transient flags whenever activeLudo changes
  useEffect(() => {
    if (!activeLudo) {
      setCanRoll(false);
      return;
    }
    const myUserId = userProfile?._id ? (userProfile._id.toString ? userProfile._id.toString() : userProfile._id) : (userProfile?.id ? userProfile.id.toString() : null);
    const redId = activeLudo?.players?.red?.userId ? (activeLudo.players.red.userId.toString ? activeLudo.players.red.userId.toString() : activeLudo.players.red.userId) : null;
    const yellowId = activeLudo?.players?.yellow?.userId ? (activeLudo.players.yellow.userId.toString ? activeLudo.players.yellow.userId.toString() : activeLudo.players.yellow.userId) : null;
    const myColor = myUserId === redId ? 'red' : myUserId === yellowId ? 'yellow' : null;

    const currentTurn = activeLudo.turn;
    const diceLocked = !!activeLudo.diceHasRolled;

    // Reset transient local flags: when server sends a new GAME_UPDATE, assume rolling stopped
    setIsRollingDice(false);

    // Allow roll only if it's my turn, dice not locked, and not processing
    const allow = !!(myColor && currentTurn === myColor && !diceLocked && !isProcessing && !isRollingDice);
    setCanRoll(allow);

    console.log('LUDO SYNC (on activeLudo):', {
      matchId: activeLudo.matchId,
      currentTurn,
      myColor,
      isMyTurn: myColor === currentTurn,
      canRoll: allow,
      diceLocked,
      isRollingDice
    });
  }, [activeLudo, isProcessing, isRollingDice]);

  useEffect(() => {
    if (activeLudo?.status === 'FINISHED') {
      syncServerProfile();
      syncTransactions();
    }
  }, [activeLudo?.status]);

  // Transaction modals
  const [addCashModalOpen, setAddCashModalOpen] = useState(false);
  const [addCashAmount, setAddCashAmount] = useState("10");
  const [addCashStep, setAddCashStep] = useState<'AMOUNT' | 'METHOD' | 'SCAN'>('AMOUNT');
  const [addCashUPIOption, setAddCashUPIOption] = useState<'GPAY' | 'QR'>('GPAY');
  const [utrNumber, setUtrNumber] = useState("");
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("500");
  const [withdrawUPI, setWithdrawUPI] = useState("");
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [convertAmount, setConvertAmount] = useState("100");

  const [txDrawerOpen, setTxDrawerOpen] = useState(false);

  // Live game controls (Time/Turn Modes and 3 Lives check)
  const [ludoTurnTimeRemaining, setLudoTurnTimeRemaining] = useState(6);
  const [ludoSettingsOpen, setLudoSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(false);

  // Status statistics with real data
  const [liveGamesCount, setLiveGamesCount] = useState<number | null>(null);
  const [onlinePlayersCount, setOnlinePlayersCount] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Matchmaking customized fields
  const [matchmakingEntryFee, setMatchmakingEntryFee] = useState(10);
  const [matchmakingCountdown, setMatchmakingCountdown] = useState(78);
  const [matchmakingPlayersCount, setMatchmakingPlayersCount] = useState(1);
  const [matchmakingOpponentFound, setMatchmakingOpponentFound] = useState(false);
  const [matchIntervalRef, setMatchIntervalRef] = useState<any>(null);
  const prevRedLivesRef = React.useRef(3);
  const prevYellowLivesRef = React.useRef(3);

  // Trigger temporary floating messages
  const showAlert = (text: string, type: 'success' | 'error' = 'success') => {
    setAlertMsg({ type, text });
    setTimeout(() => setAlertMsg(null), 3500);
  };

  // ====== INITIAL BOOT & RE-SYNC ======
  const syncServerProfile = async () => {
    try {
      const res = await authFetch("/api/users/profile");
      if (res.ok) {
        const u = await res.json();
        setUserProfile(prev => ({ ...(prev || {}), ...u }));
      }
    } catch (e) {
      console.error("Failed profiling:", e);
    }
  };

  const syncTransactions = async () => {
    try {
      const res = await authFetch("/api/wallet/transactions");
      if (res.ok) {
        const txs = await res.json();
        setTransactions(txs);
      }
    } catch (e) {
      console.error("Failed transaction loading:", e);
    }
  };

  useEffect(() => {
    if (authState === 'MAIN') {
      syncWallet();
      syncTransactions();
    }
  }, [authState, currentTab]);

  useEffect(() => {
    // Splash screen holding
    setTimeout(() => {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token) {
        authFetch("/api/users/profile").then(res => {
          if (res.ok) return res.json();
          localStorage.removeItem("token");
          sessionStorage.removeItem("token");
          return null;
        }).then(user => {
          if (user) {
            setUserProfile(user);
            setAuthState('MAIN');
            syncWallet();
            syncTransactions();
          } else {
            setAuthState('LOGIN_PHONE');
          }
        }).catch(() => {
          setAuthState('LOGIN_PHONE');
        });
      } else {
        setAuthState('LOGIN_PHONE');
      }
    }, 2850);

    const fetchStats = async () => {
      try {
        const res = await authFetch('/api/admin/dashboard-stats');
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setOnlinePlayersCount(json.data.onlinePlayers);
            setLiveGamesCount(json.data.liveLudo);
          }
          setStatsLoading(false);
        } else {
          console.warn('Failed to fetch admin dashboard stats');
        }
      } catch (e) {
        console.error('Error fetching admin dashboard stats', e);
      }
    };

    // Initial fetch and interval
    const statsInterval = setInterval(fetchStats, 10000);
    // Fetch immediately on mount
    fetchStats();

    return () => clearInterval(statsInterval);
  }, []);

  // OTP counter loop
  useEffect(() => {
    if (authState === 'LOGIN_OTP' && otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer(prev => prev - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [authState, otpTimer]);

  // ====== AUTHENTICATION CONTROLLERS ======
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.startsWith("+91") || phoneNumber.length < 13) {
      showAlert("Please write a valid mobile number starting with +91.", "error");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber })
      });
      // Persist phone number for later verification
      localStorage.setItem("phoneNumber", phoneNumber);
      if (res.ok) {
        setAuthState('LOGIN_OTP');
        setOtpTimer(30);
        showAlert("Dynamic OTP credentials sent to " + phoneNumber);
      }
    } catch (err) {
      showAlert("Server communication error.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 4) {
      showAlert("Please enter exactly 4 digits.", "error");
      return;
    }
    setIsProcessing(true);
    try {
      // Debug payload before sending
      console.log("VERIFY API PAYLOAD", {
        phoneNumber: phoneNumber || localStorage.getItem("phoneNumber") || "",
        otp: otpCode,
        referralCode: referralInput
      });
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: phoneNumber || localStorage.getItem("phoneNumber") || "",
          otp: otpCode,
          referralCode: referralInput
        })
      });
      const data = await res.json();
      console.log("VERIFY RESPONSE", data);
      if (res.ok && data.success) {
        sessionStorage.setItem("token", data.token);
        localStorage.setItem("token", data.token);
        console.log("VERIFY USER", data.user);
        // decode token payload for debug (basic base64 decode)
        try {
          const parts = data.token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            console.log('JWT TOKEN USER', payload);
          }
        } catch (e) {
          console.error('Failed decoding JWT on client', e.message);
        }
        setUserProfile(prev => ({ ...(prev || {}), ...data.user }));
        setAuthState('MAIN');
        await syncTransactions();
        showAlert(`Welcome back, ${data.user.username}!`);
        localStorage.removeItem('phoneNumber');
      } else {
        showAlert(data.error || "Wrong Verification code. Enter any 4 digits.", "error");
      }
    } catch (err) {
      showAlert("Verification offline.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    setIsProcessing(true);
    try {
      await authFetch("/api/auth/logout", { method: "POST" });
      setAuthState('LOGIN_PHONE');
      setPhoneNumber("");
      setOtpCode("");
      setReferralInput("");
      setGameRoute('LOBBY_CAROUSEL');
      setCurrentTab('LOBBY');
      localStorage.removeItem('phoneNumber');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      showAlert("Logged out successfully.");
    } catch (err) {
      showAlert("Failed logging out.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ====== WALLET TRANSACTIONS CONTROLLERS ======
  const triggerDeposit = async () => {
    if (!addCashAmount || isNaN(parseFloat(addCashAmount))) return;
    setIsProcessing(true);
    try {
      const res = await authFetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: addCashAmount, method: "UPI Gateway Simulator" })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUserProfile(prev => ({ ...(prev || {}), ...data.user }));
        await syncTransactions();
        setAddCashModalOpen(false);
        showAlert(`Successfully deposited ₹${parseFloat(addCashAmount).toFixed(2)} to wallet!`);
      } else {
        showAlert(data.error || "Deposit failed", "error");
      }
    } catch (e) {
      showAlert("Deposit gateway unreachable.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerWithdrawal = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!withdrawAmount || isNaN(amt)) return;
    if (!withdrawUPI || !withdrawUPI.includes("@")) {
      showAlert("Please enter a valid UPI address (e.g., paytm@upi).", "error");
      return;
    }
    setIsProcessing(true);
    try {
      const res = await authFetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, method: `UPI (${withdrawUPI})` })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUserProfile(prev => ({ ...(prev || {}), ...data.user }));
        await syncTransactions();
        setWithdrawModalOpen(false);
        showAlert(`Requested ₹${amt.toFixed(2)} withdrawal! Approvals are pending. Check history!`);
      } else {
        showAlert(data.error || "Withdrawal failed", "error");
      }
    } catch (e) {
      showAlert("Withdrawal server offline.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerConvert = async () => {
    const amt = parseFloat(convertAmount);
    if (!convertAmount || isNaN(amt)) return;
    setIsProcessing(true);
    try {
      const res = await authFetch("/api/wallet/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUserProfile(prev => ({ ...(prev || {}), ...data.user }));
        await syncTransactions();
        setConvertModalOpen(false);
        showAlert(`Successfully converted ₹${amt.toFixed(2)} (+3% extra bonus deposit!)`);
      } else {
        showAlert(data.error || "Conversion failed.", "error");
      }
    } catch (e) {
      showAlert("Conversion interface error.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerAdminTxAction = async (txId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await authFetch(`/api/admin/transactions/${txId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUserProfile(prev => ({ ...(prev || {}), ...data.user }));
        await syncTransactions();
        showAlert(`Withdrawal tx ${txId} ${action === 'APPROVE' ? 'Approved' : 'Rejected'}! Cash balances synced.`);
      } else {
        showAlert(data.error || "Admin transaction update failed.", "error");
      }
    } catch (err) {
      showAlert("Internal action trigger failed.", "error");
    }
  };

  // ====== LUDO MATCH WORKFLOW ======
  const startLudoMatchmaking = async (fee: number) => {
    if (userProfile && userProfile.walletBalance < fee) {
      showAlert("Insufficient wallet/winning cash balance to join this classic arena room.", "error");
      return;
    }

    setMatchmakingEntryFee(fee);
    setMatchmakingCountdown(Math.floor(74 + Math.random() * 5));
    setMatchmakingPlayersCount(1);
    setMatchmakingOpponentFound(false);
    setGameRoute('LUDO_MATCHMAKING');
    setMatchmakingProgress(10);

    let secsPassed = 0;
    let pendingGame: any = null;

    // Log current token and decoded payload for debugging
    try {
      const token = sessionStorage.getItem('token');
      console.log('MATCHMAKING TOKEN', token);
      if (token) {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          console.log('MATCHMAKING USER', payload.id || payload);
        }
      }
    } catch (e) {
      console.error('Failed decoding token for matchmaking log', e.message);
    }

    const apiPromise = axiosInstance.post('/api/ludo/matchmaking', { variant: selectedLudoVariant, entryFee: fee })
      .then(res => res.data)
      .then(data => {
        if (data && data.success) {
          pendingGame = data.game;
        }
      }).catch(err => {
        console.error("Match API exception", err);
      });

    if (matchIntervalRef) {
      clearInterval(matchIntervalRef);
    }

    const intervalId = setInterval(() => {
      secsPassed += 1;
      setMatchmakingCountdown(prev => (prev > 0 ? prev - 1 : 0));
      setMatchmakingProgress(prev => (prev < 90 ? prev + Math.floor(Math.random() * 8 + 4) : 95));

      if (secsPassed === 3) {
        setMatchmakingPlayersCount(2);
        setMatchmakingOpponentFound(true);
        // Play soft match-found sound
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          if (audioCtx) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = "sine";
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
            osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
            osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.45);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
          }
        } catch (e) { }
      }

      if (secsPassed === 5) {
        clearInterval(intervalId);
        setMatchIntervalRef(null);
        setMatchmakingProgress(100);

        if (pendingGame) {
          setActiveLudo(prev => ({ ...(prev || {}), ...(pendingGame || {}) }));
          setGameRoute('L_PLAYING');
          syncServerProfile();
          syncTransactions();
          showAlert("Opponent found! Match connected.");
        } else {
          apiPromise.then(() => {
            if (pendingGame) {
              setActiveLudo(prev => ({ ...(prev || {}), ...(pendingGame || {}) }));
              setGameRoute('L_PLAYING');
              syncServerProfile();
              syncTransactions();
              showAlert("Opponent found! Match connected.");
            } else {
              setGameRoute('LUDO_MATCH');
              showAlert("Matchmaking timeout. Please try again.", "error");
            }
          });
        }
      }
    }, 1000);

    setMatchIntervalRef(intervalId);
  };

  const handleLudoDiceRollWithAnim = () => {
    if (!activeLudo) return;
    const myUserId = userProfile?._id ? (userProfile._id.toString ? userProfile._id.toString() : userProfile._id) : (userProfile?.id ? userProfile.id.toString() : null);
    const redId = activeLudo?.players?.red?.userId ? (activeLudo.players.red.userId.toString ? activeLudo.players.red.userId.toString() : activeLudo.players.red.userId) : null;
    const yellowId = activeLudo?.players?.yellow?.userId ? (activeLudo.players.yellow.userId.toString ? activeLudo.players.yellow.userId.toString() : activeLudo.players.yellow.userId) : null;
    const myColor = myUserId === redId ? 'red' : myUserId === yellowId ? 'yellow' : null;

    const currentTurn = activeLudo.turn;
    const diceLocked = activeLudo.diceHasRolled; // server-side flag
    const isMyTurn = myColor === currentTurn;
    const moveInProgress = false; // client visual animation not tracked here

    console.log("DICE CLICK", {
      currentTurn,
      myColor,
      isMyTurn,
      canRoll,
      isRollingDice,
      isProcessing,
      diceHasRolled: activeLudo?.diceHasRolled
    });

    console.log("CLICK", Date.now());

    if (!canRoll) {
      console.log('BLOCKED_CANROLL');
      return;
    }

    if (isRollingDice) {
      console.log('BLOCKED_ROLLING');
      return;
    }

    if (isProcessing) {
      console.log('BLOCKED_PROCESSING');
      return;
    }

    setIsRollingDice(true);
    console.log("EMIT", Date.now());
    socket.roll();
  };

  // Diagnostic: log state when activeLudo updates (useful after TOKEN_MOVED)
  React.useEffect(() => {
    if (!activeLudo) return;
    const myUserId = userProfile?._id ? (userProfile._id.toString ? userProfile._id.toString() : userProfile._id) : (userProfile?.id ? userProfile.id.toString() : null);
    const redId = activeLudo?.players?.red?.userId ? (activeLudo.players.red.userId.toString ? activeLudo.players.red.userId.toString() : activeLudo.players.red.userId) : null;
    const yellowId = activeLudo?.players?.yellow?.userId ? (activeLudo.players.yellow.userId.toString ? activeLudo.players.yellow.userId.toString() : activeLudo.players.yellow.userId) : null;
    const myColor = myUserId === redId ? 'red' : myUserId === yellowId ? 'yellow' : null;

    // Server has responded with the dice result or turn change, stop rolling
    if (isRollingDice && (activeLudo.diceHasRolled || activeLudo.turn !== myColor)) {
      setIsRollingDice(false);
    }

    const currentTurn = activeLudo.turn;
    const diceLocked = activeLudo.diceHasRolled;
    const canRoll = !!(myColor && currentTurn === myColor && !diceLocked && !isProcessing && !isRollingDice);
    console.log('LUDO DIAGNOSTIC UPDATE', {
      matchId: activeLudo.matchId,
      currentTurn,
      myColor,
      isMyTurn: myColor === currentTurn,
      canRoll,
      diceLocked,
      isRollingDice,
      winner: activeLudo.winner
    });
  }, [activeLudo, isRollingDice, isProcessing]);

  const triggerLudoMove = (tokenId: number) => {
    socket.move(tokenId);
  };

  const handleLudoTurnTimeout = () => {
    socket.timeout();
  };

  const handleLudoTimeModeFinished = async () => {
    if (!activeLudo || activeLudo.status !== 'PLAYING') return;
    try {
      const res = await authFetch(`/api/ludo/${activeLudo.matchId}/end-time-mode`, { method: "POST" });
      if (res.ok) {
        const game = await res.json();
        setActiveLudo(prev => ({ ...(prev || {}), ...(game || {}) }));
        showAlert("⏰ Time is finished! Tallying points...", "success");
        syncServerProfile();
      }
    } catch (err) {
      console.error("Time mode conclusion sync fails:", err);
    }
  };

  const resetGameState = () => {
    setActiveLudo(null);
    setMatchmakingProgress(0);
    setLudoSettingsOpen(false);
    setMatchmakingOpponentFound(false);
    setCanRoll(false);
    setIsRollingDice(false);
  };

  const handleLudoLeaveGame = () => {
    socket.leave();
    resetGameState();
    setGameRoute("LOBBY_CAROUSEL");
    showAlert("You left the game.", "error");
  };

  // Synchronized 18s Action Turn Countdown and match countdown sync (server-authoritative)
  useEffect(() => {
    if (gameRoute !== 'L_PLAYING' || !activeLudo || activeLudo.status !== 'PLAYING') {
      return;
    }

    setLudoTurnTimeRemaining(activeLudo.turnTimerRemaining ?? 18);

    const interval = setInterval(() => {
      setLudoTurnTimeRemaining((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameRoute, activeLudo?.matchId, activeLudo?.status, activeLudo?.turn, activeLudo?.turnTimerRemaining]);

  // ====== TEEN PATTI WORKFLOW ======
  const startTPMatchmaking = async (minBet: number) => {
    if (userProfile && userProfile.walletBalance < minBet * 4) {
      showAlert("Requires at least ₹" + (minBet * 4) + " cash on your balance to join this table.", "error");
      return;
    }

    setGameRoute('LUDO_MATCHMAKING');
    setMatchmakingProgress(15);

    const matchInterval = setInterval(() => {
      setMatchmakingProgress(prev => {
        if (prev >= 100) {
          clearInterval(matchInterval);
          return 100;
        }
        return prev + Math.floor(15 + Math.random() * 20);
      });
    }, 350);

    try {
      const res = await authFetch("/api/teenpatti/matchmaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant: selectedTPVariant, minBet })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTimeout(() => {
          clearInterval(matchInterval);
          setMatchmakingProgress(100);
          setActiveTP(data.game);
          setGameRoute('TP_PLAYING');
          syncServerProfile();
          syncTransactions();
          showAlert("Stakes table matched! High rollers verified.");
        }, 2200);
      } else {
        clearInterval(matchInterval);
        setGameRoute('TP_ARENA');
        showAlert(data.error || "Stakes room error.", "error");
      }
    } catch (e) {
      clearInterval(matchInterval);
      setGameRoute('TP_ARENA');
      showAlert("High stakes matching offline.", "error");
    }
  };

  const triggerTPAction_Fold = async () => {
    if (!activeTP || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await authFetch(`/api/teenpatti/${activeTP.matchId}/fold`, { method: "POST" });
      if (res.ok) {
        const game = await res.json();
        setActiveTP(game);
        syncServerProfile();
        syncTransactions();
      }
    } catch (err) {
      showAlert("Action match lost.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerTPAction_Seen = async () => {
    if (!activeTP || isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await authFetch(`/api/teenpatti/${activeTP.matchId}/seen`, { method: "POST" });
      if (res.ok) {
        const game = await res.json();
        setActiveTP(game);
      }
    } catch (err) {
      showAlert("Action match lost.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerTPAction_Chaal = async () => {
    if (!activeTP || isProcessing) return;
    const betNeeded = activeTP.playerSeen ? activeTP.currentBet * 2 : activeTP.currentBet;
    if (userProfile && userProfile.walletBalance < betNeeded) {
      showAlert("Insufficient wallet cash balance to match this Chaal bet size.", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await authFetch(`/api/teenpatti/${activeTP.matchId}/chaal`, { method: "POST" });
      if (res.ok) {
        const game = await res.json();
        setActiveTP(game);
        syncServerProfile();
        syncTransactions();
      }
    } catch (err) {
      showAlert("Action bet lost.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerTPAction_Show = async () => {
    if (!activeTP || isProcessing) return;
    const betNeeded = activeTP.playerSeen ? activeTP.currentBet * 2 : activeTP.currentBet;
    if (userProfile && userProfile.walletBalance < betNeeded) {
      showAlert("Insufficient cash to request Showdown card opening.", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await authFetch(`/api/teenpatti/${activeTP.matchId}/show`, { method: "POST" });
      if (res.ok) {
        const game = await res.json();
        setActiveTP(game);
        syncServerProfile();
        syncTransactions();
      }
    } catch (err) {
      showAlert("Action showdown lost.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter transactions inside the wallet lists
  const filteredTransactions = transactions.filter(t => {
    if (selectedTxnType !== "ALL" && t.type !== selectedTxnType) return false;
    if (searchTxnQuery.trim() !== "") {
      const q = searchTxnQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(q) ||
        t.method.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <Routes>
      <Route path="/wallet/add-cash" element={<AddCashPage />} />
      <Route path="/wallet/deposit-payment" element={<DepositPaymentPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="*" element={
        <div className="min-h-screen bg-[#070102] overflow-x-hidden font-sans antialiased text-neutral-100 flex items-center justify-center p-0 md:p-4">

          {/* Dynamic Floating Global Alerts */}
          {alertMsg && (
            <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-55 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 max-w-sm transition-all duration-300 ${alertMsg.type === 'success' ? 'bg-emerald-900/90 border border-emerald-500 text-emerald-100' : 'bg-rose-950/90 border border-rose-500 text-rose-100'
              }`}>
              {alertMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span className="text-xs font-semibold leading-tight">{alertMsg.text}</span>
            </div>
          )}

          {authState !== 'MAIN' ? (
            <Login
              authState={authState}
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              otpCode={otpCode}
              setOtpCode={setOtpCode}
              referralInput={referralInput}
              setReferralInput={setReferralInput}
              otpTimer={otpTimer}
              setOtpTimer={setOtpTimer}
              isProcessing={isProcessing}
              handleRequestOTP={handleRequestOTP}
              handleVerifyOTP={handleVerifyOTP}
              showAlert={showAlert}
            />
          ) : (
            /* ================= GAMEPLAY LOBBY PHASE ================= */
            <div className="w-full max-w-[430px] mx-auto min-h-screen bg-gradient-to-b from-[#1c0000] via-[#100000] to-neutral-955 shadow-2xl relative flex flex-col text-neutral-200 md:border-x md:border-white/5">

              <div className="flex-1 overflow-y-auto relative flex flex-col">

                {/* 4. MAIN NAVIGATED INTERACTIVE APP SECTION */}
                {authState === 'MAIN' && (
                  <div className="flex-1 flex flex-col h-full bg-[#180000]">

                    {/* TOP BRAND STAT BAR */}
                    {currentTab !== 'CHAT' && gameRoute === 'LOBBY_CAROUSEL' && (
                      <div className="px-3.5 py-2 bg-neutral-900/90 border-b border-rose-955/20 flex items-center justify-between z-30 shrink-0 select-none">
                        <div className="flex items-center gap-1.5 text-left">
                          <span className="font-extrabold text-[#ffd700] text-xs uppercase tracking-wider font-display">
                            DASHBOARD
                          </span>
                          <div className="flex items-center gap-1 text-[8px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-1 py-0.5 rounded font-bold animate-pulse">
                            <span className="w-1 h-1 rounded-full bg-emerald-400" />
                            <span>LIVE</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <div className="flex items-center gap-1 bg-neutral-955 border border-amber-500/30 px-2 py-1 rounded-lg text-[10px] font-bold text-amber-300 shadow-inner">
                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-mono">
                              ₹{(userProfile?.walletBalance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MAIN CONTENT PORT */}
                    <div className="flex-grow overflow-y-auto">
                      {currentTab === 'LOBBY' && (
                        <Home
                          userProfile={userProfile}
                          gameRoute={gameRoute}
                          setGameRoute={setGameRoute}
                          setCurrentTab={setCurrentTab}
                          selectedLudoVariant={selectedLudoVariant}
                          setSelectedLudoVariant={setSelectedLudoVariant}
                          selectedTPVariant={selectedTPVariant}
                          setSelectedTPVariant={setSelectedTPVariant}
                          onlinePlayersCount={onlinePlayersCount}
                          liveGamesCount={liveGamesCount}
                          startLudoMatchmaking={startLudoMatchmaking}
                          startTPMatchmaking={startTPMatchmaking}
                          setAddCashAmount={setAddCashAmount}
                          setAddCashStep={setAddCashStep}
                          setUtrNumber={setUtrNumber}
                          setAddCashModalOpen={setAddCashModalOpen}
                          setWithdrawAmount={setWithdrawAmount}
                          setWithdrawModalOpen={setWithdrawModalOpen}
                          showAlert={showAlert}
                        />
                      )}

                      {currentTab === 'WALLET' && (
                        <Wallet
                          walletData={walletData}
                          walletLoading={walletLoading}
                          walletError={walletError}
                          userProfile={userProfile}
                          transactions={transactions}
                          filteredTransactions={filteredTransactions}
                          searchTxnQuery={searchTxnQuery}
                          setSearchTxnQuery={setSearchTxnQuery}
                          selectedTxnType={selectedTxnType}
                          setSelectedTxnType={setSelectedTxnType}
                          setAddCashAmount={setAddCashAmount}
                          setAddCashStep={setAddCashStep}
                          setUtrNumber={setUtrNumber}
                          setAddCashModalOpen={setAddCashModalOpen}
                          setWithdrawAmount={setWithdrawAmount}
                          setWithdrawModalOpen={setWithdrawModalOpen}
                          setConvertAmount={setConvertAmount}
                          setConvertModalOpen={setConvertModalOpen}
                          triggerAdminTxAction={triggerAdminTxAction}
                        />
                      )}

                      {currentTab === 'PROFILE' && (
                        <Profile
                          userProfile={userProfile}
                          setUserProfile={setUserProfile}
                          showAlert={showAlert}
                          handleLogout={handleLogout}
                        />
                      )}

                      {currentTab === 'CHAT' && (
                        <Support onBack={() => setCurrentTab('LOBBY')} />
                      )}
                    </div>

                  </div>
                )}

                {/* Playable In-Game Ludo Screen Overlay */}
                {gameRoute === 'L_PLAYING' && activeLudo && (
                  <Ludo
                    userProfile={userProfile}
                    activeLudo={activeLudo}
                    ludoTurnTimeRemaining={ludoTurnTimeRemaining}
                    isRollingDice={isRollingDice}
                    isProcessing={isProcessing}
                    ludoSettingsOpen={ludoSettingsOpen}
                    setLudoSettingsOpen={setLudoSettingsOpen}
                    soundEnabled={soundEnabled}
                    setSoundEnabled={setSoundEnabled}
                    vibrationEnabled={vibrationEnabled}
                    setVibrationEnabled={setVibrationEnabled}
                    handleLudoDiceRollWithAnim={handleLudoDiceRollWithAnim}
                    triggerLudoMove={triggerLudoMove}
                    handleLudoLeaveGame={handleLudoLeaveGame}
                    setGameRoute={setGameRoute}
                    resetGameState={resetGameState}
                    syncServerProfile={syncServerProfile}
                    syncTransactions={syncTransactions}
                  />
                )}

                {/* Playable Teen Patti screen */}
                {gameRoute === 'TP_PLAYING' && activeTP && (
                  <TeenPatti
                    activeTP={activeTP}
                    isProcessing={isProcessing}
                    setGameRoute={setGameRoute}
                    setActiveTP={setActiveTP}
                    triggerTPAction_Fold={triggerTPAction_Fold}
                    triggerTPAction_Seen={triggerTPAction_Seen}
                    triggerTPAction_Chaal={triggerTPAction_Chaal}
                    triggerTPAction_Show={triggerTPAction_Show}
                    syncServerProfile={syncServerProfile}
                    syncTransactions={syncTransactions}
                  />
                )}

                {/* Multiplayer search matchmaking loader overlay */}
                {gameRoute === 'LUDO_MATCHMAKING' && (
                  <div className="absolute inset-0 bg-gradient-to-b from-[#310404] via-[#1a0101] to-[#120000] text-neutral-100 flex flex-col items-center justify-between p-5 z-50 overflow-hidden select-none">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.15)_0,transparent_65%)] pointer-events-none" />

                    {/* Back Link */}
                    <div className="w-full flex justify-start z-10 pt-1 shrink-0">
                      <button
                        onClick={() => {
                          if (matchIntervalRef) {
                            clearInterval(matchIntervalRef);
                            setMatchIntervalRef(null);
                          }
                          setGameRoute('LUDO_MATCH');
                        }}
                        className="text-neutral-400 hover:text-white flex items-center gap-1 text-[11px] font-black tracking-widest uppercase transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4 stroke-[3]" /> BACK
                      </button>
                    </div>

                    {/* Center Title */}
                    <div className="text-center space-y-1 z-10 shrink-0">
                      <h2 className="text-lg font-black text-white tracking-tight leading-none">
                        Searching for Opponents...
                      </h2>
                      <p className="text-[#ffd700] text-[13px] font-extrabold tracking-wide font-mono pt-1">
                        {matchmakingCountdown}s remaining
                      </p>
                      <p className="text-stone-500 text-[8.5px] uppercase font-bold tracking-wider leading-none pt-0.5">
                        Finding a real player for your match
                      </p>
                    </div>

                    {/* Matchmaking panels */}
                    <div className="w-full max-w-[290px] space-y-3 z-10 flex-grow flex flex-col justify-center my-2">
                      <div className="bg-[#1a0505]/95 border border-amber-500/10 p-3 rounded-[20px] flex items-center justify-between shadow-lg relative overflow-hidden transition-all duration-500">
                        <div className="flex items-center gap-3 text-left">
                          <div className={`w-12 h-12 rounded-full border-2 ${matchmakingOpponentFound ? 'border-amber-500' : 'border-neutral-800 animate-pulse'} overflow-hidden relative bg-neutral-950 flex items-center justify-center`}>
                            {matchmakingOpponentFound ? (
                              <svg viewBox="0 0 100 100" className="w-full h-full object-cover">
                                <rect width="100" height="100" fill="#2d2d30" />
                                <path d="M50 30 C38 30, 36 45, 36 50 C36 55, 38 68, 50 68 C62 68, 64 55, 64 50 C64 45, 62 30, 50 30 Z" fill="#ffd0a1" />
                                <path d="M50 24 C34 24, 32 38, 34 46 C36 46, 38 34, 50 34 C62 34, 64 46, 66 46 C68 38, 66 24, 50 24 Z" fill="#3f2305" />
                                <path d="M36 50 C36 62, 42 75, 50 75 C58 75, 64 62, 64 50 C64 60, 58 66, 50 66 C42 66, 36 60, 36 50 Z" fill="#3f2305" />
                                <path d="M42 64 C42 68, 45 78, 50 78 C55 78, 58 68, 58 64 H42 Z" fill="#3f2305" />
                                <circle cx="45" cy="48" r="2.2" fill="black" />
                                <circle cx="55" cy="48" r="2.2" fill="black" />
                                <path d="M42 58 C46 56, 54 56, 58 58 C52 58, 48 58, 42 58 Z" fill="#3f2305" />
                                <path d="M25 88 C32 80, 42 74, 50 74 C58 74, 68 80, 75 88 L65 100 H35 L25 88 Z" fill="#fef3c7" />
                              </svg>
                            ) : (
                              <span className="text-lg text-white font-black animate-pulse opacity-25">?</span>
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[8px] text-[#ffd700] uppercase font-extrabold tracking-widest block leading-none">
                              {matchmakingOpponentFound ? "Opponent Joined" : "Searching Player..."}
                            </span>
                            <h4 className="text-xs font-black text-white leading-tight font-sans">
                              {matchmakingOpponentFound ? "Rohan_Ludo" : "Searching..."}
                            </h4>

                            <div className="flex items-center gap-1 pt-0.5">
                              <span className="text-[8px] font-mono border border-neutral-800 bg-[#000]/65 text-zinc-300 px-1.5 py-0.5 rounded-full font-bold">
                                Entry ₹{matchmakingEntryFee}
                              </span>
                              <span className="text-[8px] font-mono border border-emerald-500/15 bg-[#000]/65 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">
                                Prize ₹{matchmakingEntryFee * 2}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${matchmakingOpponentFound ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-[#eab308]/10 border-[#eab308]/30 text-amber-300 animate-pulse'}`}>
                            {matchmakingOpponentFound ? "READY" : "WAITING"}
                          </span>
                        </div>
                      </div>

                      <div className="text-center py-0.5 shrink-0">
                        <span className="text-white text-2xl font-black font-mono tracking-tight leading-none block">
                          {matchmakingPlayersCount} / 2
                        </span>
                        <p className="text-stone-500 text-[8px] font-bold uppercase tracking-widest leading-none pt-0.5">
                          Players Joined
                        </p>
                      </div>

                      {/* YOU PANEL */}
                      <div className="bg-[#1a0505]/95 border border-emerald-955/45 p-3 rounded-[20px] flex items-center justify-between shadow-lg relative overflow-hidden">
                        <div className="flex items-center gap-3 text-left">
                          <div className="w-12 h-12 rounded-full border-2 border-emerald-500 overflow-hidden bg-neutral-950 shadow relative">
                            <svg viewBox="0 0 100 100" className="w-full h-full object-cover">
                              <rect width="100" height="100" fill="#1e1b4b" />
                              <path d="M50 32 C41 32, 38 45, 38 52 C38 57, 41 68, 50 68 C59 68, 62 57, 62 52 C62 45, 59 32, 50 32 Z" fill="#fed7aa" />
                              <path d="M50 18 C30 18, 28 36, 32 44 C34 38, 40 32, 50 32 C60 32, 66 38, 68 44 C72 36, 70 18, 50 18 Z" fill="#1e1105" />
                              <path d="M32 44 L32 75 L38 60 Z" fill="#1e1105" />
                              <path d="M68 44 L68 75 L62 60 Z" fill="#1e1105" />
                              <circle cx="46" cy="48" r="2.2" fill="black" />
                              <circle cx="54" cy="48" r="2.2" fill="black" />
                              <path d="M46 57 C48 59, 52 59, 54 57 Z" fill="#f43f5e" stroke="#f43f5e" strokeWidth="1" />
                              <path d="M25 88 C32 80, 42 74, 50 74 C58 74, 68 80, 75 88 L65 100 H35 L25 88 Z" fill="#ec4899" />
                            </svg>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[8px] text-emerald-400 uppercase font-extrabold tracking-widest block leading-none">
                              Your Profile
                            </span>
                            <h4 className="text-xs font-black text-white leading-tight font-sans">
                              {userProfile ? userProfile.username : "Player_You"}
                            </h4>

                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="text-[8px] font-mono border border-neutral-800 bg-[#000]/65 text-zinc-300 px-1.5 py-0.5 rounded-full font-bold">
                                Entry ₹{matchmakingEntryFee}
                              </span>
                              <span className="text-[8px] font-mono border border-emerald-500/15 bg-[#000]/65 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">
                                Prize ₹{matchmakingEntryFee * 2}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400">
                            CONNECTED
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="w-full text-center space-y-3.5 z-10 shrink-0 pb-1.5">
                      <p className="text-stone-500 text-[10px] leading-tight max-w-[240px] mx-auto font-medium">
                        Entry fee will be refunded if all players do not join.
                      </p>

                      <button
                        onClick={async () => {
                          if (matchIntervalRef) {
                            clearInterval(matchIntervalRef);
                            setMatchIntervalRef(null);
                          }
                          try {
                            await authFetch('/api/ludo/matchmaking/cancel', { method: 'POST' });
                          } catch (err) {
                            console.error('Failed to cancel matchmaking on server', err);
                          }
                          setGameRoute('LUDO_MATCH');
                          syncServerProfile();
                          syncTransactions();
                        }}
                        className="w-full max-w-[245px] py-3 bg-[#e11d48] hover:bg-neutral-900 border border-transparent hover:border-red-500/30 hover:text-red-400 text-white font-black rounded-full text-xs uppercase tracking-widest shadow-[0_6px_16px_rgba(225,29,72,0.3)] hover:shadow-none active:scale-95 transition-transform cursor-pointer"
                      >
                        CANCEL
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* ============================== CHIPS CONVERT WALLET MODALS (SHARED) ============================== */}
              {withdrawModalOpen && (
                <div className="absolute inset-0 bg-neutral-950/90 flex items-center justify-center p-4 z-50">
                  <div className="w-full max-w-xs rounded-2xl bg-[#220d0d] border border-rose-955/50 p-4 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400">💸 Withdraw Winnings</span>
                      <button onClick={() => setWithdrawModalOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer p-0.5">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-left">
                      <div>
                        <span className="text-[8px] text-zinc-500 block font-bold leading-none uppercase">AVAILABLE WITHDRAWABLE:</span>
                        <span className="text-base font-extrabold text-[#ffd700] font-mono block pt-0.5 leading-none">
                          ₹{userProfile?.winningsBalance?.toLocaleString('en-IN') ?? '0.00'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] text-zinc-400 block font-bold">WITHDRAW VALUE (₹)</label>
                        <input
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="w-full bg-neutral-955 border border-rose-955 rounded-xl py-2.5 px-3 text-xs text-neutral-200 outline-none"
                          id="inp-withdraw-amt"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] text-zinc-400 block font-bold">RECIPIENT UPI ADDRESS</label>
                        <input
                          type="text"
                          value={withdrawUPI}
                          onChange={(e) => setWithdrawUPI(e.target.value)}
                          placeholder="paytm@upi"
                          className="w-full bg-neutral-955 border border-rose-955/20 rounded-xl py-2.5 px-3 text-xs text-neutral-200 outline-none"
                          id="inp-withdraw-upi"
                        />
                      </div>
                    </div>

                    <button
                      onClick={triggerWithdrawal}
                      className="w-full py-3 bg-[#ffd700] hover:bg-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                      id="btn-submit-withdraw"
                    >
                      SUBMIT WITHDRAWAL STK
                    </button>
                  </div>
                </div>
              )}

              {convertModalOpen && (
                <div className="absolute inset-0 bg-neutral-950/90 flex items-center justify-center p-4 z-50">
                  <div className="w-full max-w-xs rounded-2xl bg-[#0e2114] border border-emerald-950/20 p-4 space-y-4 shadow-xl text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400">⚡ Convert Winnings</span>
                      <button onClick={() => setConvertModalOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer p-0.5">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] text-neutral-300 leading-relaxed">
                        Securely convert winnings back to your Deposit cash balance instantly, and automatically claim a <b className="text-emerald-400">3% extra bonus</b>.
                      </p>

                      <div className="space-y-1">
                        <label className="text-[8px] text-emerald-500 block font-bold">CONVERT VALUE (₹)</label>
                        <input
                          type="number"
                          value={convertAmount}
                          onChange={(e) => setConvertAmount(e.target.value)}
                          className="w-full bg-neutral-955 border border-emerald-955/40 rounded-xl py-2.5 px-3 text-xs text-neutral-200 outline-none font-semibold text-center font-mono"
                          id="inp-convert-amt"
                        />
                      </div>
                    </div>

                    <button
                      onClick={triggerConvert}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-extrabold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
                      id="btn-submit-convert"
                    >
                      CONFIRM CONVERT
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Navigation Tab layout exactly matching OCMPLAY style */}
              {authState === 'MAIN' && gameRoute === 'LOBBY_CAROUSEL' && (
                <div className="h-16 bg-neutral-950 border-t border-rose-955/15 flex items-center justify-around select-none shrink-0 z-30">
                  <button
                    onClick={() => setCurrentTab('LOBBY')}
                    className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${currentTab === 'LOBBY' ? 'text-amber-400 font-extrabold' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <Trophy className="w-5 h-5" />
                    <span className="text-[8.5px] uppercase tracking-wider font-extrabold">Play Arena</span>
                  </button>

                  <button
                    onClick={() => {
                      syncTransactions();
                      setCurrentTab('WALLET');
                    }}
                    className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${currentTab === 'WALLET' ? 'text-amber-400 font-extrabold' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <WalletIcon className="w-5 h-5" />
                    <span className="text-[8.5px] uppercase tracking-wider font-extrabold">My Wallet</span>
                  </button>

                  <button
                    onClick={() => setCurrentTab('PROFILE')}
                    className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${currentTab === 'PROFILE' ? 'text-amber-400 font-extrabold' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <UserIcon className="w-5 h-5" />
                    <span className="text-[8.5px] uppercase tracking-wider font-extrabold">Profile</span>
                  </button>

                  <button
                    onClick={() => setCurrentTab('CHAT')}
                    className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${currentTab === 'CHAT' ? 'text-amber-400 font-extrabold' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <span className="text-xl leading-none">💬</span>
                    <span className="text-[8.5px] uppercase tracking-wider font-extrabold">Support</span>
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      } />
    </Routes>
  );
}

