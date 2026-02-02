
import React, { useState } from 'react';
import { User, RegistrationRequest } from '../types';
import { Database, RefreshCw, Zap, CheckCircle, XCircle, ShieldCheck, Mail, Clock, Globe, Download, Cloud, Radio, UserPlus, Phone, Calendar, AlertCircle } from 'lucide-react';

interface DevPortalProps {
  primaryColorHex: string;
  registrations: RegistrationRequest[];
  onRegistrationAction: (regId: string, status: 'approved' | 'rejected') => void;
  users: User[];
  setUsers: (users: User[]) => void;
  setRegistrations: (regs: RegistrationRequest[]) => void;
  dbSourceUrl: string;
  setDbSourceUrl: (url: string) => void;
  onManualSync: () => void;
}

const DevPortal: React.FC<DevPortalProps> = ({ 
  registrations, onRegistrationAction, onManualSync, users, setUsers
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'manual'>('queue');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // State Form Manual
  const [manualUser, setManualUser] = useState({
    name: '',
    email: '',
    whatsapp: '',
    activationDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    status: 'active' as 'active' | 'suspended'
  });

  const pendingRegs = registrations.filter(r => (r.status || '').toLowerCase() === 'pending');

  const handleManualRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUser.email || !manualUser.expiryDate) {
      alert("Email dan Tanggal Berakhir wajib diisi.");
      return;
    }

    const newUser: User = {
      id: `U-MANUAL-${Date.now()}`,
      name: manualUser.name,
      email: manualUser.email,
      whatsapp: manualUser.whatsapp,
      role: 'viewer',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${manualUser.name}`,
      permissions: { dashboard: true, calendar: true, ads: false, analytics: false, tracker: false, team: false, settings: false, contentPlan: true },
      isSubscribed: true,
      activationDate: manualUser.activationDate,
      subscriptionExpiry: manualUser.expiryDate,
      status: manualUser.status,
      jobdesk: 'Manual Registration',
      kpi: [],
      activityLogs: [],
      performanceScore: 0
    };

    setUsers([...users, newUser]);
    alert(`User ${manualUser.name} berhasil didaftarkan secara manual!`);
    setManualUser({
      name: '', email: '', whatsapp: '', activationDate: new Date().toISOString().split('T')[0], expiryDate: '', status: 'active'
    });
  };

  return (
    <div className="space-y-8 animate-slide pb-20">
      <div className="bg-slate-950 p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
           <div className="space-y-4">
              <div className="inline-flex px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400 text-[9px] font-black uppercase tracking-widest items-center gap-2">
                 <Radio size={12} className="animate-pulse" />
                 Secure Developer Core V3.4
              </div>
              <h1 className="text-3xl md:text-5xl font-black flex items-center gap-4 tracking-tighter"><Database className="text-blue-400" size={40} /> Dev Center</h1>
           </div>
           
           <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
              <button 
                onClick={() => setActiveSubTab('queue')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'queue' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                 Incoming Queue
              </button>
              <button 
                onClick={() => setActiveSubTab('manual')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'manual' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                 Manual Provisioning
              </button>
           </div>
        </div>
      </div>

      {activeSubTab === 'queue' ? (
        <section className="space-y-6">
          <div className="flex justify-between items-center px-6">
             <div className="space-y-1">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Cloud Registry Queue</h3>
                <p className="text-[10px] text-gray-300 font-bold">Data disinkronkan dari semua node perangkat</p>
             </div>
             <button 
                onClick={() => { setIsRefreshing(true); onManualSync(); setTimeout(() => setIsRefreshing(false), 1000); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-xl text-blue-500 hover:bg-blue-100 transition-all"
             >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
                <span className="text-[10px] font-black uppercase tracking-widest">Refresh Cloud</span>
             </button>
          </div>
          
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                   <tr>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">User Node</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Timestamp</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Cloud Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {pendingRegs.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50/50 transition-all">
                         <td className="px-10 py-8">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 font-black">{r.name.charAt(0)}</div>
                               <div>
                                  <p className="text-sm font-black text-gray-900">{r.name}</p>
                                  <p className="text-[10px] text-gray-400 font-bold">{r.email}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-8 text-[11px] font-bold text-gray-400">{r.timestamp}</td>
                         <td className="px-10 py-8">
                            <div className="flex justify-center gap-2">
                                <button onClick={() => onRegistrationAction(r.id, 'approved')} className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100">Approve</button>
                                <button onClick={() => onRegistrationAction(r.id, 'rejected')} className="px-5 py-2.5 bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-rose-100">Reject</button>
                            </div>
                         </td>
                      </tr>
                   ))}
                   {pendingRegs.length === 0 && (
                     <tr><td colSpan={3} className="py-20 text-center text-gray-300 font-black uppercase text-xs tracking-[0.4em]">Queue Empty</td></tr>
                   )}
                </tbody>
             </table>
          </div>
        </section>
      ) : (
        <section className="max-w-4xl mx-auto animate-slide">
           <div className="bg-white p-10 md:p-14 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-10">
              <div className="flex items-center gap-4 border-b border-gray-100 pb-8">
                 <div className="p-4 bg-blue-50 text-blue-500 rounded-3xl"><UserPlus size={32}/></div>
                 <div>
                    <h2 className="text-2xl font-black text-gray-900">Pendaftaran User Manual</h2>
                    <p className="text-sm text-gray-400 font-medium">Buat akun akses langsung tanpa melalui antrian cloud.</p>
                 </div>
              </div>

              <form onSubmit={handleManualRegister} className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                       <div className="relative">
                          <input required type="text" value={manualUser.name} onChange={e => setManualUser({...manualUser, name: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-transparent focus:bg-white focus:border-blue-100" placeholder="John Doe" />
                          <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                       <div className="relative">
                          <input required type="email" value={manualUser.email} onChange={e => setManualUser({...manualUser, email: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-transparent focus:bg-white focus:border-blue-100" placeholder="user@snaillabs.id" />
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp (WA)</label>
                       <div className="relative">
                          <input required type="text" value={manualUser.whatsapp} onChange={e => setManualUser({...manualUser, whatsapp: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-transparent focus:bg-white focus:border-blue-100" placeholder="62812xxx" />
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status Akun</label>
                       <select value={manualUser.status} onChange={e => setManualUser({...manualUser, status: e.target.value as any})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-transparent focus:bg-white">
                          <option value="active">Active Access</option>
                          <option value="suspended">Suspended</option>
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal Aktivasi</label>
                       <div className="relative">
                          <input required type="date" value={manualUser.activationDate} onChange={e => setManualUser({...manualUser, activationDate: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-transparent focus:bg-white focus:border-blue-100" />
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Berakhir Aktivasi (Expiry)</label>
                       <div className="relative">
                          <input required type="date" value={manualUser.expiryDate} onChange={e => setManualUser({...manualUser, expiryDate: e.target.value})} className="w-full pl-12 pr-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-transparent focus:bg-white focus:border-rose-100" />
                          <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-300" size={20} />
                       </div>
                    </div>
                 </div>

                 <button type="submit" className="w-full py-6 bg-blue-500 text-white font-black uppercase text-[11px] tracking-widest rounded-3xl shadow-2xl shadow-blue-500/20 active:scale-95 transition-all">
                    Register & Activate User Access
                 </button>
              </form>
           </div>
        </section>
      )}
    </div>
  );
};

export default DevPortal;
