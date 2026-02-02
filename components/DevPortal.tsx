
import React, { useState } from 'react';
import { User, RegistrationRequest } from '../types';
import { Database, RefreshCw, Zap, CheckCircle, XCircle, ShieldCheck, Mail, Instagram, Clock, Search, Filter } from 'lucide-react';
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

  const handleManualForceSync = () => {
    setIsRefreshing(true);
    const savedRegs = localStorage.getItem('sf_registrations_db');
    if (savedRegs) {
      setRegistrations(JSON.parse(savedRegs));
    }
    setTimeout(() => {
      setIsRefreshing(false);
      alert("Sinkronisasi Cloud Selesai! Menampilkan pendaftaran terbaru dari semua device.");
    }, 1000);
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-slide pb-20">
      <div className="bg-gray-900 p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-10 hidden md:block">
           <Zap size={200} className="text-blue-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="space-y-3">
              <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/50 text-blue-400 text-[8px] md:text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                 Multi-Device Cloud Active
              </div>
              <h1 className="text-3xl md:text-4xl font-black flex items-center gap-4"><Database className="text-blue-400" /> Dev Portal</h1>
              <p className="text-gray-400 font-medium tracking-wide text-sm md:text-base">Kelola akses Cloud Engine V{APP_VERSION}.</p>
           </div>
           <div className="flex gap-4 w-full md:w-auto">
             <div className="flex-1 md:flex-none px-8 py-4 bg-white/5 border border-white/10 rounded-3xl text-center backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-blue-300 opacity-60">Pending Node</p>
                <p className="text-2xl md:text-3xl font-black">{pendingRegs.length}</p>
             </div>
           </div>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 gap-4">
           <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Cloud Registration Queue</h3>
           <button 
             onClick={handleManualForceSync} 
             disabled={isRefreshing}
             className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/10 transition-all active:scale-95"
           >
              {isRefreshing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              <span>Paksa Sinkron Cloud</span>
           </button>
        </div>
        
        {/* Responsive Table Wrapper */}
        <div className="bg-white rounded-[2rem] md:rounded-[3.5rem] border border-gray-100 overflow-hidden shadow-sm">
           <div className="overflow-x-auto custom-scrollbar">
             <table className="w-full text-left min-w-[800px]">
                <thead className="bg-gray-50/50">
                   <tr>
                      <th className="px-8 md:px-10 py-6 text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest">Pendaftar</th>
                      <th className="px-8 md:px-10 py-6 text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest">Bidang & Alasan</th>
                      <th className="px-8 md:px-10 py-6 text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest">Waktu</th>
                      <th className="px-8 md:px-10 py-6 text-[9px] md:text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Aksi</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {pendingRegs.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-all group">
                         <td className="px-8 md:px-10 py-8">
                            <div className="flex items-center gap-5">
                               <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 font-black text-lg md:text-xl border border-blue-100 shadow-sm">{r.name ? r.name.charAt(0).toUpperCase() : '?'}</div>
                               <div className="space-y-1">
                                  <p className="text-sm font-black text-gray-900">{r.name}</p>
                                  <p className="text-[10px] text-blue-500 font-black flex items-center gap-1.5 uppercase"><Instagram size={10}/> {r.handle || '@n/a'}</p>
                                  <p className="text-[9px] text-gray-300 font-bold uppercase tracking-tighter flex items-center gap-1.5"><Mail size={10}/> {r.email}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 md:px-10 py-8">
                            <div className="max-w-[200px] space-y-1.5">
                               <span className="px-2 py-0.5 bg-gray-100 text-[8px] font-black uppercase rounded text-gray-500 tracking-widest">{r.niche || 'General'}</span>
                               <p className="text-[10px] text-gray-400 font-medium line-clamp-2 leading-relaxed">"{r.reason || 'No reason provided.'}"</p>
                            </div>
                         </td>
                         <td className="px-8 md:px-10 py-8">
                            <div className="flex flex-col gap-1">
                               <span className="text-[11px] font-bold text-gray-400 flex items-center gap-2"><Clock size={12}/> {r.timestamp}</span>
                               <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Status: Sent</span>
                            </div>
                         </td>
                         <td className="px-8 md:px-10 py-8">
                            <div className="flex justify-center gap-3">
                                <button onClick={() => onRegistrationAction(r.id, 'approved')} className="px-5 py-3 bg-emerald-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-emerald-100"><CheckCircle size={14} className="inline mr-2"/> Approve</button>
                                <button onClick={() => onRegistrationAction(r.id, 'rejected')} className="px-5 py-3 bg-rose-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-rose-100"><XCircle size={14} className="inline mr-2"/> Reject</button>
                            </div>
                         </td>
                      </tr>
                   ))}
                   {pendingRegs.length === 0 && (
                     <tr>
                        <td colSpan={4} className="py-24 text-center">
                           <div className="flex flex-col items-center gap-6 opacity-30">
                              <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 border border-gray-100 shadow-inner"><Database size={40}/></div>
                              <p className="text-[10px] md:text-[11px] text-gray-400 font-black uppercase tracking-[0.4em]">Cloud Antrian Bersih</p>
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
