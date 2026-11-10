import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, ExternalLink } from 'lucide-react';
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-shin-panel border-2 border-shin-blue/30 flex items-center justify-center shadow-lg shadow-shin-blue/10">
          <History className="w-6 h-6 text-shin-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Battle Archive</h1>
          <p className="text-xs text-shin-muted font-mono font-bold">Chronological history of 1v1 competitive coding duels</p>
        </div>
      </div>

      {/* Match List */}
      <div className="bg-shin-panel border-2 border-shin-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-6 h-6 border-2 border-shin-border border-t-shin-yellow rounded-full animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="text-5xl">⚔️</div>
            <p className="text-shin-muted font-black text-sm">No battles recorded yet.</p>
            <p className="text-shin-muted/60 font-mono text-xs">Your match history will appear here after your first duel.</p>
          </div>
        ) : (
          <div className="divide-y divide-shin-border">
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
                  className="px-5 py-4 flex items-center justify-between hover:bg-shin-yellow/5 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    {/* Result badge */}
                    <span
                      className={`w-16 text-center px-2 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex-shrink-0 ${
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
                      <div className="text-shin-white font-bold text-sm flex items-center gap-2">
                        <span>{title}</span>
                        <span className="text-xs text-shin-muted font-mono font-normal">vs {opponent}</span>
                      </div>
                      <div className="text-shin-muted text-[11px] font-mono mt-0.5">
                        {m.created_at ? new Date(m.created_at).toLocaleString() : 'Recent'}
                        {m.duration_seconds
                          ? ` • ${Math.floor(m.duration_seconds / 60)}m ${m.duration_seconds % 60}s`
                          : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-shin-muted group-hover:text-shin-yellow text-xs font-black transition-colors flex-shrink-0">
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
