
import React, { useState } from 'react';
import { PostInsight, AccountAnalytics } from '../types';
import { TrendingUp, Activity, Instagram, Video, CheckCircle2, Loader2, Link2, Calendar, Database, Search, Sparkles, Filter, Check, Users, ThumbsUp, MessageCircle, Eye, ArrowUpRight, ArrowDownRight, BarChart2 } from 'lucide-react';
import { scrapeMonthlyContent } from '../services/geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

interface AnalyticsProps {
  primaryColorHex: string;
  analyticsData: PostInsight[];
  onSaveInsight: (insight: PostInsight | PostInsight[]) => void;
}

// Mock Data for Dashboard (In real app, this comes from API)
const MOCK_DASHBOARD_DATA: AccountAnalytics = {
  username: 'arunika_pulse',
  platform: 'Instagram',
  followerCount: 15420,
  avgEngagementRate: 4.8,
  totalComments: 342,
  totalLikes: 4200,
  growthData: [
    { date: '1 Oct', followers: 15000 },
    { date: '5 Oct', followers: 15120 },
    { date: '10 Oct', followers: 15250 },
    { date: '15 Oct', followers: 15300 },
    { date: '20 Oct', followers: 15420 },
  ],
  posts: [
    { id: 'p-1', thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop', caption: 'New feature launch!', type: 'reel', date: '2023-10-20', metrics: { likes: 1200, comments: 45, shares: 120, saves: 300 }, engagementRate: 5.2 },
    { id: 'p-2', thumbnail: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=100&h=100&fit=crop', caption: 'Behind the scenes', type: 'image', date: '2023-10-18', metrics: { likes: 800, comments: 20, shares: 10, saves: 40 }, engagementRate: 3.1 },
    { id: 'p-3', thumbnail: 'https://images.unsplash.com/photo-1611162618071-eead1eaacd95?w=100&h=100&fit=crop', caption: 'Tips & Tricks', type: 'video', date: '2023-10-15', metrics: { likes: 2500, comments: 120, shares: 500, saves: 800 }, engagementRate: 8.5 },
  ]
};

const StatCard: React.FC<{ label: string; value: string; trend?: string; icon: any; color: string }> = ({ label, value, trend, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{label}</p>
        <h3 className="text-2xl font-black text-gray-900 mt-2">{value}</h3>
      </div>
      <div className={`p-3 rounded-2xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center text-xs font-bold">
        <span className={`${trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-500'} flex items-center`}>
          {trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {trend}
        </span>
        <span className="text-gray-400 ml-2">vs last month</span>
      </div>
    )}
  </div>
);

const AccountDashboard: React.FC<{ data: AccountAnalytics }> = ({ data }) => {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className="space-y-8 animate-slide">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Followers" value={formatNumber(data.followerCount)} trend="+5.2%" icon={Users} color="bg-blue-500" />
        <StatCard label="Avg Engagement Rate" value={`${data.avgEngagementRate}%`} trend="+0.8%" icon={ThumbsUp} color="bg-pink-500" />
        <StatCard label="Total Comments" value={formatNumber(data.totalComments)} trend="-2.1%" icon={MessageCircle} color="bg-purple-500" />
        <StatCard label="Estimated Reach" value={formatNumber(data.totalLikes * 3.5)} trend="+12.5%" icon={Eye} color="bg-teal-500" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Growth Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-black text-gray-900 mb-6 tracking-tight">Growth & Engagement Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.growthData}>
                <defs>
                  <linearGradient id="colorFollowers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }} />
                <Area type="monotone" dataKey="followers" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorFollowers)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Distribution */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-black text-gray-900 mb-6 tracking-tight">Engagement Mix</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.posts.slice(0, 5).map(p => ({
                name: `Post ${p.id.split('-')[1]}`,
                Likes: p.metrics.likes,
                Comments: p.metrics.comments
              }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" hide />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border:'none'}} />
                <Legend iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                <Bar dataKey="Likes" fill="#ec4899" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Comments" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Posts Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50">
          <h3 className="text-lg font-black text-gray-900 tracking-tight">Top Performing Content</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-bold">
              <tr>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-gray-400">Content</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-gray-400">Type</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-gray-400">Date</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-gray-400 text-right">Likes</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-gray-400 text-right">Comments</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-widest text-gray-400 text-right">ER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <img src={post.thumbnail} alt="Post" className="w-12 h-12 rounded-xl object-cover" />
                      <p className="truncate w-48 text-gray-900 font-bold">{post.caption}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 capitalize">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      post.type === 'video' || post.type === 'reel' ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {post.type}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-medium">{new Date(post.date).toLocaleDateString()}</td>
                  <td className="px-8 py-6 text-right font-bold">{formatNumber(post.metrics.likes)}</td>
                  <td className="px-8 py-6 text-right font-bold">{formatNumber(post.metrics.comments)}</td>
                  <td className="px-8 py-6 text-right font-black text-indigo-600">{post.engagementRate.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Analytics: React.FC<AnalyticsProps> = ({ primaryColorHex, analyticsData, onSaveInsight }) => {
  const [showConnectModal, setShowConnectModal] = useState<'ig' | 'tiktok' | null>(null);
  const [isSyncingAccount, setIsSyncingAccount] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [syncMonth, setSyncMonth] = useState('Oktober 2023');
  const [isConnected, setIsConnected] = useState<{[key: string]: boolean}>({ ig: false, tiktok: false });
  const [dashboardData, setDashboardData] = useState<AccountAnalytics | null>(null);

  const handleConnect = (platform: 'ig' | 'tiktok') => {
    if (!username || !password) {
        alert("Harap masukkan username dan password untuk akurasi data.");
        return;
    }
    setIsSyncingAccount(true);
    // Simulating API Call
    setTimeout(() => {
      setIsConnected(prev => ({ ...prev, [platform]: true }));
      setDashboardData({
          ...MOCK_DASHBOARD_DATA, 
          platform: platform === 'ig' ? 'Instagram' : 'TikTok',
          username: username
      });
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
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Analitik Konten</h1>
          <p className="text-gray-400 font-medium mb-1">Deep Monitoring & Scrapping Center</p>
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
                 <p className="text-[11px] text-gray-400 font-medium leading-relaxed uppercase tracking-widest">Arunika API Integration</p>
              </div>
              <div className="mt-10 space-y-4">
                 <input autoFocus value={username} onChange={e => setUsername(e.target.value)} className="w-full px-8 py-5 bg-gray-50 rounded-2xl border border-gray-100 outline-none font-bold text-center text-gray-900 focus:ring-4 focus:ring-blue-50 transition-all" placeholder="@username" />
                 <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-8 py-5 bg-gray-50 rounded-2xl border border-gray-100 outline-none font-bold text-center text-gray-900 focus:ring-4 focus:ring-blue-50 transition-all" placeholder="Password (Secure)" />
                 <button onClick={() => handleConnect(showConnectModal)} disabled={isSyncingAccount || !username} className="w-full py-5 bg-blue-500 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                    {isSyncingAccount ? <Loader2 size={18} className="animate-spin mx-auto"/> : 'Otorisasi & Sinkronkan'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* DASHBOARD SECTION - Shows when account is connected */}
      {dashboardData ? (
          <div className="animate-slide">
              <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800">Dashboard Overview</h2>
                    <p className="text-slate-400 text-sm">Analysis for @{dashboardData.username} on {dashboardData.platform}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wide">Live Data</span>
              </div>
              <AccountDashboard data={dashboardData} />
          </div>
      ) : (
          <div className="bg-white p-12 rounded-[3rem] border border-gray-100 text-center shadow-sm">
             <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <BarChart2 size={32} className="text-gray-300" />
             </div>
             <h3 className="text-xl font-black text-gray-900">No Account Connected</h3>
             <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">Connect your Instagram or TikTok account to view real-time account analytics and growth trends.</p>
          </div>
      )}

      {/* Manual Content Scrape / Database History */}
      <div className="pt-10 border-t border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Content Database History</h3>
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
          
          <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden ring-1 ring-black/5">
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
                         <tr><td colSpan={4} className="py-32 text-center text-gray-200 font-black uppercase text-sm tracking-[0.3em] italic">Database Cloud Kosong.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
      </div>
    </div>
  );
};

export default Analytics;
