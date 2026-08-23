'use client';
import { useState, useEffect, useMemo, useRef } from 'react';

function formatBytes(bytes: string | number, decimals = 2) {
  const b = typeof bytes === 'string' ? parseInt(bytes) : bytes;
  if (!b || isNaN(b)) return '--';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatType(mimeType: string) {
  if (!mimeType) return 'File';
  if (mimeType === 'application/vnd.google-apps.folder') return 'Folder';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('document')) return 'Word';
  if (mimeType.includes('spreadsheet')) return 'Excel';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return 'Archive';
  if (mimeType.includes('video/mp4')) return 'MP4';
  if (mimeType.includes('image/jpeg')) return 'JPEG';
  if (mimeType.includes('image/png')) return 'PNG';
  const parts = mimeType.split('/');
  return parts.length > 1 ? `${parts[1].toUpperCase()}` : 'File';
}

export default function FileManagerPage() {
  const [files, setFiles] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [nextTokens, setNextTokens] = useState<Record<string, string | null | undefined>>({});
  const [error, setError] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [activeDrive, setActiveDrive] = useState('Semua Drive');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'modifiedTime', direction: 'desc' });

  // === STATE UI BARU ===
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid'); // Default Grid ala Drive
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  // === REF BUAT KLIK DI LUAR MENU ===
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetch('/api/accounts')
      .then(res => res.json())
      .then(data => { if (data.accounts) setAccounts(data.accounts.map((acc: any) => acc.email)); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchInitialFiles = async () => {
      setIsLoading(true); setError(false); setFiles([]); setNextTokens({});
      try {
        const driveParam = activeDrive === 'Semua Drive' ? 'all' : activeDrive;
        const res = await fetch(`/api/drive/files?drive=${encodeURIComponent(driveParam)}&sortKey=${sortConfig.key}&sortDir=${sortConfig.direction}&category=${encodeURIComponent(activeCategory)}`);
        
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setFiles(data.files || []);
            setNextTokens(data.tokens || {});
          }
        } else {
          if (isMounted) setError(true);
        }
      } catch (err) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchInitialFiles();
    return () => { isMounted = false };
  }, [activeDrive, sortConfig, activeCategory]); 

  const loadMoreFiles = async () => {
    if (isFetchingMore || activeDrive === 'Semua Drive') return; 
    const token = nextTokens[activeDrive];
    if (!token) return; 

    setIsFetchingMore(true);
    try {
      const res = await fetch(`/api/drive/files?drive=${encodeURIComponent(activeDrive)}&pageToken=${token}&sortKey=${sortConfig.key}&sortDir=${sortConfig.direction}&category=${encodeURIComponent(activeCategory)}`);
      if (res.ok) {
        const data = await res.json();
        setFiles(prev => [...prev, ...(data.files || [])]);
        setNextTokens(data.tokens || {});
      }
    } catch (err) { console.error(err); } finally { setIsFetchingMore(false); }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 20) loadMoreFiles();
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
  };

  const renderSortIndicator = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  };

  // === FUNGSI KLIK FILE (SMART PREVIEW) ===
  const handleFileClick = (file: any) => {
    const isImage = file.mimeType.startsWith('image/');
    const isAudio = file.mimeType.startsWith('audio/');
    
    if (isImage || isAudio) {
      setPreviewFile(file); // Buka modal in-app
    } else {
      window.open(file.webViewLink, '_blank'); // Lempar ke tab baru
    }
  };

  // === FUNGSI MENU DUMMY ===
  const handleMenuAction = (e: React.MouseEvent, action: string, file: any) => {
    e.stopPropagation();
    setActiveMenuId(null);
    alert(`Fitur ${action} untuk ${file.name} belum aktif. Tunggu API-nya dibangun.`);
  };

  const searchedFiles = useMemo(() => {
    return files.filter(file => file.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [files, searchQuery]);

  const hasMore = activeDrive !== 'Semua Drive' && !!nextTokens[activeDrive];

  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col space-y-4 animate-fade-in relative">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-[#2A0510]">File Explorer</h2>
          <p className="text-gray-500 text-sm tracking-wide">Aggregated Unified File System</p>
        </div>
        {/* === TOMBOL UPLOAD DUMMY === */}
        <button onClick={() => alert('Mesin Upload belum dipasang!')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md flex items-center gap-2 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          Upload Baru
        </button>
      </header>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm">
          Gagal menarik data agregator.
        </div>
      )}

      <div className="flex-1 flex bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-0">
        
        {/* SIDEBAR KIRI (TETAP SAMA) */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto shrink-0">
          <div className="p-4 space-y-6">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">Quick Access</p>
              <nav className="space-y-1 text-sm font-medium text-gray-700">
                {['Semua', 'Video', 'Music', 'Picture', 'Document'].map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${activeCategory === cat ? 'bg-[#2A0510]/10 text-[#2A0510] font-bold' : 'hover:bg-gray-200'}`}>
                    <span className="mr-3 text-lg">{cat === 'Semua' ? '🏠' : cat === 'Video' ? '🎬' : cat === 'Music' ? '🎵' : cat === 'Picture' ? '🖼️' : '📄'}</span>{cat}
                  </button>
                ))}
              </nav>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">Drives</p>
              <nav className="space-y-1 text-sm font-medium text-gray-700">
                <button onClick={() => setActiveDrive('Semua Drive')} className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${activeDrive === 'Semua Drive' ? 'bg-[#2A0510]/10 text-[#2A0510] font-bold' : 'hover:bg-gray-200'}`}>
                  <span className="mr-3 text-lg">☁️</span> Semua Drive
                </button>
                {accounts.map(drive => (
                  <button key={drive} onClick={() => setActiveDrive(drive)} className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors truncate ${activeDrive === drive ? 'bg-[#2A0510]/10 text-[#2A0510] font-bold' : 'hover:bg-gray-200'}`} title={drive}>
                    <span className="mr-3 text-lg">📁</span><span className="truncate">{drive.split('@')[0]}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* KONTEN KANAN */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 gap-4">
            <div className="flex-1 flex items-center bg-gray-50 border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-600 truncate">
              <span className="font-bold text-[#2A0510] shrink-0">BY Drive</span>
              <span className="mx-2 text-gray-400">/</span><span className="truncate shrink-0">{activeDrive}</span>
              <span className="mx-2 text-gray-400">/</span><span className="truncate">{activeCategory}</span>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <div className="w-64 relative">
                <input type="text" placeholder="Search file..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-[#2A0510] transition-colors" />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>

              {/* === TOGGLE VIEW MODE === */}
              <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`} title="List View">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                </button>
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`} title="Grid View">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-gray-50/50 p-4" onScroll={handleScroll}>
            {isLoading ? (
               <div className="flex flex-col items-center justify-center h-full text-gray-400">
                 <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-[#2A0510] rounded-full mb-4"></div>
                 <p>Mengkoneksikan node satelit...</p>
               </div>
            ) : searchedFiles.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-gray-400">
                 <div className="text-6xl mb-4">📂</div>
                 <p>Direktori ini kosong atau file tidak ditemukan.</p>
               </div>
            ) : (
              <>
                {/* === RENDER GRID VIEW === */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {searchedFiles.map((file, idx) => (
                      <div key={`${file.id}-${idx}`} className="bg-white rounded-xl border border-gray-200 p-3 hover:shadow-md hover:border-[#2A0510]/30 transition-all group relative cursor-pointer" onClick={() => handleFileClick(file)}>
                        
                        <div className="h-24 bg-gray-50 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                          {file.mimeType.startsWith('image/') && file.iconLink ? (
                             <img src={file.iconLink.replace('=s16', '=s200')} alt={file.name} className="w-full h-full object-cover" />
                          ) : (
                             <span className="text-4xl">{file.mimeType === 'application/vnd.google-apps.folder' ? '📁' : file.mimeType.includes('video/') ? '🎬' : '📄'}</span>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs font-semibold text-gray-700 truncate flex-1" title={file.name}>{file.name}</p>
                          
                          {/* TOMBOL TITIK TIGA (GRID) */}
                          <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(file.id); }} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">{formatType(file.mimeType)}</p>

                        {/* POPUP MENU (GRID) */}
                        {activeMenuId === file.id && (
                          <div ref={menuRef} className="absolute right-2 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1 text-sm font-medium">
                            <button onClick={(e) => handleMenuAction(e, 'Download', file)} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"><span className="text-lg">⬇️</span> Download</button>
                            <button onClick={(e) => handleMenuAction(e, 'Rename', file)} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"><span className="text-lg">✏️</span> Ganti Nama</button>
                            <button onClick={(e) => handleMenuAction(e, 'Move', file)} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"><span className="text-lg">📂</span> Pindahkan</button>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <button onClick={(e) => handleMenuAction(e, 'Delete', file)} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"><span className="text-lg">🗑️</span> Hapus</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* === RENDER LIST VIEW === */}
                {viewMode === 'list' && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-visible">
                    <table className="w-full text-left text-sm text-gray-700">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-gray-500 w-1/2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>Name {renderSortIndicator('name')}</th>
                          <th className="px-4 py-3 font-semibold text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('modifiedTime')}>Date modified {renderSortIndicator('modifiedTime')}</th>
                          <th className="px-4 py-3 font-semibold text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('type')}>Type {renderSortIndicator('type')}</th>
                          <th className="px-4 py-3 font-semibold text-gray-500 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {searchedFiles.map((file, idx) => (
                          <tr key={`${file.id}-${idx}`} className="hover:bg-blue-50/50 transition-colors group cursor-pointer relative" onClick={() => handleFileClick(file)}>
                            <td className="px-4 py-3 flex items-center space-x-3">
                              {file.iconLink ? <img src={file.iconLink} alt="icon" className="w-5 h-5 shrink-0" /> : <span className="w-5 h-5 shrink-0 flex justify-center text-gray-400">📄</span>}
                              <span className="truncate max-w-md font-medium group-hover:text-[#2A0510]">{file.name}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">{new Date(file.modifiedTime).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-500">{formatType(file.mimeType)}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-right">
                              
                              {/* TOMBOL TITIK TIGA (LIST) */}
                              <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(file.id); }} className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 inline-block relative">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                                
                                {/* POPUP MENU (LIST) */}
                                {activeMenuId === file.id && (
                                  <div ref={menuRef} className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1 text-sm font-medium text-left">
                                    <div onClick={(e) => handleMenuAction(e, 'Download', file)} className="px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"><span className="text-lg">⬇️</span> Download</div>
                                    <div onClick={(e) => handleMenuAction(e, 'Rename', file)} className="px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"><span className="text-lg">✏️</span> Ganti Nama</div>
                                    <div onClick={(e) => handleMenuAction(e, 'Move', file)} className="px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2"><span className="text-lg">📂</span> Pindahkan</div>
                                    <div className="h-px bg-gray-100 my-1"></div>
                                    <div onClick={(e) => handleMenuAction(e, 'Delete', file)} className="px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"><span className="text-lg">🗑️</span> Hapus</div>
                                  </div>
                                )}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {isFetchingMore && (
                  <div className="p-4 text-center text-gray-400 bg-transparent w-full">
                    <span className="animate-pulse">Menarik data dari server...</span>
                  </div>
                )}
                {!isFetchingMore && !hasMore && activeDrive !== 'Semua Drive' && searchedFiles.length > 0 && (
                  <div className="p-4 text-center text-gray-300 text-xs uppercase tracking-widest w-full">-- Akhir dari direktori --</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* === MODAL PREVIEW IN-APP === */}
      {previewFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setPreviewFile(null)}>
          <div className="relative max-w-4xl w-full bg-transparent flex flex-col items-center" onClick={e => e.stopPropagation()}>
            {/* Tombol Tutup */}
            <button onClick={() => setPreviewFile(null)} className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            {/* Konten Preview */}
            {previewFile.mimeType.startsWith('image/') ? (
              <img src={previewFile.iconLink?.replace('=s16', '=s1000') || previewFile.webViewLink} alt={previewFile.name} className="max-h-[80vh] object-contain rounded-lg shadow-2xl" />
            ) : previewFile.mimeType.startsWith('audio/') ? (
              <div className="bg-white p-8 rounded-2xl w-full max-w-md text-center shadow-2xl">
                <div className="text-6xl mb-4">🎵</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 truncate">{previewFile.name}</h3>
                <p className="text-sm text-gray-500 mb-6">{formatBytes(previewFile.size)}</p>
                <audio controls className="w-full outline-none" src={previewFile.webViewLink}>
                  Browser Anda tidak mendukung elemen audio.
                </audio>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}