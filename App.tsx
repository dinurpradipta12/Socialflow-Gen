
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
import { Mail, Lock, Loader2, CheckCircle, Bell, X, Shield, ArrowRight, UserPlus, Eye, EyeOff, PlusCircle, Link as LinkIcon, Wifi, WifiOff } from 'lucide-react';

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
    return saved ? JSON.parse(saved) : null;
  });

  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [devNotif, setDevNotif] = useState<RegistrationRequest | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const prevRegCount = useRef(registrations.length);
  const isDev = user?.role === 'developer';

  // LOGIKA FETCH DATA DARI GOOGLE SHEETS
  const syncWithCloud = useCallback(async (isManual = false) => {
    if (!dbSourceUrl || !dbSourceUrl.includes('script.google.com')) {
      if (isManual) alert("Error: URL Database belum diset dengan benar (script.google.com).");
      return;
    }
    if (!isManual && isSyncing) return;

    setIsSyncing(true);
    try {
      const res = await fetch(`${dbSourceUrl}?action=getRegistrations&t=${Date.now()}`);
      
      // Check if response is valid JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error("Response is not JSON. Check if Script is deployed as Public 'Anyone'.");
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
      }
    } catch (err) {
      console.warn("Cloud Sync Fail:", err);
      if (isManual) alert("Gagal Sinkronisasi: " + (err instanceof Error ? err.message : "Cek Konsol"));
    } finally {
      setIsSyncing(false);
    }
  }, [dbSourceUrl, isDev, isSyncing]);

  useEffect(() => {
    if (dbSourceUrl) {
      syncWithCloud();
      const interval = setInterval(() => syncWithCloud(), 30000); // Polling slower to prevent rate limit
      return () => clearInterval(interval);
    }
  }, [dbSourceUrl, syncWithCloud]);

  const handleRegistrationAction = useCallback(async (regId: string, status: 'approved' | 'rejected') => {
    const updated = registrations.map(r => r.id === regId ? { ...r, status } : r);
    setRegistrations(updated);
    localStorage.setItem('sf_registrations_db', JSON.stringify(updated));

    if (dbSourceUrl) {
      try {
        // Send as URL encoded for best compatibility with Google Apps Script doPost
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
        formData.append('password', newReg.password);
        formData.append('timestamp', newReg.timestamp);
        formData.append('status', newReg.status);

        // We use mode: 'no-cors' because we don't need to read the response of the POST
        // and it avoids preflight issues. Apps Script doPost handles form data well.
        await fetch(dbSourceUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        });
        console.log("Data pendaftaran dikirim ke Cloud.");
      } catch (err) {
        console.error("Cloud Post Error:", err);
      }
    }

    const current = JSON.parse(localStorage.getItem('sf_registrations_db') || '[]');
    const updated = [newReg, ...current];
    localStorage.setItem('sf_registrations_db', JSON.stringify(updated));
    setRegistrations(updated);

    setTimeout(() => {
      alert(`Pendaftaran Berhasil! Menunggu verifikasi Developer.`);
      setAuthState('login');
      setLoading(false);
      setRegName(''); setRegEmail(''); setRegPassword('');
    }, 1500);
  };

  const handleLogout = () => {
    localStorage.removeItem('sf_session_user');
    localStorage.removeItem('sf_active_workspace');
    setAuthState('login');
    setUser(null);
    setActiveWorkspace(null);
  };

  if (authState !== 'authenticated' || !user) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6">
        <div className="max-w-[400px] w-full bg-white rounded-[2rem] shadow-2xl p-10 space-y-8 border border-gray-100 animate-slide">
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-blue-100 text-blue-500 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black">SF</div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Socialflow Workspace</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Snaillabs Analyze Tracker</p>
            </div>
          </div>
          {authState === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 text-sm" placeholder="Email" />
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 text-sm" placeholder="Password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              <button type="submit" disabled={loading} className="w-full py-4 bg-blue-400 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-blue-500 shadow-lg transition-all">
                {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Masuk Dashboard"}
              </button>
              <button type="button" onClick={() => setAuthState('register')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-400">Daftar Akun Baru</button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4 animate-slide">
              <input type="text" required value={regName} onChange={(e) => setRegName(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 text-sm" placeholder="Nama / Username" />
              <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 text-sm" placeholder="Email" />
              <input type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 text-sm" placeholder="Password" />
              <button type="submit" disabled={loading} className="w-full py-4 bg-purple-400 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-purple-500 shadow-lg">
                {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Kirim Pendaftaran"}
              </button>
              <button type="button" onClick={() => setAuthState('login')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-purple-400">Kembali Login</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const displayWorkspace = activeWorkspace || MOCK_WORKSPACES[0];
  const fontSizeClass = fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-lg' : 'text-sm';

  return (
    <div className={`min-h-screen bg-[#FDFDFD] text-gray-900 ${fontSizeClass}`}>
      {devNotif && (
        <TopNotification 
          primaryColor="blue"
          senderName="New Approval Request"
          messageText={`${devNotif.name} ingin bergabung.`}
          onClose={() => setDevNotif(null)}
          onClick={() => { setActiveTab('devPortal'); setDevNotif(null); }}
          actionButton={
            <button 
              onClick={(e) => { e.stopPropagation(); handleRegistrationAction(devNotif.id, 'approved'); }}
              className="px-4 py-2 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 shadow-sm"
            >
              Approve Now
            </button>
          }
        />
      )}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} primaryColorHex={primaryColorHex} onLogout={handleLogout} user={user} appLogo={customLogo} />
      <main className="ml-72 p-12 min-h-screen">
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <button className="p-3 rounded-2xl bg-white border border-gray-100 shadow-sm relative"><Bell size={18} className="text-gray-400" /></button>
            <div>
              <h2 className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{displayWorkspace.name}</h2>
              <p className="text-xl font-black text-gray-900 capitalize tracking-tight mt-0.5">{activeTab.replace(/([A-Z])/g, ' $1')}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isSyncing ? 'bg-blue-50 text-blue-400' : 'bg-emerald-50 text-emerald-400'}`}>
                {isSyncing ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
                {isSyncing ? 'Cloud Syncing...' : (dbSourceUrl ? 'Cloud Connected' : 'Local Only')}
             </div>
             <div className="text-right">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-end gap-1.5"><CheckCircle size={10} /> Active Session</p>
                <p className="text-[9px] text-gray-200 font-bold uppercase tracking-wider mt-0.5">UID: {user.id}</p>
             </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard primaryColor={displayWorkspace.color} />}
          {activeTab === 'contentPlan' && <ContentPlan onSaveInsight={(i) => setAnalyticsData([i, ...analyticsData])} primaryColorHex={primaryColorHex} users={allUsers} />}
          {activeTab === 'calendar' && <Calendar primaryColor={displayWorkspace.color} />}
          {activeTab === 'ads' && <AdsWorkspace primaryColor={displayWorkspace.color} />}
          {activeTab === 'analytics' && <Analytics analyticsData={analyticsData} onSaveInsight={(i) => setAnalyticsData([i, ...analyticsData])} primaryColorHex={primaryColorHex} />}
          {activeTab === 'tracker' && <LinkTracker onSaveManualInsight={(i) => setAnalyticsData([i, ...analyticsData])} primaryColorHex={primaryColorHex} />}
          {activeTab === 'team' && (
            <Team 
              primaryColor={displayWorkspace.color} 
              currentUser={user} 
              workspace={displayWorkspace} 
              onUpdateWorkspace={(n, c) => setActiveWorkspace({ ...displayWorkspace, name: n, color: c })} 
              addSystemNotification={() => {}}
              allUsers={allUsers}
              setUsers={setAllUsers}
              setWorkspace={setActiveWorkspace}
            />
          )}
          {activeTab === 'profile' && <Profile user={user} primaryColor={displayWorkspace.color} setUser={setUser} />}
          {activeTab === 'settings' && <Settings primaryColorHex={primaryColorHex} setPrimaryColorHex={setPrimaryColorHex} accentColorHex={accentColorHex} setAccentColorHex={setAccentColorHex} fontSize={fontSize} setFontSize={setFontSize} customLogo={customLogo} setCustomLogo={setCustomLogo} dbSourceUrl={dbSourceUrl} setDbSourceUrl={(url) => { setDbSourceUrl(url); localStorage.setItem('sf_db_source', url); }} />}
          {activeTab === 'devPortal' && isDev && <DevPortal primaryColorHex={primaryColorHex} registrations={registrations} onRegistrationAction={handleRegistrationAction} users={allUsers} setUsers={setAllUsers} setRegistrations={setRegistrations} dbSourceUrl={dbSourceUrl} setDbSourceUrl={(url) => { setDbSourceUrl(url); localStorage.setItem('sf_db_source', url); }} onManualSync={() => syncWithCloud(true)} />}
        </div>
      </main>
      <ChatPopup primaryColor={displayWorkspace.color} currentUser={user} messages={messages} onSendMessage={(t) => setMessages([...messages, { id: Date.now().toString(), senderId: user!.id, text: t, timestamp: new Date().toISOString() }])} isOpen={isChatOpen} setIsOpen={setIsChatOpen} unreadCount={0} />
    </div>
  );
};

export default App;
