
import React, { useState, useEffect } from 'react';
import { ContentPlanItem, PostInsight, User, Comment, SystemNotification, SocialAccount } from '../types';
import { MOCK_CONTENT_PLANS } from '../constants';
import { scrapePostInsights } from '../services/geminiService';
import { Plus, ChevronDown, FileText, Link as LinkIcon, ExternalLink, X, Save, Check, Instagram, Video, BarChart2, Loader2, Edit2, ImageIcon, UserPlus, Filter, Clock, MessageSquare, Send, Edit, Trash2, Calendar, Smile, CheckCircle } from 'lucide-react';

interface ContentPlanProps {
  primaryColorHex: string;
  onSaveInsight: (insight: PostInsight) => void;
  users: User[];
  addNotification: (notif: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => void;
  currentUser: User;
  accounts: SocialAccount[];
  setAccounts: (accounts: SocialAccount[]) => void;
  targetContentId?: string | null;
}

const INITIAL_STATUS_OPTIONS: ContentPlanItem['status'][] = ['Drafting', 'Dijadwalkan', 'Diposting', 'Revisi', 'Reschedule', 'Dibatalkan'];
const EMOJIS = ['👍', '🔥', '❤️', '😂', '😮', '😢', '👏', '🎉', '✅', '❌'];

const ContentPlan: React.FC<ContentPlanProps> = ({ primaryColorHex, onSaveInsight, users, addNotification, currentUser, accounts, setAccounts, targetContentId }) => {
  const [items, setItems] = useState<ContentPlanItem[]>(MOCK_CONTENT_PLANS);
  // Replaced expandedId with detailedViewItem for Modal Logic
  const [detailedViewItem, setDetailedViewItem] = useState<ContentPlanItem | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentPlanItem | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  
  // Filters
  const [filterApprovedBy, setFilterApprovedBy] = useState<string>('All');
  const [filterPlatform, setFilterPlatform] = useState<'All' | 'Instagram' | 'TikTok'>('All');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  const [activeAccount, setActiveAccount] = useState<string>(accounts[0]?.id || 'account-1');
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);
  
  // Account Management State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountFormData, setAccountFormData] = useState({ name: '', instagram: '', tiktok: '' });
  const [editingAccount, setEditingAccount] = useState<SocialAccount | null>(null);

  // Comment & Interaction State
  const [commentText, setCommentText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Link Edit State in Detail View
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [tempLink, setTempLink] = useState('');

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
    postDate: string; // Added Post Date
  }>({
    title: '', value: 'Educational', pillar: '', type: 'Reels', description: '', postLink: '', approvedBy: '', scriptUrl: '', visualUrl: '', status: 'Drafting', postDate: ''
  });

  // Effect to handle Deep Linking from Notification
  useEffect(() => {
      if (targetContentId) {
          const item = items.find(i => i.id === targetContentId);
          if (item) {
              setDetailedViewItem(item);
              // Also ensure we switch to the right account tab if needed
              if (item.accountId && item.accountId !== activeAccount) {
                  setActiveAccount(item.accountId);
              }
          }
      }
  }, [targetContentId, items]);

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

  const handleSaveAccount = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingAccount) {
          // Rename Logic
          setAccounts(accounts.map(acc => acc.id === editingAccount.id ? { ...acc, name: accountFormData.name, instagramUsername: accountFormData.instagram, tiktokUsername: accountFormData.tiktok } : acc));
          setEditingAccount(null);
      } else {
          // Add Logic
          const newAccount: SocialAccount = {
              id: `acc-${Date.now()}`,
              name: accountFormData.name,
              instagramUsername: accountFormData.instagram,
              tiktokUsername: accountFormData.tiktok
          };
          setAccounts([...accounts, newAccount]);
          setActiveAccount(newAccount.id); // Switch to new account
      }
      setIsAccountModalOpen(false);
      setAccountFormData({ name: '', instagram: '', tiktok: '' });
  };

  const openEditModal = (item: ContentPlanItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title, value: item.value, pillar: item.pillar, type: item.type,
      description: item.description, postLink: item.postLink, approvedBy: item.approvedBy || '',
      scriptUrl: item.scriptUrl || '', visualUrl: item.visualUrl || '', status: item.status,
      postDate: item.postDate || ''
    });
    setLastAutoSave(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      const updatedItem = { ...editingItem, ...formData };
      setItems(items.map(i => i.id === editingItem.id ? updatedItem : i));
      // Update detailed view if it's open and matching
      if (detailedViewItem?.id === editingItem.id) {
          setDetailedViewItem(updatedItem);
      }
    } else {
      const newItem: ContentPlanItem = { 
        id: Date.now().toString(), 
        creatorId: currentUser.id,
        ...formData, 
        accountId: activeAccount, 
        comments: [] 
      };
      setItems([newItem, ...items]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ title: '', value: 'Educational', pillar: '', type: 'Reels', description: '', postLink: '', approvedBy: '', scriptUrl: '', visualUrl: '', status: 'Drafting', postDate: '' });
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

      const updatedItems = items.map(i => {
          if (i.id === itemId) {
              const updated = { ...i, comments: [...(i.comments || []), newComment] };
              if (detailedViewItem?.id === i.id) setDetailedViewItem(updated);
              return updated;
          }
          return i;
      });
      setItems(updatedItems);

      // Trigger Notification Logic
      const item = items.find(i => i.id === itemId);
      
      const mentions = commentText.match(/@(\w+)/g);
      const mentionedUser = mentions ? mentions[0].replace('@', '') : null;

      if (item && item.creatorId !== currentUser.id) {
          addNotification({
              senderName: currentUser.name,
              messageText: `Mengomentari konten: "${item.title}": ${commentText}`,
              targetContentId: item.id,
              type: 'info'
          });
      }

      if (mentionedUser) {
          addNotification({
              senderName: currentUser.name,
              messageText: `Me-mention Anda di konten "${item.title}": ${commentText}`,
              targetContentId: item.id,
              type: 'info'
          });
      }

      setCommentText('');
      setShowEmojiPicker(false);
  };

  const handleUpdateLink = (itemId: string) => {
      const updatedItems = items.map(i => {
          if(i.id === itemId) {
              return { ...i, postLink: tempLink };
          }
          return i;
      });
      setItems(updatedItems);
      if (detailedViewItem && detailedViewItem.id === itemId) {
          setDetailedViewItem({ ...detailedViewItem, postLink: tempLink });
      }
      setIsEditingLink(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent, itemId: string) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handlePostComment(itemId);
      }
  };

  const addEmoji = (emoji: string) => {
      setCommentText(prev => prev + emoji);
  };

  const filteredItems = items.filter(item => {
    // Account Filter
    if (item.accountId && item.accountId !== activeAccount) return false;
    // Approval Filter
    if (filterApprovedBy !== 'All' && item.approvedBy !== filterApprovedBy) return false;
    // Platform Filter
    if (filterPlatform !== 'All') {
        const isInsta = item.postLink.includes('instagram') || item.type.toLowerCase().includes('reel') || item.type.toLowerCase().includes('carousel');
        const isTikTok = item.postLink.includes('tiktok');
        if (filterPlatform === 'Instagram' && !isInsta) return false;
        if (filterPlatform === 'TikTok' && !isTikTok) return false;
    }
    // Date Range Filter
    if (filterStartDate || filterEndDate) {
        const itemDateStr = item.postDate;
        if (!itemDateStr) return false;
        const itemDate = new Date(itemDateStr).getTime();
        
        if (filterStartDate) {
            if (itemDate < new Date(filterStartDate).getTime()) return false;
        }
        if (filterEndDate) {
            const endDate = new Date(filterEndDate);
            endDate.setHours(23, 59, 59); // Include entire end day
            if (itemDate > endDate.getTime()) return false;
        }
    }

    return true;
  });

  const uniqueApprovers = Array.from(new Set(users.map(u => u.name)));

  // Helper for row visual style
  const getRowStyle = (item: ContentPlanItem) => {
      const isInsta = item.postLink.includes('instagram') || item.type.toLowerCase().includes('reel');
      if (isInsta) return "border-l-[6px] border-l-purple-500 bg-purple-50/30";
      return "border-l-[6px] border-l-slate-900 bg-gray-50/50";
  };

  return (
    <div className="space-y-6 animate-slide relative">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Konten Plan</h1>
          <p className="text-gray-400 font-medium">Strategi & Manajemen Konten Arunika.</p>
        </div>
        <div className="flex flex-col items-end gap-3">
           <div className="flex gap-2">
                <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="px-6 py-3 bg-blue-100 text-blue-500 rounded-2xl font-bold shadow-sm active:scale-95 flex items-center gap-2 transition-all hover:bg-blue-200">
                    <Plus size={20} /> Tambah Plan
                </button>
           </div>
           {/* Filters Toolbar */}
           <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 px-3 border-r border-gray-100">
                    <Filter size={14} className="text-gray-400" />
                    <span className="text-[10px] font-black uppercase text-gray-400">Filter:</span>
                </div>
                {['All', 'Instagram', 'TikTok'].map((p) => (
                  <button 
                    key={p}
                    onClick={() => setFilterPlatform(p as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterPlatform === p ? 'bg-gray-900 text-white' : 'text-gray-400 hover:text-gray-900'}`}
                  >
                    {p}
                  </button>
                ))}
                <div className="h-4 w-[1px] bg-gray-200 mx-1"></div>
                <div className="flex items-center gap-2">
                    <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="bg-gray-50 border-none rounded-lg text-[10px] font-bold px-2 py-1 outline-none text-gray-600" />
                    <span className="text-gray-300">-</span>
                    <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="bg-gray-50 border-none rounded-lg text-[10px] font-bold px-2 py-1 outline-none text-gray-600" />
                </div>
           </div>
        </div>
      </div>

      {/* Account Tabs */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
         {accounts.map(acc => (
             <button 
                key={acc.id}
                onClick={() => setActiveAccount(acc.id)}
                className={`group relative px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border flex items-center gap-2 ${
                    activeAccount === acc.id 
                    ? 'bg-white border-blue-200 text-blue-600 shadow-lg shadow-blue-50 ring-2 ring-blue-50' 
                    : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                }`}
             >
                {acc.name}
                {activeAccount === acc.id && (
                    <span onClick={(e) => { e.stopPropagation(); setEditingAccount(acc); setAccountFormData({name: acc.name, instagram: acc.instagramUsername || '', tiktok: acc.tiktokUsername || ''}); setIsAccountModalOpen(true); }} className="ml-2 p-1 hover:bg-blue-50 rounded-full transition-colors">
                        <Edit size={12} />
                    </span>
                )}
             </button>
         ))}
         <button onClick={() => { setEditingAccount(null); setAccountFormData({name: '', instagram: '', tiktok: ''}); setIsAccountModalOpen(true); }} className="px-4 py-3 bg-gray-50 text-gray-400 rounded-2xl border border-dashed border-gray-200 hover:border-gray-400 transition-all">
            <Plus size={16}/>
         </button>
      </div>

      {/* Account Modal */}
      {isAccountModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
             <div className="absolute inset-0 bg-white/50 backdrop-blur-sm" onClick={() => setIsAccountModalOpen(false)}></div>
             <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 border border-gray-100 animate-slide">
                 <button onClick={() => setIsAccountModalOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-50 rounded-full"><X size={18}/></button>
                 <h2 className="text-xl font-black text-gray-900 mb-6">{editingAccount ? 'Edit Akun' : 'Tambah Akun Baru'}</h2>
                 <form onSubmit={handleSaveAccount} className="space-y-4">
                     <div><label className="text-[10px] font-black uppercase text-gray-400">Nama Akun</label><input required value={accountFormData.name} onChange={e => setAccountFormData({...accountFormData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none font-bold text-sm" /></div>
                     <div><label className="text-[10px] font-black uppercase text-gray-400">Instagram Username</label><input value={accountFormData.instagram} onChange={e => setAccountFormData({...accountFormData, instagram: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none font-bold text-sm" /></div>
                     <div><label className="text-[10px] font-black uppercase text-gray-400">TikTok Username</label><input value={accountFormData.tiktok} onChange={e => setAccountFormData({...accountFormData, tiktok: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none font-bold text-sm" /></div>
                     <button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest mt-2">Simpan Akun</button>
                 </form>
             </div>
          </div>
      )}

      {/* Content Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-white/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
           <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)] overflow-hidden animate-slide flex flex-col max-h-[90vh] border border-gray-50">
              <div className="p-8 bg-blue-50 text-blue-500 flex justify-between items-center">
                 <div>
                    <h2 className="text-2xl font-black">{editingItem ? 'Edit Perencanaan' : 'Perencanaan Baru'}</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Arunika Creative Studio</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-blue-100/50 rounded-xl transition-all"><X size={24} /></button>
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
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Konten Pilar</label><input value={formData.pillar} onChange={e => setFormData({...formData, pillar: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Tipe Konten</label><input value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100" /></div>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Tanggal Posting</label><input type="date" value={formData.postDate} onChange={e => setFormData({...formData, postDate: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Approved By</label>
                       <select value={formData.approvedBy} onChange={e => setFormData({...formData, approvedBy: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100">
                          <option value="">Pilih Member Team</option>{uniqueApprovers.map(u => <option key={u} value={u}>{u}</option>)}
                       </select>
                    </div>
                 </div>
                 <div className="space-y-2"><label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Post Live Link (Opsional)</label><input value={formData.postLink} onChange={e => setFormData({...formData, postLink: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100" /></div>
                 <div className="space-y-2"><label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Brief Visual / Deskripsi</label><textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100" /></div>
                 <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-2"><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-gray-100 text-gray-400 font-black uppercase text-[10px] tracking-widest rounded-2xl active:scale-95 transition-all">Batal</button><button type="submit" className="flex-[2] py-5 bg-blue-100 text-blue-500 font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-sm active:scale-95 transition-all hover:bg-blue-200">Simpan Perencanaan</button></div>
              </form>
           </div>
        </div>
      )}

      {/* DETAIL CONTENT POPUP */}
      {detailedViewItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDetailedViewItem(null)}></div>
           <div className="relative bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex animate-slide">
              <button onClick={() => setDetailedViewItem(null)} className="absolute top-6 right-6 p-2 bg-gray-100 hover:bg-gray-200 rounded-full z-10 transition-colors"><X size={20}/></button>
              
              {/* Left Column: Info */}
              <div className="w-1/2 p-10 overflow-y-auto custom-scrollbar bg-gray-50/50 space-y-8 border-r border-gray-100">
                 <div>
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-white border-gray-200 text-gray-600`}>{detailedViewItem.status}</span>
                    <h2 className="text-3xl font-black text-gray-900 mt-4 leading-tight">{detailedViewItem.title}</h2>
                    {detailedViewItem.postDate && <p className="text-xs font-bold text-gray-400 mt-2 flex items-center gap-2"><Calendar size={14}/> {new Date(detailedViewItem.postDate).toLocaleDateString('id-ID', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</p>}
                 </div>

                 {/* Post Link Section */}
                 <div className="p-6 bg-white rounded-[2rem] border border-gray-200 shadow-sm">
                    <h4 className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3 flex items-center gap-2">Post Live Link</h4>
                    {!isEditingLink ? (
                        <div className="flex items-center justify-between gap-2">
                            {detailedViewItem.postLink && detailedViewItem.postLink.length > 5 ? (
                                <a href={detailedViewItem.postLink} target="_blank" className="flex-1 truncate text-xs font-bold text-blue-500 hover:underline">{detailedViewItem.postLink}</a>
                            ) : <span className="text-xs text-gray-300 italic">Belum ada link</span>}
                            <button onClick={() => { setTempLink(detailedViewItem.postLink || ''); setIsEditingLink(true); }} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400"><Edit2 size={14}/></button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input value={tempLink} onChange={e => setTempLink(e.target.value)} className="flex-1 px-3 py-2 bg-gray-50 rounded-xl text-xs font-bold border border-blue-200 outline-none" placeholder="https://..." />
                            <button onClick={() => handleUpdateLink(detailedViewItem.id)} className="p-2 bg-blue-500 text-white rounded-xl"><Check size={14}/></button>
                            <button onClick={() => setIsEditingLink(false)} className="p-2 bg-gray-200 text-gray-500 rounded-xl"><X size={14}/></button>
                        </div>
                    )}
                 </div>

                 {/* Metrics / Info */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <p className="text-[9px] text-gray-300 uppercase tracking-widest mb-1">Content Pillar</p>
                        <p className="font-black text-gray-800">{detailedViewItem.pillar}</p>
                    </div>
                    <div className="p-5 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <p className="text-[9px] text-gray-300 uppercase tracking-widest mb-1">Approval</p>
                        <p className="font-black text-gray-800 flex items-center gap-2">
                            {detailedViewItem.approvedBy || '-'} 
                            {detailedViewItem.approvedBy && <CheckCircle size={16} className="text-emerald-500" />}
                        </p>
                    </div>
                 </div>

                 <div className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                    <p className="text-[9px] text-gray-300 uppercase tracking-widest mb-3">Brief & Notes</p>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed">{detailedViewItem.description || 'Tidak ada deskripsi.'}</p>
                 </div>

                 <div className="flex gap-3">
                    <button onClick={() => { setDetailedViewItem(null); openEditModal(detailedViewItem); }} className="flex-1 py-4 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all">Edit Konten</button>
                    <button 
                        onClick={(e) => handleAnalyzeLink(e, detailedViewItem)}
                        disabled={analyzingId === detailedViewItem.id}
                        className="flex-1 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-black transition-all"
                    >
                        {analyzingId === detailedViewItem.id ? <Loader2 size={14} className="animate-spin" /> : <BarChart2 size={14} />}
                        Analyze Link
                    </button>
                 </div>
              </div>

              {/* Right Column: Discussion */}
              <div className="w-1/2 p-8 flex flex-col bg-white">
                 <div className="mb-6 flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl"><MessageSquare size={20} /></div>
                    <h3 className="text-lg font-black text-gray-900">Diskusi & Revisi</h3>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-4 pr-2">
                    {detailedViewItem.comments?.length === 0 && <p className="text-center text-xs text-gray-300 italic py-20">Belum ada diskusi.</p>}
                    {detailedViewItem.comments?.map((c) => {
                        const isMe = c.userId === currentUser.id;
                        return (
                            <div key={c.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`p-4 rounded-2xl max-w-[85%] ${isMe ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-gray-100 text-gray-700 rounded-bl-sm'}`}>
                                    {!isMe && <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">{c.userName}</p>}
                                    <p className="text-xs font-medium leading-relaxed">{c.text}</p>
                                </div>
                                <p className="text-[9px] text-gray-300 mt-1 font-medium">{new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            </div>
                        );
                    })}
                 </div>
                 <div className="relative">
                    {showEmojiPicker && (
                        <div className="absolute bottom-16 left-0 bg-white shadow-xl border border-gray-100 rounded-2xl p-3 grid grid-cols-5 gap-2 z-20 w-64 animate-slide">
                            {EMOJIS.map(em => (
                                <button key={em} onClick={() => addEmoji(em)} className="text-xl hover:bg-gray-50 p-2 rounded-lg transition-colors">{em}</button>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-2 items-center bg-gray-50 p-2 rounded-2xl border border-gray-100">
                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"><Smile size={20}/></button>
                        <input 
                            value={commentText} 
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, detailedViewItem.id)}
                            placeholder="Tulis komentar... (Enter)" 
                            className="flex-1 bg-transparent outline-none text-xs font-medium text-gray-700"
                        />
                        <button onClick={() => handlePostComment(detailedViewItem.id)} className="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-md active:scale-95">
                            <Send size={16}/>
                        </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
         <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
               <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest">Judul Konten</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest">Post Link</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Approved</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Aksi</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {filteredItems.map(item => (
                  <tr key={item.id} className={`hover:bg-gray-100 transition-all cursor-pointer group ${getRowStyle(item)}`} onClick={() => setDetailedViewItem(item)}>
                    <td className="px-8 py-6">
                        <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest border bg-white border-gray-200 text-gray-600`}>{item.status}</span>
                    </td>
                    <td className="px-8 py-6">
                        <p className="text-sm font-bold text-gray-900">{item.title}</p>
                        {item.postDate && <p className="text-[9px] text-gray-400 font-bold mt-1">{item.postDate}</p>}
                    </td>
                    <td className="px-8 py-6">
                        {item.postLink && item.postLink.length > 5 ? (
                            <a href={item.postLink} target="_blank" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[9px] font-bold text-blue-500 hover:text-blue-600 hover:border-blue-200 transition-colors">
                                <ExternalLink size={10} /> Open Link
                            </a>
                        ) : (
                            <span className="text-[9px] font-bold text-gray-300 italic">No Link</span>
                        )}
                    </td>
                    <td className="px-8 py-6 text-center">
                        {item.approvedBy ? <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full"><Check size={16} /></div> : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-2">
                            <button className="p-2 text-gray-400 group-hover:text-blue-500 transition-colors bg-white border border-transparent group-hover:border-gray-200 rounded-xl shadow-sm"><ChevronDown size={20}/></button>
                        </div>
                    </td>
                  </tr>
               ))}
               {filteredItems.length === 0 && (
                 <tr>
                   <td colSpan={5} className="py-20 text-center text-gray-300 font-bold uppercase text-[10px] tracking-widest">Tidak ada perencanaan ditemukan</td>
                 </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default ContentPlan;
