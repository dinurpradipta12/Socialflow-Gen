
import React, { useState, useEffect, useCallback } from 'react';
import { ThemeColor, Workspace, User, Message, PostInsight, RegistrationRequest } from './types';
import { MOCK_WORKSPACES, MOCK_USERS, DEV_CREDENTIALS, SUPABASE_CONFIG } from './constants';
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
import { databaseService } from './services/databaseService';
import { Loader2, Database, Cloud, Globe, Menu, ShieldCheck, Wifi, WifiOff, ArrowRight, Lock, AlertCircle, Phone, Eye, EyeOff, AlertTriangle, Save, CheckCircle, UserPlus, ChevronLeft } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // States for Change Password Logic
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [tempLoginUser, setTempLoginUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Login Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration Form
  const [regData, setRegData] = useState({ name: '', email: '', password: '', whatsapp: '', reason: '' });
  const [regSuccess, setRegSuccess] = useState(false);

  const [primaryColorHex, setPrimaryColorHex] = useState('#BFDBFE');
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>([]);
  const [analyticsData, setAnalyticsData] = useState<PostInsight[]>(() => {
    const saved = localStorage.getItem('sf_analytics_db');
    return saved ? JSON.parse(saved) : [];
  });

  // Helper untuk mendapatkan config database (Prioritas: LocalStorage -> Default Constant)
  const getDbConfig = () => {
    return {
      url: localStorage.getItem('sf_db_url') || SUPABASE_CONFIG.url,
      key: localStorage.getItem('sf_db_key') || SUPABASE_CONFIG.key
    };
  };

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
    await cloudService.updateRegistrationStatus(regId, status);
    await fetchCloudData();
    setLoading(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);

    const dbConfig = getDbConfig();

    if (!dbConfig.url || !dbConfig.key) {
        setLoginError("Konfigurasi Database Error. Hubungi Developer.");
        setLoading(false);
        return;
    }

    try {
        await databaseService.createRegistration(dbConfig, regData);
        setRegSuccess(true);
    } catch (error) {
        console.error(error);
        setLoginError("Gagal mengirim data ke Supabase. Pastikan koneksi internet stabil.");
    } finally {
        setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Developer Login Bypass
    if (cleanEmail === DEV_CREDENTIALS.email.toLowerCase() && cleanPassword === DEV_CREDENTIALS.password) {
        const devUser = MOCK_USERS.find(u => u.role === 'developer');
        if (devUser) {
            setUser(devUser);
            localStorage.setItem('sf_session_user', JSON.stringify(devUser));
            setAuthState('authenticated');
        }
        setLoading(false);
        return;
    }

    // 1. Siapkan User Variable
    let targetUser = allUsers.find(u => u.email.trim().toLowerCase() === cleanEmail);
    
    // 2. SELALU Cek Database Cloud (Menggunakan Default Config)
    const dbConfig = getDbConfig();

    if (dbConfig.url && dbConfig.key) {
        try {
            const remoteUser = await databaseService.getUserByEmail(dbConfig, cleanEmail);
            
            if (remoteUser) {
                // Jika user ditemukan di cloud, kita prioritaskan data cloud (terutama Password & Status)
                if (targetUser) {
                    // Update user lokal dengan data terbaru dari cloud
                    targetUser = { ...targetUser, ...remoteUser };
                    
                    // Update state global agar data lokal tersinkronisasi
                    setAllUsers(prev => prev.map(u => u.email === cleanEmail ? targetUser! : u));
                } else {
                    // Jika user baru login pertama kali di device ini
                    targetUser = remoteUser;
                    setAllUsers(prev => [...prev, remoteUser]);
                }
            }
        } catch (err) {
            console.error("Gagal sinkronisasi user cloud:", err);
            // Lanjut menggunakan data local storage jika ada
        }
    }

    // 3. Validasi Password
    setTimeout(() => {
        if (!targetUser) {
            setLoginError("Email belum terdaftar dalam sistem.");
            setLoading(false);
            return;
        }

        // Logic cek password: 
        // 1. Cek match persis
        // 2. Jika password di DB kosong/null, gunakan default 'Social123'
        const dbPassword = targetUser.password || 'Social123';
        const isPasswordCorrect = dbPassword === cleanPassword;

        if (isPasswordCorrect) {
            // Cek Status Akun
            if (targetUser.status === 'suspended') {
                 setLoginError("Akun ini telah ditangguhkan. Hubungi Admin.");
                 setLoading(false);
                 return;
            }

            if (targetUser.requiresPasswordChange) {
                setTempLoginUser(targetUser);
                setIsChangePasswordOpen(true);
            } else {
                setUser(targetUser);
                localStorage.setItem('sf_session_user', JSON.stringify(targetUser));
                
                // Cek Subscription
                const today = new Date();
                if (targetUser.subscriptionExpiry && today > new Date(targetUser.subscriptionExpiry) && targetUser.role !== 'developer') {
                    setAuthState('expired');
                } else {
                    setAuthState('authenticated');
                }
            }
        } else {
            setLoginError("Security Code (Password) salah.");
        }
        setLoading(false);
    }, 800);
  };

  const handleFinalizePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Konfirmasi password tidak cocok!");
      return;
    }
    if (newPassword.length < 6) {
      alert("Password minimal 6 karakter.");
      return;
    }

    if (tempLoginUser) {
      const updatedUser: User = {
         ...tempLoginUser,
         password: newPassword,
         requiresPasswordChange: false,
         status: 'active'
      };

      const updatedAllUsers = allUsers.map(u => u.id === tempLoginUser.id ? updatedUser : u);
      setAllUsers(updatedAllUsers);
      
      // Sync update password back to DB
      const dbConfig = getDbConfig();
      if (dbConfig.url && dbConfig.key) {
         databaseService.upsertUser(dbConfig, updatedUser);
      }
      
      setUser(updatedUser);
      localStorage.setItem('sf_session_user', JSON.stringify(updatedUser));
      setAuthState('authenticated');
      
      setIsChangePasswordOpen(false);
      setTempLoginUser(null);
    }
  };

  const saveAnalytics = (insight: PostInsight | PostInsight[]) => {
    const updated = Array.isArray(insight) ? [...insight, ...analyticsData] : [insight, ...analyticsData];
    setAnalyticsData(updated);
    localStorage.setItem('sf_analytics_db', JSON.stringify(updated));
  };

  const isDev = user?.role === 'developer';
  const activeWorkspace = MOCK_WORKSPACES[0];

  // --- Change Password Modal UI ---
  if (isChangePasswordOpen && tempLoginUser) {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 space-y-8 border border-gray-100 animate-slide">
           {/* ... existing password change UI ... */}
           <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-blue-100">
                 <Lock size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Setup Password Baru</h1>
                <p className="text-gray-400 text-sm font-medium mt-1">Demi keamanan, silakan ganti password bawaan Anda sebelum melanjutkan.</p>
              </div>
           </div>

           <form onSubmit={handleFinalizePasswordChange} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">Password Baru</label>
                 <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" placeholder="Min 6 karakter" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 ml-4 tracking-widest">Konfirmasi Password</label>
                 <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-900 focus:bg-white focus:ring-4 focus:ring-blue-50 transition-all" placeholder="Ulangi password" />
              </div>
              
              <button type="submit" className="w-full py-6 bg-blue-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                 <CheckCircle size={18} /> Simpan & Masuk
              </button>
           </form>
        </div>
      </div>
    );
  }

  if (authState === 'expired') {
     return (
        <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-sans">
           <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-12 text-center space-y-8 border border-rose-50 animate-slide">
              {/* ... existing expired UI ... */}
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

  if (authState === 'register') {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 font-sans">
        <div className="max-w-[480px] w-full bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] p-10 md:p-14 space-y-8 border border-gray-100 animate-slide">
          <button onClick={() => { setAuthState('login'); setRegSuccess(false); setLoginError(null); }} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 text-xs font-black uppercase tracking-widest transition-colors">
            <ChevronLeft size={16} /> Kembali ke Login
          </button>

          <div className="space-y-4">
             <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-white text-2xl font-black bg-gray-900 shadow-xl shadow-gray-200">SF</div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tighter">New Registration</h1>
             <p className="text-gray-400 font-medium text-sm">Data Anda akan masuk ke <b>Database Monitoring</b> untuk diverifikasi oleh Admin.</p>
          </div>

          {regSuccess ? (
            <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 text-center space-y-4 animate-slide">
              <div className="w-16 h-16 bg-white text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-md"><CheckCircle size={32}/></div>
              <h3 className="text-xl font-black text-gray-900">Registrasi Terkirim!</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Admin akan memverifikasi data Anda melalui Aplikasi Monitoring. Silakan tunggu konfirmasi via WhatsApp/Email.</p>
              <button onClick={() => { setAuthState('login'); setRegSuccess(false); }} className="w-full py-4 bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl mt-4">Kembali ke Login</button>
            </div>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-5">
              {loginError && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-slide">
                   <AlertTriangle size={18} className="text-rose-500 shrink-0" />
                   <p className="text-[11px] font-bold text-rose-600 leading-tight">{loginError}</p>
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Nama Lengkap</label>
                 <input type="text" required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 focus:bg-white focus:ring-4 focus:ring-gray-100 transition-all text-sm" placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Email Address</label>
                 <input type="email" required value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 focus:bg-white focus:ring-4 focus:ring-gray-100 transition-all text-sm" placeholder="user@example.com" />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Password Login</label>
                 <div className="relative">
                    <input 
                      type={showRegPassword ? "text" : "password"}
                      required 
                      value={regData.password} 
                      onChange={e => setRegData({...regData, password: e.target.value})} 
                      className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 focus:bg-white focus:ring-4 focus:ring-gray-100 transition-all text-sm" 
                      placeholder="Min 6 Karakter" 
                    />
                    <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors">
                       {showRegPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">WhatsApp</label>
                 <input type="text" required value={regData.whatsapp} onChange={e => setRegData({...regData, whatsapp: e.target.value})} className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 focus:bg-white focus:ring-4 focus:ring-gray-100 transition-all text-sm" placeholder="62812xxx" />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Alasan Bergabung</label>
                 <input type="text" required value={regData.reason} onChange={e => setRegData({...regData, reason: e.target.value})} className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 focus:bg-white focus:ring-4 focus:ring-gray-100 transition-all text-sm" placeholder="Untuk manajemen konten..." />
              </div>

              <button type="submit" disabled={loading} className="w-full py-6 bg-gray-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-2xl shadow-gray-200 active:scale-95 transition-all flex items-center justify-center gap-3">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <>Kirim Data Registrasi <ArrowRight size={16}/></>}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (authState === 'login') {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 font-sans">
        <div className="max-w-[440px] w-full bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] p-10 md:p-14 space-y-12 border border-gray-100 animate-slide">
          <div className="text-center space-y-4">
             <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white text-2xl font-black bg-blue-500 shadow-xl shadow-blue-200">SF</div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Socialflow</h1>
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                <ShieldCheck size={12} className="text-blue-500"/> Closed System Core V3.7.0
             </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {loginError && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-slide">
                 <AlertTriangle size={18} className="text-rose-500 shrink-0" />
                 <p className="text-[11px] font-bold text-rose-600 leading-tight">{loginError}</p>
              </div>
            )}

            <div className="space-y-2">
               <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Email Address</label>
               <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={`w-full px-7 py-5 bg-gray-50 border rounded-2xl outline-none font-bold text-gray-700 transition-all text-sm ${loginError && loginError.includes("Email") ? 'border-rose-200 focus:ring-rose-50' : 'border-gray-100 focus:bg-white focus:ring-4 focus:ring-blue-50'}`} placeholder="user@snaillabs.id" />
            </div>
            
            <div className="space-y-2">
               <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Security Code</label>
               <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required value={password} onChange={e => setPassword(e.target.value)} 
                    className={`w-full px-7 py-5 bg-gray-50 border rounded-2xl outline-none font-bold text-gray-700 transition-all text-sm ${loginError && loginError.includes("Code") ? 'border-rose-200 focus:ring-rose-50' : 'border-gray-100 focus:bg-white focus:ring-4 focus:ring-blue-50'}`} 
                    placeholder="••••••••" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors">
                     {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
               </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-6 bg-blue-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-2xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <>Access System <ArrowRight size={16}/></>}
            </button>
            
            <div className="pt-2 text-center">
               <button type="button" onClick={() => { setAuthState('register'); setLoginError(null); }} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-500 transition-colors">
                 Register New Account
               </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ... (Main App Render remain same)
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
           <h2 className="text-sm font-black text-gray-900 tracking-tighter uppercase">{isDev ? 'Developer Access' : 'Socialflow Hub'}</h2>
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
