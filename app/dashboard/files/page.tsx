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

// STRUKTUR DATA UNTUK HISTORI FOLDER
interface FolderNav {
  id: string;
  name: string;
  ownerEmail: string;
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  
  // STATE BARU: JEJAK NAVIGASI FOLDER
  const [folderHistory, setFolderHistory] = useState<FolderNav[]>([]);
  
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<any | null>(null);
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

  // FUNGSI FETCH UTAMA (Dimodifikasi nerima folder aktif)
  const fetchFiles = async (historyState: FolderNav[], isLoadMore = false) => {
    if (!isLoadMore) {
      setIsLoading(true);
      setError(false);
      setFiles([]);
    } else {
      setIsFetchingMore(true);
    }
    
    try {
      const driveParam = activeDrive === 'Semua Drive' ? 'all' : activeDrive;
      
      // BANGUN QUERY STRING
      const queryParams = new URLSearchParams({
        drive: driveParam,
        sortKey: sortConfig.key,
        sortDir: sortConfig.direction,
        category: activeCategory
      });

      // Kalau lagi di dalam folder, masukin parameter khususnya
      const currentFolder = historyState.length > 0 ? historyState[historyState.length - 1] : null;
      if (currentFolder) {
        queryParams.append('folderId', currentFolder.id);
        queryParams.append('ownerEmail', currentFolder.ownerEmail);
        
        if (isLoadMore) {
           const token = nextTokens[currentFolder.ownerEmail];
           if (token) queryParams.append('pageToken', token);
        }
      } else if (isLoadMore) {
         // Load more di Root (Bisa lebih dari 1 akun)
         const token = activeDrive === 'Semua Drive' ? null : nextTokens[activeDrive];
         // Catatan: Jika 'Semua Drive', handle paging-nya kompleks (butuh state per akun). 
         // Di sini disederhanakan: kalau milih 1 drive spesifik, baru jalan.
         if (token && activeDrive !== 'Semua Drive') queryParams.append('pageToken', token);
      }

      const res = await fetch(`/api/drive/files?${queryParams.toString()}`);
      
      if (res.ok) {
        const data = await res.json();
        if (isLoadMore) {
          setFiles(prev => [...prev, ...(data.files || [])]);
        } else {
          setFiles(data.files || []);
        }
        setNextTokens(data.tokens || {});
      } else {
        if (!isLoadMore) setError(true);
      }
    } catch (err) {
      if (!isLoadMore) setError(true);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
    }
  };

  // TRIGGER: Setiap kali Drive/Sort/Kategori atau Histori berubah, tarik data baru
  useEffect(() => {
    fetchFiles(folderHistory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDrive, sortConfig, activeCategory, folderHistory]);

  // RESET HISTORI: Kalau pindah kategori/drive, pentalin balik ke Root (Beranda)
  useEffect(() => {
    if (folderHistory.length > 0) {
      setFolderHistory([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, activeDrive]);


  const loadMoreFiles = () => {
    const currentFolder = folderHistory.length > 0 ? folderHistory[folderHistory.length - 1] : null;
    
    // Kalau lagi di root dan milih 'Semua Drive', matikan infinite scroll karena pusing nyari token mana yg mau dipake
    if (!currentFolder && activeDrive === 'Semua Drive') return;
    
    // Cek ada token lanjutannya gak
    const hasToken = currentFolder 
        ? !!nextTokens[currentFolder.ownerEmail] 
        : !!nextTokens[activeDrive];
        
    if (!isFetchingMore && hasToken) {
       fetchFiles(folderHistory, true);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) loadMoreFiles();
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
  };

  const renderSortIndicator = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑ ' : ' ↓ ';
  };

  // AKSI KLIK FILE/FOLDER UTAMA
  const handleItemClick = (file: any) => {
    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
    const isImage = file.mimeType.startsWith('image/');
    const isAudio = file.mimeType.startsWith('audio/');
    
    if (isFolder) {
      // NAVIGASI MASUK FOLDER
      setFolderHistory(prev => [
        ...prev, 
        { id: file.id, name: file.name, ownerEmail: file.ownerEmail }
      ]);
      return;
    }

    if (isImage || isAudio) {
      setPreviewFile(file);
    } else {
      window.open(file.webViewLink, '_blank');
    }
  };

  // NAVIGASI MUNDUR BREADCRUMB
  const navigateToBreadcrumb = (index: number) => {
    if (index === -1) {
      // Balik ke Root (BY Drive)
      setFolderHistory([]);
    } else {
      // Balik ke subfolder tertentu
      setFolderHistory(prev => prev.slice(0, index + 1));
    }
  };

  const handleMenuAction = (e: React.MouseEvent, action: string, file: any) => {
    e.stopPropagation();
    setActiveMenuId(null);
    alert(`Fitur ${action} untuk ${file.name} belum aktif. Tunggu API-nya dibangun.`);
  };

  const searchedFiles = useMemo(() => {
    return files.filter(file => file.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [files, searchQuery]);

  // Kalkulasi HasMore buat tulisan footer
  const currentFolder = folderHistory.length > 0 ? folderHistory[folderHistory.length - 1] : null;
  const hasMore = currentFolder 
    ? !!nextTokens[currentFolder.ownerEmail] 
    : (activeDrive !== 'Semua Drive' && !!nextTokens[activeDrive]);

  return (
    <div className="flex-1 flex flex-col space-y-4 animate-fade-in relative min-h-0 h-full">
      <header className="flex justify-between items-end flex-wrap gap-4 shrink-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#2A0510]">File Explorer</h2>
          <p className="text-gray-500 text-xs md:text-sm tracking-wide">Aggregated Unified File System</p>
        </div>
        <button onClick={() => alert('Mesin Upload belum dipasang!')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold shadow-md flex items-center gap-2 transition-colors">
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          Upload Baru
        </button>
      </header>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg border border-red-200 text-sm shrink-0">
          Gagal menarik data agregator.
        </div>
      )}

      {/* File Explorer Layout - Responsive Flex */}
      <div className="flex-1 flex flex-col md:flex-row bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-0">
        
        {/* SIDEBAR / TOPBAR FILTER */}
        <div className="w-full md:w-64 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col shrink-0">
          {/* MOBILE FILTER */}
          <div className="md:hidden flex p-3 gap-3 border-b border-gray-200 bg-white">
            <select 
              className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-xs font-bold text-gray-700 outline-none focus:border-[#2A0510] focus:ring-1 focus:ring-[#2A0510] transition-all"
              value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)}
            >
              {['Semua', 'Video', 'Music', 'Picture', 'Document'].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <select 
              className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-xs font-bold text-gray-700 outline-none focus:border-[#2A0510] focus:ring-1 focus:ring-[#2A0510] transition-all"
              value={activeDrive} onChange={(e) => setActiveDrive(e.target.value)}
            >
              <option value="Semua Drive">Semua Drive</option>
              {accounts.map(drive => (
                <option key={drive} value={drive}>{drive.split('@')[0]}</option>
              ))}
            </select>
          </div>

          {/* DESKTOP FILTER */}
          <div className="hidden md:flex p-4 flex-col space-y-6 overflow-y-auto">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">Quick Access</p>
              <nav className="flex flex-col space-y-1 text-sm font-medium text-gray-700">
                {['Semua', 'Video', 'Music', 'Picture', 'Document'].map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex items-center px-3 py-2 rounded-lg transition-colors ${activeCategory === cat ? 'bg-[#2A0510]/10 text-[#2A0510] font-bold' : 'hover:bg-gray-200'}`}>
                    {cat}
                  </button>
                ))}
              </nav>
            </div>
            <div className="w-full h-px bg-gray-300 my-4"></div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">Drives</p>
              <nav className="flex flex-col space-y-1 text-sm font-medium text-gray-700">
                <button onClick={() => setActiveDrive('Semua Drive')} className={`flex items-center px-3 py-2 rounded-lg transition-colors ${activeDrive === 'Semua Drive' ? 'bg-[#2A0510]/10 text-[#2A0510] font-bold' : 'hover:bg-gray-200'}`}>
                  Semua Drive
                </button>
                {accounts.map(drive => (
                  <button key={drive} onClick={() => setActiveDrive(drive)} className={`flex items-center px-3 py-2 rounded-lg transition-colors truncate max-w-none ${activeDrive === drive ? 'bg-[#2A0510]/10 text-[#2A0510] font-bold' : 'hover:bg-gray-200'}`} title={drive}>
                    <span className="truncate">{drive.split('@')[0]}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* KONTEN KANAN */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          
          {/* HEADER KONTROL */}
          <div className="bg-white border-b border-gray-200 p-2 md:p-4 shrink-0 z-10 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 h-auto md:h-14">
            
            {/* MOBILE VIEW */}
            <div className="flex items-center gap-2 md:hidden w-full">
              <div className="flex-1 relative">
                <input type="text" placeholder="Cari file..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-md pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:border-[#2A0510] transition-colors" />
                <svg className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200 shrink-0">
                <button onClick={() => setViewMode('list')} className={`p-1 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                </button>
                <button onClick={() => setViewMode('grid')} className={`p-1 rounded transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                </button>
              </div>
            </div>

            {/* PATH BREADCRUMB DINAMIS BERDASARKAN HISTORY */}
            <div className="flex-1 flex items-center bg-gray-50 border border-gray-300 rounded-md px-2 md:px-3 py-1.5 text-xs md:text-sm text-gray-600 w-full md:w-auto overflow-x-auto whitespace-nowrap scrollbar-hide">
              <button 
                onClick={() => navigateToBreadcrumb(-1)} 
                className={`font-bold shrink-0 hover:underline ${folderHistory.length === 0 ? 'text-[#2A0510]' : 'text-gray-500'}`}
              >
                BY Drive
              </button>
              
              {folderHistory.length === 0 ? (
                 <>
                   <span className="mx-1 md:mx-2 text-gray-400 shrink-0">/</span>
                   <span className="truncate shrink-0">{activeDrive}</span>
                   <span className="mx-1 md:mx-2 text-gray-400 shrink-0">/</span>
                   <span className="truncate shrink-0">{activeCategory}</span>
                 </>
              ) : (
                folderHistory.map((folder, idx) => (
                  <span key={folder.id} className="flex items-center shrink-0">
                    <span className="mx-1 md:mx-2 text-gray-400">/</span>
                    <button 
                      onClick={() => navigateToBreadcrumb(idx)}
                      className={`truncate max-w-[100px] md:max-w-[150px] hover:underline ${idx === folderHistory.length - 1 ? 'font-bold text-[#2A0510]' : 'text-gray-500'}`}
                      title={folder.name}
                    >
                      {folder.name}
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* DESKTOP VIEW */}
            <div className="hidden md:flex items-center gap-4 shrink-0">
              <div className="w-64 relative">
                <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-50 border border-gray-300 rounded-md pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-[#2A0510] transition-colors" />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                </button>
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                </button>
              </div>
            </div>
          </div>

          {/* AREA KONTEN (Ganti handleFileClick dengan handleItemClick) */}
          <div className="absolute top-[88px] md:top-14 bottom-0 left-0 right-0 overflow-y-auto bg-gray-50/50 p-2 md:p-4 pb-32 md:pb-4" onScroll={handleScroll}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-40 md:h-full text-gray-400">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-gray-300 border-t-[#2A0510] rounded-full mb-4"></div>
                <p className="text-sm">Membongkar brankas...</p>
              </div>
            ) : searchedFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 md:h-full text-gray-400">
                <p className="text-sm">Direktori ini kosong atau file tidak ditemukan.</p>
              </div>
            ) : (
              <>
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
                    {searchedFiles.map((file, idx) => (
                      <div key={`${file.id}-${idx}`} className="bg-white rounded-xl border border-gray-200 p-2 md:p-3 hover:shadow-md hover:border-[#2A0510]/30 transition-all group relative cursor-pointer" onClick={() => handleItemClick(file)}>
                        
                        <div className="h-20 md:h-24 bg-gray-50 rounded-lg flex items-center justify-center mb-2 md:mb-3 overflow-hidden">
                          {file.mimeType === 'application/vnd.google-apps.folder' ? (
                             <svg className="w-12 h-12 text-yellow-400" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path></svg>
                          ) : file.mimeType.startsWith('image/') && file.iconLink ? (
                             <img src={file.iconLink.replace('=s16', '=s200')} alt={file.name} className="w-full h-full object-cover" />
                          ) : (
                             <span className="text-3xl md:text-4xl text-gray-300">{file.mimeType.includes('video/') ? '▶️' : '📄'}</span>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-start gap-1 md:gap-2">
                          <p className="text-[10px] md:text-xs font-semibold text-gray-700 truncate flex-1" title={file.name}>{file.name}</p>
                          <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(file.id); }} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 shrink-0">
                             <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                          </button>
                        </div>
                        <p className="text-[9px] md:text-[10px] text-gray-400 mt-1">{formatType(file.mimeType)}</p>
                        
                        {activeMenuId === file.id && (
                          <div ref={menuRef} className="absolute right-2 top-full mt-1 w-40 md:w-48 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-1 text-xs md:text-sm font-medium">
                             <button onClick={(e) => handleMenuAction(e, 'Download', file)} className="w-full text-left px-3 md:px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2">Download</button>
                             <button onClick={(e) => handleMenuAction(e, 'Rename', file)} className="w-full text-left px-3 md:px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2">Ganti Nama</button>
                             <button onClick={(e) => handleMenuAction(e, 'Move', file)} className="w-full text-left px-3 md:px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2">Pindahkan</button>
                             <div className="h-px bg-gray-100 my-1"></div>
                             <button onClick={(e) => handleMenuAction(e, 'Delete', file)} className="w-full text-left px-3 md:px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2">Hapus</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {viewMode === 'list' && (
                  <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
                    <table className="w-full text-left text-xs md:text-sm text-gray-700 min-w-[500px]">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-3 md:px-4 py-2 md:py-3 font-semibold text-gray-500 w-1/2 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>Name {renderSortIndicator('name')}</th>
                          <th className="px-3 md:px-4 py-2 md:py-3 font-semibold text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('modifiedTime')}>Date modified {renderSortIndicator('modifiedTime')}</th>
                          <th className="px-3 md:px-4 py-2 md:py-3 font-semibold text-gray-500 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('type')}>Type {renderSortIndicator('type')}</th>
                          <th className="px-3 md:px-4 py-2 md:py-3 font-semibold text-gray-500 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {searchedFiles.map((file, idx) => (
                          <tr key={`${file.id}-${idx}`} className="hover:bg-blue-50/50 transition-colors group cursor-pointer relative" onClick={() => handleItemClick(file)}>
                            <td className="px-3 md:px-4 py-2 md:py-3 flex items-center space-x-2 md:space-x-3">
                              {file.mimeType === 'application/vnd.google-apps.folder' ? (
                                <svg className="w-4 h-4 md:w-5 md:h-5 text-yellow-400 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path></svg>
                              ) : file.iconLink ? (
                                <img src={file.iconLink} alt="icon" className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                              ) : (
                                <span className="w-4 h-4 md:w-5 md:h-5 shrink-0 flex justify-center text-gray-400">📄</span>
                              )}
                              <span className="truncate max-w-[150px] md:max-w-md font-medium group-hover:text-[#2A0510]">{file.name}</span>
                            </td>
                            <td className="px-3 md:px-4 py-2 md:py-3 whitespace-nowrap text-gray-500">{new Date(file.modifiedTime).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                            <td className="px-3 md:px-4 py-2 md:py-3 whitespace-nowrap text-gray-500">{formatType(file.mimeType)}</td>
                            <td className="px-3 md:px-4 py-2 whitespace-nowrap text-right">
                              <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(file.id); }} className="p-1 md:p-1.5 rounded-full hover:bg-gray-200 text-gray-400 inline-block relative">
                                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                                {activeMenuId === file.id && (
                                  <div ref={menuRef} className="absolute right-0 top-full mt-1 w-32 md:w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1 text-xs md:text-sm font-medium text-left">
                                    <div onClick={(e) => handleMenuAction(e, 'Download', file)} className="px-3 md:px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2">Download</div>
                                    <div onClick={(e) => handleMenuAction(e, 'Rename', file)} className="px-3 md:px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2">Ganti Nama</div>
                                    <div onClick={(e) => handleMenuAction(e, 'Move', file)} className="px-3 md:px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-2">Pindahkan</div>
                                    <div className="h-px bg-gray-100 my-1"></div>
                                    <div onClick={(e) => handleMenuAction(e, 'Delete', file)} className="px-3 md:px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2">Hapus</div>
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
                    <span className="animate-pulse text-sm">Menarik data dari server...</span>
                  </div>
                )}
                
                {!isFetchingMore && !hasMore && searchedFiles.length > 0 && (
                  <div className="p-4 text-center text-gray-300 text-[10px] uppercase tracking-widest w-full">-- Akhir dari direktori --</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {previewFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setPreviewFile(null)}>
          <div className="relative max-w-4xl w-full bg-transparent flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPreviewFile(null)} className="absolute -top-10 md:-top-12 right-0 text-white hover:text-gray-300 p-2">
              <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            
            {previewFile.mimeType.startsWith('image/') ? (
              <img src={previewFile.iconLink?.replace('=s16', '=s1000') || previewFile.webViewLink} alt={previewFile.name} className="max-h-[70vh] md:max-h-[80vh] object-contain rounded-lg shadow-2xl" />
            ) : previewFile.mimeType.startsWith('audio/') ? (
              <div className="bg-white p-6 md:p-8 rounded-2xl w-full max-w-md text-center shadow-2xl">
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2 truncate">{previewFile.name}</h3>
                <p className="text-xs md:text-sm text-gray-500 mb-4 md:mb-6">{formatBytes(previewFile.size)}</p>
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