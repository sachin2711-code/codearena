import React from 'react';
import { MatchAnalysis } from '../types';
import { Code, CheckCircle2, AlertTriangle, ArrowRight, Layers, FileCode, Clock, Cpu } from 'lucide-react';

interface AnalysisPanelProps {
  analysis: MatchAnalysis;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis }) => {
  return (
    <div className="space-y-6">
      {/* Side-by-Side Dual Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Player 1 Card */}
        <div className="card-shin bg-shin-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-[2px] border-shin-outline">
            <span className="font-bangers text-xl text-shin-yellow tracking-wide">Your Solution</span>
            <span className="px-3 py-0.5 rounded-xl bg-shin-yellow text-shin-outline border-[2px] border-shin-outline font-black text-xs shadow-sticker-sm">
              Rating: {analysis.player1_analysis?.code_quality || 8}/10
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-shin-navy p-3 rounded-2xl border-[2px] border-shin-outline space-y-1">
              <span className="text-shin-muted block text-[10px] uppercase font-bangers tracking-wider">Time Complexity</span>
              <span className="font-mono font-black text-shin-blue text-base">
                {analysis.player1_analysis?.time_complexity || 'O(n)'}
              </span>
            </div>
            <div className="bg-shin-navy p-3 rounded-2xl border-[2px] border-shin-outline space-y-1">
              <span className="text-shin-muted block text-[10px] uppercase font-bangers tracking-wider">Space Complexity</span>
              <span className="font-mono font-black text-shin-yellow text-base">
                {analysis.player1_analysis?.space_complexity || 'O(n)'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bangers tracking-wider text-shin-cream block mb-1">Approach Detected</span>
            <p className="text-white font-comic font-bold text-xs leading-relaxed bg-shin-navy/60 p-3 rounded-xl border border-shin-outline/40">
              {analysis.player1_analysis?.approach || 'Single-pass hash table with complement lookup'}
            </p>
          </div>

          {analysis.player1_analysis?.issues && analysis.player1_analysis.issues.length > 0 && (
            <div className="pt-2 border-t-[2px] border-shin-outline/60">
              <span className="text-[10px] uppercase font-bangers tracking-wider text-shin-yellow block mb-2">Observations & Improvements</span>
              <ul className="space-y-1.5 text-shin-cream font-comic text-xs">
                {analysis.player1_analysis.issues.map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-shin-yellow font-black">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Player 2 Card */}
        <div className="card-shin bg-shin-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b-[2px] border-shin-outline">
            <span className="font-bangers text-xl text-shin-muted tracking-wide">Opponent Solution</span>
            <span className="px-3 py-0.5 rounded-xl bg-shin-navy text-shin-muted border-[2px] border-shin-outline font-black text-xs shadow-sticker-sm">
              Rating: {analysis.player2_analysis?.code_quality || 7}/10
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-shin-navy p-3 rounded-2xl border-[2px] border-shin-outline space-y-1">
              <span className="text-shin-muted block text-[10px] uppercase font-bangers tracking-wider">Time Complexity</span>
              <span className="font-mono font-black text-white text-base">
                {analysis.player2_analysis?.time_complexity || 'O(n²)'}
              </span>
            </div>
            <div className="bg-shin-navy p-3 rounded-2xl border-[2px] border-shin-outline space-y-1">
              <span className="text-shin-muted block text-[10px] uppercase font-bangers tracking-wider">Space Complexity</span>
              <span className="font-mono font-black text-white text-base">
                {analysis.player2_analysis?.space_complexity || 'O(1)'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bangers tracking-wider text-shin-cream block mb-1">Approach Detected</span>
            <p className="text-shin-muted font-comic font-bold text-xs leading-relaxed bg-shin-navy/60 p-3 rounded-xl border border-shin-outline/40">
              {analysis.player2_analysis?.approach || 'Nested loop brute-force search'}
            </p>
          </div>
        </div>
      </div>

      {/* Optimal Solution Editorial */}
      <div className="card-shin bg-shin-card p-6 space-y-4">
        <div className="flex items-center gap-2.5 text-shin-yellow font-bangers text-2xl tracking-wide">
          <FileCode className="w-6 h-6 text-shin-yellow" />
          <span>Optimal Editorial Implementation</span>
        </div>
        <div className="bg-shin-navy border-[2.5px] border-shin-outline rounded-2xl p-4 overflow-x-auto text-shin-white text-xs font-mono leading-relaxed shadow-inner">
          <pre>{analysis.optimal_solution || '// Optimal algorithmic solution'}</pre>
        </div>
      </div>
    </div>
  );
};
