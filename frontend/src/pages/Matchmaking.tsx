import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, X, Radio, Shield, Globe } from 'lucide-react';
import { socketService } from '../services/socket';
import { useAuthStore } from '../stores/authStore';
import { useMatchStore } from '../stores/matchStore';
import { problemsApi } from '../services/api';

export const Matchmaking: React.FC = () => {
  const { user } = useAuthStore();
  const { setMatch, setSearching } = useMatchStore();
  const navigate = useNavigate();
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const userRating = user?.elo_rating || 1200;
  const minRange = Math.max(800, userRating - 100);
  const maxRange = userRating + 100;

  useEffect(() => {
    const socket = socketService.connect();
    setSearching(true);

    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    socket.emit('find_match', { elo: userRating });

    socket.on('match_found', (data) => {
      setMatch(data);
      navigate('/battle');
    });

    // Auto-match fallback for solo local testing
    const fallbackTimer = setTimeout(async () => {
      try {
        const problem = await problemsApi.getRandom();
        setMatch({
          match_id: 'match_' + Math.random().toString(36).substring(2, 9),
          player1_id: user?.id || 'player_1',
          player2_id: 'guest_opponent',
          problem: problem,
          duration_seconds: 900,
        });
        navigate('/battle');
      } catch (err) {
        console.error('Fallback matchmaking error', err);
      }
    }, 6000);

    return () => {
      clearInterval(timer);
      clearTimeout(fallbackTimer);
      socket.off('match_found');
      socket.emit('cancel_find_match');
      setSearching(false);
    };
  }, [user, userRating, navigate, setMatch, setSearching]);

  const handleCancel = () => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('cancel_find_match');
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#090a0f] flex flex-col items-center justify-center p-4 font-mono text-zinc-300">
      <div className="max-w-md w-full rounded-xl bg-zinc-950 border border-zinc-800 p-8 space-y-6 text-center shadow-2xl relative overflow-hidden">
        {/* Subtle grid accent */}
        <div className="absolute inset-0 bg-dot-pattern opacity-30 pointer-events-none" />

        {/* Minimal Radar Indicator */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border border-zinc-800" />
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold tracking-wider mb-2">
            Searching Ranked Queue
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight font-sans">
            Finding Suitable Opponent
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Querying Redis Sorted Set with <code className="text-zinc-400">ZRANGEBYSCORE</code>
          </p>
        </div>

        {/* Match Query Metrics */}
        <div className="bg-[#0e0f14] rounded-lg p-3.5 border border-zinc-900 text-xs space-y-2 text-left">
          <div className="flex justify-between items-center text-zinc-400">
            <span>Your ELO:</span>
            <span className="font-bold text-amber-400">{userRating}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span>Target Rating Window:</span>
            <span className="text-zinc-200">[{minRange} — {maxRange}]</span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span>Match Duration:</span>
            <span className="text-zinc-200">15 min (Standard)</span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span>Elapsed Queue Time:</span>
            <span className="text-emerald-400 font-bold">{secondsElapsed}s</span>
          </div>
        </div>

        <div>
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-rose-400 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>Leave Queue</span>
          </button>
        </div>
      </div>
    </div>
  );
};
