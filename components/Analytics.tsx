
import React, { useState } from 'react';
import { PostInsight } from '../types';
import { TrendingUp, Activity, FileText, Instagram, Video, CheckCircle2, Loader2, Link2, X } from 'lucide-react';

interface AnalyticsProps {
  primaryColorHex: string;
  analyticsData: PostInsight[];
  onSaveInsight: (insight: PostInsight) => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ primaryColorHex, analyticsData, onSaveInsight }) => {
  const [isPulling, setIsPulling] = useState<'ig' | 'tiktok' | null>(null);
  const [showPullModal, setShowPullModal] = useState<'ig' | 'tiktok' | null>(null);
  const [username, setUsername] = useState('');

  const simulatePull = (platform: 'ig' | 'tiktok') => {
    if (!username) return;
    setIsPulling(platform);
    setTimeout(() => {
      const mockInsight: PostInsight = {
        id: Date.now().toString(),
        url: `https://${platform}.com/${username}/profile`,
        platform: platform === 'ig' ? 'Instagram' : 'TikTok',
        likes: Math.floor(Math.random() * 5000) + 100,
        comments: Math.floor(Math.random() * 500) + 10,
        shares: Math.floor(Math.random() * 1000) + 5,
        engagementRate: parseFloat((Math.random() * 5 + 1).toFixed(1)),
        sentiment: 'positive',
        analysis: 'Akun ini menunjukkan tren interaksi organik yang stabil pada jam tayang utama dengan retensi audiens tinggi.',
        sourceType: 'manual',
        timestamp: new Date().toISOString()
      };
      onSaveInsight(mockInsight);
      setIsPulling(null);
      setShowPullModal(null);
      setUsername('');
      alert(`Data publik @${username} berhasil ditarik secara otomatis!`);
    }, 2000);
  };

  return (
    <div className="space-y-8 animate-slide pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Analytics Center</h1>
          <p className="text-gray-400 font-medium mt-1">Monitoring performa lintas platform terpusat.</p>
        </div>
        <div className="flex gap-4">
           <button onClick={() => setShowPullModal('ig')} className="px-6 py-3 bg-rose-100 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2 active:scale-95 transition-all hover:bg-rose-200">
              <Instagram size={18}/> Connect IG
           </button>
           <button onClick={() => setShowPullModal('tiktok')} className="px-6 py-3 bg-gray-100 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2 active:scale-95 transition-all hover:bg-gray-200">
              <Video size={18}/> Connect TikTok
           </button>
        </div>
      </div>

      {showPullModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-200/20 backdrop-blur-sm" onClick={() => setShowPullModal(null)}></div>
           <div className="relative bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.05)] border border-gray-100 animate-slide">
              <div className="text-center space-y-4">
                 <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center mx-auto text-white ${showPullModal === 'ig' ? 'bg-rose-100 text-rose-400' : 'bg-gray-100 text-gray-400'}`}>
                    {showPullModal === 'ig' ? <Instagram size={32}/> : <Video size={32}/>}
                 </div>
                 <h2 className="text-2xl font-black text-gray-900">Pull Profile Data</h2>
                 <p className="text-[11px] text-gray-400 font-medium leading-relaxed">Masukkan username untuk menarik wawasan publik.</p>
              </div>
              <div className="mt-8 space-y-4">
                 <input 
                   autoFocus
                   value={username} 
                   onChange={e => setUsername(e.target.value)}
                   className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none font-bold text-center text-gray-900 focus:border-blue-200 transition-all" 
                   placeholder="@username" 
                 />
                 <button 
                   onClick={() => simulatePull(showPullModal)}
                   disabled={isPulling !== null || !username}
                   className="w-full py-4 bg-blue-100 text-blue-500 font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-sm active:scale-95 transition-all disabled:opacity-50 hover:bg-blue-200"
                 >
                    {isPulling ? <Loader2 size={18} className="animate-spin mx-auto"/> : 'Tarik Data'}
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Scrapped', val: analyticsData.length, color: 'text-blue-400', icon: Link2 },
          { label: 'Plan Sync', val: analyticsData.filter(d => d.sourceType === 'plan').length, color: 'text-indigo-400', icon: CheckCircle2 },
          { label: 'Manual Pull', val: analyticsData.filter(d => d.sourceType === 'manual').length, color: 'text-amber-400', icon: TrendingUp },
          { label: 'Avg Engagement', val: analyticsData.length ? (analyticsData.reduce((a,b)=>a+b.engagementRate,0)/analyticsData.length).toFixed(1) + '%' : '0%', color: 'text-emerald-400', icon: Activity }
        ].map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center text-center transition-all hover:shadow-md">
             <div className={`p-4 rounded-2xl bg-gray-50 ${s.color} mb-4`}><s.icon size={24}/></div>
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">{s.label}</p>
             <p className="text-3xl font-black text-gray-900">{s.val}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden ring-4 ring-black/5">
         <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Insight History</h3>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-gray-100"><FileText size={16}/> Report</button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-gray-50/50">
                  <tr>
                     <th className="px-10 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest">Platform</th>
                     <th className="px-10 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest">Metrics</th>
                     <th className="px-10 py-5 text-[10px] font-black text-gray-300 uppercase tracking-widest text-right">Source</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {analyticsData.map(d => (
                     <tr key={d.id} className="hover:bg-gray-50 transition-all">
                        <td className="px-10 py-6">
                           <div className="flex flex-col">
                              <span className="text-xs font-black text-gray-900 uppercase mb-1">{d.platform}</span>
                              <span className="text-[10px] text-gray-300 truncate max-w-[200px] font-medium">{d.url}</span>
                           </div>
                        </td>
                        <td className="px-10 py-6">
                           <div className="flex gap-4 text-[11px] font-black">
                              <span className="text-blue-400">L: {d.likes.toLocaleString()}</span>
                              <span className="text-emerald-400">C: {d.comments.toLocaleString()}</span>
                              <span className="text-amber-400 font-bold bg-amber-50 px-2 py-0.5 rounded">ER: {d.engagementRate}%</span>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-right">
                           <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${d.sourceType === 'plan' ? 'bg-blue-50 text-blue-400' : 'bg-rose-50 text-rose-400'}`}>
                              {d.sourceType}
                           </span>
                        </td>
                     </tr>
                  ))}
                  {analyticsData.length === 0 && (
                     <tr><td colSpan={3} className="py-20 text-center text-gray-200 font-black uppercase text-xs tracking-[0.2em] italic">Database kosong.</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default Analytics;
