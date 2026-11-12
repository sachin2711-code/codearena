import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Swords, Trophy, Clock, Target, ArrowLeft, Zap, Shield, Play } from 'lucide-react';
import { matchesApi } from '../services/api';
import { socketService } from '../services/socket';
import { Match } from '../types';
import { ThemedBackground } from '../components/ThemedBackground';

export const Spectate: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [p1Progress, setP1Progress] = useState({ passed: 0, total: 5 });
  const [p2Progress, setP2Progress] = useState({ passed: 0, total: 5 });
  const [secondsLeft, setSecondsLeft] = useState(900);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [matchStatus, setMatchStatus] = useState<string>('active');

  useEffect(() => {
    if (!matchId) return;

    const loadMatch = async () => {
      try {
        const data = await matchesApi.getDetail(matchId);
        setMatch(data);
        if (data.duration_seconds) {
          setSecondsLeft(Math.max(0, 900 - data.duration_seconds));
        }
        if (data.status === 'completed') {
          setMatchStatus('completed');
          setWinnerId(data.winner_id || null);
        }
      } catch (err) {
        console.error('Failed to load match detail', err);
      } finally {
        setLoading(false);
      }
    };
    loadMatch();

    const socket = socketService.connect();
    socket.emit('join_match_room', { match_id: matchId });

    const handleOpponentProgress = (data: { user_id: string; tests_passed: number; total_tests: number }) => {
      if (match && data.user_id === match.player1_id) {
        setP1Progress({ passed: data.tests_passed, total: data.total_tests });
      } else {
        setP2Progress({ passed: data.tests_passed, total: data.total_tests });
      }
    };

    const handleMatchEnded = (data: { winner_id: string; reason: string }) => {
      setWinnerId(data.winner_id);
      setMatchStatus('completed');
    };

    socket.on('opponent_progress', handleOpponentProgress);
    socket.on('match_ended', handleMatchEnded);

    // Timer countdown
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearInterval(timer);
      socket.off('opponent_progress', handleOpponentProgress);
      socket.off('match_ended', handleMatchEnded);
    };
  }, [matchId]);

  const p1Name = match?.player1?.username || 'Player 1';
  const p2Name = match?.player2?.username || 'ArenaBot';
  const p1Elo = match?.player1?.elo_rating || 1200;
  const p2Elo = match?.player2?.elo_rating || 1250;
  const p1Branch = match?.player1?.branch || 'CSE';
  const p2Branch = match?.player2?.branch || (p2Name === 'ArenaBot' ? 'AI' : 'IT');

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  const p1Percent = Math.round((p1Progress.passed / (p1Progress.total || 5)) * 100);
  const p2Percent = Math.round((p2Progress.passed / (p2Progress.total || 5)) * 100);

  const isP1Winner = winnerId && match && winnerId === match.player1_id;
  const isP2Winner = winnerId && match && winnerId === match.player2_id;

  return (
    <ThemedBackground variant="battle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-shin-outline px-4 py-2 text-xs font-bangers flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>EXIT SPECTATOR VIEW</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-xl bg-shin-red text-white border-[2px] border-shin-outline text-xs font-bangers tracking-wider animate-pulse shadow-sticker-sm">
              ● LIVE AUDITORIUM SPECTATOR MODE
            </span>
            <div className="bg-shin-navy px-4 py-1.5 rounded-xl border-[2px] border-shin-outline font-mono font-black text-shin-yellow text-sm shadow-sticker-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-shin-yellow" />
              <span>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        {/* Big Duel HUD Hero Card */}
        <div className="card-shin bg-shin-card p-6 sm:p-8 space-y-6 shadow-sticker-lg relative overflow-hidden">
          {/* Header Problem Info */}
          <div className="text-center space-y-1 pb-4 border-b-[2.5px] border-shin-outline">
            <span className="text-xs font-bangers text-shin-yellow uppercase tracking-widest">
              OFFICIAL 1V1 LIVE CLASH
            </span>
            <h1 className="text-3xl sm:text-5xl font-bangers text-white tracking-wide">
              {match?.problem?.title || 'Competitive Duel'}
            </h1>
            <p className="text-xs font-comic font-bold text-shin-cream">
              Difficulty: <span className="text-shin-yellow uppercase">{match?.problem?.difficulty || 'Medium'}</span> • Memory Limit: 256MB • Time Limit: 2.0s
            </p>
          </div>

          {/* Duelists Head-to-Head */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative">
            {/* Center VS Badge */}
            <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-16 h-16 rounded-3xl bg-shin-yellow border-[3px] border-shin-outline items-center justify-center font-bangers text-2xl text-shin-outline shadow-sticker animate-shin-bounce">
              VS
            </div>

            {/* Player 1 Card (Left) */}
            <div className={`p-6 rounded-3xl border-[3px] border-shin-outline space-y-4 transition-all ${
              isP1Winner ? 'bg-shin-yellow/20 border-shin-yellow shadow-sticker' : 'bg-shin-navy'
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-shin-yellow border-[3px] border-shin-outline flex items-center justify-center text-3xl font-bangers text-shin-outline shadow-sticker-sm">
                  {p1Name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bangers text-white tracking-wider">{p1Name}</h2>
                    {isP1Winner && <span className="text-xl">👑</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-comic font-bold text-shin-cream mt-0.5">
                    <span className="text-shin-yellow font-black">{p1Branch}</span>
                    <span>•</span>
                    <span>ELO {p1Elo}</span>
                  </div>
                </div>
              </div>

              {/* Progress & Health Bar */}
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-shin-muted">Tests Solved:</span>
                  <span className="text-shin-yellow font-bangers text-sm">{p1Progress.passed} / {p1Progress.total} ({p1Percent}%)</span>
                </div>
                <div className="w-full bg-shin-card h-4 rounded-full overflow-hidden border-[2px] border-shin-outline">
                  <div
                    className="h-full bg-gradient-to-r from-shin-yellow to-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${p1Percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Player 2 Card (Right) */}
            <div className={`p-6 rounded-3xl border-[3px] border-shin-outline space-y-4 transition-all ${
              isP2Winner ? 'bg-shin-yellow/20 border-shin-yellow shadow-sticker' : 'bg-shin-navy'
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-3xl bg-shin-red border-[3px] border-shin-outline flex items-center justify-center text-3xl font-bangers text-white shadow-sticker-sm">
                  {p2Name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bangers text-white tracking-wider">{p2Name}</h2>
                    {isP2Winner && <span className="text-xl">👑</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-comic font-bold text-shin-cream mt-0.5">
                    <span className="text-shin-red font-black">{p2Branch}</span>
                    <span>•</span>
                    <span>ELO {p2Elo}</span>
                  </div>
                </div>
              </div>

              {/* Progress & Health Bar */}
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-shin-muted">Tests Solved:</span>
                  <span className="text-shin-red font-bangers text-sm">{p2Progress.passed} / {p2Progress.total} ({p2Percent}%)</span>
                </div>
                <div className="w-full bg-shin-card h-4 rounded-full overflow-hidden border-[2px] border-shin-outline">
                  <div
                    className="h-full bg-gradient-to-r from-shin-red to-rose-400 rounded-full transition-all duration-300"
                    style={{ width: `${p2Percent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Winner Banner if concluded */}
          {matchStatus === 'completed' && (
            <div className="p-6 rounded-3xl bg-shin-yellow text-shin-outline border-[3.5px] border-shin-outline text-center space-y-2 shadow-sticker-lg animate-shin-bounce">
              <span className="text-4xl">🏆</span>
              <h3 className="text-4xl font-bangers tracking-wider">
                {isP1Winner ? `${p1Name} WINS THE DUEL!` : isP2Winner ? `${p2Name} WINS THE DUEL!` : 'MATCH CONCLUDED!'}
              </h3>
              <p className="font-comic font-black text-sm">
                Auditorium match resolved. Rating and department leaderboard updated!
              </p>
            </div>
          )}
        </div>
      </div>
    </ThemedBackground>
  );
};
export default Spectate;
