
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
import { LogIn, Mail, Lock, Loader2, CheckCircle, Bell, X, Shield, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<'login' | 'register' | 'authenticated'>('login');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Customization state
  const [primaryColorHex, setPrimaryColorHex] = useState('#2563eb');
  const [accentColorHex, setAccentColorHex] = useState('#6366f1');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  // Data Integration
  const [analyticsData, setAnalyticsData] = useState<PostInsight[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(MOCK_WORKSPACES[0]);
  const [user, setUser] = useState<User | null>(null);

  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notification, setNotification] = useState<{ sender: string, text: string } | null>(null);
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
  const [showSystemNotifs, setShowSystemNotifs] = useState(false);

  const [email, setEmail] = useState('dev@snaillabs.id');
  const [password, setPassword] = useState('dev_snaillabs_2025');

  // Sync Ambience Colors
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', primaryColorHex);
    document.documentElement.style.setProperty('--accent-color', accentColorHex);
    document.documentElement.classList.remove('dark');
  }, [primaryColorHex, accentColorHex]);

  const handleSaveAnalytics = (insight: PostInsight) => {
    setAnalyticsData(prev => [
      { ...insight, id: Date.now().toString(), timestamp: new Date().toISOString() },
      ...prev
    ]);
  };

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
        alert('User tidak ditemukan atau password salah.');
      }
      setLoading(false);
    }, 1500);
  };

  const handleLogout = () => {
    setAuthState('login');
    setUser(null);
  };

  if (authState !== 'authenticated' || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-['Inter']">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/5 blur-[120px] rounded-full"></div>
        </div>

        <div className="max-w-[440px] w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] p-12 space-y-10 border border-white/40 z-10 animate-slide">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-[var(--primary-color)] rounded-2xl mx-auto flex items-center justify-center text-white text-3xl font-black shadow-[0_20px_40px_-10px_var(--primary-color)] transition-transform hover:scale-105 duration-500">
              SF
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Selamat Datang</h1>
              <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[9px]">Analyze Tracker by Snaillabs.id</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[var(--primary-color)] transition-colors" size={18} />
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 placeholder-gray-300 focus:bg-white focus:border-[var(--primary-color)] transition-all" 
                  placeholder="Alamat Email" 
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[var(--primary-color)] transition-colors" size={18} />
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full pl-14 pr-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 placeholder-gray-300 focus:bg-white focus:border-[var(--primary-color)] transition-all" 
                  placeholder="Kata Sandi" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="group w-full py-4 bg-gray-900 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-xl hover:shadow-gray-200 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Masuk ke Dashboard
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 text-center">
            <p className="text-[10px] text-gray-300 font-black uppercase tracking-widest">Akses terbatas untuk tim Snaillabs</p>
          </div>
        </div>
      </div>
    );
  }

  const isDev = user.role === 'developer';
  const fontSizeClass = fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-lg' : 'text-sm';

  const renderContent = () => {
    // Permission guard
    if (activeTab === 'settings' && !isDev && user.role !== 'admin' && user.role !== 'superuser') {
      return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-10 bg-white rounded-[3rem] animate-slide">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6">
            <Shield size={40} />
          </div>
          <p className="text-sm font-black text-gray-900 uppercase tracking-widest">Akses Terbatas</p>
          <p className="text-xs text-gray-400 font-medium mt-2">Hanya administrator yang dapat mengubah pengaturan workspace.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard primaryColor={activeWorkspace.color} />;
      case 'contentPlan': return <ContentPlan onSaveInsight={handleSaveAnalytics} primaryColorHex={primaryColorHex} />;
      case 'calendar': return <Calendar primaryColor={activeWorkspace.color} />;
      case 'ads': return <AdsWorkspace primaryColor={activeWorkspace.color} />;
      case 'analytics': return <Analytics analyticsData={analyticsData} onSaveInsight={handleSaveAnalytics} primaryColorHex={primaryColorHex} />;
      case 'tracker': return <LinkTracker onSaveManualInsight={handleSaveAnalytics} primaryColorHex={primaryColorHex} />;
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
    <div className={`min-h-screen bg-[#FDFDFD] text-gray-900 ${fontSizeClass} transition-colors duration-500`}>
      <Sidebar 
        activeTab={activeTab} setActiveTab={setActiveTab} 
        primaryColorHex={primaryColorHex} onLogout={handleLogout}
        user={user} appLogo={customLogo}
      />

      <main className="ml-72 p-10 min-h-screen">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSystemNotifs(!showSystemNotifs)} className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-sm relative active:scale-90 transition-all hover:border-[var(--primary-color)]/20">
              <Bell size={20} className="text-gray-400" />
              {systemNotifications.filter(n => !n.read).length > 0 && (
                <div className="absolute top-2.5 right-2.5 w-3 h-3 bg-rose-500 rounded-full ring-4 ring-white"></div>
              )}
            </button>
            <div>
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{activeWorkspace.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                 <div className="w-2 h-2 rounded-full bg-[var(--primary-color)] shadow-lg shadow-blue-200"></div>
                 <p className="text-2xl font-black capitalize tracking-tight leading-none text-gray-900">
                   {activeTab === 'devPortal' ? 'Developer Portal' : activeTab.replace(/([A-Z])/g, ' $1')}
                 </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                 <CheckCircle size={12} /> Anggota Aktif
               </p>
               <p className="text-[10px] text-gray-400 font-black mt-1.5 uppercase tracking-widest">Lisensi Exp: {user.subscriptionExpiry || '2025-12-31'}</p>
            </div>
          </div>
        </header>

        {showSystemNotifs && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-gray-900/10 backdrop-blur-sm p-6">
            <div className="absolute inset-0" onClick={() => setShowSystemNotifs(false)}></div>
            <div className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden animate-slide">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-xl font-black text-gray-900">Notifikasi</h3>
                <button onClick={() => setShowSystemNotifs(false)} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm"><X size={20}/></button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {systemNotifications.length > 0 ? systemNotifications.map(n => (
                  <div key={n.id} className="p-5 bg-gray-50/50 rounded-2xl border border-gray-100 hover:bg-white transition-colors">
                    <p className="text-xs font-black text-gray-900">{n.title}</p>
                    <p className="text-[11px] text-gray-500 mt-1.5 font-medium leading-relaxed">{n.message}</p>
                  </div>
                )) : (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-12 h-12 bg-gray-50 rounded-full mx-auto flex items-center justify-center text-gray-200">
                      <Bell size={24} />
                    </div>
                    <p className="text-gray-300 font-black uppercase text-[10px] tracking-[0.2em]">Belum ada pemberitahuan</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {notification && (
        <TopNotification 
          primaryColor={activeWorkspace.color} senderName={notification.sender} messageText={notification.text}
          onClose={() => setNotification(null)} onClick={() => { setIsChatOpen(true); setNotification(null); }}
        />
      )}

      <ChatPopup 
        primaryColor={activeWorkspace.color} currentUser={user} 
        messages={messages} onSendMessage={(t) => setMessages([...messages, {id: Date.now().toString(), senderId: user!.id, text: t, timestamp: new Date().toISOString()}])}
        isOpen={isChatOpen} setIsOpen={setIsChatOpen} unreadCount={unreadCount}
      />
    </div>
  );
};

export default App;
