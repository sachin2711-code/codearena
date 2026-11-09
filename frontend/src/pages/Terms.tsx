import React from 'react';
import { ShieldCheck, Scale, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Terms: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-zinc-300 font-sans space-y-8">
      <div className="border-b border-zinc-800 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold uppercase tracking-wider">
          <Scale className="w-4 h-4" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-3xl font-bold font-mono text-white tracking-tight">Terms of Service</h1>
        <p className="text-sm text-zinc-400">
          Last updated: November 2026 • Effective immediately for all CodeArena duelists.
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold font-mono text-zinc-100 flex items-center gap-2">
            <span className="text-emerald-400">01.</span> Acceptance of Terms
          </h2>
          <p>
            By accessing or playing on <strong className="text-white">CodeArena</strong>, you agree to be bound by these
            Terms of Service. If you do not agree with any portion of these terms, please refrain from using the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-mono text-zinc-100 flex items-center gap-2">
            <span className="text-emerald-400">02.</span> Fair Play & Code Execution Rules
          </h2>
          <p>
            CodeArena provides an isolated code execution environment strictly intended for algorithmic competitive coding duels. You agree that you will not:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-400">
            <li>Attempt to break out of the execution sandbox or probe host infrastructure.</li>
            <li>Run denial-of-service exploits, infinite fork bombs, or cryptominers.</li>
            <li>Use automated external bots or LLM scrapers during live ranked matchmaking without explicit permission.</li>
            <li>Harass, insult, or spam other duelists through custom room lobbies or match channels.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-mono text-zinc-100 flex items-center gap-2">
            <span className="text-emerald-400">03.</span> User Accounts & OAuth Authentication
          </h2>
          <p>
            You may register via third-party providers (Google, GitHub) or standard email credentials. You are responsible for safeguarding your login credentials. We reserve the right to suspend or ban accounts engaged in cheating, bot exploitation, or rating manipulation (win trading).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-mono text-zinc-100 flex items-center gap-2">
            <span className="text-emerald-400">04.</span> Intellectual Property & Problem Content
          </h2>
          <p>
            Algorithmic coding problems, test cases, and starter templates available on CodeArena are provided for educational and skill development purposes. Your authored solutions remain your intellectual property. By submitting code, you grant CodeArena a non-exclusive license to execute, evaluate, and display your code for match history and post-game algorithmic analysis.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-mono text-zinc-100 flex items-center gap-2">
            <span className="text-emerald-400">05.</span> Limitation of Liability
          </h2>
          <p>
            CodeArena is provided "AS IS" and "AS AVAILABLE" without warranties of any kind. We are not liable for any downtime, loss of match progress, rating discrepancy, or data interruptions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-mono text-zinc-100 flex items-center gap-2">
            <span className="text-emerald-400">06.</span> Contact
          </h2>
          <p>
            If you have questions regarding these terms, contact the administrative maintainers at{' '}
            <a href="mailto:support@codearena.dev" className="text-emerald-400 underline hover:text-emerald-300">
              support@codearena.dev
            </a>.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-mono">
        <Link to="/" className="text-zinc-400 hover:text-white transition-colors">
          ← Back to CodeArena
        </Link>
        <Link to="/privacy" className="text-emerald-400 hover:underline">
          View Privacy Policy →
        </Link>
      </div>
    </div>
  );
};
