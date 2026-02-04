
import React, { useState, useEffect, useRef } from 'react';
import { ContentPlanItem, PostInsight, User, Comment, SystemNotification, SocialAccount } from '../types';
import { MOCK_CONTENT_PLANS, SUPABASE_CONFIG } from '../constants';
import { scrapePostInsights } from '../services/geminiService';
import { databaseService } from '../services/databaseService';
import { Plus, ChevronDown, FileText, Link as LinkIcon, ExternalLink, X, Save, Check, Instagram, Video, BarChart2, Loader2, Edit2, ImageIcon, UserPlus, Filter, Clock, MessageSquare, Send, Edit, Trash2, Calendar, Smile, CheckCircle, Upload, MoreHorizontal, Settings, ChevronRight, Edit3, PlayCircle, RefreshCw, Paperclip, Image as ImageIconLucide, Eye, Undo2 } from 'lucide-react';

interface ContentPlanProps {
  primaryColorHex: string;
  onSaveInsight: (insight: PostInsight) => void;
  users: User[];
  addNotification: (notif: Omit<SystemNotification, 'id' | 'timestamp' | 'read'>) => void;
  currentUser: User;
  accounts: SocialAccount[];
  setAccounts: (accounts: SocialAccount[]) => void;
  targetContentId?: string | null;
  workspaceId: string; // NEW PROP: Essential for shared data
}

const DEFAULT_STATUS_OPTIONS = ['Menunggu Review', 'Sedang di Review', 'Approved', 'Drafting', 'Dijadwalkan', 'Diposting', 'Revisi', 'Reschedule', 'Dibatalkan'];
// Expanded Emoji List
const EMOJIS = ['👍', '🔥', '❤️', '😂', '😮', '😢', '👏', '🎉', '✅', '❌', '🚀', '💯', '🤔', '👀', '✨', '🙌', '🙏', '💪', '🤝', '💡', '⚠️', '🚩', '🆗', '🆒'];

const ContentPlan: React.FC<ContentPlanProps> = ({ primaryColorHex, onSaveInsight, users, addNotification, currentUser, accounts, setAccounts, targetContentId, workspaceId }) => {
  const [items, setItems] = useState<ContentPlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [detailedViewItem, setDetailedViewItem] = useState<ContentPlanItem | null>(null);
  const processedTargetId = useRef<string | null>(null); 
  const commentsEndRef = useRef<HTMLDivElement>(null); 
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentPlanItem | null>(null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false); // New state to prevent double submission
  
  // File Preview State
  const [previewAttachment, setPreviewAttachment] = useState<string | null>(null);
  
  // Filters
  const [filterApprovedBy, setFilterApprovedBy] = useState<string>('All');
  const [filterPlatform, setFilterPlatform] = useState<'All' | 'Instagram' | 'TikTok'>('All');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  const [activeAccount, setActiveAccount] = useState<string>(accounts[0]?.id || 'account-1');
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);
  
  // Status Management
  const [statusOptions, setStatusOptions] = useState<string[]>(() => {
    const saved = localStorage.getItem('sf_status_options');
    return saved ? JSON.parse(saved) : DEFAULT_STATUS_OPTIONS;
  });
  const [isManageStatusOpen, setIsManageStatusOpen] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');

  // PIC Management
  const [picOptions, setPicOptions] = useState<string[]>(() => {
      const saved = localStorage.getItem('sf_pic_options');
      return saved ? JSON.parse(saved) : users.map(u => u.name);
  });
  const [isManagePicOpen, setIsManagePicOpen] = useState(false);
  const [newPicName, setNewPicName] = useState('');


  // Account Management State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountFormData, setAccountFormData] = useState({ name: '', instagram: '', tiktok: '' });
  const [editingAccount, setEditingAccount] = useState<SocialAccount | null>(null);

  // Comment & Interaction State
  const [commentText, setCommentText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState<{data: string, type: 'image' | 'file'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Link Edit State in Detail View
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [tempLink, setTempLink] = useState('');

  const [formData, setFormData] = useState<{
    title: string;
    platform: ContentPlanItem['platform'];
    value: string; // Used as Objective
    pillar: string;
    type: string;
    description: string;
    postLink: string;
    approvedBy: string;
    pic: string;
    scriptUrl: string;
    visualUrl: string;
    status: ContentPlanItem['status'];
    postDate: string; 
  }>({
    title: '', platform: 'Instagram', value: 'Awareness', pillar: '', type: 'Reels', description: '', postLink: '', approvedBy: '', pic: '', scriptUrl: '', visualUrl: '', status: 'Menunggu Review', postDate: ''
  });

  const getDbConfig = () => ({
    url: localStorage.getItem('sf_db_url') || SUPABASE_CONFIG.url,
    key: localStorage.getItem('sf_db_key') || SUPABASE_CONFIG.key
  });

  // FETCH DATA ON MOUNT
  const fetchData = async () => {
    // Only set loading on initial fetch
    if(items.length === 0) setIsLoading(true);
    const dbConfig = getDbConfig();
    try {
        const sharedPlans = await databaseService.getContentPlans(dbConfig, workspaceId);
        setItems(sharedPlans);
        
        // If detail view is open, refresh its data specifically
        if (detailedViewItem) {
            const freshItem = sharedPlans.find(i => i.id === detailedViewItem.id);
            if (freshItem) {
                // Update detail view but prevent flickering if data is same
                if(JSON.stringify(freshItem) !== JSON.stringify(detailedViewItem)) {
                    setDetailedViewItem(freshItem);
                }
            }
        }
    } catch (e) {
        console.error("Fetch Plan Error", e);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  // REAL-TIME POLLING FOR DETAIL VIEW (1 Second Interval)
  useEffect(() => {
      let interval: any;
      if (detailedViewItem) {
          // Poll every 1 second when detail view is open to catch comments and approvals
          interval = setInterval(() => {
              fetchData();
          }, 1000); 
      }
      return () => {
          if(interval) clearInterval(interval);
      };
  }, [detailedViewItem?.id, workspaceId]); 

  // INSTANT SCROLL ON OPEN
  useEffect(() => {
      if (detailedViewItem?.id && commentsEndRef.current) {
          // Instant scroll to bottom when modal opens
          commentsEndRef.current.scrollIntoView({ behavior: "auto" });
      }
  }, [detailedViewItem?.id]);

  // SMOOTH SCROLL ON NEW COMMENT
  useEffect(() => {
      if (detailedViewItem?.comments?.length && commentsEndRef.current) {
          commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
  }, [detailedViewItem?.comments?.length]);

  // AUTO UPDATE STATUS TO "Sedang di Review"
  useEffect(() => {
      if (detailedViewItem && detailedViewItem.status === 'Menunggu Review' && currentUser.id !== detailedViewItem.creatorId) {
          // If a viewer (presumably approver/reviewer) opens it and it's still waiting, move to Reviewing
          updateItemStatus(detailedViewItem.id, 'Sedang di Review');
      }
  }, [detailedViewItem?.id]); // Run only when a new item is opened

  // Effect to handle Deep Linking from Notification
  useEffect(() => {
      // IMPORTANT: processedTargetId prevents re-opening the modal repeatedly for the same ID
      if (targetContentId && targetContentId !== processedTargetId.current && items.length > 0) {
          const item = items.find(i => i.id === targetContentId);
          if (item) {
              setDetailedViewItem(item);
              processedTargetId.current = targetContentId; // Mark as processed
              if (item.accountId && item.accountId !== activeAccount) {
                  setActiveAccount(item.accountId);
              }
          }
      }
  }, [targetContentId, items, activeAccount]);

  // Handle ESC Key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        setDetailedViewItem(null);
        setPreviewAttachment(null);
        setIsAccountModalOpen(false);
        setIsManageStatusOpen(false);
        setIsManagePicOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Persist Options
  useEffect(() => {
    localStorage.setItem('sf_status_options', JSON.stringify(statusOptions));
  }, [statusOptions]);
  
  useEffect(() => {
      localStorage.setItem('sf_pic_options', JSON.stringify(picOptions));
  }, [picOptions]);


  const handleAddStatus = (e: React.FormEvent) => {
      e.preventDefault();
      if(newStatusName && !statusOptions.includes(newStatusName)){
          setStatusOptions([...statusOptions, newStatusName]);
          setNewStatusName('');
      }
  };

  const handleRemoveStatus = (status: string) => {
      if(confirm(`Hapus status "${status}"?`)){
          setStatusOptions(statusOptions.filter(s => s !== status));
      }
  };

  const handleAddPic = (e: React.FormEvent) => {
    e.preventDefault();
    if(newPicName && !picOptions.includes(newPicName)){
        setPicOptions([...picOptions, newPicName]);
        setNewPicName('');
    }
  };

  const handleRemovePic = (name: string) => {
      if(confirm(`Hapus PIC "${name}"?`)){
          setPicOptions(picOptions.filter(s => s !== name));
      }
  };


  const handleSaveAccount = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingAccount) {
          setAccounts(accounts.map(acc => acc.id === editingAccount.id ? { ...acc, name: accountFormData.name, instagramUsername: accountFormData.instagram, tiktokUsername: accountFormData.tiktok } : acc));
          setEditingAccount(null);
      } else {
          const newAccount: SocialAccount = {
              id: `acc-${Date.now()}`,
              name: accountFormData.name,
              instagramUsername: accountFormData.instagram,
              tiktokUsername: accountFormData.tiktok
          };
          setAccounts([...accounts, newAccount]);
          setActiveAccount(newAccount.id);
      }
      setIsAccountModalOpen(false);
      setAccountFormData({ name: '', instagram: '', tiktok: '' });
  };

  const openEditModal = (item: ContentPlanItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title, value: item.value, pillar: item.pillar, type: item.type, platform: item.platform,
      description: item.description, postLink: item.postLink, approvedBy: item.approvedBy || '',
      pic: item.pic || '',
      scriptUrl: item.scriptUrl || '', visualUrl: item.visualUrl || '', status: item.status,
      postDate: item.postDate || ''
    });
    setLastAutoSave(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const dbConfig = getDbConfig();

    let finalItem: ContentPlanItem;

    if (editingItem) {
      finalItem = { ...editingItem, ...formData, workspaceId };
    } else {
      finalItem = { 
        id: `CP-${Date.now()}`, 
        workspaceId,
        creatorId: currentUser.id,
        ...formData, 
        approvedBy: '',
        status: 'Menunggu Review',
        accountId: activeAccount, 
        comments: [] 
      };
    }

    try {
        await databaseService.upsertContentPlan(dbConfig, finalItem);
        
        // Optimistic UI Update
        if (editingItem) {
            setItems(items.map(i => i.id === editingItem.id ? finalItem : i));
            if (detailedViewItem?.id === editingItem.id) setDetailedViewItem(finalItem);
        } else {
            setItems([finalItem, ...items]);
        }

        setIsModalOpen(false);
        setEditingItem(null);
        setFormData({ title: '', platform: 'Instagram', value: 'Awareness', pillar: '', type: 'Reels', description: '', postLink: '', approvedBy: '', pic: '', scriptUrl: '', visualUrl: '', status: 'Menunggu Review', postDate: '' });
    } catch (err: any) {
        alert(`Gagal menyimpan: ${err.message}. \n\nPastikan tabel 'content_plans' sudah dibuat di Supabase (Cek Tab DB Monitor di Dev Portal).`);
        console.error(err);
    } finally {
        setIsSaving(false);
    }
  };

  const updateItemStatus = async (itemId: string, newStatus: string) => {
      const dbConfig = getDbConfig();
      const targetItem = items.find(i => i.id === itemId);
      if(!targetItem) return;

      const updatedItem = { ...targetItem, status: newStatus as any };
      
      try {
          // Update Local
          setItems(items.map(i => i.id === itemId ? updatedItem : i));
          if (detailedViewItem && detailedViewItem.id === itemId) setDetailedViewItem(updatedItem);
          // Sync DB
          await databaseService.upsertContentPlan(dbConfig, updatedItem);
      } catch (e) { console.error(e); }
  };

  // CHANGE DATE HANDLER
  const updateItemDate = async (itemId: string, newDate: string) => {
      const dbConfig = getDbConfig();
      const targetItem = items.find(i => i.id === itemId);
      if(!targetItem) return;

      const updatedItem = { ...targetItem, postDate: newDate };
      
      try {
          setItems(items.map(i => i.id === itemId ? updatedItem : i));
          if (detailedViewItem && detailedViewItem.id === itemId) setDetailedViewItem(updatedItem);
          await databaseService.upsertContentPlan(dbConfig, updatedItem);
      } catch (e) { console.error(e); }
  };

  // APPROVE TOGGLE HANDLER
  const handleToggleApprove = async () => {
      if (!detailedViewItem) return;
      const dbConfig = getDbConfig();
      
      const isCurrentlyApproved = detailedViewItem.status === 'Approved';
      const newStatus = isCurrentlyApproved ? 'Menunggu Review' : 'Approved';
      const newApprovedBy = isCurrentlyApproved ? '' : currentUser.name;

      const updatedItem: ContentPlanItem = { 
        ...detailedViewItem, 
        approvedBy: newApprovedBy,
        status: newStatus as any
      };

      try {
        await databaseService.upsertContentPlan(dbConfig, updatedItem);
        setItems(items.map(i => i.id === updatedItem.id ? updatedItem : i));
        setDetailedViewItem(updatedItem);
        
        // NOTIFICATIONS LOGIC
        if (!isCurrentlyApproved) {
            // BROADCAST NOTIFICATION TO ALL WORKSPACE MEMBERS (Except Self)
            // This ensures everyone sees the approval notification in their popup
            for (const user of users) {
                if (user.id !== currentUser.id) {
                    await databaseService.createNotification(dbConfig, {
                        recipientId: user.id,
                        senderName: currentUser.name,
                        messageText: `${currentUser.name} approved this content: "${updatedItem.title}"`,
                        targetContentId: updatedItem.id,
                        type: 'success'
                    });
                }
            }
            
            // Local Notification for Self
            addNotification({
                senderName: currentUser.name,
                messageText: `Approved content: "${updatedItem.title}"`,
                type: 'success',
                targetContentId: updatedItem.id
            });
        }
      } catch (e) { alert("Gagal update status approval"); }
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              // Store as base64
              setAttachment({ 
                  data: reader.result as string, 
                  type: file.type.startsWith('image/') ? 'image' : 'file' 
              });
          };
          reader.readAsDataURL(file);
      }
  };

  const handlePostComment = async (itemId: string) => {
      if ((!commentText.trim() && !attachment) || isSendingComment) return;
      
      setIsSendingComment(true); // Lock Submission
      const dbConfig = getDbConfig();
      
      const newComment: Comment = {
          id: Date.now().toString(),
          userId: currentUser.id,
          userName: currentUser.name,
          text: commentText,
          timestamp: new Date().toISOString(),
          attachment: attachment?.data,
          attachmentType: attachment?.type
      };
      
      const targetItem = items.find(i => i.id === itemId);
      if(!targetItem) {
          setIsSendingComment(false);
          return;
      }

      const updatedItem = { ...targetItem, comments: [...(targetItem.comments || []), newComment] };

      try {
          // 1. Optimistic UI update
          setItems(items.map(i => i.id === itemId ? updatedItem : i));
          if(detailedViewItem?.id === itemId) setDetailedViewItem(updatedItem);
          
          // 2. Sync to DB
          await databaseService.upsertContentPlan(dbConfig, updatedItem);

          // 3. BROADCAST NOTIFICATION TO ALL WORKSPACE MEMBERS (Except Self)
          // This ensures everyone gets the popup notification even if not on this page
          for (const user of users) {
              if (user.id !== currentUser.id) {
                  await databaseService.createNotification(dbConfig, {
                      recipientId: user.id,
                      senderName: currentUser.name,
                      messageText: `New comment on "${targetItem.title}": ${commentText.substring(0, 30)}...`,
                      targetContentId: targetItem.id,
                      type: 'info'
                  });
              }
          }

      } catch (e) { 
          console.error(e);
          alert("Gagal mengirim komentar. Periksa koneksi.");
      } finally {
          setIsSendingComment(false); // Unlock Submission
          setCommentText('');
          setAttachment(null);
          setShowEmojiPicker(false);
      }
  };

  const handleUpdateLink = async (itemId: string) => {
      const dbConfig = getDbConfig();
      const targetItem = items.find(i => i.id === itemId);
      if(!targetItem) return;

      const updatedItem = { ...targetItem, postLink: tempLink };
      
      try {
          await databaseService.upsertContentPlan(dbConfig, updatedItem);
          setItems(items.map(i => i.id === itemId ? updatedItem : i));
          if (detailedViewItem && detailedViewItem.id === itemId) {
              setDetailedViewItem(updatedItem);
          }
      } catch (e) { console.error(e); }
      
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
      setShowEmojiPicker(false); // Close automatically after selection
  };

  const filteredItems = items.filter(item => {
    if (item.accountId && item.accountId !== activeAccount) return false;
    if (filterApprovedBy !== 'All' && item.approvedBy !== filterApprovedBy) return false;
    if (filterPlatform !== 'All') {
        if (filterPlatform !== item.platform) return false;
    }
    if (filterStartDate || filterEndDate) {
        const itemDateStr = item.postDate;
        if (!itemDateStr) return false;
        const itemDate = new Date(itemDateStr).getTime();
        if (filterStartDate && itemDate < new Date(filterStartDate).getTime()) return false;
        if (filterEndDate) {
            const endDate = new Date(filterEndDate);
            endDate.setHours(23, 59, 59);
            if (itemDate > endDate.getTime()) return false;
        }
    }
    return true;
  });

  const getRowStyle = (item: ContentPlanItem) => {
      if (item.platform === 'Instagram') return "border-l-[6px] border-l-rose-500 bg-rose-50/30 hover:bg-rose-50";
      if (item.platform === 'TikTok') return "border-l-[6px] border-l-slate-900 bg-slate-50/50 hover:bg-slate-100";
      return "border-l-[6px] border-l-blue-500 bg-blue-50/20";
  };

  return (
    <div className="space-y-8 animate-slide relative pb-20">
      
      {/* ATTACHMENT PREVIEW MODAL */}
      {previewAttachment && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-slide p-4">
              <button onClick={() => setPreviewAttachment(null)} className="fixed top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[260]"><X size={24}/></button>
              <div className="relative max-w-5xl max-h-screen w-full flex flex-col items-center justify-center">
                  <img src={previewAttachment} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
                  <a href={previewAttachment} download="attachment" className="mt-6 px-6 py-3 bg-white text-gray-900 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center gap-2">
                      <ExternalLink size={14}/> Download Original
                  </a>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Konten Plan</h1>
          <p className="text-gray-400 font-medium flex items-center gap-2">
             Strategi & Manajemen Konten Arunika. 
             <span className="text-blue-500 bg-blue-50 px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer hover:bg-blue-100" onClick={fetchData}>
                <RefreshCw size={10} className={isLoading ? "animate-spin" : ""} /> {isLoading ? 'Syncing...' : 'Live Synced'}
             </span>
          </p>
        </div>
        
        {/* NEW CLEAN FILTER UI */}
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
            <div className="flex items-center gap-2 px-4 border-r border-gray-100">
                <Filter size={14} className="text-gray-400" />
            </div>
            {['All', 'Instagram', 'TikTok'].map((p) => (
                <button 
                key={p}
                onClick={() => setFilterPlatform(p as any)}
                className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filterPlatform === p ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                >
                {p}
                </button>
            ))}
            <div className="h-6 w-[1px] bg-gray-100 mx-1"></div>
            <div className="flex items-center gap-2 pr-2">
                <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="bg-transparent text-[10px] font-bold text-gray-600 outline-none w-24 cursor-pointer" />
                <span className="text-gray-300">-</span>
                <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="bg-transparent text-[10px] font-bold text-gray-600 outline-none w-24 cursor-pointer" />
            </div>
        </div>

        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 active:scale-95 flex items-center gap-2 transition-all hover:bg-blue-700">
            <Plus size={20} /> Tambah Plan
        </button>
      </div>

      {/* Account Tabs */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
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
         <button onClick={() => { setEditingAccount(null); setAccountFormData({name: '', instagram: '', tiktok: ''}); setIsAccountModalOpen(true); }} className="px-4 py-3 bg-white text-gray-400 rounded-2xl border border-dashed border-gray-300 hover:border-gray-400 transition-all hover:bg-gray-50">
            <Plus size={16}/>
         </button>
      </div>

      {/* Account Modal */}
      {isAccountModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
             <div className="absolute inset-0" onClick={() => setIsAccountModalOpen(false)}></div>
             <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 border border-gray-100 animate-slide">
                 <button onClick={() => setIsAccountModalOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-gray-50 rounded-full"><X size={18}/></button>
                 <h2 className="text-xl font-black text-gray-900 mb-6">{editingAccount ? 'Edit Akun' : 'Tambah Akun Baru'}</h2>
                 <form onSubmit={handleSaveAccount} className="space-y-4">
                     <div><label className="text-[10px] font-black uppercase text-gray-400">Nama Akun</label><input required value={accountFormData.name} onChange={e => setAccountFormData({...accountFormData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none font-bold text-sm focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all" /></div>
                     <div><label className="text-[10px] font-black uppercase text-gray-400">Instagram Username</label><input value={accountFormData.instagram} onChange={e => setAccountFormData({...accountFormData, instagram: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none font-bold text-sm focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all" /></div>
                     <div><label className="text-[10px] font-black uppercase text-gray-400">TikTok Username</label><input value={accountFormData.tiktok} onChange={e => setAccountFormData({...accountFormData, tiktok: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 outline-none font-bold text-sm focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all" /></div>
                     <button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest mt-2 hover:bg-black transition-all">Simpan Akun</button>
                 </form>
             </div>
          </div>
      )}

      {/* Content Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-6">
           <div className="absolute inset-0" onClick={() => setIsModalOpen(false)}></div>
           <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.1)] overflow-hidden animate-slide flex flex-col max-h-[90vh] border border-gray-100 my-auto">
              <div className="p-8 bg-white border-b border-gray-50 flex justify-between items-center shrink-0">
                 <div>
                    <h2 className="text-2xl font-black text-gray-900">{editingItem ? 'Edit Perencanaan' : 'Perencanaan Baru'}</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Arunika Creative Studio</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                 
                 {/* Platform Selection */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pilih Platform</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button type="button" onClick={() => setFormData({...formData, platform: 'Instagram'})} className={`p-4 rounded-2xl border flex items-center justify-center gap-2 transition-all ${formData.platform === 'Instagram' ? 'bg-rose-50 border-rose-200 text-rose-600 ring-2 ring-rose-100' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                            <Instagram size={20} /> <span className="text-xs font-black uppercase">Instagram</span>
                        </button>
                        <button type="button" onClick={() => setFormData({...formData, platform: 'TikTok'})} className={`p-4 rounded-2xl border flex items-center justify-center gap-2 transition-all ${formData.platform === 'TikTok' ? 'bg-slate-50 border-slate-200 text-slate-800 ring-2 ring-slate-100' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                            <Video size={20} /> <span className="text-xs font-black uppercase">TikTok</span>
                        </button>
                    </div>
                 </div>

                 {/* Existing Form Fields */}
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Judul Posting</label>
                       <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100 focus:border-blue-200 focus:bg-white transition-all" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status Plan</label>
                       <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100 focus:border-blue-200">
                          {statusOptions.map(o => <option key={o} value={o}>{o}</option>)}
                       </select>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Konten Pilar</label><input value={formData.pillar} onChange={e => setFormData({...formData, pillar: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100 focus:border-blue-200 focus:bg-white" /></div>
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Objective / Value</label><input value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100 focus:border-blue-200 focus:bg-white" /></div>
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanggal Posting</label><input type="date" value={formData.postDate} onChange={e => setFormData({...formData, postDate: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100 focus:border-blue-200 focus:bg-white" /></div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">PIC Content</label>
                            <button type="button" onClick={() => setIsManagePicOpen(true)} className="text-[9px] font-black text-blue-500 uppercase">Manage List</button>
                        </div>
                        <select value={formData.pic} onChange={e => setFormData({...formData, pic: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100 focus:border-blue-200">
                            <option value="">Pilih PIC</option>
                            {picOptions.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                 </div>
                 <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Post Live Link (Opsional)</label><input value={formData.postLink} onChange={e => setFormData({...formData, postLink: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100 focus:border-blue-200 focus:bg-white" /></div>
                 
                 {/* PDF Upload Simulation */}
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Script / Brief (PDF)</label>
                    <div className="w-full h-32 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all group">
                        <Upload size={24} className="text-gray-300 group-hover:text-blue-500 mb-2"/>
                        <p className="text-xs font-bold text-gray-400 group-hover:text-blue-500">Click to upload Script PDF</p>
                    </div>
                 </div>

                 <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-2">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-gray-100 text-gray-400 font-black uppercase text-[10px] tracking-widest rounded-2xl active:scale-95 transition-all">Batal</button>
                    <button type="submit" disabled={isSaving} className="flex-[2] py-5 bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all hover:bg-blue-700 flex justify-center gap-2">
                        {isSaving && <Loader2 size={16} className="animate-spin" />}
                        Simpan Perencanaan
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* MANAGE STATUS MODAL */}
      {isManageStatusOpen && (
          <div className="fixed inset-0 z-[220] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" onClick={() => setIsManageStatusOpen(false)}></div>
              <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 border border-gray-100 animate-slide">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-black text-gray-900">Manage Status</h3>
                      <button onClick={() => setIsManageStatusOpen(false)} className="p-2 hover:bg-gray-50 rounded-full"><X size={18}/></button>
                  </div>
                  <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                      {statusOptions.map(status => (
                          <div key={status} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                              <span className="text-xs font-bold text-gray-700">{status}</span>
                              <button onClick={() => handleRemoveStatus(status)} className="text-rose-400 hover:text-rose-600"><Trash2 size={14}/></button>
                          </div>
                      ))}
                  </div>
                  <form onSubmit={handleAddStatus} className="flex gap-2">
                      <input value={newStatusName} onChange={e => setNewStatusName(e.target.value)} className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:bg-white focus:border-blue-200" placeholder="New Status Name..." />
                      <button type="submit" className="p-3 bg-gray-900 text-white rounded-xl"><Plus size={16}/></button>
                  </form>
              </div>
          </div>
      )}

      {/* MANAGE PIC MODAL */}
      {isManagePicOpen && (
          <div className="fixed inset-0 z-[220] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" onClick={() => setIsManagePicOpen(false)}></div>
              <div className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 border border-gray-100 animate-slide">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-black text-gray-900">Manage PIC List</h3>
                      <button onClick={() => setIsManagePicOpen(false)} className="p-2 hover:bg-gray-50 rounded-full"><X size={18}/></button>
                  </div>
                  <div className="space-y-3 mb-6 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                      {picOptions.map(p => (
                          <div key={p} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                              <span className="text-xs font-bold text-gray-700">{p}</span>
                              <button onClick={() => handleRemovePic(p)} className="text-rose-400 hover:text-rose-600"><Trash2 size={14}/></button>
                          </div>
                      ))}
                  </div>
                  <form onSubmit={handleAddPic} className="flex gap-2">
                      <input value={newPicName} onChange={e => setNewPicName(e.target.value)} className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-xs font-bold outline-none border border-transparent focus:bg-white focus:border-blue-200" placeholder="New PIC Name..." />
                      <button type="submit" className="p-3 bg-gray-900 text-white rounded-xl"><Plus size={16}/></button>
                  </form>
              </div>
          </div>
      )}

      {/* DETAIL CONTENT POPUP - REDESIGNED */}
      {detailedViewItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
           {/* Removed Black Background, only click handler */}
           <div className="absolute inset-0 bg-transparent" onClick={() => setDetailedViewItem(null)}></div>
           
           <div className="relative bg-white w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-[0_30px_100px_-10px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden flex animate-slide my-auto">
              <button onClick={() => setDetailedViewItem(null)} className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-gray-100 rounded-full z-10 transition-colors text-gray-400 hover:text-gray-900"><X size={20}/></button>
              
              {/* Left Column: Info */}
              <div className="w-1/2 p-10 overflow-y-auto custom-scrollbar bg-white space-y-8 border-r border-gray-50 flex flex-col">
                 <div>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                            {/* Custom Status Dropdown in Detail View */}
                            <div className="relative group">
                                <select 
                                    value={detailedViewItem.status} 
                                    onChange={(e) => updateItemStatus(detailedViewItem.id, e.target.value)}
                                    className="appearance-none pl-4 pr-8 py-2 bg-gray-100 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-gray-200 transition-colors outline-none"
                                >
                                    {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                            <button onClick={() => setIsManageStatusOpen(true)} className="p-2 text-gray-300 hover:text-blue-500 transition-colors" title="Manage Statuses"><Settings size={14}/></button>
                        </div>
                        
                        {/* New Edit Icon Location */}
                        <button 
                            onClick={() => { setDetailedViewItem(null); openEditModal(detailedViewItem); }} 
                            className="p-3 bg-gray-50 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded-2xl transition-all"
                            title="Edit Data"
                        >
                            <Edit3 size={18}/>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                         {detailedViewItem.platform === 'Instagram' ? <Instagram size={18} className="text-rose-500"/> : <Video size={18} className="text-slate-800"/>}
                         <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{detailedViewItem.platform}</span>
                    </div>

                    <h2 className="text-3xl font-black text-gray-900 mt-2 leading-tight">{detailedViewItem.title}</h2>
                    {/* EDITABLE DATE FIELD */}
                    <div className="mt-3 flex items-center gap-2">
                        <Calendar size={14} className="text-blue-500"/>
                        <input 
                            type="date" 
                            value={detailedViewItem.postDate || ''}
                            onChange={(e) => updateItemDate(detailedViewItem.id, e.target.value)}
                            className="text-xs font-bold text-gray-500 bg-transparent border-none outline-none cursor-pointer hover:text-blue-500 transition-colors"
                        />
                    </div>
                 </div>

                 {/* Post Link Section */}
                 <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                    <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">Live URL</h4>
                    {!isEditingLink ? (
                        <div className="flex items-center justify-between gap-2">
                            {detailedViewItem.postLink && detailedViewItem.postLink.length > 5 ? (
                                <a href={detailedViewItem.postLink} target="_blank" className="flex-1 truncate text-xs font-bold text-blue-600 hover:underline flex items-center gap-2">
                                    <LinkIcon size={12}/> {detailedViewItem.postLink}
                                </a>
                            ) : <span className="text-xs text-gray-300 italic">Belum ada link terlampir</span>}
                            <button onClick={() => { setTempLink(detailedViewItem.postLink || ''); setIsEditingLink(true); }} className="p-2 hover:bg-white rounded-lg text-gray-400 transition-all"><Edit2 size={14}/></button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <input value={tempLink} onChange={e => setTempLink(e.target.value)} className="flex-1 px-3 py-2 bg-white rounded-xl text-xs font-bold border border-blue-200 outline-none" placeholder="https://..." />
                            <button onClick={() => handleUpdateLink(detailedViewItem.id)} className="p-2 bg-blue-500 text-white rounded-xl"><Check size={14}/></button>
                            <button onClick={() => setIsEditingLink(false)} className="p-2 bg-gray-200 text-gray-500 rounded-xl"><X size={14}/></button>
                        </div>
                    )}
                 </div>

                 {/* Two Level Grids */}
                 <div className="space-y-4">
                    {/* Pillar & Objective */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-2">
                            <div>
                                <p className="text-[9px] text-gray-300 uppercase tracking-widest mb-1">PIC Content</p>
                                <p className="font-black text-gray-800 text-sm">{detailedViewItem.pic || '-'}</p>
                            </div>
                            <div className="h-[1px] w-full bg-gray-50 my-1"></div>
                            <div>
                                <p className="text-[9px] text-gray-300 uppercase tracking-widest mb-1">Objective / Value</p>
                                <p className="font-bold text-gray-600 text-xs">{detailedViewItem.value || '-'}</p>
                            </div>
                        </div>

                        {/* Approval System */}
                        <div className="p-5 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col gap-2">
                            <div>
                                <p className="text-[9px] text-gray-300 uppercase tracking-widest mb-1">Approved By</p>
                                <p className="font-black text-gray-800 text-sm flex items-center gap-2">
                                    {detailedViewItem.approvedBy || '-'}
                                </p>
                            </div>
                            <div className="h-[1px] w-full bg-gray-50 my-1"></div>
                            <div>
                                <p className="text-[9px] text-gray-300 uppercase tracking-widest mb-1">Current Status</p>
                                <div className="flex items-center gap-2">
                                    {detailedViewItem.status === 'Approved' ? (
                                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1"><CheckCircle size={12}/> Approved</span>
                                    ) : detailedViewItem.status === 'Sedang di Review' ? (
                                        <span className="text-xs font-bold text-blue-500 flex items-center gap-1"><Eye size={12}/> Reviewing</span>
                                    ) : (
                                        <span className="text-xs font-bold text-amber-500 flex items-center gap-1"><Clock size={12}/> Waiting</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* PDF Script Section */}
                 <div className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                    <p className="text-[9px] text-gray-300 uppercase tracking-widest mb-3">Script & Brief File</p>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-10 h-10 bg-rose-100 text-rose-500 rounded-xl flex items-center justify-center shrink-0">
                            <FileText size={20}/>
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-gray-900">Content_Script_V1.pdf</p>
                            <p className="text-[10px] text-gray-400">1.2 MB • Uploaded just now</p>
                        </div>
                        <button className="px-4 py-2 bg-white text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 hover:bg-gray-50 transition-all">
                            Preview
                        </button>
                    </div>
                 </div>

                 <div className="flex gap-3 pt-6 mt-auto">
                    {/* Approve Button */}
                    <button 
                        onClick={handleToggleApprove}
                        className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
                            detailedViewItem.status === 'Approved' 
                            ? 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-200' 
                            : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200'
                        }`}
                    >
                        {detailedViewItem.status === 'Approved' ? (
                            <><Undo2 size={16} /> Batal Approve</>
                        ) : (
                            <><CheckCircle size={16} /> Approve Content</>
                        )}
                    </button>

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
              <div className="w-1/2 p-10 flex flex-col bg-gray-50/30 relative">
                 {/* Live Indicator */}
                 <div className="absolute top-4 right-4 flex items-center gap-2">
                     <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                     <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Realtime Chat</span>
                 </div>

                 <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><MessageSquare size={20} /></div>
                        <h3 className="text-lg font-black text-gray-900">Diskusi Tim</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400">{detailedViewItem.comments?.length || 0} Komentar</span>
                    </div>
                 </div>
                 <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 mb-6 pr-2">
                    {detailedViewItem.comments?.length === 0 && <p className="text-center text-xs text-gray-300 italic py-20">Belum ada diskusi untuk konten ini.</p>}
                    {detailedViewItem.comments?.map((c) => {
                        const isMe = c.userId === currentUser.id;
                        const commentUser = users.find(u => u.id === c.userId);
                        return (
                            <div key={c.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end animate-slide`}>
                                <img 
                                    src={commentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.userName}`} 
                                    className="w-8 h-8 rounded-full border border-gray-200 shadow-sm bg-white"
                                    alt={c.userName}
                                />
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                    <div className={`p-4 rounded-2xl shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white border border-gray-100 text-gray-700 rounded-bl-sm'}`}>
                                        {!isMe && <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60 text-blue-500">{c.userName}</p>}
                                        {c.attachment && c.attachmentType === 'image' && (
                                            <img 
                                                src={c.attachment} 
                                                alt="Attachment" 
                                                onClick={() => setPreviewAttachment(c.attachment!)}
                                                className="w-full h-auto rounded-xl mb-2 object-cover max-h-48 border border-white/20 cursor-pointer hover:opacity-90 transition-opacity" 
                                            />
                                        )}
                                        {c.attachment && c.attachmentType === 'file' && (
                                            <div className="flex items-center gap-2 p-2 bg-black/5 rounded-lg mb-2">
                                                <FileText size={16} /> <span className="text-xs font-bold">File Attachment</span>
                                            </div>
                                        )}
                                        <p className="text-xs font-medium leading-relaxed">{c.text}</p>
                                    </div>
                                    <p className="text-[9px] text-gray-300 mt-1 font-bold">{new Date(c.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={commentsEndRef} />
                 </div>
                 <div className="relative bg-white p-2 rounded-3xl border border-gray-100 shadow-lg">
                    {showEmojiPicker && (
                        <div className="absolute bottom-20 left-0 bg-white shadow-2xl border border-gray-100 rounded-2xl p-3 grid grid-cols-6 gap-2 z-20 w-80 animate-slide">
                            {EMOJIS.map(em => (
                                <button key={em} onClick={() => addEmoji(em)} className="text-2xl hover:bg-gray-50 p-2 rounded-lg transition-colors">{em}</button>
                            ))}
                        </div>
                    )}
                    
                    {/* Attachment Preview */}
                    {attachment && (
                        <div className="absolute -top-16 left-4 bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-3 shadow-lg">
                            {attachment.type === 'image' ? <ImageIconLucide size={16}/> : <FileText size={16}/>}
                            <span>File attached</span>
                            <button onClick={() => setAttachment(null)} className="p-1 hover:bg-white/20 rounded-full"><X size={12}/></button>
                        </div>
                    )}

                    <div className="flex gap-2 items-center">
                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-2xl transition-colors"><Smile size={20}/></button>
                        
                        {/* File Upload Trigger */}
                        <div className="relative">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                onChange={handleFileSelect} 
                                accept="image/*,.pdf,.doc"
                            />
                            <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-2xl transition-colors">
                                <Paperclip size={20}/>
                            </button>
                        </div>

                        <input 
                            value={commentText} 
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, detailedViewItem.id)}
                            placeholder="Tulis komentar..." 
                            className="flex-1 bg-transparent outline-none text-xs font-medium text-gray-700"
                        />
                        <button onClick={() => handlePostComment(detailedViewItem.id)} className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors shadow-md active:scale-95">
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
                  <th className="px-8 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest">Tanggal</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest">Judul Konten</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest">Link</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Approval</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Action</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {filteredItems.map(item => (
                  <tr key={item.id} className={`hover:bg-gray-50/80 transition-all cursor-pointer group ${getRowStyle(item)}`} onClick={() => setDetailedViewItem(item)}>
                    <td className="px-8 py-6">
                        <p className="text-xs font-bold text-gray-500">{item.postDate ? new Date(item.postDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) : '-'}</p>
                    </td>
                    <td className="px-8 py-6">
                        <span className={`px-3 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-widest border bg-white border-gray-200 text-gray-600 shadow-sm`}>{item.status}</span>
                    </td>
                    <td className="px-8 py-6">
                        <div className="flex items-center gap-2 mb-1">
                             {item.platform === 'Instagram' ? <Instagram size={12} className="text-rose-500"/> : <Video size={12} className="text-slate-800"/>}
                             <span className="text-[9px] font-black uppercase text-gray-300">{item.platform}</span>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    </td>
                    <td className="px-8 py-6">
                        {item.postLink && item.postLink.length > 5 ? (
                            <a href={item.postLink} target="_blank" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[9px] font-bold text-blue-600 hover:text-blue-700 hover:border-blue-200 transition-colors shadow-sm">
                                <ExternalLink size={10} /> Link
                            </a>
                        ) : (
                            <span className="text-[9px] font-bold text-gray-300 italic">No Link</span>
                        )}
                    </td>
                    <td className="px-8 py-6 text-center">
                        {item.approvedBy ? <div className="inline-flex items-center justify-center w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full shadow-sm"><Check size={16} /></div> : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-2">
                            <button className="p-2 text-gray-400 group-hover:text-blue-600 transition-colors bg-white border border-transparent group-hover:border-gray-200 rounded-xl shadow-sm"><MoreHorizontal size={20}/></button>
                        </div>
                    </td>
                  </tr>
               ))}
               {filteredItems.length === 0 && (
                 <tr>
                   <td colSpan={6} className="py-20 text-center text-gray-300 font-bold uppercase text-[10px] tracking-widest">
                       {isLoading ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin"/> Syncing Database...</span> : "Tidak ada perencanaan ditemukan"}
                   </td>
                 </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default ContentPlan;
