'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Gatekeeper() {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/gatekeeper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Akses ditolak');
        setLoading(false);
        return;
      }

      if (data.role === 'admin') {
        setIsAdmin(true);
      } else {
        router.push('/dashboard'); 
      }
    } catch (err) {
      setError('Koneksi terputus');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-950 border border-gray-800 rounded-lg p-8 shadow-[0_0_20px_rgba(0,255,0,0.05)] relative overflow-hidden">
        {/* Dekorasi Garis Pemindai */}
        <div className="absolute top-0 left-0 w-full h-1 bg-green-500/20 shadow-[0_0_10px_rgba(0,255,0,0.5)] animate-pulse" />
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-mono text-green-500 tracking-[0.2em] uppercase">Security Level 4</h1>
          <p className="text-gray-600 text-xs mt-2 font-mono uppercase tracking-widest">Awaiting Authorization</p>
        </div>

        {!isAdmin ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-black border border-gray-800 rounded p-4 text-green-500 font-mono tracking-widest text-center focus:outline-none focus:border-green-500 transition-colors"
                placeholder="******"
                disabled={loading}
                autoComplete="off"
              />
            </div>
            {error && <p className="text-red-500 text-xs font-mono text-center tracking-widest uppercase">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-900/10 hover:bg-green-900/30 text-green-500 border border-green-800 rounded py-3 font-mono tracking-[0.1em] transition-all"
            >
              {loading ? 'VERIFYING...' : 'INITIALIZE'}
            </button>
          </form>
        ) : (
          <div className="space-y-6 text-center animate-fade-in">
            <p className="text-green-500 font-mono text-sm tracking-widest uppercase">Admin Identity Confirmed</p>
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="w-full bg-white text-black py-4 rounded font-bold hover:bg-gray-200 transition-colors tracking-wide"
            >
              Sign In (OAuth 2.0)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}