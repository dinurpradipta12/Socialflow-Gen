
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
  <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] shadow-sm border border-gray-100 dark:border-slate-800">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl ${colorSet.light} dark:bg-slate-800 ${colorSet.text}`}>
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full ${change >= 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20'}`}>
        {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {Math.abs(change)}%
      </div>
    </div>
    <h3 className="text-gray-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">{title}</h3>
    <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{value}</p>
  </div>
);

const Dashboard: React.FC<{ primaryColor: ThemeColor }> = ({ primaryColor }) => {
  const colorSet = THEME_COLORS[primaryColor] || THEME_COLORS.blue;

  return (
    <div className="space-y-8 animate-slide">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Overview</h1>
          <p className="text-gray-400 dark:text-slate-500 font-medium mt-1">Summary of performance across your workspaces.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest dark:text-white shadow-sm hover:bg-gray-50">Export</button>
          <button className={`px-6 py-3 ${colorSet.bg} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all`}>Schedule New</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Engagement" value="42.5K" change={12} icon={MessageCircle} colorSet={colorSet} />
        <StatCard title="Reach" value="1.2M" change={5.4} icon={TrendingUp} colorSet={colorSet} />
        <StatCard title="Growth" value="+2.4K" change={-2.1} icon={Users} colorSet={colorSet} />
        <StatCard title="Shared" value="128" change={18.2} icon={Share2} colorSet={colorSet} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm border border-gray-100 dark:border-slate-800">
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8">Performance Chart</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="engagement" fill={colorSet.text.replace('text-', '#').replace('600', '400')} radius={[6, 6, 0, 0]} />
                <Bar dataKey="reach" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm border border-gray-100 dark:border-slate-800">
          <h3 className="text-xl font-black text-gray-900 dark:text-white mb-8">Upcoming Content</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-3xl border border-gray-50 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer">
                <div className={`w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center ${colorSet.text}`}>
                  <CalendarIcon size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-gray-900 dark:text-white text-xs uppercase tracking-tight">Campaign Reveal #{i}</h4>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold mt-0.5">Oct 28, 2023 • 10:00 AM</p>
                </div>
                <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-600 text-[8px] font-black uppercase tracking-widest rounded-lg">Wait</span>
              </div>
            ))}
          </div>
          <button className={`w-full mt-6 py-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-all`}>View Full Calendar</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
