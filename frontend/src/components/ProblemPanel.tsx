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
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'medium':
        return 'text-shin-yellow bg-shin-yellow/10 border-shin-yellow/25';
      case 'hard':
        return 'text-shin-red bg-shin-red/10 border-shin-red/25';
      default:
        return 'text-shin-muted bg-shin-border border-shin-border';
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="h-full flex flex-col bg-shin-panel border-r-2 border-shin-border text-shin-white">
      {/* Problem Panel Navigation Tabs */}
      <div className="h-10 px-4 bg-shin-bg border-b-2 border-shin-border flex items-center justify-between shrink-0 text-xs font-mono">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('description')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all font-bold ${
              activeTab === 'description'
                ? 'text-shin-bg bg-shin-yellow font-black shadow-sm'
                : 'text-shin-muted hover:text-shin-yellow'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Description</span>
          </button>
          <button
            onClick={() => setActiveTab('constraints')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all font-bold ${
              activeTab === 'constraints'
                ? 'text-shin-bg bg-shin-yellow font-black shadow-sm'
                : 'text-shin-muted hover:text-shin-yellow'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Constraints</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-shin-muted font-bold">
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
            <h1 className="text-xl font-black text-white tracking-tight">{problem.title}</h1>
            <span
              className={`text-[10px] font-mono font-black px-2.5 py-0.5 rounded-lg uppercase tracking-wider border ${getDifficultyBadge(
                problem.difficulty
              )}`}
            >
              {problem.difficulty}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-shin-muted font-bold">
            <span>Standard I/O</span>
            <span>•</span>
            <span>Memory: {problem.memory_limit_mb} MB</span>
            <span>•</span>
            <span>Timeout: {problem.time_limit_seconds}s</span>
          </div>
        </div>

        {/* Problem Statement */}
        <div className="text-shin-white/90 leading-relaxed text-[13px] whitespace-pre-line font-sans">
          {problem.description}
        </div>

        {/* Examples Section */}
        {problem.examples && problem.examples.length > 0 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-mono font-black uppercase tracking-wider text-shin-yellow">
              Examples
            </h3>
            <div className="space-y-3 font-mono text-xs">
              {problem.examples.map((example, idx) => (
                <div
                  key={idx}
                  className="bg-shin-bg rounded-xl p-3.5 border-2 border-shin-border space-y-2 relative group hover:border-shin-yellow/30 transition-colors"
                >
                  <button
                    onClick={() => handleCopy(example.input, idx)}
                    className="absolute top-3 right-3 text-shin-muted hover:text-shin-yellow opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy input"
                  >
                    {copiedIdx === idx ? (
                      <Check className="w-3.5 h-3.5 text-shin-yellow" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div>
                    <span className="text-shin-muted select-none">Input: </span>
                    <span className="text-shin-white whitespace-pre">{example.input}</span>
                  </div>
                  <div>
                    <span className="text-shin-muted select-none">Output: </span>
                    <span className="text-shin-yellow whitespace-pre">{example.output}</span>
                  </div>
                  {example.explanation && (
                    <div className="text-shin-muted text-[11px] font-sans border-t border-shin-border pt-1.5 mt-1.5">
                      <span className="font-black text-shin-muted">Note: </span>
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
          <div className="space-y-2 pt-2 border-t border-shin-border">
            <h3 className="text-xs font-mono font-black uppercase tracking-wider text-shin-yellow">
              Constraints
            </h3>
            <div className="bg-shin-bg rounded-xl p-3 border-2 border-shin-border font-mono text-xs text-shin-white/80 whitespace-pre-line leading-relaxed">
              {problem.constraints}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
