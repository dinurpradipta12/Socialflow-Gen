
import React, { useState, useEffect, useCallback } from 'react';
import { ThemeColor, Workspace, User, Message, PostInsight, RegistrationRequest } from './types';
import { MOCK_WORKSPACES, MOCK_USERS, DEV_CREDENTIALS } from './constants';
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
import { cloudService } from './services/cloudService';
import { Loader2, Database, Cloud, Globe, Menu, ShieldCheck, Wifi, WifiOff, ArrowRight } from 'lucide-react';

const cloudSyncChannel = new BroadcastChannel('sf_cloud_sync');

const App: React.FC = () => {
  // 1. STATE MANAGEMENT & PERSISTENCE
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sf_users_db');
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sf_session_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [authState, setAuthState] = useState<'login' | 'register' | 'authenticated'>(user ? 'authenticated' : 'login');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCloudOnline, setIsCloudOnline] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regData, setRegData] = useState({ name: '', email: '', password: '', handle: '', niche: '', reason: '' });
  
  const [primaryColorHex, setPrimaryColorHex] = useState('#BFDBFE');
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>([]);
  const [analyticsData, setAnalyticsData] = useState<PostInsight[]>(() => {
    const saved = localStorage.getItem('sf_analytics_db');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync users to localStorage whenever allUsers changes
  useEffect(() => {
    localStorage.setItem('sf_users_db', JSON.stringify(allUsers));
  }, [allUsers]);

  // 2. CLOUD SYNC ENGINE
  const fetchCloudData = useCallback(async () => {
    const data = await cloudService.pullRegistrations();
    setRegistrations(data);
  }, []);

  useEffect(() => {
    fetchCloudData();
    const handleSync = () => fetchCloudData();
    cloudSyncChannel.onmessage = handleSync;
    const interval = setInterval(fetchCloudData, 5000); // More frequent polling
    return () => {
      cloudSyncChannel.onmessage = null;
      clearInterval(interval);
    };
  }, [fetchCloudData]);

  // 3. LOGIKA ADMIN: APPROVE & AUTO-CREATE USER
  const handleRegistrationAction = async (regId: string, status: 'approved' | 'rejected') => {
    setLoading(true);
    await cloudService.updateRegistrationStatus(regId, status);
    
    if (status === 'approved') {
      const reg = registrations.find(r => r.id === regId);
      if (reg) {
        // Cek apakah user sudah ada
        if (allUsers.some(u => u.email === reg.email)) {
          alert("Email ini sudah memiliki akun aktif.");
        } else {
          const newUser: User = {
            id: `U-${Date.now()}`,
            name: reg.name,
            email: reg.email,
            role: 'viewer',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${reg.name}`,
            permissions: { dashboard: true, calendar: true, ads: false, analytics: false, tracker: false, team: false, settings: false, contentPlan: true },
            isSubscribed: true,
            subscriptionExpiry: '2025-12-31',
            jobdesk: reg.niche || 'Member',
            kpi: [],
            activityLogs: [],
            performanceScore: 0,
            // Simpan password untuk simulasi login (di real app ini di-hash di server)
            socialMedia: reg.handle
          };
          setAllUsers(prev => [...prev, newUser]);
          alert(`Akun untuk ${reg.name} berhasil dibuat secara otomatis!`);
        }
      }
    }
    
    await fetchCloudData();
    setLoading(false);
  };

  // 4. AUTH HANDLERS
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const loggedInUser = allUsers.find(u => u.email === email);
      
      // Logic: Admin Dev tetap pakai credentials dev, user lain cukup email (simulasi)
      const isDevLogin = email === DEV_CREDENTIALS.email && password === DEV_CREDENTIALS.password;
      
      if (loggedInUser && (isDevLogin || email !== DEV_CREDENTIALS.email)) {
        setUser(loggedInUser);
        localStorage.setItem('sf_session_user', JSON.stringify(loggedInUser));
        setAuthState('authenticated');
      } else {
        alert('Akses ditolak. Email tidak terdaftar atau password dev salah.');
      }
      setLoading(false);
    }, 800);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const newReg: RegistrationRequest = {
      id: `REG-${Date.now()}`,
      ...regData,
      timestamp: new Date().toLocaleString('id-ID'),
      status: 'pending',
      nodeId: navigator.userAgent.substring(0, 15)
    };
    
    const success = await cloudService.pushRegistration(newReg);
    if (success) {
      alert(`Berhasil! Data Anda sudah masuk ke pusat data. Tunggu Admin menyetujui akun Anda.`);
      setAuthState('login');
      setRegData({ name: '', email: '', password: '', handle: '', niche: '', reason: '' });
    }
    setLoading(false);
  };

  const saveAnalytics = (insight: PostInsight | PostInsight[]) => {
    const updated = Array.isArray(insight) ? [...insight, ...analyticsData] : [insight, ...analyticsData];
    setAnalyticsData(updated);
    localStorage.setItem('sf_analytics_db', JSON.stringify(updated));
  };

  const isDev = user?.role === 'developer';
  const activeWorkspace = MOCK_WORKSPACES[0];

  if (authState === 'login' || authState === 'register') {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 font-sans">
        <div className="max-w-[440px] w-full bg-white rounded-[3rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] p-10 md:p-14 space-y-10 border border-gray-100 animate-slide">
          <div className="text-center space-y-4">
             <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white text-2xl font-black bg-blue-500 shadow-xl shadow-blue-200">SF</div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tighter">
                {authState === 'login' ? 'Socialflow' : 'Join Network'}
             </h1>
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                <ShieldCheck size={12} className="text-blue-500"/> Cloud Infrastructure V3.3.0
             </p>
          </div>

          {authState === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all text-sm" placeholder="user@snaillabs.id" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Security Code</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all text-sm" placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-6 bg-blue-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-2xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <>Masuk Dashboard <ArrowRight size={16}/></>}
              </button>
              <p className="text-center text-[10px] text-gray-400 font-medium">Belum punya akses? <button type="button" onClick={() => setAuthState('register')} className="text-blue-500 font-black uppercase tracking-widest ml-1">Daftar Akun</button></p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <input type="text" required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 text-sm" placeholder="Nama" />
                  <input type="email" required value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 text-sm" placeholder="Email" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <input type="password" required value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 text-sm" placeholder="Password" />
                  <input type="text" required value={regData.handle} onChange={e => setRegData({...regData, handle: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 text-sm" placeholder="@social" />
               </div>
               <input type="text" required value={regData.niche} onChange={e => setRegData({...regData, niche: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 text-sm" placeholder="Niche (e.g. Food, Tech)" />
               <textarea required value={regData.reason} onChange={e => setRegData({...regData, reason: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 text-sm" placeholder="Kenapa ingin bergabung?" rows={2} />
               <button type="submit" disabled={loading} className="w-full py-6 bg-emerald-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-2xl shadow-emerald-500/20 active:scale-95 transition-all">
                {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Kirim Pendaftaran"}
              </button>
              <button type="button" onClick={() => setAuthState('login')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-emerald-500 transition-colors">Batal & Kembali ke Login</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans overflow-x-hidden relative">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(t) => { setActiveTab(t); setIsSidebarOpen(false); }} 
        primaryColorHex={primaryColorHex} 
        onLogout={() => { setUser(null); localStorage.removeItem('sf_session_user'); setAuthState('login'); }} 
        user={user!} 
        isOpen={isSidebarOpen}
      />
      
      <main className={`flex-1 transition-all duration-300 min-h-screen md:ml-72 p-6 md:p-12 relative`}>
        <div className="flex items-center justify-between mb-8 md:hidden">
           <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm"><Menu size={24} /></button>
           <h2 className="text-sm font-black text-gray-900 tracking-tighter">CLOUD CENTER</h2>
        </div>

        <div className="hidden md:flex absolute top-10 right-12 items-center gap-4 z-50">
           <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-xl flex items-center gap-3">
              <div className="flex flex-col items-end">
                 <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest">Systems Active</p>
                 <p className={`text-[10px] font-black uppercase flex items-center gap-1.5 ${isCloudOnline ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isCloudOnline ? <Wifi size={10}/> : <WifiOff size={10}/>}
                    Cloud Sync Active
                 </p>
              </div>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isCloudOnline ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}><Cloud size={16}/></div>
           </div>
        </div>

        <header className="mb-10 md:mb-12">
           <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-2">{activeWorkspace?.name}</h2>
           <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter capitalize">{activeTab.replace(/([A-Z])/g, ' $1')}</h1>
        </header>

        <div className="max-w-6xl mx-auto w-full">
           {activeTab === 'dashboard' && <Dashboard primaryColor={activeWorkspace.color} />}
           {activeTab === 'contentPlan' && <ContentPlan primaryColorHex={primaryColorHex} onSaveInsight={saveAnalytics} users={allUsers} />}
           {activeTab === 'calendar' && <Calendar primaryColor={activeWorkspace.color} />}
           {activeTab === 'ads' && <AdsWorkspace primaryColor={activeWorkspace.color} />}
           {activeTab === 'analytics' && <Analytics primaryColorHex={primaryColorHex} analyticsData={analyticsData} onSaveInsight={saveAnalytics} />}
           {activeTab === 'tracker' && <LinkTracker primaryColorHex={primaryColorHex} onSaveManualInsight={saveAnalytics} />}
           {activeTab === 'team' && <Team primaryColor={activeWorkspace.color} currentUser={user!} workspace={activeWorkspace} onUpdateWorkspace={()=>{}} addSystemNotification={()=>{}} allUsers={allUsers} setUsers={setAllUsers} setWorkspace={()=>{}} />}
           {activeTab === 'settings' && <Settings primaryColorHex={primaryColorHex} setPrimaryColorHex={setPrimaryColorHex} accentColorHex="#DDD6FE" setAccentColorHex={()=>{}} fontSize="medium" setFontSize={()=>{}} customLogo={null} setCustomLogo={()=>{}} />}
           {activeTab === 'profile' && <Profile user={user!} primaryColor={activeWorkspace.color} setUser={setUser} />}
           {activeTab === 'devPortal' && isDev && <DevPortal primaryColorHex={primaryColorHex} registrations={registrations} onRegistrationAction={handleRegistrationAction} users={allUsers} setUsers={setAllUsers} setRegistrations={setRegistrations} dbSourceUrl="Socialflow Core" setDbSourceUrl={()=>{}} onManualSync={fetchCloudData} />}
        </div>
      </main>
      
      <ChatPopup primaryColor={activeWorkspace?.color || 'blue'} currentUser={user!} messages={[]} onSendMessage={()=>{}} isOpen={false} setIsOpen={()=>{}} unreadCount={0} />
    </div>
  );
};

export default App;
