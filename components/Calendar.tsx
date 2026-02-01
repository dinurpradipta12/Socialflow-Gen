
import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Instagram, Youtube, Twitter } from 'lucide-react';
import { MOCK_CONTENT, THEME_COLORS } from '../constants';
import { ThemeColor } from '../types';

const Calendar: React.FC<{ primaryColor: ThemeColor }> = ({ primaryColor }) => {
  const colorSet = THEME_COLORS[primaryColor];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Generating a simplified calendar view for the demo
  const grid = Array.from({ length: 35 }, (_, i) => i + 1);

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram': return <Instagram size={14} />;
      case 'youtube': return <Youtube size={14} />;
      case 'twitter': return <Twitter size={14} />;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-180px)]">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h2 className="text-2xl font-bold text-gray-900">October 2023</h2>
          <div className="flex gap-1">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft size={20}/></button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight size={20}/></button>
          </div>
        </div>
        <button className={`flex items-center gap-2 px-5 py-2.5 ${colorSet.bg} text-white rounded-xl font-medium ${colorSet.hover} transition-all shadow-md`}>
          <Plus size={18} />
          <span>New Plan</span>
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-100">
        {days.map(day => (
          <div key={day} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
            {day}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-7 h-full">
          {grid.map(day => {
            const dateStr = `2023-10-${day.toString().padStart(2, '0')}`;
            const items = MOCK_CONTENT.filter(c => c.scheduledDate === dateStr);
            const isToday = day === 25;

            return (
              <div key={day} className={`min-h-[140px] p-2 border-r border-b border-gray-50 hover:bg-gray-50 transition-colors group relative cursor-pointer`}>
                <span className={`text-sm font-semibold inline-flex w-7 h-7 items-center justify-center rounded-full transition-colors ${
                  isToday ? `${colorSet.bg} text-white` : 'text-gray-400 group-hover:text-gray-900'
                }`}>
                  {day > 31 ? day - 31 : day}
                </span>
                
                <div className="mt-2 space-y-1">
                  {items.map(item => (
                    <div key={item.id} className={`p-2 rounded-lg text-[10px] font-medium border flex flex-col gap-1 transition-all hover:scale-105 hover:shadow-md ${
                      item.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      item.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      'bg-gray-50 text-gray-600 border-gray-100'
                    }`}>
                      <div className="flex items-center gap-1 opacity-70">
                        {getPlatformIcon(item.platform)}
                        <span className="capitalize">{item.platform}</span>
                      </div>
                      <span className="truncate font-bold uppercase">{item.title}</span>
                    </div>
                  ))}
                </div>

                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className={`w-6 h-6 rounded-full ${colorSet.bg} text-white flex items-center justify-center shadow-lg`}>
                    <Plus size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
