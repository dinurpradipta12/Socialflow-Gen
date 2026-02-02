
import React from 'react';
import { TrendingUp, Users, MessageCircle, Share2, Calendar as CalendarIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
  <div className="bg-white p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-gray-100">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${colorSet.light} ${colorSet.text}`}>
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 text-[9px] md:text-[10px] font-black px-3 py-1 rounded-full ${change >= 0 ? 'bg-emerald-50 text-emerald-400' : 'bg-rose-50 text-rose-400'}`}>
        {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
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
    <div className="space-y-6 md:space-y-8 animate-slide">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Overview</h1>
          <p className="text-gray-400 font-medium mt-1 text-sm">Summary of performance across your nodes.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none px-6 py-3 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm">Export</button>
          <button className="flex-1 sm:flex-none px-6 py-3 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">New Post</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard title="Engagement" value="42.5K" change={12} icon={MessageCircle} colorSet={colorSet} />
        <StatCard title="Reach" value="1.2M" change={5.4} icon={TrendingUp} colorSet={colorSet} />
        <StatCard title="Growth" value="+2.4K" change={-2.1} icon={Users} colorSet={colorSet} />
        <StatCard title="Shared" value="128" change={18.2} icon={Share2} colorSet={colorSet} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-gray-100">
          <h3 className="text-lg md:text-xl font-black text-gray-900 mb-6 md:mb-8">Cloud Analytics</h3>
          <div className="h-64 md:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#cbd5e1', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#cbd5e1', fontSize: 10}} />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.01)'}} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }} />
                <Bar dataKey="engagement" fill="#BFDBFE" radius={[6, 6, 0, 0]} />
                <Bar dataKey="reach" fill="#F1F5F9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-gray-100">
          <h3 className="text-lg md:text-xl font-black text-gray-900 mb-6 md:mb-8">Pending Items</h3>
          <div className="space-y-4 overflow-y-auto max-h-[300px] custom-scrollbar">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                  <CalendarIcon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-gray-900 text-[11px] uppercase truncate">Upcoming Reel #{i}</h4>
                  <p className="text-[9px] text-gray-300 font-bold">Oct 28 • 10:00 AM</p>
                </div>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-400 text-[8px] font-black uppercase rounded tracking-tighter">Wait</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
