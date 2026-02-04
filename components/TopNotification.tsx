
import React, { useEffect, useState } from 'react';
import { MessageSquare, X, Bell, CheckCircle2 } from 'lucide-react';
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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay to trigger animation
    const timerIn = setTimeout(() => setVisible(true), 50);
    const timerOut = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 500); // Wait for exit animation
    }, 5000); 

    return () => {
        clearTimeout(timerIn);
        clearTimeout(timerOut);
    };
  }, [onClose]);

  return (
    <div className="fixed top-4 left-0 right-0 flex justify-center z-[250] pointer-events-none">
      <div 
        onClick={onClick}
        className={`pointer-events-auto cursor-pointer transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${
            visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-12 opacity-0 scale-95'
        }`}
      >
        <div className="bg-black/90 backdrop-blur-3xl text-white px-5 py-4 rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] flex items-center gap-4 min-w-[340px] max-w-[480px] border border-white/10 ring-1 ring-black/5">
            {/* Icon Container */}
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-md">
                <Bell size={18} className="text-white" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-2">
                <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">New Notification</p>
                    <span className="text-[9px] text-gray-500 font-medium">Just now</span>
                </div>
                <div className="flex flex-col mt-1">
                    <p className="text-xs font-black text-white truncate leading-tight">{senderName}</p>
                    <p className="text-[11px] text-gray-300 truncate font-medium leading-tight opacity-90">{messageText}</p>
                </div>
            </div>

            {/* Close Button */}
            <button 
                onClick={(e) => { e.stopPropagation(); setVisible(false); setTimeout(onClose, 300); }}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-gray-400 hover:text-white transition-colors"
            >
                <X size={14} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default TopNotification;
