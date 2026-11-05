import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Terminal } from 'lucide-react';
import { leaderboardApi } from '../services/api';
import { LeaderboardEntry } from '../types';
import { useAuthStore } from '../stores/authStore';

export const Leaderboard: React.FC = () => {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await leaderboardApi.get(1, 50);
        setEntries(data.leaderboard);
      } catch (err) {
        console.error('Failed to load leaderboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <span className="font-mono font-bold text-amber-400">#1</span>;
    if (rank === 2) return <span className="font-mono font-bold text-zinc-300">#2</span>;
    if (rank === 3) return <span className="font-mono font-bold text-amber-600">#3</span>;
    return <span className="font-mono text-zinc-500">#{rank}</span>;
  };

  const getTier = (elo: number) => {
    if (elo >= 2200) return 'Grandmaster';
    if (elo >= 1900) return 'Master';
    if (elo >= 1600) return 'Knight';
    if (elo >= 1400) return 'Specialist';
    return 'Apprentice';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-400">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight font-mono">Global ELO Standings</h1>
          <p className="text-xs text-zinc-400">Ranked algorithmic rating pool calculated via standard chess K=32 formulation</p>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden font-mono text-xs">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">No ranked contenders registered yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-zinc-300">
              <thead className="bg-[#111217] text-[11px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-5 py-3 w-16">Rank</th>
                  <th className="px-5 py-3">Coder</th>
                  <th className="px-5 py-3">Tier</th>
                  <th className="px-5 py-3">ELO</th>
                  <th className="px-5 py-3">Record (W/L/D)</th>
                  <th className="px-5 py-3">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {entries.map(({ rank, user: entryUser }) => {
                  const isCurrent = entryUser.id === user?.id;
                  const total = entryUser.wins + entryUser.losses + entryUser.draws;
                  const rate = total > 0 ? Math.round((entryUser.wins / total) * 100) : 0;

                  return (
                    <tr
                      key={entryUser.id}
                      className={`hover:bg-zinc-900/40 transition-colors ${
                        isCurrent ? 'bg-zinc-900/60 font-semibold' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5">{getRankBadge(rank)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                            {entryUser.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-sans font-medium text-white">
                            {entryUser.username}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-400 text-[11px]">
                        {getTier(entryUser.elo_rating)}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-amber-400">
                        {entryUser.elo_rating}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-400 text-[11px]">
                        <span className="text-emerald-400">{entryUser.wins}W</span>
                        <span className="text-zinc-600 mx-1">/</span>
                        <span className="text-rose-400">{entryUser.losses}L</span>
                        <span className="text-zinc-600 mx-1">/</span>
                        <span>{entryUser.draws}D</span>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-300 font-semibold">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
