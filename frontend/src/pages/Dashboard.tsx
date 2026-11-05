import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Trophy, Activity, Target, Clock, ArrowRight, ChevronRight, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { matchesApi } from '../services/api';
import { Match } from '../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
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
  }, []);

  const totalMatches = user ? user.wins + user.losses + user.draws : 0;
  const winRate = totalMatches > 0 && user ? Math.round((user.wins / totalMatches) * 100) : 0;

  const getTierName = (elo: number) => {
    if (elo >= 2200) return 'Grandmaster';
    if (elo >= 1900) return 'Master';
    if (elo >= 1600) return 'Knight';
    if (elo >= 1400) return 'Specialist';
    return 'Apprentice';
  };

  const userElo = user?.elo_rating || 1200;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 font-sans">
      {/* Header Profile Banner */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xl font-bold font-mono text-zinc-200">
            {user?.username ? user.username.slice(0, 2).toUpperCase() : 'CP'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {user?.username}
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-zinc-800 border border-zinc-700 text-zinc-300">
                {getTierName(userElo)}
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-400 mt-1">{user?.email}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => navigate('/duel')}
            className="w-full sm:w-auto px-5 py-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <span>CHALLENGE FRIEND</span>
          </button>

          <button
            onClick={() => navigate('/matchmaking')}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Swords className="w-4 h-4" />
            <span>FIND 1V1 MATCH</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>RATING</span>
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{userElo}</div>
          <div className="text-[11px] text-zinc-500 font-mono">K-Factor: 32</div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>WIN RATE</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">{winRate}%</div>
          <div className="text-[11px] text-zinc-500 font-mono">
            {user?.wins || 0}W / {user?.losses || 0}L / {user?.draws || 0}D
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>TOTAL DUELS</span>
            <Swords className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{totalMatches}</div>
          <div className="text-[11px] text-zinc-500 font-mono">All competitive modes</div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>SOLVED PROBLEMS</span>
            <Target className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">{user?.wins || 0}</div>
          <div className="text-[11px] text-zinc-500 font-mono">100% test cases passed</div>
        </div>
      </div>

      {/* Match History Table */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Recent Competitive Matches
            </h2>
          </div>
          <button
            onClick={() => navigate('/history')}
            className="text-xs font-mono text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
          </div>
        ) : recentMatches.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs font-mono space-y-2">
            <p>No contest matches on record.</p>
            <p className="text-zinc-600">Hit "FIND 1V1 MATCH" above to start your first battle.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/70 font-mono text-xs">
            {recentMatches.map((m) => {
              const isWinner = m.winner_id === user?.id;
              const isDraw = !m.winner_id && m.status === 'completed';

              return (
                <div
                  key={m.id}
                  onClick={() => navigate(`/analysis/${m.id}`)}
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-zinc-800/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isWinner
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isDraw
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isWinner ? 'AC • WIN' : isDraw ? 'DRAW' : 'WA • LOSS'}
                    </span>

                    <div>
                      <div className="text-zinc-200 font-sans font-medium text-sm">
                        Match #{m.id.slice(0, 8)}
                      </div>
                      <div className="text-zinc-500 text-[11px]">
                        {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Recent'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-400 hover:text-emerald-400 transition-colors text-xs">
                    <span>Editorial & Review</span>
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
