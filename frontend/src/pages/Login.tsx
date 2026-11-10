import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, ArrowRight, Github, Zap } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('sachin_dev');
  const [email, setEmail] = useState('sachin@nitp.ac.in');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle GitHub OAuth callback if ?code= is in URL
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setLoading(true);
      authApi.githubLogin(code)
        .then((data) => {
          login(data.access_token, data.user);
          navigate('/dashboard');
        })
        .catch((err) => {
          setError(err?.response?.data?.detail || 'GitHub authentication failed');
          setLoading(false);
        });
    }
  }, [searchParams, login, navigate]);

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

  const handleGitHubOAuth = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (!clientId) {
      setError('GitHub OAuth client ID is not configured. Use instant handle login below.');
      return;
    }
    const redirectUri = window.location.origin + '/login';
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-shin-bg flex items-center justify-center p-4">
      {/* Yellow glow blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-shin-yellow/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm bg-shin-panel border-2 border-shin-yellow/30 rounded-2xl p-7 shadow-2xl relative"
        style={{ boxShadow: '6px 6px 0px #1a1740, 0 0 40px rgba(255,215,0,0.08)' }}>

        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-shin-yellow mx-auto flex items-center justify-center mb-4 shadow-lg shadow-shin-yellow/30 animate-shin-bounce">
            <Zap className="w-7 h-7 text-shin-bg" strokeWidth={3} />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Join CodeArena!</h2>
          <p className="text-xs text-shin-muted mt-1 font-semibold">Authenticate your handle to enter ranked duels</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-shin-red/10 border border-shin-red/30 text-shin-red text-xs font-bold font-mono">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleGitHubOAuth}
          disabled={loading}
          className="w-full mb-4 py-2.5 px-4 rounded-xl bg-shin-border hover:bg-shin-border/80 border-2 border-shin-border hover:border-shin-muted text-shin-white font-bold text-sm transition-all flex items-center justify-center gap-2"
        >
          <Github className="w-4 h-4" />
          <span>Continue with GitHub</span>
        </button>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-shin-border" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-shin-panel px-3 text-shin-muted font-black tracking-wider">Or use handle</span>
          </div>
        </div>

        <form onSubmit={handleDevLogin} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-shin-yellow uppercase tracking-wider mb-1.5 font-black text-[10px]">
              Coder Handle
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-shin-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-shin-bg border-2 border-shin-border rounded-xl py-2 pl-9 pr-3 text-shin-white placeholder-shin-muted focus:outline-none focus:border-shin-yellow/60 transition-colors font-mono text-xs"
                placeholder="sachiin"
              />
            </div>
          </div>

          <div>
            <label className="block text-shin-yellow uppercase tracking-wider mb-1.5 font-black text-[10px]">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-shin-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-shin-bg border-2 border-shin-border rounded-xl py-2 pl-9 pr-3 text-shin-white placeholder-shin-muted focus:outline-none focus:border-shin-yellow/60 transition-colors font-mono text-xs"
                placeholder="sachin@nitp.ac.in"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-shin-yellow hover:bg-shin-yellow-soft text-shin-bg font-black text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-shin-yellow/20"
            style={{ boxShadow: '3px 3px 0px #E8192C' }}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-shin-bg border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>⚡ Enter Arena</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-shin-border text-center">
          <p className="text-[11px] text-shin-muted font-mono font-bold">
            Fast session auth • Instant arena access
          </p>
        </div>
      </div>
    </div>
  );
};
