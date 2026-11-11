import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Zap, Bot, Loader2 } from 'lucide-react';
import { socketService } from '../services/socket';
import { useAuthStore } from '../stores/authStore';
import { useMatchStore } from '../stores/matchStore';
import { sound } from '../utils/sound';
import { ThemedBackground } from '../components/ThemedBackground';

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
    socket.emit('request_practice_match', { token: localStorage.getItem('token') });
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
      socket.emit('find_match', { elo: userRating, token: localStorage.getItem('token') });
    };

    if (socket.connected) {
      emitSearch();
    } else {
      socket.once('connect', emitSearch);
    }

    // Auto-match fallback: automatically challenge ArenaBot if no human found after 4s
    const fallbackTimer = setTimeout(() => {
      if (!matchJoinedRef.current) {
        socket.emit('request_practice_match', { token: localStorage.getItem('token') });
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
    <ThemedBackground variant="dashboard">
      <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center p-4">
        <div className="card-shin max-w-md w-full p-8 space-y-6 text-center shadow-sticker-lg relative bg-shin-card">
          {/* Radar Indicator with Bouncing Shinchan Star */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[3px] border-shin-yellow/30 animate-ping" />
            <div className="absolute inset-3 rounded-full border-[2px] border-shin-outline" />
            <div className="w-16 h-16 rounded-3xl bg-shin-yellow border-[3px] border-shin-outline flex items-center justify-center shadow-sticker-sm animate-shin-bounce">
              <Zap className="w-8 h-8 text-shin-outline fill-shin-red" />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-shin-yellow border-[2px] border-shin-outline text-shin-outline text-xs uppercase font-black tracking-wider mb-3 shadow-sticker-sm">
              <span className="font-bangers tracking-wider">⚡ Ranked Matchmaking</span>
            </div>
            <h2 className="text-3xl font-bangers text-white tracking-wide">
              Finding Your Opponent...
            </h2>
            <p className="text-xs text-shin-cream mt-1 font-comic font-bold">
              {secondsElapsed > 6
                ? 'Waking up the battle arena... almost ready!'
                : 'Searching Redis queue for contenders in your tier'}
            </p>
          </div>

          {/* Match Query Metrics */}
          <div className="bg-shin-navy rounded-2xl p-4 border-[2.5px] border-shin-outline text-xs space-y-2.5 text-left font-mono">
            <div className="flex justify-between items-center">
              <span className="text-shin-muted font-bold">Your ELO</span>
              <span className="font-black text-shin-yellow text-sm">{userRating}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-shin-muted font-bold">Rating Window</span>
              <span className="text-white font-bold">[{minRange} — {maxRange}]</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-shin-muted font-bold">Match Duration</span>
              <span className="text-white font-bold">15 min</span>
            </div>
            <div className="flex justify-between items-center border-t-[2px] border-shin-outline/60 pt-2 mt-2">
              <span className="text-shin-muted font-bold">Queue Time</span>
              <span className="font-black text-shin-blue text-sm">{secondsElapsed}s</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-1">
            <button
              onClick={handleStartBotMatch}
              disabled={isStartingBot}
              className="btn-shin-yellow w-full py-3.5 shadow-sticker text-sm"
            >
              {isStartingBot ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
              <span className="font-bangers text-base tracking-wider">
                {isStartingBot ? 'Launching Duel...' : '⚡ Launch Instant ArenaBot Duel'}
              </span>
            </button>

            <button
              onClick={handleCancel}
              className="btn-shin-outline w-full py-2.5 text-xs text-shin-muted hover:text-shin-red"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel & Leave Queue</span>
            </button>
          </div>
        </div>
      </div>
    </ThemedBackground>
  );
};
