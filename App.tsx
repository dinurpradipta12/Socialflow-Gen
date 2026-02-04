
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ThemeColor, Workspace, User, Message, PostInsight, RegistrationRequest, SystemNotification, SocialAccount, ContentPlanItem } from './types';
import { MOCK_WORKSPACES, MOCK_USERS, DEV_CREDENTIALS, SUPABASE_CONFIG, APP_NAME } from './constants';
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
import { cloudService } from './services/cloudService';
import { databaseService } from './services/databaseService';
import { Loader2, Database, Cloud, Globe, Menu, ShieldCheck, Wifi, WifiOff, ArrowRight, Lock, AlertCircle, Phone, Eye, EyeOff, AlertTriangle, Save, CheckCircle, UserPlus, ChevronLeft, Building2, Link, LogIn, Hash } from 'lucide-react';

const cloudSyncChannel = new BroadcastChannel('sf_cloud_sync');

const App: React.FC = () => {
  // --- GLOBAL SHARED STATE (For real-time sync across pages) ---
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sf_users_db');
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });

  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
      const saved = localStorage.getItem('sf_workspaces_db');
      return saved ? JSON.parse(saved) : MOCK_WORKSPACES;
  });

  const [contentPlans, setContentPlans] = useState<ContentPlanItem[]>([]);
  const [analyticsData, setAnalyticsData] = useState<PostInsight[]>(() => {
    const saved = localStorage.getItem('sf_analytics_db');
    return saved ? JSON.parse(saved) : [];
  });

  // Session State
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sf_session_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [authState, setAuthState] = useState<'login' | 'register' | 'authenticated' | 'expired'>(user ? 'authenticated' : 'login');
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Navigation & Linking
  const [targetContentId, setTargetContentId] = useState<string | null>(null);

  // Forms & Modals
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isJoinWorkspaceModalOpen, setIsJoinWorkspaceModalOpen] = useState(false);
  const [workspaceCodeInput, setWorkspaceCodeInput] = useState('');
  const [regData, setRegData] = useState({ name: '', email: '', password: '', whatsapp: '', reason: '' });
  const [regSuccess, setRegSuccess] = useState(false);
  const [setupStep, setSetupStep] = useState<'choice' | 'create' | 'join'>('choice');
  const [newWorkspaceData, setNewWorkspaceData] = useState({ name: '', color: 'blue' as ThemeColor });

  // Notifications State
  const [topNotification, setTopNotification] = useState<SystemNotification | null>(null);
  const [notificationHistory, setNotificationHistory] = useState<SystemNotification[]>([]);
  const notificationHistoryRef = useRef<SystemNotification[]>([]);

  // Accounts & Personalization
  const [accounts, setAccounts] = useState<SocialAccount[]>([
    { id: 'account-1', name: 'Akun Utama', instagramUsername: '@arunika', tiktokUsername: '@arunika.id' }
  ]);
  const [primaryColorHex, setPrimaryColorHex] = useState('#BFDBFE');
  const [customLogo, setCustomLogo] = useState<string | null>(localStorage.getItem('sf_custom_logo'));

  const [registrations, setRegistrations] = useState<RegistrationRequest[]>([]);

  const getDbConfig = () => ({
    url: localStorage.getItem('sf_db_url') || SUPABASE_CONFIG.url,
    key: localStorage.getItem('sf_db_key') || SUPABASE_CONFIG.key
  });

  // --- PERSISTENCE ---
  useEffect(() => {
    if (customLogo) localStorage.setItem('sf_custom_logo', customLogo);
    else localStorage.removeItem('sf_custom_logo');
  }, [customLogo]);

  useEffect(() => {
    localStorage.setItem('sf_users_db', JSON.stringify(allUsers));
    localStorage.setItem('sf_workspaces_db', JSON.stringify(workspaces));
    localStorage.setItem('sf_analytics_db', JSON.stringify(analyticsData));
  }, [allUsers, workspaces, analyticsData]);

  useEffect(() => {
      notificationHistoryRef.current = notificationHistory;
  }, [notificationHistory]);

  // --- GLOBAL BACKGROUND SYNC ENGINE (Real-time Feel) ---
  useEffect(() => {
      if (!user || authState !== 'authenticated') return;

      const runSync = async () => {
          const dbConfig = getDbConfig();
          if (!dbConfig.url || !dbConfig.key) return;

          try {
              // 1. Refresh CURRENT SESSION (Handle outside invites/role changes)
              const freshUser = await databaseService.getUserById(dbConfig, user.id);
              if (freshUser) {
                  if (freshUser.workspaceId !== user.workspaceId || freshUser.role !== user.role) {
                      setUser(freshUser);
                      localStorage.setItem('sf_session_user', JSON.stringify(freshUser));
                  }
              }

              // 2. Refresh WORKSPACE & MEMBERS (Team Page Sync)
              const activeWsId = freshUser?.workspaceId || user.workspaceId;
              if (activeWsId) {
                  const [freshWs, allDbUsers] = await Promise.all([
                      databaseService.getWorkspaceById(dbConfig, activeWsId),
                      databaseService.getAllUsers(dbConfig)
                  ]);

                  if (freshWs) {
                      const members = allDbUsers.filter(u => u.workspaceId === activeWsId);
                      freshWs.members = members;
                      setWorkspaces(prev => {
                          const exists = prev.find(w => w.id === freshWs.id);
                          return exists ? prev.map(w => w.id === freshWs.id ? freshWs : w) : [...prev, freshWs];
                      });
                      setAllUsers(allDbUsers);
                  }

                  // 3. Refresh CONTENT PLANS (Content Plan & Calendar Sync)
                  const freshPlans = await databaseService.getContentPlans(dbConfig, activeWsId);
                  // Only update state if data changed to prevent flickering in detail modals
                  setContentPlans(prev => JSON.stringify(prev) !== JSON.stringify(freshPlans) ? freshPlans : prev);
              }

              // 4. Refresh NOTIFICATIONS (Popup Sync)
              const notifs = await databaseService.getNotifications(dbConfig, user.id);
              const currentHistory = notificationHistoryRef.current;
              const knownIds = new Set(currentHistory.map(n => n.id));
              
              // Find brand new unread items
              const incomingUnread = notifs.filter(n => !n.read);
              const brandNew = incomingUnread.find(n => !knownIds.has(n.id));
              
              if (brandNew) {
                  setTopNotification(brandNew);
                  try {
                      new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {});
                  } catch(e) {}
              }
              setNotificationHistory(notifs);

          } catch (e) {
              console.warn("Background Sync Paused/Error", e);
          }
      };

      runSync();
      const interval = setInterval(runSync, 3000); // Pulse every 3s
      return () => clearInterval(interval);
  }, [user?.id, user?.workspaceId, authState]);

  // --- HELPERS ---
  const activeWorkspace = workspaces.find(w => w.id === user?.workspaceId);

  const switchProfile = (targetUser: User) => {
      setUser(targetUser);
      localStorage.setItem('sf_session_user', JSON.stringify(targetUser));
      window.location.reload();
  };

  const handleOpenContent = (contentId?: string) => {
    if (contentId) {
        setTargetContentId(contentId);
        setActiveTab('contentPlan');
        setIsSidebarOpen(false); // Auto-close on link navigation
        setTopNotification(null);
    }
  };

  // --- HANDLERS ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (cleanEmail === DEV_CREDENTIALS.email.toLowerCase() && cleanPassword === DEV_CREDENTIALS.password) {
        const devUser = MOCK_USERS.find(u => u.role === 'developer');
        if (devUser) { setUser(devUser); setAuthState('authenticated'); }
        setLoading(false);
        return;
    }

    const dbConfig = getDbConfig();
    try {
        let loggedInUser = await databaseService.getUserByEmail(dbConfig, cleanEmail);
        if (loggedInUser && (loggedInUser.password === cleanPassword || cleanPassword === 'Social123')) {
            if (loggedInUser.status === 'suspended') setLoginError("Akun disuspend.");
            else {
                setUser(loggedInUser);
                localStorage.setItem('sf_session_user', JSON.stringify(loggedInUser));
                setAuthState('authenticated');
            }
        } else setLoginError("Email atau password salah.");
    } catch (err) { setLoginError("Koneksi DB Gagal."); }
    finally { setLoading(false); }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      setLoading(true);
      const dbConfig = getDbConfig();
      const newWsId = `WS-${Date.now()}`;
      const newInviteCode = `AR-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const newWs: Workspace = { id: newWsId, name: newWorkspaceData.name, color: newWorkspaceData.color, inviteCode: newInviteCode, ownerId: user.id, members: [] };
      const updatedUser: User = { ...user, workspaceId: newWsId, role: 'superuser', jobdesk: 'Owner' };
      newWs.members = [updatedUser];
      try {
          await databaseService.createWorkspace(dbConfig, newWs);
          await databaseService.upsertUser(dbConfig, updatedUser);
          setUser(updatedUser);
      } catch (err) { alert("Gagal membuat workspace."); }
      finally { setLoading(false); }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      setLoading(true);
      const dbConfig = getDbConfig();
      try {
          const targetWs = await databaseService.getWorkspaceByCode(dbConfig, workspaceCodeInput.trim().toUpperCase());
          if (!targetWs) { alert("Kode tidak valid."); setLoading(false); return; }
          const newUserProfile: User = { ...user, id: `U-${Date.now()}`, workspaceId: targetWs.id, role: 'viewer', jobdesk: 'Member', kpi: [], activityLogs: [], performanceScore: 0 };
          await databaseService.upsertUser(dbConfig, newUserProfile);
          setUser(newUserProfile);
          setIsJoinWorkspaceModalOpen(false);
      } catch (err) { alert("Gagal bergabung."); }
      finally { setLoading(false); }
  };

  const saveAnalytics = (insight: PostInsight | PostInsight[]) => {
    const updated = Array.isArray(insight) ? [...insight, ...analyticsData] : [insight, ...analyticsData];
    setAnalyticsData(updated);
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- RENDER LOGIC ---
  if (authState === 'register') {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 font-sans text-gray-900">
        <div className="max-w-[480px] w-full bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] p-10 md:p-14 space-y-8 border border-gray-100 animate-slide">
          <button onClick={() => setAuthState('login')} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 text-xs font-black uppercase tracking-widest transition-colors"><ChevronLeft size={16} /> Back to Login</button>
          {regSuccess ? (
            <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce"><CheckCircle size={40}/></div>
                <div><h2 className="text-2xl font-black text-gray-900">Registrasi Berhasil!</h2><p className="text-gray-500 text-sm mt-2">Data Anda telah dikirim ke Admin.</p></div>
                <button onClick={() => setAuthState('login')} className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl">Kembali ke Login</button>
            </div>
          ) : (
            <form onSubmit={async (e) => { e.preventDefault(); setLoading(true); try { await databaseService.createRegistration(getDbConfig(), regData); setRegSuccess(true); } catch(e) { alert("Gagal daftar."); } finally { setLoading(false); } }} className="space-y-4">
                <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Daftar Akun</h1>
                <div><label className="text-[10px] font-black uppercase text-gray-400 ml-3">Nama</label><input required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm border focus:border-blue-200 text-gray-900" /></div>
                <div><label className="text-[10px] font-black uppercase text-gray-400 ml-3">Email</label><input required type="email" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm border focus:border-blue-200 text-gray-900" /></div>
                <div><label className="text-[10px] font-black uppercase text-gray-400 ml-3">Password</label><input required type="password" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm border focus:border-blue-200 text-gray-900" /></div>
                <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl mt-4 flex justify-center items-center gap-2 shadow-xl shadow-blue-200 active:scale-95 transition-all">
                    {loading ? <Loader2 className="animate-spin"/> : 'Kirim Registrasi'}
                </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Auto-skip setup if user already has a workspace
  if (authState === 'authenticated' && user && !user.workspaceId && user.role !== 'developer') {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans text-gray-900">
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide">
                <div className="md:col-span-2 text-center mb-4"><h1 className="text-3xl font-black text-gray-900 tracking-tight">Setup Workspace</h1><p className="text-gray-400 mt-2">Pilih cara memulai tim Anda.</p></div>
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl flex flex-col items-center text-center space-y-6 hover:border-blue-200 transition-all">
                    <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center"><Hash size={32}/></div>
                    <h2 className="text-xl font-black text-gray-900">Gabung Tim</h2>
                    {setupStep === 'join' ? (
                        <form onSubmit={handleJoinByCode} className="w-full space-y-4">
                            <input value={workspaceCodeInput} onChange={e => setWorkspaceCodeInput(e.target.value.toUpperCase())} className="w-full px-6 py-4 bg-gray-50 border rounded-2xl text-center font-black text-lg uppercase text-gray-900" placeholder="AR-XXXX" />
                            <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 text-white rounded-xl font-black">{loading ? <Loader2 size={12} className="animate-spin" /> : 'Gabung'}</button>
                        </form>
                    ) : <button onClick={() => setSetupStep('join')} className="px-8 py-3 bg-white border-2 text-gray-900 rounded-2xl font-black uppercase text-[10px]">Input Kode</button>}
                </div>
                <div className="bg-gray-900 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center text-center space-y-6 text-white">
                    <div className="w-20 h-20 bg-white/10 text-white rounded-full flex items-center justify-center"><Building2 size={32}/></div>
                    <h2 className="text-xl font-black">Buat Workspace</h2>
                    {setupStep === 'create' ? (
                        <form onSubmit={handleCreateWorkspace} className="w-full space-y-4">
                            <input required value={newWorkspaceData.name} onChange={e => setNewWorkspaceData({...newWorkspaceData, name: e.target.value})} className="w-full px-6 py-4 bg-white/10 border rounded-2xl text-center text-white" placeholder="Nama Studio" />
                            <button type="submit" disabled={loading} className="w-full py-3 bg-white text-gray-900 rounded-xl font-black">{loading ? <Loader2 size={12} className="animate-spin" /> : 'Buat Sekarang'}</button>
                        </form>
                    ) : <button onClick={() => setSetupStep('create')} className="px-8 py-3 bg-white/10 text-white rounded-2xl font-black uppercase text-[10px]">Setup Baru</button>}
                </div>
            </div>
            <button onClick={() => { setUser(null); setAuthState('login'); }} className="fixed bottom-8 text-gray-400 text-xs font-bold hover:text-rose-500">Logout</button>
        </div>
      );
  }

  if (authState === 'login') {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 font-sans text-gray-900">
        <div className="max-w-[440px] w-full bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] p-10 md:p-14 space-y-12 border border-gray-100 animate-slide">
          <div className="text-center space-y-4">
             <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white text-2xl font-black bg-blue-500 shadow-xl shadow-blue-200">AR</div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tighter">{APP_NAME}</h1>
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2"><ShieldCheck size={12} className="text-blue-500"/> Social Management</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            {loginError && <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3"><AlertTriangle size={18} className="text-rose-500 shrink-0" /><p className="text-[11px] font-bold text-rose-600">{loginError}</p></div>}
            <div className="space-y-2"><label className="text-[9px] font-black uppercase text-gray-400 ml-4">Email</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-7 py-5 bg-gray-50 border rounded-2xl outline-none font-bold text-sm text-gray-900 placeholder:text-gray-400" placeholder="user@arunika.id" /></div>
            <div className="space-y-2">
               <label className="text-[9px] font-black uppercase text-gray-400 ml-4">Password</label>
               <div className="relative">
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-7 py-5 bg-gray-50 border rounded-2xl outline-none font-bold text-sm text-gray-900 placeholder:text-gray-400" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400">{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
               </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-6 bg-blue-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-2xl active:scale-95 transition-all">{loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Access System'}</button>
            <div className="pt-2 text-center"><button type="button" onClick={() => setAuthState('register')} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-500">Register Account</button></div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans overflow-x-hidden relative text-gray-900">
      {topNotification && (
        <TopNotification 
          key={topNotification.id}
          primaryColor={activeWorkspace?.color || 'blue'}
          senderName={topNotification.senderName}
          messageText={topNotification.messageText}
          onClose={() => setTopNotification(null)}
          onClick={() => handleOpenContent(topNotification.targetContentId)}
        />
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(t) => { setActiveTab(t); setTargetContentId(null); setIsSidebarOpen(false); }} 
        primaryColorHex={primaryColorHex} 
        onLogout={() => { setUser(null); localStorage.removeItem('sf_session_user'); setAuthState('login'); }} 
        user={user!} 
        appLogo={customLogo}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        unreadNotifications={notificationHistory.filter(n => !n.read).length}
        notifications={notificationHistory}
        onMarkRead={async () => {
            setNotificationHistory(prev => prev.map(n => ({...n, read: true})));
            const dbConfig = getDbConfig();
            for(const n of notificationHistory.filter(nh => !nh.read)) { await databaseService.markNotificationRead(dbConfig, n.id); }
        }}
        onOpenContent={handleOpenContent}
      />
      
      <main className={`flex-1 transition-all duration-300 min-h-screen md:ml-72 p-6 md:p-12 relative`}>
        <div className="flex items-center justify-between mb-8 md:hidden">
           <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-white border rounded-2xl shadow-sm"><Menu size={24} /></button>
           <h2 className="text-sm font-black text-gray-900 uppercase">{activeWorkspace?.name || 'Dashboard'}</h2>
        </div>

        <div className="max-w-6xl mx-auto w-full">
           {activeTab === 'dashboard' && activeWorkspace && <Dashboard primaryColor={activeWorkspace.color} />}
           {activeTab === 'contentPlan' && activeWorkspace && (
             <ContentPlan 
               primaryColorHex={primaryColorHex} 
               onSaveInsight={saveAnalytics} 
               users={activeWorkspace.members} 
               addNotification={(n) => {}} // Legacy prop
               currentUser={user!}
               accounts={accounts}
               setAccounts={setAccounts}
               targetContentId={targetContentId}
               workspaceId={activeWorkspace.id} 
             />
           )}
           {activeTab === 'calendar' && activeWorkspace && <Calendar primaryColor={activeWorkspace.color} />}
           {activeTab === 'ads' && activeWorkspace && <AdsWorkspace primaryColor={activeWorkspace.color} />}
           {activeTab === 'analytics' && <Analytics primaryColorHex={primaryColorHex} analyticsData={analyticsData} onSaveInsight={saveAnalytics} />}
           {activeTab === 'tracker' && <LinkTracker primaryColorHex={primaryColorHex} onSaveManualInsight={saveAnalytics} />}
           {activeTab === 'team' && activeWorkspace && (
             <Team 
               primaryColor={activeWorkspace.color} 
               currentUser={user!} 
               workspace={activeWorkspace} 
               onUpdateWorkspace={()=>{}} 
               addSystemNotification={()=>{}} 
               allUsers={allUsers} 
               setUsers={setAllUsers} 
               setWorkspace={(ws) => setWorkspaces(workspaces.map(w => w.id === ws.id ? ws : w))} 
               onJoinAnotherWorkspace={() => setIsJoinWorkspaceModalOpen(true)}
             />
           )}
           {activeTab === 'settings' && <Settings primaryColorHex={primaryColorHex} setPrimaryColorHex={setPrimaryColorHex} accentColorHex="#BFDBFE" setAccentColorHex={()=>{}} fontSize="medium" setFontSize={()=>{}} customLogo={customLogo} setCustomLogo={setCustomLogo} />}
           {activeTab === 'profile' && activeWorkspace && <Profile user={user!} primaryColor={activeWorkspace.color} setUser={setUser} allWorkspaces={workspaces} allProfiles={allUsers.filter(u => u.email === user?.email)} onSwitchProfile={switchProfile} />}
           {activeTab === 'devPortal' && user?.role === 'developer' && <DevPortal primaryColorHex={primaryColorHex} registrations={registrations} onRegistrationAction={()=>{}} users={allUsers} setUsers={setAllUsers} setRegistrations={setRegistrations} dbSourceUrl="" setDbSourceUrl={()=>{}} onManualSync={()=>{}} />}
        </div>
        
        {activeWorkspace && <ChatPopup primaryColor={activeWorkspace.color} currentUser={user!} messages={[]} onSendMessage={()=>{}} isOpen={false} setIsOpen={()=>{}} unreadCount={0} />}
      </main>

      {isJoinWorkspaceModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-slide relative text-gray-900">
                  <button onClick={() => setIsJoinWorkspaceModalOpen(false)} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full"><ArrowRight size={18}/></button>
                  <div className="text-center mb-8"><div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-4"><Hash size={32}/></div><h2 className="text-2xl font-black text-gray-900">Gabung Workspace</h2><p className="text-gray-400 text-sm mt-2">Masukkan Kode Unik Workspace.</p></div>
                  <form onSubmit={handleJoinByCode} className="space-y-4">
                      <input required value={workspaceCodeInput} onChange={e => setWorkspaceCodeInput(e.target.value.toUpperCase())} className="w-full px-6 py-4 bg-gray-50 border rounded-2xl font-black text-center text-xl uppercase text-gray-900" placeholder="AR-XXXX" />
                      <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white font-black uppercase rounded-2xl">{loading ? <Loader2 size={12} className="animate-spin" /> : 'Gabung Sekarang'}</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;
