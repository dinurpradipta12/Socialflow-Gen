
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
import { LogIn, Mail, Lock, Loader2, CheckCircle, Bell, X, Shield } from 'lucide-react';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<'login' | 'register' | 'authenticated'>('login');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Theme state
  const [primaryColorHex, setPrimaryColorHex] = useState('#2563eb');
  const [accentColorHex, setAccentColorHex] = useState('#6366f1');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [darkMode, setDarkMode] = useState(false);
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

  // Sync Global Styles & Theme
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', primaryColorHex);
    document.documentElement.style.setProperty('--accent-color', accentColorHex);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [primaryColorHex, accentColorHex, darkMode]);

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
        alert('User tidak ditemukan.');
      }
      setLoading(false);
    }, 1200);
  };

  const handleLogout = () => {
    setAuthState('login');
    setUser(null);
  };

  // Safe check to prevent "Cannot read property of null"
  if (authState !== 'authenticated' || !user) {
    return (
      <div className="min-h-screen bg-[#fcfcfd] flex items-center justify-center p-6 overflow-hidden">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-12 space-y-8 border border-gray-50 z-10">
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-[var(--primary-color)] rounded-3xl mx-auto flex items-center justify-center text-white text-4xl font-black shadow-2xl">
              SF
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Socialflow</h1>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">Analyze Tracker by Snaillabs.id</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700" placeholder="Email" />
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700" placeholder="Password" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 bg-[var(--primary-color)] text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all">
              {loading ? <Loader2 size={22} className="animate-spin mx-auto" /> : 'Masuk Sekarang'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isDev = user.role === 'developer';
  const fontSizeClass = fontSize === 'small' ? 'text-xs' : fontSize === 'large' ? 'text-lg' : 'text-sm';

  const renderContent = () => {
    if (activeTab === 'settings' && !isDev && user.role !== 'admin' && user.role !== 'superuser') {
      return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-10 bg-white dark:bg-slate-900 rounded-[3rem]">
          <Shield size={64} className="text-gray-200 dark:text-slate-800 mb-6" />
          <p className="text-sm font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">Akses Terbatas</p>
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
          darkMode={darkMode} setDarkMode={setDarkMode}
          customLogo={customLogo} setCustomLogo={setCustomLogo}
        />
      );
      case 'devPortal': return isDev ? <DevPortal primaryColorHex={primaryColorHex} /> : <Dashboard primaryColor={activeWorkspace.color} />;
      default: return <Dashboard primaryColor={activeWorkspace.color} />;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-[#fcfcfd] text-gray-900'} ${fontSizeClass} transition-colors duration-500`}>
      <Sidebar 
        activeTab={activeTab} setActiveTab={setActiveTab} 
        primaryColorHex={primaryColorHex} onLogout={handleLogout}
        user={user} appLogo={customLogo}
        darkMode={darkMode}
      />

      <main className="ml-72 p-10 min-h-screen">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <button onClick={() => setShowSystemNotifs(!showSystemNotifs)} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm relative active:scale-90">
              <Bell size={20} className="text-gray-400 dark:text-slate-500" />
              {systemNotifications.filter(n => !n.read).length > 0 && (
                <div className="absolute top-2.5 right-2.5 w-3 h-3 bg-rose-500 rounded-full ring-4 ring-white dark:ring-slate-900"></div>
              )}
            </button>
            <div>
              <h2 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{activeWorkspace.name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                 <div className="w-2 h-2 rounded-full bg-[var(--primary-color)] shadow-lg shadow-blue-200"></div>
                 <p className="text-2xl font-black dark:text-white capitalize tracking-tight leading-none">
                   {activeTab === 'devPortal' ? 'Developer Portal' : activeTab.replace(/([A-Z])/g, ' $1')}
                 </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 leading-none">
                 <CheckCircle size={10} /> Active Member
               </p>
               <p className="text-[10px] text-gray-400 dark:text-slate-500 font-black mt-1 uppercase tracking-widest">Exp: {user.subscriptionExpiry || '2025-12-31'}</p>
            </div>
          </div>
        </header>

        {showSystemNotifs && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-xl p-6">
            <div className="absolute inset-0" onClick={() => setShowSystemNotifs(false)}></div>
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden">
              <div className="p-8 border-b border-gray-50 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-black dark:text-white">Notifikasi</h3>
                <button onClick={() => setShowSystemNotifs(false)} className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl"><X size={20}/></button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-6 space-y-4">
                {systemNotifications.length > 0 ? systemNotifications.map(n => (
                  <div key={n.id} className="p-5 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                    <p className="text-xs font-black dark:text-white">{n.title}</p>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 font-medium">{n.message}</p>
                  </div>
                )) : <p className="text-center py-10 text-gray-300 font-black uppercase text-xs">Kosong</p>}
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
