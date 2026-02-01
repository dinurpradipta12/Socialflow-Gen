
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ThemeColor, Workspace, User, Message, SystemNotification, PostInsight, RegistrationRequest, Permissions } from './types';
import { MOCK_WORKSPACES, MOCK_USERS, THEME_COLORS, DEV_CREDENTIALS, MOCK_MESSAGES, MOCK_REGISTRATIONS } from './constants';
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
import { Mail, Lock, Loader2, CheckCircle, Bell, X, Shield, ArrowRight, UserPlus, Eye, EyeOff, PlusCircle, Link as LinkIcon, Wifi, WifiOff, AlertTriangle } from 'lucide-react';

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

  const prevRegCount = useRef(registrations.length);
  const isDev = user?.role === 'developer';

  /**
   * CRITICAL: Google Apps Script fetch handling.
   * "Failed to fetch" usually occurs due to CORS preflight (OPTIONS) failing.
   * We must use "Simple Requests" (no custom headers) to avoid preflight.
   */
  const syncWithCloud = useCallback(async (isManual = false) => {
    if (!dbSourceUrl || !dbSourceUrl.includes('script.google.com')) {
      if (isManual) alert("URL Database tidak valid. Gunakan link deployment Apps Script (/exec).");
      return;
    }
    if (!isManual && isSyncing) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      // Use URL parameter for action to keep it as a Simple GET Request
      const fetchUrl = `${dbSourceUrl}${dbSourceUrl.includes('?') ? '&' : '?'}action=getRegistrations&_t=${Date.now()}`;
      
      const res = await fetch(fetchUrl, {
        method: 'GET',
        mode: 'cors', // Ensure CORS is requested
        redirect: 'follow', // Crucial for Google Apps Script redirects
        // DO NOT add custom headers here to avoid OPTIONS preflight
      });
      
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const cloudData = await res.json();
      
      if (Array.isArray(cloudData)) {
        setRegistrations(cloudData);
        localStorage.setItem('sf_registrations_db', JSON.stringify(cloudData));
        
        if (isDev && cloudData.length > prevRegCount.current) {
          const newest = cloudData.filter(r => r.status === 'pending')[0];
          if (newest) setDevNotif(newest);
        }
        prevRegCount.current = cloudData.length;
        if (isManual) console.log("Cloud Sync Success");
      } else if (cloudData.error) {
        throw new Error(cloudData.error);
      }
    } catch (err: any) {
      console.error("Sync Error Details:", err);
      const msg = err.message || "Network Error";
      setSyncError(msg);
      
      if (isManual) {
        alert(
          `Gagal Sinkronisasi: ${msg}\n\n` +
          `Pastikan:\n` +
          `1. Link diakhiri dengan /exec\n` +
          `2. Deployment diset ke "Anyone" (Siapa Saja)\n` +
          `3. Anda sudah meng-Authorize script di Google Cloud.`
        );
      }
    } finally {
      setIsSyncing(false);
    }
  }, [dbSourceUrl, isDev, isSyncing]);

  useEffect(() => {
    if (dbSourceUrl) {
      syncWithCloud();
      const interval = setInterval(() => syncWithCloud(), 60000); // Polling every minute
      return () => clearInterval(interval);
    }
  }, [dbSourceUrl, syncWithCloud]);

  const handleRegistrationAction = useCallback(async (regId: string, status: 'approved' | 'rejected') => {
    const updated = registrations.map(r => r.id === regId ? { ...r, status } : r);
    setRegistrations(updated);
    localStorage.setItem('sf_registrations_db', JSON.stringify(updated));

    if (dbSourceUrl) {
      try {
        // Use no-cors for POST if we don't need to read the response, avoids preflight
        await fetch(dbSourceUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            action: 'updateStatus',
            id: regId,
            status: status
          }).toString()
        });
      } catch (e) { console.error("Cloud Update Fail", e); }
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
  }, [registrations, dbSourceUrl, allUsers]);

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
        alert('Akses Ditolak: Kredensial salah atau akun belum diverifikasi.');
      }
      setLoading(false);
    }, 1200);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const newReg = {
      id: `REG-${Date.now()}`,
      name: regName,
      email: regEmail,
      password: regPassword,
      timestamp: new Date().toLocaleString('id-ID'),
      status: 'pending' as const
    };

    if (dbSourceUrl) {
      try {
        const formData = new URLSearchParams();
        formData.append('action', 'register');
        formData.append('id', newReg.id);
        formData.append('name', newReg.name);
        formData.append('email', newReg.email);
        formData.append('password', newReg.password || '');
        formData.append('timestamp', newReg.timestamp);
        formData.append('status', newReg.status);

        await fetch(dbSourceUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        });
        alert('Permintaan pendaftaran terkirim! Admin akan memverifikasi akun Anda.');
      } catch (e) {
        console.error("Cloud Register Fail", e);
        alert('Gagal mengirim ke Cloud. Mencoba penyimpanan lokal...');
      }
    }

    // Always fallback to local storage for UX
    const current = JSON.parse(localStorage.getItem('sf_registrations_db') || '[]');
    const updated = [newReg, ...current];
    localStorage.setItem('sf_registrations_db', JSON.stringify(updated));
    setRegistrations(updated);

    setLoading(false);
    setAuthState('login');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sf_session_user');
    setAuthState('login');
  };

  const addManualInsight = (insight: PostInsight) => {
    const updated = [insight, ...analyticsData];
    setAnalyticsData(updated);
  };

  const handleSendMessage = (text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user?.id || 'guest',
      text,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);
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
      case 'team': return (
        <Team 
          primaryColor={activeWorkspace.color} 
          currentUser={user} 
          workspace={activeWorkspace} 
          onUpdateWorkspace={(name, color) => setActiveWorkspace({ ...activeWorkspace, name, color })}
          addSystemNotification={() => {}} 
          allUsers={allUsers}
          setUsers={setAllUsers}
          setWorkspace={setActiveWorkspace}
        />
      );
      case 'settings': return (
        <Settings 
          primaryColorHex={primaryColorHex} setPrimaryColorHex={setPrimaryColorHex}
          accentColorHex={accentColorHex} setAccentColorHex={setAccentColorHex}
          fontSize={fontSize} setFontSize={setFontSize}
          customLogo={customLogo} setCustomLogo={setCustomLogo}
          dbSourceUrl={dbSourceUrl} setDbSourceUrl={setDbSourceUrl}
        />
      );
      case 'profile': return <Profile user={user} primaryColor={activeWorkspace.color} setUser={setUser} />;
      case 'devPortal': return isDev ? (
        <DevPortal 
          primaryColorHex={primaryColorHex} 
          registrations={registrations} 
          onRegistrationAction={handleRegistrationAction}
          users={allUsers}
          setUsers={setAllUsers}
          setRegistrations={setRegistrations}
          dbSourceUrl={dbSourceUrl}
          setDbSourceUrl={setDbSourceUrl}
          onManualSync={() => syncWithCloud(true)}
        />
      ) : null;
      default: return <Dashboard primaryColor={activeWorkspace.color} />;
    }
  };

  if (authState === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 animate-slide">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Socialflow</h1>
            <p className="text-gray-400 font-medium mt-1 uppercase text-[10px] tracking-widest">Workspace Login</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-200 transition-all font-medium"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-200 transition-all font-medium"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button 
              disabled={loading}
              className="w-full py-4 bg-blue-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-100 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>Login <ArrowRight size={18} /></>}
            </button>
          </form>
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 font-medium">Belum punya akun? <button onClick={() => setAuthState('register')} className="text-blue-500 font-black hover:underline">Daftar Sekarang</button></p>
          </div>
        </div>
      </div>
    );
  }

  if (authState === 'register') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl border border-gray-100 animate-slide">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Join Socialflow</h1>
            <p className="text-gray-400 font-medium mt-1 uppercase text-[10px] tracking-widest">Registration Request</p>
          </div>
          <form onSubmit={handleRegister} className="space-y-4">
            <input required placeholder="Nama Lengkap" value={regName} onChange={e => setRegName(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-200 transition-all font-medium" />
            <input required type="email" placeholder="Email Aktif" value={regEmail} onChange={e => setRegEmail(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-200 transition-all font-medium" />
            <input required type="password" placeholder="Password Baru" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl outline-none focus:bg-white focus:border-blue-200 transition-all font-medium" />
            <button 
              disabled={loading}
              className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-100 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>Kirim Request <UserPlus size={18} /></>}
            </button>
          </form>
          <div className="mt-8 text-center">
            <button onClick={() => setAuthState('login')} className="text-xs text-gray-400 font-black uppercase tracking-widest hover:text-gray-600">Kembali ke Login</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 flex transition-all duration-500`} style={{ '--primary-color': primaryColorHex } as any}>
      {user && (
        <>
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            primaryColorHex={primaryColorHex} 
            onLogout={handleLogout} 
            user={user} 
            appLogo={customLogo}
          />
          <main className="flex-1 ml-72 p-10 min-h-screen overflow-x-hidden">
            {renderContent()}
          </main>
          
          <ChatPopup 
            primaryColor={activeWorkspace?.color || 'blue'} 
            currentUser={user} 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            isOpen={isChatOpen} 
            setIsOpen={setIsChatOpen}
            unreadCount={0}
          />

          {devNotif && isDev && (
            <TopNotification 
              primaryColor="blue"
              senderName="Sistem Socialflow"
              messageText={`Ada pendaftaran baru dari ${devNotif.name}`}
              onClose={() => setDevNotif(null)}
              onClick={() => { setActiveTab('devPortal'); setDevNotif(null); }}
              actionButton={
                <button onClick={(e) => { e.stopPropagation(); handleRegistrationAction(devNotif.id, 'approved'); }} className="px-4 py-2 bg-blue-500 text-white text-[10px] font-black uppercase rounded-xl">Approve</button>
              }
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;
