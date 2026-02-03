
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
  Loader2,
  Settings,
  Mail,
  Phone,
  Edit3
} from 'lucide-react';

interface ProfileProps {
  user: User;
  primaryColor: ThemeColor;
  setUser: (user: User) => void;
  allWorkspaces: Workspace[];
  allProfiles: User[]; 
  onSwitchProfile: (user: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, primaryColor, setUser, allWorkspaces, allProfiles, onSwitchProfile }) => {
  const colorSet = THEME_COLORS[primaryColor];
  const [showReportModal, setShowReportModal] = useState(false);
  const [dailyReportText, setDailyReportText] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
      name: user.name,
      email: user.email,
      whatsapp: user.whatsapp || '',
      password: user.password || '',
      avatar: user.avatar || '',
      jobdesk: user.jobdesk
  });
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      
      const updatedUser: User = {
          ...user,
          name: editFormData.name,
          email: editFormData.email,
          whatsapp: editFormData.whatsapp,
          password: editFormData.password,
          avatar: editFormData.avatar,
          jobdesk: editFormData.jobdesk
      };

      const dbConfig = {
        url: localStorage.getItem('sf_db_url') || SUPABASE_CONFIG.url,
        key: localStorage.getItem('sf_db_key') || SUPABASE_CONFIG.key
      };

      try {
          await databaseService.upsertUser(dbConfig, updatedUser);
          setUser(updatedUser);
          localStorage.setItem('sf_session_user', JSON.stringify(updatedUser));
          alert("Profile berhasil diperbarui!");
          setIsEditModalOpen(false);
      } catch (err) {
          console.error(err);
          alert("Gagal memperbarui profile.");
      } finally {
          setIsSaving(false);
      }
  };

  return (
    <div className="space-y-8 animate-slide pb-20">
      
      {/* EDIT PROFILE MODAL */}
      {isEditModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
              <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl animate-slide overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50">
                      <div>
                        <h2 className="text-xl font-black text-gray-900">Edit Profile</h2>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Update Personal Information</p>
                      </div>
                      <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X size={20}/></button>
                  </div>

                  <form onSubmit={handleSaveProfile} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                      <div className="flex justify-center mb-6">
                          <div className="relative group cursor-pointer">
                              <img src={editFormData.avatar || user.avatar} className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover" />
                              <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                  <Camera className="text-white" size={20}/>
                              </div>
                          </div>
                      </div>
                      
                      <div className="space-y-4">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Full Name</label>
                              <div className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                                  <UserIcon size={16} className="text-gray-400 mr-3"/>
                                  <input required value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="bg-transparent w-full outline-none text-sm font-bold text-gray-800" />
                              </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Jobdesk</label>
                                  <div className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                                      <Briefcase size={16} className="text-gray-400 mr-3"/>
                                      <input value={editFormData.jobdesk} onChange={e => setEditFormData({...editFormData, jobdesk: e.target.value})} className="bg-transparent w-full outline-none text-sm font-bold text-gray-800" />
                                  </div>
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-gray-400 ml-1">WhatsApp</label>
                                  <div className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                                      <Phone size={16} className="text-gray-400 mr-3"/>
                                      <input value={editFormData.whatsapp} onChange={e => setEditFormData({...editFormData, whatsapp: e.target.value})} className="bg-transparent w-full outline-none text-sm font-bold text-gray-800" />
                                  </div>
                              </div>
                          </div>

                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Email Address</label>
                              <div className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                                  <Mail size={16} className="text-gray-400 mr-3"/>
                                  <input type="email" required value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="bg-transparent w-full outline-none text-sm font-bold text-gray-800" />
                              </div>
                          </div>

                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Password</label>
                              <div className="flex items-center bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100 focus-within:border-blue-200 transition-all">
                                  <Lock size={16} className="text-gray-400 mr-3"/>
                                  <input type="text" required value={editFormData.password} onChange={e => setEditFormData({...editFormData, password: e.target.value})} className="bg-transparent w-full outline-none text-sm font-bold text-gray-800" />
                              </div>
                              <p className="text-[10px] text-gray-400 ml-1">Ubah password langsung dari sini.</p>
                          </div>
                      </div>

                      <button type="submit" disabled={isSaving} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex justify-center items-center gap-2">
                          {isSaving ? <Loader2 className="animate-spin" size={18}/> : 'Simpan Perubahan'}
                      </button>
                  </form>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row items-center gap-12 p-12 bg-white rounded-[4rem] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="relative group cursor-pointer z-10">
          <img src={user.avatar} alt={user.name} className="w-48 h-48 rounded-[3.5rem] border-8 border-white shadow-2xl transition-all object-cover" />
          <div className={`absolute -bottom-2 -right-2 p-3 ${isCheckedIn ? 'bg-emerald-500' : 'bg-gray-400'} text-white rounded-3xl border-4 border-white shadow-lg`}>
            {isCheckedIn ? <CheckCircle2 size={32} /> : <Clock size={32} />}
          </div>
        </div>

        <div className="flex-1 space-y-6 text-center md:text-left z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="space-y-2">
                <span className={`inline-block px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${user.isSubscribed ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'}`}>
                {user.isSubscribed ? '👑 Snaillabs VIP Member' : 'Standard Member'}
                </span>
                <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-none">{user.name}</h1>
             </div>
             
             {/* SETTINGS BUTTON */}
             <button onClick={() => setIsEditModalOpen(true)} className="p-4 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all self-center md:self-start shadow-sm hover:shadow-md group">
                 <Settings size={24} className="group-hover:rotate-90 transition-transform duration-500"/>
             </button>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-6 text-gray-400 font-black uppercase text-[10px] tracking-widest">
            <span className="flex items-center gap-2 text-gray-900"><Building2 size={16} className="text-gray-400"/> {currentWorkspace?.name}</span>
            <span className="flex items-center gap-2"><Briefcase size={16} className="text-[var(--primary-color)]"/> {user.jobdesk}</span>
            <span className="flex items-center gap-2 text-blue-600"><Instagram size={16}/> {user.socialMedia || '@snaillabs'}</span>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-4">
            {isCheckedIn ? (
              <button onClick={() => needsReport ? setShowReportModal(true) : finalizeCheckout()} disabled={!canCheckout} className="px-10 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest bg-rose-500 text-white shadow-xl disabled:opacity-50 transition-all flex items-center gap-2">
                  <Clock size={16}/> Checkout
              </button>
            ) : (
              <button onClick={handleCheckin} className="px-10 py-4 rounded-[2rem] text-xs font-black uppercase tracking-widest bg-gray-900 text-white shadow-xl transition-all flex items-center gap-2">
                  <CheckCircle2 size={16}/> Check-in Kerja
              </button>
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
         {/* KPI Section */}
         <div className="lg:col-span-2 bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <Target className="text-[var(--primary-color)]" size={28} />
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">Key Performance Indicators</h3>
               </div>
               <span className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500">{user.kpi.length} Goals Active</span>
            </div>
            
            {user.kpi.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.kpi.map((k, i) => (
                        <div key={i} className="p-6 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex items-start gap-4 hover:bg-blue-50/50 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-500 shadow-sm font-black text-xs shrink-0">{i+1}</div>
                            <p className="text-sm font-bold text-gray-700 leading-relaxed mt-1">{k}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-10 bg-gray-50 rounded-[3rem] text-center border border-dashed border-gray-200">
                    <Target size={32} className="mx-auto text-gray-300 mb-4"/>
                    <p className="text-gray-400 font-bold text-sm">Belum ada KPI yang ditugaskan.</p>
                </div>
            )}
         </div>

         {/* Activity Log */}
         <div className="bg-white p-10 rounded-[4rem] border border-gray-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-6">
               <FileText className="text-[var(--primary-color)]" size={24} />
               <h3 className="text-xl font-black text-gray-900 tracking-tight">Log Absensi</h3>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
               {user.activityLogs.length === 0 && <p className="text-center text-gray-300 text-xs font-bold py-10">Belum ada aktivitas.</p>}
               {user.activityLogs.slice().reverse().map((log) => (
                 <div key={log.id} className="p-5 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-900">{log.type}</p>
                       <p className="text-[11px] font-bold text-gray-400">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {new Date(log.timestamp).toLocaleDateString()}</p>
                    </div>
                    {log.report && (
                        <div title="Has Daily Report">
                            <AlertCircle size={16} className="text-blue-500" />
                        </div>
                    )}
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default Profile;
