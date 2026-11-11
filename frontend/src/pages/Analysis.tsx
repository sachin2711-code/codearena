import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Zap } from 'lucide-react';
import { matchesApi } from '../services/api';
import { AnalysisPanel } from '../components/AnalysisPanel';
import { MatchAnalysis } from '../types';
import { ThemedBackground } from '../components/ThemedBackground';

export const Analysis: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) return;

    const fetchAnalysis = async () => {
      try {
        const data = await matchesApi.getAnalysis(matchId);
        setAnalysis(data);
      } catch (err: any) {
        console.error('Failed to get match analysis', err);
        setError('Editorial is unavailable for this match session.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [matchId]);

  return (
    <ThemedBackground variant="battle">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-xs font-bangers text-shin-yellow hover:text-white transition-colors bg-shin-navy px-3 py-1.5 rounded-xl border-[2px] border-shin-outline shadow-sticker-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO ARENA</span>
        </button>

        <div className="card-shin bg-shin-card flex items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-shin-yellow border-[3px] border-shin-outline flex items-center justify-center text-shin-outline shadow-sticker animate-shin-bounce flex-shrink-0">
              <FileText className="w-7 h-7" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-bangers text-white tracking-wide">
                Match Editorial & Complexity Breakdown
              </h1>
              <p className="text-xs font-mono text-shin-cream">Match ID: {matchId}</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-shin-blue border-[2px] border-shin-outline text-shin-outline font-black text-xs shadow-sticker-sm">
            <Zap className="w-3.5 h-3.5 fill-shin-outline" />
            <span>AI Editorial</span>
          </div>
        </div>

        {loading ? (
          <div className="card-shin bg-shin-card py-20 text-center space-y-4">
            <div className="w-10 h-10 border-[3.5px] border-shin-outline border-t-shin-yellow rounded-full animate-spin mx-auto" />
            <p className="font-comic font-bold text-sm text-shin-cream">
              Action Kamen AI is analyzing algorithmic complexity & test coverage...
            </p>
          </div>
        ) : error ? (
          <div className="card-shin bg-shin-card p-6 border-shin-red text-shin-red text-sm font-comic font-bold">
            {error}
          </div>
        ) : analysis ? (
          <AnalysisPanel analysis={analysis} />
        ) : null}
      </div>
    </ThemedBackground>
  );
};
export default Analysis;
