
import React, { useState, useEffect, useRef } from 'react';
import { ContentPlanItem, PostInsight, User, Comment, SystemNotification, SocialAccount } from '../types';
import { SUPABASE_CONFIG } from '../constants';
import { scrapePostInsights } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
import { Plus, ChevronDown, FileText, Link as LinkIcon, ExternalLink, X, Save, Check, Instagram, Video, BarChart2, Loader2, Edit2, ImageIcon, UserPlus, Filter, Clock, MessageSquare, Send, Edit, Trash2, Calendar, Smile, CheckCircle, Upload, MoreHorizontal, Settings, ChevronRight, Edit3, PlayCircle, RefreshCw, Paperclip, Image as ImageIconLucide, Eye, Undo2, Reply, MoreVertical, CornerDownRight } from 'lucide-react';

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

const DEFAULT_STATUS_OPTIONS = ['Menunggu Review', 'Sedang di Review', 'Approved', 'Drafting', 'Dijadwalkan', 'Diposting', 'Revisi', 'Reschedule', 'Dibatalkan'];
const EMOJIS = ['👍', '🔥', '❤️', '😂', '😮', '😢', '👏', '🎉', '✅', '❌', '🚀', '💯', '🤔', '👀', '✨', '🙌', '🙏', '💪', '🤝', '💡', '⚠️', '🚩', '🆗', '🆒'];

const ContentPlan: React.FC<ContentPlanProps> = ({ primaryColorHex, onSaveInsight, users, currentUser, accounts, setAccounts, targetContentId, workspaceId }) => {
  const [items, setItems] = useState<ContentPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [detailedViewItem, setDetailedViewItem] = useState<ContentPlanItem | null>(null);
  const processedTargetId = useRef<string | null>(null); 
  const commentsEndRef = useRef<HTMLDivElement>(null); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentPlanItem | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<string | null>(null);
  
  const [filterPlatform, setFilterPlatform] = useState<'All' | 'Instagram' | 'TikTok'>('All');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [activeAccount, setActiveAccount] = useState<string>(accounts[0]?.id || 'account-1');

  const [picOptions, setPicOptions] = useState<string[]>(() => JSON.parse(localStorage.getItem('sf_pic_options') || JSON.stringify(users.map(u => u.name))));
  
  const [commentText, setCommentText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState<{data: string, type: 'image' | 'file'} | null>(null);
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [tempLink, setTempLink] = useState('');

  // Comment features state
  const [replyingTo, setReplyingTo] = useState<{ id: string, name: string, text: string } | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [activeCommentMenuId, setActiveCommentMenuId] = useState<string | null>(null);

  const [formData, setFormData] = useState({ title: '', platform: 'Instagram' as any, value: 'Awareness', pillar: '', type: 'Reels', description: '', postLink: '', approvedBy: '', pic: '', scriptUrl: '', visualUrl: '', status: 'Menunggu Review' as any, postDate: '' });

  const getDbConfig = () => ({
    url: localStorage.getItem('sf_db_url') || SUPABASE_CONFIG.url,
    key: localStorage.getItem('sf_db_key') || SUPABASE_CONFIG.key
  });

  const fetchData = async () => {
    const dbConfig = getDbConfig();
    try {
        const sharedPlans = await databaseService.getContentPlans(dbConfig, workspaceId);
        setItems(sharedPlans);
        if (detailedViewItem) {
            const freshItem = sharedPlans.find(i => i.id === detailedViewItem.id);
            if (freshItem && JSON.stringify(freshItem) !== JSON.stringify(detailedViewItem)) {
              setDetailedViewItem(freshItem);
            }
        }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); const interval = setInterval(fetchData, 3000); return () => clearInterval(interval); }, [workspaceId, detailedViewItem?.id]);

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
          // Edit existing
          updatedComments = updatedComments.map(c => c.id === editingCommentId ? { ...c, text: commentText, timestamp: new Date().toISOString() } : c);
      } else {
          // Post new or reply
          const newComment: Comment = { 
            id: Date.now().toString(), 
            userId: currentUser.id, 
            userName: currentUser.name, 
            text: commentText, 
            timestamp: new Date().toISOString(), 
            attachment: attachment?.data, 
            attachmentType: attachment?.type,
            replyToId: replyingTo?.id,
            replyToName: replyingTo?.name,
            replyToText: replyingTo?.text
          };
          updatedComments.push(newComment);
      }

      const updatedItem = { ...targetItem, comments: updatedComments };
      try {
          setItems(items.map(i => i.id === itemId ? updatedItem : i));
          if(detailedViewItem?.id === itemId) setDetailedViewItem(updatedItem);
          await databaseService.upsertContentPlan(dbConfig, updatedItem);
          
          if (!editingCommentId) {
            for (const user of users) {
                if (user.id !== currentUser.id) {
                    await databaseService.createNotification(dbConfig, { recipientId: user.id, senderName: currentUser.name, messageText: `Komentar baru di "${targetItem.title}": ${commentText.substring(0, 30)}...`, targetContentId: targetItem.id, type: 'info' });
                }
            }
          }
      } catch (e) { alert("Gagal memperbarui diskusi."); }
      finally { 
        setIsSendingComment(false); 
        setCommentText(''); 
        setAttachment(null); 
        setShowEmojiPicker(false); 
        setReplyingTo(null);
        setEditingCommentId(null);
      }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!detailedViewItem || !confirm("Hapus komentar ini?")) return;
    const dbConfig = getDbConfig();
    const updatedComments = detailedViewItem.comments?.filter(c => c.id !== commentId) || [];
    const updatedItem = { ...detailedViewItem, comments: updatedComments };
    try {
        setItems(items.map(i => i.id === detailedViewItem.id ? updatedItem : i));
        setDetailedViewItem(updatedItem);
        await databaseService.upsertContentPlan(dbConfig, updatedItem);
    } catch(e) { alert("Gagal menghapus komentar."); }
  };

  const handleToggleApprove = async () => {
      if (!detailedViewItem) return;
      const dbConfig = getDbConfig();
      const isApproved = detailedViewItem.status === 'Approved';
      const updatedItem: ContentPlanItem = { ...detailedViewItem, approvedBy: isApproved ? '' : currentUser.name, status: isApproved ? 'Menunggu Review' : 'Approved' };
      try {
        await databaseService.upsertContentPlan(dbConfig, updatedItem);
        setItems(items.map(i => i.id === updatedItem.id ? updatedItem : i));
        setDetailedViewItem(updatedItem);
        if (!isApproved) {
            for (const user of users) {
                if (user.id !== currentUser.id) {
                    await databaseService.createNotification(dbConfig, { recipientId: user.id, senderName: currentUser.name, messageText: `${currentUser.name} menyetujui konten: "${updatedItem.title}"`, targetContentId: updatedItem.id, type: 'success' });
                }
            }
        }
      } catch (e) { alert("Gagal update approval."); }
  };

  const filteredItems = items.filter(item => {
    if (item.accountId && item.accountId !== activeAccount) return false;
    if (filterPlatform !== 'All' && filterPlatform !== item.platform) return false;
    if (filterStartDate && new Date(item.postDate || '') < new Date(filterStartDate)) return false;
    if (filterEndDate && new Date(item.postDate || '') > new Date(filterEndDate)) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-slide relative pb-20">
      {previewAttachment && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
              <button onClick={() => setPreviewAttachment(null)} className="fixed top-6 right-6 p-3 text-white z-[260]"><X size={24}/></button>
              <img src={previewAttachment} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Konten Plan</h1>
          <p className="text-gray-400 font-medium flex items-center gap-2">Arunika Creative Studio <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1"><RefreshCw size={10}/> Syncing Live</span></p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-full shadow-sm border border-gray-100">
            <div className="px-4 border-r border-gray-100"><Filter size={14} className="text-gray-400" /></div>
            {['All', 'Instagram', 'TikTok'].map((p) => (
                <button key={p} onClick={() => setFilterPlatform(p as any)} className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase transition-all ${filterPlatform === p ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}>{p}</button>
            ))}
        </div>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2 transition-all hover:bg-blue-700"><Plus size={20} /> Tambah Plan</button>
      </div>

      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
         {accounts.map(acc => (
             <button key={acc.id} onClick={() => setActiveAccount(acc.id)} className={`px-6 py-3 rounded-2xl text-xs font-black uppercase transition-all border flex items-center gap-2 ${activeAccount === acc.id ? 'bg-white border-blue-200 text-blue-600 shadow-lg ring-2 ring-blue-50' : 'bg-white border-gray-100 text-gray-400'}`}>{acc.name}</button>
         ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
           <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-slide flex flex-col max-h-[90vh]">
              <div className="p-8 bg-white border-b flex flex-col items-center">
                 <h2 className="text-2xl font-black text-gray-900">{editingItem ? 'Edit Perencanaan' : 'Perencanaan Baru'}</h2>
              </div>
              <form onSubmit={async (e) => {
                  e.preventDefault(); setIsSaving(true);
                  const dbConfig = getDbConfig();
                  const finalItem = { id: editingItem?.id || `CP-${Date.now()}`, workspaceId, creatorId: currentUser.id, ...formData, approvedBy: '', status: 'Menunggu Review' as any, accountId: activeAccount, comments: editingItem?.comments || [] };
                  try { await databaseService.upsertContentPlan(dbConfig, finalItem); fetchData(); setIsModalOpen(false); }
                  catch (err) { alert("Gagal simpan."); }
                  finally { setIsSaving(false); }
              }} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                 <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => setFormData({...formData, platform: 'Instagram'})} className={`p-4 rounded-2xl border flex items-center justify-center gap-2 ${formData.platform === 'Instagram' ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-gray-50'}`}><Instagram size={20} /> <span className="text-xs font-black uppercase">Instagram</span></button>
                    <button type="button" onClick={() => setFormData({...formData, platform: 'TikTok'})} className={`p-4 rounded-2xl border flex items-center justify-center gap-2 ${formData.platform === 'TikTok' ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-gray-50'}`}><Video size={20} /> <span className="text-xs font-black uppercase">TikTok</span></button>
                 </div>
                 <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-1">Judul Posting</label><input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border focus:border-blue-200 transition-all" /></div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-1">Tanggal</label><input type="date" value={formData.postDate} onChange={e => setFormData({...formData, postDate: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black uppercase text-gray-400 ml-1">PIC</label><select value={formData.pic} onChange={e => setFormData({...formData, pic: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900"><option value="">Pilih PIC</option>{picOptions.map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                 </div>
                 <button type="submit" disabled={isSaving} className="w-full py-5 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl hover:bg-blue-700 flex justify-center gap-2">{isSaving && <Loader2 size={16} className="animate-spin" />} Simpan Plan</button>
                 
                 {/* Tombol Tutup Minimalis Bawah */}
                 <div className="flex justify-center pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)} 
                      className="px-6 py-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-gray-900 transition-colors border border-transparent hover:border-gray-100 rounded-full"
                    >
                      Batal
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {detailedViewItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-md" onClick={() => setDetailedViewItem(null)}></div>
           <div className="relative bg-white w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-slide">
              
              <div className="flex flex-1 overflow-hidden">
                <div className="w-1/2 p-10 overflow-y-auto bg-white space-y-8 border-r flex flex-col custom-scrollbar">
                  <div>
                      <div className="flex justify-between items-center mb-2">
                          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${detailedViewItem.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{detailedViewItem.status}</span>
                          <button onClick={() => { 
                              setEditingItem(detailedViewItem); 
                              setFormData({
                                title: detailedViewItem.title,
                                platform: detailedViewItem.platform as any,
                                value: detailedViewItem.value,
                                pillar: detailedViewItem.pillar,
                                type: detailedViewItem.type,
                                description: detailedViewItem.description,
                                postLink: detailedViewItem.postLink,
                                approvedBy: detailedViewItem.approvedBy || '',
                                pic: detailedViewItem.pic || '',
                                scriptUrl: detailedViewItem.scriptUrl || '',
                                visualUrl: detailedViewItem.visualUrl || '',
                                status: detailedViewItem.status as any,
                                postDate: detailedViewItem.postDate || ''
                              });
                              setDetailedViewItem(null); 
                              setIsModalOpen(true);
                          }} className="p-3 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-2xl transition-all shadow-sm"><Edit3 size={18}/></button>
                      </div>
                      <h2 className="text-3xl font-black text-gray-900 mt-2 leading-tight">{detailedViewItem.title}</h2>
                      <p className="text-xs font-bold text-gray-400 mt-2 flex items-center gap-2"><Calendar size={14}/> {detailedViewItem.postDate || '-'}</p>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-[2rem]">
                      <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Post Live Link</h4>
                      <div className="flex items-center justify-between gap-2">
                          {detailedViewItem.postLink ? <a href={detailedViewItem.postLink} target="_blank" className="flex-1 truncate text-xs font-bold text-blue-600 hover:underline">{detailedViewItem.postLink}</a> : <span className="text-xs text-gray-300 italic">No link</span>}
                          <button onClick={() => { setTempLink(detailedViewItem.postLink || ''); setIsEditingLink(true); }} className="p-2 text-gray-400"><Edit2 size={14}/></button>
                      </div>
                  </div>
                  <div className="flex gap-3 pt-6 mt-auto">
                      <button onClick={handleToggleApprove} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all ${detailedViewItem.status === 'Approved' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-500 text-white'}`}>{detailedViewItem.status === 'Approved' ? <Undo2 size={16} /> : <CheckCircle size={16} />} {detailedViewItem.status === 'Approved' ? 'Batal Approve' : 'Approve'}</button>
                      <button onClick={async () => { setAnalyzingId(detailedViewItem.id); try { const ins = await scrapePostInsights(detailedViewItem.postLink); onSaveInsight({...ins, sourceType: 'plan'}); alert("Sukses sync ke Analitik."); } catch(e) { alert("Link tidak valid."); } finally { setAnalyzingId(null); } }} disabled={analyzingId === detailedViewItem.id} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2">{analyzingId === detailedViewItem.id ? <Loader2 size={14} className="animate-spin" /> : <BarChart2 size={14} />} Analyze Link</button>
                  </div>
                </div>

                <div className="w-1/2 p-10 flex flex-col bg-gray-50/30 relative">
                  <div className="mb-6 flex items-center gap-3">
                      <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><MessageSquare size={20} /></div>
                      <h3 className="text-lg font-black text-gray-900">Diskusi Tim</h3>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-2 custom-scrollbar">
                      {detailedViewItem.comments?.map((c) => {
                          const isMe = c.userId === currentUser.id;
                          const showMenu = activeCommentMenuId === c.id;

                          return (
                              <div key={c.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end animate-slide group`}>
                                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%] relative`}>
                                      
                                      {/* Thread reply quote display */}
                                      {c.replyToId && (
                                        <div className={`flex items-center gap-2 px-3 py-2 bg-gray-200/50 rounded-t-xl text-[10px] mb-[-10px] opacity-60 border-l-2 border-blue-400 mx-2 ${isMe ? 'mr-4 ml-0' : 'ml-4 mr-0'}`}>
                                          <CornerDownRight size={10} className="text-blue-500"/>
                                          <span className="font-black text-gray-600 truncate max-w-[120px] uppercase">{c.replyToName}</span>
                                          <span className="text-gray-400 italic truncate max-w-[150px]">"{c.replyToText}"</span>
                                        </div>
                                      )}

                                      <div className={`p-4 rounded-2xl shadow-sm relative ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-700 rounded-bl-sm'}`}>
                                          {!isMe && <p className="text-[9px] font-black uppercase text-blue-500 mb-1">{c.userName}</p>}
                                          <p className="text-xs font-medium leading-relaxed">{c.text}</p>
                                          
                                          {/* Mini Action Button */}
                                          <button 
                                            onClick={() => setActiveCommentMenuId(activeCommentMenuId === c.id ? null : c.id)}
                                            className={`absolute top-2 ${isMe ? '-left-8' : '-right-8'} p-1 text-gray-300 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity`}
                                          >
                                            <MoreVertical size={14}/>
                                          </button>

                                          {/* Minimalist Popup Menu */}
                                          {showMenu && (
                                            <div className={`absolute z-30 top-8 ${isMe ? '-left-24' : '-right-24'} bg-white shadow-xl rounded-xl border border-gray-100 p-1 flex flex-col min-w-[100px] animate-slide-down`}>
                                              <button onClick={() => { setReplyingTo({id: c.id, name: c.userName, text: c.text}); setActiveCommentMenuId(null); }} className="flex items-center gap-2 px-3 py-2 text-[9px] font-black uppercase text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                                                <Reply size={12}/> Balas
                                              </button>
                                              {isMe && (
                                                <>
                                                  <button onClick={() => { setEditingCommentId(c.id); setCommentText(c.text); setActiveCommentMenuId(null); }} className="flex items-center gap-2 px-3 py-2 text-[9px] font-black uppercase text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors">
                                                    <Edit2 size={12}/> Edit
                                                  </button>
                                                  <button onClick={() => { handleDeleteComment(c.id); setActiveCommentMenuId(null); }} className="flex items-center gap-2 px-3 py-2 text-[9px] font-black uppercase text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors">
                                                    <Trash2 size={12}/> Hapus
                                                  </button>
                                                </>
                                              )}
                                            </div>
                                          )}
                                      </div>
                                      <p className="text-[9px] text-gray-300 mt-1 font-bold">{new Date(c.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                                  </div>
                              </div>
                          );
                      })}
                      <div ref={commentsEndRef} />
                  </div>

                  <div className="relative bg-white p-2 rounded-3xl border border-gray-100 shadow-lg">
                      {/* Reply indicator bar */}
                      {replyingTo && (
                        <div className="flex items-center justify-between px-4 py-2 bg-blue-50 rounded-2xl mb-2 animate-slide">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <Reply size={12} className="text-blue-500"/>
                            <p className="text-[10px] font-bold text-blue-600 truncate">Balas {replyingTo.name}: <span className="font-medium text-blue-400 italic">"{replyingTo.text}"</span></p>
                          </div>
                          <button onClick={() => setReplyingTo(null)} className="p-1 text-blue-300 hover:text-blue-600"><X size={14}/></button>
                        </div>
                      )}
                      
                      {/* Edit indicator bar */}
                      {editingCommentId && (
                        <div className="flex items-center justify-between px-4 py-2 bg-amber-50 rounded-2xl mb-2 animate-slide">
                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest flex items-center gap-2"><Edit2 size={12}/> Mengedit komentar...</p>
                          <button onClick={() => { setEditingCommentId(null); setCommentText(''); }} className="p-1 text-amber-300 hover:text-amber-600"><X size={14}/></button>
                        </div>
                      )}

                      <div className="flex gap-2 items-center">
                          <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-3 text-gray-400 hover:text-blue-500 transition-colors"><Smile size={20}/></button>
                          <input 
                            value={commentText} 
                            onChange={(e) => setCommentText(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handlePostComment(detailedViewItem.id)} 
                            placeholder={replyingTo ? "Balas pesan..." : "Tulis komentar..."} 
                            className="flex-1 bg-transparent outline-none text-xs font-medium text-gray-900" 
                          />
                          <button onClick={() => handlePostComment(detailedViewItem.id)} disabled={isSendingComment} className="p-3 bg-blue-600 text-white rounded-2xl shadow-md active:scale-95 transition-transform">
                            {isSendingComment ? <Loader2 size={16} className="animate-spin"/> : editingCommentId ? <Check size={16}/> : <Send size={16}/>}
                          </button>
                      </div>
                  </div>
                </div>
              </div>

              {/* Minimalist Bottom Close Button */}
              <div className="p-4 border-t bg-white flex justify-center items-center shrink-0">
                  <button 
                    onClick={() => setDetailedViewItem(null)} 
                    className="px-10 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 hover:bg-gray-50 hover:text-gray-900 transition-all border border-transparent hover:border-gray-100"
                  >
                    Tutup Detail
                  </button>
              </div>
           </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
         <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gray-50 border-b border-gray-100">
               <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest">Tanggal</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest">Judul</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Approval</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Action</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-all cursor-pointer group" onClick={() => setDetailedViewItem(item)}>
                    <td className="px-8 py-6 text-xs font-bold text-gray-500">{item.postDate || '-'}</td>
                    <td className="px-8 py-6"><span className="px-3 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-widest border bg-white border-gray-200 text-gray-600">{item.status}</span></td>
                    <td className="px-8 py-6">
                        <div className="flex items-center gap-2 mb-1">{item.platform === 'Instagram' ? <Instagram size={12} className="text-rose-500"/> : <Video size={12} className="text-slate-800"/>}<span className="text-[9px] font-black uppercase text-gray-300">{item.platform}</span></div>
                        <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    </td>
                    <td className="px-8 py-6 text-center">{item.approvedBy ? <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full"><Check size={16} /></div> : <span className="text-gray-300">-</span>}</td>
                    <td className="px-8 py-6 text-center"><button className="p-2 text-gray-400 group-hover:text-blue-600"><MoreHorizontal size={20}/></button></td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default ContentPlan;
