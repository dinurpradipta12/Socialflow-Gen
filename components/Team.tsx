
import React, { useState } from 'react';
import { User, ThemeColor, Permissions, SystemNotification, Workspace } from '../types';
import { THEME_COLORS } from '../constants';
import { Shield, ShieldCheck, UserPlus, MoreVertical, Check, X, Edit3, Trash2, Key, Target, CheckSquare, Plus, Copy, Link as LinkIcon, LogIn, Hash } from 'lucide-react';

interface TeamProps {
  primaryColor: ThemeColor;
  currentUser: User;
  workspace: Workspace;
  onUpdateWorkspace: (name: string, color: ThemeColor) => void;
  addSystemNotification: (notif: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => void;
  allUsers: User[];
  setUsers: (users: User[]) => void;
  setWorkspace: (ws: Workspace) => void;
  onJoinAnotherWorkspace: () => void;
}

const Team: React.FC<TeamProps> = ({ primaryColor, currentUser, workspace, onUpdateWorkspace, addSystemNotification, allUsers, setUsers, setWorkspace, onJoinAnotherWorkspace }) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newKpi, setNewKpi] = useState('');
  
  const colorSet = THEME_COLORS[primaryColor];
  const isOwner = currentUser.role === 'superuser' || currentUser.id === workspace.ownerId || currentUser.role === 'developer';

  const handleRemoveMember = (userId: string) => {
    if (userId === workspace.ownerId) {
      alert("Owner tidak bisa dihapus dari tim.");
      return;
    }
    if (confirm("Hapus member ini secara permanen dari Workspace?")) {
      const updatedMembers = workspace.members.filter(m => m.id !== userId);
      setWorkspace({ ...workspace, members: updatedMembers });
      // Note: In real app, also remove from global users or update their workspaceId
    }
  };

  const handleUpdateUser = (updated: User) => {
    const updatedMembers = workspace.members.map(m => m.id === updated.id ? updated : m);
    setWorkspace({ ...workspace, members: updatedMembers });
    setUsers(allUsers.map(u => u.id === updated.id ? updated : u));
    setEditingUser(null);
  };

  const togglePermission = (key: keyof Permissions) => {
    if (!editingUser) return;
    setEditingUser({
      ...editingUser,
      permissions: {
        ...editingUser.permissions,
        [key]: !editingUser.permissions[key]
      }
    });
  };

  const addKpi = () => {
    if (!editingUser || !newKpi.trim()) return;
    setEditingUser({
      ...editingUser,
      kpi: [...editingUser.kpi, newKpi.trim()]
    });
    setNewKpi('');
  };

  const removeKpi = (index: number) => {
    if (!editingUser) return;
    setEditingUser({
      ...editingUser,
      kpi: editingUser.kpi.filter((_, i) => i !== index)
    });
  };

  const copyInviteCode = () => {
      const code = workspace.inviteCode;
      navigator.clipboard.writeText(code);
      alert(`Kode Workspace berhasil disalin:\n${code}`);
  };

  return (
    <div className="space-y-8 animate-slide">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Team Hub</h1>
          <p className="text-gray-400 mt-1 font-medium">Kelola hak akses dan performa tim di Workspace <span className="text-gray-900 font-bold">{workspace.name}</span>.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            <button 
              onClick={onJoinAnotherWorkspace}
              className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-200 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-sm hover:bg-gray-50 active:scale-95 transition-all text-gray-600"
            >
              <LogIn size={16} />
              <span>Join Other WS</span>
            </button>
            <button 
              onClick={copyInviteCode}
              className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-200 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-sm hover:bg-gray-50 active:scale-95 transition-all text-blue-600"
            >
              <Hash size={16} />
              <span>Copy Code: {workspace.inviteCode}</span>
            </button>
            {isOwner && (
                <button 
                onClick={() => setIsInviteModalOpen(true)}
                className={`flex items-center gap-2 px-8 py-4 ${colorSet.bg} ${colorSet.text} rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all`}
                >
                <UserPlus size={18} />
                <span>Add Member</span>
                </button>
            )}
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setEditingUser(null)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-slide flex flex-col max-h-[90vh]">
             <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <img src={editingUser.avatar} className="w-16 h-16 rounded-2xl border-4 border-white shadow-md" alt="" />
                  <div>
                    <h2 className="text-xl font-black text-gray-900">{editingUser.name}</h2>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{editingUser.role} • {editingUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setEditingUser(null)} className="p-3 hover:bg-gray-50 rounded-xl"><X size={24} /></button>
             </div>
             
             <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar flex-1">
                {/* Role Selection */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Shield size={14}/> User Authority Role</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {['admin', 'editor', 'viewer', 'superuser'].map(r => (
                      <button key={r} onClick={() => setEditingUser({...editingUser, role: r as any})} className={`py-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${editingUser.role === r ? 'bg-blue-100 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Permissions Toggles */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Key size={14}/> Access Permissions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.keys(editingUser.permissions).map(key => (
                      <button 
                        key={key} 
                        onClick={() => togglePermission(key as keyof Permissions)}
                        className={`p-4 rounded-2xl border text-left flex flex-col transition-all ${editingUser.permissions[key as keyof Permissions] ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100 opacity-60'}`}
                      >
                         <div className="flex justify-between items-start mb-1">
                           <span className="text-[10px] font-black uppercase text-gray-900">{key}</span>
                           {editingUser.permissions[key as keyof Permissions] ? <CheckSquare size={14} className="text-emerald-500" /> : <X size={14} className="text-gray-300" />}
                         </div>
                         <span className="text-[8px] font-bold text-gray-400 uppercase">Allow Page View</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* KPI Management */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Target size={14}/> Individual KPI Targets</h3>
                  <div className="flex gap-2">
                    <input 
                      value={newKpi} 
                      onChange={e => setNewKpi(e.target.value)}
                      placeholder="Contoh: Increase Reels Reach by 10%" 
                      className="flex-1 px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none text-xs font-bold" 
                    />
                    <button onClick={addKpi} className="px-5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"><Plus size={16}/></button>
                  </div>
                  <div className="space-y-2">
                    {editingUser.kpi.map((k, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-xs font-bold text-gray-700">{k}</span>
                        <button onClick={() => removeKpi(i)} className="p-1.5 text-rose-300 hover:text-rose-500"><X size={14}/></button>
                      </div>
                    ))}
                  </div>
                </div>
             </div>

             <div className="p-8 bg-gray-50 flex gap-4">
                <button onClick={() => setEditingUser(null)} className="flex-1 py-4 bg-white border border-gray-200 text-gray-400 font-black text-[10px] uppercase rounded-2xl">Batal</button>
                <button onClick={() => handleUpdateUser(editingUser)} className="flex-1 py-4 bg-blue-500 text-white font-black text-[10px] uppercase rounded-2xl shadow-lg">Simpan Authority</button>
             </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden ring-4 ring-black/5">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Team Member</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Authority Role</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">KPI Count</th>
              <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {workspace.members.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-10 py-8">
                  <div className="flex items-center gap-5">
                    <img src={u.avatar} className="w-14 h-14 rounded-2xl border-4 border-white shadow-md ring-1 ring-gray-100" alt="" />
                    <div>
                      <p className="text-sm font-black text-gray-900">{u.name} {u.id === workspace.ownerId && <span className="ml-1 text-[8px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">OWNER</span>}</p>
                      <p className="text-[10px] text-gray-300 font-bold uppercase mt-1">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-10 py-8">
                  <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${u.role === 'superuser' ? 'bg-amber-50 text-amber-500 border border-amber-100' : 'bg-blue-50 text-blue-500 border border-blue-100'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-10 py-8">
                  <span className="text-xs font-black text-gray-500">{u.kpi.length} Goals Set</span>
                </td>
                <td className="px-10 py-8">
                  <div className="flex justify-center gap-2">
                    {isOwner && (
                      <>
                        <button onClick={() => setEditingUser({...u})} className="p-3 text-blue-400 hover:bg-blue-50 rounded-xl transition-all" title="Manage Permission & KPI">
                          <Edit3 size={18} />
                        </button>
                        {u.id !== workspace.ownerId && (
                          <button onClick={() => handleRemoveMember(u.id)} className="p-3 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Remove Member Permanently">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
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
