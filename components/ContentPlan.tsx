
import React, { useState, useEffect } from 'react';
import { ContentPlanItem, PostInsight, User, Comment, SystemNotification } from '../types';
import { MOCK_CONTENT_PLANS } from '../constants';
import { scrapePostInsights } from '../services/geminiService';
import { Plus, ChevronDown, ChevronUp, FileText, Link as LinkIcon, ExternalLink, X, Save, Settings, Check, Instagram, Video, BarChart2, Loader2, Edit2, ImageIcon, UserPlus, Filter, Clock, MessageSquare, Send } from 'lucide-react';

interface ContentPlanProps {
  primaryColorHex: string;
  onSaveInsight: (insight: PostInsight) => void;
  users: User[];
  addNotification: (notif: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => void;
  currentUser: User;
}

const INITIAL_STATUS_OPTIONS: ContentPlanItem['status'][] = ['Drafting', 'Dijadwalkan', 'Diposting', 'Revisi', 'Reschedule', 'Dibatalkan'];
const ACCOUNTS = [
    { id: 'account-1', name: 'Akun Utama' }, 
    { id: 'account-2', name: 'Second Account' }, 
    { id: 'account-3', name: 'Brand Partner' }
];

const ContentPlan: React.FC<ContentPlanProps> = ({ primaryColorHex, onSaveInsight, users, addNotification, currentUser }) => {
  const [items, setItems] = useState<ContentPlanItem[]>(MOCK_CONTENT_PLANS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentPlanItem | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [filterApprovedBy, setFilterApprovedBy] = useState<string>('All');
  const [filterPlatform, setFilterPlatform] = useState<'All' | 'Instagram' | 'TikTok'>('All');
  const [activeAccount, setActiveAccount] = useState<string>('account-1');
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);
  
  // Comment State
  const [commentText, setCommentText] = useState('');

  const [formData, setFormData] = useState<{
    title: string;
    value: string;
    pillar: string;
    type: string;
    description: string;
    postLink: string;
    approvedBy: string;
    scriptUrl: string;
    visualUrl: string;
    status: ContentPlanItem['status'];
  }>({
    title: '', value: 'Educational', pillar: '', type: 'Reels', description: '', postLink: '', approvedBy: '', scriptUrl: '', visualUrl: '', status: 'Drafting'
  });

  // Auto-save logic
  useEffect(() => {
    let intervalId: any;
    if (isModalOpen) {
      intervalId = setInterval(() => {
        if (formData.title.trim().length > 0) {
          setLastAutoSave(new Date().toLocaleTimeString('id-ID'));
        }
      }, 30000);
    }
    return () => clearInterval(intervalId);
  }, [isModalOpen, formData]);

  const openEditModal = (item: ContentPlanItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title, value: item.value, pillar: item.pillar, type: item.type,
      description: item.description, postLink: item.postLink, approvedBy: item.approvedBy || '',
      scriptUrl: item.scriptUrl || '', visualUrl: item.visualUrl || '', status: item.status
    });
    setLastAutoSave(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      setItems(items.map(i => i.id === editingItem.id ? { ...i, ...formData } : i));
    } else {
      const newItem: ContentPlanItem = { 
        id: Date.now().toString(), 
        ...formData, 
        accountId: activeAccount, 
        comments: [] 
      };
      setItems([newItem, ...items]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ title: '', value: 'Educational', pillar: '', type: 'Reels', description: '', postLink: '', approvedBy: '', scriptUrl: '', visualUrl: '', status: 'Drafting' });
  };

  const handleAnalyzeLink = async (e: React.MouseEvent, item: ContentPlanItem) => {
    e.stopPropagation(); 
    if (!item.postLink || item.postLink === '' || item.postLink === '#') {
      alert("Masukkan link postingan yang valid terlebih dahulu.");
      return;
    }
    setAnalyzingId(item.id);
    try {
      const insight = await scrapePostInsights(item.postLink);
      onSaveInsight({ ...insight, sourceType: 'plan' });
      alert("Analisis berhasil! Data performa telah disinkronkan ke halaman Analitik.");
    } catch (err) {
      console.error(err);
      alert("Gagal melakukan scrapping. Pastikan link dapat diakses publik.");
    } finally {
      setAnalyzingId(null);
    }
  };

  const handlePostComment = (itemId: string) => {
      if (!commentText.trim()) return;
      
      const newComment: Comment = {
          id: Date.now().toString(),
          userId: currentUser.id,
          userName: currentUser.name,
          text: commentText,
          timestamp: new Date().toISOString()
      };

      setItems(items.map(i => {
          if (i.id === itemId) {
              return { ...i, comments: [...(i.comments || []), newComment] };
          }
          return i;
      }));

      // Trigger Notification to Approver or Owner
      const item = items.find(i => i.id === itemId);
      if (item && item.approvedBy && item.approvedBy !== currentUser.name) {
          addNotification({
              senderName: currentUser.name,
              messageText: `Komentar baru di "${item.title}": ${commentText}`,
              type: 'info'
          });
      }

      setCommentText('');
  };

  const filteredItems = items.filter(item => {
    // Account Filter
    if (item.accountId && item.accountId !== activeAccount) return false;
    // Approval Filter
    if (filterApprovedBy !== 'All' && item.approvedBy !== filterApprovedBy) return false;
    // Platform Filter (Naive check based on link or type)
    if (filterPlatform !== 'All') {
        const isInsta = item.postLink.includes('instagram') || item.type.toLowerCase().includes('reel');
        const isTikTok = item.postLink.includes('tiktok');
        if (filterPlatform === 'Instagram' && !isInsta) return false;
        if (filterPlatform === 'TikTok' && !isTikTok) return false;
    }
    return true;
  });

  const uniqueApprovers = Array.from(new Set(users.map(u => u.name)));

  return (
    <div className="space-y-6 animate-slide">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Konten Plan</h1>
          <p className="text-gray-400 font-medium">Strategi & Manajemen Konten Arunika.</p>
        </div>
        <div className="flex items-center gap-4">
           {/* Platform Filter */}
           <div className="flex bg-white rounded-2xl p-1 border border-gray-100 shadow-sm">
              {['All', 'Instagram', 'TikTok'].map((p) => (
                  <button 
                    key={p}
                    onClick={() => setFilterPlatform(p as any)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterPlatform === p ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-900'}`}
                  >
                    {p}
                  </button>
              ))}
           </div>
           
           <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="px-6 py-3 bg-blue-100 text-blue-500 rounded-2xl font-bold shadow-sm active:scale-95 flex items-center gap-2 transition-all hover:bg-blue-200">
             <Plus size={20} /> Tambah Plan
          </button>
        </div>
      </div>

      {/* Account Tabs */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
         {ACCOUNTS.map(acc => (
             <button 
                key={acc.id}
                onClick={() => setActiveAccount(acc.id)}
                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                    activeAccount === acc.id 
                    ? 'bg-white border-blue-200 text-blue-600 shadow-lg shadow-blue-50 ring-2 ring-blue-50' 
                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                }`}
             >
                {acc.name}
             </button>
         ))}
         <button className="px-4 py-3 bg-gray-50 text-gray-400 rounded-2xl border border-dashed border-gray-200 hover:border-gray-400 transition-all">
            <Plus size={16}/>
         </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-white/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
           <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)] overflow-hidden animate-slide flex flex-col max-h-[90vh] border border-gray-50">
              <div className="p-8 bg-blue-50 text-blue-500 flex justify-between items-center">
                 <div>
                    <h2 className="text-2xl font-black">{editingItem ? 'Edit Perencanaan' : 'Perencanaan Baru'}</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Arunika Creative Studio</p>
                 </div>
                 <div className="flex items-center gap-4">
                    {lastAutoSave && (
                      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-blue-400 bg-white px-3 py-1.5 rounded-xl shadow-sm">
                        <Clock size={10} /> Tersimpan otomatis: {lastAutoSave}
                      </div>
                    )}
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-blue-100/50 rounded-xl transition-all"><X size={24} /></button>
                 </div>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Judul Posting</label>
                       <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100 focus:border-blue-200 transition-all" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Status Plan</label>
                       <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100">
                          {INITIAL_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Konten Pilar</label>
                       <input value={formData.pillar} onChange={e => setFormData({...formData, pillar: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100" placeholder="Edukasi, Promo, dll" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Tipe Konten</label>
                       <input value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100" placeholder="Reels, Carousel, dll" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1 flex items-center gap-2"><FileText size={12}/> Script URL</label>
                       <input value={formData.scriptUrl} onChange={e => setFormData({...formData, scriptUrl: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100" placeholder="Link Docs/Script" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1 flex items-center gap-2"><UserPlus size={12}/> Approved By</label>
                       <select value={formData.approvedBy} onChange={e => setFormData({...formData, approvedBy: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100">
                          <option value="">Pilih Member Team</option>
                          {uniqueApprovers.map(u => <option key={u} value={u}>{u}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1 flex items-center gap-2"><ImageIcon size={12}/> Visual URL / Asset</label>
                       <input value={formData.visualUrl} onChange={e => setFormData({...formData, visualUrl: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100" placeholder="Link Asset/Canva" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1 flex items-center gap-2"><LinkIcon size={12}/> Post Live Link</label>
                       <input value={formData.postLink} onChange={e => setFormData({...formData, postLink: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100" placeholder="https://instagram.com/p/..." />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Brief Visual / Deskripsi</label>
                    <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100" placeholder="Tulis instruksi editing atau brief visual di sini..." />
                 </div>

                 <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-2">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-gray-100 text-gray-400 font-black uppercase text-[10px] tracking-widest rounded-2xl active:scale-95 transition-all">Batal</button>
                    <button type="submit" className="flex-[2] py-5 bg-blue-100 text-blue-500 font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-sm active:scale-95 transition-all hover:bg-blue-200">Simpan Perencanaan</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
         <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
               <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest">Judul</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Aksi</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {filteredItems.map(item => (
                  <React.Fragment key={item.id}>
                     <tr className="hover:bg-gray-50 transition-all cursor-pointer group" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                        <td className="px-8 py-6">
                           <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest border ${
                             item.status === 'Diposting' ? 'bg-emerald-50 text-emerald-400 border-emerald-100' : 'bg-blue-50 text-blue-400 border-blue-100'
                           }`}>{item.status}</span>
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-gray-900">{item.title}</td>
                        <td className="px-8 py-6">
                           <div className="flex items-center justify-center gap-4">
                              {/* New Quick Analyze Button */}
                              {item.postLink && item.postLink !== '#' && (
                                 <button 
                                    onClick={(e) => handleAnalyzeLink(e, item)}
                                    className={`p-2 rounded-xl transition-all shadow-sm ${
                                       analyzingId === item.id 
                                       ? 'bg-blue-100 text-blue-600 animate-pulse' 
                                       : 'bg-blue-50 text-blue-400 hover:bg-blue-100 hover:scale-110 active:scale-95'
                                    }`}
                                    title="AI Analyze Tracker"
                                 >
                                    {analyzingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <BarChart2 size={16} />}
                                 </button>
                              )}
                              <div className="p-2 text-gray-200 group-hover:text-gray-900 transition-all">{expandedId === item.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</div>
                           </div>
                        </td>
                     </tr>
                     {expandedId === item.id && (
                        <tr className="bg-gray-50/30 animate-slide">
                           <td colSpan={3} className="px-10 py-8">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                 <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Informasi Strategis</h4>
                                    <div className="grid grid-cols-2 gap-6 text-xs font-bold">
                                       <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                          <p className="text-[9px] text-gray-300 uppercase tracking-widest mb-1">Pilar / Value</p>
                                          <p className="text-gray-900">{item.pillar} • {item.value}</p>
                                       </div>
                                       <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                          <p className="text-[9px] text-gray-300 uppercase tracking-widest mb-1">Approval</p>
                                          <p className="text-gray-900">{item.approvedBy || 'Menunggu Review'}</p>
                                       </div>
                                    </div>
                                    <div className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                                       <p className="text-[9px] text-gray-300 uppercase tracking-widest mb-2">Brief Deskripsi</p>
                                       <p className="text-gray-600 leading-relaxed font-medium">{item.description || 'Tidak ada brief deskripsi tersedia.'}</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button 
                                           onClick={() => openEditModal(item)}
                                           className="flex-1 flex items-center justify-center gap-3 py-3.5 bg-gray-50 text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all hover:bg-gray-100"
                                        >
                                           <Edit2 size={16}/> Edit Perencanaan
                                        </button>
                                        <button 
                                           onClick={(e) => handleAnalyzeLink(e, item)}
                                           disabled={analyzingId !== null}
                                           className="flex-1 flex items-center justify-center gap-3 py-3.5 bg-blue-50 text-blue-500 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-blue-100 active:scale-95 transition-all"
                                        >
                                           {analyzingId === item.id ? <Loader2 size={16} className="animate-spin"/> : <BarChart2 size={16}/>}
                                           Analyze Tracker
                                        </button>
                                    </div>
                                 </div>

                                 {/* Discussion / Comments Section */}
                                 <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col h-[400px]">
                                     <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4 flex items-center gap-2"><MessageSquare size={14}/> Diskusi & Revisi</h4>
                                     <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 mb-4">
                                        {item.comments?.length === 0 && (
                                            <p className="text-center text-xs text-gray-300 italic py-10">Belum ada diskusi untuk konten ini.</p>
                                        )}
                                        {item.comments?.map((c) => (
                                            <div key={c.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                                <p className="text-[10px] font-black text-blue-500 mb-1">{c.userName}</p>
                                                <p className="text-xs text-gray-700">{c.text}</p>
                                                <p className="text-[8px] text-gray-300 mt-2 text-right">{new Date(c.timestamp).toLocaleString()}</p>
                                            </div>
                                        ))}
                                     </div>
                                     <div className="flex gap-2">
                                         <input 
                                            value={commentText} 
                                            onChange={(e) => setCommentText(e.target.value)}
                                            placeholder="Tulis komentar atau revisi..." 
                                            className="flex-1 px-4 py-3 bg-gray-50 rounded-xl outline-none text-xs font-medium"
                                         />
                                         <button onClick={() => handlePostComment(item.id)} className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
                                            <Send size={16}/>
                                         </button>
                                     </div>
                                 </div>
                              </div>
                           </td>
                        </tr>
                     )}
                  </React.Fragment>
               ))}
               {filteredItems.length === 0 && (
                 <tr>
                   <td colSpan={3} className="py-20 text-center text-gray-300 font-bold uppercase text-[10px] tracking-widest">Tidak ada perencanaan ditemukan untuk filter ini</td>
                 </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default ContentPlan;
