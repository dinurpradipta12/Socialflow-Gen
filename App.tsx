
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ThemeColor, Workspace, User, Message, PostInsight, RegistrationRequest } from './types';
import { MOCK_WORKSPACES, MOCK_USERS, DEV_CREDENTIALS, MOCK_REGISTRATIONS, APP_VERSION } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Calendar from './components/Calendar';
import LinkTracker from './components/LinkTracker';
import Settings from './components/Settings';
import Team from './components/Team';
import ContentPlan from './components/ContentPlan';
import Profile from './components/Profile';
import DevPortal from './components/DevPortal';
import AdsWorkspace from './components/AdsWorkspace';
import Analytics from './components/Analytics';
import ChatPopup from './components/ChatPopup';
import TopNotification from './components/TopNotification';
import { Loader2, Sparkles, DownloadCloud, Database, Cloud, Globe, Menu, X, ShieldCheck, Bell } from 'lucide-react';

const cloudSyncChannel = new BroadcastChannel('socialflow_cloud_sync');

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sf_session_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [authState, setAuthState] = useState<'login' | 'register' | 'authenticated'>(user ? 'authenticated' : 'login');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPassword, setShowPassword] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regData, setRegData] = useState({ name: '', email: '', password: '', handle: '', niche: '', reason: '' });
  
  const [primaryColorHex, setPrimaryColorHex] = useState('#BFDBFE');
  const [analyticsData, setAnalyticsData] = useState<PostInsight[]>(() => {
    const saved = localStorage.getItem('sf_analytics_db');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sf_users_db');
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });
  
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>(() => {
    const saved = localStorage.getItem('sf_registrations_db');
    return saved ? JSON.parse(saved) : MOCK_REGISTRATIONS;
  });

  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(() => {
    const saved = localStorage.getItem('sf_active_workspace');
    return saved ? JSON.parse(saved) : MOCK_WORKSPACES[0];
  });

  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const isDev = user?.role === 'developer';

  // Sinkronisasi Reaktif: Memastikan data pendaftaran selalu terbaru dari localStorage
  useEffect(() => {
    const syncFromStorage = () => {
      const savedRegs = localStorage.getItem('sf_registrations_db');
      if (savedRegs) setRegistrations(JSON.parse(savedRegs));
      
      const savedAnalytics = localStorage.getItem('sf_analytics_db');
      if (savedAnalytics) setAnalyticsData(JSON.parse(savedAnalytics));
    };

    // Listen to changes from other windows/tabs
    window.addEventListener('storage', syncFromStorage);
    
    // Listen to Cloud Sync Channel
    const handleSync = (event: MessageEvent) => {
      const { type, payload } = event.data;
      if (type === 'REGISTRATION_UPDATE') setRegistrations(payload);
      if (type === 'ANALYTICS_UPDATE') setAnalyticsData(payload);
    };
    cloudSyncChannel.addEventListener('message', handleSync);

    return () => {
      window.removeEventListener('storage', syncFromStorage);
      cloudSyncChannel.removeEventListener('message', handleSync);
    };
  }, []);

  const handleUpdateApp = () => {
    setLoading(true);
    localStorage.setItem('sf_update_target', '3.1.0');
    setTimeout(() => window.location.reload(), 1500);
  };

  const handleRegistrationAction = (regId: string, status: 'approved' | 'rejected') => {
    const currentRegs = JSON.parse(localStorage.getItem('sf_registrations_db') || '[]');
    const updated = currentRegs.map((r: any) => r.id === regId ? { ...r, status } : r);
    setRegistrations(updated);
    localStorage.setItem('sf_registrations_db', JSON.stringify(updated));
    cloudSyncChannel.postMessage({ type: 'REGISTRATION_UPDATE', payload: updated });

    if (status === 'approved') {
      const reg = updated.find((r: any) => r.id === regId);
      if (reg) {
        const newUser: User = {
          id: `U-${Date.now()}`, name: reg.name, email: reg.email, role: 'viewer',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${reg.name}`,
          permissions: { dashboard: true, calendar: true, ads: false, analytics: false, tracker: false, team: false, settings: false, contentPlan: false },
          isSubscribed: true, subscriptionExpiry: '2025-12-31', jobdesk: 'New Member', kpi: [], activityLogs: [], performanceScore: 0
        };
        const updatedUsers = [...allUsers, newUser];
        setAllUsers(updatedUsers);
        localStorage.setItem('sf_users_db', JSON.stringify(updatedUsers));
      }
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      let loggedInUser: User | undefined;
      if (email === DEV_CREDENTIALS.email && password === DEV_CREDENTIALS.password) {
        loggedInUser = allUsers.find(u => u.role === 'developer');
      } else {
        loggedInUser = allUsers.find(u => u.email === email);
      }
      
      if (loggedInUser) {
        setUser(loggedInUser);
        localStorage.setItem('sf_session_user', JSON.stringify(loggedInUser));
        setAuthState('authenticated');
      } else {
        alert('Email atau Password salah.');
      }
      setLoading(false);
    }, 600);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Ambil data terbaru dari storage dulu agar tidak menimpa data device lain
    const currentRegs = JSON.parse(localStorage.getItem('sf_registrations_db') || '[]');
    
    const newReg: RegistrationRequest = {
      id: `REG-${Date.now()}`,
      ...regData,
      timestamp: new Date().toLocaleString('id-ID'),
      status: 'pending'
    };
    
    const updated = [newReg, ...currentRegs];
    setRegistrations(updated);
    localStorage.setItem('sf_registrations_db', JSON.stringify(updated));
    
    // Broadcast agar tab dev portal yang terbuka langsung update
    cloudSyncChannel.postMessage({ type: 'REGISTRATION_UPDATE', payload: updated });

    setTimeout(() => {
      setLoading(false);
      alert(`Pendaftaran Berhasil! Admin akan memverifikasi akun Anda.`);
      setAuthState('login');
    }, 1000);
  };

  const saveAnalytics = (insight: PostInsight | PostInsight[]) => {
    const current = JSON.parse(localStorage.getItem('sf_analytics_db') || '[]');
    const updated = Array.isArray(insight) ? [...insight, ...current] : [insight, ...current];
    setAnalyticsData(updated);
    localStorage.setItem('sf_analytics_db', JSON.stringify(updated));
    cloudSyncChannel.postMessage({ type: 'ANALYTICS_UPDATE', payload: updated });
  };

  const renderContent = () => {
    if (!user || !activeWorkspace) return null;
    switch (activeTab) {
      case 'dashboard': return <Dashboard primaryColor={activeWorkspace.color} />;
      case 'contentPlan': return <ContentPlan primaryColorHex={primaryColorHex} onSaveInsight={saveAnalytics} users={allUsers} />;
      case 'calendar': return <Calendar primaryColor={activeWorkspace.color} />;
      case 'ads': return <AdsWorkspace primaryColor={activeWorkspace.color} />;
      case 'analytics': return <Analytics primaryColorHex={primaryColorHex} analyticsData={analyticsData} onSaveInsight={saveAnalytics} />;
      case 'tracker': return <LinkTracker primaryColorHex={primaryColorHex} onSaveManualInsight={saveAnalytics} />;
      case 'team': return <Team primaryColor={activeWorkspace.color} currentUser={user} workspace={activeWorkspace} onUpdateWorkspace={(name, color) => setActiveWorkspace({ ...activeWorkspace, name, color })} addSystemNotification={() => {}} allUsers={allUsers} setUsers={setAllUsers} setWorkspace={setActiveWorkspace} />;
      case 'settings': return <Settings primaryColorHex={primaryColorHex} setPrimaryColorHex={setPrimaryColorHex} accentColorHex="#DDD6FE" setAccentColorHex={()=>{}} fontSize="medium" setFontSize={()=>{}} customLogo={null} setCustomLogo={()=>{}} />;
      case 'profile': return <Profile user={user} primaryColor={activeWorkspace.color} setUser={setUser} />;
      case 'devPortal': return isDev ? <DevPortal primaryColorHex={primaryColorHex} registrations={registrations} onRegistrationAction={handleRegistrationAction} users={allUsers} setUsers={setAllUsers} setRegistrations={setRegistrations} dbSourceUrl="Socialflow Cloud Active" setDbSourceUrl={()=>{}} onManualSync={()=>{}} /> : null;
      default: return <Dashboard primaryColor={activeWorkspace.color} />;
    }
  };

  if (authState === 'login' || authState === 'register') {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 font-sans">
        <div className="max-w-[480px] w-full bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] p-8 md:p-12 space-y-8 md:space-y-10 border border-gray-100 animate-slide">
          <div className="text-center space-y-4">
             <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl md:rounded-3xl mx-auto flex items-center justify-center text-white text-xl md:text-2xl font-black shadow-xl ${authState === 'login' ? 'bg-blue-500 shadow-blue-200' : 'bg-emerald-500 shadow-emerald-200'}`}>SF</div>
             <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter">{authState === 'login' ? 'Socialflow Login' : 'Buat Akun Baru'}</h1>
             <p className="text-[9px] md:text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                <ShieldCheck size={12} className="text-blue-400"/> Snaillabs Cloud Encryption
             </p>
          </div>

          {authState === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4">Account Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-6 py-4 md:px-7 md:py-5 bg-gray-50 border border-gray-100 rounded-2xl md:rounded-[2rem] outline-none font-bold text-gray-700 focus:ring-4 focus:ring-blue-50 transition-all text-sm" placeholder="name@example.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest ml-4">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-6 py-4 md:px-7 md:py-5 bg-gray-50 border border-gray-100 rounded-2xl md:rounded-[2rem] outline-none font-bold text-gray-700 focus:ring-4 focus:ring-blue-50 transition-all text-sm" placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full py-5 md:py-6 bg-blue-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl md:rounded-[2rem] shadow-2xl shadow-blue-500/30 hover:bg-blue-600 transition-all active:scale-95">
                {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Masuk Dashboard"}
              </button>
              <div className="text-center">
                 <button type="button" onClick={() => setAuthState('register')} className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-500 transition-colors">Daftar Akun Baru</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 text-sm" placeholder="Nama Lengkap" />
                  <input type="email" required value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 text-sm" placeholder="Email" />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="password" required value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 text-sm" placeholder="Password" />
                  <input type="text" required value={regData.handle} onChange={e => setRegData({...regData, handle: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 text-sm" placeholder="@socialhandle" />
               </div>
               <input type="text" required value={regData.niche} onChange={e => setRegData({...regData, niche: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 text-sm" placeholder="Bidang Konten (Tech, Fashion, dll)" />
               <textarea required value={regData.reason} onChange={e => setRegData({...regData, reason: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 text-sm" placeholder="Alasan menggunakan Socialflow..." rows={2} />
               <button type="submit" disabled={loading} className="w-full py-5 md:py-6 bg-emerald-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl md:rounded-[2rem] shadow-2xl shadow-emerald-500/30 hover:bg-emerald-600 transition-all active:scale-95">
                {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Kirim Pendaftaran Cloud"}
              </button>
              <button type="button" onClick={() => setAuthState('login')} className="w-full text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-emerald-500">Kembali ke Login</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans relative overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(t) => { setActiveTab(t); setIsSidebarOpen(false); }} 
        primaryColorHex={primaryColorHex} 
        onLogout={() => { setUser(null); setAuthState('login'); }} 
        user={user!} 
        isOpen={isSidebarOpen}
      />
      
      <main className={`flex-1 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'blur-sm md:blur-none' : ''} md:ml-72 p-6 md:p-12 relative`}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-8 md:hidden">
           <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-900">
              <Menu size={24} />
           </button>
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white font-black">SF</div>
              <h2 className="text-xs font-black text-gray-900 tracking-tight">Socialflow</h2>
           </div>
           <button className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-400">
              <Bell size={20} />
           </button>
        </div>

        {/* Cloud Status (Hidden on small mobile) */}
        <div className="hidden sm:flex absolute top-10 right-12 items-center gap-4 z-50">
           <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-xl flex items-center gap-3">
              <div className="flex flex-col items-end">
                 <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Cloud Engine V{APP_VERSION}</p>
                 <p className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1.5"><Globe size={10}/> Instant Cloud Sync</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center"><Cloud size={16}/></div>
           </div>
        </div>

        <header className="mb-10 md:mb-12">
           <h2 className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2">{activeWorkspace?.name} Workspace</h2>
           <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter capitalize">{activeTab.replace(/([A-Z])/g, ' $1')}</h1>
        </header>

        <div className="max-w-6xl mx-auto">{renderContent()}</div>
      </main>

      <ChatPopup primaryColor={activeWorkspace?.color || 'blue'} currentUser={user!} messages={[]} onSendMessage={()=>{}} isOpen={false} setIsOpen={()=>{}} unreadCount={0} />
    </div>
  );
};

export default App;
