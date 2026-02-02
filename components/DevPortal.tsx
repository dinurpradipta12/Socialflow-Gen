
import React, { useState } from 'react';
import { User, RegistrationRequest } from '../types';
import { Database, RefreshCw, Zap, CheckCircle, XCircle, ShieldCheck, Mail, Clock, Globe, Download, Cloud, Radio, UserPlus, Phone, Calendar, AlertCircle, Key, RefreshCcw, Send, Trash2, Edit, ChevronRight, UserCheck, Loader2 } from 'lucide-react';
import { mailService } from '../services/mailService';

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
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'manual' | 'users'>('queue');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<{[key: string]: 'idle' | 'sending' | 'sent' | 'error'}>({});
  
  // State Form Manual
  const [manualUser, setManualUser] = useState({
    name: '',
    email: '',
    password: '',
    whatsapp: '',
    activationDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    status: 'active' as 'active' | 'suspended'
  });

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let pass = "";
    for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setManualUser({...manualUser, password: pass});
  };

  const dispatchCloudEmail = async (u: User) => {
    setDispatchStatus(prev => ({ ...prev, [u.id]: 'sending' }));
    
    try {
      // Menggunakan Mail Service yang sesungguhnya
      await mailService.sendCredentials(u);
      
      setDispatchStatus(prev => ({ ...prev, [u.id]: 'sent' }));
      
      // Auto-reset status after 5 seconds
      setTimeout(() => {
         setDispatchStatus(prev => {
            const newState = { ...prev };
            delete newState[u.id];
            return newState;
         });
      }, 5000);
      return true;
    } catch (error) {
      console.error(error);
      alert("Gagal mengirim email via Cloud SMTP. Cek konsol untuk detail atau pastikan config API benar.");
      setDispatchStatus(prev => ({ ...prev, [u.id]: 'error' }));
      setTimeout(() => {
        setDispatchStatus(prev => {
           const newState = { ...prev };
           delete newState[u.id];
           return newState;
        });
     }, 3000);
     return false;
    }
  };

  const pendingRegs = registrations.filter(r => (r.status || '').toLowerCase() === 'pending');

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUser.email || !manualUser.expiryDate) {
      alert("Email dan Tanggal Berakhir wajib diisi.");
      return;
    }

    setIsDispatching(true);

    const newUser: User = {
      id: `U-MANUAL-${Date.now()}`,
      name: manualUser.name,
      email: manualUser.email,
      password: manualUser.password || 'Social123',
      whatsapp: manualUser.whatsapp,
      role: 'viewer',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${manualUser.name}`,
      permissions: { dashboard: true, calendar: true, ads: false, analytics: false, tracker: false, team: false, settings: false, contentPlan: true },
      isSubscribed: true,
      activationDate: manualUser.activationDate,
      subscriptionExpiry: manualUser.expiryDate,
      status: manualUser.status,
      jobdesk: 'Manual Member',
      kpi: [],
      activityLogs: [],
      performanceScore: 0,
      requiresPasswordChange: true // WAJIB GANTI PASSWORD
    };

    // 1. Simpan ke database lokal
    setUsers([...users, newUser]);

    // 2. Dispatch email kredensial langsung
    const emailSuccess = await dispatchCloudEmail(newUser);

    if (emailSuccess) {
      alert(`User ${manualUser.name} diaktifkan & Kredensial TERKIRIM ke ${manualUser.email}.`);
    } else {
      alert(`User ${manualUser.name} diaktifkan, NAMUN email gagal terkirim (Mode Offline/Config Error).`);
    }
    
    setIsDispatching(false);
    setActiveSubTab('users');
    setManualUser({
      name: '', email: '', password: '', whatsapp: '', activationDate: new Date().toISOString().split('T')[0], expiryDate: '', status: 'active'
    });
  };

  return (
    <div className="space-y-8 animate-slide pb-20">
      <div className="bg-slate-950 p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
           <div className="space-y-4">
              <div className="inline-flex px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400 text-[9px] font-black uppercase tracking-widest items-center gap-2">
                 <ShieldCheck size={12} className="animate-pulse" />
                 Secure Administrator V3.7.0
              </div>
              <h1 className="text-3xl md:text-5xl font-black flex items-center gap-4 tracking-tighter"><Database className="text-blue-400" size={40} /> Admin Core</h1>
           </div>
           
           <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-full">
              <button 
                onClick={() => setActiveSubTab('queue')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === 'queue' ? 'bg-blue-50 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                 Registry Queue
              </button>
              <button 
                onClick={() => setActiveSubTab('manual')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === 'manual' ? 'bg-blue-50 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                 Manual Provision
              </button>
              <button 
                onClick={() => setActiveSubTab('users')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === 'users' ? 'bg-blue-50 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                 Active Users DB
              </button>
           </div>
        </div>
      </div>

      {activeSubTab === 'queue' && (
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
                      <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Action Control</th>
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
                         <td className="px-10 py-8">
                            <div className="flex justify-center gap-2">
                                <button onClick={() => onRegistrationAction(r.id, 'approved')} className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100">Approve Access</button>
                                <button onClick={() => onRegistrationAction(r.id, 'rejected')} className="px-5 py-2.5 bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-rose-100">Reject</button>
                            </div>
                         </td>
                      </tr>
                   ))}
                   {pendingRegs.length === 0 && (
                     <tr><td colSpan={2} className="py-20 text-center text-gray-300 font-black uppercase text-xs tracking-[0.4em]">Queue Empty</td></tr>
                   )}
                </tbody>
             </table>
          </div>
        </section>
      )}

      {activeSubTab === 'manual' && (
        <section className="max-w-4xl mx-auto animate-slide">
           <div className="bg-white p-10 md:p-14 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-10">
              <div className="flex items-center gap-4 border-b border-gray-100 pb-8">
                 <div className="p-4 bg-blue-50 text-blue-500 rounded-3xl"><UserPlus size={32}/></div>
                 <div>
                    <h2 className="text-2xl font-black text-gray-900">Manual Provisioning</h2>
                    <p className="text-sm text-gray-400 font-medium">Buat akses administrator/member secara instan.</p>
                 </div>
              </div>

              <form onSubmit={handleManualRegister} className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                       <input required type="text" value={manualUser.name} onChange={e => setManualUser({...manualUser, name: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-transparent focus:bg-white focus:border-blue-100" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Identifier</label>
                       <input required type="email" value={manualUser.email} onChange={e => setManualUser({...manualUser, email: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-transparent focus:bg-white focus:border-blue-100" placeholder="user@snaillabs.id" />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp (62xxx)</label>
                       <input required type="text" value={manualUser.whatsapp} onChange={e => setManualUser({...manualUser, whatsapp: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-transparent focus:bg-white focus:border-blue-100" placeholder="62812xxx" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Security Code (Password)</label>
                       <div className="flex gap-2">
                          <input required type="text" value={manualUser.password} onChange={e => setManualUser({...manualUser, password: e.target.value})} className="flex-1 px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-transparent focus:bg-white focus:border-blue-100" placeholder="Min 6 Karakter" />
                          <button type="button" onClick={generatePassword} className="px-4 bg-gray-100 rounded-2xl text-gray-400 hover:bg-gray-200 transition-colors" title="Generate Secure Password"><RefreshCcw size={18}/></button>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Activation Date</label>
                       <input required type="date" value={manualUser.activationDate} onChange={e => setManualUser({...manualUser, activationDate: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Termination Date (Expiry)</label>
                       <input required type="date" value={manualUser.expiryDate} onChange={e => setManualUser({...manualUser, expiryDate: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900" />
                    </div>
                 </div>

                 <button type="submit" disabled={isDispatching} className="w-full py-6 bg-blue-500 text-white font-black uppercase text-[11px] tracking-widest rounded-3xl shadow-2xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                    {isDispatching ? <><Loader2 size={18} className="animate-spin" /> Sending Email via API...</> : "Register & Send Credentials"}
                 </button>
              </form>
           </div>
        </section>
      )}

      {activeSubTab === 'users' && (
        <section className="space-y-6 animate-slide">
           <div className="flex justify-between items-center px-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Master User Database</h3>
              <div className="flex gap-2">
                 <button className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400">Total Nodes: {users.length}</button>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-left min-w-[1100px]">
                 <thead className="bg-gray-50/80 border-b border-gray-100">
                    <tr>
                       <th className="px-8 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Master Profile</th>
                       <th className="px-8 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">WhatsApp</th>
                       <th className="px-8 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Role Authority</th>
                       <th className="px-8 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Subscription Period</th>
                       <th className="px-8 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Status</th>
                       <th className="px-8 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">SMTP Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {users.map(u => {
                      const isExpired = u.subscriptionExpiry && new Date() > new Date(u.subscriptionExpiry);
                      const dStatus = dispatchStatus[u.id] || 'idle';

                      return (
                       <tr key={u.id} className={`hover:bg-gray-50/50 transition-all group ${isExpired ? 'opacity-60' : ''}`}>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-4">
                                <img src={u.avatar} className="w-10 h-10 rounded-xl border-2 border-white shadow-md" alt="" />
                                <div>
                                   <p className="text-sm font-black text-gray-900">{u.name}</p>
                                   <p className="text-[10px] text-gray-400 font-bold">{u.email}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-2">
                                <Phone size={14} className="text-emerald-500" />
                                <span className="text-xs font-bold text-gray-700">{u.whatsapp || '-'}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg border ${
                               u.role === 'developer' ? 'bg-gray-900 text-white border-gray-900' : 
                               u.role === 'superuser' ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-blue-50 text-blue-500 border-blue-100'
                             }`}>
                                {u.role}
                             </span>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-300">
                                   <UserPlus size={10}/> {u.activationDate || 'N/A'}
                                </div>
                                <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${isExpired ? 'text-rose-500' : 'text-gray-400'}`}>
                                   <Clock size={10}/> {u.subscriptionExpiry || 'N/A'}
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isExpired ? 'bg-rose-500' : u.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${isExpired ? 'text-rose-500' : 'text-gray-900'}`}>
                                   {isExpired ? 'Expired' : u.status || 'Active'}
                                </span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button 
                                   disabled={dStatus !== 'idle'}
                                   onClick={() => dispatchCloudEmail(u)} 
                                   className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shadow-sm ${
                                      dStatus === 'sent' ? 'bg-emerald-50 text-emerald-500' :
                                      dStatus === 'sending' ? 'bg-blue-50 text-blue-400' :
                                      dStatus === 'error' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white'
                                   }`} 
                                   title="Resend Credentials via API"
                                >
                                   {dStatus === 'sending' ? <Loader2 size={14} className="animate-spin" /> : dStatus === 'sent' ? <CheckCircle size={14} /> : dStatus === 'error' ? <AlertCircle size={14}/> : <Send size={14}/>}
                                   <span className="text-[9px] font-black uppercase tracking-widest">
                                      {dStatus === 'sent' ? 'Sent' : dStatus === 'sending' ? 'Sending' : dStatus === 'error' ? 'Failed' : 'Resend'}
                                   </span>
                                </button>
                                <button className="p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-200 transition-colors"><Edit size={16}/></button>
                             </div>
                          </td>
                       </tr>
                      );
                    })}
                 </tbody>
              </table>
           </div>
        </section>
      )}
    </div>
  );
};

export default DevPortal;
