
import React, { useState, useEffect, useCallback } from 'react';
import { ThemeColor, Workspace, User, Message, PostInsight, RegistrationRequest } from './types';
import { MOCK_WORKSPACES, MOCK_USERS, DEV_CREDENTIALS } from './constants';
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
import { Loader2, Database, Cloud, Globe, Menu, ShieldCheck, Wifi, WifiOff, ArrowRight, Lock, AlertCircle, Phone, Eye, EyeOff, AlertTriangle, Save, CheckCircle, UserPlus } from 'lucide-react';

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
  
  const [authState, setAuthState] = useState<'login' | 'authenticated' | 'expired'>(user ? 'authenticated' : 'login');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // States for Change Password Logic
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [tempLoginUser, setTempLoginUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  
  const [primaryColorHex, setPrimaryColorHex] = useState('#BFDBFE');
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>(() => {
    const saved = localStorage.getItem('sf_registrations_db');
    return saved ? JSON.parse(saved) : [];
  });
  const [analyticsData, setAnalyticsData] = useState<PostInsight[]>(() => {
    const saved = localStorage.getItem('sf_analytics_db');
    return saved ? JSON.parse(saved) : [];
  });

  // Registration Form State
  const [registerForm, setRegisterForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    whatsapp: '',
    handle: '',
    niche: '',
    reason: ''
  });
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);

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

  useEffect(() => {
    localStorage.setItem('sf_registrations_db', JSON.stringify(registrations));
  }, [registrations]);

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
    // Legacy support for queue logic if needed, otherwise this is less used now
    setLoading(true);
    await cloudService.updateRegistrationStatus(regId, status);
    // ...existing logic for approval if queue was used...
    await fetchCloudData();
    setLoading(false);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRegisterError(null);
    setRegisterSuccess(false);

    // Validasi
    if (!registerForm.name || !registerForm.email || !registerForm.password || !registerForm.whatsapp) {
      setRegisterError("Nama, Email, Password, dan WhatsApp wajib diisi.");
      setLoading(false);
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setRegisterError("Password dan Konfirmasi Password tidak cocok.");
      setLoading(false);
      return;
    }

    if (registerForm.password.length < 6) {
      setRegisterError("Password minimal 6 karakter.");
      setLoading(false);
      return;
    }

    // Cek duplikasi email
    if (allUsers.some(u => u.email.toLowerCase() === registerForm.email.toLowerCase())) {
      setRegisterError("Email sudah terdaftar dalam sistem.");
      setLoading(false);
      return;
    }

    // Cek duplikasi registrasi pending
    if (registrations.some(r => r.email.toLowerCase() === registerForm.email.toLowerCase() && r.status === 'pending')) {
      setRegisterError("Email sudah memiliki pendaftaran yang tertunda persetujuan.");
      setLoading(false);
      return;
    }

    setTimeout(() => {
      // Buat RegistrationRequest baru
      const newRegistration: RegistrationRequest = {
        id: `REG-${Date.now()}`,
        name: registerForm.name,
        email: registerForm.email,
        password: registerForm.password,
        handle: registerForm.handle,
        niche: registerForm.niche,
        reason: registerForm.reason,
        timestamp: new Date().toISOString(),
        status: 'pending',
        nodeId: `NODE-${Date.now()}`
      };

      // Simpan ke registrations
      setRegistrations([...registrations, newRegistration]);
      
      // Simpan ke localStorage untuk persistence
      const saved = localStorage.getItem('sf_registrations_db');
      const existingRegs = saved ? JSON.parse(saved) : [];
      localStorage.setItem('sf_registrations_db', JSON.stringify([...existingRegs, newRegistration]));

      setRegisterSuccess(true);
      
      // Reset form
      setRegisterForm({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        whatsapp: '',
        handle: '',
        niche: '',
        reason: ''
      });

      // Tampilkan pesan sukses lalu kembali ke login setelah 2 detik
      setTimeout(() => {
        setAuthTab('login');
        setRegisterSuccess(false);
      }, 2000);

      setLoading(false);
    }, 1000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);

    // TRIM & CLEAN INPUT: Mengatasi masalah spasi saat copy-paste email
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    setTimeout(() => {
      const isDevLogin = cleanEmail === DEV_CREDENTIALS.email.toLowerCase() && cleanPassword === DEV_CREDENTIALS.password;
      
      // Step 1: Cari User dengan email yang sudah dibersihkan
      const foundUser = allUsers.find(u => u.email.trim().toLowerCase() === cleanEmail);
      
      if (!foundUser) {
        setLoginError("Email belum terdaftar dalam sistem.");
        setLoading(false);
        return;
      }

      // Step 2: Validasi Password
      const isPasswordCorrect = foundUser.password === cleanPassword || (!foundUser.password && cleanPassword === 'Social123');
      
      if (isDevLogin || isPasswordCorrect) {
        
        // CHECK: Apakah user baru perlu ganti password?
        if (foundUser.requiresPasswordChange) {
           setTempLoginUser(foundUser);
           setIsChangePasswordOpen(true);
           setLoading(false);
           return;
        }

        // Login Normal
        setUser(foundUser);
        localStorage.setItem('sf_session_user', JSON.stringify(foundUser));
        
        const today = new Date();
        if (foundUser.subscriptionExpiry && today > new Date(foundUser.subscriptionExpiry) && foundUser.role !== 'developer') {
          setAuthState('expired');
        } else {
          setAuthState('authenticated');
        }
      } else {
        setLoginError("Security Code tidak valid. Silakan coba lagi.");
      }
      setLoading(false);
    }, 1000);
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
         requiresPasswordChange: false, // Flag dinonaktifkan
         status: 'active' // OTOMATIS UBAH STATUS JADI ACTIVE
      };

      // Update Database
      const updatedAllUsers = allUsers.map(u => u.id === tempLoginUser.id ? updatedUser : u);
      setAllUsers(updatedAllUsers);
      
      // Auto Login
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

  if (authState === 'login') {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 font-sans">
        <div className="max-w-[480px] w-full bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] p-10 md:p-14 space-y-10 border border-gray-100 animate-slide">
          <div className="text-center space-y-4">
             <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white text-2xl font-black bg-blue-500 shadow-xl shadow-blue-200">SF</div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Socialflow</h1>
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                <ShieldCheck size={12} className="text-blue-500"/> Closed System Core V3.7.0
             </p>
          </div>

          {/* Auth Tabs */}
          <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100">
            <button
              type="button"
              onClick={() => { setAuthTab('login'); setLoginError(null); setRegisterError(null); }}
              className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                authTab === 'login'
                  ? 'bg-white text-blue-500 shadow-md'
                  : 'text-gray-400 hover:text-gray-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthTab('register'); setLoginError(null); setRegisterError(null); }}
              className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                authTab === 'register'
                  ? 'bg-white text-blue-500 shadow-md'
                  : 'text-gray-400 hover:text-gray-900'
              }`}
            >
              Register
            </button>
          </div>

          {authTab === 'login' ? (
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
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              {registerSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 animate-slide">
                   <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                   <p className="text-[11px] font-bold text-emerald-600 leading-tight">Registrasi berhasil! Silakan tunggu approval dari admin.</p>
                </div>
              )}

              {registerError && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 animate-slide">
                   <AlertTriangle size={18} className="text-rose-500 shrink-0" />
                   <p className="text-[11px] font-bold text-rose-600 leading-tight">{registerError}</p>
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Full Name</label>
                 <input type="text" required value={registerForm.name} onChange={e => setRegisterForm({...registerForm, name: e.target.value})} className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 transition-all text-sm focus:bg-white focus:ring-4 focus:ring-blue-50" placeholder="John Doe" />
              </div>

              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Email Address</label>
                 <input type="email" required value={registerForm.email} onChange={e => setRegisterForm({...registerForm, email: e.target.value})} className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 transition-all text-sm focus:bg-white focus:ring-4 focus:ring-blue-50" placeholder="user@snaillabs.id" />
              </div>

              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">WhatsApp (62xxx)</label>
                 <input type="text" required value={registerForm.whatsapp} onChange={e => setRegisterForm({...registerForm, whatsapp: e.target.value})} className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 transition-all text-sm focus:bg-white focus:ring-4 focus:ring-blue-50" placeholder="628123456789" />
              </div>

              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Security Code (Password)</label>
                 <input type="password" required value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password: e.target.value})} className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 transition-all text-sm focus:bg-white focus:ring-4 focus:ring-blue-50" placeholder="Min 6 karakter" />
              </div>

              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Confirm Password</label>
                 <input type="password" required value={registerForm.confirmPassword} onChange={e => setRegisterForm({...registerForm, confirmPassword: e.target.value})} className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 transition-all text-sm focus:bg-white focus:ring-4 focus:ring-blue-50" placeholder="Ulangi password" />
              </div>

              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Social Media Handle (Optional)</label>
                 <input type="text" value={registerForm.handle} onChange={e => setRegisterForm({...registerForm, handle: e.target.value})} className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 transition-all text-sm focus:bg-white focus:ring-4 focus:ring-blue-50" placeholder="@username" />
              </div>

              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Niche/Industry (Optional)</label>
                 <input type="text" value={registerForm.niche} onChange={e => setRegisterForm({...registerForm, niche: e.target.value})} className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 transition-all text-sm focus:bg-white focus:ring-4 focus:ring-blue-50" placeholder="e.g., Marketing, Tech, Fashion" />
              </div>

              <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Why Socialflow? (Optional)</label>
                 <textarea value={registerForm.reason} onChange={e => setRegisterForm({...registerForm, reason: e.target.value})} className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 transition-all text-sm focus:bg-white focus:ring-4 focus:ring-blue-50" placeholder="Tell us why you're interested..." rows={3} />
              </div>

              <button type="submit" disabled={loading || registerSuccess} className="w-full py-6 bg-blue-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-2xl shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                {loading ? <Loader2 size={18} className="animate-spin" /> : <><UserPlus size={16}/> Register Now</>}
              </button>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                 <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                   Daftarkan akun Anda. Admin akan melakukan review dan approval dalam 24 jam.
                 </p>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

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
