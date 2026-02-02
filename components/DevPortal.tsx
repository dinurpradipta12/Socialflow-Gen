
import React, { useState } from 'react';
import { User, RegistrationRequest } from '../types';
import { Database, CalendarDays, RefreshCw, Power, ShieldCheck, Search, CheckCircle, XCircle, FileSpreadsheet, Trash2, Download, Loader2, Link2, Globe, Server, Code, Copy, Info, Clock, Zap } from 'lucide-react';

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
  lastSync?: string;
}

const APPS_SCRIPT_CODE = `
/**
 * GOOGLE APPS SCRIPT TEMPLATE FOR SOCIALFLOW (V2.9 - TURBO SYNC)
 * 1. Extensions > Apps Script > Paste This.
 * 2. Sheet name must be: "Registrations"
 * 3. Baris 1: id | name | email | password | timestamp | status
 * 4. Deploy > New Deployment > Web App > Me > Anyone.
 */

function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Registrations') || ss.getSheets()[0];

  try {
    if (action === 'register' || action === 'updateStatus') {
      if (action === 'register') {
        sheet.appendRow([
          e.parameter.id, 
          e.parameter.name, 
          e.parameter.email, 
          e.parameter.password, 
          e.parameter.timestamp, 
          'pending'
        ]);
      } else {
        var data = sheet.getDataRange().getValues();
        var id = e.parameter.id;
        var status = e.parameter.status;
        for (var i = 1; i < data.length; i++) {
          if (data[i][0] == id) {
            sheet.getRange(i + 1, 6).setValue(status);
            break;
          }
        }
      }
      return createResponse({status: "Success"});
    }

    if (action === 'getRegistrations') {
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var rows = data.slice(1);
      var result = rows.map(function(row) {
        var obj = {};
        headers.forEach(function(header, i) { 
          var key = header.toString().trim().toLowerCase();
          obj[key] = row[i]; 
        });
        return obj;
      });
      return createResponse(result);
    }
  } catch (err) {
    return createResponse({error: err.message});
  }

  return ContentService.createTextOutput("Socialflow Backend V2.9 Active");
}

function createResponse(data) {
  var output = JSON.stringify(data);
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  return doGet(e);
}
`;

const DevPortal: React.FC<DevPortalProps> = ({ 
  primaryColorHex, 
  registrations, 
  onRegistrationAction,
  users,
  setUsers,
  setRegistrations,
  dbSourceUrl,
  setDbSourceUrl,
  onManualSync,
  lastSync
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDbSettings, setShowDbSettings] = useState(false);
  const [showScriptInfo, setShowScriptInfo] = useState(false);
  const [tempUrl, setTempUrl] = useState(dbSourceUrl);

  const handleRefreshDatabase = () => {
    setIsRefreshing(true);
    onManualSync();
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const saveDbConfig = () => {
    if (!tempUrl.includes('script.google.com')) {
      alert("URL tidak valid!");
      return;
    }
    setDbSourceUrl(tempUrl);
    setShowDbSettings(false);
    onManualSync();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    alert("Kode Turbo-Sync V2.9 disalin!");
  };

  return (
    <div className="space-y-12 animate-slide pb-20">
      <div className="bg-gray-900 p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-10">
           <Zap size={200} className="text-blue-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="space-y-2">
              <h1 className="text-4xl font-black flex items-center gap-4"><Database className="text-blue-400" /> Database Dev</h1>
              <div className="flex items-center gap-3">
                 <p className="text-gray-400 font-medium">Panel Kontrol Cloud Socialflow.</p>
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 rounded-full border border-blue-400/30">
                    <Zap size={10} className="text-blue-300 animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-blue-300">Turbo Sync Active (10s)</span>
                 </div>
              </div>
           </div>
           <div className="flex gap-4">
             <button onClick={() => setShowDbSettings(!showDbSettings)} className={`p-4 rounded-2xl transition-all ${showDbSettings ? 'bg-blue-500 shadow-lg' : 'bg-white/5 border border-white/10'}`}><Server size={20} /></button>
             <button onClick={() => setShowScriptInfo(!showScriptInfo)} className={`p-4 rounded-2xl transition-all ${showScriptInfo ? 'bg-amber-500 shadow-lg' : 'bg-white/5 border border-white/10'}`}><Code size={20} /></button>
             <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-3xl text-center">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60 text-blue-300">Pendaftar</p>
                {/* Fix: use consistent lowercase comparison to satisfy TS strict typing and handle external data variations */}
                <p className="text-3xl font-black">{registrations.filter(r => (r.status || '').toLowerCase() === 'pending').length}</p>
             </div>
           </div>
        </div>

        {showDbSettings && (
          <div className="mt-8 p-8 bg-white/5 rounded-[2.5rem] border border-white/10 animate-slide">
             <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-blue-400">Apps Script Web App URL (/exec)</h3>
             <div className="flex gap-3">
                <input value={tempUrl} onChange={e => setTempUrl(e.target.value)} placeholder="https://script.google.com/macros/s/.../exec" className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-blue-400 text-blue-300" />
                <button onClick={saveDbConfig} className="px-8 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Connect</button>
             </div>
          </div>
        )}

        {showScriptInfo && (
          <div className="mt-8 p-8 bg-white/5 rounded-[2.5rem] border border-white/10 animate-slide space-y-4">
             <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-amber-400"><Code size={14}/> Turbo-Sync V2.9 Script</h3>
                <button onClick={copyCode} className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-[10px] font-black hover:bg-amber-500/30 transition-all"><Copy size={14}/> Copy Code</button>
             </div>
             <pre className="p-6 bg-black/40 rounded-2xl text-[10px] font-mono text-amber-100 overflow-x-auto border border-white/5 max-h-60 custom-scrollbar leading-relaxed">
                {APPS_SCRIPT_CODE}
             </pre>
          </div>
        )}
      </div>

      <section className="space-y-6">
        <div className="flex justify-between items-center px-4">
          <div className="space-y-1">
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Antrian Member Baru</h3>
             <p className="text-[10px] text-gray-300 font-bold uppercase flex items-center gap-1.5"><Clock size={10}/> Terakhir Sinkron: {lastSync || '---'}</p>
          </div>
          <button onClick={handleRefreshDatabase} disabled={isRefreshing} className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-blue-100 transition-all active:scale-95">
            {isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            <span>Sync Cloud</span>
          </button>
        </div>
        
        <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm">
           <table className="w-full text-left">
              <thead className="bg-gray-50/50">
                 <tr>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Calon Member</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Tindakan Cepat</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {registrations.filter(r => (r.status || '').toLowerCase() === 'pending').map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-all">
                       <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 font-black text-xs">{r.name ? r.name.charAt(0).toUpperCase() : '?'}</div>
                             <div>
                                <p className="text-sm font-black text-gray-900">{r.name}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase">{r.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-6">
                          <div className="flex justify-center gap-3">
                              <button onClick={() => onRegistrationAction(r.id, 'approved')} className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md">Approve</button>
                              <button onClick={() => onRegistrationAction(r.id, 'rejected')} className="px-6 py-3 bg-rose-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md">Reject</button>
                          </div>
                       </td>
                    </tr>
                 ))}
                 {registrations.filter(r => (r.status || '').toLowerCase() === 'pending').length === 0 && (
                   <tr><td colSpan={2} className="py-20 text-center text-gray-300 font-black uppercase text-[10px] tracking-widest">Antrian pendaftaran kosong saat ini.</td></tr>
                 )}
              </tbody>
           </table>
        </div>
      </section>
    </div>
  );
};

export default DevPortal;
