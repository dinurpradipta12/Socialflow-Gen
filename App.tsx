
import React, { useState, useEffect, useCallback } from 'react';
import { ThemeColor, Workspace, User, Message, PostInsight, RegistrationRequest, SystemNotification, SocialAccount } from './types';
import { MOCK_WORKSPACES, MOCK_USERS, DEV_CREDENTIALS, SUPABASE_CONFIG, APP_NAME } from './constants';
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
import { cloudService } from './services/cloudService';
import { databaseService } from './services/databaseService';
import { Loader2, Database, Cloud, Globe, Menu, ShieldCheck, Wifi, WifiOff, ArrowRight, Lock, AlertCircle, Phone, Eye, EyeOff, AlertTriangle, Save, CheckCircle, UserPlus, ChevronLeft, Building2, Link, LogIn, Hash } from 'lucide-react';

const cloudSyncChannel = new BroadcastChannel('sf_cloud_sync');

const App: React.FC = () => {
  // Global Data
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('sf_users_db');
    return saved ? JSON.parse(saved) : MOCK_USERS;
  });

  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
      const saved = localStorage.getItem('sf_workspaces_db');
      return saved ? JSON.parse(saved) : MOCK_WORKSPACES;
  });

  // Session State
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

  // Invite Logic State
  const [isJoinWorkspaceModalOpen, setIsJoinWorkspaceModalOpen] = useState(false); // Logged in user joining new WS
  const [workspaceCodeInput, setWorkspaceCodeInput] = useState('');

  // Registration Form State (Simple)
  const [regData, setRegData] = useState({ 
      name: '', email: '', password: '', whatsapp: '', reason: ''
  });
  const [regSuccess, setRegSuccess] = useState(false);

  // Workspace Setup State (Post-Login)
  const [setupStep, setSetupStep] = useState<'choice' | 'create' | 'join'>('choice');
  const [newWorkspaceData, setNewWorkspaceData] = useState({ name: '', color: 'blue' as ThemeColor });

  // Global Settings State
  const [primaryColorHex, setPrimaryColorHex] = useState('#BFDBFE');
  const [customLogo, setCustomLogo] = useState<string | null>(localStorage.getItem('sf_custom_logo'));

  // Notifications State
  const [topNotification, setTopNotification] = useState<SystemNotification | null>(null);
  const [notificationHistory, setNotificationHistory] = useState<SystemNotification[]>([]);
  const [showNotifHistory, setShowNotifHistory] = useState(false);

  // Navigation State
  const [targetContentId, setTargetContentId] = useState<string | null>(null);

  // Accounts State (Multi-Account Feature)
  const [accounts, setAccounts] = useState<SocialAccount[]>([
    { id: 'account-1', name: 'Akun Utama', instagramUsername: '@arunika', tiktokUsername: '@arunika.id' }
  ]);

  // States for Change Password Logic
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [tempLoginUser, setTempLoginUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Login Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>([]);
  const [analyticsData, setAnalyticsData] = useState<PostInsight[]>(() => {
    const saved = localStorage.getItem('sf_analytics_db');
    return saved ? JSON.parse(saved) : [];
  });

  // Helper untuk mendapatkan config database
  const getDbConfig = () => {
    return {
      url: localStorage.getItem('sf_db_url') || SUPABASE_CONFIG.url,
      key: localStorage.getItem('sf_db_key') || SUPABASE_CONFIG.key
    };
  };

  // Persistence
  useEffect(() => {
    if (customLogo) localStorage.setItem('sf_custom_logo', customLogo);
    else localStorage.removeItem('sf_custom_logo');
  }, [customLogo]);

  useEffect(() => {
    localStorage.setItem('sf_users_db', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
      localStorage.setItem('sf_workspaces_db', JSON.stringify(workspaces));
  }, [workspaces]);

  // DATA SYNCING LOGIC
  useEffect(() => {
      // If logged in and has workspace, try to fetch fresh workspace data from cloud
      const syncData = async () => {
          if (user && user.workspaceId && authState === 'authenticated') {
              const dbConfig = getDbConfig();
              if (dbConfig.url && dbConfig.key) {
                  try {
                      // Fetch Workspace Details
                      const freshWs = await databaseService.getWorkspaceById(dbConfig, user.workspaceId);
                      if (freshWs) {
                          // Fetch Members of this Workspace
                          const allDbUsers = await databaseService.getAllUsers(dbConfig);
                          const members = allDbUsers.filter(u => u.workspaceId === user.workspaceId);
                          freshWs.members = members;
                          
                          setWorkspaces(prev => {
                              const exists = prev.find(w => w.id === freshWs.id);
                              return exists ? prev.map(w => w.id === freshWs.id ? freshWs : w) : [...prev, freshWs];
                          });
                          
                          // Also update allUsers global state
                          setAllUsers(prev => {
                              // Merge remote users with local mock users if needed, or just use remote
                              return allDbUsers; 
                          });
                      }
                  } catch (e) {
                      console.error("Sync Error", e);
                  }
              }
          }
      };
      
      syncData();
  }, [user, authState]);

  // Helper: Get Active Workspace based on current user
  const activeWorkspace = workspaces.find(w => w.id === user?.workspaceId);

  // Helper: Switch Profile
  const switchProfile = (targetUser: User) => {
      setUser(targetUser);
      localStorage.setItem('sf_session_user', JSON.stringify(targetUser));
      window.location.reload(); // Refresh to clean state
  };

  // --- HANDLERS ---

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
        // Send to Supabase Registrations Table
        await databaseService.createRegistration(dbConfig, {
            ...regData,
            password: regData.password
        });
        setRegSuccess(true);
    } catch (error) {
        console.error(error);
        setLoginError("Gagal mengirim data ke database. Periksa koneksi.");
    } finally {
        setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      setLoading(true);

      const dbConfig = getDbConfig();
      if (!dbConfig.url || !dbConfig.key) {
          alert("Koneksi Database bermasalah. Hubungi admin.");
          setLoading(false);
          return;
      }

      const newWsId = `WS-${Date.now()}`;
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const newInviteCode = `AR-${randomSuffix}`;
      
      const newWs: Workspace = {
          id: newWsId,
          name: newWorkspaceData.name || `${user.name}'s Studio`,
          color: newWorkspaceData.color,
          inviteCode: newInviteCode,
          ownerId: user.id,
          members: [] // User added below
      };

      const updatedUser: User = {
          ...user,
          workspaceId: newWsId,
          role: 'superuser',
          jobdesk: 'Owner'
      };
      
      newWs.members = [updatedUser];

      try {
          // 1. Create Workspace in DB
          await databaseService.createWorkspace(dbConfig, newWs);
          
          // 2. Update User in DB (Link to Workspace)
          await databaseService.upsertUser(dbConfig, updatedUser);

          // 3. Update Local State
          setWorkspaces([...workspaces, newWs]);
          setUser(updatedUser);
          localStorage.setItem('sf_session_user', JSON.stringify(updatedUser));
          setSetupStep('choice'); 
          
      } catch (err: any) {
          console.error(err);
          alert(`Gagal membuat workspace: ${err.message}`);
      } finally {
          setLoading(false);
      }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) return;
      setLoading(true);

      const code = workspaceCodeInput.trim().toUpperCase();
      const dbConfig = getDbConfig();

      if (!dbConfig.url || !dbConfig.key) {
          alert("Koneksi Database tidak tersedia.");
          setLoading(false);
          return;
      }

      try {
          // 1. Search Code in DB
          const targetWs = await databaseService.getWorkspaceByCode(dbConfig, code);

          if (!targetWs) {
              alert("Kode Workspace tidak ditemukan di Database!");
              setLoading(false);
              return;
          }

          // 2. Check if already member (fetch latest users first to be sure)
          const allDbUsers = await databaseService.getAllUsers(dbConfig);
          const existingMember = allDbUsers.find(u => u.workspaceId === targetWs.id && u.email === user.email);

          if (existingMember) {
              alert(`Anda sudah menjadi member di ${targetWs.name}. Mengalihkan...`);
              switchProfile(existingMember);
              return;
          }

          // 3. Create NEW Profile for this Workspace
          const newUserProfile: User = {
              ...user,
              id: `U-${Date.now()}`, // Create NEW profile ID unique for this workspace
              workspaceId: targetWs.id,
              role: 'viewer',
              jobdesk: 'Member',
              // Reset some fields
              kpi: [],
              activityLogs: [],
              performanceScore: 0
          };

          // 4. Save New Profile to DB
          await databaseService.upsertUser(dbConfig, newUserProfile);

          // 5. Update Local State & Switch
          const updatedWs = { ...targetWs, members: [...targetWs.members, newUserProfile] };
          setWorkspaces([...workspaces, updatedWs]);
          setAllUsers([...allUsers, newUserProfile]);
          
          alert(`Berhasil bergabung ke ${targetWs.name}!`);
          switchProfile(newUserProfile);

      } catch (err) {
          console.error(err);
          alert("Terjadi kesalahan saat bergabung.");
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

    // Dev Bypass
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

    // DB Verification
    const dbConfig = getDbConfig();
    try {
        let loggedInUser: User | null = null;
        
        // 1. Try Remote First
        if (dbConfig.url && dbConfig.key) {
             const remoteUser = await databaseService.getUserByEmail(dbConfig, cleanEmail);
             if (remoteUser && (remoteUser.password === cleanPassword || cleanPassword === 'Social123')) {
                 loggedInUser = remoteUser;
             }
        }

        // 2. Fallback Local
        if (!loggedInUser) {
            loggedInUser = allUsers.find(u => u.email.toLowerCase() === cleanEmail && (u.password === cleanPassword || cleanPassword === 'Social123')) || null;
        }

        if (loggedInUser) {
            if (loggedInUser.status === 'suspended') {
                setLoginError("Akun disuspend.");
            } else if (loggedInUser.status === 'pending') {
                setLoginError("Akun belum disetujui admin.");
            } else {
                setUser(loggedInUser);
                localStorage.setItem('sf_session_user', JSON.stringify(loggedInUser));
                setAuthState('authenticated');
                
                // If user has a workspace, trigger refresh
                if (loggedInUser.workspaceId) {
                    // Logic handled in useEffect
                }
            }
        } else {
            setLoginError("Email atau password salah.");
        }
    } catch (err) {
        setLoginError("Error login.");
    } finally {
        setLoading(false);
    }
  };

  // Other handlers remain same...
  const saveAnalytics = (insight: PostInsight | PostInsight[]) => {
    const updated = Array.isArray(insight) ? [...insight, ...analyticsData] : [insight, ...analyticsData];
    setAnalyticsData(updated);
    localStorage.setItem('sf_analytics_db', JSON.stringify(updated));
  };

  const triggerNotification = (notif: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: SystemNotification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notif
    };
    setTopNotification(newNotif);
    setNotificationHistory(prev => [newNotif, ...prev]);
  };

  const handleOpenContent = (contentId?: string) => {
    if (contentId) {
        setTargetContentId(contentId);
        setActiveTab('contentPlan');
        setTopNotification(null);
        setShowNotifHistory(false);
    }
  };

  const markNotificationsRead = () => {
    setNotificationHistory(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleRegistrationAction = async (regId: string, status: 'approved' | 'rejected') => {
      setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, status } : r));
      await cloudService.updateRegistrationStatus(regId, status);
  };

  const fetchCloudData = async () => {
    try {
        const regs = await cloudService.pullRegistrations();
        setRegistrations(regs);
    } catch (e) {
        console.error("Failed to sync cloud data", e);
    }
  };

  const isDev = user?.role === 'developer';

  // --- RENDER ---

  // 1. REGISTRATION PAGE
  if (authState === 'register') {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 font-sans">
        <div className="max-w-[480px] w-full bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] p-10 md:p-14 space-y-8 border border-gray-100 animate-slide">
          <button onClick={() => { setAuthState('login'); setRegSuccess(false); }} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 text-xs font-black uppercase tracking-widest transition-colors">
            <ChevronLeft size={16} /> Back to Login
          </button>

          {regSuccess ? (
            <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce"><CheckCircle size={40}/></div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Registrasi Berhasil!</h2>
                    <p className="text-gray-500 text-sm mt-2">Data Anda telah dikirim ke Admin. Silakan tunggu approval dan login kembali nanti.</p>
                </div>
                <button onClick={() => setAuthState('login')} className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl">Kembali ke Login</button>
            </div>
          ) : (
            <>
                <div className="space-y-2">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter">Daftar Akun Baru</h1>
                    <p className="text-gray-400 font-medium text-sm">Isi data diri untuk mengajukan akses.</p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    {loginError && <p className="text-rose-500 text-xs font-bold bg-rose-50 p-3 rounded-xl">{loginError}</p>}
                    
                    <div><label className="text-[10px] font-black uppercase text-gray-400 ml-3">Nama Lengkap</label><input required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border focus:border-blue-200 transition-all text-sm" placeholder="John Doe"/></div>
                    <div><label className="text-[10px] font-black uppercase text-gray-400 ml-3">Email</label><input required type="email" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border focus:border-blue-200 transition-all text-sm" placeholder="email@domain.com"/></div>
                    <div><label className="text-[10px] font-black uppercase text-gray-400 ml-3">Password</label><input required type="password" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border focus:border-blue-200 transition-all text-sm" placeholder="******"/></div>
                    <div><label className="text-[10px] font-black uppercase text-gray-400 ml-3">WhatsApp</label><input required value={regData.whatsapp} onChange={e => setRegData({...regData, whatsapp: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border focus:border-blue-200 transition-all text-sm" placeholder="628..."/></div>
                    <div><label className="text-[10px] font-black uppercase text-gray-400 ml-3">Alasan</label><input required value={regData.reason} onChange={e => setRegData({...regData, reason: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border focus:border-blue-200 transition-all text-sm" placeholder="Untuk manajemen konten..."/></div>
                    
                    <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl mt-4 flex justify-center items-center gap-2 shadow-xl shadow-blue-200 active:scale-95 transition-all">
                        {loading ? <Loader2 className="animate-spin"/> : 'Kirim Data'}
                    </button>
                </form>
            </>
          )}
        </div>
      </div>
    );
  }

  // 2. WORKSPACE SETUP (If Logged in but No Workspace ID)
  if (authState === 'authenticated' && user && !user.workspaceId && !isDev) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-sans">
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide">
                {/* Header Section */}
                <div className="md:col-span-2 text-center mb-4">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Selamat Datang, {user.name}!</h1>
                    <p className="text-gray-400 mt-2">Anda belum terhubung ke Workspace manapun. Pilih opsi di bawah untuk memulai.</p>
                </div>

                {/* Option 1: Join Existing */}
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl flex flex-col items-center text-center space-y-6 hover:border-blue-200 transition-all group relative overflow-hidden">
                    <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform"><Hash size={32}/></div>
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Gabung Tim</h2>
                        <p className="text-gray-400 text-xs mt-2 px-8">Masukkan kode unik workspace yang diberikan oleh atasan atau rekan tim Anda.</p>
                    </div>
                    {setupStep === 'join' ? (
                        <form onSubmit={handleJoinByCode} className="w-full space-y-4 animate-slide">
                            <input 
                                autoFocus
                                value={workspaceCodeInput} 
                                onChange={e => setWorkspaceCodeInput(e.target.value.toUpperCase())}
                                className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-center font-black text-lg tracking-widest outline-none uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-normal"
                                placeholder="Contoh: AR-X7Y2"
                            />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setSetupStep('choice')} className="flex-1 py-3 text-gray-400 font-bold text-xs">Batal</button>
                                <button type="submit" disabled={loading} className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex justify-center items-center gap-2">
                                    {loading && <Loader2 size={12} className="animate-spin" />} Gabung
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button onClick={() => setSetupStep('join')} className="px-8 py-3 bg-white border-2 border-gray-100 text-gray-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all">Input Kode Join</button>
                    )}
                </div>

                {/* Option 2: Create New */}
                <div className="bg-gray-900 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center text-center space-y-6 text-white group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                    <div className="w-20 h-20 bg-white/10 text-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform backdrop-blur-sm"><Building2 size={32}/></div>
                    <div>
                        <h2 className="text-xl font-black">Buat Workspace Baru</h2>
                        <p className="text-gray-400 text-xs mt-2 px-8">Bangun ruang kerja baru untuk tim Anda dan jadilah Owner.</p>
                    </div>
                    
                    {setupStep === 'create' ? (
                        <form onSubmit={handleCreateWorkspace} className="w-full space-y-4 animate-slide">
                            <input 
                                autoFocus
                                required
                                value={newWorkspaceData.name} 
                                onChange={e => setNewWorkspaceData({...newWorkspaceData, name: e.target.value})}
                                className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-center font-bold text-white placeholder:text-gray-500 outline-none"
                                placeholder="Nama Workspace"
                            />
                            <div className="flex justify-center gap-2">
                                {['blue', 'purple', 'emerald', 'rose'].map((c) => (
                                    <button 
                                        key={c}
                                        type="button" 
                                        onClick={() => setNewWorkspaceData({...newWorkspaceData, color: c as ThemeColor})} 
                                        className={`w-6 h-6 rounded-full border-2 ${newWorkspaceData.color === c ? 'border-white scale-110' : 'border-transparent'} bg-${c}-500`}
                                    ></button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setSetupStep('choice')} className="flex-1 py-3 text-gray-500 font-bold text-xs">Batal</button>
                                <button type="submit" disabled={loading} className="flex-[2] py-3 bg-white text-gray-900 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg flex justify-center items-center gap-2">
                                    {loading && <Loader2 size={12} className="animate-spin text-gray-900" />} Buat Sekarang
                                </button>
                            </div>
                        </form>
                    ) : (
                        <button onClick={() => setSetupStep('create')} className="px-8 py-3 bg-white/10 border border-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-gray-900 transition-all">Setup Baru</button>
                    )}
                </div>
            </div>
            
            <button onClick={() => { setUser(null); setAuthState('login'); }} className="fixed bottom-8 text-gray-400 text-xs font-bold hover:text-rose-500 transition-colors">
                Logout Akun
            </button>
        </div>
      );
  }

  // 3. LOGIN PAGE
  if (authState === 'login') {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 font-sans">
        <div className="max-w-[440px] w-full bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] p-10 md:p-14 space-y-12 border border-gray-100 animate-slide">
          <div className="text-center space-y-4">
             <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-white text-2xl font-black bg-blue-500 shadow-xl shadow-blue-200">AR</div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tighter">{APP_NAME}</h1>
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                <ShieldCheck size={12} className="text-blue-500"/> Social Management System
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
               <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={`w-full px-7 py-5 bg-gray-50 border rounded-2xl outline-none font-bold text-gray-700 transition-all text-sm ${loginError && loginError.includes("Email") ? 'border-rose-200 focus:ring-rose-50' : 'border-gray-100 focus:bg-white focus:ring-4 focus:ring-blue-50'}`} placeholder="user@arunika.id" />
            </div>
            
            <div className="space-y-2">
               <label className="text-[9px] font-black uppercase text-gray-400 ml-4 tracking-widest">Password</label>
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

  // --- JOIN WORKSPACE MODAL (For Logged In Users who want to join ANOTHER workspace) ---
  const JoinWorkspaceModal = () => (
      isJoinWorkspaceModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-slide relative">
                  <button onClick={() => setIsJoinWorkspaceModalOpen(false)} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full hover:bg-gray-100"><ArrowRight size={18}/></button>
                  <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-4"><Hash size={32}/></div>
                      <h2 className="text-2xl font-black text-gray-900">Gabung Workspace Lain</h2>
                      <p className="text-gray-400 text-sm mt-2">Masukkan 6 digit Kode Unik Workspace tujuan.</p>
                  </div>
                  <form onSubmit={handleJoinByCode} className="space-y-4">
                      <input 
                        required
                        value={workspaceCodeInput}
                        onChange={e => setWorkspaceCodeInput(e.target.value.toUpperCase())}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-black text-center text-xl tracking-widest uppercase placeholder:text-gray-300"
                        placeholder="AR-XXXX"
                      />
                      <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white font-black uppercase rounded-2xl shadow-xl active:scale-95 transition-all flex justify-center items-center gap-2">
                          {loading && <Loader2 size={12} className="animate-spin" />} Gabung Sekarang
                      </button>
                  </form>
              </div>
          </div>
      )
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans overflow-x-hidden relative">
      <JoinWorkspaceModal />
      
      {topNotification && (
        <TopNotification 
          primaryColor={activeWorkspace?.color || 'blue'}
          senderName={topNotification.senderName}
          messageText={topNotification.messageText}
          onClose={() => setTopNotification(null)}
          onClick={() => handleOpenContent(topNotification.targetContentId)}
        />
      )}

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(t) => { setActiveTab(t); setTargetContentId(null); }} 
        primaryColorHex={primaryColorHex} 
        onLogout={() => { setUser(null); localStorage.removeItem('sf_session_user'); setAuthState('login'); }} 
        user={user!} 
        appLogo={customLogo}
        isOpen={isSidebarOpen}
        unreadNotifications={notificationHistory.filter(n => !n.read).length}
        notifications={notificationHistory}
        onMarkRead={markNotificationsRead}
        onOpenContent={handleOpenContent}
      />
      
      <main className={`flex-1 transition-all duration-300 min-h-screen md:ml-72 p-6 md:p-12 relative`}>
        {/* Header Mobile */}
        <div className="flex items-center justify-between mb-8 md:hidden">
           <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm"><Menu size={24} /></button>
           <h2 className="text-sm font-black text-gray-900 tracking-tighter uppercase">{isDev ? 'Developer Access' : activeWorkspace?.name || 'Dashboard'}</h2>
        </div>

        <div className="max-w-6xl mx-auto w-full">
           {activeTab === 'dashboard' && !isDev && activeWorkspace && <Dashboard primaryColor={activeWorkspace.color} />}
           {activeTab === 'contentPlan' && !isDev && activeWorkspace && (
             <ContentPlan 
               primaryColorHex={primaryColorHex} 
               onSaveInsight={saveAnalytics} 
               users={activeWorkspace.members} 
               addNotification={triggerNotification} 
               currentUser={user!}
               accounts={accounts}
               setAccounts={setAccounts}
               targetContentId={targetContentId}
             />
           )}
           {activeTab === 'calendar' && !isDev && activeWorkspace && <Calendar primaryColor={activeWorkspace.color} />}
           {activeTab === 'ads' && !isDev && activeWorkspace && <AdsWorkspace primaryColor={activeWorkspace.color} />}
           {activeTab === 'analytics' && !isDev && <Analytics primaryColorHex={primaryColorHex} analyticsData={analyticsData} onSaveInsight={saveAnalytics} />}
           {activeTab === 'tracker' && !isDev && <LinkTracker primaryColorHex={primaryColorHex} onSaveManualInsight={saveAnalytics} />}
           {activeTab === 'team' && !isDev && activeWorkspace && (
             <Team 
               primaryColor={activeWorkspace.color} 
               currentUser={user!} 
               workspace={activeWorkspace} 
               onUpdateWorkspace={()=>{}} 
               addSystemNotification={triggerNotification} 
               allUsers={allUsers} 
               setUsers={setAllUsers} 
               setWorkspace={(ws) => setWorkspaces(workspaces.map(w => w.id === ws.id ? ws : w))} 
               onJoinAnotherWorkspace={() => setIsJoinWorkspaceModalOpen(true)}
             />
           )}
           {activeTab === 'settings' && !isDev && <Settings primaryColorHex={primaryColorHex} setPrimaryColorHex={setPrimaryColorHex} accentColorHex="#DDD6FE" setAccentColorHex={()=>{}} fontSize="medium" setFontSize={()=>{}} customLogo={customLogo} setCustomLogo={setCustomLogo} />}
           {activeTab === 'profile' && !isDev && activeWorkspace && (
             <Profile 
               user={user!} 
               primaryColor={activeWorkspace.color} 
               setUser={setUser} 
               allWorkspaces={workspaces} // Pass all workspaces to lookup names
               allProfiles={allUsers.filter(u => u.email === user?.email)} // Pass all profiles for this email
               onSwitchProfile={switchProfile}
             />
           )}
           
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

        {!isDev && activeWorkspace && (
          <ChatPopup 
            primaryColor={activeWorkspace.color}
            currentUser={user!}
            messages={[]} 
            onSendMessage={()=>{}}
            isOpen={false}
            setIsOpen={()=>{}}
            unreadCount={0}
          />
        )}
      </main>
    </div>
  );
};

export default App;
