import React from 'react';
import { MatchAnalysis } from '../types';
import { Code, CheckCircle2, AlertTriangle, ArrowRight, Layers, FileCode } from 'lucide-react';

interface AnalysisPanelProps {
  analysis: MatchAnalysis;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis }) => {
  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Side-by-Side Dual Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Player 1 Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <span className="font-bold text-white text-sm font-sans">Your Implementation</span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px]">
              Efficiency: {analysis.player1_analysis?.code_quality || 8}/10
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#101116] p-3 rounded border border-zinc-900">
              <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1">Time Complexity</span>
              <span className="font-bold text-emerald-400 text-sm">
                {analysis.player1_analysis?.time_complexity || 'O(n)'}
              </span>
            </div>
            <div className="bg-[#101116] p-3 rounded border border-zinc-900">
              <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1">Space Complexity</span>
              <span className="font-bold text-blue-400 text-sm">
                {analysis.player1_analysis?.space_complexity || 'O(n)'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Approach Detected</span>
            <p className="text-zinc-300 font-sans text-xs leading-relaxed">
              {analysis.player1_analysis?.approach || 'Single-pass hash table with complement lookup'}
            </p>
          </div>

          {analysis.player1_analysis?.issues && analysis.player1_analysis.issues.length > 0 && (
            <div className="pt-2 border-t border-zinc-800/80">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-2">Observations & Inefficiencies</span>
              <ul className="space-y-1.5 text-zinc-400 font-sans text-xs">
                {analysis.player1_analysis.issues.map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-mono mt-0.5">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Player 2 Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <span className="font-bold text-zinc-400 text-sm font-sans">Opponent Implementation</span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 text-[11px]">
              Efficiency: {analysis.player2_analysis?.code_quality || 7}/10
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#101116] p-3 rounded border border-zinc-900">
              <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1">Time Complexity</span>
              <span className="font-bold text-zinc-300 text-sm">
                {analysis.player2_analysis?.time_complexity || 'O(n²)'}
              </span>
            </div>
            <div className="bg-[#101116] p-3 rounded border border-zinc-900">
              <span className="text-zinc-500 block text-[10px] uppercase tracking-wider mb-1">Space Complexity</span>
              <span className="font-bold text-zinc-300 text-sm">
                {analysis.player2_analysis?.space_complexity || 'O(1)'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Approach Detected</span>
            <p className="text-zinc-400 font-sans text-xs leading-relaxed">
              {analysis.player2_analysis?.approach || 'Nested loop brute-force search'}
            </p>
          </div>
        </div>
      </div>

      {/* Optimal Solution Editorial */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-2 text-zinc-200 font-sans font-bold text-sm">
          <FileCode className="w-4 h-4 text-emerald-400" />
          <span>Optimal Editorial Implementation</span>
        </div>
        <div className="bg-[#0b0c10] border border-zinc-900 rounded p-4 overflow-x-auto text-zinc-200 text-xs leading-relaxed">
          <pre>{analysis.optimal_solution || '// Optimal algorithmic solution'}</pre>
        </div>
      </div>

      {/* Key Takeaways */}
      {analysis.improvement_tips && analysis.improvement_tips.length > 0 && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-5 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300 block">
            Algorithmic Takeaways
          </span>
          <ul className="space-y-1.5 font-sans text-xs text-zinc-400">
            {analysis.improvement_tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
