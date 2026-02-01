
import React, { useState } from 'react';
import { User, RegistrationRequest } from '../types';
import { Database, CalendarDays, RefreshCw, Power, ShieldCheck, Search, CheckCircle, XCircle, FileSpreadsheet, Trash2, Download, Loader2, Link2, Globe, Server } from 'lucide-react';

interface DevPortalProps {
  primaryColorHex: string;
  registrations: RegistrationRequest[];
  onRegistrationAction: (regId: string, status: 'approved' | 'rejected') => void;
  users: User[];
  setUsers: (users: User[]) => void;
  setRegistrations: (regs: RegistrationRequest[]) => void;
  dbSourceUrl: string;
  setDbSourceUrl: (url: string) => void;
}

const DevPortal: React.FC<DevPortalProps> = ({ 
  primaryColorHex, 
  registrations, 
  onRegistrationAction,
  users,
  setUsers,
  setRegistrations,
  dbSourceUrl,
  setDbSourceUrl
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDbSettings, setShowDbSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(dbSourceUrl);

  const handleRefreshDatabase = () => {
    setIsRefreshing(true);
    // Mensimulasikan fetch ulang data dari storage yang mungkin telah diupdate oleh user lain via Cloud
    setTimeout(() => {
      const savedRegs = localStorage.getItem('sf_registrations_db');
      if (savedRegs) setRegistrations(JSON.parse(savedRegs));
      const savedUsers = localStorage.getItem('sf_users_db');
      if (savedUsers) setUsers(JSON.parse(savedUsers));
      setIsRefreshing(false);
    }, 1500);
  };

  const saveDbConfig = () => {
    setDbSourceUrl(tempUrl);
    setShowDbSettings(false);
    alert("Database Source diperbarui. Sistem akan melakukan sinkronisasi otomatis.");
  };

  const handleDateChange = (userId: string, newDate: string) => {
    const updated = users.map(u => u.id === userId ? { ...u, subscriptionExpiry: newDate } : u);
    setUsers(updated);
    localStorage.setItem('sf_users_db', JSON.stringify(updated));
  };

  const toggleUserActive = (userId: string) => {
    const updated = users.map(u => u.id === userId ? { ...u, isSubscribed: !u.isSubscribed } : u);
    setUsers(updated);
    localStorage.setItem('sf_users_db', JSON.stringify(updated));
  };

  return (
    <div className="space-y-12 animate-slide pb-20">
      <div className="bg-gray-900 p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="space-y-2">
              <h1 className="text-4xl font-black flex items-center gap-4"><Database className="text-blue-400" /> Database Dev</h1>
              <div className="flex items-center gap-3">
                 <p className="text-gray-400 font-medium">Sistem Verifikasi Pusat Socialflow.</p>
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                    <div className={`w-1.5 h-1.5 rounded-full ${dbSourceUrl ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></div>
                    <span className="text-[8px] font-black uppercase tracking-widest">{dbSourceUrl ? 'Cloud Connected' : 'Local Only'}</span>
                 </div>
              </div>
           </div>
           <div className="flex gap-4">
             <button 
               onClick={() => setShowDbSettings(!showDbSettings)}
               className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
             >
                <Server size={20} className="text-gray-400 group-hover:text-white" />
             </button>
             <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-3xl text-center backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Pending</p>
                <p className="text-3xl font-black text-amber-400">{registrations.filter(r => r.status === 'pending').length}</p>
             </div>
           </div>
        </div>

        {showDbSettings && (
          <div className="mt-8 p-8 bg-white/5 rounded-[2.5rem] border border-white/10 animate-slide">
             <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2"><Globe size={14}/> External Database Source (Google Sheets Bridge)</h3>
             <div className="flex gap-3">
                <input 
                  value={tempUrl} 
                  onChange={e => setTempUrl(e.target.value)}
                  placeholder="Paste Google Apps Script URL here..." 
                  className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-blue-400 transition-all"
                />
                <button onClick={saveDbConfig} className="px-8 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Connect</button>
             </div>
             <p className="mt-3 text-[9px] text-gray-500 italic">Gunakan URL Web App dari Google Apps Script untuk menghubungkan data lintas user secara real-time.</p>
          </div>
        )}
      </div>

      {/* Registration Section */}
      <section className="space-y-6">
        <div className="flex flex-wrap justify-between items-center px-4 gap-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
             <RefreshCw size={16} className={`text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`}/> Antrian Verifikasi Masuk
          </h3>
          <button 
            onClick={handleRefreshDatabase}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm active:scale-95"
          >
            {isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            <span>Refresh Real-time</span>
          </button>
        </div>
        
        <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm ring-1 ring-gray-100">
           <table className="w-full text-left">
              <thead className="bg-gray-50/50">
                 <tr>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Username / Email</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Password</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Aksi</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {registrations.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-all">
                       <td className="px-10 py-6">
                          <div>
                             <p className="text-sm font-black text-gray-900">{r.name}</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase">{r.email}</p>
                          </div>
                       </td>
                       <td className="px-10 py-6 font-mono text-[10px] text-gray-300 tracking-widest uppercase">
                          {r.password ? 'HIDDEN' : '••••••••'}
                       </td>
                       <td className="px-10 py-6">
                          <div className="flex justify-center gap-3">
                            {r.status === 'pending' ? (
                               <>
                                  <button onClick={() => onRegistrationAction(r.id, 'approved')} className="px-4 py-2 bg-emerald-100 text-emerald-600 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-200 transition-all">Approve</button>
                                  <button onClick={() => onRegistrationAction(r.id, 'rejected')} className="px-4 py-2 bg-rose-100 text-rose-600 rounded-xl text-[9px] font-black uppercase hover:bg-rose-200 transition-all">Reject</button>
                               </>
                            ) : (
                              <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${r.status === 'approved' ? 'bg-emerald-50 text-emerald-400' : 'bg-rose-50 text-rose-400'}`}>
                                {r.status}
                              </span>
                            )}
                          </div>
                       </td>
                    </tr>
                 ))}
                 {registrations.length === 0 && (
                    <tr><td colSpan={3} className="py-20 text-center text-gray-300 font-bold uppercase text-[10px] tracking-widest italic">Belum ada pendaftaran baru.</td></tr>
                 )}
              </tbody>
           </table>
        </div>
      </section>

      {/* Active Users Section */}
      <section className="space-y-6">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3 px-4">
          <ShieldCheck size={16} className="text-emerald-500"/> Manajemen Lisensi Member
        </h3>

        <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lisensi Expired</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Power</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                 <tr key={u.id} className="hover:bg-gray-50/50 transition-all">
                    <td className="px-10 py-8">
                       <div className="flex items-center gap-5">
                          <img src={u.avatar} className="w-14 h-14 rounded-2xl border-4 border-white shadow-lg" alt="" />
                          <div>
                             <p className="text-sm font-black text-gray-900">{u.name}</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{u.email}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-10 py-8">
                       <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm w-fit">
                          <CalendarDays size={16} className="text-blue-400" />
                          <input type="date" value={u.subscriptionExpiry} onChange={e => handleDateChange(u.id, e.target.value)} className="bg-transparent outline-none cursor-pointer text-xs font-black text-gray-900" />
                       </div>
                    </td>
                    <td className="px-10 py-8 text-center">
                       <button 
                         onClick={() => toggleUserActive(u.id)}
                         className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest mx-auto flex items-center gap-2 shadow-sm transition-all ${
                           u.isSubscribed ? 'bg-emerald-50 text-emerald-400' : 'bg-rose-50 text-rose-400'
                         }`}
                       >
                         <Power size={14}/> {u.isSubscribed ? 'Active' : 'Blocked'}
                       </button>
                    </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default DevPortal;
