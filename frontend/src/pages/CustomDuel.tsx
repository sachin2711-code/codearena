import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Swords, Link2, Copy, Check, Users, ArrowRight, Loader2, AlertCircle, Send } from 'lucide-react';
import { socketService } from '../services/socket';
import { useMatchStore } from '../stores/matchStore';
import { sound } from '../utils/sound';
import { ThemedBackground } from '../components/ThemedBackground';

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
      sound.playMatchFound();
      setMatch(data);
      navigate('/battle');
    });

    // If navigated with a room code in URL, join immediately
    if (paramCode && status === 'idle') {
      setStatus('joining');
      socket.emit('join_custom_room', {
        room_code: paramCode.trim().toUpperCase(),
        token: localStorage.getItem('token'),
      });
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
    socket.emit('create_custom_room', { token: localStorage.getItem('token') });
  };

  const handleJoinManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinInput.trim()) return;
    setError(null);
    setStatus('joining');
    const code = joinInput.trim().toUpperCase();
    setActiveCode(code);
    const socket = socketService.connect();
    socket.emit('join_custom_room', {
      room_code: code,
      token: localStorage.getItem('token'),
    });
  };

  const handleCopy = () => {
    if (!duelUrl) return;
    navigator.clipboard.writeText(duelUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!duelUrl) return;
    const text = encodeURIComponent(`⚔️ I challenge you to a 1v1 Shinchan coding duel on CodeArena!\n\nRoom Code: ${activeCode}\nJoin the battle: ${duelUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <ThemedBackground variant="battle">
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
        <div className="card-shin max-w-md w-full bg-shin-card border-[3px] border-shin-outline p-6 sm:p-8 space-y-6 shadow-sticker-lg relative">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-shin-yellow border-[3px] border-shin-outline mx-auto flex items-center justify-center text-shin-outline shadow-sticker animate-shin-bounce mb-2">
              <Swords className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bangers text-white tracking-wide">
              Friendly 1v1 Duel
            </h1>
            <p className="text-xs text-shin-cream font-comic font-bold">
              Challenge a buddy to an epic code showdown with a custom room link
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-shin-red text-white border-[2px] border-shin-outline text-xs font-comic font-bold flex items-center gap-2 shadow-sticker-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Room Waiting View */}
          {status === 'waiting' && activeCode ? (
            <div className="space-y-4 text-center py-2">
              <div className="p-4 rounded-2xl bg-shin-navy border-[2.5px] border-shin-outline space-y-1 shadow-sticker-sm">
                <span className="text-[11px] uppercase text-shin-yellow tracking-wider font-bangers">ROOM PASSCODE</span>
                <div className="text-4xl font-bangers tracking-widest text-shin-yellow select-all">
                  {activeCode}
                </div>
              </div>

              <div className="space-y-2 text-left font-comic">
                <span className="text-xs text-white font-bold block">Send this battle link to your opponent:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={duelUrl}
                    className="flex-1 input-shin text-xs font-mono select-all py-2"
                  />
                  <button
                    onClick={handleCopy}
                    className="btn-shin-yellow px-4 py-2 text-xs font-bangers tracking-wider shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-shin-outline" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>

                <button
                  onClick={handleShareWhatsApp}
                  className="btn-shin-outline w-full mt-2 py-2.5 px-3 bg-[#25D366]/20 border-[#25D366] text-[#25D366] hover:bg-[#25D366]/30 font-bangers text-base tracking-wide flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Challenge on WhatsApp</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-shin-yellow pt-2 font-comic font-bold">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Waiting for friend to join room...</span>
              </div>

              <button
                onClick={() => { setStatus('idle'); setActiveCode(''); }}
                className="text-xs text-shin-muted hover:text-white transition-colors pt-2 block mx-auto font-comic font-black"
              >
                Cancel Room
              </button>
            </div>
          ) : status === 'joining' ? (
            <div className="py-8 text-center space-y-3 font-comic">
              <div className="w-10 h-10 border-[3px] border-shin-outline border-t-shin-yellow rounded-full animate-spin mx-auto" />
              <p className="text-sm font-bold text-white">Connecting to Room <span className="font-bangers text-shin-yellow text-lg tracking-wider">{activeCode}</span>...</p>
            </div>
          ) : (
            /* Initial Screen: Create or Join */
            <div className="space-y-5 pt-1">
              <button
                onClick={handleCreateRoom}
                disabled={status === 'creating'}
                className="btn-shin-yellow w-full py-3.5 flex items-center justify-center gap-2 font-bangers text-lg tracking-wide shadow-sticker"
              >
                {status === 'creating' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Link2 className="w-5 h-5" />
                    <span>CREATE ROOM LINK</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="relative flex items-center justify-center">
                <div className="border-t-[2px] border-shin-outline/60 w-full" />
                <span className="bg-shin-card px-3 text-xs text-shin-muted uppercase font-bangers tracking-wider">
                  OR ENTER ROOM CODE
                </span>
              </div>

              <form onSubmit={handleJoinManual} className="space-y-3">
                <div>
                  <input
                    type="text"
                    maxLength={6}
                    value={joinInput}
                    onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                    placeholder="ENTER 6-DIGIT CODE"
                    className="w-full input-shin text-center tracking-widest text-lg font-bangers placeholder:font-comic placeholder:text-xs placeholder:tracking-normal py-2.5"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!joinInput.trim()}
                  className="btn-shin-outline w-full py-2.5 font-bangers text-base tracking-wide text-white disabled:opacity-40"
                >
                  JOIN DUEL
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </ThemedBackground>
  );
};
export default CustomDuel;
