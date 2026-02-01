
import React from 'react';
import { 
  Target, 
  DollarSign, 
  MousePointer2, 
  TrendingUp,
  Plus,
  ArrowUpRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { THEME_COLORS } from '../constants';
import { ThemeColor } from '../types';

const adsData = [
  { name: 'Campaign A', spend: 1200, conversions: 45 },
  { name: 'Campaign B', spend: 3000, conversions: 120 },
  { name: 'Campaign C', spend: 800, conversions: 32 },
  { name: 'Campaign D', spend: 2100, conversions: 88 },
];

const AdsWorkspace: React.FC<{ primaryColor: ThemeColor }> = ({ primaryColor }) => {
  const colorSet = THEME_COLORS[primaryColor];

  return (
    <div className="space-y-8 animate-slide">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Ads Workspace</h1>
          <p className="text-gray-500">Monitor budget, conversion, and ROAS for your paid campaigns.</p>
        </div>
        <button className={`flex items-center gap-2 px-6 py-3 ${colorSet.bg} text-white rounded-2xl font-bold ${colorSet.hover} transition-all shadow-xl shadow-blue-100`}>
          <Plus size={20} />
          <span>Launch Campaign</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Spend</p>
            <p className="text-xl font-black text-gray-900">$7,100</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
            <Target size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Conversions</p>
            <p className="text-xl font-black text-gray-900">285</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg ROAS</p>
            <p className="text-xl font-black text-gray-900">4.2x</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
          <MousePointer2 size={18} className={colorSet.text}/>
          Campaign Spending vs Performance
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={adsData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
              <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '16px', border: 'none'}} />
              <Bar dataKey="spend" fill={colorSet.text.replace('text-', '#').replace('600', '400')} radius={[8, 8, 0, 0]} />
              <Bar dataKey="conversions" fill="#e5e7eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdsWorkspace;
