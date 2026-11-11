import React from 'react';
import { Link } from 'react-router-dom';
import { Swords, Shield, Cpu, ArrowRight, Clock, Zap, Star } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { ThemedBackground } from '../components/ThemedBackground';

export const Landing: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <ThemedBackground variant="home">
      <div className="flex flex-col justify-between py-10 lg:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Top Pill / Comic Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-shin-yellow border-[2.5px] border-shin-outline text-shin-outline font-black text-xs uppercase tracking-wider shadow-sticker-sm animate-shin-bounce">
              <Zap className="w-3.5 h-3.5 fill-shin-red text-shin-red" />
              <span className="font-bangers tracking-wide text-sm">Action Kamen Ranked Season 1 • Live!</span>
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center max-w-3xl mx-auto mb-10">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bangers tracking-wider text-white mb-4 leading-none drop-shadow-md">
              Code Fast.{' '}
              <span className="text-shin-yellow inline-block transform -rotate-2 bg-shin-navy px-3 py-1 rounded-2xl border-[3px] border-shin-outline shadow-sticker-yellow">
                Duel Smart.
              </span>
              <br />
              <span className="text-shin-blue">Win Glory.</span>
            </h1>
            <p className="text-lg sm:text-xl text-shin-cream font-comic font-bold leading-relaxed max-w-2xl mx-auto mt-4">
              "Hey hey! Test your algorithmic speed 1v1 against programmers in your rating tier. Race to solve LeetCode-style duels in real-time sandboxes!"
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link
              to={isAuthenticated ? '/dashboard' : '/login'}
              className="btn-shin-yellow text-base px-8 py-3.5 shadow-sticker-lg hover:scale-105"
            >
              <Swords className="w-5 h-5" />
              <span className="font-bangers text-lg tracking-wider">
                {isAuthenticated ? 'Open Arena' : 'Enter Arena'}
              </span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/leaderboard"
              className="btn-shin-outline text-base px-6 py-3.5 shadow-sticker-lg hover:scale-105"
            >
              <span className="text-xl">🏆</span>
              <span className="font-bangers text-lg tracking-wider">Global Rankings</span>
            </Link>
          </div>

          {/* Comic Terminal Mockup */}
          <div className="max-w-4xl mx-auto rounded-3xl bg-shin-card border-[3.5px] border-shin-outline shadow-sticker-lg overflow-hidden font-mono mb-16">
            {/* Terminal Top Bar */}
            <div className="h-11 bg-shin-navy px-5 flex items-center justify-between border-b-[3px] border-shin-outline text-xs text-shin-muted">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-full bg-shin-red border-[2px] border-shin-outline" />
                <span className="w-3.5 h-3.5 rounded-full bg-shin-yellow border-[2px] border-shin-outline" />
                <span className="w-3.5 h-3.5 rounded-full bg-green-400 border-[2px] border-shin-outline" />
                <span className="ml-3 font-comic font-black text-shin-cream text-sm">
                  battle://match_7f9c2d • Two Sum
                </span>
              </div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <Clock className="w-4 h-4 text-shin-yellow" />
                <span className="text-shin-yellow font-bangers text-base tracking-wider">09:14</span>
              </div>
            </div>

            {/* Split Battle Preview */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x-[3px] divide-shin-outline bg-shin-card text-xs p-5 gap-6">
              {/* Player 1 Preview */}
              <div className="space-y-3 font-sans">
                <div className="flex items-center justify-between pb-2 border-b-[2px] border-shin-outline/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-shin-yellow" />
                    <span className="font-black text-white font-comic text-base">sachin_dev (1897)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-shin-yellow text-shin-outline border-[1.5px] border-shin-outline font-black">
                      YOU
                    </span>
                  </div>
                  <span className="text-shin-yellow font-black font-mono text-xs">8/10 AC ✓</span>
                </div>
                <div className="h-3 w-full bg-shin-navy rounded-full overflow-hidden border-[2px] border-shin-outline">
                  <div className="h-full bg-shin-yellow rounded-full transition-all" style={{ width: '80%' }} />
                </div>
                <div className="bg-shin-navy p-3.5 rounded-2xl border-[2px] border-shin-outline text-white text-[11px] font-mono leading-relaxed overflow-x-auto">
                  <div className="text-shin-muted">// Hash map single-pass lookup</div>
                  <div><span className="text-purple-400">unordered_map</span>&lt;<span className="text-shin-blue">int</span>, <span className="text-shin-blue">int</span>&gt; seen;</div>
                  <div><span className="text-shin-blue">for</span> (<span className="text-shin-blue">int</span> i = <span className="text-shin-yellow">0</span>; i &lt; n; ++i) &#123;</div>
                  <div className="pl-4"><span className="text-shin-blue">int</span> diff = target - nums[i];</div>
                  <div className="pl-4"><span className="text-shin-blue">if</span> (seen.count(diff)) <span className="text-shin-yellow">return</span> &#123;seen[diff], i&#125;;</div>
                  <div className="pl-4">seen[nums[i]] = i;</div>
                  <div>&#125;</div>
                </div>
              </div>

              {/* Player 2 Preview */}
              <div className="space-y-3 font-sans">
                <div className="flex items-center justify-between pb-2 border-b-[2px] border-shin-outline/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-shin-red" />
                    <span className="font-black text-white font-comic text-base">alex_algo (1862)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-shin-red text-white border-[1.5px] border-shin-outline font-black">
                      OPPONENT
                    </span>
                  </div>
                  <span className="text-shin-muted font-black font-mono text-xs">5/10 AC</span>
                </div>
                <div className="h-3 w-full bg-shin-navy rounded-full overflow-hidden border-[2px] border-shin-outline">
                  <div className="h-full bg-shin-red rounded-full transition-all" style={{ width: '50%' }} />
                </div>
                <div className="bg-shin-navy p-3.5 rounded-2xl border-[2px] border-shin-outline text-white text-[11px] font-mono leading-relaxed overflow-x-auto">
                  <div className="text-shin-muted">// Two-pointer approach</div>
                  <div><span className="text-shin-blue">int</span> left = <span className="text-shin-yellow">0</span>, right = n - <span className="text-shin-yellow">1</span>;</div>
                  <div><span className="text-shin-blue">while</span> (left &lt; right) &#123;</div>
                  <div className="pl-4"><span className="text-shin-blue">int</span> sum = nums[left] + nums[right];</div>
                  <div className="pl-4"><span className="text-shin-blue">if</span> (sum == target) <span className="text-shin-yellow">break</span>;</div>
                  <div className="pl-4"><span className="text-shin-blue">else if</span> (sum &lt; target) left++;</div>
                  <div className="pl-4"><span className="text-shin-blue">else</span> right--;</div>
                  <div>&#125;</div>
                </div>
              </div>
            </div>

            {/* Bottom Status Bar */}
            <div className="bg-shin-navy px-5 py-2.5 border-t-[3px] border-shin-outline flex items-center justify-between text-[11px] text-shin-muted font-comic font-black">
              <div className="flex items-center gap-4">
                <span>Sandbox: <span className="text-shin-cream">Isolated Subprocess</span></span>
                <span>Language: <span className="text-shin-yellow">C++ (GCC 13) / Python 3.11</span></span>
              </div>
              <div className="text-shin-yellow flex items-center gap-1.5 font-bangers text-sm tracking-wide">
                <Star className="w-3.5 h-3.5 fill-shin-yellow text-shin-yellow" />
                2 Real-Time Socket Streams Active
              </div>
            </div>
          </div>

          {/* Three Feature Cards with Comic Styling */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
            {/* Feature 1 */}
            <div className="card-shin hover:-translate-y-1.5 hover:shadow-sticker-yellow transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-shin-yellow border-[2.5px] border-shin-outline flex items-center justify-center shadow-sticker-sm animate-shin-bounce">
                <Zap className="w-6 h-6 text-shin-outline" />
              </div>
              <h3 className="font-bangers text-xl tracking-wide text-shin-yellow">Redis Matchmaking</h3>
              <p className="text-xs text-shin-cream font-comic font-bold leading-relaxed">
                Uses Redis Sorted Sets with <code className="text-shin-yellow bg-shin-navy px-1 rounded">ZRANGEBYSCORE</code> to pair players within ±100 ELO without database polling.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card-shin hover:-translate-y-1.5 hover:shadow-sticker-blue transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-shin-blue border-[2.5px] border-shin-outline flex items-center justify-center shadow-sticker-sm animate-shin-bounce" style={{ animationDelay: '0.4s' }}>
                <Shield className="w-6 h-6 text-shin-outline" />
              </div>
              <h3 className="font-bangers text-xl tracking-wide text-shin-blue">Isolated Sandbox</h3>
              <p className="text-xs text-shin-cream font-comic font-bold leading-relaxed">
                Air-gapped execution runner with hard memory limits, timeout guards, and ephemeral test isolation supporting C++, Python & JS.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card-shin hover:-translate-y-1.5 hover:shadow-sticker-red transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-shin-red border-[2.5px] border-shin-outline flex items-center justify-center shadow-sticker-sm animate-shin-bounce" style={{ animationDelay: '0.8s' }}>
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bangers text-xl tracking-wide text-shin-red">Editorial Review</h3>
              <p className="text-xs text-shin-cream font-comic font-bold leading-relaxed">
                Post-match asymptotic breakdown computing Big-O Time & Space complexities with edge case analysis against the optimal solution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ThemedBackground>
  );
};
