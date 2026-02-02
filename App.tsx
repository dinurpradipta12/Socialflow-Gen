
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

// Helper to compare versions (e.g., '3.0.7' > '3.0.6')
const isNewerVersion = (cloudVer: string, localVer: string) => {
  const c = cloudVer.split('.').map(Number);
  const l = localVer.split('.').map(Number);
  for (let i = 0; i < Math.max(c.length, l.length); i++) {
    if ((c[i] || 0) > (l[i] || 0)) return true;
    if ((c[i] || 0) < (l[i] || 0)) return false;
  }
  return false;
};

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
  
  // Deployment Tracking
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
    const timeoutId = setTimeout(() => controller.abort(), 12000);

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

      // SMART DEPLOYMENT LOGIC V3.0.7
      if (latestVer) {
        // Hanya tampilkan banner jika cloud > lokal
        if (isNewerVersion(latestVer, APP_VERSION)) {
          setCloudVersion(latestVer);
          setUpdateAvailable(true);
        } else {
          // Tutup banner jika versi sudah sesuai atau lebih baru
          setUpdateAvailable(false);
        }
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
      const intervalTime = activeTab === 'devPortal' ? 5000 : 45000; 
      const interval = setInterval(() => syncWithCloud(), intervalTime);
      return () => clearInterval(interval);
    }
  }, [dbSourceUrl, syncWithCloud, activeTab]);

  // Handle Post-Update Toast Confirmation
  useEffect(() => {
    const targetVersion = localStorage.getItem('sf_update_target');
    if (targetVersion === APP_VERSION) {
      setShowSuccessToast(true);
      localStorage.removeItem('sf_update_target');
      setTimeout(() => setShowSuccessToast(false), 5000);
    }
  }, []);

  const handleUpdateApp = () => {
    setLoading(true);
    // Simpan info versi target agar saat reload kita tahu update berhasil
    if (cloudVersion) localStorage.setItem('sf_update_target', cloudVersion);
    if (user) localStorage.setItem('sf_session_user', JSON.stringify(user));
    
    setTimeout(() => {
      // Force reload from server with timestamp to break cache
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('deploy_ts', Date.now().toString());
      window.location.replace(currentUrl.toString());
    }, 1500);
  };

  const handleRegistrationAction = useCallback(async (regId: string, status: 'approved' | 'rejected') => {
    // Optimistic Update (UI Instan)
    const updated = registrations.map(r => r.id === regId ? { ...r, status } : r);
    setRegistrations(updated);
    localStorage.setItem('sf_registrations_db', JSON.stringify(updated));

    if (dbSourceUrl) {
      try {
        const q = new URLSearchParams({ action: 'updateStatus', id: regId, status });
        const pingUrl = `${dbSourceUrl}${dbSourceUrl.includes('?') ? '&' : '?'}${q.toString()}`;
        fetch(pingUrl, { method: 'GET', mode: 'no-cors', keepalive: true });
        setTimeout(() => syncWithCloud(true), 3000);
      } catch (e) { console.error(e); }
    }
    
    if (status === 'approved') {
      const reg = registrations.find(r => r.id === regId);
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
      } else {
        alert('Kredensial salah atau akun non-aktif.');
      }
      setLoading(false);
    }, 600);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const newReg: RegistrationRequest = {
      id: `REG-${Date.now()}`, name: regName, email: regEmail, password: regPassword,
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

  const renderContent = () => {
    if (!user || !activeWorkspace) return null;
    switch (activeTab) {
      case 'dashboard': return <Dashboard primaryColor={activeWorkspace.color} />;
      case 'contentPlan': return <ContentPlan primaryColorHex={primaryColorHex} onSaveInsight={(i) => setAnalyticsData(prev => [i, ...prev])} users={allUsers} />;
      case 'calendar': return <Calendar primaryColor={activeWorkspace.color} />;
      case 'ads': return <AdsWorkspace primaryColor={activeWorkspace.color} />;
      case 'analytics': return <Analytics primaryColorHex={primaryColorHex} analyticsData={analyticsData} onSaveInsight={(i) => setAnalyticsData(prev => [i, ...prev])} />;
      case 'tracker': return <LinkTracker primaryColorHex={primaryColorHex} onSaveManualInsight={(i) => setAnalyticsData(prev => [i, ...prev])} />;
      case 'team': return <Team primaryColor={activeWorkspace.color} currentUser={user} workspace={activeWorkspace} onUpdateWorkspace={(name, color) => setActiveWorkspace({ ...activeWorkspace, name, color })} addSystemNotification={() => {}} allUsers={allUsers} setUsers={setAllUsers} setWorkspace={setActiveWorkspace} />;
      case 'settings': return <Settings primaryColorHex={primaryColorHex} setPrimaryColorHex={setPrimaryColorHex} accentColorHex={accentColorHex} setAccentColorHex={setAccentColorHex} fontSize={fontSize} setFontSize={setFontSize} customLogo={customLogo} setCustomLogo={setCustomLogo} dbSourceUrl={dbSourceUrl} setDbSourceUrl={(url) => { setDbSourceUrl(url); localStorage.setItem('sf_db_source', url); }} />;
      case 'profile': return <Profile user={user} primaryColor={activeWorkspace.color} setUser={setUser} />;
      case 'devPortal': return isDev ? <DevPortal primaryColorHex={primaryColorHex} registrations={registrations} onRegistrationAction={handleRegistrationAction} users={allUsers} setUsers={setAllUsers} setRegistrations={setRegistrations} dbSourceUrl={dbSourceUrl} setDbSourceUrl={(url) => { setDbSourceUrl(url); localStorage.setItem('sf_db_source', url); }} onManualSync={() => syncWithCloud(true)} lastSync={lastSyncTime} /> : null;
      default: return <Dashboard primaryColor={activeWorkspace.color} />;
    }
  };

  if (authState === 'login' || authState === 'register') {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6">
        {authState === 'login' ? (
          <div className="max-w-[400px] w-full bg-white rounded-[2rem] shadow-2xl p-10 space-y-8 border border-gray-100 animate-slide">
            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-blue-100 text-blue-500 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black">SF</div>
              <h1 className="text-xl font-black text-gray-900">Socialflow Login</h1>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 text-sm" placeholder="Email" />
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 text-sm" placeholder="Password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              <button type="submit" disabled={loading} className="w-full py-4 bg-blue-400 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-blue-500 shadow-lg">{loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Masuk"}</button>
              <button type="button" onClick={() => setAuthState('register')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-400">Daftar Akun</button>
            </form>
          </div>
        ) : (
          <div className="max-w-[400px] w-full bg-white rounded-[2rem] shadow-2xl p-10 space-y-8 border border-gray-100 animate-slide">
             <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-500 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black">SF</div>
                <h1 className="text-xl font-black text-gray-900">Daftar</h1>
             </div>
             <form onSubmit={handleRegister} className="space-y-4">
                <input type="text" required value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 text-sm" placeholder="Nama" />
                <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 text-sm" placeholder="Email" />
                <input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 text-sm" placeholder="Password" />
                <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-400 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-emerald-500 shadow-lg">{loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Kirim"}</button>
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
          <main className="flex-1 ml-72 p-10 min-h-screen relative overflow-hidden">
            
            {/* 1. Deployment Update Banner - Only shown if cloud > local */}
            {updateAvailable && (
              <div className="mb-10 p-6 bg-white border-2 border-blue-400 rounded-[2.5rem] shadow-[0_20px_50px_rgba(59,130,246,0.1)] flex flex-col md:flex-row items-center justify-between animate-slide gap-6 ring-8 ring-blue-50/50">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-400 text-white rounded-2xl flex items-center justify-center shadow-lg">
                    <Sparkles size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                       <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[8px] font-black uppercase rounded-md tracking-widest">Main Branch Deployment</span>
                    </div>
                    <p className="text-lg font-black text-gray-900">Versi {cloudVersion} Telah Dirilis!</p>
                    <p className="text-xs text-gray-400 font-medium">Klik instal untuk memperbarui web app ke deployment terbaru.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setUpdateAvailable(false)} className="px-6 py-4 text-gray-400 text-[10px] font-black uppercase hover:text-gray-600 transition-colors">Nanti</button>
                  <button onClick={handleUpdateApp} disabled={loading} className="px-10 py-4 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/30 flex items-center gap-2 hover:scale-105 transition-all">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <DownloadCloud size={16} />}
                    Instal Sekarang
                  </button>
                </div>
              </div>
            )}

            {/* 2. Success Update Toast */}
            {showSuccessToast && (
              <TopNotification 
                primaryColor="blue"
                senderName="Deployment Center"
                messageText={`Aplikasi berhasil diperbarui ke Versi ${APP_VERSION} (Build: Latest)`}
                onClose={() => setShowSuccessToast(false)}
                onClick={() => setShowSuccessToast(false)}
                actionButton={<div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-500 rounded-lg text-[8px] font-black uppercase tracking-widest"><CheckCircle size={10}/> Latest Branch</div>}
              />
            )}

            <header className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <button className="p-3 rounded-2xl bg-white border border-gray-100 shadow-sm"><Bell size={18} className="text-gray-400" /></button>
                <div>
                  <h2 className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{activeWorkspace?.name}</h2>
                  <p className="text-xl font-black text-gray-900 capitalize tracking-tight mt-0.5">{activeTab.replace(/([A-Z])/g, ' $1')}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2 bg-white px-5 py-2.5 rounded-2xl border border-gray-100 shadow-sm">
                    <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{isSyncing ? 'Syncing...' : `Cloud Connected (V${APP_VERSION})`}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Last Sync: {lastSyncTime}</p>
                 </div>
              </div>
            </header>

            <div className="max-w-6xl mx-auto">{renderContent()}</div>
          </main>
          
          <ChatPopup primaryColor={activeWorkspace?.color || 'blue'} currentUser={user} messages={messages} onSendMessage={(t) => setMessages(prev => [...prev, { id: Date.now().toString(), senderId: user.id, text: t, timestamp: new Date().toISOString() }])} isOpen={isChatOpen} setIsOpen={setIsChatOpen} unreadCount={0} />

          {devNotif && isDev && (
            <TopNotification primaryColor="blue" senderName="Cloud Database" messageText={`Aktivasi baru: ${devNotif.name}`} onClose={() => setDevNotif(null)} onClick={() => { setActiveTab('devPortal'); setDevNotif(null); }} actionButton={<button onClick={(e) => { e.stopPropagation(); handleRegistrationAction(devNotif.id, 'approved'); }} className="px-4 py-2 bg-blue-500 text-white text-[10px] font-black uppercase rounded-xl">Approve</button>} />
          )}
        </>
      )}
    </div>
  );
};

export default App;
