import React, { useEffect, useState } from 'react';
import { Trophy, Star, Users, Building2, Flame, Award, Filter } from 'lucide-react';
import { leaderboardApi } from '../services/api';
import { DepartmentStanding, LeaderboardEntry } from '../types';
import { useAuthStore } from '../stores/authStore';
import { ThemedBackground } from '../components/ThemedBackground';

export const Leaderboard: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'individual' | 'department'>('individual');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [departments, setDepartments] = useState<DepartmentStanding[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const fetchIndividualLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await leaderboardApi.get(1, 50, selectedBranch, selectedYear);
      setEntries(data.leaderboard);
    } catch (err) {
      console.error('Failed to load leaderboard', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentStandings = async () => {
    setLoading(true);
    try {
      const data = await leaderboardApi.getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error('Failed to load department standings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'individual') {
      fetchIndividualLeaderboard();
    } else {
      fetchDepartmentStandings();
    }
  }, [activeTab, selectedBranch, selectedYear]);

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-shin-yellow border-[3px] border-shin-outline flex items-center justify-center shadow-sticker animate-shin-bounce flex-shrink-0">
              <Trophy className="w-7 h-7 text-shin-outline" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-4xl font-bangers text-white tracking-wide">Campus Leaderboard</h1>
              <p className="text-xs text-shin-cream font-comic font-bold">
                Competitive Coding Standings & Department Rivalry • Standard Chess K=32
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 bg-shin-navy p-1.5 rounded-2xl border-[2.5px] border-shin-outline shadow-sticker-sm">
            <button
              onClick={() => setActiveTab('individual')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bangers tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === 'individual'
                  ? 'bg-shin-yellow text-shin-outline shadow-sticker-sm'
                  : 'text-shin-cream hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>INDIVIDUAL CODERS</span>
            </button>
            <button
              onClick={() => setActiveTab('department')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bangers tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === 'department'
                  ? 'bg-shin-yellow text-shin-outline shadow-sticker-sm'
                  : 'text-shin-cream hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>BRANCH RIVALRY</span>
            </button>
          </div>
        </div>

        {/* Filters Bar for Individual View */}
        {activeTab === 'individual' && (
          <div className="card-shin bg-shin-card p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-bangers text-shin-yellow tracking-wider">
              <Filter className="w-4 h-4" />
              <span>FILTER ARENA BY CAMPUS BATCH:</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Branch Selector */}
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-shin-navy border-[2px] border-shin-outline rounded-xl px-3 py-1.5 text-xs text-white font-bangers tracking-wide focus:outline-none focus:border-shin-yellow shadow-sticker-sm"
              >
                <option value="ALL">All Departments</option>
                <option value="CSE">CSE</option>
                <option value="IT">IT</option>
                <option value="AIML">AIML</option>
                <option value="ECE">ECE</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
                <option value="EE">EE</option>
              </select>

              {/* Year Selector */}
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-shin-navy border-[2px] border-shin-outline rounded-xl px-3 py-1.5 text-xs text-white font-bangers tracking-wide focus:outline-none focus:border-shin-yellow shadow-sticker-sm"
              >
                <option value="ALL">All Academic Years</option>
                <option value="1st Year">1st Year (Freshmen)</option>
                <option value="2nd Year">2nd Year (Sophomore)</option>
                <option value="3rd Year">3rd Year (Junior)</option>
                <option value="4th Year">4th Year (Senior)</option>
                <option value="Alumni">Alumni</option>
              </select>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        {activeTab === 'individual' ? (
          /* Individual Coders Table */
          <div className="card-shin bg-shin-card p-0 overflow-hidden shadow-sticker-lg">
            {loading ? (
              <div className="py-20 flex justify-center">
                <div className="w-8 h-8 border-[3px] border-shin-outline border-t-shin-yellow rounded-full animate-spin" />
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-20 text-shin-muted space-y-3">
                <div className="text-5xl">🏆</div>
                <p className="font-bangers text-2xl text-white">No ranked contenders found for this filter!</p>
                <p className="font-comic font-bold text-xs text-shin-muted">
                  Challenge someone from this department to set the first score.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm font-sans">
                  <thead className="bg-shin-navy text-xs uppercase tracking-wider text-shin-muted font-bangers border-b-[3px] border-shin-outline">
                    <tr>
                      <th className="px-6 py-4 w-20">Rank</th>
                      <th className="px-6 py-4">Coder & Branch</th>
                      <th className="px-6 py-4">Tier</th>
                      <th className="px-6 py-4">
                        <span className="flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 text-shin-yellow fill-shin-yellow" />
                          ELO
                        </span>
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
                          <td className="px-6 py-4 whitespace-nowrap">{getRankDisplay(rank)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-2xl bg-shin-yellow border-[2px] border-shin-outline flex items-center justify-center font-bangers text-shin-outline text-sm shadow-sticker-sm flex-shrink-0">
                                {entryUser.username.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-comic font-bold text-white text-sm flex items-center gap-2">
                                  <span>{entryUser.username}</span>
                                  {isCurrent && (
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bangers bg-shin-yellow text-shin-outline border border-shin-outline">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-comic font-bold text-shin-muted flex items-center gap-1.5 mt-0.5">
                                  <span className="text-shin-yellow font-black">{entryUser.branch || 'CSE'}</span>
                                  <span>•</span>
                                  <span>{entryUser.graduation_year || '3rd Year'}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`font-comic font-bold text-xs ${tier.color}`}>{tier.label}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bangers text-base text-shin-yellow tracking-wider">
                            {entryUser.elo_rating}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-shin-cream">
                            {entryUser.wins}W / {entryUser.losses}L / {entryUser.draws}D
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bangers text-sm text-shin-blue tracking-wide">
                            {rate}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Department Standings Cards */
          <div className="space-y-4">
            <div className="card-shin bg-shin-card p-6">
              <div className="flex items-center justify-between pb-4 border-b-[2px] border-shin-outline mb-6">
                <div>
                  <h2 className="text-2xl font-bangers text-white tracking-wide flex items-center gap-2">
                    <Flame className="w-6 h-6 text-shin-red fill-shin-red" />
                    <span>Inter-Department Pride Standings</span>
                  </h2>
                  <p className="text-xs text-shin-cream font-comic font-bold">
                    Aggregated by average ELO rating across registered branch coders
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-shin-blue text-shin-outline border-[2px] border-shin-outline font-bangers text-xs shadow-sticker-sm">
                  Kasukabe Trophy
                </span>
              </div>

              {loading ? (
                <div className="py-20 flex justify-center">
                  <div className="w-8 h-8 border-[3px] border-shin-outline border-t-shin-yellow rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departments.map((dept, index) => {
                    const isTop = index === 0;
                    return (
                      <div
                        key={dept.branch}
                        className={`card-shin p-5 space-y-3 transition-transform hover:-translate-y-1 ${
                          isTop ? 'bg-shin-yellow/10 border-shin-yellow' : 'bg-shin-navy'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-bangers text-2xl text-shin-yellow">
                              {index === 0 ? '👑 #1' : index === 1 ? '🥈 #2' : index === 2 ? '🥉 #3' : `#${index + 1}`}
                            </span>
                            <div>
                              <h3 className="font-bangers text-2xl text-white tracking-wider">{dept.branch}</h3>
                              <span className="text-[11px] font-comic font-bold text-shin-muted">
                                {dept.student_count} Student Contenders
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bangers text-shin-muted block">AVG ELO</span>
                            <span className="text-2xl font-bangers text-shin-yellow tracking-wider">
                              {dept.avg_elo}
                            </span>
                          </div>
                        </div>

                        {/* Relative Strength Meter */}
                        <div className="w-full bg-shin-card h-2.5 rounded-full overflow-hidden border border-shin-outline">
                          <div
                            className="bg-gradient-to-r from-shin-yellow to-shin-red h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(15, (dept.avg_elo / 2000) * 100))}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs font-comic font-bold text-shin-cream pt-1">
                          <div className="flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-shin-yellow" />
                            <span>Top Gun: <strong className="text-white">{dept.top_player || 'N/A'}</strong></span>
                          </div>
                          <span>Total Victories: <strong className="text-shin-blue">{dept.total_wins}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ThemedBackground>
  );
};
export default Leaderboard;
