import React, { useEffect, useState } from 'react';
import { Trophy, Star } from 'lucide-react';
import { leaderboardApi } from '../services/api';
import { LeaderboardEntry } from '../types';
import { useAuthStore } from '../stores/authStore';
import { ThemedBackground } from '../components/ThemedBackground';

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
    if (rank === 1) return <span className="font-bangers text-2xl text-shin-yellow drop-shadow-sm">🥇 #1</span>;
    if (rank === 2) return <span className="font-bangers text-xl text-shin-cream">🥈 #2</span>;
    if (rank === 3) return <span className="font-bangers text-xl text-amber-500">🥉 #3</span>;
    return <span className="font-bangers text-lg text-shin-muted">#{rank}</span>;
  };

  const getTier = (elo: number) => {
    if (elo >= 2200) return { label: '👑 Action Kamen Master', color: 'text-shin-yellow' };
    if (elo >= 1900) return { label: '⚡ Quantum Knight', color: 'text-shin-blue' };
    if (elo >= 1600) return { label: '🛡️ Defense Force', color: 'text-purple-300' };
    if (elo >= 1400) return { label: '🎯 Chocobi Star', color: 'text-shin-red' };
    return { label: '🌱 Apprentice', color: 'text-shin-muted' };
  };

  return (
    <ThemedBackground variant="leaderboard">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-shin-yellow border-[3px] border-shin-outline flex items-center justify-center shadow-sticker animate-shin-bounce flex-shrink-0">
            <Trophy className="w-7 h-7 text-shin-outline" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-bangers text-white tracking-wide">Global Rankings</h1>
            <p className="text-xs text-shin-cream font-comic font-bold">Kasukabe Algorithmic Rating Pool • Standard Chess K=32</p>
          </div>
        </div>

        {/* Table Card */}
        <div className="card-shin bg-shin-card p-0 overflow-hidden shadow-sticker-lg">
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-[3px] border-shin-outline border-t-shin-yellow rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-20 text-shin-muted space-y-3">
              <div className="text-5xl">🏆</div>
              <p className="font-bangers text-2xl text-white">No ranked contenders registered yet!</p>
              <p className="font-comic font-bold text-xs text-shin-muted">Be the first to battle and claim #1 on the leaderboard.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-sans">
                <thead className="bg-shin-navy text-xs uppercase tracking-wider text-shin-muted font-bangers border-b-[3px] border-shin-outline">
                  <tr>
                    <th className="px-6 py-4 w-20">Rank</th>
                    <th className="px-6 py-4">Coder</th>
                    <th className="px-6 py-4">Tier</th>
                    <th className="px-6 py-4">
                      <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-shin-yellow fill-shin-yellow" />ELO</span>
                    </th>
                    <th className="px-6 py-4">Record (W/L/D)</th>
                    <th className="px-6 py-4">Win Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y-[2px] divide-shin-outline/60 font-mono text-xs">
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
                            ? 'bg-shin-yellow/15 hover:bg-shin-yellow/20 font-bold'
                            : rank <= 3
                            ? 'hover:bg-shin-navy/70'
                            : 'hover:bg-shin-navy/40'
                        }`}
                      >
                        <td className="px-6 py-4">{getRankDisplay(rank)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl border-[2px] border-shin-outline flex items-center justify-center text-xs font-black shadow-sticker-sm ${
                              isCurrent
                                ? 'bg-shin-yellow text-shin-outline'
                                : 'bg-shin-navy text-white'
                            }`}>
                              {entryUser.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-comic font-bold text-base text-white">
                              {entryUser.username}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-shin-yellow text-shin-outline border-[1.5px] border-shin-outline font-black">
                                YOU
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`px-6 py-4 text-xs font-comic font-black ${tier.color}`}>
                          {tier.label}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bangers text-lg text-shin-yellow tracking-wider">{entryUser.elo_rating}</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono font-bold">
                          <span className="text-green-400">{entryUser.wins}W</span>
                          <span className="text-shin-muted mx-1">/</span>
                          <span className="text-shin-red">{entryUser.losses}L</span>
                          <span className="text-shin-muted mx-1">/</span>
                          <span className="text-shin-muted">{entryUser.draws}D</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-16 h-2 bg-shin-navy rounded-full overflow-hidden border-[1.5px] border-shin-outline">
                              <div
                                className="h-full bg-shin-yellow rounded-full transition-all"
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="font-bold text-white text-xs">{rate}%</span>
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
    </ThemedBackground>
  );
};
