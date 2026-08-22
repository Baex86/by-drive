'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  
  const [storageData, setStorageData] = useState<any>(null);
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>({ video: 0, compressed: 0, image: 0, document: 0 });
  const [apiError, setApiError] = useState(false);
  
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Tarik Agregasi Kuota
  const fetchStorage = async () => {
    try {
      const res = await fetch('/api/drive/quota');
      if (res.ok) {
        const data = await res.json();
        setStorageData(data);
        setApiError(false);
      } else setApiError(true);
    } catch (err) {
      setApiError(true);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  // Tarik Agregasi Distribusi File
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/drive/stats');
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (err) {
      console.error("Gagal menarik stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Tarik Daftar Akun
  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setLinkedAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error("Gagal menarik daftar akun");
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchStorage();
      fetchAccounts();
      fetchStats();
    }
  }, [status]);

  if (status === 'loading') return null;

  const firstName = session?.user?.name?.split(' ')[0] || 'Administrator';
  const usageRaw = parseInt(storageData?.usage || '0');
  const limitRaw = parseInt(storageData?.limit || '0');
  const percentage = limitRaw > 0 ? Math.min((usageRaw / limitRaw) * 100, 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <header className="mb-10 border-b border-gray-200 pb-5">
        <h2 className="text-4xl font-bold text-[#2A0510]">Halo {firstName}</h2>
        <p className="text-gray-500 mt-2 text-sm tracking-wide">Command Center & Telemetry</p>
      </header>

      {apiError && !isLoadingStorage && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 border border-red-200">
          Gagal mengambil data dari Google API. Periksa status token.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kolom Kiri & Tengah */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Widget 1: Total Storage */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Total Kapasitas BY Drive</h3>
              <span className="text-xs font-bold bg-[#2A0510]/10 text-[#2A0510] px-3 py-1 rounded-full">Aggregator</span>
            </div>
            
            <div className="flex justify-between text-sm text-gray-500 mb-3">
              <span>Terpakai: <strong className="text-gray-800 text-lg">{isLoadingStorage ? 'Loading...' : formatBytes(usageRaw)}</strong></span>
              <span>Total: <strong className="text-gray-800 text-lg">{isLoadingStorage ? 'Loading...' : formatBytes(limitRaw)}</strong></span>
            </div>
            
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden relative">
              {isLoadingStorage && <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>}
              <div 
                className="bg-[#2A0510] h-4 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
            <p className="text-right text-xs mt-2 text-gray-400">{percentage.toFixed(1)}% Terpakai</p>
          </div>

          {/* Widget 2: File Breakdown */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
             <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Distribusi File</h3>
              <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-1 rounded">Live Data</span>
            </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center"><p className="text-2xl mb-2">🎥</p><p className="text-xs text-gray-400 font-bold">VIDEO</p><p className="text-lg font-bold text-gray-800 mt-1">{isLoadingStats ? '...' : statsData.video}</p></div>
               <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center"><p className="text-2xl mb-2">📦</p><p className="text-xs text-gray-400 font-bold">COMPRESSED</p><p className="text-lg font-bold text-gray-800 mt-1">{isLoadingStats ? '...' : statsData.compressed}</p></div>
               <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center"><p className="text-2xl mb-2">🖼️</p><p className="text-xs text-gray-400 font-bold">GAMBAR</p><p className="text-lg font-bold text-gray-800 mt-1">{isLoadingStats ? '...' : statsData.image}</p></div>
               <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center"><p className="text-2xl mb-2">📄</p><p className="text-xs text-gray-400 font-bold">DOKUMEN</p><p className="text-lg font-bold text-gray-800 mt-1">{isLoadingStats ? '...' : statsData.document}</p></div>
             </div>
          </div>
        </div>

        {/* Kolom Kanan: Account Roster */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Daftar Akun</h3>
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </div>
            
            <div className="space-y-3 flex-1">
              <div className="flex items-center p-3 bg-green-50 rounded-xl border border-green-100">
                <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold shrink-0">
                  {session?.user?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-bold text-gray-800 truncate">{session?.user?.email}</p>
                  <div className="flex items-center mt-1">
                    <span className="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded uppercase font-bold">Utama</span>
                  </div>
                </div>
              </div>

              {isLoadingAccounts ? (
                <div className="p-3 text-center text-xs text-gray-400 animate-pulse">Memuat...</div>
              ) : (
                linkedAccounts.map((acc, idx) => (
                  <div key={idx} className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                      {acc.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3 overflow-hidden">
                      <p className="text-sm font-bold text-gray-800 truncate">{acc.email}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded uppercase font-bold">Secondary</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <button 
              onClick={() => window.location.href='/dashboard/settings'}
              className="w-full mt-6 py-3 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 hover:border-gray-300 transition-all font-bold">
              Kelola Akun
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}