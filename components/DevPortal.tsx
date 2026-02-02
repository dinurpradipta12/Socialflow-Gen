
import React, { useState, useEffect } from 'react';
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
  registrations, onRegistrationAction, onManualSync, users, setUsers, setRegistrations
}) => {
  // Added 'queue' back to tabs for approval queue
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'manual' | 'users'>('queue');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<{[key: string]: 'idle' | 'sending' | 'sent' | 'error'}>({});
  const [approvalLoading, setApprovalLoading] = useState<{[key: string]: boolean}>({});;
  
  // State Form Manual
  const [manualUser, setManualUser] = useState({
    name: '',
    email: '',
    password: '',
    whatsapp: '',
    activationDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    // Removed status from local state, it will be hardcoded to 'pending' on creation
  });

  // Real-time sync listener untuk registrations dari App.tsx
  useEffect(() => {
    // Ensure registrations state tetap up-to-date dengan localStorage
    const loadRegistrations = () => {
      const saved = localStorage.getItem('sf_registrations_db');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setRegistrations(parsed);
        } catch (error) {
          console.error('Failed to parse registrations:', error);
        }
      }
    };

    // Initial load
    loadRegistrations();

    // Listen untuk changes dari broadcast
    const registrationSyncChannel = new BroadcastChannel('sf_cloud_sync');
    const handleRegistrationSync = (event: MessageEvent) => {
      if (event.data?.type === 'registration_new' || event.data?.type === 'registration_update') {
        console.log('📨 Registrations updated real-time:', event.data.data);
        setRegistrations(event.data.data);
      }
    };

    registrationSyncChannel.onmessage = handleRegistrationSync;

    // Periodic refresh for redundancy (setiap 3 detik)
    const intervalId = setInterval(loadRegistrations, 3000);

    return () => {
      registrationSyncChannel.onmessage = null;
      clearInterval(intervalId);
      registrationSyncChannel.close();
    };
  }, [setRegistrations]);

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

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUser.email || !manualUser.expiryDate) {
      alert("Email dan Tanggal Berakhir wajib diisi.");
      return;
    }

    // Cek duplikasi email
    if (users.some(u => u.email.toLowerCase() === manualUser.email.toLowerCase())) {
        alert("Email ini sudah terdaftar dalam database!");
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
      status: 'pending', // DEFAULT STATUS IS PENDING
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
      alert(`User ${manualUser.name} dibuat (Pending) & Kredensial TERKIRIM ke ${manualUser.email}.`);
    } else {
      alert(`User ${manualUser.name} dibuat (Pending), NAMUN email gagal terkirim.`);
    }
    
    setIsDispatching(false);
    setActiveSubTab('users');
    setManualUser({
      name: '', email: '', password: '', whatsapp: '', activationDate: new Date().toISOString().split('T')[0], expiryDate: ''
    });
  };

  const handleApproveRegistration = async (regId: string) => {
    setApprovalLoading(prev => ({ ...prev, [regId]: true }));
    
    const registration = registrations.find(r => r.id === regId);
    if (!registration) {
      alert("Registrasi tidak ditemukan!");
      setApprovalLoading(prev => ({ ...prev, [regId]: false }));
      return;
    }

    // Cek duplikasi email
    if (users.some(u => u.email.toLowerCase() === registration.email.toLowerCase())) {
      alert("Email sudah terdaftar dalam database!");
      setApprovalLoading(prev => ({ ...prev, [regId]: false }));
      return;
    }

    // Buat user baru dari registrasi
    const newUser: User = {
      id: `U-REG-${Date.now()}`,
      name: registration.name,
      email: registration.email,
      password: registration.password || 'Social123',
      whatsapp: registration.niche || '',
      role: 'viewer',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${registration.name}`,
      permissions: { dashboard: true, calendar: true, ads: false, analytics: false, tracker: false, team: false, settings: false, contentPlan: true },
      isSubscribed: true,
      activationDate: new Date().toISOString().split('T')[0],
      subscriptionExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending',
      jobdesk: 'Community Member',
      kpi: [],
      activityLogs: [],
      performanceScore: 0,
      requiresPasswordChange: true
    };

    // Update registrasi status ke approved
    const updatedRegistrations = registrations.map(r =>
      r.id === regId ? { ...r, status: 'approved' as const } : r
    );
    setRegistrations(updatedRegistrations);
    localStorage.setItem('sf_registrations_db', JSON.stringify(updatedRegistrations));

    // Tambah user ke database
    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem('sf_users_db', JSON.stringify(updatedUsers));

    // Kirim email kredensial
    try {
      await mailService.sendCredentials(newUser);
      alert(`User ${registration.name} telah di-approve dan kredensial telah dikirim!`);
    } catch (error) {
      console.error(error);
      alert(`User ${registration.name} telah di-approve, namun gagal mengirim email.`);
    }

    // Notify parent component
    onRegistrationAction(regId, 'approved');

    setApprovalLoading(prev => ({ ...prev, [regId]: false }));
  };

  const handleRejectRegistration = (regId: string) => {
    const rejection = window.confirm('Yakin ingin menolak registrasi ini?');
    if (!rejection) return;

    const updatedRegistrations = registrations.map(r =>
      r.id === regId ? { ...r, status: 'rejected' as const } : r
    );
    setRegistrations(updatedRegistrations);
    localStorage.setItem('sf_registrations_db', JSON.stringify(updatedRegistrations));

    // Notify parent component
    onRegistrationAction(regId, 'rejected');

    const registration = registrations.find(r => r.id === regId);
    alert(`Registrasi ${registration?.name} telah ditolak.`);
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
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeSubTab === 'queue' ? 'bg-blue-50 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                 <UserCheck size={14}/>
                 Approval Queue
                 {registrations.filter(r => r.status === 'pending').length > 0 && (
                   <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-[8px] font-black rounded-full">
                     {registrations.filter(r => r.status === 'pending').length}
                   </span>
                 )}
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

      {/* Registry Queue removed entirely */}

      {activeSubTab === 'queue' && (
        <section className="space-y-6 animate-slide">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 sm:px-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">User Approval Queue</h3>
              <div className="flex gap-2">
                 <button className="px-3 sm:px-4 py-2 bg-white border border-gray-100 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">
                   Pending: {registrations.filter(r => r.status === 'pending').length}
                 </button>
              </div>
           </div>

           {registrations.filter(r => r.status === 'pending').length === 0 ? (
             <div className="bg-white p-6 sm:p-12 rounded-[2.5rem] border border-gray-100 shadow-sm text-center mx-4 sm:mx-0">
               <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                 <CheckCircle size={32}/>
               </div>
               <p className="text-gray-400 font-bold text-sm">Tidak ada registrasi yang menunggu approval</p>
             </div>
           ) : (
             <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto mx-4 sm:mx-0">
                <table className="w-full text-left min-w-full sm:min-w-[1000px]">
                   <thead className="bg-gray-50/80 border-b border-gray-100">
                      <tr>
                         <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black text-gray-300 uppercase tracking-widest">Profile</th>
                         <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black text-gray-300 uppercase tracking-widest">Email</th>
                         <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black text-gray-300 uppercase tracking-widest hidden sm:table-cell">WhatsApp</th>
                         <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black text-gray-300 uppercase tracking-widest hidden md:table-cell">Niche</th>
                         <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black text-gray-300 uppercase tracking-widest hidden lg:table-cell">Registered</th>
                         <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {registrations.filter(r => r.status === 'pending').map(reg => (
                        <tr key={reg.id} className="hover:bg-gray-50/50 transition-all group">
                           <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 sm:w-10 h-8 sm:h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-md flex-shrink-0">
                                   {reg.name.charAt(0).toUpperCase()}
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-black text-gray-900 truncate">{reg.name}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
                              <span className="text-xs sm:text-xs font-bold text-gray-600 break-all">{reg.email}</span>
                           </td>
                           <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 hidden sm:table-cell">
                              <div className="flex items-center gap-2">
                                 <Phone size={14} className="text-gray-300 flex-shrink-0"/>
                                 <span className="text-xs font-bold text-gray-600">{reg.handle || '-'}</span>
                              </div>
                           </td>
                           <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 hidden md:table-cell">
                              <span className="text-xs font-bold text-gray-600">{reg.niche || 'N/A'}</span>
                           </td>
                           <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 hidden lg:table-cell">
                              <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                 <Calendar size={12}/>
                                 {new Date(reg.timestamp).toLocaleDateString('id-ID')}
                              </div>
                           </td>
                           <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
                              <div className="flex justify-center gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-all flex-wrap">
                                 <button 
                                    disabled={approvalLoading[reg.id]}
                                    onClick={() => handleApproveRegistration(reg.id)}
                                    className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl transition-all shadow-sm font-black text-[7px] sm:text-[9px] uppercase tracking-widest whitespace-nowrap ${
                                      approvalLoading[reg.id]
                                        ? 'bg-blue-100 text-blue-400'
                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white'
                                    }`}
                                 >
                                    {approvalLoading[reg.id] ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14}/>}
                                    {approvalLoading[reg.id] ? 'Processing' : 'Approve'}
                                 </button>
                                 <button 
                                    onClick={() => handleRejectRegistration(reg.id)}
                                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm font-black text-[7px] sm:text-[9px] uppercase tracking-widest whitespace-nowrap"
                                 >
                                    <XCircle size={14}/>
                                    <span className="hidden sm:inline">Reject</span>
                                 </button>
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           )}
        </section>
      )}

      {activeSubTab === 'manual' && (
        <section className="max-w-4xl mx-auto animate-slide px-4 sm:px-0">
           <div className="bg-white p-6 sm:p-10 md:p-14 rounded-[2.5rem] sm:rounded-[3.5rem] border border-gray-100 shadow-xl space-y-8 sm:space-y-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-gray-100 pb-6 sm:pb-8">
                 <div className="p-3 sm:p-4 bg-blue-50 text-blue-500 rounded-3xl flex-shrink-0"><UserPlus size={28} className="sm:w-8 sm:h-8"/></div>
                 <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900">Manual Provisioning</h2>
                    <p className="text-xs sm:text-sm text-gray-400 font-medium">Buat akses user baru. Status awal akan <b>Pending</b> hingga user login.</p>
                 </div>
              </div>

              <form onSubmit={handleManualRegister} className="space-y-6 sm:space-y-8">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                       <input required type="text" value={manualUser.name} onChange={e => setManualUser({...manualUser, name: e.target.value})} className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-transparent focus:bg-white focus:border-blue-100 text-sm" placeholder="John Doe" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Identifier</label>
                       <input required type="email" value={manualUser.email} onChange={e => setManualUser({...manualUser, email: e.target.value})} className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-transparent focus:bg-white focus:border-blue-100 text-sm" placeholder="user@snaillabs.id" />
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">WhatsApp (62xxx)</label>
                       <input required type="text" value={manualUser.whatsapp} onChange={e => setManualUser({...manualUser, whatsapp: e.target.value})} className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-transparent focus:bg-white focus:border-blue-100 text-sm" placeholder="62812xxx" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Security Code (Password)</label>
                       <div className="flex gap-2">
                          <input required type="text" value={manualUser.password} onChange={e => setManualUser({...manualUser, password: e.target.value})} className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-transparent focus:bg-white focus:border-blue-100 text-sm" placeholder="Min 6 Karakter" />
                          <button type="button" onClick={generatePassword} className="px-3 sm:px-4 bg-gray-100 rounded-2xl text-gray-400 hover:bg-gray-200 transition-colors flex-shrink-0" title="Generate Secure Password"><RefreshCcw size={18}/></button>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Activation Date</label>
                       <input required type="date" value={manualUser.activationDate} onChange={e => setManualUser({...manualUser, activationDate: e.target.value})} className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 text-sm" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Termination Date (Expiry)</label>
                       <input required type="date" value={manualUser.expiryDate} onChange={e => setManualUser({...manualUser, expiryDate: e.target.value})} className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 text-sm" />
                    </div>
                 </div>

                 <button type="submit" disabled={isDispatching} className="w-full py-4 sm:py-6 bg-blue-500 text-white font-black uppercase text-[10px] sm:text-[11px] tracking-widest rounded-3xl shadow-2xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 sm:gap-3">
                    {isDispatching ? <><Loader2 size={16} className="animate-spin" /> <span className="hidden sm:inline">Sending Email via API...</span><span className="sm:hidden">Sending...</span></> : <><span className="hidden sm:inline">Create User & Send Email</span><span className="sm:hidden">Create User</span></>}
                 </button>
              </form>
           </div>
        </section>
      )}

      {activeSubTab === 'users' && (
        <section className="space-y-6 animate-slide">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-4 sm:px-6">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Master User Database</h3>
              <div className="flex gap-2">
                 <button className="px-3 sm:px-4 py-2 bg-white border border-gray-100 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 whitespace-nowrap">Total Nodes: {users.length}</button>
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto mx-4 sm:mx-0">
              <table className="w-full text-left min-w-full sm:min-w-[1000px]">
                 <thead className="bg-gray-50/80 border-b border-gray-100">
                    <tr>
                       <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black text-gray-300 uppercase tracking-widest">Master Profile</th>
                       <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black text-gray-300 uppercase tracking-widest hidden sm:table-cell">WhatsApp</th>
                       <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black text-gray-300 uppercase tracking-widest">Role</th>
                       <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black text-gray-300 uppercase tracking-widest hidden md:table-cell">Subscription Period</th>
                       <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black text-gray-300 uppercase tracking-widest">Status</th>
                       <th className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 text-[8px] sm:text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Action</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {users.map(u => {
                      const isExpired = u.subscriptionExpiry && new Date() > new Date(u.subscriptionExpiry);
                      const dStatus = dispatchStatus[u.id] || 'idle';
                      const currentStatus = u.status || 'active';

                      // Determine visual status
                      let statusColor = 'bg-emerald-500';
                      let statusText = 'active';
                      
                      if (isExpired) {
                          statusColor = 'bg-rose-500';
                          statusText = 'expired';
                      } else if (currentStatus === 'pending') {
                          statusColor = 'bg-amber-400';
                          statusText = 'pending';
                      } else if (currentStatus === 'suspended') {
                          statusColor = 'bg-gray-400';
                          statusText = 'suspended';
                      }

                      return (
                       <tr key={u.id} className={`hover:bg-gray-50/50 transition-all group ${isExpired ? 'opacity-60' : ''}`}>
                          <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
                             <div className="flex items-center gap-2 sm:gap-4">
                                <img src={u.avatar} className="w-8 sm:w-10 h-8 sm:h-10 rounded-xl border-2 border-white shadow-md flex-shrink-0" alt="" />
                                <div className="min-w-0">
                                   <p className="text-xs sm:text-sm font-black text-gray-900 truncate">{u.name}</p>
                                   <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold truncate">{u.email}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 hidden sm:table-cell">
                             <div className="flex items-center gap-2">
                                <Phone size={14} className="text-emerald-500 flex-shrink-0" />
                                <span className="text-xs font-bold text-gray-700">{u.whatsapp || '-'}</span>
                             </div>
                          </td>
                          <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
                             <span className={`px-2 sm:px-3 py-1 text-[7px] sm:text-[9px] font-black uppercase rounded-lg border ${
                               u.role === 'developer' ? 'bg-gray-900 text-white border-gray-900' : 
                               u.role === 'superuser' ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-blue-50 text-blue-500 border-blue-100'
                             }`}>
                                {u.role}
                             </span>
                          </td>
                          <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 hidden md:table-cell">
                             <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase text-gray-300">
                                   <UserPlus size={10}/> {u.activationDate || 'N/A'}
                                </div>
                                <div className={`flex items-center gap-2 text-[8px] sm:text-[10px] font-black uppercase ${isExpired ? 'text-rose-500' : 'text-gray-400'}`}>
                                   <Clock size={10}/> {u.subscriptionExpiry || 'N/A'}
                                </div>
                             </div>
                          </td>
                          <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
                             <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${statusColor} ${currentStatus === 'active' ? 'animate-pulse' : ''}`}></div>
                                <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${isExpired ? 'text-rose-500' : 'text-gray-900'}`}>
                                   {statusText}
                                </span>
                             </div>
                          </td>
                          <td className="px-4 sm:px-6 md:px-8 py-4 sm:py-6">
                             <div className="flex justify-center gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button 
                                   disabled={dStatus !== 'idle'}
                                   onClick={() => dispatchCloudEmail(u)} 
                                   className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl transition-all shadow-sm text-[7px] sm:text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${
                                      dStatus === 'sent' ? 'bg-emerald-50 text-emerald-500' :
                                      dStatus === 'sending' ? 'bg-blue-50 text-blue-400' :
                                      dStatus === 'error' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white'
                                   }`} 
                                   title="Resend Credentials via API"
                                >
                                   {dStatus === 'sending' ? <Loader2 size={12} className="animate-spin flex-shrink-0" /> : dStatus === 'sent' ? <CheckCircle size={12} className="flex-shrink-0" /> : dStatus === 'error' ? <AlertCircle size={12} className="flex-shrink-0"/> : <Send size={12} className="flex-shrink-0"/>}
                                   <span className="hidden sm:inline">
                                      {dStatus === 'sent' ? 'Sent' : dStatus === 'sending' ? 'Sending' : dStatus === 'error' ? 'Failed' : 'Resend'}
                                   </span>
                                </button>
                                <button className="p-2 sm:p-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-200 transition-colors flex-shrink-0"><Edit size={12} className="sm:w-4 sm:h-4"/></button>
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
