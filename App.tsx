
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
import { Loader2, Database, Cloud, Globe, Menu, ShieldCheck, Wifi, WifiOff, ArrowRight, Lock, AlertCircle, Phone, Eye, EyeOff, AlertTriangle, Save, CheckCircle, UserPlus, ChevronLeft, Building2, Link, LogIn } from 'lucide-react';

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
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);
  const [joinWorkspaceUrl, setJoinWorkspaceUrl] = useState(''); // For manual paste
  const [isJoinWorkspaceModalOpen, setIsJoinWorkspaceModalOpen] = useState(false); // Logged in user joining new WS

  // Registration Specific State
  const [regStep, setRegStep] = useState<'type_selection' | 'details' | 'workspace_setup'>('type_selection');
  const [regData, setRegData] = useState({ 
      name: '', email: '', password: '', whatsapp: '', reason: '', 
      workspaceChoice: 'join' as 'join' | 'create',
      inviteCode: '', // For joining
      workspaceName: '', // For creating
      workspaceColor: 'blue' as ThemeColor
  });
  const [regSuccess, setRegSuccess] = useState(false);

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

  // --- INITIALIZATION ---

  // Check URL for Invite Code
  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const inviteCode = params.get('join');
      if (inviteCode) {
          setPendingInviteCode(inviteCode);
          setRegData(prev => ({ ...prev, inviteCode: inviteCode, workspaceChoice: 'join' }));
          
          // If not logged in, go to register immediately
          if (authState === 'login') {
              setAuthState('register');
              setRegStep('details'); // Skip selection, go to details
          } else if (authState === 'authenticated') {
              // If logged in, open join modal
              setJoinWorkspaceUrl(`${window.location.origin}?join=${inviteCode}`);
              setIsJoinWorkspaceModalOpen(true);
          }
      }
  }, [authState]);

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

  // Helper: Get Active Workspace based on current user
  const activeWorkspace = workspaces.find(w => w.id === user?.workspaceId) || workspaces[0];

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
    
    // VALIDATION
    if (regData.workspaceChoice === 'join') {
        const targetWs = workspaces.find(w => w.inviteCode === regData.inviteCode);
        if (!targetWs) {
            setLoginError("Link Workspace tidak valid atau kadaluarsa.");
            setLoading(false);
            return;
        }
    }

    try {
        // Create User Object
        const newUser: User = {
            id: `U-${Date.now()}`,
            name: regData.name,
            email: regData.email,
            password: regData.password,
            whatsapp: regData.whatsapp,
            role: regData.workspaceChoice === 'create' ? 'superuser' : 'viewer',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${regData.name}`,
            permissions: { dashboard: true, calendar: true, ads: false, analytics: false, tracker: false, team: false, settings: regData.workspaceChoice === 'create', contentPlan: true },
            isSubscribed: true,
            activationDate: new Date().toISOString(),
            status: 'active',
            jobdesk: regData.workspaceChoice === 'create' ? 'Owner' : 'Member',
            kpi: [],
            activityLogs: [],
            performanceScore: 0,
            workspaceId: '', // Will be set below
            requiresPasswordChange: false
        };

        if (regData.workspaceChoice === 'create') {
            // Create New Workspace
            const newWsId = `WS-${Date.now()}`;
            const newInviteCode = `JOIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            const newWs: Workspace = {
                id: newWsId,
                name: regData.workspaceName || `${regData.name}'s Studio`,
                color: regData.workspaceColor,
                inviteCode: newInviteCode,
                ownerId: newUser.id,
                members: [newUser]
            };
            
            newUser.workspaceId = newWsId;
            
            setWorkspaces([...workspaces, newWs]);
            setAllUsers([...allUsers, newUser]);
        } else {
            // Join Existing
            const targetWs = workspaces.find(w => w.inviteCode === regData.inviteCode);
            if (targetWs) {
                newUser.workspaceId = targetWs.id;
                // Add to workspace members
                const updatedWs = { ...targetWs, members: [...targetWs.members, newUser] };
                setWorkspaces(workspaces.map(w => w.id === targetWs.id ? updatedWs : w));
                setAllUsers([...allUsers, newUser]);
            }
        }

        setRegSuccess(true);
    } catch (error) {
        console.error(error);
        setLoginError("Gagal mendaftar.");
    } finally {
        setLoading(false);
    }
  };

  const handleExistingUserJoinWorkspace = (e: React.FormEvent) => {
      e.preventDefault();
      
      const code = new URL(joinWorkspaceUrl).searchParams.get('join') || joinWorkspaceUrl;
      const targetWs = workspaces.find(w => w.inviteCode === code);

      if (!targetWs) {
          alert("Kode/Link Workspace tidak valid.");
          return;
      }

      if (targetWs.members.some(m => m.email === user?.email)) {
          alert("Anda sudah menjadi member di workspace ini.");
          return;
      }

      // Create NEW Profile for SAME Email in NEW Workspace
      const newProfile: User = {
          ...user!,
          id: `U-${Date.now()}`, // New ID for new profile context
          workspaceId: targetWs.id,
          role: 'viewer', // Default role when joining
          jobdesk: 'New Member',
          permissions: { dashboard: true, calendar: true, ads: false, analytics: false, tracker: false, team: false, settings: false, contentPlan: true },
          kpi: [],
          activityLogs: [],
          performanceScore: 0
      };

      const updatedWs = { ...targetWs, members: [...targetWs.members, newProfile] };
      setWorkspaces(workspaces.map(w => w.id === targetWs.id ? updatedWs : w));
      setAllUsers([...allUsers, newProfile]);
      
      // Auto switch
      alert(`Berhasil bergabung ke ${targetWs.name}! Mengalihkan profil...`);
      switchProfile(newProfile);
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

    // Local DB Check
    const foundUser = allUsers.find(u => u.email.toLowerCase() === cleanEmail && (u.password === cleanPassword || cleanPassword === 'Social123')); // Accept default pass for demo

    if (foundUser) {
        if (foundUser.status === 'suspended') {
            setLoginError("Akun disuspend.");
            setLoading(false);
            return;
        }
        
        setUser(foundUser);
        localStorage.setItem('sf_session_user', JSON.stringify(foundUser));
        setAuthState('authenticated');
    } else {
        setLoginError("Email atau password salah.");
    }
    setLoading(false);
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
      
      // Update cloud if needed
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

  if (authState === 'register') {
    return (
      <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4 font-sans">
        <div className="max-w-[500px] w-full bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] p-10 md:p-14 space-y-8 border border-gray-100 animate-slide">
          <button onClick={() => { setAuthState('login'); setRegStep('type_selection'); setRegSuccess(false); }} className="flex items-center gap-2 text-gray-400 hover:text-gray-900 text-xs font-black uppercase tracking-widest transition-colors">
            <ChevronLeft size={16} /> Back to Login
          </button>

          {regSuccess ? (
            <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce"><CheckCircle size={40}/></div>
                <div>
                    <h2 className="text-2xl font-black text-gray-900">Selamat Bergabung!</h2>
                    <p className="text-gray-500 text-sm mt-2">Akun Anda telah dibuat. Silakan login untuk memulai.</p>
                </div>
                <button onClick={() => setAuthState('login')} className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl">Login Sekarang</button>
            </div>
          ) : (
            <>
                <div className="space-y-2">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter">
                        {regStep === 'type_selection' ? 'Pilih Akses' : 
                         regStep === 'details' ? 'Isi Data Diri' : 'Setup Workspace'}
                    </h1>
                    <p className="text-gray-400 font-medium text-sm">Step {regStep === 'type_selection' ? '1' : regStep === 'details' ? '2' : '3'} of 3</p>
                </div>

                <form onSubmit={handleRegisterSubmit} className="space-y-6">
                    {/* STEP 1: PILIH TIPE */}
                    {regStep === 'type_selection' && (
                        <div className="grid gap-4">
                            <button type="button" onClick={() => { setRegData({...regData, workspaceChoice: 'join'}); setRegStep('details'); }} className="p-6 rounded-3xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
                                <Link size={24} className="text-gray-300 group-hover:text-blue-500 mb-3" />
                                <h3 className="font-black text-gray-900">Join Existing Team</h3>
                                <p className="text-xs text-gray-400 mt-1">Saya punya link invite untuk bergabung ke workspace tim.</p>
                            </button>
                            <button type="button" onClick={() => { setRegData({...regData, workspaceChoice: 'create'}); setRegStep('details'); }} className="p-6 rounded-3xl border-2 border-gray-100 hover:border-purple-500 hover:bg-purple-50 transition-all text-left group">
                                <Building2 size={24} className="text-gray-300 group-hover:text-purple-500 mb-3" />
                                <h3 className="font-black text-gray-900">Create New Workspace</h3>
                                <p className="text-xs text-gray-400 mt-1">Saya ingin membuat workspace baru untuk tim saya sendiri.</p>
                            </button>
                        </div>
                    )}

                    {/* STEP 2: DATA DIRI */}
                    {regStep === 'details' && (
                        <div className="space-y-4">
                            <div><label className="text-[10px] font-black uppercase text-gray-400 ml-3">Nama Lengkap</label><input required value={regData.name} onChange={e => setRegData({...regData, name: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border focus:border-blue-200 transition-all" placeholder="John Doe"/></div>
                            <div><label className="text-[10px] font-black uppercase text-gray-400 ml-3">Email</label><input required type="email" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border focus:border-blue-200 transition-all" placeholder="email@domain.com"/></div>
                            <div><label className="text-[10px] font-black uppercase text-gray-400 ml-3">Password</label><input required type="password" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border focus:border-blue-200 transition-all" placeholder="******"/></div>
                            
                            <button type="button" onClick={() => setRegStep('workspace_setup')} className="w-full py-5 bg-gray-900 text-white font-black rounded-2xl mt-4 flex justify-center items-center gap-2">
                                Lanjut <ArrowRight size={16}/>
                            </button>
                        </div>
                    )}

                    {/* STEP 3: WORKSPACE SETUP */}
                    {regStep === 'workspace_setup' && (
                        <div className="space-y-6">
                            {regData.workspaceChoice === 'join' ? (
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 ml-3">Paste Invite Link / Code</label>
                                    <input 
                                        required 
                                        value={regData.inviteCode} 
                                        onChange={e => {
                                            const val = e.target.value;
                                            // Extract code if url is pasted
                                            const code = val.includes('join=') ? val.split('join=')[1] : val;
                                            setRegData({...regData, inviteCode: code})
                                        }}
                                        className="w-full px-6 py-4 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl outline-none font-bold transition-all text-center text-lg placeholder:text-blue-300" 
                                        placeholder="Paste Link Here"
                                    />
                                    <p className="text-center text-xs text-gray-400 mt-3">Link ini didapatkan dari Owner Workspace.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 ml-3">Nama Workspace</label>
                                        <input required value={regData.workspaceName} onChange={e => setRegData({...regData, workspaceName: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border focus:border-blue-200 transition-all" placeholder="My Creative Studio"/>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-gray-400 ml-3">Warna Tema</label>
                                        <div className="flex gap-2 mt-2">
                                            {['blue', 'purple', 'emerald', 'rose'].map((c) => (
                                                <button 
                                                    key={c}
                                                    type="button" 
                                                    onClick={() => setRegData({...regData, workspaceColor: c as any})} 
                                                    className={`w-8 h-8 rounded-full border-2 ${regData.workspaceColor === c ? 'border-gray-900 scale-110' : 'border-transparent'} bg-${c}-500 transition-all`}
                                                ></button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all">
                                {loading ? <Loader2 className="animate-spin mx-auto"/> : (regData.workspaceChoice === 'join' ? 'Gabung Tim' : 'Buat Workspace')}
                            </button>
                        </div>
                    )}
                </form>
            </>
          )}
        </div>
      </div>
    );
  }

  // --- LOGIN VIEW ---
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

  // --- JOIN WORKSPACE MODAL (For Logged In Users) ---
  const JoinWorkspaceModal = () => (
      isJoinWorkspaceModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-slide relative">
                  <button onClick={() => setIsJoinWorkspaceModalOpen(false)} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full hover:bg-gray-100"><ArrowRight size={18}/></button>
                  <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-4"><Link size={32}/></div>
                      <h2 className="text-2xl font-black text-gray-900">Gabung Workspace</h2>
                      <p className="text-gray-400 text-sm mt-2">Paste link invite untuk menambahkan profil baru di workspace tersebut.</p>
                  </div>
                  <form onSubmit={handleExistingUserJoinWorkspace} className="space-y-4">
                      <input 
                        required
                        value={joinWorkspaceUrl}
                        onChange={e => setJoinWorkspaceUrl(e.target.value)}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-center"
                        placeholder="https://app.arunika.id?join=XYZ..."
                      />
                      <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black uppercase rounded-2xl shadow-xl active:scale-95 transition-all">
                          Gabung Sekarang
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
          primaryColor={activeWorkspace.color}
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
           <h2 className="text-sm font-black text-gray-900 tracking-tighter uppercase">{isDev ? 'Developer Access' : activeWorkspace.name}</h2>
        </div>

        <div className="max-w-6xl mx-auto w-full">
           {activeTab === 'dashboard' && !isDev && <Dashboard primaryColor={activeWorkspace.color} />}
           {activeTab === 'contentPlan' && !isDev && (
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
           {activeTab === 'calendar' && !isDev && <Calendar primaryColor={activeWorkspace.color} />}
           {activeTab === 'ads' && !isDev && <AdsWorkspace primaryColor={activeWorkspace.color} />}
           {activeTab === 'analytics' && !isDev && <Analytics primaryColorHex={primaryColorHex} analyticsData={analyticsData} onSaveInsight={saveAnalytics} />}
           {activeTab === 'tracker' && !isDev && <LinkTracker primaryColorHex={primaryColorHex} onSaveManualInsight={saveAnalytics} />}
           {activeTab === 'team' && !isDev && (
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
           {activeTab === 'profile' && !isDev && (
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

        {!isDev && (
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
