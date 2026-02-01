
import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, User, Smile, Minus, Search } from 'lucide-react';
import { Message, User as UserType, ThemeColor } from '../types';
import { THEME_COLORS, MOCK_USERS } from '../constants';

interface ChatPopupProps {
  primaryColor: ThemeColor;
  currentUser: UserType;
  messages: Message[];
  onSendMessage: (text: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  unreadCount: number;
}

const ChatPopup: React.FC<ChatPopupProps> = ({ 
  primaryColor, 
  currentUser, 
  messages, 
  onSendMessage, 
  isOpen, 
  setIsOpen,
  unreadCount 
}) => {
  const [inputText, setInputText] = useState('');
  const colorSet = THEME_COLORS[primaryColor];
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-96 h-[500px] bg-white rounded-[2rem] shadow-2xl border border-gray-100 flex flex-col animate-slide overflow-hidden ring-4 ring-black/5">
          {/* Header */}
          <div className={`${colorSet.bg} p-5 text-white flex justify-between items-center shadow-lg`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <User size={20} />
              </div>
              <div>
                <p className="text-xs font-black tracking-widest uppercase">General Chat</p>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">Snaillabs Tim Workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
               <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                 <Minus size={18} />
               </button>
            </div>
          </div>

          {/* Search/Filter (Mini) */}
          <div className="p-3 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
            <Search size={14} className="text-gray-400" />
            <input type="text" placeholder="Search in chat..." className="bg-transparent text-[10px] font-bold outline-none flex-1" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-gray-50/20">
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              const sender = MOCK_USERS.find(u => u.id === msg.senderId);
              
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2 group`}>
                  {!isMe && (
                    <img src={sender?.avatar} className="w-6 h-6 rounded-full self-end mb-1" alt="" />
                  )}
                  <div className={`max-w-[80%] p-3 rounded-2xl text-[13px] font-medium leading-relaxed ${
                    isMe 
                      ? `${colorSet.bg} text-white rounded-br-none shadow-md shadow-blue-50` 
                      : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none shadow-sm'
                  }`}>
                    {!isMe && <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-70">{sender?.name}</p>}
                    <p>{msg.text}</p>
                    <p className={`text-[9px] mt-1 font-black opacity-40 text-right uppercase`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-gray-50 rounded-2xl px-2 py-1 border border-gray-100">
              <button type="button" className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Smile size={18} />
              </button>
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tulis pesan..." 
                className="flex-1 bg-transparent py-2 text-sm outline-none font-medium"
              />
              <button 
                type="submit" 
                disabled={!inputText.trim()}
                className={`p-2.5 ${colorSet.bg} text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50`}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-16 h-16 rounded-[1.75rem] flex items-center justify-center text-white shadow-2xl transition-all hover:scale-110 active:scale-90 relative ${colorSet.bg} shadow-blue-200 ring-4 ring-white`}
      >
        <MessageCircle size={28} className={isOpen ? 'animate-pulse' : ''} />
        {unreadCount > 0 && !isOpen && (
          <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-black w-7 h-7 rounded-full flex items-center justify-center ring-4 ring-white animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>
    </div>
  );
};

export default ChatPopup;
