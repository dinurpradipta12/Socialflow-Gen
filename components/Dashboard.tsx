
import React from 'react';
import { TrendingUp, Users, MessageCircle, Share2, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight, Globe } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { THEME_COLORS } from '../constants';
import { ThemeColor } from '../types';

const data = [
  { name: 'Mon', engagement: 4000, reach: 2400 },
  { name: 'Tue', engagement: 3000, reach: 1398 },
  { name: 'Wed', engagement: 2000, reach: 9800 },
  { name: 'Thu', engagement: 2780, reach: 3908 },
  { name: 'Fri', engagement: 1890, reach: 4800 },
  { name: 'Sat', engagement: 2390, reach: 3800 },
  { name: 'Sun', engagement: 3490, reach: 4300 },
];

const StatCard = ({ title, value, change, icon: Icon, colorSet }: any) => (
  <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl hover:translate-y-[-5px] transition-all">
    <div className="flex justify-between items-start mb-6">
      <div className={`p-4 rounded-2xl ${colorSet.light} ${colorSet.text}`}>
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-black px-3 py-1.5 rounded-full ${change >= 0 ? 'bg-emerald-50 text-emerald-400' : 'bg-rose-50 text-rose-400'}`}>
        {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {Math.abs(change)}%
      </div>
    </div>
    <h3 className="text-gray-300 text-[10px] font-black uppercase tracking-widest">{title}</h3>
    <p className="text-3xl font-black text-gray-900 mt-1">{value}</p>
  </div>
);

const Dashboard: React.FC<{ primaryColor: ThemeColor }> = ({ primaryColor }) => {
  const colorSet = THEME_COLORS[primaryColor] || THEME_COLORS.blue;

  return (
    <div className="space-y-8 animate-slide pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Cloud Insights</h1>
          <p className="text-gray-400 font-medium text-sm mt-1 flex items-center gap-2">
             <Globe size={14} className="text-emerald-500" /> Summary performance across all active nodes.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:px-6 py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm active:scale-95 transition-all">Export Data</button>
          <button className="flex-1 md:px-6 py-4 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Quick Post</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Engagement" value="42.5K" change={12} icon={MessageCircle} colorSet={colorSet} />
        <StatCard title="Total Reach" value="1.2M" change={5.4} icon={TrendingUp} colorSet={colorSet} />
        <StatCard title="New Followers" value="+2.4K" change={-2.1} icon={Users} colorSet={colorSet} />
        <StatCard title="Cloud Shared" value="128" change={18.2} icon={Share2} colorSet={colorSet} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-[3rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black text-gray-900 tracking-tight">Active Reach Growth</h3>
            <div className="flex gap-2">
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div><span className="text-[9px] font-black text-gray-300 uppercase">Engagement</span></div>
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-gray-100"></div><span className="text-[9px] font-black text-gray-300 uppercase">Reach</span></div>
            </div>
          </div>
          <div className="h-72 md:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#cbd5e1', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#cbd5e1', fontSize: 10}} />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.01)'}} contentStyle={{ borderRadius: '25px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }} />
                <Bar dataKey="engagement" fill="#BFDBFE" radius={[8, 8, 0, 0]} barSize={32} />
                <Bar dataKey="reach" fill="#F1F5F9" radius={[8, 8, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-xl font-black text-gray-900 mb-8 tracking-tight">Cloud Queue</h3>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-5 rounded-3xl border border-gray-50 hover:bg-gray-50 hover:translate-x-2 transition-all cursor-pointer group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${colorSet.bg} ${colorSet.text}`}>
                  <CalendarIcon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-gray-900 text-[12px] uppercase truncate tracking-tight">Node Sync Task #{i}</h4>
                  <p className="text-[10px] text-gray-300 font-bold uppercase mt-1">Diproses oleh AI</p>
                </div>
                <ArrowUpRight size={18} className="text-gray-200 group-hover:text-blue-500 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
