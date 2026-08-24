'use client'; 
import { useSession, signOut } from 'next-auth/react'; 
import Link from 'next/link'; 
import { usePathname } from 'next/navigation'; 
import { useState } from 'react'; 

export default function DashboardLayout({ children }: { children: React.ReactNode }) {   
  const { data: session } = useSession();   
  const pathname = usePathname();   
  const [isCollapsed, setIsCollapsed] = useState(false);   
  
  const handleHardReset = async () => {     
    const confirmNuke = confirm("PERINGATAN: Ini akan menghapus SEMUA token Google Drive yang tersambung dari server dan mengeluarkan Anda dari sistem. Lanjutkan?");          
    if (confirmNuke) {       
      try {         
        await fetch('/api/auth/nuke', { method: 'POST' });         
        signOut({ callbackUrl: '/' });        
      } catch (error) {         
        console.error("Gagal melakukan reset:", error);         
        alert("Gagal melakukan reset sistem.");       
      }     
    }   
  };   
  
  const menuItems = [     
    { name: 'Dashboard', path: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },     
    { name: 'File Manager', path: '/dashboard/files', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },     
    { name: 'Settings', path: '/dashboard/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },   
  ];   
  
  return (     
    <div className="h-screen bg-gray-50 flex flex-col md:flex-row overflow-hidden">       
      
      {/* HEADER MOBILE */}       
      <header className="md:hidden flex items-center justify-between bg-[#2A0510] text-white p-4 shadow-md z-20 shrink-0">         
        <div className="flex items-center gap-3">           
          <h1 className="text-lg font-bold tracking-widest">BY DRIVE</h1>         
        </div>         
        <button            
          onClick={handleHardReset}            
          className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center text-sm font-bold shadow-sm"           
          title="Reset & Logout"         
        >           
          {session?.user?.name?.charAt(0) || 'B'}         
        </button>       
      </header>       
      
      {/* SIDEBAR DESKTOP */}       
      <aside className={`hidden md:flex ${isCollapsed ? 'w-20' : 'w-72'} bg-[#2A0510] text-white flex-col shadow-xl z-10 transition-all duration-300 ease-in-out shrink-0`}>         
        <div className="p-6 border-b border-white/10 flex items-center justify-between">           
          <div className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>             
            <h1 className="text-xl font-bold tracking-widest">BY DRIVE</h1>             
            <p className="text-[10px] text-white/50 mt-1 uppercase tracking-widest">Aggregator System</p>           
          </div>           
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 hover:bg-white/10 rounded-lg transition-colors shrink-0">             
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">               
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />             
            </svg>           
          </button>         
        </div>         
        <nav className="flex-1 px-4 py-8 space-y-3 overflow-x-hidden">           
          {menuItems.map((item) => {             
            const isActive = pathname === item.path;             
            return (               
              <Link                  
                key={item.name}                  
                href={item.path}                  
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-white/10 text-white font-semibold shadow-inner' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}               
              >                 
                <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">                   
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />                 
                </svg>                 
                <span className={`ml-4 overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-40 opacity-100'}`}>                   
                  {item.name}                 
                </span>               
              </Link>             
            );           
          })}         
        </nav>         
        <div className="p-4 border-t border-white/10">           
          <div              
            className="flex items-center cursor-pointer p-2 rounded-xl hover:bg-red-900/40 transition-colors group"              
            onClick={handleHardReset}              
            title="Hard Reset & Sign Out"           
          >             
            <div className="w-10 h-10 shrink-0 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold group-hover:bg-red-500/80 transition-colors">               
              {session?.user?.name?.charAt(0) || 'B'}             
            </div>             
            <div className={`ml-3 overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-32 opacity-100'}`}>               
              <p className="text-sm font-medium truncate group-hover:text-red-400 transition-colors">{session?.user?.name || 'Administrator'}</p>               
              <p className="text-xs text-white/50 truncate group-hover:text-red-300 transition-colors">Reset & Logout</p>             
            </div>           
          </div>         
        </div>       
      </aside>       
      
      {/* MAIN CONTENT AREA */}       
      <main className="flex-1 p-4 md:p-10 pb-20 md:pb-10 overflow-y-auto w-full min-w-0 flex flex-col">         
        {children}       
      </main>       
      
      {/* BOTTOM NAV MOBILE */}       
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] flex justify-around items-center z-50 px-2 py-2 pb-safe">         
        {menuItems.map((item) => {           
          const isActive = pathname === item.path;           
          return (             
            <Link                
              key={item.name}                
              href={item.path}                
              className={`flex flex-col items-center p-2 min-w-[72px] transition-colors ${isActive ? 'text-[#2A0510]' : 'text-gray-400'}`}             
            >               
              <div className={`p-1.5 rounded-full mb-1 ${isActive ? 'bg-[#2A0510]/10' : ''}`}>                 
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">                   
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? "2.5" : "2"} d={item.icon} />                 
                </svg>               
              </div>               
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>             
            </Link>           
          );         
        })}       
      </nav>     
    </div>   
  ); 
}