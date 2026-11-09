import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Swords, Trophy, History, Terminal, LogOut, Radio, Volume2, VolumeX } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { sound } from '../utils/sound';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [muted, setMuted] = useState(sound.isMuted());

  const toggleSound = () => {
    const next = sound.toggleMute();
    setMuted(next);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-[#0b0c10]/90 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-100 group-hover:border-zinc-500 transition-colors">
              <Terminal className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold tracking-tight text-white font-mono">
                codearena
              </span>
              <span className="text-[10px] font-mono text-zinc-400">v1.0</span>
            </div>
          </Link>

          {/* Navigation Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1 text-sm font-medium">
              <Link
                to="/dashboard"
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 ${
                  isActive('/dashboard') || isActive('/battle') || isActive('/matchmaking')
                    ? 'text-white bg-zinc-800/80 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <Swords className="w-3.5 h-3.5 text-zinc-400" />
                <span>Arena</span>
              </Link>
              <Link
                to="/leaderboard"
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 ${
                  isActive('/leaderboard')
                    ? 'text-white bg-zinc-800/80 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Rankings</span>
              </Link>
              <Link
                to="/history"
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 ${
                  isActive('/history')
                    ? 'text-white bg-zinc-800/80 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <History className="w-3.5 h-3.5 text-zinc-400" />
                <span>History</span>
              </Link>
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Sound Mute Toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title={muted ? 'Unmute match audio' : 'Mute match audio'}
            aria-label="Toggle Sound"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-zinc-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          {/* Server status pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>ws://online</span>
          </div>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-xs">
                <span className="text-zinc-400 text-[11px]">RATING</span>
                <span className="font-bold text-amber-400">{user.elo_rating}</span>
              </div>

              <Link
                to="/profile"
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-zinc-900 transition-colors"
                title="Your Profile"
              >
                <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-mono font-bold text-zinc-300">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-mono text-zinc-300 hidden sm:inline-block">
                  {user.username}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="p-1.5 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3.5 py-1.5 rounded-md text-xs font-mono font-medium text-zinc-900 bg-white hover:bg-zinc-200 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
