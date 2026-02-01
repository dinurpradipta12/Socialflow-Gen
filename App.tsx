
import React, { useState, useEffect } from 'react';
import { ThemeColor, Workspace, User, Message, SystemNotification, PostInsight } from './types';
import { MOCK_WORKSPACES, MOCK_USERS, THEME_COLORS, DEV_CREDENTIALS, MOCK_MESSAGES } from './constants';
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
import { Mail, Lock, Loader2, CheckCircle, Bell, X, Shield, ArrowRight, UserPlus } from 'lucide-react';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<'login' | 'register' | 'authenticated'>('login');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [primaryColorHex, setPrimaryColorHex] = useState('#BFDBFE'); // Pastel Blue
  const [accentColorHex, setAccentColorHex] = useState('#DDD6FE'); // Pastel Purple
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  const [analyticsData, setAnalyticsData] = useState<PostInsight[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(MOCK_WORKSPACES[0]);
  const [user, setUser] = useState<User | null>(null);

  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
  const [showSystemNotifs, setShowSystemNotifs] = useState(false);

  const [email, setEmail] = useState('dev@snaillabs.id');
  const [password, setPassword] = useState('dev_snaillabs_2025');

  // Registration states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', primaryColorHex);
    document.documentElement.style.setProperty('--accent-color', accentColorHex);
  }, [primaryColorHex, accentColorHex]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      let loggedInUser = MOCK_USERS.find(u => u.email === email);
      if (email === DEV_CREDENTIALS.email && password === DEV_CREDENTIALS.password) {
        loggedInUser = MOCK_USERS.find(u => u.role === 'developer');
      }
      if (loggedInUser) {
        setUser(loggedInUser);
        setAuthState('authenticated');
      } else {
        alert('Akses Ditolak: Periksa kembali email dan password Anda.');
      }
      setLoading(false);
    }, 1200);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      alert(`Permintaan pendaftaran untuk ${regName} telah dikirim ke developer untuk persetujuan lisensi.`);
      setAuthState('login');
      setLoading(false);
    }, 1500);
  };

  const handleLogout = () => {
    setAuthState('login');
    setUser(null);
  };

  if (authState !== 'authenticated' || !user) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-['Inter']">
        <div className="max-w-[400px] w-full bg-white rounded-[2rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)] p-10 space-y-8 border border-gray-100 z-10 animate-slide">
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-blue-100 text-blue-500 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black shadow-sm">
              SF
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">Socialflow Workspace</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Snaillabs Analyze Tracker</p>
            </div>
          </div>

          {authState === 'login' ? (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-3">
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-400 transition-colors" size={16} />
                    <input 
                      type="email" required value={email} onChange={(e) => setEmail(e.target.value)} 
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 placeholder-gray-300 focus:bg-white focus:border-blue-200 transition-all text-sm" 
                      placeholder="Email Address" 
                    />
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-400 transition-colors" size={16} />
                    <input 
                      type="password" required value={password} onChange={(e) => setPassword(e.target.value)} 
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 placeholder-gray-300 focus:bg-white focus:border-blue-200 transition-all text-sm" 
                      placeholder="Password" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" disabled={loading} 
                  className="w-full py-4 bg-blue-400 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-blue-500 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <>Masuk Dashboard <ArrowRight size={14} /></>}
                </button>
              </form>
              <div className="text-center pt-2">
                <button onClick={() => setAuthState('register')} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-400 transition-colors">
                  Belum punya akses? Daftar di sini
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4 animate-slide">
               <div className="space-y-3">
                  <input 
                    type="text" required value={regName} onChange={(e) => setRegName(e.target.value)} 
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 placeholder-gray-300 focus:bg-white focus:border-blue-200 transition-all text-sm" 
                    placeholder="Nama Lengkap" 
                  />
                  <input 
                    type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} 
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 placeholder-gray-300 focus:bg-white focus:border-blue-200 transition-all text-sm" 
                    placeholder="Email" 
                  />
                  <input 
                    type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} 
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 placeholder-gray-300 focus:bg-white focus:border-blue-200 transition-all text-sm" 
                    placeholder="Password" 
                  />
               </div>
               <button 
                  type="submit" disabled={loading} 
                  className="w-full py-4 bg-purple-400 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-purple-500 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-100"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <>Daftar Akses Tim <UserPlus size={14} /></>}
                </button>
                <div className="text-center pt-2">
                  <button onClick={() => setAuthState('login')} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-purple-400 transition-colors">
                    Sudah punya akun? Kembali login
                  </button>
                </div>
            </form>
          )}

          <div className="pt-4 text-center">
            <p className="text-[9px] text-gray-200 font-black uppercase tracking-widest">© 2025 SNAILLABS.ID</p>
          </div>
        </div>
      </div>
    );
  }

  const isDev = user.role === 'developer';
  const fontSizeClass = fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-lg' : 'text-sm';

  const renderContent = () => {
    if (activeTab === 'settings' && !isDev && user.role !== 'admin' && user.role !== 'superuser') {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-10 bg-white rounded-[3rem] animate-slide border border-gray-50">
          <Shield size={48} className="text-gray-200 mb-4" />
          <p className="text-xs font-black text-gray-900 uppercase tracking-widest">Access Restricted</p>
          <p className="text-[10px] text-gray-400 font-bold mt-1">Hanya Administrator yang memiliki izin konfigurasi.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard primaryColor={activeWorkspace.color} />;
      case 'contentPlan': return <ContentPlan onSaveInsight={(i) => setAnalyticsData([i, ...analyticsData])} primaryColorHex={primaryColorHex} />;
      case 'calendar': return <Calendar primaryColor={activeWorkspace.color} />;
      case 'ads': return <AdsWorkspace primaryColor={activeWorkspace.color} />;
      case 'analytics': return <Analytics analyticsData={analyticsData} onSaveInsight={(i) => setAnalyticsData([i, ...analyticsData])} primaryColorHex={primaryColorHex} />;
      case 'tracker': return <LinkTracker onSaveManualInsight={(i) => setAnalyticsData([i, ...analyticsData])} primaryColorHex={primaryColorHex} />;
      case 'team': return <Team primaryColor={activeWorkspace.color} currentUser={user} addSystemNotification={(n) => setSystemNotifications([ {...n, id: Date.now().toString(), timestamp: new Date().toISOString(), read: false}, ...systemNotifications])} />;
      case 'profile': return <Profile user={user} primaryColor={activeWorkspace.color} setUser={setUser} />;
      case 'settings': return (
        <Settings 
          primaryColorHex={primaryColorHex} setPrimaryColorHex={setPrimaryColorHex}
          accentColorHex={accentColorHex} setAccentColorHex={setAccentColorHex}
          fontSize={fontSize} setFontSize={setFontSize}
          customLogo={customLogo} setCustomLogo={setCustomLogo}
        />
      );
      case 'devPortal': return isDev ? <DevPortal primaryColorHex={primaryColorHex} /> : <Dashboard primaryColor={activeWorkspace.color} />;
      default: return <Dashboard primaryColor={activeWorkspace.color} />;
    }
  };

  return (
    <div className={`min-h-screen bg-[#FDFDFD] text-gray-900 ${fontSizeClass}`}>
      <Sidebar 
        activeTab={activeTab} setActiveTab={setActiveTab} 
        primaryColorHex={primaryColorHex} onLogout={handleLogout}
        user={user} appLogo={customLogo}
      />

      <main className="ml-72 p-12 min-h-screen">
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSystemNotifs(!showSystemNotifs)} className="p-3 rounded-2xl bg-white border border-gray-100 shadow-sm relative active:scale-90 transition-all">
              <Bell size={18} className="text-gray-400" />
              {systemNotifications.filter(n => !n.read).length > 0 && (
                <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-300 rounded-full border-2 border-white"></div>
              )}
            </button>
            <div>
              <h2 className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{activeWorkspace.name}</h2>
              <p className="text-xl font-black text-gray-900 capitalize tracking-tight mt-0.5">
                {activeTab.replace(/([A-Z])/g, ' $1')}
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center justify-end gap-1.5">
                  <CheckCircle size={10} /> Active Member
                </p>
                <p className="text-[9px] text-gray-200 font-bold uppercase tracking-wider mt-0.5">ID: {user.id.padStart(4, '0')}</p>
             </div>
          </div>
        </header>

        {showSystemNotifs && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-200/20 backdrop-blur-sm" onClick={() => setShowSystemNotifs(false)}></div>
            <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden animate-slide">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Notifikasi</h3>
                <button onClick={() => setShowSystemNotifs(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><X size={18}/></button>
              </div>
              <div className="max-h-[50vh] overflow-y-auto p-6 space-y-3 custom-scrollbar">
                {systemNotifications.length > 0 ? systemNotifications.map(n => (
                  <div key={n.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{n.title}</p>
                    <p className="text-[10px] text-gray-500 mt-1 font-medium">{n.message}</p>
                  </div>
                )) : (
                  <div className="text-center py-10">
                    <p className="text-[10px] text-gray-200 font-black uppercase tracking-widest">Tidak ada pesan baru</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>

      <ChatPopup 
        primaryColor={activeWorkspace.color} currentUser={user} 
        messages={messages} onSendMessage={(t) => setMessages([...messages, {id: Date.now().toString(), senderId: user!.id, text: t, timestamp: new Date().toISOString()}])}
        isOpen={isChatOpen} setIsOpen={setIsChatOpen} unreadCount={0}
      />
    </div>
  );
};

export default App;
