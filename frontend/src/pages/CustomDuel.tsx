import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Swords, Link2, Copy, Check, Users, ArrowRight, Loader2, AlertCircle, X } from 'lucide-react';
import { socketService } from '../services/socket';
import { useMatchStore } from '../stores/matchStore';

export const CustomDuel: React.FC = () => {
  const { roomCode: paramCode } = useParams<{ roomCode?: string }>();
  const navigate = useNavigate();
  const { setMatch } = useMatchStore();

  const [activeCode, setActiveCode] = useState<string>(paramCode ? paramCode.toUpperCase() : '');
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'idle' | 'creating' | 'waiting' | 'joining'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [joinInput, setJoinInput] = useState('');

  const duelUrl = activeCode ? `${window.location.origin}/duel/${activeCode}` : '';

  useEffect(() => {
    const socket = socketService.connect();

    socket.on('custom_room_created', (data: { room_code: string }) => {
      setActiveCode(data.room_code);
      setStatus('waiting');
    });

    socket.on('custom_room_error', (data: { message: string }) => {
      setError(data.message);
      setStatus('idle');
    });

    socket.on('match_found', (data) => {
      setMatch(data);
      navigate('/battle');
    });

    // If navigated with a room code in URL, join immediately
    if (paramCode && status === 'idle') {
      setStatus('joining');
      socket.emit('join_custom_room', { room_code: paramCode.trim().toUpperCase() });
    }

    return () => {
      socket.off('custom_room_created');
      socket.off('custom_room_error');
      socket.off('match_found');
    };
  }, [paramCode, navigate, setMatch, status]);

  const handleCreateRoom = () => {
    setError(null);
    setStatus('creating');
    const socket = socketService.connect();
    socket.emit('create_custom_room');
  };

  const handleJoinManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinInput.trim()) return;
    setError(null);
    setStatus('joining');
    const code = joinInput.trim().toUpperCase();
    setActiveCode(code);
    const socket = socketService.connect();
    socket.emit('join_custom_room', { room_code: code });
  };

  const handleCopy = () => {
    if (!duelUrl) return;
    navigator.clipboard.writeText(duelUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#090a0f] flex items-center justify-center p-4 font-mono text-zinc-300">
      <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl relative">
        <div className="text-center space-y-1.5">
          <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-emerald-400 mb-2">
            <Users className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight font-sans">
            Private 1v1 Friendly Duel
          </h1>
          <p className="text-xs text-zinc-400 font-sans">
            Challenge a specific friend with a shareable invite link
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Room Waiting View */}
        {status === 'waiting' && activeCode ? (
          <div className="space-y-4 text-center py-2">
            <div className="p-4 rounded-lg bg-[#111217] border border-zinc-800 space-y-2">
              <span className="text-[10px] uppercase text-zinc-500 tracking-wider font-bold">Room Code</span>
              <div className="text-2xl font-bold tracking-widest text-emerald-400 select-all font-mono">
                {activeCode}
              </div>
            </div>

            <div className="space-y-2 text-left">
              <span className="text-[11px] text-zinc-400 font-sans block">Share this challenge link with your friend:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={duelUrl}
                  className="flex-1 bg-[#111217] border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none select-all"
                />
                <button
                  onClick={handleCopy}
                  className="px-3 py-2 rounded bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 pt-2 font-sans">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>Waiting for friend to open link & connect...</span>
            </div>

            <button
              onClick={() => { setStatus('idle'); setActiveCode(''); }}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors pt-2 block mx-auto font-sans"
            >
              Cancel Room
            </button>
          </div>
        ) : status === 'joining' ? (
          <div className="py-8 text-center space-y-3 font-sans">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
            <p className="text-xs text-zinc-400">Connecting to Room <span className="font-mono text-white">{activeCode}</span>...</p>
          </div>
        ) : (
          /* Initial Screen: Create or Join */
          <div className="space-y-6 pt-2">
            <button
              onClick={handleCreateRoom}
              disabled={status === 'creating'}
              className="w-full py-3 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-mono font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {status === 'creating' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  <span>Create Challenge Link</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-zinc-800 w-full" />
              <span className="bg-zinc-950 px-3 text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                or join room
              </span>
            </div>

            <form onSubmit={handleJoinManual} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">
                  Enter 6-Character Room Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                  placeholder="e.g. 7X92B1"
                  className="w-full bg-[#111217] border border-zinc-800 rounded px-3 py-2 text-sm text-center tracking-widest text-white uppercase focus:outline-none focus:border-zinc-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={!joinInput.trim()}
                className="w-full py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-mono text-xs font-semibold transition-colors disabled:opacity-40"
              >
                Join Duel
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
