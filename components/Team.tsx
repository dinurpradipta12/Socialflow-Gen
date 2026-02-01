
import React, { useState } from 'react';
import { User, ThemeColor, Permissions, SystemNotification } from '../types';
import { MOCK_USERS, THEME_COLORS } from '../constants';
import { Shield, ShieldCheck, UserPlus, MoreVertical, Check, X, Edit3, Target, Power, Layout, Mail, Search } from 'lucide-react';

interface TeamProps {
  primaryColor: ThemeColor;
  currentUser: User;
  addSystemNotification: (notif: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => void;
}

const Team: React.FC<TeamProps> = ({ primaryColor, currentUser, addSystemNotification }) => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  
  const colorSet = THEME_COLORS[primaryColor];
  
  const isSuperadmin = currentUser.role === 'superuser' || currentUser.role === 'developer';
  const isAdmin = currentUser.role === 'admin';
  const isManagement = isSuperadmin || isAdmin;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const existingUser = MOCK_USERS.find(u => u.email.toLowerCase() === inviteEmail.toLowerCase());
    
    if (existingUser) {
      addSystemNotification({
        type: 'invite',
        title: 'Undangan Workspace Baru',
        message: `${currentUser.name} mengundang Anda untuk bergabung ke Snaillabs Creative.`
      });
      alert('Undangan berhasil dikirim ke ' + inviteEmail);
    } else {
      alert('Email user belum terdaftar di aplikasi.');
    }
    setInviteEmail('');
    setIsInviteModalOpen(false);
  };

  const handleUpdateUser = (updated: User) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    setEditingUser(null);
  };

  return (
    <div className="space-y-8 animate-slide">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Workspace Tim</h1>
          <p className="text-gray-400 mt-1 font-medium italic">Kelola anggota tim, peran, dan hirarki akses Snaillabs.</p>
        </div>
        {isManagement && (
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className={`flex items-center gap-2 px-8 py-4 ${colorSet.bg} ${colorSet.text} rounded-3xl font-black uppercase tracking-widest text-[11px] hover:brightness-95 transition-all shadow-sm active:scale-95`}
          >
            <UserPlus size={18} />
            <span>Undang Anggota</span>
          </button>
        )}
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-200/20 backdrop-blur-sm" onClick={() => setIsInviteModalOpen(false)}></div>
           <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)] border border-gray-50 animate-slide overflow-hidden">
              <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                 <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none">Undang Anggota</h2>
                 <button onClick={() => setIsInviteModalOpen(false)} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm"><X size={20} /></button>
              </div>
              <form onSubmit={handleInvite} className="p-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Email User Terdaftar</label>
                    <div className="relative group">
                       <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-400 transition-colors" size={18} />
                       <input 
                         required 
                         type="email" 
                         value={inviteEmail} 
                         onChange={e => setInviteEmail(e.target.value)}
                         placeholder="email@snaillabs.id" 
                         className="w-full pl-14 pr-6 py-5 bg-gray-50 border border-gray-100 rounded-[1.5rem] focus:bg-white outline-none font-bold text-gray-700" 
                       />
                    </div>
                 </div>
                 <button type="submit" className={`w-full py-5 bg-blue-100 text-blue-500 font-black rounded-3xl shadow-sm hover:bg-blue-200 active:scale-95 transition-all text-[11px] uppercase tracking-widest`}>
                    Kirim Undangan Akses
                 </button>
              </form>
           </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-200/20 backdrop-blur-sm" onClick={() => setEditingUser(null)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)] overflow-hidden animate-slide border border-gray-50">
             <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <img src={editingUser.avatar} className="w-16 h-16 rounded-[1.5rem] shadow-sm border-4 border-white" alt="" />
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">{editingUser.name}</h2>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none mt-1">{editingUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setEditingUser(null)} className="p-3 hover:bg-white rounded-2xl transition-all shadow-sm"><X size={20} /></button>
             </div>

             <div className="p-10 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-2"><Edit3 size={14}/> Jabatan & Peran</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {['admin', 'editor', 'viewer'].map(role => (
                      <button 
                        key={role} 
                        disabled={!isSuperadmin && role === 'admin'}
                        onClick={() => setEditingUser({...editingUser, role: role as any})} 
                        className={`py-4 px-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${editingUser.role === role ? `bg-blue-100 text-blue-500 border-transparent shadow-sm` : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed'}`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-2"><Layout size={14}/> Izin Akses Halaman</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(editingUser.permissions).filter(([k]) => k !== 'devPortal').map(([key, value]) => (
                      <button 
                        key={key} 
                        disabled={!isManagement}
                        onClick={() => setEditingUser({ ...editingUser, permissions: { ...editingUser.permissions, [key]: !value } })} 
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${value ? 'bg-emerald-50 border-emerald-100 text-emerald-400' : 'bg-gray-50 border-gray-100 text-gray-200'} disabled:opacity-50`}
                      >
                        <span className="text-[10px] font-black uppercase tracking-widest">{key}</span>
                        {value ? <Check size={16} /> : <X size={16} />}
                      </button>
                    ))}
                  </div>
                </div>
             </div>

             <div className="p-10 bg-gray-50/50 flex gap-4">
                <button onClick={() => setEditingUser(null)} className="flex-1 py-5 bg-white border border-gray-200 text-gray-400 font-black text-[11px] uppercase tracking-widest rounded-[1.5rem] hover:bg-gray-100 transition-all shadow-sm">Tutup</button>
                {isManagement && (
                  <button 
                    onClick={() => handleUpdateUser(editingUser)}
                    className={`flex-1 py-5 bg-blue-100 text-blue-500 font-black text-[11px] uppercase tracking-widest rounded-[1.5rem] shadow-sm transition-all active:scale-95 hover:bg-blue-200`}
                  >
                    Simpan Perubahan
                  </button>
                )}
             </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden ring-4 ring-black/5">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Anggota Tim</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Peran / Jabatan</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Akses Saat Ini</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-10 py-8">
                  <div className="flex items-center gap-5">
                    <img src={u.avatar} className="w-14 h-14 rounded-2xl shadow-sm border-4 border-white ring-1 ring-gray-100" alt="" />
                    <div>
                      <p className="text-sm font-black text-gray-900 tracking-tight leading-none">{u.name}</p>
                      <p className="text-[10px] text-gray-300 font-bold tracking-widest uppercase mt-1.5">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-8">
                  <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] border ${
                    u.role === 'superuser' ? 'bg-purple-50 text-purple-400 border-purple-100' :
                    u.role === 'developer' ? 'bg-gray-100 text-gray-500 border-gray-200 shadow-sm' :
                    u.role === 'admin' ? 'bg-blue-50 text-blue-400 border-blue-100' : 'bg-emerald-50 text-emerald-400 border-emerald-100'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-10 py-8">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${u.isSubscribed ? 'bg-emerald-300 shadow-sm' : 'bg-rose-300'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{u.isSubscribed ? 'Full Access' : 'Restricted'}</span>
                  </div>
                </td>
                <td className="px-10 py-8 text-center">
                  <button onClick={() => setEditingUser({...u})} className="p-4 text-gray-200 hover:text-blue-400 hover:bg-blue-50 rounded-[1.5rem] transition-all active:scale-90 border border-transparent hover:border-blue-100 shadow-sm">
                    <MoreVertical size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Team;
