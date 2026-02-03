
import React, { useEffect } from 'react';
import { MessageSquare, X, Bell } from 'lucide-react';
import { ThemeColor } from '../types';
import { THEME_COLORS } from '../constants';

interface TopNotificationProps {
  primaryColor: ThemeColor;
  senderName: string;
  messageText: string;
  onClose: () => void;
  onClick: () => void;
  actionButton?: React.ReactNode;
}

const TopNotification: React.FC<TopNotificationProps> = ({ 
  primaryColor, 
  senderName, 
  messageText, 
  onClose,
  onClick,
  actionButton
}) => {
  const colorSet = THEME_COLORS[primaryColor];

  useEffect(() => {
    const timer = setTimeout(onClose, 4000); // 4 seconds auto-hide
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[250] w-full max-w-sm animate-slide-down px-4">
      <div 
        onClick={onClick}
        className="bg-white/95 backdrop-blur-xl border border-gray-100 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1)] rounded-[2rem] p-5 flex flex-col gap-4 cursor-pointer hover:bg-white transition-all ring-1 ring-black/5"
      >
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-[1.25rem] ${colorSet.bg} flex items-center justify-center text-white shrink-0 shadow-lg`}>
            <Bell size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Alert</p>
            <p className="text-sm font-black text-gray-900 truncate">{senderName}</p>
            <p className="text-xs text-gray-500 truncate font-medium">{messageText}</p>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="p-2 text-gray-300 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        {actionButton && (
          <div className="flex justify-end gap-2 border-t border-gray-50 pt-3 mt-1">
             {actionButton}
          </div>
        )}
      </div>
    </div>
  );
};

export default TopNotification;
