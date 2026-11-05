import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Send, Flag, CheckCircle2, XCircle, AlertCircle, Trophy, Terminal, RotateCcw, ArrowRight } from 'lucide-react';
import { ProblemPanel } from '../components/ProblemPanel';
import { CodeEditor } from '../components/CodeEditor';
import { Timer } from '../components/Timer';
import { useAuthStore } from '../stores/authStore';
import { useMatchStore } from '../stores/matchStore';
import { socketService } from '../services/socket';

export const Battle: React.FC = () => {
  const { user } = useAuthStore();
  const {
    matchId,
    problem,
    durationSeconds,
    myProgress,
    opponentProgress,
    currentCode,
    language,
    winnerId,
    setCode,
    setLanguage,
    updateMyProgress,
    updateOpponentProgress,
    endMatch,
  } = useMatchStore();

  const navigate = useNavigate();
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [submissionVerdict, setSubmissionVerdict] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [consoleTab, setConsoleTab] = useState<'tests' | 'output'>('tests');

  useEffect(() => {
    if (!matchId || !problem) {
      navigate('/dashboard');
      return;
    }

    const socket = socketService.connect();

    // Listen to real-time events
    socket.on('sample_test_results', (data) => {
      setTestResults(data.results || []);
      setIsRunningTests(false);
      setConsoleTab('tests');
    });

    socket.on('opponent_progress', (data) => {
      updateOpponentProgress(data.tests_passed, data.total_tests);
    });

    socket.on('submission_verdict', (data) => {
      setIsSubmitting(false);
      setSubmissionVerdict(data.verdict);
      updateMyProgress(data.tests_passed, data.total_tests);
      setConsoleTab('tests');
    });

    socket.on('match_ended', (data) => {
      endMatch(data.winner_id, data.reason);
      setShowResultModal(true);
    });

    return () => {
      socket.off('sample_test_results');
      socket.off('opponent_progress');
      socket.off('submission_verdict');
      socket.off('match_ended');
    };
  }, [matchId, problem, navigate, updateMyProgress, updateOpponentProgress, endMatch]);

  const handleRunSampleTests = useCallback(() => {
    setIsRunningTests(true);
    const socket = socketService.getSocket();
    if (socket && problem) {
      socket.emit('run_sample_tests', {
        code: currentCode,
        language,
        problem_id: problem.id,
      });
    }
  }, [currentCode, language, problem]);

  const handleSubmit = useCallback(() => {
    setIsSubmitting(true);
    const socket = socketService.getSocket();
    if (socket && problem && matchId) {
      socket.emit('submit_solution', {
        match_id: matchId,
        problem_id: problem.id,
        code: currentCode,
        language,
      });
    }
  }, [currentCode, language, problem, matchId]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "'") {
        e.preventDefault();
        handleRunSampleTests();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit, handleRunSampleTests]);

  const handleForfeit = () => {
    if (window.confirm('Forfeit this battle? It will be recorded as a loss.')) {
      const socket = socketService.getSocket();
      if (socket && matchId) {
        socket.emit('forfeit', { match_id: matchId });
      }
    }
  };

  const handleResetCode = () => {
    if (problem && problem.starter_code && problem.starter_code[language]) {
      if (window.confirm('Reset code to default template?')) {
        setCode(problem.starter_code[language]);
      }
    }
  };

  if (!problem) return null;

  const isWinner = winnerId === user?.id;
  const isDraw = !winnerId && showResultModal;

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-[#090a0f] text-zinc-100 overflow-hidden font-sans">
      {/* Top Match HUD Bar */}
      <div className="h-12 bg-[#0d0e12] border-b border-zinc-800 px-4 flex items-center justify-between shrink-0 font-mono text-xs">
        {/* Left: Scoreboard */}
        <div className="flex items-center gap-6">
          {/* User status */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-bold text-zinc-200">{user?.username || 'You'}</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded bg-zinc-800 text-emerald-400 font-mono">
              {myProgress.passed}/{myProgress.total || 5} AC
            </span>
          </div>

          <div className="text-zinc-600 font-bold">vs</div>

          {/* Opponent status */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="font-bold text-zinc-400">Opponent</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded bg-zinc-800 text-amber-400 font-mono">
              {opponentProgress.passed}/{opponentProgress.total || 5} AC
            </span>
          </div>
        </div>

        {/* Center / Right: Clock + Surrender */}
        <div className="flex items-center gap-4">
          <Timer initialSeconds={durationSeconds} onTimeUp={() => handleForfeit()} />

          <button
            onClick={handleForfeit}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-900 transition-colors text-[11px]"
            title="Surrender duel"
          >
            <Flag className="w-3 h-3" />
            <span>Surrender</span>
          </button>
        </div>
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Problem Statement (42%) */}
        <div className="w-[42%] h-full overflow-hidden">
          <ProblemPanel problem={problem} />
        </div>

        {/* Right: Code Editor + Runner (58%) */}
        <div className="w-[58%] h-full flex flex-col border-l border-zinc-800 overflow-hidden bg-[#1e1e1e]">
          {/* Editor Header controls */}
          <div className="h-10 bg-[#14151b] border-b border-zinc-800 px-4 flex items-center justify-between shrink-0 font-mono text-xs">
            <div className="flex items-center gap-3">
              <select
                value={language}
                onChange={(e) => {
                  const newLang = e.target.value;
                  setLanguage(newLang);
                  if (problem.starter_code && problem.starter_code[newLang]) {
                    setCode(problem.starter_code[newLang]);
                  }
                }}
                className="bg-zinc-900 border border-zinc-700/80 rounded px-2.5 py-1 text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 font-mono"
              >
                <option value="python">Python 3.11</option>
                <option value="javascript">Node.js 20</option>
                <option value="cpp">C++ (GCC 13)</option>
              </select>

              <button
                onClick={handleResetCode}
                className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                title="Reset to template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden lg:inline text-[11px] text-zinc-500">
                Run <kbd className="px-1 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-400 font-mono">Ctrl+'</kbd>
              </span>

              <button
                onClick={handleRunSampleTests}
                disabled={isRunningTests || isSubmitting}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 border border-zinc-700 transition-colors disabled:opacity-50"
              >
                <Play className="w-3 h-3 text-zinc-400 fill-zinc-400" />
                <span>{isRunningTests ? 'Testing...' : 'Run Samples'}</span>
              </button>

              <button
                onClick={handleSubmit}
                disabled={isRunningTests || isSubmitting}
                className="flex items-center gap-1.5 px-3.5 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-zinc-950 transition-colors disabled:opacity-50 shadow-sm"
              >
                <Send className="w-3 h-3" />
                <span>{isSubmitting ? 'Evaluating...' : 'Submit'}</span>
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              code={currentCode}
              language={language}
              onChange={(val) => setCode(val)}
            />
          </div>

          {/* Bottom Execution Console */}
          <div className="h-48 bg-[#0e0f14] border-t border-zinc-800 flex flex-col shrink-0 font-mono text-xs">
            {/* Console Toolbar */}
            <div className="h-8 bg-[#121319] px-4 flex items-center justify-between border-b border-zinc-800/80 text-[11px]">
              <div className="flex items-center gap-2 text-zinc-400">
                <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                <span className="font-bold text-zinc-300">Execution Console</span>
              </div>

              {submissionVerdict && (
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    submissionVerdict === 'accepted'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  Verdict: {submissionVerdict.replace('_', ' ')}
                </span>
              )}
            </div>

            {/* Test Results Output */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-2">
              {testResults.length === 0 ? (
                <div className="text-zinc-600 italic py-2">
                  No execution yet. Click "Run Samples" or press <kbd className="px-1 py-0.2 bg-zinc-800 rounded text-zinc-400">Ctrl+'</kbd> to evaluate sample cases.
                </div>
              ) : (
                <div className="space-y-2">
                  {testResults.map((t, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded border text-[11px] ${
                        t.passed
                          ? 'bg-emerald-950/20 border-emerald-800/30'
                          : 'bg-rose-950/20 border-rose-800/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          {t.passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          <span className={t.passed ? 'text-emerald-300' : 'text-rose-300'}>
                            Test Case #{idx + 1}
                          </span>
                        </div>
                        <span className="text-zinc-500 text-[10px]">
                          {t.runtime_ms?.toFixed(1)} ms
                        </span>
                      </div>

                      {!t.passed && (
                        <div className="text-zinc-400 space-y-0.5 font-mono pt-1 text-[11px]">
                          <div>Expected: <span className="text-emerald-400">{t.expected}</span></div>
                          <div>Actual: <span className="text-rose-400">{t.actual || t.error || 'Empty'}</span></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Match Conclusion Dialog */}
      {showResultModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121319] border border-zinc-800 rounded-xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl relative">
            <div
              className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center ${
                isWinner
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : isDraw
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {isWinner ? <Trophy className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white font-mono">
                {isWinner ? 'ACCEPTED • VICTORY' : isDraw ? 'MATCH DRAW' : 'DEFEAT'}
              </h2>
              <p className="text-xs text-zinc-400 mt-1 font-sans">
                {isWinner
                  ? 'All test cases satisfied. ELO rating adjusted.'
                  : 'Duel completed. Review the algorithmic editorial to master the optimal approach.'}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => navigate(`/analysis/${matchId}`)}
                className="w-full py-2.5 rounded-lg bg-white hover:bg-zinc-200 text-zinc-950 font-mono font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>View Algorithmic Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-xs transition-colors"
              >
                Back to Arena Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
