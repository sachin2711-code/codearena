import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Terminal, FileText } from 'lucide-react';
import { matchesApi } from '../services/api';
import { AnalysisPanel } from '../components/AnalysisPanel';
import { MatchAnalysis } from '../types';

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 font-sans">
      <button
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Arena</span>
      </button>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight font-mono">
            Match Editorial & Complexity Analysis
          </h1>
          <p className="text-xs font-mono text-zinc-500">Session ID: {matchId}</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3 font-mono text-xs">
          <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-zinc-500">Parsing AST and synthesizing algorithmic editorial...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
          {error}
        </div>
      ) : analysis ? (
        <AnalysisPanel analysis={analysis} />
      ) : null}
    </div>
  );
};
