import React, { useEffect, useState } from 'react';
import { Trophy, Star } from 'lucide-react';
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

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return <span className="font-black text-shin-yellow text-base">🥇</span>;
    if (rank === 2) return <span className="font-black text-shin-white text-base">🥈</span>;
    if (rank === 3) return <span className="font-black text-amber-600 text-base">🥉</span>;
    return <span className="font-black text-shin-muted font-mono">#{rank}</span>;
  };

  const getTier = (elo: number) => {
    if (elo >= 2200) return { label: '👑 Grandmaster', color: 'text-shin-yellow' };
    if (elo >= 1900) return { label: '⚡ Master', color: 'text-shin-blue' };
    if (elo >= 1600) return { label: '🛡️ Knight', color: 'text-purple-400' };
    if (elo >= 1400) return { label: '🎯 Specialist', color: 'text-shin-red' };
    return { label: '🌱 Apprentice', color: 'text-shin-muted' };
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-shin-yellow flex items-center justify-center shadow-lg shadow-shin-yellow/30 animate-shin-bounce">
          <Trophy className="w-6 h-6 text-shin-bg" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Global Rankings</h1>
          <p className="text-xs text-shin-muted font-mono font-bold">ELO rating pool • Chess K=32 formulation</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-shin-panel border-2 border-shin-border rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 0 30px rgba(255,215,0,0.05)' }}>
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-6 h-6 border-2 border-shin-border border-t-shin-yellow rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-shin-muted font-bold">
            <div className="text-5xl mb-4">🏆</div>
            <p>No ranked contenders yet. Be the first!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-shin-bg text-[11px] uppercase tracking-wider text-shin-muted font-black border-b-2 border-shin-border">
                <tr>
                  <th className="px-5 py-3.5 w-16">Rank</th>
                  <th className="px-5 py-3.5">Coder</th>
                  <th className="px-5 py-3.5">Tier</th>
                  <th className="px-5 py-3.5">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-shin-yellow" />ELO</span>
                  </th>
                  <th className="px-5 py-3.5">Record</th>
                  <th className="px-5 py-3.5">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-shin-border">
                {entries.map(({ rank, user: entryUser }) => {
                  const isCurrent = entryUser.id === user?.id;
                  const total = entryUser.wins + entryUser.losses + entryUser.draws;
                  const rate = total > 0 ? Math.round((entryUser.wins / total) * 100) : 0;
                  const tier = getTier(entryUser.elo_rating);

                  return (
                    <tr
                      key={entryUser.id}
                      className={`transition-colors ${
                        isCurrent
                          ? 'bg-shin-yellow/8 hover:bg-shin-yellow/12'
                          : rank <= 3
                          ? 'hover:bg-shin-yellow/5'
                          : 'hover:bg-shin-panel/60'
                      }`}
                    >
                      <td className="px-5 py-3.5 text-center">{getRankDisplay(rank)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                            isCurrent
                              ? 'bg-shin-yellow text-shin-bg shadow-md shadow-shin-yellow/30'
                              : 'bg-shin-border text-shin-white'
                          }`}>
                            {entryUser.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-black text-shin-white">{entryUser.username}</span>
                          {isCurrent && (
                            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-shin-yellow/20 text-shin-yellow border border-shin-yellow/30 font-black">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`px-5 py-3.5 text-xs font-bold ${tier.color}`}>
                        {tier.label}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-black text-shin-yellow font-mono">{entryUser.elo_rating}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono font-bold">
                        <span className="text-green-400">{entryUser.wins}W</span>
                        <span className="text-shin-border mx-1">/</span>
                        <span className="text-shin-red">{entryUser.losses}L</span>
                        <span className="text-shin-border mx-1">/</span>
                        <span className="text-shin-muted">{entryUser.draws}D</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-shin-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-shin-yellow rounded-full transition-all"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="font-black text-shin-white text-xs font-mono">{rate}%</span>
                        </div>
                      </td>
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
