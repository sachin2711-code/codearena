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
      </div>
    </BrowserRouter>
  );
};

export default App;
