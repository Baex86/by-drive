'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Gatekeeper() {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // State baru untuk nahan user kalau belum setup Google
  const [needsSetup, setNeedsSetup] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Validasi PIN ke NextAuth
    const resAdmin = await signIn('credentials', {
      redirect: false,
      password: passcode, 
    });

    if (resAdmin && !resAdmin.error) {
      // PIN BENAR! Sekarang cek ke Redis, Google-nya udah ada belum?
      try {
        const accRes = await fetch('/api/accounts');
        const accData = await accRes.json();

        if (accData.accounts && accData.accounts.length > 0) {
          // Udah ada token Google -> Bablas Dashboard
          router.push('/dashboard');
        } else {
          // KOSONG! Tahan di sini, paksa setup Google
          setNeedsSetup(true);
          setLoading(false);
        }
      } catch (err) {
        setError('Gagal memverifikasi status brankas.');
        setLoading(false);
      }
      return;
    }

    // 2. Kalau PIN gagal di NextAuth, coba jalur Guest API
    try {
      const resGuest = await fetch('/api/auth/gatekeeper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      const data = await resGuest.json();

      if (resGuest.ok && data.role === 'guest') {
        router.push('/dashboard');
        return;
      } else {
        setError(data.error || 'Kredensial tidak valid');
      }
    } catch (err) {
      setError('Koneksi sistem terputus');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden transition-all duration-500">
        <div className="bg-[#2A0510] p-8 text-center">
          <h1 className="text-3xl font-bold text-white tracking-widest">BY DRIVE</h1>
          <p className="text-white/70 text-xs uppercase tracking-widest mt-2">Aggregator System</p>
        </div>
        
        <div className="p-8">
          {!needsSetup ? (
            // ================= FORM PIN =================
            <>
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-gray-800">Administrator Login</h2>
                <p className="text-gray-500 text-sm mt-1">Masukkan kredensial sistem untuk melanjutkan</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <input
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-gray-800 text-center font-bold tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-[#2A0510] focus:border-transparent transition-all"
                    placeholder="••••••"
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
                
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center font-medium">
                    {error}
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#2A0510] hover:bg-[#3d0818] text-white rounded-xl py-3 font-bold tracking-wide transition-all shadow-md disabled:opacity-70 flex justify-center items-center"
                >
                  {loading ? 'Memverifikasi...' : 'Masuk ke Sistem'}
                </button>
              </form>
            </>
          ) : (
            // ================= FORM SETUP GOOGLE =================
            <div className="text-center space-y-6 animate-fade-in">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Inisialisasi Database</h2>
                <p className="text-gray-500 text-sm mt-2">Sistem belum memiliki Node Utama. Anda wajib menghubungkan akun Google pertama untuk mulai menggunakan dasbor.</p>
              </div>
              <button
                onClick={() => window.location.href = '/api/auth/connect'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-bold tracking-wide transition-all shadow-md flex justify-center items-center gap-2"
              >
                Sign In (OAuth 2.0)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}