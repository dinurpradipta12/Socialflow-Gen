
import React, { useState } from 'react';
import { User, ThemeColor, Permissions, SystemNotification, Workspace } from '../types';
import { THEME_COLORS } from '../constants';
import { Shield, ShieldCheck, UserPlus, MoreVertical, Check, X, Edit3, Link as LinkIcon, Share2, Palette, Settings as SettingsIcon, Mail, Copy } from 'lucide-react';

interface TeamProps {
  primaryColor: ThemeColor;
  currentUser: User;
  workspace: Workspace;
  onUpdateWorkspace: (name: string, color: ThemeColor) => void;
  addSystemNotification: (notif: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => void;
  allUsers: User[]; // Menggunakan list user dinamis dari App.tsx
  setWorkspace: (ws: Workspace) => void;
}

const Team: React.FC<TeamProps> = ({ primaryColor, currentUser, workspace, onUpdateWorkspace, addSystemNotification, allUsers, setWorkspace }) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  
  const [wsName, setWsName] = useState(workspace.name);
  const [wsColor, setWsColor] = useState<ThemeColor>(workspace.color);
  
  const colorSet = THEME_COLORS[primaryColor];
  const isManagement = currentUser.role === 'superuser' || currentUser.role === 'developer' || currentUser.role === 'admin';

  const copyInviteLink = () => {
    // Generate URL: baseUrl + ?join=inviteCode
    const baseUrl = window.location.origin + window.location.pathname;
    const inviteUrl = `${baseUrl}?join=${workspace.inviteCode}`;
    
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleInviteByEmail = (e: React.FormEvent) => {
    e.preventDefault();
    // Cek di allUsers dinamis
    const targetUser = allUsers.find(u => u.email.toLowerCase() === inviteEmail.toLowerCase());
    
    if (targetUser) {
      // Tambahkan ke member workspace jika belum ada
      if (workspace.members.some(m => m.id === targetUser.id)) {
        alert('User sudah menjadi anggota tim.');
      } else {
        const updatedMembers = [...workspace.members, targetUser];
        setWorkspace({ ...workspace, members: updatedMembers });
        alert(`${targetUser.name} berhasil ditambahkan ke tim.`);
      }
    } else {
      alert('Email belum terdaftar atau belum disetujui Developer. Silakan minta user untuk mendaftar dulu.');
    }
    setInviteEmail('');
    setIsInviteModalOpen(false);
  };

  const handleUpdateUserPermissions = (updated: User) => {
    const updatedMembers = workspace.members.map(m => m.id === updated.id ? updated : m);
    setWorkspace({ ...workspace, members: updatedMembers });
    setEditingUser(null);
  };

  return (
    <div className="space-y-8 animate-slide">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Team Workspace</h1>
          <p className="text-gray-400 mt-1 font-medium italic">Kelola kolaborasi tim Snaillabs di sini.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={copyInviteLink}
            className={`flex items-center gap-2 px-6 py-4 bg-white border border-gray-100 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-sm hover:bg-gray-50 transition-all ${isCopied ? 'text-emerald-500' : 'text-gray-400'}`}
          >
            {isCopied ? <Check size={16}/> : <Share2 size={16} />}
            <span>{isCopied ? 'Link Tersalin!' : 'Salin Link Undangan'}</span>
          </button>
          {isManagement && (
            <button 
              onClick={() => setIsInviteModalOpen(true)}
              className={`flex items-center gap-2 px-8 py-4 ${colorSet.bg} ${colorSet.text} rounded-3xl font-black uppercase tracking-widest text-[10px] hover:brightness-95 transition-all shadow-sm active:scale-95`}
            >
              <UserPlus size={18} />
              <span>Undang via Email</span>
            </button>
          )}
        </div>
      </div>

      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-white/50 backdrop-blur-sm" onClick={() => setIsInviteModalOpen(false)}></div>
           <div className="relative bg-white w-full max-w-md rounded-[3rem] shadow-2xl border border-gray-50 animate-slide overflow-hidden p-10">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-xl font-black text-gray-900">Undang Anggota</h2>
                 <button onClick={() => setIsInviteModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X /></button>
              </div>
              <form onSubmit={handleInviteByEmail} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email User Terdaftar</label>
                    <input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@example.com" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white outline-none font-bold text-gray-700" />
                 </div>
                 <button type="submit" className="w-full py-5 bg-blue-100 text-blue-500 font-black rounded-3xl uppercase tracking-widest text-[10px] shadow-sm hover:bg-blue-200 transition-all">Tambahkan ke Tim</button>
              </form>
           </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm" onClick={() => setEditingUser(null)}></div>
          <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-slide border border-gray-50">
             <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <img src={editingUser.avatar} className="w-16 h-16 rounded-[1.5rem] border-4 border-white shadow-md" alt="" />
                  <div>
                    <h2 className="text-xl font-black text-gray-900">{editingUser.name}</h2>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{editingUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setEditingUser(null)} className="p-3"><X size={20} /></button>
             </div>
             <div className="p-10 space-y-10">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Peran / Jabatan</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {['admin', 'editor', 'viewer'].map(role => (
                      <button key={role} onClick={() => setEditingUser({...editingUser, role: role as any})} className={`py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${editingUser.role === role ? `bg-blue-100 text-blue-500 border-transparent shadow-sm` : 'bg-white text-gray-400 border-gray-100 hover:bg-gray-50'}`}>
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
             </div>
             <div className="p-10 bg-gray-50/50 flex gap-4">
                <button onClick={() => setEditingUser(null)} className="flex-1 py-5 bg-white border border-gray-200 text-gray-400 font-black text-[10px] uppercase rounded-[1.5rem]">Batal</button>
                <button onClick={() => handleUpdateUserPermissions(editingUser)} className="flex-1 py-5 bg-blue-100 text-blue-500 font-black text-[10px] uppercase rounded-[1.5rem] shadow-sm">Simpan</button>
             </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden ring-4 ring-black/5">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Member</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Role</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Status Access</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {workspace.members.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-10 py-8">
                  <div className="flex items-center gap-5">
                    <img src={u.avatar} className="w-14 h-14 rounded-2xl border-4 border-white shadow-md ring-1 ring-gray-100" alt="" />
                    <div>
                      <p className="text-sm font-black text-gray-900">{u.name}</p>
                      <p className="text-[10px] text-gray-300 font-bold uppercase mt-1">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-8">
                  <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-500 border border-blue-100 text-[9px] font-black uppercase tracking-widest">
                    {u.role}
                  </span>
                </td>
                <td className="px-10 py-8">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span className="text-[10px] font-black uppercase text-gray-600">Terdaftar</span>
                  </div>
                </td>
                <td className="px-10 py-8 text-center">
                  <button onClick={() => setEditingUser({...u})} className="p-3 text-gray-300 hover:text-blue-500 rounded-xl hover:bg-blue-50 transition-all">
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
