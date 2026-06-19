/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  _id?: string;
  id?: string;
  phoneNumber: string;
  username: string;
  avatar: string;
  referralCode: string;
  walletBalance: number;
  depositBalance: number;
  winningsBalance: number;
  gamesPlayed: number;
  wins: number;
  earnings: number;
  referralCount: number;
}

export type TransactionType = 'DEPOSIT' | 'WITHDRAW' | 'ENTRY_FEE' | 'WINNINGS' | 'BONUS';
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REJECTED';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  timestamp: string;
  txHash?: string;
  method: string;
}

export type ArenaType = 'LUDO' | 'TEEN_PATTI';
export type LudoVariant = 'CLASSIC' | 'TIME' | 'TURN';
export type TeenPattiVariant = 'CLASSIC' | 'MUFLIS' | 'AK47';

export interface LudoRoom {
  id: string;
  entryFee: number;
  winningPrize: number;
  variant: LudoVariant;
  playersCount: number;
  activePlayers: number;
}

export interface TeenPattiRoom {
  id: string;
  name: string;
  description: string;
  variant: TeenPattiVariant;
  minBet: number;
  activePlayers: number;
}

// Ludo Game Types
export type TokenColor = 'red' | 'green' | 'yellow' | 'blue';

export interface LudoToken {
  id: number; // 0, 1, 2, 3
  color: TokenColor;
  position: number; // -1 to 57 (-1 = in base, 0-51 = track, 52-56 = home column, 57 = finished/home)
  prevPosition: number;
}

export interface LudoGame {
  matchId: string;
  variant: LudoVariant;
  entryFee: number;
  winningPrize: number;
  players: {
    red: { userId: string; username: string; avatar: string } | null;
    yellow: { userId: string; username: string; avatar: string } | null;
  };
  turn: TokenColor;
  diceRoll: number | null;
  diceHasRolled: boolean;
  tokens: LudoToken[];
  // Winner can be a color, the explicit 'draw' marker, or null when ongoing
  winner: TokenColor | 'draw' | null;
  // Optional per-color scores (may appear on finish screens)
  scores?: { red?: number; yellow?: number } | null;
  // Optional helper flags used by server/UI
  waitingForPlayers?: boolean;
  bothPlayersJoined?: boolean;
  movesRemaining: number; // For Turn-based
  timerRemaining: number; // For Time-based
  redLives: number;      // 3 lives/hearts
  yellowLives: number;   // 3 lives/hearts/hearts
  turnTimerRemaining: number; // 6 seconds action timer
  status: 'MATCHMAKING' | 'PLAYING' | 'FINISHED';
  logs: string[];
}

// Teen Patti Game Types
export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: string; // "2"-"10", "J", "Q", "K", "A"
  rank: number; // 2-14
}

export interface TeenPattiPlayer {
  userId: string;
  username: string;
  avatar: string;
  walletBalance: number;
  cards: Card[];
  seen: boolean;
  folded: boolean;
  lastBet: number;
}

export interface TeenPattiGame {
  matchId: string;
  variant: string;
  entryFee: number;
  jokerValue?: string | null;
  pot: number;
  currentBet: number;
  players: {
    A: TeenPattiPlayer;
    B?: TeenPattiPlayer;
  };
  turn: string; // userId of current turn
  turnTimerRemaining: number;
  winner: 'A' | 'B' | null;
  status: 'MATCHMAKING' | 'PLAYING_PENDING' | 'PLAYING' | 'FINISHED';
  waitingForPlayers?: boolean;
  logs: string[];
}

export interface SupportChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}
