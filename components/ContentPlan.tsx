import React, { useState } from 'react';
import { ContentPlanItem, PostInsight } from '../types';
import { MOCK_CONTENT_PLANS, MOCK_USERS } from '../constants';
import { scrapePostInsights } from '../services/geminiService';
import { Plus, ChevronDown, ChevronUp, FileText, Link as LinkIcon, ExternalLink, X, Save, Settings, Check, Instagram, Video, BarChart2, Loader2, Edit2, ImageIcon, UserPlus } from 'lucide-react';

interface ContentPlanProps {
  primaryColorHex: string;
  onSaveInsight: (insight: PostInsight) => void;
}

const INITIAL_STATUS_OPTIONS: ContentPlanItem['status'][] = ['Drafting', 'Dijadwalkan', 'Diposting', 'Revisi', 'Reschedule', 'Dibatalkan'];

const ContentPlan: React.FC<ContentPlanProps> = ({ primaryColorHex, onSaveInsight }) => {
  const [items, setItems] = useState<ContentPlanItem[]>(MOCK_CONTENT_PLANS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentPlanItem | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Maintain all original fields
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

  const openEditModal = (item: ContentPlanItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title, value: item.value, pillar: item.pillar, type: item.type,
      description: item.description, postLink: item.postLink, approvedBy: item.approvedBy || '',
      scriptUrl: item.scriptUrl || '', visualUrl: item.visualUrl || '', status: item.status
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem) {
      setItems(items.map(i => i.id === editingItem.id ? { ...i, ...formData } : i));
    } else {
      const newItem: ContentPlanItem = { id: Date.now().toString(), ...formData };
      setItems([newItem, ...items]);
    }
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ title: '', value: 'Educational', pillar: '', type: 'Reels', description: '', postLink: '', approvedBy: '', scriptUrl: '', visualUrl: '', status: 'Drafting' });
  };

  const handleAnalyzeLink = async (item: ContentPlanItem) => {
    if (!item.postLink || item.postLink === '' || item.postLink === '#') {
      alert("Masukkan link postingan yang valid terlebih dahulu.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const insight = await scrapePostInsights(item.postLink);
      onSaveInsight({ ...insight, sourceType: 'plan' });
      alert("Analisis berhasil! Data performa telah disinkronkan ke halaman Analitik.");
    } catch (err) {
      console.error(err);
      alert("Gagal melakukan scrapping. Pastikan link dapat diakses publik.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Konten Plan</h1>
          <p className="text-gray-400 font-medium">Strategi & Manajemen Konten Snaillabs.</p>
        </div>
        <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="px-6 py-3 bg-[var(--primary-color)] text-white rounded-2xl font-bold shadow-xl active:scale-95 flex items-center gap-2 transition-all">
           <Plus size={20} /> Tambah Plan
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-black/50 backdrop-blur-md">
           <div className="absolute inset-0" onClick={() => setIsModalOpen(false)}></div>
           <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-slide flex flex-col max-h-[90vh] border border-gray-100">
              <div className="p-8 bg-[var(--primary-color)] text-white flex justify-between items-center">
                 <div>
                    <h2 className="text-2xl font-black">{editingItem ? 'Edit Perencanaan' : 'Perencanaan Baru'}</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Snaillabs Creative Studio</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={24} /></button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-white">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Judul Posting</label>
                       <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100 focus:border-[var(--primary-color)] transition-all" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Status Plan</label>
                       <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100">
                          {INITIAL_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Konten Pilar</label>
                       <input value={formData.pillar} onChange={e => setFormData({...formData, pillar: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100" placeholder="Edukasi, Promo, dll" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tipe Konten</label>
                       <input value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100" placeholder="Reels, Carousel, dll" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><FileText size={12}/> Script URL</label>
                       <input value={formData.scriptUrl} onChange={e => setFormData({...formData, scriptUrl: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100" placeholder="Link Docs/Script" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><UserPlus size={12}/> Approved By</label>
                       <select value={formData.approvedBy} onChange={e => setFormData({...formData, approvedBy: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100">
                          <option value="">Pilih Approval</option>
                          {MOCK_USERS.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><ImageIcon size={12}/> Visual URL / Asset</label>
                       <input value={formData.visualUrl} onChange={e => setFormData({...formData, visualUrl: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100" placeholder="Link Asset/Canva" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><LinkIcon size={12}/> Post Live Link</label>
                       <input value={formData.postLink} onChange={e => setFormData({...formData, postLink: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100" placeholder="https://instagram.com/p/..." />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Brief Visual / Deskripsi</label>
                    <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-gray-900 border border-gray-100" placeholder="Tulis instruksi editing atau brief visual di sini..." />
                 </div>

                 <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-2">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-gray-100 text-gray-500 font-black uppercase text-[10px] tracking-widest rounded-2xl active:scale-95 transition-all">Batal</button>
                    <button type="submit" className="flex-[2] py-5 bg-[var(--primary-color)] text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl active:scale-95 transition-all">Simpan Perencanaan</button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* Table & Expanded Details */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
         <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
               <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Judul</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Aksi</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {items.map(item => (
                  <React.Fragment key={item.id}>
                     <tr className="hover:bg-gray-50 transition-all cursor-pointer" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                        <td className="px-8 py-6">
                           <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest border ${
                             item.status === 'Diposting' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                           }`}>{item.status}</span>
                        </td>
                        <td className="px-8 py-6 text-sm font-bold text-gray-900">{item.title}</td>
                        <td className="px-8 py-6 text-center">
                           <div className="p-2 text-gray-300 group-hover:text-gray-900 transition-all">{expandedId === item.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</div>
                        </td>
                     </tr>
                     {expandedId === item.id && (
                        <tr className="bg-gray-50/30 animate-slide">
                           <td colSpan={3} className="px-10 py-8">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                 <div className="md:col-span-2 space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Informasi Strategis</h4>
                                    <div className="grid grid-cols-2 gap-6 text-xs font-bold">
                                       <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                          <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">Pilar / Value</p>
                                          <p className="text-gray-900">{item.pillar} • {item.value}</p>
                                       </div>
                                       <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                          <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1">Approval</p>
                                          <p className="text-gray-900">{item.approvedBy || 'Menunggu Review'}</p>
                                       </div>
                                    </div>
                                    <div className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
                                       <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-2">Brief Deskripsi</p>
                                       <p className="text-gray-600 leading-relaxed font-medium">{item.description || 'Tidak ada brief deskripsi tersedia.'}</p>
                                    </div>
                                 </div>
                                 <div className="flex flex-col gap-3 min-w-[240px]">
                                    <button 
                                       onClick={() => openEditModal(item)}
                                       className="w-full flex items-center justify-center gap-3 py-3.5 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                                    >
                                       <Edit2 size={16}/> Edit Perencanaan
                                    </button>
                                    <button 
                                       onClick={() => handleAnalyzeLink(item)}
                                       disabled={isAnalyzing}
                                       className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-100 text-[var(--primary-color)] rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
                                    >
                                       {isAnalyzing ? <Loader2 size={16} className="animate-spin"/> : <BarChart2 size={16}/>}
                                       Analyze Tracker
                                    </button>
                                    <div className="mt-4 p-4 border-t border-gray-100 flex flex-col gap-2">
                                       {item.scriptUrl && item.scriptUrl !== '#' && (
                                         <a href={item.scriptUrl} target="_blank" className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-2 hover:underline"><FileText size={12}/> View Script</a>
                                       )}
                                       {item.visualUrl && item.visualUrl !== '#' && (
                                         <a href={item.visualUrl} target="_blank" className="text-[10px] font-black text-purple-600 uppercase flex items-center gap-2 hover:underline"><ImageIcon size={12}/> View Assets</a>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           </td>
                        </tr>
                     )}
                  </React.Fragment>
               ))}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default ContentPlan;