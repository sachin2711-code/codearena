import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, ArrowRight, Github, Zap } from 'lucide-react';
import { authApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import { ThemedBackground } from '../components/ThemedBackground';

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
    <ThemedBackground variant="login">
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-sm card-shin bg-shin-card shadow-sticker-lg relative">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-3xl bg-shin-yellow border-[3px] border-shin-outline mx-auto flex items-center justify-center mb-3 shadow-sticker-sm animate-shin-bounce">
              <Zap className="w-8 h-8 text-shin-outline" strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-bangers text-white tracking-wide">
              Sign in to <span className="text-shin-yellow">CodeArena</span>
            </h2>
            <div className="mt-2 text-xs font-comic font-black text-shin-muted bg-shin-navy px-3 py-1.5 rounded-xl border-[2px] border-shin-outline">
              "Enter your coder handle to join ranked duels!"
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-shin-red/20 border-[2px] border-shin-red text-white text-xs font-comic font-black shadow-sticker-sm">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGitHubOAuth}
            disabled={loading}
            className="w-full mb-4 btn-shin-outline py-2.5"
          >
            <Github className="w-4 h-4 text-white" />
            <span className="font-bangers text-base tracking-wide">Continue with GitHub</span>
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-[2px] border-shin-outline" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-shin-card px-3 text-shin-muted font-bangers tracking-wider text-xs">
                Or Instant Handle
              </span>
            </div>
          </div>

          <form onSubmit={handleDevLogin} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-shin-yellow uppercase tracking-wider mb-1.5 font-bangers text-sm">
                Coder Handle
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-shin-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full input-shin pl-10 text-sm"
                  placeholder="sachin_dev"
                />
              </div>
            </div>

            <div>
              <label className="block text-shin-yellow uppercase tracking-wider mb-1.5 font-bangers text-sm">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-shin-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full input-shin pl-10 text-sm"
                  placeholder="sachin@nitp.ac.in"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 btn-shin-yellow py-3.5 shadow-sticker"
            >
              {loading ? (
                <div className="w-5 h-5 border-3 border-shin-outline border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="font-bangers text-lg tracking-wider">⚡ Enter Arena</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t-[2px] border-shin-outline text-center">
            <p className="text-[11px] text-shin-muted font-comic font-black">
              Fast session auth • Instant ranked access
            </p>
          </div>
        </div>
      </div>
    </ThemedBackground>
  );
};
