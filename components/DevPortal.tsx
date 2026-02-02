
import React from 'react';
import { User, RegistrationRequest } from '../types';
import { Database, RefreshCw, Server, Info, Clock, Zap, CheckCircle, XCircle, ShieldCheck, Mail, Instagram, Target } from 'lucide-react';
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
  primaryColorHex, registrations, onRegistrationAction
}) => {
  const pendingRegs = registrations.filter(r => (r.status || '').toLowerCase() === 'pending');

  return (
    <div className="space-y-12 animate-slide pb-20">
      <div className="bg-gray-900 p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-10">
           <Zap size={200} className="text-blue-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="space-y-3">
              <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/50 text-blue-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                 Socialflow Cloud Engine Active
              </div>
              <h1 className="text-4xl font-black flex items-center gap-4"><Database className="text-blue-400" /> Dev Portal</h1>
              <p className="text-gray-400 font-medium tracking-wide">Pusat Manajemen Akses & Deployment V{APP_VERSION}.</p>
           </div>
           <div className="flex gap-4">
             <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-3xl text-center backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-blue-300 opacity-60">Pending Cloud</p>
                <p className="text-3xl font-black">{pendingRegs.length}</p>
             </div>
           </div>
        </div>
        
        <div className="mt-10 p-8 bg-white/5 rounded-[2.5rem] border border-white/10 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center"><ShieldCheck size={24}/></div>
              <div>
                 <p className="text-sm font-black">Sistem Cloud Tanpa Server Aktif</p>
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">Data tersinkronisasi antar-perangkat secara realtime.</p>
              </div>
           </div>
           <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
              <span className="text-emerald-400">Low Latency</span>
              <span className="text-blue-400">No Database Needed</span>
           </div>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex justify-between items-center px-4">
           <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Antrian Pendaftaran Cloud</h3>
           <div className="flex items-center gap-2 text-emerald-500">
              <RefreshCw size={14} className="animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest">Listening for new nodes...</span>
           </div>
        </div>
        
        <div className="bg-white rounded-[3.5rem] border border-gray-100 overflow-hidden shadow-sm">
           <table className="w-full text-left">
              <thead className="bg-gray-50/50">
                 <tr>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Profil Pendaftar</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Niche & Alasan</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Status</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Aksi</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {pendingRegs.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-all group">
                       <td className="px-10 py-8">
                          <div className="flex items-center gap-5">
                             <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 font-black text-xl border border-blue-100 shadow-sm">{r.name ? r.name.charAt(0).toUpperCase() : '?'}</div>
                             <div className="space-y-1">
                                <p className="text-sm font-black text-gray-900">{r.name}</p>
                                <p className="text-[10px] text-blue-500 font-black flex items-center gap-1.5 uppercase"><Instagram size={10}/> {r.handle || '@n/a'}</p>
                                <p className="text-[9px] text-gray-300 font-bold uppercase tracking-tighter flex items-center gap-1.5"><Mail size={10}/> {r.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="max-w-[200px] space-y-1.5">
                             <span className="px-2 py-0.5 bg-gray-100 text-[8px] font-black uppercase rounded text-gray-500 tracking-widest">{r.niche || 'General'}</span>
                             <p className="text-[10px] text-gray-400 font-medium line-clamp-2 leading-relaxed">"{r.reason || 'No reason provided.'}"</p>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex flex-col gap-1">
                             <span className="text-[11px] font-bold text-gray-400 flex items-center gap-2"><Clock size={12}/> {r.timestamp}</span>
                             <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Origin: Cloud Node</span>
                          </div>
                       </td>
                       <td className="px-10 py-8">
                          <div className="flex justify-center gap-3">
                              <button onClick={() => onRegistrationAction(r.id, 'approved')} className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-emerald-100"><CheckCircle size={14} className="inline mr-2"/> Approve</button>
                              <button onClick={() => onRegistrationAction(r.id, 'rejected')} className="px-6 py-3 bg-rose-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-rose-100"><XCircle size={14} className="inline mr-2"/> Reject</button>
                          </div>
                       </td>
                    </tr>
                 ))}
                 {pendingRegs.length === 0 && (
                   <tr>
                      <td colSpan={4} className="py-24 text-center">
                         <div className="flex flex-col items-center gap-6 opacity-30">
                            <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 border border-gray-100 shadow-inner"><Database size={40}/></div>
                            <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.4em]">Antrian Pendaftaran Bersih</p>
                         </div>
                      </td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>
      </section>
    </div>
  );
};

export default DevPortal;
