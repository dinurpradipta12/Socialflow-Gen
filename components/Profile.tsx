
import React, { useState, useEffect } from 'react';
import { User, ThemeColor, ActivityLog, Workspace } from '../types';
import { THEME_COLORS, SUPABASE_CONFIG } from '../constants';
import { databaseService } from '../services/databaseService';
import { 
  User as UserIcon, 
  Target, 
  Briefcase, 
  Clock, 
  CheckCircle2,
  Camera,
  Save,
  Instagram,
  AlertCircle,
  FileText,
  Building2,
  Repeat,
  Check,
  Lock,
  X,
  Loader2
} from 'lucide-react';

interface ProfileProps {
  user: User;
  primaryColor: ThemeColor;
  setUser: (user: User) => void;
  allWorkspaces: Workspace[];
  allProfiles: User[]; // All user objects sharing the same email
  onSwitchProfile: (user: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, primaryColor, setUser, allWorkspaces, allProfiles, onSwitchProfile }) => {
  const colorSet = THEME_COLORS[primaryColor];
  const [isEditing, setIsEditing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [dailyReportText, setDailyReportText] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Password Change State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passData, setPassData] = useState({ old: '', new: '', confirm: '' });
  const [passLoading, setPassLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    socialMedia: user?.socialMedia || '',
    birthDate: user?.birthDate || '',
    jobdesk: user?.jobdesk || ''
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!user) return null;

  const currentWorkspace = allWorkspaces.find(w => w.id === user.workspaceId);
  const lastCheckin = [...user.activityLogs].reverse().find(l => l.type === 'checkin');
  const isCheckedIn = lastCheckin && ![...user.activityLogs].reverse().find(l => l.type === 'checkout' && new Date(l.timestamp) > new Date(lastCheckin.timestamp));
  const canCheckout = isCheckedIn && (Date.now() - new Date(lastCheckin.timestamp).getTime()) >= 3600000; 
  const needsReport = isCheckedIn && (Date.now() - new Date(lastCheckin.timestamp).getTime()) >= 28800000; 

  const handleCheckin = () => {
    const newLog: ActivityLog = { id: Date.now().toString(), type: 'checkin', timestamp: new Date().toISOString() };
    setUser({ ...user, activityLogs: [...user.activityLogs, newLog] });
  };

  const finalizeCheckout = () => {
    const newLog: ActivityLog = { id: Date.now().toString(), type: 'checkout', timestamp: new Date().toISOString(), report: dailyReportText };
    setUser({ ...user, activityLogs: [...user.activityLogs, newLog], performanceScore: Math.min(100, user.performanceScore + 5) });
    setShowReportModal(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) return alert("Konfirmasi password tidak cocok");
    if (passData.new.length < 6) return alert("Password minimal 6 karakter");

    // Optional: Check old password locally if we have it stored
    if (user.password && user.password !== passData.old && passData.old !== '') {
         // Logic check here, though in real secure app we'd verify with backend
    }

    setPassLoading(true);
    const dbConfig = {
       url: localStorage.getItem('sf_db_url') || SUPABASE_CONFIG.url,
       key: localStorage.getItem('sf_db_key') || SUPABASE_CONFIG.key
    };

    try {
        await databaseService.updatePassword(dbConfig, user.id, passData.new);
        
        // Update local session
        const updatedUser = { ...user, password: passData.new };
        setUser(updatedUser);
        localStorage.setItem('sf_session_user', JSON.stringify(updatedUser));
        
        alert("Password berhasil diubah!");
        setShowPasswordModal(false);
        setPassData({ old: '', new: '', confirm: '' });
    } catch (e) {
        console.error(e);
        alert("Gagal mengubah password. Pastikan koneksi database stabil.");
    } finally {
        setPassLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-slide pb-20">
      
      {/* PASSWORD MODAL */}
      {showPasswordModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}></div>
              <div className="relative bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-slide">
                  <button onClick={() => setShowPasswordModal(false)} className="absolute top-6 right-6 p-2 hover:bg-gray-50 rounded-full"><X size={20}/></button>
                  
                  <div className="text-center mb-8">
                     <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-4"><Lock size={28}/></div>
                     <h2 className="text-xl font-black text-gray-900">Ubah Password</h2>
                     <p className="text-gray-400 text-sm mt-2">Amankan akun Anda dengan password baru.</p>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                      <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Password Lama</label>
                          <input type="password" required value={passData.old} onChange={e => setPassData({...passData, old: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border focus:border-blue-200 transition-all text-sm"/>
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Password Baru</label>
                          <input type="password" required value={passData.new} onChange={e => setPassData({...passData, new: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border focus:border-blue-200 transition-all text-sm"/>
                      </div>
                      <div>
                          <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Konfirmasi Password</label>
                          <input type="password" required value={passData.confirm} onChange={e => setPassData({...passData, confirm: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border focus:border-blue-200 transition-all text-sm"/>
                      </div>
                      <button type="submit" disabled={passLoading} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl mt-4 shadow-xl active:scale-95 transition-all flex justify-center items-center gap-2">
                          {passLoading ? <Loader2 className="animate-spin" size={18}/> : 'Simpan Password'}
                      </button>
                  </form>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row items-center gap-12 p-12 bg-white rounded-[4rem] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="relative group cursor-pointer z-10">
          <img src={user.avatar} alt={user.name} className="w-48 h-48 rounded-[3.5rem] border-8 border-white shadow-2xl transition-all" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-[3.5rem]"><Camera className="text-white" size={40} /></div>
          <div className={`absolute -bottom-2 -right-2 p-3 ${isCheckedIn ? 'bg-emerald-500' : 'bg-gray-400'} text-white rounded-3xl border-4 border-white shadow-lg`}>
            {isCheckedIn ? <CheckCircle2 size={32} /> : <Clock size={32} />}
          </div>
        </div>

        <div className="flex-1 space-y-6 text-center md:text-left z-10">
          <div className="space-y-2">
             <span className={`inline-block px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${user.isSubscribed ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
               {user.isSubscribed ? '👑 Snaillabs VIP Member' : 'Standard Member'}
             </span>
             <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-none">{profileData.name}</h1>
          </div>
          <div className="flex flex-wrap justify-center md:justify-start gap-6 text-gray-400 font-black uppercase text-[10px] tracking-widest">
            <span className="flex items-center gap-2 text-gray-900"><Building2 size={16} className="text-gray-400"/> {currentWorkspace?.name}</span>
            <span className="flex items-center gap-2"><Briefcase size={16} className="text-[var(--primary-color)]"/> {user.role}</span>
            <span className="flex items-center gap-2 text-blue-600"><Instagram size={16}/> {profileData.socialMedia || '@snaillabs'}</span>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-4">
            <button onClick={() => setIsEditing(!isEditing)} className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${isEditing ? 'bg-emerald-600 text-white' : 'bg-[var(--primary-color)] text-white'}`}>
              {isEditing ? <Save size={18}/> : <UserIcon size={18}/>}
              {isEditing ? 'Simpan' : 'Edit Profile'}
            </button>
            <button onClick={() => setShowPasswordModal(true)} className="px-8 py-4 bg-white border border-gray-100 text-gray-500 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm">
                <Lock size={16}/> Ganti Password
            </button>
            {isCheckedIn ? (
              <button onClick={() => needsReport ? setShowReportModal(true) : finalizeCheckout()} disabled={!canCheckout} className="px-10 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest bg-rose-500 text-white shadow-xl disabled:opacity-50 transition-all">Checkout</button>
            ) : (
              <button onClick={handleCheckin} className="px-10 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest bg-gray-900 text-white shadow-xl transition-all">Check-in Kerja</button>
            )}
          </div>
        </div>

        {/* Profile Switcher Panel */}
        <div className="hidden lg:flex flex-col items-start p-6 bg-gray-50/50 rounded-[3rem] border border-gray-100 min-w-[280px] z-10 self-stretch">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 px-2">
               <Repeat size={12}/> Switch Workspace
           </p>
           <div className="flex-1 w-full space-y-2 overflow-y-auto custom-scrollbar pr-1 max-h-48">
               {allProfiles.map(p => {
                   const wsName = allWorkspaces.find(w => w.id === p.workspaceId)?.name || 'Unknown WS';
                   const isActive = p.id === user.id;
                   return (
                       <button 
                        key={p.id} 
                        onClick={() => !isActive && onSwitchProfile(p)}
                        className={`w-full p-3 rounded-2xl text-left transition-all flex items-center justify-between ${isActive ? 'bg-white shadow-sm border border-gray-100 ring-1 ring-black/5' : 'hover:bg-gray-100 opacity-60 hover:opacity-100'}`}
                       >
                           <div>
                               <p className="text-xs font-bold text-gray-900 truncate max-w-[150px]">{wsName}</p>
                               <p className="text-[9px] text-gray-400 uppercase tracking-wide">{p.jobdesk}</p>
                           </div>
                           {isActive && <Check size={14} className="text-emerald-500"/>}
                       </button>
                   )
               })}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm space-y-10">
            <div className="flex items-center gap-3">
               <Target className="text-[var(--primary-color)]" size={28} />
               <h3 className="text-2xl font-black text-gray-900 tracking-tight">Informasi Pekerjaan</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                  <input disabled={!isEditing} type="text" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-[2.5rem] font-bold text-gray-900 transition-all" />
               </div>
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Jobdesk Utama (Di Workspace Ini)</label>
                  <input disabled={!isEditing} type="text" value={profileData.jobdesk} onChange={e => setProfileData({...profileData, jobdesk: e.target.value})} className="w-full px-7 py-5 bg-gray-50 border border-gray-100 rounded-[2.5rem] font-bold text-gray-900 transition-all" />
               </div>
            </div>
         </div>

         <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-6">
               <FileText className="text-[var(--primary-color)]" size={24} />
               <h3 className="text-xl font-black text-gray-900 tracking-tight">Log Absensi</h3>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] custom-scrollbar">
               {user.activityLogs.slice().reverse().map((log) => (
                 <div key={log.id} className="p-5 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">{log.type}</p>
                       <p className="text-[11px] font-bold text-gray-400">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {new Date(log.timestamp).toLocaleDateString()}</p>
                    </div>
                    {log.report && <AlertCircle size={16} className="text-blue-500" />}
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Profile;
