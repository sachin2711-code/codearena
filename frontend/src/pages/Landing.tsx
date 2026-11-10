import React from 'react';
import { Link } from 'react-router-dom';
import { Swords, Shield, Cpu, ArrowRight, Clock, Zap } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export const Landing: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-shin-bg text-shin-white flex flex-col justify-between">
      {/* Hero Section */}
      <div className="relative pt-12 pb-20 lg:pt-16 lg:pb-24 overflow-hidden">
        {/* Comic dot background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none" />
        {/* Yellow blob glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-shin-yellow/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Top Pill */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-shin-yellow/10 border border-shin-yellow/30 text-[11px] font-bold text-shin-yellow uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-shin-yellow animate-shin-pulse" />
              <span>⚡ Season 1 Live — ELO Matchmaking Active</span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center max-w-3xl mx-auto mb-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
              Code Fast.{' '}
              <span className="text-shin-yellow" style={{ textShadow: '0 0 30px rgba(255,215,0,0.4)' }}>
                Fight Smart.
              </span>
              <br />
              <span className="text-shin-blue">Win Big.</span>
            </h1>
            <p className="text-base sm:text-lg text-shin-muted leading-relaxed max-w-2xl mx-auto font-semibold">
              1v1 real-time algorithmic duels. Race against opponents in your ELO tier,
              solve LeetCode-style problems, and climb the ranked leaderboard.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-16">
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="px-6 py-3 rounded-2xl bg-shin-yellow hover:bg-shin-yellow-soft text-shin-bg font-black text-sm transition-all flex items-center gap-2 shadow-lg shadow-shin-yellow/30 hover:shadow-shin-yellow/50 hover:scale-105 comic-border"
              style={{ boxShadow: '4px 4px 0px #E8192C' }}
            >
              <Swords className="w-4 h-4" />
              <span>{isAuthenticated ? 'Open Arena' : 'Enter the Arena'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/leaderboard"
              className="px-5 py-3 rounded-2xl bg-shin-panel hover:bg-shin-border border-2 border-shin-border hover:border-shin-blue/50 text-shin-muted hover:text-shin-blue font-bold text-sm transition-all"
            >
              🏆 Global Rankings
            </Link>
          </div>

          {/* Battle Preview Terminal */}
          <div className="max-w-4xl mx-auto rounded-2xl bg-shin-panel border-2 border-shin-yellow/30 shadow-2xl shadow-shin-yellow/10 overflow-hidden font-mono"
            style={{ boxShadow: '0 0 40px rgba(255,215,0,0.08), 6px 6px 0px #1a1740' }}>
            {/* Terminal Top Bar */}
            <div className="h-10 bg-shin-bg px-4 flex items-center justify-between border-b border-shin-border text-xs text-shin-muted">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-shin-red" />
                <span className="w-3 h-3 rounded-full bg-shin-yellow" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-shin-muted text-[11px]">battle://match_7f9c2d • Two Sum</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <Clock className="w-3.5 h-3.5 text-shin-yellow" />
                <span className="text-shin-yellow font-black">09:14</span>
              </div>
            </div>

            {/* Split Battle Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-shin-border bg-shin-panel/90 text-xs p-4 sm:p-5 gap-4 sm:gap-6">
              {/* Player 1 Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-shin-border">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-shin-yellow" />
                    <span className="font-black text-shin-white">sachin_dev (1897)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-shin-yellow/20 text-shin-yellow border border-shin-yellow/30 font-black">YOU</span>
                  </div>
                  <span className="text-shin-yellow font-black text-[11px]">8/10 ✓</span>
                </div>
                <div className="h-2 w-full bg-shin-border rounded-full overflow-hidden">
                  <div className="h-full bg-shin-yellow rounded-full" style={{ width: '80%' }} />
                </div>
                <div className="bg-shin-bg p-3 rounded-xl border border-shin-border text-shin-white text-[11px] leading-relaxed overflow-x-auto">
                  <div className="text-shin-muted"># Hash map single-pass lookup</div>
                  <div><span className="text-purple-400">seen</span> = &#123;&#125;</div>
                  <div><span className="text-shin-blue">for</span> i, num <span className="text-shin-blue">in</span> enumerate(nums):</div>
                  <div className="pl-4">diff = target - num</div>
                  <div className="pl-4"><span className="text-shin-blue">if</span> diff <span className="text-shin-blue">in</span> seen:</div>
                  <div className="pl-8"><span className="text-shin-yellow">return</span> [seen[diff], i]</div>
                  <div className="pl-4">seen[num] = i</div>
                </div>
              </div>

              {/* Player 2 Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-shin-border">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-shin-red" />
                    <span className="font-black text-shin-white">alex_algo (1862)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-shin-red/20 text-shin-red border border-shin-red/30 font-black">OPP</span>
                  </div>
                  <span className="text-shin-muted font-black text-[11px]">5/10</span>
                </div>
                <div className="h-2 w-full bg-shin-border rounded-full overflow-hidden">
                  <div className="h-full bg-shin-red rounded-full" style={{ width: '50%' }} />
                </div>
                <div className="bg-shin-bg p-3 rounded-xl border border-shin-border text-shin-white text-[11px] leading-relaxed overflow-x-auto">
                  <div className="text-shin-muted">// Two-pointer approach</div>
                  <div><span className="text-shin-blue">int</span> left = <span className="text-shin-yellow">0</span>, right = n - <span className="text-shin-yellow">1</span>;</div>
                  <div><span className="text-shin-blue">while</span> (left &lt; right) &#123;</div>
                  <div className="pl-4"><span className="text-shin-blue">int</span> current = nums[left] + nums[right];</div>
                  <div className="pl-4"><span className="text-shin-blue">if</span> (current == target) <span className="text-shin-yellow">break</span>;</div>
                  <div className="pl-4"><span className="text-shin-blue">else if</span> (current &lt; target) left++;</div>
                  <div className="pl-4"><span className="text-shin-blue">else</span> right--;</div>
                  <div>&#125;</div>
                </div>
              </div>
            </div>

            {/* Bottom status bar */}
            <div className="bg-shin-bg px-4 py-2 border-t border-shin-border flex items-center justify-between text-[11px] text-shin-muted">
              <div className="flex items-center gap-4">
                <span>Sandbox: <span className="text-shin-white">cgroup v2 (256MB)</span></span>
                <span>Language: <span className="text-shin-white">Python 3.11</span></span>
              </div>
              <div className="text-shin-yellow font-bold flex items-center gap-1.5">
                <Zap className="w-3 h-3" />
                2 socket streams live
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="border-t-2 border-shin-border/60 bg-shin-panel/40 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-sans">
            {/* Feature 1 */}
            <div className="p-5 rounded-2xl bg-shin-panel border-2 border-shin-yellow/20 hover:border-shin-yellow/50 space-y-3 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-shin-yellow/10">
              <div className="w-10 h-10 rounded-xl bg-shin-yellow/15 border border-shin-yellow/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-shin-yellow" />
              </div>
              <div className="font-black text-shin-white text-sm uppercase tracking-wide">Redis Matchmaking</div>
              <p className="text-xs text-shin-muted leading-relaxed">
                Uses Redis Sorted Sets with <code className="text-shin-yellow font-mono">ZRANGEBYSCORE</code> to pair players within ±100 ELO without database polling.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-5 rounded-2xl bg-shin-panel border-2 border-shin-blue/20 hover:border-shin-blue/50 space-y-3 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-shin-blue/10">
              <div className="w-10 h-10 rounded-xl bg-shin-blue/15 border border-shin-blue/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-shin-blue" />
              </div>
              <div className="font-black text-shin-white text-sm uppercase tracking-wide">Isolated Sandbox</div>
              <p className="text-xs text-shin-muted leading-relaxed">
                Air-gapped execution runner with hard memory limits, no network interfaces, and ephemeral containers destroyed post-test.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-5 rounded-2xl bg-shin-panel border-2 border-shin-red/20 hover:border-shin-red/50 space-y-3 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-shin-red/10">
              <div className="w-10 h-10 rounded-xl bg-shin-red/15 border border-shin-red/30 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-shin-red" />
              </div>
              <div className="font-black text-shin-white text-sm uppercase tracking-wide">Algorithmic Editorial</div>
              <p className="text-xs text-shin-muted leading-relaxed">
                Post-match asymptotic breakdown computing Big-O Time & Space complexities with edge case analysis against the optimal approach.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
