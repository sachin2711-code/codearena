import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Zap, Swords, Bot, Loader2 } from 'lucide-react';
import { socketService } from '../services/socket';
import { useAuthStore } from '../stores/authStore';
import { useMatchStore } from '../stores/matchStore';
import { sound } from '../utils/sound';

export const Matchmaking: React.FC = () => {
  const { user } = useAuthStore();
  const { setMatch, setSearching } = useMatchStore();
  const navigate = useNavigate();
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isStartingBot, setIsStartingBot] = useState(false);
  const matchJoinedRef = useRef(false);

  const userRating = user?.elo_rating || 1200;
  const minRange = Math.max(800, userRating - 100);
  const maxRange = userRating + 100;

  const handleStartBotMatch = useCallback(() => {
    setIsStartingBot(true);
    const socket = socketService.connect();
    socket.emit('request_practice_match');
  }, []);

  useEffect(() => {
    const socket = socketService.connect();
    setSearching(true);
    matchJoinedRef.current = false;

    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    const onMatchFound = (data: any) => {
      if (matchJoinedRef.current) return;
      matchJoinedRef.current = true;
      sound.playMatchFound();
      setMatch(data);
      navigate('/battle');
    };

    socket.on('match_found', onMatchFound);

    const emitSearch = () => {
      socket.emit('find_match', { elo: userRating });
    };

    if (socket.connected) {
      emitSearch();
    } else {
      socket.once('connect', emitSearch);
    }

    // Auto-match fallback: automatically challenge ArenaBot if no human found after 4s
    const fallbackTimer = setTimeout(() => {
      if (!matchJoinedRef.current) {
        socket.emit('request_practice_match');
      }
    }, 4000);

    return () => {
      clearInterval(timer);
      clearTimeout(fallbackTimer);
      socket.off('match_found', onMatchFound);
      socket.off('connect', emitSearch);
      if (!matchJoinedRef.current) {
        socket.emit('cancel_find_match');
      }
      setSearching(false);
    };
  }, [userRating, navigate, setMatch, setSearching]);

  const handleCancel = () => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('cancel_find_match');
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-shin-bg flex flex-col items-center justify-center p-4">
      {/* Yellow glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-shin-yellow/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full rounded-2xl bg-shin-panel border-2 border-shin-yellow/30 p-8 space-y-6 text-center shadow-2xl relative overflow-hidden"
        style={{ boxShadow: '6px 6px 0px #1a1740, 0 0 40px rgba(255,215,0,0.08)' }}>
        {/* Dot accent */}
        <div className="absolute inset-0 bg-dot-pattern opacity-40 pointer-events-none" />

        {/* Radar/Pulse Indicator */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-shin-yellow/20 animate-ping" />
          <div className="absolute inset-0 rounded-full border border-shin-yellow/10 animate-ping" style={{ animationDelay: '0.5s' }} />
          <div className="absolute inset-3 rounded-full border border-shin-border" />
          <div className="w-14 h-14 rounded-full bg-shin-yellow flex items-center justify-center shadow-lg shadow-shin-yellow/40 animate-shin-bounce">
            <Zap className="w-6 h-6 text-shin-bg" strokeWidth={3} />
          </div>
        </div>

        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-shin-yellow/15 border border-shin-yellow/30 text-shin-yellow text-[10px] uppercase font-black tracking-wider mb-3">
            ⚡ Searching Ranked Queue
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Finding Your Opponent...
          </h2>
          <p className="text-xs text-shin-muted mt-1 font-mono">
            {secondsElapsed > 6
              ? 'Waking up arena server... almost ready!'
              : 'Pairing with active contenders in your tier'}
          </p>
        </div>

        {/* Match Query Metrics */}
        <div className="bg-shin-bg rounded-2xl p-4 border-2 border-shin-border text-xs space-y-2.5 text-left font-mono">
          <div className="flex justify-between items-center">
            <span className="text-shin-muted font-bold">Your ELO</span>
            <span className="font-black text-shin-yellow">{userRating}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-shin-muted font-bold">Rating Window</span>
            <span className="text-shin-white font-bold">[{minRange} — {maxRange}]</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-shin-muted font-bold">Match Duration</span>
            <span className="text-shin-white font-bold">15 min</span>
          </div>
          <div className="flex justify-between items-center border-t border-shin-border pt-2 mt-2">
            <span className="text-shin-muted font-bold">Queue Time</span>
            <span className="font-black text-shin-blue">{secondsElapsed}s</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-1">
          <button
            onClick={handleStartBotMatch}
            disabled={isStartingBot}
            className="w-full py-3 px-4 rounded-xl bg-shin-yellow hover:bg-shin-yellow-soft text-shin-bg font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-shin-yellow/20 disabled:opacity-50"
            style={{ boxShadow: '2px 2px 0px #E8192C' }}
          >
            {isStartingBot ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
            <span>{isStartingBot ? 'Launching Duel...' : '⚡ Launch Instant ArenaBot Duel'}</span>
          </button>

          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-xl bg-shin-border hover:bg-shin-red/15 border-2 border-shin-border hover:border-shin-red/40 text-shin-muted hover:text-shin-red text-xs font-black transition-all inline-flex items-center justify-center gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>Cancel & Leave Queue</span>
          </button>
        </div>
      </div>
    </div>
  );
};
