import { create } from 'zustand';
import { Problem } from '../types';

interface MatchState {
  matchId: string | null;
  problem: Problem | null;
  player1Id: string | null;
  player2Id: string | null;
  durationSeconds: number;
  myProgress: { passed: number; total: number };
  opponentProgress: { passed: number; total: number };
  currentCode: string;
  language: string;
  isSearching: boolean;
  matchStatus: 'idle' | 'searching' | 'battling' | 'ended';
  winnerId: string | null;
  endReason: string | null;

  setMatch: (payload: {
    match_id: string;
    player1_id: string;
    player2_id: string;
    problem: Problem;
    duration_seconds: number;
  }) => void;
  setSearching: (searching: boolean) => void;
  setCode: (code: string) => void;
  setLanguage: (lang: string) => void;
  updateMyProgress: (passed: number, total: number) => void;
  updateOpponentProgress: (passed: number, total: number) => void;
  endMatch: (winnerId: string | null, reason: string) => void;
  resetMatch: () => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  matchId: null,
  problem: null,
  player1Id: null,
  player2Id: null,
  durationSeconds: 900,
  myProgress: { passed: 0, total: 0 },
  opponentProgress: { passed: 0, total: 0 },
  currentCode: '',
  language: 'python',
  isSearching: false,
  matchStatus: 'idle',
  winnerId: null,
  endReason: null,

  setMatch: (payload) => {
    const starter = payload.problem.starter_code?.python || '# Write solution here\n';
    set({
      matchId: payload.match_id,
      player1Id: payload.player1_id,
      player2Id: payload.player2_id,
      problem: payload.problem,
      durationSeconds: payload.duration_seconds || 900,
      currentCode: starter,
      isSearching: false,
      matchStatus: 'battling',
      myProgress: { passed: 0, total: 0 },
      opponentProgress: { passed: 0, total: 0 },
      winnerId: null,
      endReason: null,
    });
  },

  setSearching: (searching) =>
    set({ isSearching: searching, matchStatus: searching ? 'searching' : 'idle' }),

  setCode: (code) => set({ currentCode: code }),
  setLanguage: (language) => set({ language }),

  updateMyProgress: (passed, total) =>
    set({ myProgress: { passed, total } }),

  updateOpponentProgress: (passed, total) =>
    set({ opponentProgress: { passed, total } }),

  endMatch: (winnerId, reason) =>
    set({ matchStatus: 'ended', winnerId, endReason: reason }),

  resetMatch: () =>
    set({
      matchId: null,
      problem: null,
      player1Id: null,
      player2Id: null,
      matchStatus: 'idle',
      isSearching: false,
      winnerId: null,
      endReason: null,
      myProgress: { passed: 0, total: 0 },
      opponentProgress: { passed: 0, total: 0 },
    }),
}));
