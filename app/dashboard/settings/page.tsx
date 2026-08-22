'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SettingsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  const successMsg = searchParams?.get('success');
  const errorMsg = searchParams?.get('error');

  // Tarik data akun dari API
  const fetchAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const res = await fetch('/api/accounts');
      const data = await res.json();
      if (res.ok) {
        setLinkedAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error("Gagal menarik data akun");
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleConnectAccount = () => {
    setIsConnecting(true);
    // Tembak langsung ke mesin OAuth kita
    window.location.href = '/api/auth/connect';
  };

  const handleRevokeAccount = async (emailToRevoke: string) => {
    if (!confirm(`Yakin mau mutus koneksi akun ${emailToRevoke}?`)) return;
    
    try {
      const res = await fetch('/api/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailToRevoke }),
      });
      
      if (res.ok) {
        // Refresh tabel setelah sukses hapus
        fetchAccounts();
      } else {
        alert("Gagal menghapus akun.");
      }
    } catch (err) {
      console.error("Error menghapus akun:", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <header className="border-b border-gray-200 pb-5">
        <h2 className="text-3xl font-bold text-[#2A0510]">Settings & Access Control</h2>
        <p className="text-gray-500 mt-2 text-sm tracking-wide">Kelola preferensi keamanan, token, dan akun Google terhubung.</p>
      </header>

      {successMsg && (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 text-sm font-medium">
          Berhasil menyambungkan akun baru ke sistem.
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 text-sm font-medium">
          Gagal menyambungkan akun: {errorMsg.replace(/_/g, ' ')}
        </div>
      )}

      {/* BLOK 1: Global Security */}
      <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#2A0510]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Mode Penyimpanan Master
            </h3>
            <p className="text-sm text-gray-500 mt-1">Atur hak akses operasional sistem secara global.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-sm font-medium ${!isReadOnly ? 'text-gray-800' : 'text-gray-400'}`}>Read / Write</span>
            <button onClick={() => setIsReadOnly(!isReadOnly)} className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${isReadOnly ? 'bg-red-600' : 'bg-[#2A0510]'}`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${isReadOnly ? 'translate-x-8' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${isReadOnly ? 'text-red-600' : 'text-gray-400'}`}>Locked</span>
          </div>
        </div>
      </section>

      {/* BLOK 2: Linked Accounts */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Daftar Akun Otorisasi</h3>
            <p className="text-sm text-gray-500">Kelola token OAuth Google Drive yang terhubung.</p>
          </div>
          <button onClick={handleConnectAccount} disabled={isConnecting} className="bg-[#2A0510] hover:bg-[#4a0920] text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-70 flex items-center gap-2">
            {isConnecting ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : '+'}
            <span>Connect Account</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium border-b border-gray-100">Akun (Email)</th>
                <th className="p-4 font-medium border-b border-gray-100">Status</th>
                <th className="p-4 font-medium border-b border-gray-100 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              
              {/* Row Akun Utama */}
              <tr className="hover:bg-gray-50/50 transition-colors bg-green-50/30">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-xs">
                      {session?.user?.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{session?.user?.email}</p>
                      <p className="text-xs text-gray-500">Node Utama (Admin)</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Aktif
                  </span>
                </td>
                <td className="p-4 text-right text-xs text-gray-400 italic">Protected</td>
              </tr>
              
              {/* Row Akun Tambahan */}
              {isLoadingAccounts ? (
                <tr><td colSpan={3} className="p-6 text-center text-sm text-gray-400 animate-pulse">Memuat data brankas...</td></tr>
              ) : linkedAccounts.length === 0 ? (
                <tr><td colSpan={3} className="p-6 text-center text-sm text-gray-400">Belum ada akun tambahan yang terhubung.</td></tr>
              ) : (
                linkedAccounts.map((acc, index) => (
                  <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {acc.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{acc.email}</p>
                          <p className="text-xs text-gray-500">Secondary Node</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${acc.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${acc.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span> {acc.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleRevokeAccount(acc.email)} className="text-gray-400 hover:text-red-500 p-1.5 rounded transition-colors" title="Revoke Access">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* BLOK 3: System Telemetry */}
      {/* ... (Blok Redis & Versi) ... */}
    </div>
  );
}