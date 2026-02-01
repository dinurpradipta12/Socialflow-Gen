
import React, { useState } from 'react';
import { User, RegistrationRequest } from '../types';
import { Database, CalendarDays, RefreshCw, Power, ShieldCheck, Search, CheckCircle, XCircle, FileSpreadsheet, Trash2, Download, Loader2 } from 'lucide-react';

interface DevPortalProps {
  primaryColorHex: string;
  registrations: RegistrationRequest[];
  onRegistrationAction: (regId: string, status: 'approved' | 'rejected') => void;
  users: User[];
  setUsers: (users: User[]) => void;
  setRegistrations: (regs: RegistrationRequest[]) => void;
}

const DevPortal: React.FC<DevPortalProps> = ({ 
  primaryColorHex, 
  registrations, 
  onRegistrationAction,
  users,
  setUsers,
  setRegistrations
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshDatabase = () => {
    setIsRefreshing(true);
    // Simulating real-time fetch from localStorage
    setTimeout(() => {
      const savedRegs = localStorage.getItem('sf_registrations_db');
      if (savedRegs) setRegistrations(JSON.parse(savedRegs));
      const savedUsers = localStorage.getItem('sf_users_db');
      if (savedUsers) setUsers(JSON.parse(savedUsers));
      setIsRefreshing(false);
    }, 1000);
  };

  const handleDateChange = (userId: string, newDate: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, subscriptionExpiry: newDate } : u));
  };

  const renewLicense = (userId: string, duration: '1m' | '3m' | '1y') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const currentExpiry = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) : new Date();
    
    if (duration === '1m') currentExpiry.setMonth(currentExpiry.getMonth() + 1);
    else if (duration === '3m') currentExpiry.setMonth(currentExpiry.getMonth() + 3);
    else if (duration === '1y') currentExpiry.setFullYear(currentExpiry.getFullYear() + 1);
    
    handleDateChange(userId, currentExpiry.toISOString().split('T')[0]);
    alert(`Lisensi ${user.name} diperpanjang sukses.`);
  };

  const toggleUserActive = (userId: string) => {
    setUsers(users.map(u => u.id === userId ? { ...u, isSubscribed: !u.isSubscribed } : u));
  };

  const exportToCSV = (data: any[], fileName: string) => {
    if (data.length === 0) {
      alert("Tidak ada data untuk di-export.");
      return;
    }
    const headers = ["ID", "Nama/Username", "Email", "Password", "Status", "Waktu Daftar"];
    const csvRows = [headers.join(',')];
    data.forEach(item => {
      const row = [item.id, item.name, item.email, item.password || 'HIDDEN', item.status || 'ACTIVE', item.timestamp || '-'].map(val => `"${val}"`).join(',');
      csvRows.push(row);
    });
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-12 animate-slide pb-20">
      <div className="bg-gray-900 p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="space-y-2">
              <h1 className="text-4xl font-black flex items-center gap-4"><Database className="text-blue-400" /> Database Developer</h1>
              <p className="text-gray-400 font-medium">Sistem Verifikasi & Lisensi Terpusat Socialflow.</p>
           </div>
           <div className="flex gap-4">
             <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-3xl text-center backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Pendaftar Pending</p>
                <p className="text-3xl font-black text-amber-400">{registrations.filter(r => r.status === 'pending').length}</p>
             </div>
             <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-3xl text-center backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Member Aktif</p>
                <p className="text-3xl font-black text-emerald-400">{users.length}</p>
             </div>
           </div>
        </div>
      </div>

      {/* Registration Section */}
      <section className="space-y-6">
        <div className="flex flex-wrap justify-between items-center px-4 gap-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
             <RefreshCw size={16} className={`text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`}/> Antrian Verifikasi Masuk
          </h3>
          <div className="flex gap-3">
            <button 
              onClick={handleRefreshDatabase}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm active:scale-95"
            >
              {isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              <span>Refresh Real-time</span>
            </button>
            <button 
              onClick={() => exportToCSV(registrations, `SF_Pendaftar_${new Date().toLocaleDateString()}`)}
              className="flex items-center gap-2 px-6 py-2 bg-blue-100 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-200 transition-all shadow-sm"
            >
              <FileSpreadsheet size={16} /> Export CSV
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm ring-1 ring-gray-100">
           <table className="w-full text-left">
              <thead className="bg-gray-50/50">
                 <tr>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Username / Email</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Password</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Waktu Daftar</th>
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
                       <td className="px-10 py-6 font-mono text-[10px] text-gray-300 tracking-widest">
                          {r.password || '••••••••'}
                       </td>
                       <td className="px-10 py-6 text-[10px] font-bold text-gray-400">{r.timestamp}</td>
                       <td className="px-10 py-6">
                          <div className="flex justify-center gap-3">
                            {r.status === 'pending' ? (
                               <>
                                  <button 
                                    onClick={() => onRegistrationAction(r.id, 'approved')} 
                                    className="px-4 py-2 bg-emerald-100 text-emerald-600 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-200 transition-all"
                                  >
                                    Approve
                                  </button>
                                  <button 
                                    onClick={() => onRegistrationAction(r.id, 'rejected')} 
                                    className="px-4 py-2 bg-rose-100 text-rose-600 rounded-xl text-[9px] font-black uppercase hover:bg-rose-200 transition-all"
                                  >
                                    Reject
                                  </button>
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
                    <tr><td colSpan={4} className="py-20 text-center text-gray-300 font-bold uppercase text-[10px] tracking-widest italic">Belum ada pendaftaran baru hari ini.</td></tr>
                 )}
              </tbody>
           </table>
        </div>
      </section>

      {/* Active Users Section */}
      <section className="space-y-6">
        <div className="flex flex-wrap justify-between items-center px-4 gap-4">
           <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
             <ShieldCheck size={16} className="text-emerald-500"/> Manajemen Member Aktif
           </h3>
           <div className="flex items-center gap-4">
             <button 
              onClick={() => exportToCSV(users, 'SF_Member_Aktif')}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-100 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-200 transition-all shadow-sm"
             >
               <Download size={16} /> Export Member CSV
             </button>
             <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-gray-100 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
               <Search size={16} className="text-gray-400" />
               <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Cari nama/email..." className="bg-transparent outline-none text-xs font-bold text-gray-900 w-48" />
             </div>
           </div>
        </div>

        <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lisensi Expired</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Add Time</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Power</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
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
                       <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                          <CalendarDays size={16} className="text-blue-400" />
                          <input type="date" value={u.subscriptionExpiry} onChange={e => handleDateChange(u.id, e.target.value)} className="bg-transparent outline-none cursor-pointer text-xs font-black text-gray-900" />
                       </div>
                    </td>
                    <td className="px-10 py-8">
                       <div className="flex justify-center gap-2">
                          <button onClick={() => renewLicense(u.id, '1m')} className="px-4 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">+1 Bln</button>
                          <button onClick={() => renewLicense(u.id, '3m')} className="px-4 py-2.5 bg-gray-50 text-gray-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">+3 Bln</button>
                          <button onClick={() => renewLicense(u.id, '1y')} className="px-4 py-2.5 bg-blue-100 text-blue-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-200 transition-all">+1 Thn</button>
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
