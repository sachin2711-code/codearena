import React, { useState } from 'react';
import { Problem } from '../types';
import { Clock, Cpu, FileText, CheckCircle, Tag, Copy, Check } from 'lucide-react';

interface ProblemPanelProps {
  problem: Problem;
}

export const ProblemPanel: React.FC<ProblemPanelProps> = ({ problem }) => {
  const [activeTab, setActiveTab] = useState<'description' | 'constraints'>('description');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const getDifficultyBadge = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'hard':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-zinc-400 bg-zinc-800 border-zinc-700';
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="h-full flex flex-col bg-[#0d0e12] border-r border-zinc-800 text-zinc-300">
      {/* Problem Panel Navigation Tabs */}
      <div className="h-10 px-4 bg-[#111217] border-b border-zinc-800 flex items-center justify-between shrink-0 text-xs font-mono">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('description')}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
              activeTab === 'description'
                ? 'text-white bg-zinc-800 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span>Description</span>
          </button>
          <button
            onClick={() => setActiveTab('constraints')}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
              activeTab === 'constraints'
                ? 'text-white bg-zinc-800 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            <span>Constraints</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
          <span>{problem.time_limit_seconds}s</span>
          <span>•</span>
          <span>{problem.memory_limit_mb}MB</span>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm">
        {/* Title Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-bold text-white tracking-tight">{problem.title}</h1>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${getDifficultyBadge(
                problem.difficulty
              )}`}
            >
              {problem.difficulty}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
            <span>Standard I/O</span>
            <span>•</span>
            <span>Memory: {problem.memory_limit_mb} MB</span>
            <span>•</span>
            <span>Timeout: {problem.time_limit_seconds}s</span>
          </div>
        </div>

        {/* Problem Statement */}
        <div className="text-zinc-300 leading-relaxed text-[13px] whitespace-pre-line font-sans">
          {problem.description}
        </div>

        {/* Examples Section */}
        {problem.examples && problem.examples.length > 0 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
              Examples
            </h3>
            <div className="space-y-3 font-mono text-xs">
              {problem.examples.map((example, idx) => (
                <div
                  key={idx}
                  className="bg-[#121319] rounded-lg p-3.5 border border-zinc-800 space-y-2 relative group"
                >
                  <button
                    onClick={() => handleCopy(example.input, idx)}
                    className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy input"
                  >
                    {copiedIdx === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div>
                    <span className="text-zinc-500 select-none">Input: </span>
                    <span className="text-zinc-200 whitespace-pre">{example.input}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 select-none">Output: </span>
                    <span className="text-emerald-400 whitespace-pre">{example.output}</span>
                  </div>
                  {example.explanation && (
                    <div className="text-zinc-400 text-[11px] font-sans border-t border-zinc-800/80 pt-1.5 mt-1.5">
                      <span className="font-semibold text-zinc-400">Note: </span>
                      {example.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Constraints */}
        {problem.constraints && (
          <div className="space-y-2 pt-2 border-t border-zinc-800/70">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
              Constraints
            </h3>
            <div className="bg-[#121319] rounded-lg p-3 border border-zinc-800 font-mono text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
              {problem.constraints}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
