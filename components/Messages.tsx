
import React, { useState } from 'react';
import { Send, Search, User, MoreHorizontal, Smile } from 'lucide-react';
import { ThemeColor, Message, User as UserType } from '../types';
import { THEME_COLORS, MOCK_MESSAGES, MOCK_USERS } from '../constants';

const Messages: React.FC<{ primaryColor: ThemeColor; currentUser: UserType }> = ({ primaryColor, currentUser }) => {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');
  const colorSet = THEME_COLORS[primaryColor];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      text: inputText,
      timestamp: new Date().toISOString()
    };
    
    setMessages([...messages, newMessage]);
    setInputText('');
  };

  return (
    <div className="h-[calc(100vh-180px)] flex bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
      {/* Contact List */}
      <div className="w-80 border-r border-gray-100 flex flex-col">
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-black text-gray-900 tracking-tight">Direct Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Search members..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-100" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
           {MOCK_USERS.map(u => (
             <button key={u.id} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors text-left group">
                <img src={u.avatar} className="w-10 h-10 rounded-full" alt="" />
                <div className="flex-1 min-w-0">
                   <p className="text-xs font-bold text-gray-900 truncate">{u.name}</p>
                   <p className="text-[10px] text-gray-400 truncate">Online 5m ago</p>
                </div>
                {u.id === '1' && <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>}
             </button>
           ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-gray-50/30">
        <div className="p-6 bg-white border-b border-gray-100 flex justify-between items-center">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                 <User size={20} />
              </div>
              <div>
                 <p className="text-sm font-black text-gray-900">General Team Chat</p>
                 <p className="text-[10px] text-emerald-500 font-bold uppercase">Workspace Active</p>
              </div>
           </div>
           <button className="p-2 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100">
             <MoreHorizontal size={20} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
           {messages.map((msg) => {
             const isMe = msg.senderId === currentUser.id;
             const sender = MOCK_USERS.find(u => u.id === msg.senderId);
             
             return (
               <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-3 animate-slide`}>
                 {!isMe && <img src={sender?.avatar} className="w-8 h-8 rounded-full self-end" />}
                 <div className={`max-w-[70%] p-4 rounded-3xl text-sm font-medium ${
                   isMe ? `${colorSet.bg} text-white rounded-br-none shadow-lg shadow-blue-100` : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none shadow-sm'
                 }`}>
                   <p>{msg.text}</p>
                   <p className={`text-[10px] mt-1 opacity-60 font-bold text-right`}>
                     {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </p>
                 </div>
               </div>
             );
           })}
        </div>

        <div className="p-6 bg-white">
           <form onSubmit={handleSend} className="relative flex items-center gap-2">
              <button type="button" className="p-3 text-gray-400 hover:text-gray-600"><Smile size={20} /></button>
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Write a message..." 
                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button type="submit" className={`p-3 ${colorSet.bg} text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg`}>
                 <Send size={20} />
              </button>
           </form>
        </div>
      </div>
    </div>
  );
};

export default Messages;
