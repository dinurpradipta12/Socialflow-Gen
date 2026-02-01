
import React, { useState, useEffect } from 'react';
import { ThemeColor, Workspace, User, Message, SystemNotification, PostInsight, RegistrationRequest } from './types';
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
import { Mail, Lock, Loader2, CheckCircle, Bell, X, Shield, ArrowRight, UserPlus, Eye, EyeOff } from 'lucide-react';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<'login' | 'register' | 'authenticated'>('login');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPassword, setShowPassword] = useState(false);
  
  const [primaryColorHex, setPrimaryColorHex] = useState('#BFDBFE'); // Pastel Blue
  const [accentColorHex, setAccentColorHex] = useState('#DDD6FE'); // Pastel Purple
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  const [analyticsData, setAnalyticsData] = useState<PostInsight[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(MOCK_WORKSPACES[0]);
  
  // App-level "Database" State
  const [allUsers, setAllUsers] = useState<User[]>(MOCK_USERS);
  const [user, setUser] = useState<User | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>(MOCK_REGISTRATIONS);

  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [systemNotifications, setSystemNotifications] = useState<SystemNotification[]>([]);
  const [showSystemNotifs, setShowSystemNotifs] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  // Field login kosong saat pertama kali tampil
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
      // Prioritas 1: Cek Kredensial Developer
      if (email === DEV_CREDENTIALS.email && password === DEV_CREDENTIALS.password) {
        const devUser = allUsers.find(u => u.role === 'developer');
        if (devUser) {
          setUser(devUser);
          setAuthState('authenticated');
          setLoading(false);
          return;
        }
      }

      // Prioritas 2: Cek di database user (termasuk yang baru di-approve)
      const loggedInUser = allUsers.find(u => u.email === email);
      
      // Catatan: Karena ini sistem mock, kita asumsikan password valid jika user ditemukan
      if (loggedInUser) {
        setUser(loggedInUser);
        setAuthState('authenticated');
      } else {
        alert('Akses Ditolak: Akun tidak ditemukan atau belum disetujui oleh Developer. Pastikan email dan password benar.');
      }
      setLoading(false);
    }, 1200);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const newReg: RegistrationRequest = {
        id: Date.now().toString(),
        name: regName,
        email: regEmail,
        password: regPassword,
        timestamp: new Date().toLocaleString(),
        status: 'pending'
      };
      
      // Simpan ke database pendaftaran (agar muncul di Dev Portal)
      setRegistrations(prev => [newReg, ...prev]);
      
      alert(`Pendaftaran berhasil! Data Anda telah dikirim ke tim Developer. Silakan tunggu verifikasi agar dapat login.`);
      setAuthState('login');
      setLoading(false);
      setRegName(''); setRegEmail(''); setRegPassword('');
    }, 1500);
  };

  const handleRegistrationAction = (regId: string, status: 'approved' | 'rejected') => {
    setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, status } : r));
    
    if (status === 'approved') {
      const reg = registrations.find(r => r.id === regId);
      if (reg) {
        // Buat user baru di database aplikasi
        const newUser: User = {
          id: (allUsers.length + 1).toString(),
          name: reg.name,
          email: reg.email,
          role: 'editor',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${reg.email}`,
          permissions: {
            dashboard: true,
            calendar: true,
            ads: true,
            analytics: true,
            tracker: true,
            team: true,
            settings: false,
            contentPlan: true,
          },
          isSubscribed: true,
          subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          jobdesk: 'Social Media Specialist',
          kpi: [],
          activityLogs: [],
          performanceScore: 0
        };
        setAllUsers(prev => [...prev, newUser]);
      }
    }
  };

  const updateWorkspace = (name: string, color: ThemeColor) => {
    setActiveWorkspace(prev => ({ ...prev, name, color }));
  };

  const handleSendMessage = (text: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), senderId: user!.id, text, timestamp: new Date().toISOString() }]);
    setTimeout(() => {
      setIsOtherUserTyping(true);
      setTimeout(() => {
        setIsOtherUserTyping(false);
        setMessages(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          senderId: 'dev-1', 
          text: 'Pesan Anda telah kami terima. Tim Socialflow akan segera memprosesnya.', 
          timestamp: new Date().toISOString() 
        }]);
      }, 2500);
    }, 800);
  };

  const handleLogout = () => {
    setAuthState('login');
    setUser(null);
    setEmail('');
    setPassword('');
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
                      type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} 
                      className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 placeholder-gray-300 focus:bg-white focus:border-blue-200 transition-all text-sm" 
                      placeholder="Password" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-900 transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
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
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} 
                      className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-xl outline-none font-bold text-gray-700 placeholder-gray-300 focus:bg-white focus:border-blue-200 transition-all text-sm pr-12" 
                      placeholder="Password" 
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-900 transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
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
      case 'contentPlan': return <ContentPlan onSaveInsight={(i) => setAnalyticsData([i, ...analyticsData])} primaryColorHex={primaryColorHex} users={allUsers} />;
      case 'calendar': return <Calendar primaryColor={activeWorkspace.color} />;
      case 'ads': return <AdsWorkspace primaryColor={activeWorkspace.color} />;
      case 'analytics': return <Analytics analyticsData={analyticsData} onSaveInsight={(i) => setAnalyticsData([i, ...analyticsData])} primaryColorHex={primaryColorHex} />;
      case 'tracker': return <LinkTracker onSaveManualInsight={(i) => setAnalyticsData([i, ...analyticsData])} primaryColorHex={primaryColorHex} />;
      case 'team': return <Team primaryColor={activeWorkspace.color} currentUser={user} workspace={activeWorkspace} onUpdateWorkspace={updateWorkspace} addSystemNotification={(n) => setSystemNotifications([ {...n, id: Date.now().toString(), timestamp: new Date().toISOString(), read: false}, ...systemNotifications])} />;
      case 'profile': return <Profile user={user} primaryColor={activeWorkspace.color} setUser={setUser} />;
      case 'settings': return (
        <Settings 
          primaryColorHex={primaryColorHex} setPrimaryColorHex={setPrimaryColorHex}
          accentColorHex={accentColorHex} setAccentColorHex={setAccentColorHex}
          fontSize={fontSize} setFontSize={setFontSize}
          customLogo={customLogo} setCustomLogo={setCustomLogo}
        />
      );
      case 'devPortal': return isDev ? (
        <DevPortal 
          primaryColorHex={primaryColorHex} 
          registrations={registrations} 
          onRegistrationAction={handleRegistrationAction}
          users={allUsers}
          setUsers={setAllUsers}
        />
      ) : <Dashboard primaryColor={activeWorkspace.color} />;
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
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm" onClick={() => setShowSystemNotifs(false)}></div>
            <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden animate-slide">
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
        messages={messages} onSendMessage={handleSendMessage}
        isOpen={isChatOpen} setIsOpen={setIsChatOpen} unreadCount={0}
        isTyping={isOtherUserTyping}
      />
    </div>
  );
};

export default App;
