
import React, { useState, useEffect, useRef } from 'react';
import { ContentPlanItem, PostInsight, User, Comment, SystemNotification, SocialAccount } from '../types';
import { SUPABASE_CONFIG } from '../constants';
import { scrapePostInsights } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
import { Plus, ChevronDown, FileText, Link as LinkIcon, ExternalLink, X, Save, Check, Instagram, Video, BarChart2, Loader2, Edit2, ImageIcon, UserPlus, Filter, Clock, MessageSquare, Send, Edit, Trash2, Calendar, Smile, CheckCircle, Upload, MoreHorizontal, Settings, ChevronRight, Edit3, PlayCircle, RefreshCw, Paperclip, Image as ImageIconLucide, Eye, Undo2, Reply, MoreVertical, CornerDownRight, Target, Layers, FileCode, Monitor, Info } from 'lucide-react';

interface ContentPlanProps {
  primaryColorHex: string;
  onSaveInsight: (insight: PostInsight) => void;
  users: User[];
  addNotification: (notif: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => void;
  currentUser: User;
  accounts: SocialAccount[];
  setAccounts: (accounts: SocialAccount[]) => void;
  targetContentId?: string | null;
  workspaceId: string; 
}

const ContentPlan: React.FC<ContentPlanProps> = ({ primaryColorHex, onSaveInsight, users, currentUser, accounts, setAccounts, targetContentId, workspaceId }) => {
  const [items, setItems] = useState<ContentPlanItem[]>([]);
  const [detailedViewItem, setDetailedViewItem] = useState<ContentPlanItem | null>(null);
  const processedTargetId = useRef<string | null>(null); 
  const commentsEndRef = useRef<HTMLDivElement>(null); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentPlanItem | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);
  
  const [filterPlatform, setFilterPlatform] = useState<'All' | 'Instagram' | 'TikTok'>('All');
  const [activeAccount, setActiveAccount] = useState<string>(accounts[0]?.id || 'account-1');

  const [picOptions] = useState<string[]>(() => JSON.parse(localStorage.getItem('sf_pic_options') || JSON.stringify(users.map(u => u.name))));
  
  const [commentText, setCommentText] = useState('');
  const [attachment, setAttachment] = useState<{data: string, type: 'image' | 'file'} | null>(null);

  const [replyingTo, setReplyingTo] = useState<{ id: string, name: string, text: string } | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [activeCommentMenuId, setActiveCommentMenuId] = useState<string | null>(null);

  const [formData, setFormData] = useState({ 
    title: '', platform: 'Instagram' as any, value: 'Awareness', pillar: '', type: 'Reels', description: '', postLink: '', approvedBy: '', pic: '', scriptUrl: '', visualUrl: '', status: 'Menunggu Review' as any, postDate: '' 
  });

  const getDbConfig = () => ({
    url: localStorage.getItem('sf_db_url') || SUPABASE_CONFIG.url,
    key: localStorage.getItem('sf_db_key') || SUPABASE_CONFIG.key
  });

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsModalOpen(false);
        setDetailedViewItem(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const fetchData = async () => {
    const dbConfig = getDbConfig();
    try {
        const sharedPlans = await databaseService.getContentPlans(dbConfig, workspaceId);
        const sortedPlans = [...sharedPlans].sort((a, b) => b.id.localeCompare(a.id));
        setItems(sortedPlans);
        
        if (detailedViewItem) {
            const freshItem = sortedPlans.find(i => i.id === detailedViewItem.id);
            if (freshItem && JSON.stringify(freshItem) !== JSON.stringify(detailedViewItem)) {
              setDetailedViewItem(freshItem);
            }
        }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { 
    fetchData(); 
    const interval = setInterval(fetchData, 4000); 
    return () => clearInterval(interval); 
  }, [workspaceId, detailedViewItem?.id]);

  useEffect(() => {
      if (targetContentId && targetContentId !== processedTargetId.current && items.length > 0) {
          const item = items.find(i => i.id === targetContentId);
          if (item) { setDetailedViewItem(item); processedTargetId.current = targetContentId; }
      }
  }, [targetContentId, items]);

  useEffect(() => {
    if (detailedViewItem && commentsEndRef.current) {
        commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [detailedViewItem?.comments]);

  const handlePostComment = async (itemId: string) => {
      if ((!commentText.trim() && !attachment) || isSendingComment) return;
      setIsSendingComment(true);
      const dbConfig = getDbConfig();
      const targetItem = items.find(i => i.id === itemId);
      if(!targetItem) { setIsSendingComment(false); return; }

      let updatedComments = [...(targetItem.comments || [])];

      if (editingCommentId) {
          updatedComments = updatedComments.map(c => c.id === editingCommentId ? { ...c, text: commentText, timestamp: new Date().toISOString() } : c);
      } else {
          const newComment: Comment = { 
            id: Date.now().toString(), userId: currentUser.id, userName: currentUser.name, text: commentText, timestamp: new Date().toISOString(), attachment: attachment?.data, attachmentType: attachment?.type, replyToId: replyingTo?.id, replyToName: replyingTo?.name, replyToText: replyingTo?.text
          };
          updatedComments.push(newComment);
      }

      const updatedItem = { ...targetItem, comments: updatedComments };
      try {
          await databaseService.upsertContentPlan(dbConfig, updatedItem);
          const notificationMessage = `"${currentUser.name}" mengomentari plan: ${targetItem.title}`;
          for (const member of users) {
              if (member.id !== currentUser.id) {
                  await databaseService.createNotification(dbConfig, {
                      recipientId: member.id, senderName: currentUser.name, messageText: notificationMessage, targetContentId: itemId, type: 'info'
                  });
              }
          }
          setItems(items.map(i => i.id === itemId ? updatedItem : i));
          if(detailedViewItem?.id === itemId) setDetailedViewItem(updatedItem);
      } catch (e) { alert("Gagal memperbarui diskusi."); }
      finally { 
        setIsSendingComment(false); setCommentText(''); setAttachment(null); setReplyingTo(null); setEditingCommentId(null);
      }
  };

  const handleToggleApprove = async () => {
      if (!detailedViewItem) return;
      const dbConfig = getDbConfig();
      const isApproved = detailedViewItem.status === 'Approved';
      const updatedItem: ContentPlanItem = { 
        ...detailedViewItem, approvedBy: isApproved ? '' : currentUser.name, status: isApproved ? 'Menunggu Review' : 'Approved' 
      };
      try {
        await databaseService.upsertContentPlan(dbConfig, updatedItem);
        setItems(items.map(i => i.id === updatedItem.id ? updatedItem : i));
        setDetailedViewItem(updatedItem);
      } catch (e) { alert("Gagal update approval."); }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!detailedViewItem) return;
    const dbConfig = getDbConfig();
    const updatedComments = (detailedViewItem.comments || []).filter(c => c.id !== commentId);
    const updatedItem = { ...detailedViewItem, comments: updatedComments };
    try {
      await databaseService.upsertContentPlan(dbConfig, updatedItem);
      setItems(items.map(i => i.id === updatedItem.id ? updatedItem : i));
      setDetailedViewItem(updatedItem);
      setActiveCommentMenuId(null);
    } catch (e) { alert("Gagal menghapus komentar."); }
  };

  const filteredItems = items.filter(item => {
    if (item.accountId && item.accountId !== activeAccount) return false;
    if (filterPlatform !== 'All' && filterPlatform !== item.platform) return false;
    return true;
  });

  return (
    <div className="space-y-6 md:space-y-8 animate-slide relative pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Konten Plan</h1>
          <p className="text-xs md:text-sm text-gray-400 font-medium flex items-center gap-2">Arunika Creative Studio <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1"><RefreshCw size={10}/> Cloud Sync</span></p>
        </div>
        <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex items-center gap-2 bg-white p-1 rounded-full shadow-sm border border-gray-100 overflow-x-auto no-scrollbar">
                {['All', 'Instagram', 'TikTok'].map((p) => (
                    <button key={p} onClick={() => setFilterPlatform(p as any)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase transition-all whitespace-nowrap ${filterPlatform === p ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>{p}</button>
                ))}
            </div>
            <button onClick={() => { 
                setEditingItem(null); 
                setFormData({ title: '', platform: 'Instagram', value: 'Awareness', pillar: '', type: 'Reels', description: '', postLink: '', approvedBy: '', pic: '', scriptUrl: '', visualUrl: '', status: 'Menunggu Review', postDate: new Date().toISOString().split('T')[0] });
                setIsModalOpen(true); 
            }} className="px-5 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 active:scale-95 flex items-center justify-center gap-2 transition-all"><Plus size={18} /> Tambah Plan</button>
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
         {accounts.map(acc => (
             <button key={acc.id} onClick={() => setActiveAccount(acc.id)} className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all border whitespace-nowrap flex items-center gap-2 ${activeAccount === acc.id ? 'bg-white border-blue-200 text-blue-600 shadow-md ring-2 ring-blue-50' : 'bg-white border-gray-100 text-gray-400'}`}>{acc.name}</button>
         ))}
      </div>

      {/* MODAL: TAMBAH / EDIT KONTEN (BOTTOM-SHEET MOBILE, CENTER DESKTOP) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-end md:items-center justify-center p-0 md:p-6 bg-white/30 backdrop-blur-md">
           <div className="absolute inset-0" onClick={() => setIsModalOpen(false)}></div>
           {/* max-h-[85vh] prevents top cutoff on zoomed browsers */}
           <div className="relative bg-white w-full max-w-2xl max-h-[85vh] rounded-t-[3rem] md:rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.1)] border-t md:border border-gray-100 overflow-hidden animate-slide flex flex-col">
              <div className="p-6 md:p-8 bg-white border-b flex flex-col items-center shrink-0">
                 <div className="w-12 h-1 bg-gray-100 rounded-full mb-4 md:hidden"></div>
                 <h2 className="text-xl md:text-2xl font-black text-gray-900">{editingItem ? 'Edit Perencanaan' : 'Perencanaan Baru'}</h2>
              </div>
              <form onSubmit={async (e) => {
                  e.preventDefault(); setIsSaving(true);
                  const dbConfig = getDbConfig();
                  const finalItem = { 
                    id: editingItem?.id || `CP-${Date.now()}`, 
                    workspaceId, creatorId: currentUser.id, ...formData, accountId: activeAccount, comments: editingItem?.comments || [] 
                  };
                  try { 
                    await databaseService.upsertContentPlan(dbConfig, finalItem); fetchData(); setIsModalOpen(false); 
                  } catch (err) { alert("Gagal simpan."); }
                  finally { setIsSaving(false); }
              }} className="p-6 md:p-10 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                 <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => setFormData({...formData, platform: 'Instagram'})} className={`p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${formData.platform === 'Instagram' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-gray-50 border-transparent text-gray-400'}`}><Instagram size={18} /> <span className="text-[10px] font-black uppercase">Instagram</span></button>
                    <button type="button" onClick={() => setFormData({...formData, platform: 'TikTok'})} className={`p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${formData.platform === 'TikTok' ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-gray-50 border-transparent text-gray-400'}`}><Video size={18} /> <span className="text-[10px] font-black uppercase">TikTok</span></button>
                 </div>
                 
                 <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400 ml-2 mb-1 flex items-center gap-2"><FileText size={12}/> Judul Posting</label><input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm text-gray-900 border border-transparent focus:bg-white focus:border-blue-100 transition-all" /></div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400 ml-2 mb-1 flex items-center gap-2"><Layers size={12}/> Pillar</label><input value={formData.pillar} onChange={e => setFormData({...formData, pillar: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Tips" /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400 ml-2 mb-1 flex items-center gap-2"><Monitor size={12}/> Type</label><input value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Reels" /></div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400 ml-2 mb-1 flex items-center gap-2"><Calendar size={12}/> Tanggal</label><input type="date" value={formData.postDate} onChange={e => setFormData({...formData, postDate: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400 ml-2 mb-1 flex items-center gap-2"><UserPlus size={12}/> PIC</label><select value={formData.pic} onChange={e => setFormData({...formData, pic: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm text-gray-900"><option value="">Pilih Member</option>{picOptions.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                 </div>

                 <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400 ml-2 mb-1 flex items-center gap-2"><Target size={12}/> Objective</label><input value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm" placeholder="Awareness" /></div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400 ml-2 mb-1 flex items-center gap-2"><FileCode size={12}/> Script URL</label><input value={formData.scriptUrl} onChange={e => setFormData({...formData, scriptUrl: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-xs" /></div>
                    <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400 ml-2 mb-1 flex items-center gap-2"><ImageIcon size={12}/> Visual URL</label><input value={formData.visualUrl} onChange={e => setFormData({...formData, visualUrl: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-xs" /></div>
                 </div>

                 <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400 ml-2 mb-1 flex items-center gap-2"><Edit size={12}/> Caption</label><textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm h-32 resize-none" placeholder="Tulis caption..."></textarea></div>
              </form>
              <div className="p-6 md:p-8 bg-white border-t shrink-0 flex flex-col gap-3">
                 <button onClick={(e) => (e.target as any).closest('form')?.dispatchEvent(new Event('submit', {cancelable: true, bubbles: true}))} disabled={isSaving} className="w-full py-5 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl flex justify-center gap-2 active:scale-95 transition-all">
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Simpan Plan
                 </button>
                 <button type="button" onClick={() => setIsModalOpen(false)} className="w-full py-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Batal (Esc)</button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL: DETAIL KONTEN (BOTTOM-SHEET MOBILE, CENTER DESKTOP) */}
      {detailedViewItem && (
        <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-6 bg-white/30 backdrop-blur-md">
           <div className="absolute inset-0" onClick={() => setDetailedViewItem(null)}></div>
           <div className="relative bg-white w-full max-w-5xl max-h-[85vh] rounded-t-[3rem] md:rounded-[3.5rem] shadow-2xl border-t md:border border-gray-100 overflow-hidden animate-slide flex flex-col">
              <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
                {/* Content Details */}
                <div className="w-full md:w-1/2 p-6 md:p-10 overflow-y-auto bg-white space-y-6 flex flex-col custom-scrollbar shrink-0 md:shrink border-b md:border-b-0 md:border-r">
                  <div className="w-12 h-1 bg-gray-100 rounded-full mb-4 md:hidden mx-auto shrink-0"></div>
                  <div className="flex justify-between items-center mb-2">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${detailedViewItem.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{detailedViewItem.status}</span>
                      <button onClick={() => { 
                          setEditingItem(detailedViewItem); 
                          setFormData({ ...detailedViewItem, approvedBy: detailedViewItem.approvedBy || '', pic: detailedViewItem.pic || '', scriptUrl: detailedViewItem.scriptUrl || '', visualUrl: detailedViewItem.visualUrl || '', postDate: detailedViewItem.postDate || '' } as any);
                          setDetailedViewItem(null); setIsModalOpen(true);
                      }} className="p-3 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-xl transition-all"><Edit3 size={18}/></button>
                  </div>
                  
                  <div>
                      <h2 className="text-xl md:text-3xl font-black text-gray-900 leading-tight">{detailedViewItem.title}</h2>
                      <div className="flex items-center gap-4 mt-3">
                        <p className="text-[10px] font-bold text-gray-400 flex items-center gap-2"><Calendar size={12}/> {detailedViewItem.postDate || '-'}</p>
                        <p className="text-[10px] font-bold text-gray-400 flex items-center gap-2 capitalize">{detailedViewItem.platform === 'Instagram' ? <Instagram size={12}/> : <Video size={12}/>} {detailedViewItem.platform}</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-gray-50 rounded-2xl">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Target size={10}/> Objective</p>
                          <p className="text-xs font-bold text-gray-700">{detailedViewItem.value || '-'}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Layers size={10}/> Pillar</p>
                          <p className="text-xs font-bold text-gray-700">{detailedViewItem.pillar || '-'}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Monitor size={10}/> Type</p>
                          <p className="text-xs font-bold text-gray-700">{detailedViewItem.type || '-'}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><UserPlus size={10}/> PIC</p>
                          <p className="text-xs font-bold text-gray-700">{detailedViewItem.pic || '-'}</p>
                      </div>
                  </div>

                  <div className="space-y-4">
                      {detailedViewItem.scriptUrl && (
                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex justify-between items-center">
                          <a href={detailedViewItem.scriptUrl} target="_blank" className="text-xs font-bold text-blue-600 flex items-center gap-2 hover:underline"><FileCode size={12}/> Open Script</a>
                        </div>
                      )}
                      {detailedViewItem.visualUrl && (
                        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex justify-between items-center">
                          <a href={detailedViewItem.visualUrl} target="_blank" className="text-xs font-bold text-emerald-600 flex items-center gap-2 hover:underline"><ImageIconLucide size={12}/> Open Visual</a>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <h4 className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Caption</h4>
                        <div className="p-5 bg-gray-50 border border-gray-100 rounded-3xl text-xs text-gray-600 leading-relaxed min-h-[80px] whitespace-pre-wrap font-medium">
                           {detailedViewItem.description || 'No caption.'}
                        </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-auto pt-6 pb-6 md:pb-0">
                      <button onClick={handleToggleApprove} className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all ${detailedViewItem.status === 'Approved' ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-emerald-500 text-white'}`}>
                        {detailedViewItem.status === 'Approved' ? <Undo2 size={14} /> : <CheckCircle size={14} />} 
                        {detailedViewItem.status === 'Approved' ? 'Cancel' : 'Approve'}
                      </button>
                      <button onClick={async () => { setAnalyzingId(detailedViewItem.id); try { const ins = await scrapePostInsights(detailedViewItem.postLink); onSaveInsight({...ins, sourceType: 'plan'}); alert("Insight synced!"); } catch(e) { alert("Invalid post link."); } finally { setAnalyzingId(null); } }} disabled={analyzingId === detailedViewItem.id || !detailedViewItem.postLink} className="py-4 bg-gray-900 text-white rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-2 disabled:opacity-50">
                        {analyzingId === detailedViewItem.id ? <Loader2 size={14} className="animate-spin" /> : <BarChart2 size={14} />} Analyze
                      </button>
                  </div>
                </div>

                {/* Discussion Section */}
                <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col bg-gray-50/5 relative min-h-0">
                  <div className="mb-4 flex items-center gap-3">
                      <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl"><MessageSquare size={18} /></div>
                      <h3 className="text-base font-black text-gray-900">Diskusi Tim</h3>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 custom-scrollbar">
                      {(detailedViewItem.comments || []).map((c) => {
                          const isMe = c.userId === currentUser.id;
                          return (
                              <div key={c.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end animate-slide group`}>
                                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] relative`}>
                                      {c.replyToId && (
                                        <div className={`flex items-center gap-2 px-3 py-2 bg-gray-200/50 rounded-t-xl text-[9px] mb-[-8px] opacity-60 border-l-2 border-blue-400 mx-2 ${isMe ? 'mr-4 ml-0' : 'ml-4 mr-0'}`}>
                                          <CornerDownRight size={8} className="text-blue-500"/>
                                          <span className="font-black text-gray-600 truncate max-w-[80px] uppercase">{c.replyToName}</span>
                                        </div>
                                      )}
                                      <div className={`p-4 rounded-2xl shadow-sm relative ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-700 rounded-bl-sm'}`}>
                                          {!isMe && <p className="text-[8px] font-black uppercase text-blue-500 mb-1">{c.userName}</p>}
                                          <p className="text-xs font-medium leading-relaxed">{c.text}</p>
                                          <button onClick={() => setActiveCommentMenuId(activeCommentMenuId === c.id ? null : c.id)} className={`absolute top-2 ${isMe ? '-left-8' : '-right-8'} p-1 text-gray-300 transition-opacity`}>
                                            <MoreVertical size={14}/>
                                          </button>
                                          {activeCommentMenuId === c.id && (
                                            <div className={`absolute z-30 top-8 ${isMe ? '-left-20' : '-right-20'} bg-white shadow-xl rounded-xl border border-gray-100 p-1 flex flex-col min-w-[90px] animate-slide-down`}>
                                              <button onClick={() => { setReplyingTo({id: c.id, name: c.userName, text: c.text}); setActiveCommentMenuId(null); }} className="flex items-center gap-2 px-2 py-1.5 text-[8px] font-black uppercase text-gray-500 hover:bg-blue-50 rounded-lg">Reply</button>
                                              {isMe && <button onClick={() => handleDeleteComment(c.id)} className="flex items-center gap-2 px-2 py-1.5 text-[8px] font-black uppercase text-rose-400 hover:bg-rose-50 rounded-lg">Delete</button>}
                                            </div>
                                          )}
                                      </div>
                                      <p className="text-[8px] text-gray-300 mt-1 font-bold">{new Date(c.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                  </div>
                              </div>
                          );
                      })}
                      <div ref={commentsEndRef} />
                  </div>

                  <div className="relative bg-white p-2 rounded-2xl border border-gray-100 shadow-xl mb-4 md:mb-0">
                      {replyingTo && (
                        <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50 rounded-xl mb-1.5">
                          <p className="text-[9px] font-bold text-blue-600 truncate">Balas: <span className="opacity-70 italic">"{replyingTo.text}"</span></p>
                          <button onClick={() => setReplyingTo(null)} className="p-1 text-blue-300"><X size={12}/></button>
                        </div>
                      )}
                      <div className="flex gap-2 items-center">
                          <input value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handlePostComment(detailedViewItem.id)} placeholder="Diskusi tim..." className="flex-1 px-4 bg-transparent outline-none text-xs font-bold text-gray-900 py-3" />
                          <button onClick={() => handlePostComment(detailedViewItem.id)} disabled={isSendingComment} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg active:scale-95 transition-all">
                            {isSendingComment ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
                          </button>
                      </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t bg-white flex justify-center items-center shrink-0 md:static sticky bottom-0 z-10 shadow-up">
                  <button onClick={() => setDetailedViewItem(null)} className="px-10 py-3 md:py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-all bg-gray-50 md:bg-transparent w-full md:w-auto">Tutup (Esc)</button>
              </div>
           </div>
        </div>
      )}

      {/* LIST KONTEN: DESKTOP TABLE */}
      <div className="hidden md:block bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
         <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
               <tr>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-300 uppercase tracking-widest">Post Date</th>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-300 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-300 uppercase tracking-widest">Judul Perencanaan</th>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-300 uppercase tracking-widest text-center">Approved</th>
                  <th className="px-8 py-5 text-[9px] font-black text-gray-300 uppercase tracking-widest text-center">Opsi</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-all cursor-pointer group" onClick={() => setDetailedViewItem(item)}>
                    <td className="px-8 py-6 text-xs font-bold text-gray-500">{item.postDate || '-'}</td>
                    <td className="px-8 py-6"><span className="px-3 py-1 text-[9px] font-black rounded-lg uppercase border bg-white border-gray-100 text-gray-600">{item.status}</span></td>
                    <td className="px-8 py-6">
                        <div className="flex items-center gap-2 mb-1">{item.platform === 'Instagram' ? <Instagram size={12} className="text-rose-500"/> : <Video size={12} className="text-slate-800"/>}<span className="text-[8px] font-black uppercase text-gray-300">{item.platform}</span></div>
                        <p className="text-sm font-bold text-gray-900 truncate max-w-xs">{item.title}</p>
                    </td>
                    <td className="px-8 py-6 text-center">{item.approvedBy ? <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full" title={`Approved by ${item.approvedBy}`}><Check size={14} /></div> : <span className="text-gray-200">-</span>}</td>
                    <td className="px-8 py-6 text-center"><button className="p-2 text-gray-300 group-hover:text-blue-500"><MoreHorizontal size={20}/></button></td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {/* LIST KONTEN: MOBILE CARDS */}
      <div className="md:hidden space-y-4">
          {filteredItems.map(item => (
              <div key={item.id} onClick={() => setDetailedViewItem(item)} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm active:scale-95 transition-transform flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {item.platform === 'Instagram' ? <Instagram size={14} className="text-rose-500"/> : <Video size={14} className="text-slate-800"/>}
                        <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{item.platform}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-gray-50 ${item.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{item.status}</span>
                  </div>
                  <h3 className="font-black text-gray-900 text-sm leading-snug">{item.title}</h3>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-gray-400 flex items-center gap-2"><Clock size={12}/> {item.postDate || 'No Date'}</p>
                        <p className="text-[10px] font-bold text-blue-500 flex items-center gap-2"><UserPlus size={12}/> {item.pic || '-'}</p>
                      </div>
                      {item.approvedBy && <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-lg text-emerald-600 text-[8px] font-black uppercase"><Check size={10}/> Approved</div>}
                  </div>
              </div>
          ))}
          {filteredItems.length === 0 && <div className="p-16 text-center text-gray-300 text-xs font-black uppercase border border-dashed rounded-[2.5rem]">No Content Found</div>}
      </div>
    </div>
  );
};

export default ContentPlan;
