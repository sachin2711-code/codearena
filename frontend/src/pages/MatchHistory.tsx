import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Swords, ExternalLink } from 'lucide-react';
import { matchesApi } from '../services/api';
import { Match } from '../types';
import { useAuthStore } from '../stores/authStore';

export const MatchHistory: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await matchesApi.getHistory(1, 20);
        setMatches(data.matches);
      } catch (err) {
        console.error('Failed to load history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
          <History className="w-5 h-5 text-zinc-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight font-mono">Match Archive</h1>
          <p className="text-xs text-zinc-400">Chronological history of 1v1 competitive coding duels</p>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden font-mono text-xs">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <p>No contest sessions found.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {matches.map((m) => {
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
                  className="px-5 py-3.5 flex items-center justify-between hover:bg-zinc-900/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isWinner
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : isActive
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : isDraw
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isWinner ? 'AC • WIN' : isActive ? 'ACTIVE' : isDraw ? 'DRAW' : 'WA • LOSS'}
                    </span>
                    <div>
                      <div className="text-zinc-200 font-sans font-medium text-sm flex items-center gap-2">
                        <span>{title}</span>
                        <span className="text-xs text-zinc-500 font-mono font-normal">vs {opponent}</span>
                      </div>
                      <div className="text-zinc-500 text-[11px] font-mono">
                        {m.created_at ? new Date(m.created_at).toLocaleString() : 'Recent'}
                        {m.duration_seconds ? ` • ${Math.floor(m.duration_seconds / 60)}m ${m.duration_seconds % 60}s` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-zinc-400 hover:text-emerald-400 text-xs transition-colors">
                    <span>Editorial</span>
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
