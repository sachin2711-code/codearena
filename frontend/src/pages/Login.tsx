import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, User, Mail, ArrowRight } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('sachin_dev');
  const [email, setEmail] = useState('sachin@nitp.ac.in');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email) return;

    setLoading(true);
    setError(null);
    try {
      const data = await authApi.devLogin(username, email);
      login(data.access_token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#090a0f] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-xl p-7 shadow-2xl relative">
        <div className="text-center mb-6">
          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-700 mx-auto flex items-center justify-center text-emerald-400 mb-3">
            <Terminal className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight font-mono">Sign in to CodeArena</h2>
          <p className="text-xs text-zinc-400 mt-1">Authenticate your competitive handle to join ranked duels</p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleDevLogin} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-zinc-400 uppercase tracking-wider mb-1.5 font-bold text-[10px]">
              Coder Handle
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#111217] border border-zinc-800 rounded-md py-2 pl-9 pr-3 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                placeholder="sachiin"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 uppercase tracking-wider mb-1.5 font-bold text-[10px]">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#111217] border border-zinc-800 rounded-md py-2 pl-9 pr-3 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
                placeholder="sachin@nitp.ac.in"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-md bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Enter Arena</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center">
          <p className="text-[11px] text-zinc-500 font-mono">
            Direct token authentication. Local sandbox data is stored in SQLite.
          </p>
        </div>
      </div>
    </div>
  );
};
