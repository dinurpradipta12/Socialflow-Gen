
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Calendar, Megaphone, BarChart3, Link2, Users, Settings, LogOut, FileSpreadsheet, Database
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  primaryColorHex: string;
  onLogout: () => void;
  user: User;
  appLogo?: string | null;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'contentPlan', label: 'Konten Plan', icon: FileSpreadsheet },
  { id: 'calendar', label: 'Kalender Konten', icon: Calendar },
  { id: 'ads', label: 'Ads Workspace', icon: Megaphone },
  { id: 'analytics', label: 'Analitik Konten', icon: BarChart3 },
  { id: 'tracker', label: 'Link Tracker', icon: Link2 },
  { id: 'team', label: 'Tim Workspace', icon: Users },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, primaryColorHex, onLogout, user, appLogo }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 11) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 19) return 'Selamat sore';
    return 'Selamat malam';
  };

  if (!user) return null;
  const isDev = user.role === 'developer';

  return (
    <div className="w-72 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-50 overflow-hidden shadow-2xl transition-all duration-300">
      <div className="p-6 flex flex-col h-full">
        {/* Logo Section */}
        <div className="flex items-center gap-3 mb-6 min-h-[48px]">
          {appLogo ? (
            <img src={appLogo} alt="Workspace Logo" className="w-full h-12 object-contain" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-[var(--primary-color)] flex items-center justify-center text-white font-bold text-xl shadow-lg">
                SF
              </div>
              <div className="animate-slide">
                <h1 className="font-black text-gray-900 text-sm leading-tight tracking-tight">Socialflow</h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-0.5">by Snaillabs.id</p>
              </div>
            </>
          )}
        </div>

        {/* Greeting Widget */}
        <div className="mb-6 p-5 bg-gray-50/80 rounded-3xl border border-gray-100 shadow-sm space-y-1">
           <p className="text-xs font-black text-gray-900">Hey {user.name ? user.name.split(' ')[0] : 'User'},</p>
           <p className="text-[11px] font-bold text-gray-500 leading-tight">{getGreeting()}!</p>
           <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-100">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary-color)] animate-pulse"></div>
              <span className="text-[10px] font-black text-gray-900 uppercase tracking-tighter">
                {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </span>
           </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const hasPermission = user.permissions[item.id as keyof typeof user.permissions] || isDev;
            
            return (
              <button
                key={item.id}
                onClick={() => hasPermission && setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${
                  isActive 
                    ? `bg-blue-50 text-[var(--primary-color)] font-bold shadow-sm` 
                    : hasPermission 
                      ? 'text-gray-400 hover:bg-gray-50 hover:text-gray-900' 
                      : 'text-gray-200 cursor-not-allowed opacity-50'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-[var(--primary-color)]' : 'group-hover:text-gray-900 transition-colors'} />
                <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary-color)] ml-auto" />}
              </button>
            );
          })}

          {isDev && (
            <button
              onClick={() => setActiveTab('devPortal')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all mt-4 border border-blue-100 ${
                activeTab === 'devPortal' ? 'bg-gray-900 text-white shadow-xl' : 'text-blue-600 bg-blue-50/30 hover:bg-blue-50'
              }`}
            >
              <Database size={18} />
              <span className="text-[11px] font-black uppercase tracking-widest">Dev Portal</span>
            </button>
          )}
        </nav>

        {/* Footer Profile */}
        <div className="mt-auto pt-6 space-y-3">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-white border border-transparent rounded-2xl text-left transition-all ${activeTab === 'profile' ? 'shadow-lg border-gray-100' : ''}`}
          >
            <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-gray-900 truncate">{user.name}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black truncate">{user.role}</p>
            </div>
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3.5 text-gray-400 hover:text-rose-600 transition-all rounded-2xl hover:bg-rose-50 group">
            <LogOut size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Keluar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
