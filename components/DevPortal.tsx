
import React, { useState } from 'react';
import { User, RegistrationRequest } from '../types';
import { Database, CalendarDays, RefreshCw, Power, ShieldCheck, Search, CheckCircle, XCircle, FileSpreadsheet, Trash2, Download, Loader2, Link2, Globe, Server, Code, Copy, Info, Clock, Zap, Wifi, AlertTriangle, Send } from 'lucide-react';
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
  lastSync?: string;
}

const APPS_SCRIPT_CODE = `
/**
 * GOOGLE APPS SCRIPT - SOCIALFLOW V3.0.7 (DEPLOYMENT SOURCE)
 * Update: Menambahkan kontrol versi yang lebih ketat agar banner update hilang saat versi cocok.
 */

var DEPLOYMENT_VERSION = "${APP_VERSION}";

function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Registrations') || ss.getSheets()[0];
  var lock = LockService.getScriptLock();

  try {
    if (action === 'register' || action === 'updateStatus') {
      if (lock.tryLock(15000)) { 
        if (action === 'register') {
          sheet.appendRow([
            e.parameter.id || ("REG-" + Date.now()), 
            e.parameter.name || "User", 
            e.parameter.email || "N/A", 
            e.parameter.password || "", 
            e.parameter.timestamp || new Date().toLocaleString(), 
            'pending'
          ]);
          SpreadsheetApp.flush();
        } else {
          var data = sheet.getDataRange().getValues();
          var idToFind = (e.parameter.id || "").toString();
          for (var i = 1; i < data.length; i++) {
            if (data[i][0].toString() === idToFind) {
              sheet.getRange(i + 1, 6).setValue(e.parameter.status);
              SpreadsheetApp.flush();
              break;
            }
          }
        }
        lock.releaseLock();
      }
      return createResponse({status: "Success", app_version: DEPLOYMENT_VERSION});
    }

    if (action === 'getRegistrations') {
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return createResponse({ registrations: [], app_version: DEPLOYMENT_VERSION });
      var headers = data[0];
      var rows = data.slice(1);
      var result = rows.map(function(row) {
        var obj = {};
        headers.forEach(function(header, i) { obj[header.toString().trim().toLowerCase()] = row[i]; });
        return obj;
      });
      return createResponse({ registrations: result, app_version: DEPLOYMENT_VERSION });
    }
  } catch (err) {
    if (lock.hasLock()) lock.releaseLock();
    return createResponse({error: err.toString()});
  }
  return createResponse({status: "Active", app_version: DEPLOYMENT_VERSION});
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) { return doGet(e); }
`;

const DevPortal: React.FC<DevPortalProps> = ({ 
  primaryColorHex, registrations, onRegistrationAction, users, setUsers, setRegistrations, dbSourceUrl, setDbSourceUrl, onManualSync, lastSync
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDbSettings, setShowDbSettings] = useState(false);
  const [showScriptInfo, setShowScriptInfo] = useState(false);
  const [tempUrl, setTempUrl] = useState(dbSourceUrl);

  const handleRefreshDatabase = () => {
    setIsRefreshing(true);
    onManualSync();
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    alert("Kode Deployment V3.0.7 Disalin!");
  };

  const pendingRegs = registrations.filter(r => (r.status || '').toLowerCase() === 'pending');

  return (
    <div className="space-y-12 animate-slide pb-20">
      <div className="bg-gray-900 p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-10">
           <Zap size={200} className="text-blue-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="space-y-3">
              <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${dbSourceUrl ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' : 'bg-rose-500/10 border-rose-500/50 text-rose-400'}`}>
                 <div className={`w-2 h-2 rounded-full ${dbSourceUrl ? 'bg-blue-400 animate-pulse' : 'bg-rose-400'}`}></div>
                 {dbSourceUrl ? 'Cloud Deployment Connected' : 'Local Only Mode'}
              </div>
              <h1 className="text-4xl font-black flex items-center gap-4"><Database className="text-blue-400" /> Dev Portal</h1>
              <p className="text-gray-400 font-medium tracking-wide">Environment: Production • Branch: Main (v{APP_VERSION})</p>
           </div>
           <div className="flex gap-4">
             <button onClick={() => setShowDbSettings(!showDbSettings)} className={`p-4 rounded-2xl transition-all ${showDbSettings ? 'bg-blue-500' : 'bg-white/5 border border-white/10'}`}><Server size={20} /></button>
             <button onClick={() => setShowScriptInfo(!showScriptInfo)} className={`p-4 rounded-2xl transition-all ${showScriptInfo ? 'bg-amber-500' : 'bg-white/5 border border-white/10'}`}><Code size={20} /></button>
             <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-3xl text-center">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-blue-300 opacity-60">Pending</p>
                <p className="text-3xl font-black">{pendingRegs.length}</p>
             </div>
           </div>
        </div>

        {showDbSettings && (
          <div className="mt-8 p-8 bg-white/5 rounded-[2.5rem] border border-white/10 animate-slide">
             <h3 className="text-xs font-black uppercase tracking-widest mb-4 text-blue-400">Deployment Config</h3>
             <div className="flex flex-col md:flex-row gap-3">
                <input value={tempUrl} onChange={e => setTempUrl(e.target.value)} placeholder="Apps Script URL" className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold outline-none text-blue-100" />
                <button onClick={() => { setDbSourceUrl(tempUrl); setShowDbSettings(false); onManualSync(); }} className="px-8 py-4 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Connect Cloud</button>
             </div>
          </div>
        )}

        {showScriptInfo && (
          <div className="mt-8 p-8 bg-white/5 rounded-[2.5rem] border border-white/10 animate-slide">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">Apps Script Core V3.0.7</h3>
                <button onClick={copyCode} className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-amber-500/20"><Copy size={14} className="inline mr-2"/> Copy Code</button>
             </div>
             <pre className="p-6 bg-black/40 rounded-2xl text-[10px] font-mono text-amber-100/70 overflow-x-auto max-h-60 leading-relaxed custom-scrollbar">
                {APPS_SCRIPT_CODE}
             </pre>
          </div>
        )}
      </div>

      <section className="space-y-6">
        <div className="flex justify-between items-center px-4">
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Akses User Masuk</h3>
           <button onClick={handleRefreshDatabase} disabled={isRefreshing} className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-100 transition-all">
             {isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
             <span>Sinkronkan Cloud</span>
           </button>
        </div>
        
        <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm">
           <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                 <tr>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Data Pendaftar</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Waktu Cloud</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Tindakan</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {pendingRegs.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-all group">
                       <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 font-black text-sm border border-blue-100">{r.name ? r.name.charAt(0).toUpperCase() : '?'}</div>
                             <div>
                                <p className="text-sm font-black text-gray-900">{r.name}</p>
                                <p className="text-[10px] text-gray-300 font-bold uppercase">{r.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-6">
                          <span className="text-[11px] font-bold text-gray-400 flex items-center gap-2"><Clock size={12}/> {r.timestamp}</span>
                       </td>
                       <td className="px-10 py-6">
                          <div className="flex justify-center gap-3">
                              <button onClick={() => onRegistrationAction(r.id, 'approved')} className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">Approve</button>
                              <button onClick={() => onRegistrationAction(r.id, 'rejected')} className="px-6 py-3 bg-rose-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">Reject</button>
                          </div>
                       </td>
                    </tr>
                 ))}
                 {pendingRegs.length === 0 && (
                   <tr>
                      <td colSpan={3} className="py-24 text-center">
                         <div className="flex flex-col items-center gap-4 opacity-30">
                            <Database size={48} className="text-gray-300"/>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">Antrian Bersih</p>
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
