
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
import { Loader2, Database, Cloud, Globe, Menu, ShieldCheck, Wifi, WifiOff, ArrowRight, Lock, AlertCircle, Phone } from 'lucide-react';

const cloudSyncChannel = new BroadcastChannel('sf_cloud_sync');

const App: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sf_users_db');
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sf_session_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [authState, setAuthState] = useState<'login' | 'register' | 'authenticated' | 'expired'>(user ? 'authenticated' : 'login');
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

  // --- SUBSCRIPTION GUARD ENGINE ---
  useEffect(() => {
    if (user && authState === 'authenticated') {
      const today = new Date();
      if (user.subscriptionExpiry) {
        const expiryDate = new Date(user.subscriptionExpiry);
        if (today > expiryDate && user.role !== 'developer') {
          setAuthState('expired');
        }
      }
      
      // Developer role auto-redirect
      if (user.role === 'developer' && activeTab !== 'devPortal') {
        setActiveTab('devPortal');
      }
    }
  }, [user, authState, activeTab]);

  useEffect(() => {
    localStorage.setItem('sf_users_db', JSON.stringify(allUsers));
  }, [allUsers]);

  const fetchCloudData = useCallback(async () => {
    const data = await cloudService.pullRegistrations();
    setRegistrations(data);
  }, []);

  useEffect(() => {
    fetchCloudData();
    const handleSync = () => fetchCloudData();
    cloudSyncChannel.onmessage = handleSync;
    const interval = setInterval(fetchCloudData, 5000);
    return () => {
      cloudSyncChannel.onmessage = null;
      clearInterval(interval);
    };
  }, [fetchCloudData]);

  const handleRegistrationAction = async (regId: string, status: 'approved' | 'rejected') => {
    setLoading(true);
    // Fixed: Renamed updateRegistrationAction to updateRegistrationStatus as it was defined in services/cloudService.ts
    await cloudService.updateRegistrationStatus(regId, status);
    
    if (status === 'approved') {
      const reg = registrations.find(r => r.id === regId);
      if (reg) {
        if (!allUsers.some(u => u.email === reg.email)) {
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
            socialMedia: reg.handle
          };
          setAllUsers(prev => [...prev, newUser]);
          alert(`Akun ${reg.name} berhasil dibuat!`);
        }
      }
    }
    await fetchCloudData();
    setLoading(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const loggedInUser = allUsers.find(u => u.email === email);
      const isDevLogin = email === DEV_CREDENTIALS.email && password === DEV_CREDENTIALS.password;
      
      if (loggedInUser && (isDevLogin || email !== DEV_CREDENTIALS.email)) {
        setUser(loggedInUser);
        localStorage.setItem('sf_session_user', JSON.stringify(loggedInUser));
        
        // Cek expiry saat login
        const today = new Date();
        if (loggedInUser.subscriptionExpiry && today > new Date(loggedInUser.subscriptionExpiry) && loggedInUser.role !== 'developer') {
          setAuthState('expired');
        } else {
          setAuthState('authenticated');
        }
      } else {
        alert('Email atau Security Code tidak valid.');
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
      alert(`Pendaftaran berhasil! Tunggu Admin mengaktifkan akun Anda.`);
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

  // --- EXPIRED PAGE UI ---
  if (authState === 'expired') {
     return (
        <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-sans">
           <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 text-center space-y-8 border border-rose-50 animate-slide">
              <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl shadow-rose-100 animate-pulse">
                 <Lock size={48} />
              </div>
              <div className="space-y-4">
                 <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Access Expired</h1>
                 <p className="text-gray-400 font-medium leading-relaxed">Masa aktif akun Anda telah berakhir pada <span className="text-rose-500 font-bold">{user?.subscriptionExpiry}</span>. Silakan hubungi admin untuk aktivasi ulang.</p>
              </div>
              <div className="pt-4 space-y-3">
                 <a href={`https://wa.me/628123456789?text=Halo%20Admin,%20saya%20ingin%20aktivasi%20ulang%20Socialflow%20untuk%20email%20${user?.email}`} className="flex items-center justify-center gap-3 w-full py-5 bg-emerald-500 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">
                    <Phone size={18}/> Hubungi Admin WA
                 </a>
                 <button onClick={() => { setUser(null); localStorage.removeItem('sf_session_user'); setAuthState('login'); }} className="w-full text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-gray-900">Sign Out & Change Account</button>
              </div>
           </div>
        </div>
     );
  }

  if (authState === 'login' || authState === 'register') {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 font-sans">
        <div className="max-w-[440px] w-full bg-white rounded-[3rem] shadow-2xl p-10 md:p-14 space-y-10 border border-gray-100 animate-slide">
          <div className="text-center space-y-4">
             <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white text-2xl font-black bg-blue-500 shadow-xl shadow-blue-200">SF</div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tighter">
                {authState === 'login' ? 'Socialflow' : 'Join Network'}
             </h1>
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                <ShieldCheck size={12} className="text-blue-500"/> System Core V3.4.0
             </p>
          </div>

          {authState === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all text-sm" placeholder="Email Address" />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all text-sm" placeholder="Security Code" />
              <button type="submit" disabled={loading} className="w-full py-6 bg-blue-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-2xl shadow-blue-500/20 active:scale-95 transition-all">
                {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Access System"}
              </button>
              <p className="text-center text-[10px] text-gray-400 font-medium uppercase tracking-widest">No access? <button type="button" onClick={() => setAuthState('register')} className="text-blue-500 font-black">Register Here</button></p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <input type="text" required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 text-sm" placeholder="Name" />
                  <input type="email" required value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 text-sm" placeholder="Email" />
               </div>
               <input type="password" required value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 text-sm" placeholder="Create Security Code" />
               <button type="submit" disabled={loading} className="w-full py-6 bg-emerald-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-2xl shadow-emerald-500/20">
                {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Submit Application"}
              </button>
              <button type="button" onClick={() => setAuthState('login')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest">Back to Login</button>
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
        setActiveTab={(t) => setActiveTab(t)} 
        primaryColorHex={primaryColorHex} 
        onLogout={() => { setUser(null); localStorage.removeItem('sf_session_user'); setAuthState('login'); }} 
        user={user!} 
        isOpen={isSidebarOpen}
      />
      
      <main className={`flex-1 transition-all duration-300 min-h-screen md:ml-72 p-6 md:p-12 relative`}>
        <div className="flex items-center justify-between mb-8 md:hidden">
           <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm"><Menu size={24} /></button>
           <h2 className="text-sm font-black text-gray-900 tracking-tighter uppercase">{isDev ? 'Developer Mode' : 'Socialflow Hub'}</h2>
        </div>

        <div className="max-w-6xl mx-auto w-full">
           {activeTab === 'dashboard' && !isDev && <Dashboard primaryColor={activeWorkspace.color} />}
           {activeTab === 'contentPlan' && !isDev && <ContentPlan primaryColorHex={primaryColorHex} onSaveInsight={saveAnalytics} users={allUsers} />}
           {activeTab === 'calendar' && !isDev && <Calendar primaryColor={activeWorkspace.color} />}
           {activeTab === 'ads' && !isDev && <AdsWorkspace primaryColor={activeWorkspace.color} />}
           {activeTab === 'analytics' && !isDev && <Analytics primaryColorHex={primaryColorHex} analyticsData={analyticsData} onSaveInsight={saveAnalytics} />}
           {activeTab === 'tracker' && !isDev && <LinkTracker primaryColorHex={primaryColorHex} onSaveManualInsight={saveAnalytics} />}
           {activeTab === 'team' && !isDev && <Team primaryColor={activeWorkspace.color} currentUser={user!} workspace={activeWorkspace} onUpdateWorkspace={()=>{}} addSystemNotification={()=>{}} allUsers={allUsers} setUsers={setAllUsers} setWorkspace={()=>{}} />}
           {activeTab === 'settings' && !isDev && <Settings primaryColorHex={primaryColorHex} setPrimaryColorHex={setPrimaryColorHex} accentColorHex="#DDD6FE" setAccentColorHex={()=>{}} fontSize="medium" setFontSize={()=>{}} customLogo={null} setCustomLogo={()=>{}} />}
           {activeTab === 'profile' && !isDev && <Profile user={user!} primaryColor={activeWorkspace.color} setUser={setUser} />}
           
           {activeTab === 'devPortal' && isDev && (
             <DevPortal 
               primaryColorHex={primaryColorHex} 
               registrations={registrations} 
               onRegistrationAction={handleRegistrationAction} 
               users={allUsers} 
               setUsers={setAllUsers} 
               setRegistrations={setRegistrations} 
               dbSourceUrl="Local Storage Registry" 
               setDbSourceUrl={()=>{}} 
               onManualSync={fetchCloudData} 
             />
           )}
        </div>
      </main>
    </div>
  );
};

export default App;
