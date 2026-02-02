
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
 * GOOGLE APPS SCRIPT - SOCIALFLOW V2.9.8 (ATOMIC REAL-TIME WRITE)
 * 1. Sheet name must be: "Registrations"
 * 2. Deploy > New Deployment > Web App > ME > ANYONE.
 */

var CURRENT_APP_VERSION = "${APP_VERSION}";

function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Registrations') || ss.getSheets()[0];
  var lock = LockService.getScriptLock();

  try {
    if (action === 'register' || action === 'updateStatus') {
      // Tunggu antrian penulisan jika ada tabrakan data (Atomic Write)
      if (lock.tryLock(5000)) { 
        if (action === 'register') {
          sheet.appendRow([
            e.parameter.id || "N/A", 
            e.parameter.name || "Test User", 
            e.parameter.email || "test@snaillabs.id", 
            e.parameter.password || "", 
            e.parameter.timestamp || new Date().toLocaleString(), 
            'pending'
          ]);
          SpreadsheetApp.flush();
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
        lock.releaseLock();
      }
      return createResponse({status: "Success", app_version: CURRENT_APP_VERSION});
    }

    if (action === 'getRegistrations') {
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return createResponse({ registrations: [], app_version: CURRENT_APP_VERSION });
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
      return createResponse({ registrations: result, app_version: CURRENT_APP_VERSION });
    }
  } catch (err) {
    if (lock.hasLock()) lock.releaseLock();
    return createResponse({error: err.toString()});
  }

  return ContentService.createTextOutput("Socialflow Backend V2.9.8 Online");
}

function createResponse(data) {
  var output = JSON.stringify(data);
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) { return doGet(e); }
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showDbSettings, setShowDbSettings] = useState(false);
  const [showScriptInfo, setShowScriptInfo] = useState(false);
  const [tempUrl, setTempUrl] = useState(dbSourceUrl);

  const handleRefreshDatabase = () => {
    setIsRefreshing(true);
    onManualSync();
    setTimeout(() => setIsRefreshing(false), 2000);
  };

  const testWrite = async () => {
     if (!dbSourceUrl) return alert("Koneksikan database dulu!");
     setIsTesting(true);
     try {
        const testUrl = `${dbSourceUrl}${dbSourceUrl.includes('?') ? '&' : '?' }action=register&name=TestConnection&email=dev@test.com&timestamp=${new Date().toLocaleTimeString()}`;
        // No-cors mode
        fetch(testUrl, { method: 'GET', mode: 'no-cors' });
        
        alert("Sinyal 'Test Write' telah dikirim! \nSilakan cek Google Sheets Anda, baris baru dengan nama 'TestConnection' seharusnya muncul dalam beberapa detik.");
        setTimeout(() => onManualSync(), 3000);
     } catch (e) {
        alert("Gagal mengirim test write.");
     } finally {
        setIsTesting(false);
     }
  };

  const saveDbConfig = () => {
    if (!tempUrl || !tempUrl.includes('script.google.com')) {
      alert("Masukkan URL Apps Script yang valid!");
      return;
    }
    setDbSourceUrl(tempUrl);
    setShowDbSettings(false);
    onManualSync();
  };

  const copyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    alert("Kode V2.9.8 disalin! Silakan paste di Google Apps Script.");
  };

  const pendingCount = registrations.filter(r => (r.status || '').toLowerCase() === 'pending').length;

  return (
    <div className="space-y-12 animate-slide pb-20">
      <div className="bg-gray-900 p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-10 opacity-10">
           <Zap size={200} className="text-blue-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`px-4 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${dbSourceUrl ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-rose-500/10 border-rose-500/50 text-rose-400'}`}>
                   {dbSourceUrl ? <Wifi size={12}/> : <AlertTriangle size={12}/>}
                   {dbSourceUrl ? 'Instant Sync Ready' : 'Database Offline'}
                </div>
              </div>
              <h1 className="text-4xl font-black flex items-center gap-4"><Database className="text-blue-400" /> Dev Portal</h1>
              <p className="text-gray-400 font-medium">Monitoring Real-time Database & Pendaftaran.</p>
           </div>
           <div className="flex gap-4">
             <button onClick={() => setShowDbSettings(!showDbSettings)} className={`p-4 rounded-2xl transition-all ${showDbSettings ? 'bg-blue-500 shadow-lg' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}><Server size={20} /></button>
             <button onClick={() => setShowScriptInfo(!showScriptInfo)} className={`p-4 rounded-2xl transition-all ${showScriptInfo ? 'bg-amber-500 shadow-lg' : 'bg-white/5 border border-white/10 hover:bg-white/10'}`}><Code size={20} /></button>
             <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-3xl text-center backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60 text-blue-300">Queue</p>
                <p className="text-3xl font-black">{pendingCount}</p>
             </div>
           </div>
        </div>

        {showDbSettings && (
          <div className="mt-8 p-8 bg-white/5 rounded-[2.5rem] border border-white/10 animate-slide space-y-6">
             <div>
                <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-blue-400">Google Apps Script Web App URL</h3>
                <div className="flex flex-col md:flex-row gap-3">
                   <input value={tempUrl} onChange={e => setTempUrl(e.target.value)} placeholder="URL Deployment (/exec)" className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-blue-400 text-blue-200" />
                   <button onClick={saveDbConfig} className="px-8 py-4 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">Connect</button>
                </div>
             </div>
             
             {dbSourceUrl && (
               <div className="flex items-center justify-between p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <div className="space-y-1">
                     <p className="text-[10px] font-black uppercase text-emerald-400">Database Debugger</p>
                     <p className="text-xs text-gray-300">Gunakan ini untuk tes apakah data mendarat di Sheets Anda.</p>
                  </div>
                  <button onClick={testWrite} disabled={isTesting} className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                     {isTesting ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
                     Test Write to Sheet
                  </button>
               </div>
             )}
          </div>
        )}

        {showScriptInfo && (
          <div className="mt-8 p-8 bg-white/5 rounded-[2.5rem] border border-white/10 animate-slide space-y-4">
             <div className="flex justify-between items-center">
                <div className="space-y-1">
                   <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-amber-400"><Code size={14}/> Apps Script Core V2.9.8</h3>
                   <p className="text-[9px] text-gray-500 font-bold uppercase">Teknik Penulisan Antri (Queue) Real-time</p>
                </div>
                <button onClick={copyCode} className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-[10px] font-black hover:brightness-110 transition-all shadow-lg shadow-amber-500/20"><Copy size={14}/> Salin Kode</button>
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
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Antrian Approval Member</h3>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Polling Aktif (10s) • Last: {lastSync || 'Never'}</p>
             </div>
          </div>
          <button onClick={handleRefreshDatabase} disabled={isRefreshing} className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 shadow-xl shadow-blue-100 transition-all active:scale-95">
            {isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            <span>Sync Sekarang</span>
          </button>
        </div>
        
        <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm ring-1 ring-black/5">
           <table className="w-full text-left">
              <thead className="bg-gray-50/50">
                 <tr>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Pendaftar</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Waktu Input</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Tindakan</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {registrations.filter(r => (r.status || '').toLowerCase() === 'pending').map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-all group">
                       <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 font-black text-sm border border-blue-100 group-hover:scale-110 transition-transform">{r.name ? r.name.charAt(0).toUpperCase() : '?'}</div>
                             <div>
                                <p className="text-sm font-black text-gray-900">{r.name}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{r.email}</p>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-6">
                          <div className="flex items-center gap-2 text-gray-400">
                             <Clock size={12}/>
                             <span className="text-[11px] font-bold">{r.timestamp}</span>
                          </div>
                       </td>
                       <td className="px-10 py-6">
                          <div className="flex justify-center gap-3">
                              <button onClick={() => onRegistrationAction(r.id, 'approved')} className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-emerald-100">Approve</button>
                              <button onClick={() => onRegistrationAction(r.id, 'rejected')} className="px-6 py-3 bg-rose-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-rose-100">Reject</button>
                          </div>
                       </td>
                    </tr>
                 ))}
                 {pendingCount === 0 && (
                   <tr>
                      <td colSpan={3} className="py-24 text-center">
                         <div className="flex flex-col items-center gap-4 opacity-30">
                            <Database size={48} className="text-gray-300"/>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.3em]">Antrian Cloud Kosong</p>
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
