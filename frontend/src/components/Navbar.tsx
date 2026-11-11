import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Swords, Trophy, History, LogOut, Volume2, VolumeX, Star, Zap } from 'lucide-react';
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
    <nav className="bg-shin-card/95 backdrop-blur-md border-b-[3px] border-shin-outline sticky top-0 z-50 shadow-sticker">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            {/* Shinchan Shirt & Shorts Icon Badge */}
            <div className="w-9 h-9 rounded-2xl bg-shin-yellow border-[2.5px] border-shin-outline flex items-center justify-center group-hover:scale-110 group-hover:-rotate-6 transition-all shadow-sticker-sm">
              <span className="font-bangers text-shin-outline text-lg tracking-wide">CA</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bangers tracking-wider text-shin-yellow group-hover:text-shin-yellow-soft transition-colors drop-shadow-sm">
                CodeArena
              </span>
              <span className="text-[10px] font-comic font-black text-shin-red bg-shin-red/10 border border-shin-red/30 px-1.5 py-0.2 rounded-md">
                v1.0
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-2 text-sm font-black">
              <Link
                to="/dashboard"
                className={`px-3.5 py-1.5 rounded-2xl border-[2.5px] transition-all flex items-center gap-1.5 ${
                  isActive('/dashboard') || isActive('/battle') || isActive('/matchmaking')
                    ? 'text-shin-outline bg-shin-yellow border-shin-outline shadow-sticker-sm scale-105'
                    : 'text-shin-muted hover:text-shin-yellow border-transparent hover:border-shin-outline/40 hover:bg-shin-navy/60'
                }`}
              >
                <Swords className="w-4 h-4" />
                <span className="font-comic text-base">Arena</span>
              </Link>
              <Link
                to="/leaderboard"
                className={`px-3.5 py-1.5 rounded-2xl border-[2.5px] transition-all flex items-center gap-1.5 ${
                  isActive('/leaderboard')
                    ? 'text-shin-outline bg-shin-yellow border-shin-outline shadow-sticker-sm scale-105'
                    : 'text-shin-muted hover:text-shin-yellow border-transparent hover:border-shin-outline/40 hover:bg-shin-navy/60'
                }`}
              >
                <Trophy className="w-4 h-4" />
                <span className="font-comic text-base">Rankings</span>
              </Link>
              <Link
                to="/history"
                className={`px-3.5 py-1.5 rounded-2xl border-[2.5px] transition-all flex items-center gap-1.5 ${
                  isActive('/history')
                    ? 'text-shin-outline bg-shin-yellow border-shin-outline shadow-sticker-sm scale-105'
                    : 'text-shin-muted hover:text-shin-yellow border-transparent hover:border-shin-outline/40 hover:bg-shin-navy/60'
                }`}
              >
                <History className="w-4 h-4" />
                <span className="font-comic text-base">Archive</span>
              </Link>
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Sound Mute Toggle */}
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-2xl bg-shin-navy border-[2px] border-shin-outline text-shin-muted hover:text-shin-yellow hover:border-shin-yellow transition-all shadow-sticker-sm active:translate-y-0.5"
            title={muted ? 'Unmute match audio' : 'Mute match audio'}
            aria-label="Toggle Sound"
          >
            {muted ? <VolumeX className="w-4 h-4 text-shin-muted" /> : <Volume2 className="w-4 h-4 text-shin-yellow" />}
          </button>

          {/* Live WS Status Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-shin-navy border-[2px] border-shin-outline text-[11px] font-mono text-shin-muted">
            <span className="w-2 h-2 rounded-full bg-shin-yellow animate-shin-pulse" />
            <span className="font-bold">ws://online</span>
          </div>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              {/* ELO Rating Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-shin-yellow/15 border-[2px] border-shin-outline font-mono text-xs shadow-sticker-sm">
                <Star className="w-3.5 h-3.5 text-shin-yellow fill-shin-yellow" />
                <span className="font-black text-shin-yellow font-bangers text-sm tracking-wide">{user.elo_rating}</span>
              </div>

              {/* User Profile */}
              <Link
                to="/profile"
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-2xl hover:bg-shin-navy border-[2px] border-transparent hover:border-shin-outline transition-all"
                title="Your Profile"
              >
                <div className="w-7 h-7 rounded-xl bg-shin-red border-[2px] border-shin-outline flex items-center justify-center text-xs font-black text-white shadow-sticker-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-bold text-white hidden sm:inline-block font-comic">
                  {user.username}
                </span>
              </Link>

              {/* Sign out button */}
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-2xl text-shin-muted hover:text-shin-red hover:bg-shin-red/10 border-[2px] border-transparent hover:border-shin-outline transition-all"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn-shin-yellow text-xs px-4 py-2"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
