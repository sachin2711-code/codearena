import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Trophy, Activity, Target, Clock, ArrowRight, ChevronRight, ExternalLink, Star, Zap } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { matchesApi } from '../services/api';
import { Match } from '../types';

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
    fetchUser(); // Refresh user stats (wins/losses/ELO) every time Dashboard mounts
  }, []);

  const totalMatches = user ? user.wins + user.losses + user.draws : 0;
  const winRate = totalMatches > 0 && user ? Math.round((user.wins / totalMatches) * 100) : 0;

  const getTierName = (elo: number) => {
    if (elo >= 2200) return '👑 Grandmaster';
    if (elo >= 1900) return '⚡ Master';
    if (elo >= 1600) return '🛡️ Knight';
    if (elo >= 1400) return '🎯 Specialist';
    return '🌱 Apprentice';
  };

  const userElo = user?.elo_rating || 1200;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans">
      {/* Header Profile Banner */}
      <div className="bg-shin-panel border-2 border-shin-yellow/25 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        style={{ boxShadow: '0 0 30px rgba(255,215,0,0.06)' }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-shin-yellow flex items-center justify-center text-2xl font-black text-shin-bg shadow-lg shadow-shin-yellow/30 animate-shin-bounce">
            {user?.username ? user.username.slice(0, 1).toUpperCase() : '?'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {user?.username}
              </h1>
              <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-shin-yellow/15 border border-shin-yellow/30 text-shin-yellow">
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
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-shin-border hover:bg-shin-border/80 border-2 border-shin-border hover:border-shin-muted text-shin-white font-black text-sm transition-all flex items-center justify-center gap-2"
          >
            <span>Challenge Friend</span>
          </button>

          <button
            onClick={() => navigate('/matchmaking')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-shin-yellow hover:bg-shin-yellow-soft text-shin-bg font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-shin-yellow/20"
            style={{ boxShadow: '3px 3px 0px #E8192C' }}
          >
            <Swords className="w-4 h-4" />
            <span>FIND 1V1 MATCH</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-shin-panel border-2 border-shin-yellow/20 hover:border-shin-yellow/40 rounded-2xl p-4 space-y-1 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-xs text-shin-muted font-black uppercase tracking-wider">
            <span>Rating</span>
            <Star className="w-3.5 h-3.5 text-shin-yellow" />
          </div>
          <div className="text-2xl font-black text-shin-yellow">{userElo}</div>
          <div className="text-[11px] text-shin-muted font-mono">K-Factor: 32</div>
        </div>

        <div className="bg-shin-panel border-2 border-shin-blue/20 hover:border-shin-blue/40 rounded-2xl p-4 space-y-1 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-xs text-shin-muted font-black uppercase tracking-wider">
            <span>Win Rate</span>
            <Activity className="w-3.5 h-3.5 text-shin-blue" />
          </div>
          <div className="text-2xl font-black text-shin-blue">{winRate}%</div>
          <div className="text-[11px] text-shin-muted font-mono">
            {user?.wins || 0}W / {user?.losses || 0}L / {user?.draws || 0}D
          </div>
        </div>

        <div className="bg-shin-panel border-2 border-shin-muted/20 hover:border-shin-muted/40 rounded-2xl p-4 space-y-1 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-xs text-shin-muted font-black uppercase tracking-wider">
            <span>Total Duels</span>
            <Swords className="w-3.5 h-3.5 text-shin-muted" />
          </div>
          <div className="text-2xl font-black text-white">{totalMatches}</div>
          <div className="text-[11px] text-shin-muted font-mono">All competitive modes</div>
        </div>

        <div className="bg-shin-panel border-2 border-shin-red/20 hover:border-shin-red/40 rounded-2xl p-4 space-y-1 transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between text-xs text-shin-muted font-black uppercase tracking-wider">
            <span>Solved</span>
            <Target className="w-3.5 h-3.5 text-shin-red" />
          </div>
          <div className="text-2xl font-black text-shin-red">{user?.wins || 0}</div>
          <div className="text-[11px] text-shin-muted font-mono">100% test cases passed</div>
        </div>
      </div>

      {/* Match History Table */}
      <div className="bg-shin-panel border-2 border-shin-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-shin-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-shin-yellow" />
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              Recent Battles
            </h2>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="text-xs font-black text-shin-muted hover:text-shin-yellow transition-colors flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-5 h-5 border-2 border-shin-border border-t-shin-yellow rounded-full animate-spin" />
          </div>
        ) : recentMatches.length === 0 ? (
          <div className="text-center py-14 text-shin-muted text-sm font-bold space-y-2">
            <div className="text-4xl mb-3">⚔️</div>
            <p>No battles on record yet.</p>
            <p className="text-shin-muted/60 text-xs font-mono">Hit "FIND 1V1 MATCH" above to start your first duel!</p>
          </div>
        ) : (
          <div className="divide-y divide-shin-border font-mono text-xs">
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
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-shin-yellow/5 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        isWinner
                          ? 'bg-shin-yellow/15 text-shin-yellow border border-shin-yellow/30'
                          : isActive
                          ? 'bg-shin-blue/15 text-shin-blue border border-shin-blue/30'
                          : isDraw
                          ? 'bg-shin-muted/15 text-shin-muted border border-shin-muted/30'
                          : 'bg-shin-red/15 text-shin-red border border-shin-red/30'
                      }`}
                    >
                      {isWinner ? '✓ WIN' : isActive ? '● LIVE' : isDraw ? '— DRAW' : '✗ LOSS'}
                    </span>

                    <div>
                      <div className="text-shin-white font-sans font-bold text-sm flex items-center gap-2">
                        <span>{title}</span>
                        <span className="text-xs text-shin-muted font-mono font-normal">vs {opponent}</span>
                      </div>
                      <div className="text-shin-muted text-[11px] font-mono">
                        {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Recent'}
                        {m.duration_seconds ? ` • ${Math.floor(m.duration_seconds / 60)}m ${m.duration_seconds % 60}s` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-shin-muted hover:text-shin-yellow transition-colors text-xs font-black">
                    <span>Review</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
