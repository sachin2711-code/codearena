import React from 'react';
import { Trophy, Activity, Target, Terminal, Calendar } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export const Profile: React.FC = () => {
  const { user } = useAuthStore();

  const totalMatches = user ? user.wins + user.losses + user.draws : 0;
  const winRate = totalMatches > 0 && user ? Math.round((user.wins / totalMatches) * 100) : 0;

  const getTier = (elo: number) => {
    if (elo >= 2200) return 'Grandmaster';
    if (elo >= 1900) return 'Master';
    if (elo >= 1600) return 'Knight';
    if (elo >= 1400) return 'Specialist';
    return 'Apprentice';
  };

  const userElo = user?.elo_rating || 1200;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans">
      {/* Profile Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 relative">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-16 h-16 rounded-xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-2xl font-bold font-mono text-zinc-200">
            {user?.username ? user.username.slice(0, 2).toUpperCase() : 'CP'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2.5 justify-center sm:justify-start">
              <h1 className="text-2xl font-bold text-white tracking-tight">{user?.username}</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300">
                {getTier(userElo)}
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-400">{user?.email}</p>
            <div className="pt-2 flex items-center gap-3 font-mono text-xs text-zinc-400 justify-center sm:justify-start">
              <span className="text-amber-400 font-bold">{userElo} ELO</span>
              <span>•</span>
              <span>{user?.wins || 0} Wins</span>
              <span>•</span>
              <span>{winRate}% Win Rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 space-y-1">
          <div className="text-zinc-500 text-[10px] uppercase tracking-wider">Rating Metric</div>
          <div className="text-2xl font-bold text-white font-mono">{userElo}</div>
          <p className="text-zinc-400 text-[11px] font-sans">Calculated via chess-standard K=32 formulation</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 space-y-1">
          <div className="text-zinc-500 text-[10px] uppercase tracking-wider">Duel History</div>
          <div className="text-2xl font-bold text-white font-mono">{totalMatches}</div>
          <p className="text-zinc-400 text-[11px] font-sans">
            {user?.wins || 0}W - {user?.losses || 0}L - {user?.draws || 0}D
          </p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 space-y-1">
          <div className="text-zinc-500 text-[10px] uppercase tracking-wider">Contest Accuracy</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{winRate}%</div>
          <p className="text-zinc-400 text-[11px] font-sans">Percent of duels ending with accepted verdict</p>
        </div>
      </div>
    </div>
  );
};
