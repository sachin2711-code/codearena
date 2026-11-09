import React from 'react';
import { ShieldCheck, Lock, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Privacy: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-zinc-300 font-sans space-y-8">
      <div className="border-b border-zinc-800 pb-6 space-y-2">
        <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>User Privacy</span>
        </div>
        <h1 className="text-3xl font-bold font-mono text-white tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-zinc-400">
          Last updated: November 2026 • We respect your data and never sell user information.
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-lg font-bold font-mono text-zinc-100 flex items-center gap-2">
            <span className="text-emerald-400">01.</span> Information We Collect
          </h2>
          <p>
            CodeArena collects minimal information necessary to deliver competitive matchmaking and match verification:
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-400">
            <li><strong className="text-zinc-200">Account Identity:</strong> Display username, email address, avatar URL (provided by OAuth providers Google/GitHub or direct registration).</li>
            <li><strong className="text-zinc-200">Match & Rating Data:</strong> Current ELO rating, win/loss records, match histories, submission runtimes, and authored code solutions.</li>
            <li><strong className="text-zinc-200">Technical Diagnostics:</strong> Browser user-agent and connection logs for websocket stability and cheat mitigation.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-mono text-zinc-100 flex items-center gap-2">
            <span className="text-emerald-400">02.</span> How We Use Your Data
          </h2>
          <p>We use your information exclusively to:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-400">
            <li>Pair you with players of matched skill levels using the Glicko/ELO matchmaking algorithm.</li>
            <li>Calculate ratings, leaderboard positions, and performance statistics.</li>
            <li>Display head-to-head match reviews, diffs, and execution timings in post-game analysis.</li>
            <li>Prevent abuse, sandbox breakouts, or unauthorized bot access.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-mono text-zinc-100 flex items-center gap-2">
            <span className="text-emerald-400">03.</span> OAuth Third-Party Disclosures
          </h2>
          <p>
            When authenticating via Google or GitHub OAuth, we strictly request basic profile identification (name, email, profile photo). We do not request repository write access or personal Google Drive permissions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-mono text-zinc-100 flex items-center gap-2">
            <span className="text-emerald-400">04.</span> Data Retention & Account Deletion
          </h2>
          <p>
            You may request complete deletion of your account and associated submission history at any time by contacting our team. Once deleted, your rating is purged from the global leaderboard.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold font-mono text-zinc-100 flex items-center gap-2">
            <span className="text-emerald-400">05.</span> Security
          </h2>
          <p>
            Passwords (if using standard credential sign-in) are hashed with industry-standard bcrypt. Code execution occurs in isolated, ephemeral sandboxes with non-root privileges and strict memory/CPU limits.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-mono">
        <Link to="/" className="text-zinc-400 hover:text-white transition-colors">
          ← Back to CodeArena
        </Link>
        <Link to="/terms" className="text-emerald-400 hover:underline">
          View Terms of Service →
        </Link>
      </div>
    </div>
  );
};
