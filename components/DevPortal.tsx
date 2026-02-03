
import React, { useState, useEffect } from 'react';
import { User, RegistrationRequest } from '../types';
import { Database, RefreshCw, Zap, CheckCircle, XCircle, ShieldCheck, Mail, Clock, Globe, Download, Cloud, Radio, UserPlus, Phone, Calendar, AlertCircle, Key, RefreshCcw, Send, Trash2, Edit, ChevronRight, UserCheck, Loader2, Link as LinkIcon, FileSpreadsheet, Share2, Server, Copy, Terminal, CloudLightning, ArrowDownToLine, Wifi, WifiOff, Hourglass } from 'lucide-react';
import { mailService } from '../services/mailService';
import { integrationService } from '../services/integrationService';
import { databaseService } from '../services/databaseService';

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
  const [activeSubTab, setActiveSubTab] = useState<'manual' | 'users' | 'integrations' | 'database'>('manual');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchStatus, setDispatchStatus] = useState<{[key: string]: 'idle' | 'sending' | 'sent' | 'error'}>({});
  
  // Database & Connection States
  const [dbConfig, setDbConfig] = useState({
    url: localStorage.getItem('sf_db_url') || '',
    key: localStorage.getItem('sf_db_key') || ''
  });
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [isDbSyncing, setIsDbSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [displayedUsers, setDisplayedUsers] = useState<User[]>(users); // Users to display in table

  // Integration States
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('sf_webhook_url') || '');
  const [isWebhookTesting, setIsWebhookTesting] = useState(false);

  useEffect(() => {
    localStorage.setItem('sf_webhook_url', webhookUrl);
  }, [webhookUrl]);

  useEffect(() => {
    localStorage.setItem('sf_db_url', dbConfig.url);
    localStorage.setItem('sf_db_key', dbConfig.key);
  }, [dbConfig]);

  // Initial Connection Check
  useEffect(() => {
    if (dbConfig.url && dbConfig.key) {
        checkDbConnection();
    } else {
        setDbStatus('offline');
    }
  }, []);

  // Sync displayed users with prop users when on other tabs, 
  // but if on 'users' tab and connected, we might want to show DB users (handled in checkDbConnection/Refresh)
  useEffect(() => {
    if (activeSubTab !== 'users') {
        setDisplayedUsers(users);
    }
  }, [users, activeSubTab]);

  const checkDbConnection = async () => {
    setDbStatus('checking');
    try {
        // Try fetching users as a ping
        const dbUsers = await databaseService.getAllUsers(dbConfig);
        setDbStatus('online');
        // If we are active on Users tab, update the view with Real Data
        if (activeSubTab === 'users') {
            setDisplayedUsers(dbUsers);
        }
    } catch (e) {
        setDbStatus('offline');
        console.error("DB Connection Check Failed", e);
    }
  };

  const handleRefreshDb = async () => {
    if (!dbConfig.url || !dbConfig.key) return alert("Setup Database terlebih dahulu.");
    setIsDbSyncing(true);
    try {
        const dbUsers = await databaseService.getAllUsers(dbConfig);
        setDisplayedUsers(dbUsers);
        setDbStatus('online');
        alert("Database Refreshed! Data terbaru berhasil dimuat.");
    } catch (e) {
        setDbStatus('offline');
        alert("Gagal terhubung ke Database. Cek koneksi atau Key.");
    } finally {
        setIsDbSyncing(false);
    }
  };

  
  // State Form Manual
  const [manualUser, setManualUser] = useState({
    name: '',
    email: '',
    password: '',
    whatsapp: '',
    activationDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
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
      await mailService.sendCredentials(u);
      setDispatchStatus(prev => ({ ...prev, [u.id]: 'sent' }));
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
      alert("Gagal mengirim email via Cloud SMTP.");
      setDispatchStatus(prev => ({ ...prev, [u.id]: 'error' }));
      return false;
    }
  };

  const syncToDatabase = async (u: User) => {
    if(!dbConfig.url || !dbConfig.key) return; // Silent if not configured
    try {
      await databaseService.upsertUser(dbConfig, u);
    } catch (e) {
      console.error("Auto Sync DB Failed", e);
    }
  };

  const handlePullApprovedRegistrations = async () => {
    if(!dbConfig.url || !dbConfig.key) return alert("Konfigurasi database belum lengkap di tab DB Monitor.");
    
    setIsPulling(true);
    try {
      const approvedRegs = await databaseService.fetchApprovedRegistrations(dbConfig);
      
      if (approvedRegs.length === 0) {
        alert("Tidak ada data registrasi berstatus 'approved' baru di database.");
        setIsPulling(false);
        return;
      }

      let importedCount = 0;
      const newUsers = [...users];

      for (const reg of approvedRegs) {
        // Cek duplikasi
        if (newUsers.some(u => u.email === reg.email)) continue;

        const defaultExpiry = new Date();
        defaultExpiry.setMonth(defaultExpiry.getMonth() + 1);

        const newUser: User = {
          id: `U-IMPORT-${reg.id}`,
          name: reg.name,
          email: reg.email,
          password: reg.password || 'Social123', // Use User Password
          whatsapp: reg.whatsapp,
          role: 'viewer',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${reg.name}`,
          permissions: { dashboard: true, calendar: true, ads: false, analytics: false, tracker: false, team: false, settings: false, contentPlan: true },
          isSubscribed: true,
          activationDate: new Date().toISOString().split('T')[0],
          subscriptionExpiry: defaultExpiry.toISOString().split('T')[0],
          status: 'pending', // Pending login
          jobdesk: 'New Member',
          kpi: [],
          activityLogs: [],
          performanceScore: 0,
          requiresPasswordChange: false // Sudah set password sendiri
        };
        
        newUsers.push(newUser);
        importedCount++;
        
        // Auto Sync User back to Users Table (to confirm existence in App)
        await databaseService.upsertUser(dbConfig, newUser);
      }

      setUsers(newUsers);
      alert(`Berhasil mengimpor ${importedCount} user baru dari Database Registrasi.`);

    } catch (e) {
      console.error(e);
      alert("Gagal menarik data.");
    } finally {
      setIsPulling(false);
    }
  };

  const handleManualRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUser.email || !manualUser.expiryDate) {
      alert("Email dan Tanggal Berakhir wajib diisi.");
      return;
    }

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
      status: 'pending',
      jobdesk: 'Manual Member',
      kpi: [],
      activityLogs: [],
      performanceScore: 0,
      requiresPasswordChange: true
    };

    setUsers([...users, newUser]);

    if (dbConfig.url && dbConfig.key) {
      await syncToDatabase(newUser);
    }

    const emailSuccess = await dispatchCloudEmail(newUser);

    if (emailSuccess) {
      alert(`User ${manualUser.name} dibuat & Synced.`);
    } else {
      alert(`User ${manualUser.name} dibuat, Email gagal.`);
    }
    
    setIsDispatching(false);
    setActiveSubTab('users');
    setManualUser({
      name: '', email: '', password: '', whatsapp: '', activationDate: new Date().toISOString().split('T')[0], expiryDate: ''
    });
  };

  const handleCsvExport = () => {
    integrationService.exportUsersToCSV(users);
  };

  const handleWebhookTest = async () => {
    if (!webhookUrl) return alert("Masukkan URL Webhook terlebih dahulu.");
    setIsWebhookTesting(true);
    try {
      await integrationService.triggerWebhook(webhookUrl, {
        event: 'TEST_SYNC',
        active_users_count: users.length,
        sample_data: users.slice(0, 1)
      });
      alert("Sukses! Data sample berhasil dikirim ke Webhook.");
    } catch (e) {
      alert("Gagal mengirim ke Webhook. Pastikan URL valid.");
    } finally {
      setIsWebhookTesting(false);
    }
  };

  const handleFullDbSync = async () => {
    if(!dbConfig.url || !dbConfig.key) return alert("Konfigurasi database belum lengkap.");
    
    setIsDbSyncing(true);
    setSyncProgress(0);
    
    let successCount = 0;
    
    for (let i = 0; i < users.length; i++) {
      try {
        await databaseService.upsertUser(dbConfig, users[i]);
        successCount++;
      } catch (e) {
        console.error(e);
      }
      setSyncProgress(Math.round(((i + 1) / users.length) * 100));
    }
    
    setIsDbSyncing(false);
    alert(`Sinkronisasi Selesai! ${successCount}/${users.length} user berhasil diupload ke PostgreSQL.`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Disalin ke clipboard!");
  };

  return (
    <div className="space-y-8 animate-slide pb-20">
      <div className="bg-slate-950 p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
        {/* Status Indicator Overlay */}
        <div className="absolute top-8 right-8 flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 z-20">
            {dbStatus === 'checking' && <Loader2 size={16} className="text-amber-400 animate-spin" />}
            {dbStatus === 'online' && <Wifi size={16} className="text-emerald-400" />}
            {dbStatus === 'offline' && <WifiOff size={16} className="text-rose-400" />}
            <span className="text-[10px] font-black uppercase tracking-widest">
                DB Status: {dbStatus === 'online' ? 'Connected' : dbStatus === 'offline' ? 'Disconnected' : 'Checking...'}
            </span>
        </div>

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
                onClick={() => setActiveSubTab('manual')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === 'manual' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                 Manual Provision
              </button>
              <button 
                onClick={() => { setActiveSubTab('users'); if(dbStatus==='online') checkDbConnection(); }}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSubTab === 'users' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                 Active Users DB
              </button>
              <button 
                onClick={() => setActiveSubTab('database')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeSubTab === 'database' ? 'bg-amber-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                 <Server size={12} /> DB Monitor
              </button>
              <button 
                onClick={() => setActiveSubTab('integrations')}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeSubTab === 'integrations' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
              >
                 <Zap size={12} /> Integrations
              </button>
           </div>
        </div>
      </div>

      {activeSubTab === 'manual' && (
        <section className="max-w-4xl mx-auto animate-slide space-y-8">
           {/* IMPORT FROM MONITORING */}
           <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-10 rounded-[3.5rem] border border-blue-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                 <div className="p-4 bg-white text-blue-500 rounded-3xl shadow-sm"><CloudLightning size={32}/></div>
                 <div>
                    <h2 className="text-xl font-black text-gray-900">Sync Approved Users</h2>
                    <p className="text-xs text-gray-500 font-medium mt-1 max-w-sm">Tarik data pendaftaran yang sudah di-<b>APPROVE</b> oleh Admin Monitoring dari Database Supabase.</p>
                 </div>
              </div>
              <button 
                onClick={handlePullApprovedRegistrations}
                disabled={isPulling}
                className="px-8 py-5 bg-blue-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 flex items-center gap-3 active:scale-95 transition-all"
              >
                 {isPulling ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />}
                 {isPulling ? 'Checking DB...' : 'Pull Approved Data'}
              </button>
           </div>

           {/* Manual Form */}
           <div className="bg-white p-10 md:p-14 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-10">
              <div className="flex items-center gap-4 border-b border-gray-100 pb-8">
                 <div className="p-4 bg-gray-50 text-gray-500 rounded-3xl"><UserPlus size={32}/></div>
                 <div>
                    <h2 className="text-2xl font-black text-gray-900">Manual Provisioning</h2>
                    <p className="text-sm text-gray-400 font-medium">Buat akses user baru secara manual (Bypass Approval).</p>
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

                 <button type="submit" disabled={isDispatching} className="w-full py-6 bg-gray-900 text-white font-black uppercase text-[11px] tracking-widest rounded-3xl shadow-2xl shadow-gray-300 active:scale-95 transition-all flex items-center justify-center gap-3">
                    {isDispatching ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : "Create User & Sync DB"}
                 </button>
              </form>
           </div>
        </section>
      )}

      {activeSubTab === 'users' && (
        <section className="space-y-6 animate-slide">
           {/* ... existing Users table ... */}
           <div className="flex justify-between items-center px-6">
              <div className="flex items-center gap-3">
                 <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Master User Database</h3>
                 {dbStatus === 'online' && (
                     <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Live DB Connected</span>
                 )}
              </div>
              <div className="flex gap-2">
                 <button 
                    onClick={handleRefreshDb}
                    disabled={isDbSyncing}
                    className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2 transition-all"
                 >
                    <RefreshCw size={12} className={isDbSyncing ? "animate-spin" : ""} /> {isDbSyncing ? "Refreshing..." : "Refresh Database"}
                 </button>
                 <button className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400">Total Nodes: {displayedUsers.length}</button>
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
                       <th className="px-8 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {displayedUsers.map(u => {
                      return (
                       <tr key={u.id} className={`hover:bg-gray-50/50 transition-all`}>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-4">
                                <img src={u.avatar} className="w-10 h-10 rounded-xl" alt="" />
                                <div><p className="text-sm font-black text-gray-900">{u.name}</p><p className="text-[10px] text-gray-400 font-bold">{u.email}</p></div>
                             </div>
                          </td>
                          <td className="px-8 py-6"><span className="text-xs font-bold text-gray-700">{u.whatsapp || '-'}</span></td>
                          <td className="px-8 py-6"><span className="px-3 py-1 text-[9px] font-black uppercase rounded-lg border bg-blue-50 text-blue-500 border-blue-100">{u.role}</span></td>
                          
                          {/* SUBSCRIPTION PERIOD DISPLAY - UPDATED */}
                          <td className="px-8 py-6">
                              <div className="flex flex-col">
                                <span className={`text-[10px] font-black uppercase ${u.subscriptionExpiry ? 'text-gray-700' : 'text-gray-300'}`}>
                                    {u.subscriptionExpiry ? new Date(u.subscriptionExpiry).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Lifetime Access'}
                                </span>
                                {u.subscriptionExpiry && (
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Hourglass size={10} className="text-gray-400"/>
                                        <span className="text-[8px] font-bold text-gray-400">
                                            {Math.ceil((new Date(u.subscriptionExpiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) > 0 
                                                ? `Sisa ${Math.ceil((new Date(u.subscriptionExpiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} hari`
                                                : 'Expired'}
                                        </span>
                                    </div>
                                )}
                              </div>
                          </td>
                          
                          <td className="px-8 py-6"><span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Active</span></td>
                          <td className="px-8 py-6 flex justify-center"><button onClick={() => syncToDatabase(u)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg"><RefreshCw size={14}/></button></td>
                       </tr>
                      );
                    })}
                 </tbody>
              </table>
           </div>
        </section>
      )}

      {activeSubTab === 'database' && (
        <section className="max-w-5xl mx-auto animate-slide space-y-8">
           <div className="bg-amber-500 p-10 rounded-[3.5rem] shadow-xl text-white flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="space-y-4">
                 <h2 className="text-3xl font-black">PostgreSQL Bridge</h2>
                 <p className="text-sm font-bold opacity-80 max-w-lg leading-relaxed">Hubungkan aplikasi ini ke Cloud Database (Supabase/Neon) agar data user bisa dibaca real-time oleh aplikasi monitoring Anda.</p>
              </div>
              <div className="p-4 bg-white/10 rounded-3xl border border-white/20">
                 <Server size={64} className="text-white opacity-90" />
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Configuration Form */}
              <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                 <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                    <div className="p-3 bg-gray-50 text-gray-500 rounded-2xl"><Key size={24}/></div>
                    <h3 className="text-xl font-black text-gray-900">Connection Secrets</h3>
                 </div>
                 
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Supabase Project URL</label>
                       <input 
                         type="password"
                         value={dbConfig.url} 
                         onChange={e => setDbConfig({...dbConfig, url: e.target.value})}
                         className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-transparent focus:bg-white focus:border-amber-100" 
                         placeholder="https://xyz.supabase.co" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Supabase Anon/Service Key</label>
                       <input 
                         type="password"
                         value={dbConfig.key} 
                         onChange={e => setDbConfig({...dbConfig, key: e.target.value})}
                         className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-transparent focus:bg-white focus:border-amber-100" 
                         placeholder="eyJhbGciOiJIUzI1NiIsInR5..." 
                       />
                    </div>
                    <div className="pt-4">
                       <button 
                         onClick={handleFullDbSync}
                         disabled={isDbSyncing || !dbConfig.url}
                         className="w-full py-5 bg-gray-900 text-white font-black uppercase text-[11px] tracking-widest rounded-3xl shadow-xl flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95"
                       >
                          {isDbSyncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                          {isDbSyncing ? `Syncing ${syncProgress}%` : 'Sync All Users to DB'}
                       </button>
                    </div>
                 </div>
              </div>

              {/* SQL Generator */}
              <div className="bg-slate-900 p-10 rounded-[3rem] shadow-xl space-y-6 text-white overflow-hidden relative">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Terminal size={24} className="text-amber-400" />
                       <h3 className="text-xl font-black">Database Schema (V3)</h3>
                    </div>
                    <button onClick={() => copyToClipboard(databaseService.getSchemaSQL())} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"><Copy size={16}/></button>
                 </div>
                 <p className="text-xs text-gray-400 leading-relaxed font-medium">
                    Salin SQL di bawah ini dan jalankan di SQL Editor Supabase Anda. Update V3 menambahkan field <b>password</b>.
                 </p>
                 <div className="bg-black/30 p-6 rounded-2xl border border-white/5 font-mono text-[10px] text-emerald-400 overflow-x-auto">
                    <pre>{databaseService.getSchemaSQL()}</pre>
                 </div>
              </div>
           </div>
        </section>
      )}

      {/* Integrations Tab remains same */}
      {activeSubTab === 'integrations' && (
        <section className="max-w-4xl mx-auto animate-slide space-y-8">
           {/* Webhook Section */}
           <div className="bg-white p-10 md:p-14 rounded-[3.5rem] border border-gray-100 shadow-xl space-y-8">
              <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                 <div className="p-4 bg-emerald-50 text-emerald-500 rounded-3xl"><Zap size={32}/></div>
                 <div>
                    <h2 className="text-2xl font-black text-gray-900">Webhook & API Trigger</h2>
                    <p className="text-sm text-gray-400 font-medium">Sambungkan data Socialflow ke Zapier, Make, atau custom backend.</p>
                 </div>
              </div>
              
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                       <LinkIcon size={12}/> Endpoint URL
                    </label>
                    <input 
                      type="url" 
                      value={webhookUrl} 
                      onChange={e => setWebhookUrl(e.target.value)}
                      placeholder="https://hooks.zapier.com/hooks/catch/..."
                      className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-transparent focus:bg-white focus:border-emerald-100 transition-all"
                    />
                 </div>
                 <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-500 font-medium leading-relaxed">
                    Setiap kali Anda menekan tombol sync atau ada event tertentu, sistem akan mengirimkan payload JSON berisi data user aktif ke URL di atas.
                 </div>
                 <button 
                   onClick={handleWebhookTest}
                   disabled={isWebhookTesting || !webhookUrl}
                   className="w-full py-5 bg-emerald-500 text-white font-black uppercase text-[11px] tracking-widest rounded-3xl shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                    {isWebhookTesting ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
                    {isWebhookTesting ? 'Sending Payload...' : 'Test Trigger Webhook'}
                 </button>
              </div>
           </div>

           {/* Manual Export Section */}
           <div className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm flex items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                 <div className="p-4 bg-blue-50 text-blue-500 rounded-3xl"><FileSpreadsheet size={24}/></div>
                 <div>
                    <h3 className="text-lg font-black text-gray-900">Manual Data Export</h3>
                    <p className="text-xs text-gray-400 font-medium mt-1">Download seluruh database user sebagai file .CSV.</p>
                 </div>
              </div>
              <button 
                onClick={handleCsvExport}
                className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all"
              >
                 <Download size={16} /> Download CSV
              </button>
           </div>
        </section>
      )}
    </div>
  );
};

export default DevPortal;
