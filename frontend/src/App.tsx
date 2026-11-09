import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AnimatedCursor } from './components/AnimatedCursor';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Matchmaking } from './pages/Matchmaking';
import { Battle } from './pages/Battle';
import { CustomDuel } from './pages/CustomDuel';
import { Leaderboard } from './pages/Leaderboard';
import { MatchHistory } from './pages/MatchHistory';
import { Profile } from './pages/Profile';
import { Analysis } from './pages/Analysis';
import { Terms } from './pages/Terms';
import { Privacy } from './pages/Privacy';
import { useAuthStore } from './stores/authStore';

export const App: React.FC = () => {
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <BrowserRouter>
      <AnimatedCursor />
      <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/matchmaking" element={<Matchmaking />} />
              <Route path="/duel" element={<CustomDuel />} />
              <Route path="/duel/:roomCode" element={<CustomDuel />} />
              <Route path="/battle" element={<Battle />} />
              <Route path="/history" element={<MatchHistory />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/analysis/:matchId" element={<Analysis />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Minimal Platform Footer */}
        <footer className="border-t border-zinc-900 bg-[#090a0f] py-4 text-xs font-mono text-zinc-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span>CodeArena © 2026 • Real-time Algorithmic 1v1 Battleground</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/terms" className="hover:text-zinc-300 transition-colors">Terms</a>
              <span className="text-zinc-700">•</span>
              <a href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</a>
              <span className="text-zinc-700">•</span>
              <a
                href="https://github.com/sachin2711-code/codearena"
                target="_blank"
                rel="noreferrer"
                className="hover:text-zinc-300 transition-colors"
              >
                GitHub
              </a>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
