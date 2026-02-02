
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ThemeColor, Workspace, User, Message, SystemNotification, PostInsight, RegistrationRequest, Permissions } from './types';
import { MOCK_WORKSPACES, MOCK_USERS, THEME_COLORS, DEV_CREDENTIALS, MOCK_MESSAGES, MOCK_REGISTRATIONS, APP_VERSION } from './constants';
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
import { Mail, Lock, Loader2, CheckCircle, Bell, X, Shield, ArrowRight, UserPlus, Eye, EyeOff, PlusCircle, Link as LinkIcon, Wifi, WifiOff, AlertTriangle, RefreshCw, Sparkles, DownloadCloud, Database } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('sf_session_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [authState, setAuthState] = useState<'login' | 'register' | 'authenticated'>(user ? 'authenticated' : 'login');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  
  const [primaryColorHex, setPrimaryColorHex] = useState('#BFDBFE');
  const [accentColorHex, setAccentColorHex] = useState('#DDD6FE');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const [dbSourceUrl, setDbSourceUrl] = useState<string>(localStorage.getItem('sf_db_source') || '');

  const [analyticsData, setAnalyticsData] = useState<PostInsight[]>([]);
  
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

  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [devNotif, setDevNotif] = useState<RegistrationRequest | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>(localStorage.getItem('sf_last_sync') || 'Never');
  
  // Update Tracking
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [cloudVersion, setCloudVersion] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const prevRegCount = useRef(registrations.length);
  const isDev = user?.role === 'developer';

  const syncWithCloud = useCallback(async (isManual = false) => {
    if (!dbSourceUrl || !dbSourceUrl.includes('script.google.com')) return;
    if (!isManual && isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(`${dbSourceUrl}?action=getRegistrations&_t=${Date.now()}`, {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const responseData = await res.json();
      
      let cloudRegs = [];
      let latestVer = null;

      if (Array.isArray(responseData)) {
        cloudRegs = responseData;
      } else if (responseData.registrations) {
        cloudRegs = responseData.registrations;
        latestVer = responseData.app_version || responseData.version;
      }

      // Logic Deployment Detection V3.0.6
      if (latestVer && latestVer !== APP_VERSION) {
        setCloudVersion(latestVer);
        setUpdateAvailable(true);
      } else {
        setUpdateAvailable(false); // Sembunyikan jika sudah update
      }

      if (Array.isArray(cloudRegs)) {
        setRegistrations(cloudRegs);
        localStorage.setItem('sf_registrations_db', JSON.stringify(cloudRegs));
        const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastSyncTime(now);
        localStorage.setItem('sf_last_sync', now);
        
        if (isDev && cloudRegs.length > prevRegCount.current) {
          const newest = cloudRegs.filter(r => (r.status || '').toLowerCase() === 'pending')[0];
          if (newest) setDevNotif(newest);
        }
        prevRegCount.current = cloudRegs.length;
      }
    } catch (err: any) {
      setSyncError(err.name === 'AbortError' ? "Cloud Slow" : (err.message || "Sync Error"));
    } finally {
      setIsSyncing(false);
    }
  }, [dbSourceUrl, isDev, isSyncing]);

  useEffect(() => {
    if (dbSourceUrl) {
      syncWithCloud();
      const intervalTime = activeTab === 'devPortal' ? 5000 : 60000; 
      const interval = setInterval(() => syncWithCloud(), intervalTime);
      return () => clearInterval(interval);
    }
  }, [dbSourceUrl, syncWithCloud, activeTab]);

  // Handle Post-Update Notification
  useEffect(() => {
    const justUpdated = localStorage.getItem('sf_just_updated');
    if (justUpdated === 'true') {
      setShowSuccessToast(true);
      localStorage.removeItem('sf_just_updated'); // Bersihkan flag
      setTimeout(() => setShowSuccessToast(false), 6000);
    }
  }, []);

  const handleUpdateApp = () => {
    setLoading(true);
    // 1. Simpan sesi agar tidak logout
    if (user) localStorage.setItem('sf_session_user', JSON.stringify(user));
    // 2. Tandai bahwa kita baru saja melakukan update
    localStorage.setItem('sf_just_updated', 'true');
    
    // 3. Refresh dengan cache-busting
    setTimeout(() => {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('reload_v', Date.now().toString());
      window.location.replace(currentUrl.toString());
    }, 1500);
  };

  const handleRegistrationAction = useCallback(async (regId: string, status: 'approved' | 'rejected') => {
    const updated = registrations.map(r => r.id === regId ? { ...r, status } : r);
    setRegistrations(updated);
    localStorage.setItem('sf_registrations_db', JSON.stringify(updated));

    if (dbSourceUrl) {
      try {
        const params = new URLSearchParams();
        params.append('action', 'updateStatus');
        params.append('id', regId);
        params.append('status', status);
        const pingUrl = `${dbSourceUrl}${dbSourceUrl.includes('?') ? '&' : '?'}${params.toString()}&_t=${Date.now()}`;
        fetch(pingUrl, { method: 'GET', mode: 'no-cors', keepalive: true });
        setTimeout(() => syncWithCloud(true), 3000);
      } catch (e) { console.error("Cloud Error", e); }
    }
    
    if (status === 'approved') {
      const reg = registrations.find(r => r.id === regId);
      if (reg) {
        const newUser: User = {
          id: `U-${Date.now()}`,
          name: reg.name,
          email: reg.email,
          role: 'viewer',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${reg.name}`,
          permissions: { dashboard: true, calendar: true, ads: false, analytics: false, tracker: false, team: false, settings: false, contentPlan: false },
          isSubscribed: true,
          subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          jobdesk: 'New Member', kpi: [], activityLogs: [], performanceScore: 0
        };
        const updatedUsers = [...allUsers, newUser];
        setAllUsers(updatedUsers);
        localStorage.setItem('sf_users_db', JSON.stringify(updatedUsers));
      }
    }
    setDevNotif(null);
  }, [registrations, dbSourceUrl, allUsers, syncWithCloud]);

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
      
      if (loggedInUser && loggedInUser.isSubscribed) {
        setUser(loggedInUser);
        localStorage.setItem('sf_session_user', JSON.stringify(loggedInUser));
        setAuthState('authenticated');
        if (loggedInUser.role === 'developer') {
          setActiveWorkspace(MOCK_WORKSPACES[0]);
        } else if (loggedInUser.workspaceId) {
          const ws = MOCK_WORKSPACES.find(w => w.id === loggedInUser?.workspaceId);
          if (ws) setActiveWorkspace(ws);
        }
      } else {
        alert('Kredensial salah.');
      }
      setLoading(false);
    }, 800);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const newReg: RegistrationRequest = {
      id: `REG-${Date.now()}`,
      name: regName, email: regEmail, password: regPassword,
      timestamp: new Date().toLocaleString('id-ID'), status: 'pending'
    };
    const current = JSON.parse(localStorage.getItem('sf_registrations_db') || '[]');
    const updated = [newReg, ...current];
    localStorage.setItem('sf_registrations_db', JSON.stringify(updated));
    setRegistrations(updated);

    if (dbSourceUrl && dbSourceUrl.includes('script.google.com')) {
      const q = new URLSearchParams({ action: 'register', id: newReg.id, name: newReg.name, email: newReg.email, password: newReg.password || '', timestamp: newReg.timestamp, v: APP_VERSION });
      fetch(`${dbSourceUrl}${dbSourceUrl.includes('?') ? '&' : '?'}${q.toString()}`, { method: 'GET', mode: 'no-cors', keepalive: true });
    }

    setTimeout(() => {
      setLoading(false);
      alert(`Pendaftaran terkirim!`);
      setAuthState('login');
      setRegName(''); setRegEmail(''); setRegPassword('');
    }, 300);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sf_session_user');
    setAuthState('login');
  };

  const addManualInsight = (insight: PostInsight) => {
    setAnalyticsData(prev => [insight, ...prev]);
  };

  const renderContent = () => {
    if (!user || !activeWorkspace) return null;
    switch (activeTab) {
      case 'dashboard': return <Dashboard primaryColor={activeWorkspace.color} />;
      case 'contentPlan': return <ContentPlan primaryColorHex={primaryColorHex} onSaveInsight={addManualInsight} users={allUsers} />;
      case 'calendar': return <Calendar primaryColor={activeWorkspace.color} />;
      case 'ads': return <AdsWorkspace primaryColor={activeWorkspace.color} />;
      case 'analytics': return <Analytics primaryColorHex={primaryColorHex} analyticsData={analyticsData} onSaveInsight={addManualInsight} />;
      case 'tracker': return <LinkTracker primaryColorHex={primaryColorHex} onSaveManualInsight={addManualInsight} />;
      case 'team': return <Team primaryColor={activeWorkspace.color} currentUser={user} workspace={activeWorkspace} onUpdateWorkspace={(name, color) => setActiveWorkspace({ ...activeWorkspace, name, color })} addSystemNotification={() => {}} allUsers={allUsers} setUsers={setAllUsers} setWorkspace={setActiveWorkspace} />;
      case 'settings': return <Settings primaryColorHex={primaryColorHex} setPrimaryColorHex={setPrimaryColorHex} accentColorHex={accentColorHex} setAccentColorHex={setAccentColorHex} fontSize={fontSize} setFontSize={setFontSize} customLogo={customLogo} setCustomLogo={setCustomLogo} dbSourceUrl={dbSourceUrl} setDbSourceUrl={(url) => { setDbSourceUrl(url); localStorage.setItem('sf_db_source', url); }} />;
      case 'profile': return <Profile user={user} primaryColor={activeWorkspace.color} setUser={setUser} />;
      case 'devPortal': return isDev ? <DevPortal primaryColorHex={primaryColorHex} registrations={registrations} onRegistrationAction={handleRegistrationAction} users={allUsers} setUsers={setAllUsers} setRegistrations={setRegistrations} dbSourceUrl={dbSourceUrl} setDbSourceUrl={(url) => { setDbSourceUrl(url); localStorage.setItem('sf_db_source', url); }} onManualSync={() => syncWithCloud(true)} lastSync={lastSyncTime} /> : null;
      default: return <Dashboard primaryColor={activeWorkspace.color} />;
    }
  };

  if (authState === 'login' || authState === 'register') {
    // Render Login/Register Screen
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6">
        {authState === 'login' ? (
          <div className="max-w-[400px] w-full bg-white rounded-[2rem] shadow-2xl p-10 space-y-8 border border-gray-100 animate-slide">
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-blue-100 text-blue-500 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black">SF</div>
              <div>
                <h1 className="text-xl font-black text-gray-900">Socialflow Login</h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Snaillabs Analyze Tracker</p>
              </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 text-sm" placeholder="Email" />
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 text-sm" placeholder="Password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              <button type="submit" disabled={loading} className="w-full py-4 bg-blue-400 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-blue-500 shadow-lg transition-all">{loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Masuk Dashboard"}</button>
              <button type="button" onClick={() => setAuthState('register')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-400">Daftar Akun Baru</button>
            </form>
          </div>
        ) : (
          <div className="max-w-[400px] w-full bg-white rounded-[2rem] shadow-2xl p-10 space-y-8 border border-gray-100 animate-slide">
             <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-500 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black">SF</div>
                <h1 className="text-xl font-black text-gray-900">Daftar Socialflow</h1>
             </div>
             <form onSubmit={handleRegister} className="space-y-4 animate-slide">
                <input type="text" required value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 text-sm" placeholder="Nama" />
                <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 text-sm" placeholder="Email" />
                <input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 text-sm" placeholder="Password" />
                <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-400 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-emerald-500 shadow-lg">{loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Kirim Pendaftaran"}</button>
                <button type="button" onClick={() => setAuthState('login')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-emerald-400">Kembali</button>
             </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 flex transition-all duration-500`} style={{ '--primary-color': primaryColorHex } as any}>
      {user && (
        <>
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} primaryColorHex={primaryColorHex} onLogout={handleLogout} user={user} appLogo={customLogo} />
          
          <main className="flex-1 ml-72 p-10 min-h-screen overflow-x-hidden relative">
            {/* 1. Banner Update - Hanya muncul jika cloudVersion > APP_VERSION */}
            {updateAvailable && (
              <div className="mb-10 p-6 bg-white border-2 border-blue-400 rounded-[2.5rem] shadow-[0_20px_50px_rgba(59,130,246,0.15)] flex flex-col md:flex-row items-center justify-between animate-slide gap-6 ring-8 ring-blue-50/50">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-400 text-white rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[8px] font-black uppercase rounded-md tracking-widest">Update Source: Main Branch</span>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Versi Baru Terdeteksi</p>
                    </div>
                    <p className="text-lg font-black text-gray-900">Versi {cloudVersion} Sudah Tersedia!</p>
                    <p className="text-xs text-gray-400 font-medium">Sistem mendeteksi deploy baru. Perbarui sekarang untuk fitur terbaru.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setUpdateAvailable(false)} className="px-6 py-4 text-gray-400 text-[10px] font-black uppercase hover:text-gray-600 transition-colors">Abaikan</button>
                  <button onClick={handleUpdateApp} disabled={loading} className="px-10 py-4 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 flex items-center gap-2 hover:scale-105 transition-all active:scale-95">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <DownloadCloud size={16} />}
                    Instal Pembaruan
                  </button>
                </div>
              </div>
            )}

            {/* 2. Success Toast - Muncul setelah reload selesai */}
            {showSuccessToast && (
              <TopNotification 
                primaryColor="blue"
                senderName="Sistem Socialflow"
                messageText={`Sukses! Aplikasi telah diperbarui ke versi ${APP_VERSION}.`}
                onClose={() => setShowSuccessToast(false)}
                onClick={() => setShowSuccessToast(false)}
                actionButton={<div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-500 rounded-lg text-[8px] font-black uppercase"><CheckCircle size={10}/> Latest Version</div>}
              />
            )}

            <header className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <button className="p-3 rounded-2xl bg-white border border-gray-100 shadow-sm relative"><Bell size={18} className="text-gray-400" /></button>
                <div>
                  <h2 className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{activeWorkspace?.name}</h2>
                  <p className="text-xl font-black text-gray-900 capitalize tracking-tight mt-0.5">{activeTab.replace(/([A-Z])/g, ' $1')}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                 <button onClick={() => syncWithCloud(true)} disabled={isSyncing} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${isSyncing ? 'bg-blue-50 text-blue-400' : (syncError ? 'bg-rose-50 text-rose-400 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-400 hover:bg-emerald-100')}`}>
                    {isSyncing ? <Loader2 size={12} className="animate-spin" /> : (syncError ? <AlertTriangle size={12} /> : <RefreshCw size={12} />)}
                    {isSyncing ? 'Syncing...' : 'Cloud Sync'}
                 </button>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-end gap-1.5">Last Sync: {lastSyncTime}</p>
                    <p className="text-[9px] text-gray-200 font-bold uppercase tracking-wider mt-0.5">Snaillabs V{APP_VERSION}</p>
                 </div>
              </div>
            </header>

            <div className="max-w-6xl mx-auto">{renderContent()}</div>
          </main>
          
          <ChatPopup primaryColor={activeWorkspace?.color || 'blue'} currentUser={user} messages={messages} onSendMessage={(t) => setMessages(prev => [...prev, { id: Date.now().toString(), senderId: user.id, text: t, timestamp: new Date().toISOString() }])} isOpen={isChatOpen} setIsOpen={setIsChatOpen} unreadCount={0} />

          {devNotif && isDev && (
            <TopNotification primaryColor="blue" senderName="Sistem Socialflow" messageText={`Ada pendaftaran baru dari ${devNotif.name}`} onClose={() => setDevNotif(null)} onClick={() => { setActiveTab('devPortal'); setDevNotif(null); }} actionButton={<button onClick={(e) => { e.stopPropagation(); handleRegistrationAction(devNotif.id, 'approved'); }} className="px-4 py-2 bg-blue-500 text-white text-[10px] font-black uppercase rounded-xl">Approve</button>} />
          )}
        </>
      )}
    </div>
  );
};

export default App;
