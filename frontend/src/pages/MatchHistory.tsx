import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, ExternalLink } from 'lucide-react';
import { matchesApi } from '../services/api';
import { Match } from '../types';
import { useAuthStore } from '../stores/authStore';
import { ThemedBackground } from '../components/ThemedBackground';

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
    <ThemedBackground variant="history">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-3xl bg-shin-blue border-[3px] border-shin-outline flex items-center justify-center shadow-sticker animate-shin-bounce flex-shrink-0">
            <History className="w-7 h-7 text-shin-outline" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-bangers text-white tracking-wide">Battle Archive</h1>
            <p className="text-xs text-shin-cream font-comic font-bold">Chronological history of 1v1 competitive coding duels</p>
          </div>
        </div>

        {/* Match List Card */}
        <div className="card-shin bg-shin-card p-0 overflow-hidden shadow-sticker-lg">
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-[3px] border-shin-outline border-t-shin-yellow rounded-full animate-spin" />
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center py-20 space-y-3 p-4">
              <div className="text-5xl">📜</div>
              <p className="font-bangers text-2xl text-white">No battle logs recorded yet!</p>
              <p className="font-comic font-bold text-xs text-shin-muted">Your contest history will be preserved here after your first battle.</p>
            </div>
          ) : (
            <div className="divide-y-[2px] divide-shin-outline/60">
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
                    className="px-6 py-4 flex items-center justify-between hover:bg-shin-navy/60 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Result badge */}
                      <span
                        className={`w-20 text-center px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border-[2px] border-shin-outline flex-shrink-0 ${
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
                          {m.created_at ? new Date(m.created_at).toLocaleString() : 'Recent'}
                          {m.duration_seconds
                            ? ` • ${Math.floor(m.duration_seconds / 60)}m ${m.duration_seconds % 60}s`
                            : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-shin-muted group-hover:text-shin-yellow font-bangers tracking-wider text-sm transition-colors flex-shrink-0">
                      <span>Editorial</span>
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
