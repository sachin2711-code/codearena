import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Send, Flag, CheckCircle2, XCircle, AlertCircle, Trophy, Terminal, RotateCcw, ArrowRight, Share2 } from 'lucide-react';
import { ProblemPanel } from '../components/ProblemPanel';
import { CodeEditor } from '../components/CodeEditor';
import { Timer } from '../components/Timer';
import { useAuthStore } from '../stores/authStore';
import { useMatchStore } from '../stores/matchStore';
import { socketService } from '../services/socket';
import { sound } from '../utils/sound';

export const Battle: React.FC = () => {
  const { user, fetchUser } = useAuthStore();
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

    // Ensure socket is joined to this match's room
    socket.emit('join_match_room', { match_id: matchId });

    // Listen to real-time events
    socket.on('sample_test_results', (data) => {
      setTestResults(data.results || []);
      setIsRunningTests(false);
      setConsoleTab('tests');
      const allPassed = (data.results || []).length > 0 && (data.results || []).every((r: any) => r.passed);
      if (allPassed) {
        sound.playSuccess();
      } else {
        sound.playError();
      }
    });

    socket.on('opponent_progress', (data) => {
      updateOpponentProgress(data.tests_passed, data.total_tests);
    });

    socket.on('submission_verdict', (data) => {
      setIsSubmitting(false);
      setSubmissionVerdict(data.verdict);
      if (data.results && data.results.length > 0) {
        setTestResults(data.results);
      }
      updateMyProgress(data.tests_passed, data.total_tests);
      setConsoleTab('tests');
      if (data.verdict === 'accepted') {
        sound.playSuccess();
      } else {
        sound.playError();
      }
    });

    socket.on('match_ended', (data) => {
      endMatch(data.winner_id, data.reason);
      setShowResultModal(true);
      if (data.winner_id === user?.id) {
        sound.playVictory();
      }
      // Re-fetch user to update wins/losses/ELO stats in Dashboard
      fetchUser();
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

  const handleShareVictory = () => {
    const text = encodeURIComponent(`🏆 I just won a 1v1 live coding battle on CodeArena solving "${problem?.title}"! Think you can beat me? Challenge me: ${window.location.origin}/duel`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  if (!problem) return null;

  const isWinner = winnerId === user?.id;
  const isDraw = !winnerId && showResultModal;

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-shin-bg text-shin-white overflow-hidden font-sans">
      {/* Top Match HUD Bar */}
      <div className="h-12 bg-shin-panel border-b-2 border-shin-border px-4 flex items-center justify-between shrink-0 font-mono text-xs">
        {/* Left: Scoreboard */}
        <div className="flex items-center gap-6">
          {/* User status */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-shin-yellow" />
            <span className="font-black text-shin-white">{user?.username || 'You'}</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-lg bg-shin-yellow/15 text-shin-yellow border border-shin-yellow/30 font-black">
              {myProgress.passed}/{myProgress.total || 5} ✓
            </span>
          </div>

          <div className="text-shin-border font-black">vs</div>

          {/* Opponent status */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-shin-red" />
            <span className="font-black text-shin-muted">Opponent</span>
            <span className="text-[11px] px-1.5 py-0.5 rounded-lg bg-shin-red/15 text-shin-red border border-shin-red/30 font-black">
              {opponentProgress.passed}/{opponentProgress.total || 5}
            </span>
          </div>
        </div>

        {/* Center / Right: Clock + Surrender */}
        <div className="flex items-center gap-4">
          <Timer initialSeconds={durationSeconds} onTimeUp={() => handleForfeit()} />

          <button
            onClick={handleForfeit}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border-2 border-shin-border text-shin-muted hover:text-shin-red hover:border-shin-red/40 transition-all text-[11px] font-black"
            title="Surrender duel"
          >
            <Flag className="w-3 h-3" />
            <span>Forfeit</span>
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
        <div className="w-[58%] h-full flex flex-col border-l-2 border-shin-border overflow-hidden bg-[#1e1e1e]">
          {/* Editor Header controls */}
          <div className="h-10 bg-shin-panel border-b-2 border-shin-border px-4 flex items-center justify-between shrink-0 font-mono text-xs">
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
                className="bg-shin-bg border-2 border-shin-border rounded-xl px-2.5 py-1 text-xs text-shin-white focus:outline-none focus:border-shin-yellow/50 font-mono font-bold"
              >
                <option value="python">Python 3.11</option>
                <option value="javascript">Node.js 20</option>
                <option value="cpp">C++ (GCC 13)</option>
              </select>

              <button
                onClick={handleResetCode}
                className="text-shin-muted hover:text-shin-yellow transition-colors p-1"
                title="Reset to template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden lg:inline text-[11px] text-shin-muted">
                Run <kbd className="px-1 py-0.5 bg-shin-border rounded border border-shin-border text-shin-muted font-mono">Ctrl+'</kbd>
              </span>

              <button
                onClick={handleRunSampleTests}
                disabled={isRunningTests || isSubmitting}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-shin-border hover:bg-shin-blue/20 hover:border-shin-blue/40 text-xs font-black text-shin-white border-2 border-shin-border transition-all disabled:opacity-50"
              >
                <Play className="w-3 h-3 text-shin-blue fill-shin-blue" />
                <span>{isRunningTests ? 'Testing...' : 'Run Samples'}</span>
              </button>

              <button
                onClick={handleSubmit}
                disabled={isRunningTests || isSubmitting}
                className="flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-shin-yellow hover:bg-shin-yellow-soft text-xs font-black text-shin-bg transition-all disabled:opacity-50 shadow-md shadow-shin-yellow/20"
                style={{ boxShadow: '2px 2px 0px #E8192C' }}
              >
                <Send className="w-3 h-3" />
                <span>{isSubmitting ? 'Judging...' : 'Submit'}</span>
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
          <div className="h-48 bg-shin-bg border-t-2 border-shin-border flex flex-col shrink-0 font-mono text-xs">
            {/* Console Toolbar */}
            <div className="h-8 bg-shin-panel px-4 flex items-center justify-between border-b border-shin-border text-[11px]">
              <div className="flex items-center gap-2 text-shin-muted">
                <Terminal className="w-3.5 h-3.5 text-shin-yellow" />
                <span className="font-black text-shin-white">Execution Console</span>
              </div>

              {submissionVerdict && (
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                    submissionVerdict === 'accepted'
                      ? 'bg-shin-yellow/15 text-shin-yellow border border-shin-yellow/30'
                      : 'bg-shin-red/15 text-shin-red border border-shin-red/30'
                  }`}
                >
                  {submissionVerdict === 'accepted' ? '✓' : '✗'} {submissionVerdict.replace('_', ' ')}
                </span>
              )}
            </div>

            {/* Test Results Output */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-2">
              {testResults.length === 0 ? (
                <div className="text-shin-muted italic py-2">
                  No execution yet. Click "Run Samples" or press <kbd className="px-1 py-0.5 bg-shin-border rounded text-shin-muted">Ctrl+'</kbd> to evaluate sample cases.
                </div>
              ) : (
                <div className="space-y-2">
                  {testResults.map((t, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl border text-[11px] ${
                        t.passed
                          ? 'bg-shin-yellow/8 border-shin-yellow/20'
                          : 'bg-shin-red/8 border-shin-red/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 font-black">
                          {t.passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-shin-yellow" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-shin-red" />
                          )}
                          <span className={t.passed ? 'text-shin-yellow' : 'text-shin-red'}>
                            Test Case #{idx + 1}
                          </span>
                        </div>
                        <span className="text-shin-muted text-[10px]">
                          {t.runtime_ms?.toFixed(1)} ms
                        </span>
                      </div>

                      {!t.passed && (
                        <div className="text-shin-muted space-y-0.5 font-mono pt-1 text-[11px]">
                          <div>Expected: <span className="text-shin-yellow">{t.expected}</span></div>
                          <div>Actual: <span className="text-shin-red">{t.actual || t.error || 'Empty'}</span></div>
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-shin-panel border-2 border-shin-yellow/30 rounded-2xl max-w-md w-full p-7 text-center space-y-5 shadow-2xl relative"
            style={{ boxShadow: '8px 8px 0px #1a1740, 0 0 50px rgba(255,215,0,0.12)' }}>
            <div
              className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl ${
                isWinner
                  ? 'bg-shin-yellow shadow-lg shadow-shin-yellow/40 animate-shin-bounce'
                  : isDraw
                  ? 'bg-shin-border'
                  : 'bg-shin-red/20 border-2 border-shin-red/40'
              }`}
            >
              {isWinner ? '🏆' : isDraw ? '🤝' : '💀'}
            </div>

            <div>
              <h2 className={`text-2xl font-black tracking-tight ${isWinner ? 'text-shin-yellow' : isDraw ? 'text-shin-muted' : 'text-shin-red'}`}>
                {isWinner ? '⚡ VICTORY!' : isDraw ? 'MATCH DRAW' : 'DEFEATED'}
              </h2>
              <p className="text-xs text-shin-muted mt-2 font-semibold">
                {isWinner
                  ? 'All test cases passed. ELO rating updated. Nicely done!'
                  : 'Review the editorial to master the optimal approach.'}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              {isWinner && (
                <button
                  onClick={handleShareVictory}
                  className="w-full py-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 border-2 border-[#25D366]/40 text-[#25D366] font-black text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share on WhatsApp</span>
                </button>
              )}

              <button
                onClick={() => navigate(`/analysis/${matchId}`)}
                className="w-full py-2.5 rounded-xl bg-shin-yellow hover:bg-shin-yellow-soft text-shin-bg font-black text-sm transition-all flex items-center justify-center gap-2"
                style={{ boxShadow: '3px 3px 0px #E8192C' }}
              >
                <span>View Editorial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-2 rounded-xl bg-shin-border hover:bg-shin-border/80 border-2 border-shin-border text-shin-muted hover:text-shin-white font-black text-xs transition-all"
              >
                Back to Arena
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
