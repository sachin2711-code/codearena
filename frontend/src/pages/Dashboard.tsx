import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Trophy, Activity, Target, Clock, ArrowRight, ChevronRight, ExternalLink, Star, Zap, Bot } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { matchesApi } from '../services/api';
import { Match } from '../types';
import { ThemedBackground } from '../components/ThemedBackground';

export const Dashboard: React.FC = () => {
  const { user, fetchUser } = useAuthStore();
  const navigate = useNavigate();
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        const data = await matchesApi.getHistory(1, 10);
        setRecentMatches(data.matches);
      } catch (err) {
        console.error('Failed to load recent matches', err);
      } finally {
        setLoading(false);
      }
    };
    loadMatches();
    fetchUser();
  }, []);

  const userId = user?.id;
  const wins = user ? (user.wins || 0) : recentMatches.filter(m => userId && m.winner_id === userId).length;
  const totalMatches = user
    ? Math.max(user.total_matches || 0, user.wins + user.losses + user.draws, recentMatches.length)
    : recentMatches.length;
  const losses = user ? (user.losses || 0) : Math.max(0, totalMatches - wins);
  const draws = user?.draws || 0;
  const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const solvedCount = user?.solved_problems !== undefined ? user.solved_problems : wins;

  const getTierName = (elo: number) => {
    if (elo >= 2200) return '👑 Action Kamen Master';
    if (elo >= 1900) return '⚡ Quantum Robot Knight';
    if (elo >= 1600) return '🛡️ Kasukabe Defense Force';
    if (elo >= 1400) return '🎯 Chocobi Specialist';
    return '🌱 Futaba Apprentice';
  };

  const userElo = user?.elo_rating || 1200;

  return (
    <ThemedBackground variant="dashboard">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header Profile Banner */}
        <div className="card-shin bg-shin-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="flex items-center gap-5">
            {/* Shinchan Avatar Frame */}
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-shin-yellow border-[3px] border-shin-outline flex items-center justify-center text-3xl font-bangers text-shin-outline shadow-sticker animate-shin-bounce flex-shrink-0">
              {user?.username ? user.username.slice(0, 2).toUpperCase() : 'CP'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-bangers text-white tracking-wide">
                  {user?.username}
                </h1>
                <span className="px-3 py-1 rounded-xl text-xs font-black bg-shin-yellow text-shin-outline border-[2px] border-shin-outline shadow-sticker-sm">
                  {getTierName(userElo)}
                </span>
              </div>
              <p className="text-xs font-mono text-shin-muted mt-1">{user?.email}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => navigate('/duel')}
              className="btn-shin-outline w-full sm:w-auto px-5 py-3"
            >
              <Swords className="w-4 h-4" />
              <span className="font-bangers text-base tracking-wide">Challenge Friend</span>
            </button>

            <button
              onClick={() => navigate('/matchmaking')}
              className="btn-shin-yellow w-full sm:w-auto px-6 py-3 shadow-sticker-lg"
            >
              <Zap className="w-4 h-4 fill-shin-red text-shin-red" />
              <span className="font-bangers text-base tracking-wide">FIND 1V1 MATCH</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Rating */}
          <div className="card-shin bg-shin-card p-4 space-y-1 hover:-translate-y-1 transition-all hover:shadow-sticker-yellow">
            <div className="flex items-center justify-between text-xs text-shin-muted font-bangers tracking-wider text-sm">
              <span>Rating</span>
              <Star className="w-4 h-4 text-shin-yellow fill-shin-yellow" />
            </div>
            <div className="text-3xl font-bangers text-shin-yellow tracking-wider">{userElo}</div>
            <div className="text-[11px] text-shin-muted font-comic font-black">K-Factor: 32</div>
          </div>

          {/* Win Rate */}
          <div className="card-shin bg-shin-card p-4 space-y-1 hover:-translate-y-1 transition-all hover:shadow-sticker-blue">
            <div className="flex items-center justify-between text-xs text-shin-muted font-bangers tracking-wider text-sm">
              <span>Win Rate</span>
              <Activity className="w-4 h-4 text-shin-blue" />
            </div>
            <div className="text-3xl font-bangers text-shin-blue tracking-wider">{winRate}%</div>
            <div className="text-[11px] text-shin-muted font-mono font-bold">
              {wins}W / {losses}L / {draws}D
            </div>
          </div>

          {/* Total Duels */}
          <div className="card-shin bg-shin-card p-4 space-y-1 hover:-translate-y-1 transition-all">
            <div className="flex items-center justify-between text-xs text-shin-muted font-bangers tracking-wider text-sm">
              <span>Total Duels</span>
              <Swords className="w-4 h-4 text-shin-muted" />
            </div>
            <div className="text-3xl font-bangers text-white tracking-wider">{totalMatches}</div>
            <div className="text-[11px] text-shin-muted font-comic font-black">All competitive modes</div>
          </div>

          {/* Solved Problems */}
          <div className="card-shin bg-shin-card p-4 space-y-1 hover:-translate-y-1 transition-all hover:shadow-sticker-red">
            <div className="flex items-center justify-between text-xs text-shin-muted font-bangers tracking-wider text-sm">
              <span>Solved</span>
              <Target className="w-4 h-4 text-shin-red" />
            </div>
            <div className="text-3xl font-bangers text-shin-red tracking-wider">{solvedCount}</div>
            <div className="text-[11px] text-shin-muted font-comic font-black">100% test cases passed</div>
          </div>
        </div>

        {/* Match History Table */}
        <div className="card-shin bg-shin-card p-0 overflow-hidden">
          <div className="px-6 py-4 bg-shin-navy border-b-[3px] border-shin-outline flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-shin-yellow" />
              <h2 className="text-xl font-bangers text-white tracking-wider">
                Recent Competitive Battles
              </h2>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="text-xs font-comic font-black text-shin-yellow hover:text-white transition-colors flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <div className="w-8 h-8 border-[3px] border-shin-outline border-t-shin-yellow rounded-full animate-spin" />
            </div>
          ) : recentMatches.length === 0 ? (
            <div className="text-center py-16 text-shin-muted space-y-2 p-4">
              <div className="text-4xl mb-2">⚔️</div>
              <p className="font-bangers text-xl text-white tracking-wide">No battles on record yet!</p>
              <p className="font-comic font-bold text-xs text-shin-muted">Hit "FIND 1V1 MATCH" above to start your first duel.</p>
            </div>
          ) : (
            <div className="divide-y-[2px] divide-shin-outline/60 font-mono text-xs">
              {recentMatches.map((m) => {
                const isWinner = m.winner_id === user?.id;
                const isCompleted = m.status === 'completed';
                const isDraw = !m.winner_id && isCompleted;
                const isActive = m.status === 'active';

                const title = m.problem_title || m.problem?.title || `Duel #${m.id.slice(0, 8)}`;
                const opponent = m.opponent_username || (m.player1_id === user?.id ? m.player2?.username : m.player1?.username) || 'ArenaBot';

                return (
                  <div
                    key={m.id}
                    onClick={() => navigate(`/analysis/${m.id}`)}
                    className="px-6 py-4 flex items-center justify-between hover:bg-shin-navy/60 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border-[2px] border-shin-outline ${
                          isWinner
                            ? 'bg-shin-yellow text-shin-outline shadow-sticker-sm'
                            : isActive
                            ? 'bg-shin-blue text-shin-outline shadow-sticker-sm'
                            : isDraw
                            ? 'bg-shin-card text-shin-muted shadow-sticker-sm'
                            : 'bg-shin-red text-white shadow-sticker-sm'
                        }`}
                      >
                        {isWinner ? '✓ WIN' : isActive ? '● LIVE' : isDraw ? '— DRAW' : '✗ LOSS'}
                      </span>

                      <div>
                        <div className="text-white font-comic font-bold text-base flex items-center gap-2">
                          <span>{title}</span>
                          <span className="text-xs text-shin-muted font-mono font-normal">vs {opponent}</span>
                        </div>
                        <div className="text-shin-muted text-[11px] font-mono mt-0.5">
                          {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Recent'}
                          {m.duration_seconds ? ` • ${Math.floor(m.duration_seconds / 60)}m ${m.duration_seconds % 60}s` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-shin-muted group-hover:text-shin-yellow transition-colors text-xs font-bangers tracking-wider text-sm">
                      <span>Review</span>
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ThemedBackground>
  );
};
