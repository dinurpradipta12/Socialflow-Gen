
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Calendar, Megaphone, BarChart3, Link2, Users, Settings, LogOut, FileSpreadsheet, Database, Clock as ClockIcon
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  primaryColorHex: string;
  onLogout: () => void;
  user: User;
  appLogo?: string | null;
  isOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, user, appLogo, isOpen = false }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!user) return null;
  
  const isDev = user.role === 'developer';

  // Daftar navigasi standar
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

  return (
    <div className={`fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-100 flex flex-col z-[100] transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shadow-2xl md:shadow-none`}>
      <div className="p-6 flex flex-col h-full">
        {/* Logo Section */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white font-black text-xl shadow-lg">SF</div>
            <div>
              <h1 className="font-black text-gray-900 text-sm leading-tight tracking-tight">Socialflow</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-0.5">Control Center</p>
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="mb-6 p-5 bg-gray-50/80 rounded-3xl border border-gray-100 shadow-sm">
           <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">{user.role} Access</p>
           <p className="text-sm font-black text-gray-900 truncate">{user.name}</p>
           <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              <ClockIcon size={12} className="text-gray-400" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </span>
           </div>
        </div>

        {/* Navigation - Logic Hidden for Dev */}
        <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-1">
          {!isDev ? (
            navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                    isActive 
                      ? `bg-blue-50 text-blue-600 font-bold shadow-sm` 
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-blue-600' : 'group-hover:text-gray-900 transition-colors'} />
                  <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-auto" />}
                </button>
              );
            })
          ) : (
            <div className="py-4 px-4 bg-blue-50/50 rounded-2xl border border-blue-100 mb-4">
               <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-relaxed">System Restricted: Developer Mode Active</p>
            </div>
          )}

          {isDev && (
            <button
              onClick={() => setActiveTab('devPortal')}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all border ${
                activeTab === 'devPortal' ? 'bg-gray-900 text-white shadow-xl border-gray-900' : 'text-blue-600 bg-white border-blue-100 hover:bg-blue-50'
              }`}
            >
              <Database size={18} />
              <span className="text-[11px] font-black uppercase tracking-widest">Dev Portal Hub</span>
              {activeTab === 'devPortal' && <div className="w-2 h-2 rounded-full bg-emerald-500 ml-auto animate-pulse" />}
            </button>
          )}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-6">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-rose-600 transition-all rounded-2xl hover:bg-rose-50">
            <LogOut size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest">Sign Out System</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
