
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
  <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl hover:translate-y-[-5px] transition-all">
    <div className="flex justify-between items-start mb-6">
      <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${colorSet.light} ${colorSet.text}`}>
        <Icon size={20} className="md:w-6 md:h-6" />
      </div>
      <div className={`flex items-center gap-1 text-[9px] md:text-[10px] font-black px-2 md:px-3 py-1 md:py-1.5 rounded-full ${change >= 0 ? 'bg-emerald-50 text-emerald-400' : 'bg-rose-50 text-rose-400'}`}>
        {change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {Math.abs(change)}%
      </div>
    </div>
    <h3 className="text-gray-300 text-[9px] md:text-[10px] font-black uppercase tracking-widest">{title}</h3>
    <p className="text-2xl md:text-3xl font-black text-gray-900 mt-1">{value}</p>
  </div>
);

const Dashboard: React.FC<{ primaryColor: ThemeColor }> = ({ primaryColor }) => {
  const colorSet = THEME_COLORS[primaryColor] || THEME_COLORS.blue;

  return (
    <div className="space-y-6 md:space-y-8 animate-slide pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Cloud Insights</h1>
          <p className="text-gray-400 font-medium text-xs md:text-sm mt-1 flex items-center gap-2">
             <Globe size={14} className="text-emerald-500" /> Summary performance nodes.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:px-6 py-3.5 bg-white border border-gray-100 rounded-xl md:rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-900 shadow-sm transition-all">Export</button>
          <button className="flex-1 md:px-6 py-3.5 bg-blue-500 text-white rounded-xl md:rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/10 transition-all">Quick Post</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Engagement" value="42.5K" change={12} icon={MessageCircle} colorSet={colorSet} />
        <StatCard title="Reach" value="1.2M" change={5.4} icon={TrendingUp} colorSet={colorSet} />
        <StatCard title="Followers" value="+2.4K" change={-2.1} icon={Users} colorSet={colorSet} />
        <StatCard title="Shared" value="128" change={18.2} icon={Share2} colorSet={colorSet} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8 md:mb-10">
            <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Growth Trend</h3>
            <div className="hidden sm:flex gap-2">
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-400"></div><span className="text-[8px] font-black text-gray-300 uppercase">Engagement</span></div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-100"></div><span className="text-[8px] font-black text-gray-300 uppercase">Reach</span></div>
            </div>
          </div>
          <div className="h-60 md:h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#cbd5e1', fontSize: 9}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#cbd5e1', fontSize: 9}} />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.01)'}} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }} />
                <Bar dataKey="engagement" fill="#BFDBFE" radius={[6, 6, 0, 0]} barSize={24} />
                <Bar dataKey="reach" fill="#F1F5F9" radius={[6, 6, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg md:text-xl font-black text-gray-900 mb-6 md:mb-8 tracking-tight">Queue</h3>
          <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] md:max-h-[400px] custom-scrollbar pr-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-all cursor-pointer group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${colorSet.bg} ${colorSet.text}`}>
                  <CalendarIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-gray-900 text-[10px] md:text-[11px] uppercase truncate tracking-tight">Task #{i}</h4>
                  <p className="text-[8px] text-gray-300 font-bold uppercase mt-0.5">Cloud Processing</p>
                </div>
                <ArrowUpRight size={16} className="text-gray-200 group-hover:text-blue-500 transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
