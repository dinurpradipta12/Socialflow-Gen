
import React, { useState } from 'react';
import { User, ThemeColor, Permissions, SystemNotification, Workspace } from '../types';
import { THEME_COLORS } from '../constants';
import { Shield, UserPlus, X, Edit3, Trash2, Key, Target, CheckSquare, Plus, Link as LinkIcon, LogIn, Hash, LayoutGrid, List, Briefcase, Phone, Mail, Building2, User as UserIcon } from 'lucide-react';

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
  const [editingUser, setEditingUser] = useState<User | null>(null); // For permission editing
  const [viewingUser, setViewingUser] = useState<User | null>(null); // For detail viewing
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newKpi, setNewKpi] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  
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
    <div className="space-y-8 animate-slide pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Team Hub</h1>
          <p className="text-gray-400 mt-1 font-medium">Kelola hak akses dan performa tim di Workspace <span className="text-gray-900 font-bold">{workspace.name}</span>.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white p-1 rounded-2xl border border-gray-200 flex">
                <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid size={18}/></button>
                <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}><List size={18}/></button>
            </div>
            
            <button onClick={copyInviteCode} className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-200 rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-sm hover:bg-gray-50 active:scale-95 transition-all text-blue-600">
              <Hash size={16} /> <span>Code: {workspace.inviteCode}</span>
            </button>
            <button onClick={onJoinAnotherWorkspace} className="p-4 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 text-gray-500 shadow-sm" title="Join Other Workspace"><LogIn size={18}/></button>
        </div>
      </div>

      {/* MEMBER DETAIL VIEW MODAL */}
      {viewingUser && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingUser(null)}></div>
              <div className="relative bg-white w-full max-w-4xl h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden animate-slide flex flex-col">
                  <div className="p-8 border-b border-gray-50 flex justify-between items-center shrink-0">
                      <div className="flex items-center gap-3">
                          <h2 className="text-2xl font-black text-gray-900">Member Profile</h2>
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${viewingUser.role === 'superuser' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>{viewingUser.role}</span>
                      </div>
                      <button onClick={() => setViewingUser(null)} className="p-3 hover:bg-gray-50 rounded-2xl transition-colors"><X size={24}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-gray-50/50">
                      <div className="flex flex-col md:flex-row gap-8 mb-8">
                          <img src={viewingUser.avatar} className="w-32 h-32 rounded-[2.5rem] bg-white border-4 border-white shadow-xl object-cover shrink-0" />
                          <div className="flex-1 space-y-4">
                              <div>
                                  <h1 className="text-4xl font-black text-gray-900 tracking-tight">{viewingUser.name}</h1>
                                  <p className="text-gray-400 font-bold mt-1">{viewingUser.email}</p>
                              </div>
                              <div className="flex flex-wrap gap-4">
                                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm text-xs font-bold text-gray-600">
                                      <Briefcase size={14} className="text-blue-500"/> {viewingUser.jobdesk}
                                  </div>
                                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm text-xs font-bold text-gray-600">
                                      <Phone size={14} className="text-emerald-500"/> {viewingUser.whatsapp || '-'}
                                  </div>
                              </div>
                          </div>
                          {isOwner && (
                              <button onClick={() => { setEditingUser(viewingUser); setViewingUser(null); }} className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl self-start hover:bg-black transition-all">
                                  Edit Authority
                              </button>
                          )}
                      </div>

                      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                          <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><Target size={20} className="text-blue-500"/> Performance KPI</h3>
                          {viewingUser.kpi.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {viewingUser.kpi.map((k, i) => (
                                      <div key={i} className="p-5 bg-gray-50 rounded-3xl border border-gray-100 flex gap-4 items-start">
                                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-[10px] font-black shadow-sm text-gray-400 shrink-0">{i+1}</div>
                                          <p className="text-sm font-bold text-gray-700 leading-relaxed">{k}</p>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="text-center py-10 text-gray-300 font-bold uppercase text-xs tracking-widest border-2 border-dashed border-gray-100 rounded-3xl">No KPI Assigned</div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* EDIT AUTHORITY MODAL (Existing) */}
      {editingUser && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setEditingUser(null)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-slide flex flex-col max-h-[90vh]">
             <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <img src={editingUser.avatar} className="w-16 h-16 rounded-2xl border-4 border-white shadow-md" alt="" />
                  <div>
                    <h2 className="text-xl font-black text-gray-900">{editingUser.name}</h2>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Authority Manager</p>
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
                      placeholder="Add New KPI..." 
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

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspace.members.map(u => (
                  <div 
                    key={u.id} 
                    onClick={() => setViewingUser(u)}
                    className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                  >
                      <div className="flex items-start gap-4 mb-6">
                          <img src={u.avatar} className="w-16 h-16 rounded-3xl bg-gray-50 object-cover shadow-sm group-hover:scale-105 transition-transform" />
                          <div>
                              <h3 className="font-black text-gray-900 text-lg leading-tight">{u.name}</h3>
                              <p className="text-xs text-gray-400 font-bold mb-2">{u.jobdesk}</p>
                              <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${u.role === 'superuser' ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{u.role}</span>
                          </div>
                      </div>
                      
                      <div className="flex gap-2 border-t border-gray-50 pt-4">
                          <div className="flex-1 text-center p-2 rounded-2xl bg-gray-50">
                              <p className="text-[10px] font-black text-gray-400 uppercase">KPIs</p>
                              <p className="text-xl font-black text-gray-900">{u.kpi.length}</p>
                          </div>
                          <div className="flex-1 text-center p-2 rounded-2xl bg-gray-50">
                              <p className="text-[10px] font-black text-gray-400 uppercase">Score</p>
                              <p className="text-xl font-black text-emerald-500">{u.performanceScore}</p>
                          </div>
                      </div>

                      {isOwner && u.id !== workspace.ownerId && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleRemoveMember(u.id); }} 
                            className="absolute top-4 right-4 p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          >
                              <Trash2 size={16}/>
                          </button>
                      )}
                  </div>
              ))}
          </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden ring-4 ring-black/5">
            <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Team Member</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Jobdesk</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {workspace.members.map(u => (
                <tr key={u.id} onClick={() => setViewingUser(u)} className="hover:bg-gray-50/50 transition-colors cursor-pointer">
                    <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                        <img src={u.avatar} className="w-10 h-10 rounded-xl border-2 border-white shadow-sm" alt="" />
                        <div>
                        <p className="text-sm font-black text-gray-900">{u.name}</p>
                        <p className="text-[10px] text-gray-300 font-bold uppercase">{u.email}</p>
                        </div>
                    </div>
                    </td>
                    <td className="px-10 py-6">
                        <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${u.role === 'superuser' ? 'bg-amber-50 text-amber-500 border border-amber-100' : 'bg-blue-50 text-blue-500 border border-blue-100'}`}>
                            {u.role}
                        </span>
                    </td>
                    <td className="px-10 py-6">
                        <span className="text-xs font-bold text-gray-500">{u.jobdesk}</span>
                    </td>
                    <td className="px-10 py-6 text-center">
                        {isOwner ? (
                            <button onClick={(e) => { e.stopPropagation(); setEditingUser(u); }} className="p-2 text-blue-400 hover:bg-blue-50 rounded-xl transition-all">
                                <Edit3 size={16} />
                            </button>
                        ) : (
                            <button className="p-2 text-gray-300 hover:text-gray-500"><UserIcon size={16}/></button>
                        )}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      )}
    </div>
  );
};

export default Team;
