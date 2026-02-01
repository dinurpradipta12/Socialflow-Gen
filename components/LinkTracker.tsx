
import React, { useState } from 'react';
import { Search, Loader2, Link2, ExternalLink, ThumbsUp, MessageSquare, Share2, BarChart2, Save } from 'lucide-react';
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

  return (
    <div className="space-y-8 max-w-3xl mx-auto py-10 animate-slide">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">AI Link Tracker</h1>
        <p className="text-gray-400 font-medium">Scrape data performa postingan secara instan & simpan terpisah dari rencana konten.</p>
      </div>

      <form onSubmit={handleScrape} className="relative shadow-2xl rounded-3xl overflow-hidden ring-4 ring-black/5">
        <input 
          type="url" required value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="Tempel link postingan (IG/Tiktok/YT)..."
          className="w-full pl-6 pr-40 py-5 bg-white dark:bg-slate-900 border-none outline-none font-bold text-gray-700 dark:text-white"
        />
        <button 
          disabled={loading || !url}
          className="absolute right-2 top-2 bottom-2 px-8 bg-[var(--primary-color)] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest disabled:opacity-50 active:scale-95 transition-all"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Scrape Insight'}
        </button>
      </form>

      {insight && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-xl space-y-8 animate-slide">
           <div className="flex justify-between items-center">
              <div>
                 <span className="px-3 py-1 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-[10px] font-black rounded-lg uppercase tracking-widest border border-blue-100 dark:border-slate-700">{insight.platform}</span>
                 <h3 className="text-xl font-black text-gray-900 dark:text-white mt-2">Analysis Result</h3>
              </div>
              <a href={insight.url} target="_blank" className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl text-gray-400 hover:text-gray-900"><ExternalLink size={20}/></a>
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                 { icon: ThumbsUp, label: 'Likes', val: insight.likes, color: 'text-blue-500' },
                 { icon: MessageSquare, label: 'Comments', val: insight.comments, color: 'text-emerald-500' },
                 { icon: Share2, label: 'Shares', val: insight.shares, color: 'text-purple-500' },
                 { icon: BarChart2, label: 'ER %', val: insight.engagementRate, color: 'text-amber-500' },
              ].map((m, i) => (
                 <div key={i} className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl text-center border border-gray-100 dark:border-slate-800">
                    <m.icon className={`mx-auto mb-2 ${m.color}`} size={18} />
                    <p className="text-lg font-black dark:text-white">{m.val.toLocaleString()}</p>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{m.label}</p>
                 </div>
              ))}
           </div>

           <p className="text-sm font-medium text-gray-500 italic leading-relaxed bg-gray-50 dark:bg-slate-800/30 p-6 rounded-[2rem]">"{insight.analysis}"</p>

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
