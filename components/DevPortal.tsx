import React, { useState } from 'react';
import { User } from '../types';
import { MOCK_USERS } from '../constants';
import { Database, CalendarDays, RefreshCw, Power, ShieldCheck, Search } from 'lucide-react';

const DevPortal: React.FC<{ primaryColorHex: string }> = ({ primaryColorHex }) => {
  const [appUsers, setAppUsers] = useState<User[]>(MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDateChange = (userId: string, newDate: string) => {
    setAppUsers(prev => prev.map(u => u.id === userId ? { ...u, subscriptionExpiry: newDate } : u));
  };

  const renewLicense = (userId: string, duration: '1m' | '3m' | '1y') => {
    const user = appUsers.find(u => u.id === userId);
    if (!user) return;
    const currentExpiry = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) : new Date();
    
    if (duration === '1m') currentExpiry.setMonth(currentExpiry.getMonth() + 1);
    else if (duration === '3m') currentExpiry.setMonth(currentExpiry.getMonth() + 3);
    else if (duration === '1y') currentExpiry.setFullYear(currentExpiry.getFullYear() + 1);
    
    handleDateChange(userId, currentExpiry.toISOString().split('T')[0]);
    alert(`Lisensi ${user.name} diperpanjang sukses.`);
  };

  const toggleUserActive = (userId: string) => {
    setAppUsers(prev => prev.map(u => u.id === userId ? { ...u, isSubscribed: !u.isSubscribed } : u));
  };

  return (
    <div className="space-y-12 animate-slide pb-20">
      <div className="bg-gray-900 p-12 rounded-[4rem] border border-gray-800 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="space-y-2">
              <h1 className="text-4xl font-black text-white flex items-center gap-4"><Database className="text-blue-500" /> Database Otoritas</h1>
              <p className="text-gray-400 font-medium">Panel kontrol pusat lisensi Snaillabs Socialflow Engine.</p>
           </div>
           <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md text-center">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Verified Users</p>
              <p className="text-3xl font-black text-white">{appUsers.length}</p>
           </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]"></div>
      </div>

      <section className="space-y-6">
        <div className="flex justify-between items-center px-4">
           <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
             <ShieldCheck size={16} className="text-blue-500"/> Manajemen Lisensi Global
           </h3>
           <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-[var(--primary-color)] transition-all">
             <Search size={16} className="text-gray-400" />
             <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Cari user..." className="bg-transparent outline-none text-xs font-bold text-gray-900 w-48" />
           </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identitas Member</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Masa Aktif</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Perpanjang</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Kontrol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {appUsers.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                 <tr key={u.id} className="hover:bg-gray-50/50 transition-all">
                    <td className="px-10 py-8">
                       <div className="flex items-center gap-5">
                          <img src={u.avatar} className="w-14 h-14 rounded-2xl border-4 border-white shadow-lg" alt="" />
                          <div>
                             <p className="text-sm font-black text-gray-900">{u.name}</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{u.role}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-10 py-8">
                       <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                          <CalendarDays size={16} className="text-blue-500" />
                          <input type="date" value={u.subscriptionExpiry} onChange={e => handleDateChange(u.id, e.target.value)} className="bg-transparent outline-none cursor-pointer text-xs font-black text-gray-900" />
                       </div>
                    </td>
                    <td className="px-10 py-8">
                       <div className="flex justify-center gap-2">
                          <button onClick={() => renewLicense(u.id, '1m')} className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">+1 Bln</button>
                          <button onClick={() => renewLicense(u.id, '3m')} className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all">+3 Bln</button>
                          <button onClick={() => renewLicense(u.id, '1y')} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">+1 Thn</button>
                       </div>
                    </td>
                    <td className="px-10 py-8">
                       <button 
                         onClick={() => toggleUserActive(u.id)}
                         className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest mx-auto flex items-center gap-2 shadow-sm transition-all ${
                           u.isSubscribed ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-500 text-white shadow-rose-100'
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