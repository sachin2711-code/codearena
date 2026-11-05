import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Swords, Shield, Cpu, ArrowRight, Play, CheckCircle2, Clock } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export const Landing: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#090a0f] text-zinc-100 flex flex-col justify-between">
      {/* Hero Section */}
      <div className="relative pt-12 pb-20 lg:pt-16 lg:pb-24 overflow-hidden">
        {/* Subtle background grid */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Top Pill */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Ranked Season 1 • ELO Matchmaking Active</span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-4">
              Speed chess, but for{' '}
              <span className="text-emerald-400 font-mono">competitive code</span>.
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
              Match 1v1 against programmers in your rating tier. Race to solve algorithmic problems
              in isolated sandboxes with real-time test case streaming.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-3 mb-16">
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="px-5 py-2.5 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>{isAuthenticated ? 'Open Arena' : 'Queue for Match'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/leaderboard"
              className="px-4 py-2.5 rounded-md bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-xs font-medium transition-colors"
            >
              View Global Standings
            </Link>
          </div>

          {/* Realistic Terminal / Battle Simulator Mockup */}
          <div className="max-w-4xl mx-auto rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden font-mono">
            {/* Terminal Top Bar */}
            <div className="h-9 bg-[#111217] px-4 flex items-center justify-between border-b border-zinc-800/80 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <span className="ml-2 text-zinc-400 text-[11px]">battle-session://match_7f9c2d • Two Sum</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 font-bold">09:14</span>
              </div>
            </div>

            {/* Split Battle Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800 bg-zinc-950/90 text-xs p-4 sm:p-5 gap-4 sm:gap-6">
              {/* Player 1 Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="font-bold text-zinc-200">sachin_dev (1897)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">YOU</span>
                  </div>
                  <span className="text-emerald-400 font-bold text-[11px]">8/10 Passed</span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '80%' }} />
                </div>
                {/* Code snippet */}
                <div className="bg-[#0b0c10] p-3 rounded-lg border border-zinc-900 text-zinc-300 text-[11px] leading-relaxed overflow-x-auto">
                  <div className="text-zinc-400"># Hash map single-pass lookup</div>
                  <div><span className="text-purple-400">seen</span> = &#123;&#125;</div>
                  <div><span className="text-blue-400">for</span> i, num <span className="text-blue-400">in</span> enumerate(nums):</div>
                  <div className="pl-4">diff = target - num</div>
                  <div className="pl-4"><span className="text-blue-400">if</span> diff <span className="text-blue-400">in</span> seen:</div>
                  <div className="pl-8"><span className="text-amber-400">return</span> [seen[diff], i]</div>
                  <div className="pl-4">seen[num] = i</div>
                </div>
              </div>

              {/* Player 2 Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="font-bold text-zinc-200">alex_algo (1862)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">OPPONENT</span>
                  </div>
                  <span className="text-amber-400 font-bold text-[11px]">5/10 Passed</span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '50%' }} />
                </div>
                {/* Code snippet */}
                <div className="bg-[#0b0c10] p-3 rounded-lg border border-zinc-900 text-zinc-300 text-[11px] leading-relaxed overflow-x-auto">
                  <div className="text-zinc-400">// Two-pointer approach</div>
                  <div><span className="text-blue-400">int</span> left = <span className="text-emerald-400">0</span>, right = n - <span className="text-emerald-400">1</span>;</div>
                  <div><span className="text-blue-400">while</span> (left &lt; right) &#123;</div>
                  <div className="pl-4"><span className="text-blue-400">int</span> current = nums[left] + nums[right];</div>
                  <div className="pl-4"><span className="text-blue-400">if</span> (current == target) <span className="text-amber-400">break</span>;</div>
                  <div className="pl-4"><span className="text-blue-400">else if</span> (current &lt; target) left++;</div>
                  <div className="pl-4"><span className="text-blue-400">else</span> right--;</div>
                  <div>&#125;</div>
                </div>
              </div>
            </div>

            {/* Bottom mini status bar */}
            <div className="bg-[#111217] px-4 py-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
              <div className="flex items-center gap-4">
                <span>Sandbox: <span className="text-zinc-200">cgroup v2 (256MB)</span></span>
                <span>Language: <span className="text-zinc-200">Python 3.11</span></span>
              </div>
              <div className="text-emerald-400">● 2 socket streams active</div>
            </div>
          </div>
        </div>
      </div>

      {/* Engineering Specs Grid */}
      <div className="border-t border-zinc-800/80 bg-zinc-950/60 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
            {/* Feature 1 */}
            <div className="p-5 rounded-lg bg-zinc-900/40 border border-zinc-800/70 space-y-2">
              <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Redis Matchmaking</span>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Uses Redis Sorted Sets with <code className="text-zinc-300 font-mono">ZRANGEBYSCORE</code> to pair players within ±100 ELO without database polling.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-5 rounded-lg bg-zinc-900/40 border border-zinc-800/70 space-y-2">
              <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Isolated Sandbox</span>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Air-gapped execution runner with hard memory limits, no network interfaces, and ephemeral containers destroyed post-test.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-5 rounded-lg bg-zinc-900/40 border border-zinc-800/70 space-y-2">
              <div className="flex items-center gap-2 text-zinc-300 font-bold text-xs uppercase tracking-wider">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Algorithmic Editorial</span>
              </div>
              <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                Post-match asymptotic breakdown computing Big-O Time & Space complexities with edge case analysis against the optimal approach.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
