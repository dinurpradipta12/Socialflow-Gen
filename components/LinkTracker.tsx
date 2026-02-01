
import React, { useState } from 'react';
import { Search, Loader2, Link2, ExternalLink, ThumbsUp, MessageSquare, Share2, BarChart2, Save, Plus, X } from 'lucide-react';
import { scrapePostInsights } from '../services/geminiService';
import { PostInsight } from '../types';

interface LinkTrackerProps {
  primaryColorHex: string;
  onSaveManualInsight: (insight: PostInsight) => void;
}

const LinkTracker: React.FC<LinkTrackerProps> = ({ primaryColorHex, onSaveManualInsight }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<PostInsight | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // State for manual entry form
  const [manualData, setManualData] = useState<PostInsight>({
    url: '',
    platform: 'Instagram',
    likes: 0,
    comments: 0,
    shares: 0,
    engagementRate: 0,
    sentiment: 'neutral',
    analysis: '',
  });

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    try {
      const data = await scrapePostInsights(url);
      setInsight({ ...data, sourceType: 'manual' });
    } catch (error) {
      console.error(error);
      alert('Gagal menganalisis link.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDatabase = () => {
    if (insight) {
      onSaveManualInsight(insight);
      alert("Insight manual berhasil disimpan ke database analitik!");
      setInsight(null);
      setUrl('');
    }
  };

  const saveManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualData.url.trim()) return;
    onSaveManualInsight({ ...manualData, sourceType: 'manual', timestamp: new Date().toISOString() });
    setIsManualModalOpen(false);
    alert("Data manual berhasil disimpan ke analitik!");
    setManualData({ url: '', platform: 'Instagram', likes: 0, comments: 0, shares: 0, engagementRate: 0, sentiment: 'neutral', analysis: '' });
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto py-10 animate-slide">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">AI Link Tracker</h1>
        <p className="text-gray-400 font-medium">Scrape data performa postingan secara instan & simpan terpisah dari rencana konten.</p>
      </div>

      <div className="flex gap-4">
        <form onSubmit={handleScrape} className="flex-1 relative shadow-2xl rounded-3xl overflow-hidden ring-4 ring-black/5">
          <input 
            type="url" required value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="Tempel link postingan (IG/Tiktok/YT)..."
            className="w-full pl-6 pr-40 py-5 bg-white border-none outline-none font-bold text-gray-700"
          />
          <button 
            disabled={loading || !url}
            className="absolute right-2 top-2 bottom-2 px-8 bg-blue-100 text-blue-500 rounded-2xl font-black uppercase text-[10px] tracking-widest disabled:opacity-50 active:scale-95 transition-all"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Scrape Insight'}
          </button>
        </form>
        <button 
          onClick={() => setIsManualModalOpen(true)}
          className="px-8 bg-white border border-gray-100 rounded-3xl font-black uppercase text-[10px] tracking-widest text-gray-400 shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Entri Manual
        </button>
      </div>

      {isManualModalOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm" onClick={() => setIsManualModalOpen(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[3rem] shadow-2xl border border-gray-100 animate-slide overflow-hidden">
            <div className="p-8 bg-blue-50 text-blue-500 flex justify-between items-center">
              <h2 className="text-xl font-black uppercase tracking-widest">Input Data Manual</h2>
              <button onClick={() => setIsManualModalOpen(false)} className="p-2 hover:bg-blue-100 rounded-xl transition-all"><X /></button>
            </div>
            <form onSubmit={saveManualEntry} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-gray-300 tracking-widest">Link Postingan</label>
                <input required type="url" value={manualData.url} onChange={e => setManualData({...manualData, url: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold border border-gray-100 focus:bg-white" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-gray-300 tracking-widest">Platform</label>
                  <select value={manualData.platform} onChange={e => setManualData({...manualData, platform: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold border border-gray-100">
                    <option>Instagram</option><option>TikTok</option><option>YouTube</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-gray-300 tracking-widest">Likes</label>
                  <input type="number" value={manualData.likes} onChange={e => setManualData({...manualData, likes: parseInt(e.target.value) || 0})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold border border-gray-100" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-gray-300 tracking-widest">Comments</label>
                  <input type="number" value={manualData.comments} onChange={e => setManualData({...manualData, comments: parseInt(e.target.value) || 0})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold border border-gray-100" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-gray-300 tracking-widest">Shares</label>
                  <input type="number" value={manualData.shares} onChange={e => setManualData({...manualData, shares: parseInt(e.target.value) || 0})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold border border-gray-100" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-gray-300 tracking-widest">ER %</label>
                  <input type="number" step="0.1" value={manualData.engagementRate} onChange={e => setManualData({...manualData, engagementRate: parseFloat(e.target.value) || 0})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold border border-gray-100" />
                </div>
              </div>
              <button type="submit" className="w-full py-5 bg-blue-100 text-blue-500 font-black rounded-3xl uppercase tracking-widest text-[10px] shadow-sm active:scale-95 transition-all">Simpan Data Manual</button>
            </form>
          </div>
        </div>
      )}

      {insight && (
        <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl space-y-8 animate-slide">
           <div className="flex justify-between items-center">
              <div>
                 <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-widest border border-blue-100">{insight.platform}</span>
                 <h3 className="text-xl font-black text-gray-900 mt-2">Analysis Result</h3>
              </div>
              <a href={insight.url} target="_blank" className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-gray-900"><ExternalLink size={20}/></a>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                 { icon: ThumbsUp, label: 'Likes', val: insight.likes, color: 'text-blue-500' },
                 { icon: MessageSquare, label: 'Comments', val: insight.comments, color: 'text-emerald-500' },
                 { icon: Share2, label: 'Shares', val: insight.shares, color: 'text-purple-500' },
                 { icon: BarChart2, label: 'ER %', val: insight.engagementRate, color: 'text-amber-500' },
              ].map((m, i) => (
                 <div key={i} className="p-4 bg-gray-50 rounded-2xl text-center border border-gray-100">
                    <m.icon className={`mx-auto mb-2 ${m.color}`} size={18} />
                    <p className="text-lg font-black text-gray-900">{m.val.toLocaleString()}</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{m.label}</p>
                 </div>
              ))}
           </div>

           <p className="text-sm font-medium text-gray-500 italic leading-relaxed bg-gray-50 p-6 rounded-[2rem]">"{insight.analysis}"</p>

           <button 
              onClick={handleSaveToDatabase}
              className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
           >
              <Save size={16} /> Simpan ke Database Analitik
           </button>
        </div>
      )}
    </div>
  );
};

export default LinkTracker;
