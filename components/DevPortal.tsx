
import React, { useState } from 'react';
import { User, RegistrationRequest } from '../types';
// Added Cloud to the imports from lucide-react
import { Database, RefreshCw, Zap, CheckCircle, XCircle, ShieldCheck, Mail, Instagram, Clock, Search, Filter, Globe, Download, Cloud } from 'lucide-react';
import { APP_VERSION } from '../constants';

interface DevPortalProps {
  primaryColorHex: string;
  registrations: RegistrationRequest[];
  onRegistrationAction: (regId: string, status: 'approved' | 'rejected') => void;
  users: User[];
  setUsers: (users: User[]) => void;
  setRegistrations: (regs: RegistrationRequest[]) => void;
  dbSourceUrl: string;
  setDbSourceUrl: (url: string) => void;
  onManualSync: () => void;
}

const DevPortal: React.FC<DevPortalProps> = ({ 
  registrations, onRegistrationAction, setRegistrations
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pendingRegs = registrations.filter(r => (r.status || '').toLowerCase() === 'pending');

  const handleCloudPull = () => {
    setIsRefreshing(true);
    // Simulasi Cloud Pull: Di dunia nyata ini akan memanggil fetch('/api/registrations')
    setTimeout(() => {
      const saved = localStorage.getItem('sf_registrations_db');
      if (saved) {
        setRegistrations(JSON.parse(saved));
      }
      setIsRefreshing(false);
      alert("Cloud Sync Sukses! Data pendaftaran terbaru telah ditarik ke Dashboard Admin.");
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-slide pb-20">
      {/* Header Dev Portal */}
      <div className="bg-gray-900 p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-10 hidden md:block">
           <Zap size={200} className="text-blue-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
           <div className="space-y-4">
              <div className="inline-flex px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400 text-[9px] font-black uppercase tracking-widest items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                 Global Cloud Registry V3.1.0
              </div>
              <h1 className="text-3xl md:text-5xl font-black flex items-center gap-4 tracking-tighter"><Database className="text-blue-400" size={40} /> Dev Hub</h1>
              <p className="text-gray-400 font-medium max-w-md text-sm md:text-base leading-relaxed">Pusat otorisasi node pendaftaran dari semua perangkat yang terhubung ke Socialflow Cloud.</p>
           </div>
           
           <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="px-8 py-5 bg-white/5 border border-white/10 rounded-3xl text-center backdrop-blur-md">
                 <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-blue-300 opacity-60">Pending Node</p>
                 <p className="text-2xl md:text-4xl font-black">{pendingRegs.length}</p>
              </div>
              <button 
                onClick={handleCloudPull} 
                disabled={isRefreshing}
                className="px-8 py-5 bg-blue-500 hover:bg-blue-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 flex flex-col items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                 {isRefreshing ? <RefreshCw size={24} className="animate-spin"/> : <Download size={24}/>}
                 {isRefreshing ? 'PULLING...' : 'CLOUD PULL'}
              </button>
           </div>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex justify-between items-center px-6">
           <div className="space-y-1">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Antrian Pendaftaran Instan</h3>
              <p className="text-[10px] text-gray-300 font-bold">Data disaring berdasarkan status 'Pending'</p>
           </div>
           <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl text-emerald-500">
              <Globe size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Listening...</span>
           </div>
        </div>
        
        {/* Responsive Table Container */}
        <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden">
           <div className="overflow-x-auto custom-scrollbar">
             <table className="w-full text-left min-w-[900px]">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                   <tr>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Node Profil</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Bidang & Brief</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Timestamp Cloud</th>
                      <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Otorisasi</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {pendingRegs.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50/50 transition-all group">
                         <td className="px-10 py-8">
                            <div className="flex items-center gap-5">
                               <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 font-black text-xl border border-blue-100 shadow-sm">{r.name ? r.name.charAt(0).toUpperCase() : '?'}</div>
                               <div className="space-y-1">
                                  <p className="text-sm font-black text-gray-900">{r.name}</p>
                                  <p className="text-[10px] text-blue-500 font-black flex items-center gap-1.5 uppercase"><Instagram size={10}/> {r.handle || '@node_anon'}</p>
                                  <p className="text-[9px] text-gray-300 font-bold uppercase tracking-tighter flex items-center gap-1.5"><Mail size={10}/> {r.email}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-10 py-8">
                            <div className="max-w-[240px] space-y-2">
                               <span className="px-2 py-0.5 bg-gray-100 text-[8px] font-black uppercase rounded text-gray-500 tracking-widest">{r.niche || 'Digital Content'}</span>
                               <p className="text-[11px] text-gray-400 font-medium line-clamp-2 leading-relaxed">"{r.reason || 'No description provided.'}"</p>
                            </div>
                         </td>
                         <td className="px-10 py-8">
                            <div className="flex flex-col gap-1">
                               <span className="text-[12px] font-bold text-gray-900 flex items-center gap-2"><Clock size={14} className="text-gray-300"/> {r.timestamp}</span>
                               <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1"><ShieldCheck size={10}/> Authenticated Node</span>
                            </div>
                         </td>
                         <td className="px-10 py-8">
                            <div className="flex justify-center gap-3">
                                <button onClick={() => onRegistrationAction(r.id, 'approved')} className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-emerald-100"><CheckCircle size={16} className="inline mr-2"/> Setujui</button>
                                <button onClick={() => onRegistrationAction(r.id, 'rejected')} className="px-6 py-3 bg-rose-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-rose-100"><XCircle size={16} className="inline mr-2"/> Tolak</button>
                            </div>
                         </td>
                      </tr>
                   ))}
                   {pendingRegs.length === 0 && (
                     <tr>
                        <td colSpan={4} className="py-32 text-center">
                           <div className="flex flex-col items-center gap-6 opacity-30">
                              {/* Cloud is now imported correctly */}
                              <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-300 border border-gray-100 shadow-inner animate-pulse"><Cloud size={48}/></div>
                              <p className="text-[12px] text-gray-400 font-black uppercase tracking-[0.5em]">Antrian Node Bersih</p>
                           </div>
                        </td>
                     </tr>
                   )}
                </tbody>
             </table>
           </div>
        </div>
      </section>
    </div>
  );
};

export default DevPortal;
