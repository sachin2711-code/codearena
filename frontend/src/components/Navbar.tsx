import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Swords, Trophy, History, LogOut, Radio, Volume2, VolumeX, Star } from 'lucide-react';
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
    <nav className="bg-shin-panel/95 backdrop-blur-md border-b-2 border-shin-yellow/40 sticky top-0 z-50 shadow-lg shadow-shin-yellow/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-shin-yellow flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-shin-yellow/30">
              <span className="text-shin-bg font-black text-sm font-mono">CA</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black tracking-tight text-shin-yellow font-sans">
                CodeArena
              </span>
              <span className="text-[10px] font-mono text-shin-muted">v1.0</span>
            </div>
          </Link>

          {/* Navigation Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-1 text-sm font-bold">
              <Link
                to="/dashboard"
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
                  isActive('/dashboard') || isActive('/battle') || isActive('/matchmaking')
                    ? 'text-shin-bg bg-shin-yellow font-extrabold shadow-md shadow-shin-yellow/30'
                    : 'text-shin-muted hover:text-shin-yellow hover:bg-shin-yellow/10'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Arena</span>
              </Link>
              <Link
                to="/leaderboard"
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
                  isActive('/leaderboard')
                    ? 'text-shin-bg bg-shin-yellow font-extrabold shadow-md shadow-shin-yellow/30'
                    : 'text-shin-muted hover:text-shin-yellow hover:bg-shin-yellow/10'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Rankings</span>
              </Link>
              <Link
                to="/history"
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
                  isActive('/history')
                    ? 'text-shin-bg bg-shin-yellow font-extrabold shadow-md shadow-shin-yellow/30'
                    : 'text-shin-muted hover:text-shin-yellow hover:bg-shin-yellow/10'
                }`}
              >
                <History className="w-3.5 h-3.5" />
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
            className="p-1.5 rounded-xl bg-shin-border/60 border border-shin-border text-shin-muted hover:text-shin-yellow hover:border-shin-yellow/40 transition-all"
            title={muted ? 'Unmute match audio' : 'Mute match audio'}
            aria-label="Toggle Sound"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-shin-yellow" />}
          </button>

          {/* Server status pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-shin-border/40 border border-shin-border text-[11px] font-mono text-shin-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-shin-yellow animate-pulse" />
            <span>ws://live</span>
          </div>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-shin-yellow/10 border border-shin-yellow/30 font-mono text-xs">
                <Star className="w-3 h-3 text-shin-yellow" />
                <span className="font-black text-shin-yellow">{user.elo_rating}</span>
              </div>

              <Link
                to="/profile"
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-shin-yellow/10 transition-colors"
                title="Your Profile"
              >
                <div className="w-6 h-6 rounded-lg bg-shin-yellow flex items-center justify-center text-xs font-black text-shin-bg">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-shin-white hidden sm:inline-block">
                  {user.username}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="p-1.5 rounded-xl text-shin-muted hover:text-shin-red hover:bg-shin-red/10 transition-all"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-4 py-1.5 rounded-xl text-xs font-black text-shin-bg bg-shin-yellow hover:bg-shin-yellow-soft transition-all shadow-md shadow-shin-yellow/20"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
