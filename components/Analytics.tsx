
import React, { useState } from 'react';
import { PostInsight } from '../types';
import { TrendingUp, Activity, Instagram, Video, CheckCircle2, Loader2, Link2, Calendar, Database, Search, Sparkles, Filter, Check } from 'lucide-react';
import { scrapeMonthlyContent } from '../services/geminiService';

interface AnalyticsProps {
  primaryColorHex: string;
  analyticsData: PostInsight[];
  onSaveInsight: (insight: PostInsight | PostInsight[]) => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ primaryColorHex, analyticsData, onSaveInsight }) => {
  const [showConnectModal, setShowConnectModal] = useState<'ig' | 'tiktok' | null>(null);
  const [isSyncingAccount, setIsSyncingAccount] = useState(false);
  const [username, setUsername] = useState('');
  const [syncMonth, setSyncMonth] = useState('Oktober 2023');
  const [isConnected, setIsConnected] = useState<{[key: string]: boolean}>({ ig: false, tiktok: false });

  const handleConnect = (platform: 'ig' | 'tiktok') => {
    if (!username) return;
    setIsSyncingAccount(true);
    setTimeout(() => {
      setIsConnected(prev => ({ ...prev, [platform]: true }));
      setIsSyncingAccount(false);
      setShowConnectModal(null);
      alert(`Berhasil menghubungkan akun @${username}! Menunggu sinkronisasi data pertama...`);
    }, 2000);
  };

  const handleSyncMonth = async () => {
    if (!username) {
        alert("Hubungkan akun Anda terlebih dahulu melalui tombol Connect.");
        return;
    }
    setIsSyncingAccount(true);
    try {
      const platform = isConnected.ig ? 'Instagram' : 'TikTok';
      const data = await scrapeMonthlyContent(username, platform, syncMonth);
      onSaveInsight(data.map(d => ({ ...d, sourceType: 'cloud_pull' })));
      alert(`Sinkronisasi Selesai! ${data.length} postingan dari bulan ${syncMonth} berhasil ditarik ke database.`);
    } catch (e) {
      alert("Gagal menarik data bulanan.");
    } finally {
      setIsSyncingAccount(false);
    }
  };

  return (
    <div className="space-y-8 animate-slide pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <p className="text-gray-400 font-medium mb-1">Deep Monitoring & Scrapping Center</p>
          <div className="flex items-center gap-4">
             <div className="bg-white border border-gray-100 p-2.5 rounded-2xl flex items-center gap-2 shadow-sm">
                <Calendar size={16} className="text-blue-500" />
                <select value={syncMonth} onChange={e => setSyncMonth(e.target.value)} className="bg-transparent outline-none text-[10px] font-black uppercase tracking-widest text-gray-700">
                    <option>September 2023</option>
                    <option>Oktober 2023</option>
                    <option>November 2023</option>
                </select>
             </div>
             <button onClick={handleSyncMonth} disabled={isSyncingAccount} className="px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:bg-gray-800 transition-all active:scale-95">
                {isSyncingAccount ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Sync Full Month
             </button>
          </div>
        </div>
        
        <div className="flex gap-4">
           <button onClick={() => setShowConnectModal('ig')} className={`px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-3 transition-all ${isConnected.ig ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 'bg-rose-500 text-white'}`}>
              {isConnected.ig ? <Check size={18}/> : <Instagram size={18}/>}
              {isConnected.ig ? 'IG Connected' : 'Login Instagram'}
           </button>
           <button onClick={() => setShowConnectModal('tiktok')} className={`px-8 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-3 transition-all ${isConnected.tiktok ? 'bg-emerald-50 text-emerald-500 border border-emerald-100' : 'bg-gray-900 text-white'}`}>
              {isConnected.tiktok ? <Check size={18}/> : <Video size={18}/>}
              {isConnected.tiktok ? 'TikTok Connected' : 'Login TikTok'}
           </button>
        </div>
      </div>

      {showConnectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-xl" onClick={() => setShowConnectModal(null)}></div>
           <div className="relative bg-white w-full max-w-sm rounded-[3.5rem] p-12 shadow-2xl border border-gray-100 animate-slide">
              <div className="text-center space-y-4">
                 <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto text-white shadow-xl ${showConnectModal === 'ig' ? 'bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600' : 'bg-black'}`}>
                    {showConnectModal === 'ig' ? <Instagram size={36}/> : <Video size={36}/>}
                 </div>
                 <h2 className="text-2xl font-black text-gray-900 tracking-tight">Connect Account</h2>
                 <p className="text-[11px] text-gray-400 font-medium leading-relaxed uppercase tracking-widest">Snaillabs API Integration</p>
              </div>
              <div className="mt-10 space-y-4">
                 <input autoFocus value={username} onChange={e => setUsername(e.target.value)} className="w-full px-8 py-5 bg-gray-50 rounded-2xl border border-gray-100 outline-none font-bold text-center text-gray-900 focus:ring-4 focus:ring-blue-50 transition-all" placeholder="@username" />
                 <button onClick={() => handleConnect(showConnectModal)} disabled={isSyncingAccount || !username} className="w-full py-5 bg-blue-500 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                    {isSyncingAccount ? <Loader2 size={18} className="animate-spin mx-auto"/> : 'Otorisasi & Sinkronkan'}
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Database Content', val: analyticsData.length, color: 'text-blue-500', icon: Database },
          { label: 'Sync Success', val: analyticsData.filter(d => d.sourceType === 'cloud_pull').length, color: 'text-emerald-500', icon: CheckCircle2 },
          { label: 'Month Engagement', val: analyticsData.length ? (analyticsData.reduce((a,b)=>a+b.engagementRate,0)/analyticsData.length).toFixed(1) + '%' : '0%', color: 'text-amber-500', icon: Activity },
          { label: 'Live Accounts', val: (isConnected.ig ? 1 : 0) + (isConnected.tiktok ? 1 : 0), color: 'text-rose-500', icon: TrendingUp }
        ].map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center text-center transition-all hover:translate-y-[-5px]">
             <div className={`p-4 rounded-2xl bg-gray-50 ${s.color} mb-4`}><s.icon size={26}/></div>
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">{s.label}</p>
             <p className="text-3xl font-black text-gray-900">{s.val}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden ring-1 ring-black/5">
         <div className="p-10 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Content Database History</h3>
            <div className="flex gap-3">
               <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors"><Filter size={18}/></button>
               <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-colors"><Search size={18}/></button>
            </div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-gray-50/50">
                  <tr>
                     <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Detail Postingan</th>
                     <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Key Metrics</th>
                     <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Waktu Post</th>
                     <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest text-right">Method</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {analyticsData.map(d => (
                     <tr key={d.id || d.url} className="hover:bg-gray-50/50 transition-all group">
                        <td className="px-10 py-8">
                           <div className="flex flex-col">
                              <span className={`text-[10px] font-black uppercase mb-1.5 ${d.platform === 'Instagram' ? 'text-rose-500' : 'text-gray-900'}`}>{d.platform}</span>
                              <span className="text-xs text-gray-400 truncate max-w-[280px] font-bold group-hover:text-blue-500 transition-colors">{d.url}</span>
                           </div>
                        </td>
                        <td className="px-10 py-8">
                           <div className="flex gap-5 text-[12px] font-black">
                              <div className="flex flex-col">
                                 <span className="text-blue-500">{d.likes.toLocaleString()}</span>
                                 <span className="text-[8px] text-gray-300 uppercase">Likes</span>
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-emerald-500">{d.comments.toLocaleString()}</span>
                                 <span className="text-[8px] text-gray-300 uppercase">Comm</span>
                              </div>
                              <div className="bg-amber-50 px-3 py-1 rounded-xl">
                                 <span className="text-amber-500">ER: {d.engagementRate}%</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-10 py-8">
                           <span className="text-xs font-bold text-gray-400">{d.postDate || 'N/A'}</span>
                        </td>
                        <td className="px-10 py-8 text-right">
                           <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                              d.sourceType === 'cloud_pull' ? 'bg-blue-50 text-blue-500 border-blue-100' : 
                              d.sourceType === 'plan' ? 'bg-indigo-50 text-indigo-500 border-indigo-100' : 'bg-gray-100 text-gray-400'
                           }`}>
                              {d.sourceType?.replace('_', ' ')}
                           </span>
                        </td>
                     </tr>
                  ))}
                  {analyticsData.length === 0 && (
                     <tr><td colSpan={4} className="py-32 text-center text-gray-200 font-black uppercase text-sm tracking-[0.3em] italic">Database Cloud Kosong. Mulai sinkronisasi bulan ini.</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default Analytics;
