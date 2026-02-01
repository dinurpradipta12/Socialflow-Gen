
import React, { useState } from 'react';
import { User, RegistrationRequest } from '../types';
import { Database, CalendarDays, RefreshCw, Power, ShieldCheck, Search, CheckCircle, XCircle, FileSpreadsheet, Trash2, Download, Loader2, Link2, Globe, Server, Code, Copy, Info } from 'lucide-react';

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

const APPS_SCRIPT_CODE = `
/**
 * GOOGLE APPS SCRIPT TEMPLATE FOR SOCIALFLOW (V2 - Robust)
 * 1. Create a Google Sheet.
 * 2. Name the first sheet tab: "Registrations"
 * 3. Add headers in Row 1: id, name, email, password, timestamp, status
 * 4. Extensions > Apps Script > Paste this code.
 * 5. Deploy > New Deployment > Web App > Execute as: Me > Access: "Anyone".
 */

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Registrations');
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({error: "Sheet 'Registrations' not found"})).setMimeType(ContentService.MimeType.JSON);
  
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var rows = data.slice(1);
  
  var result = rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, i) { obj[header] = row[i]; });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Registrations');
  if (!sheet) return ContentService.createTextOutput("Error: Sheet not found").setMimeType(ContentService.MimeType.TEXT);
  
  var action = e.parameter.action;
  
  // Handle case where params are in postData instead of parameter
  if (!action && e.postData && e.postData.contents) {
    try {
      var body = JSON.parse(e.postData.contents);
      action = body.action;
      e.parameter = body; // Map for convenience
    } catch(err) {}
  }

  if (action === 'register') {
    sheet.appendRow([
      e.parameter.id, 
      e.parameter.name, 
      e.parameter.email, 
      e.parameter.password, 
      e.parameter.timestamp, 
      'pending'
    ]);
  } else if (action === 'updateStatus') {
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
  
  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
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
  onManualSync
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
      alert("Error: Masukkan URL Deployment Apps Script (contoh: https://script.google.com/macros/s/.../exec).");
      return;
    }
    setDbSourceUrl(tempUrl);
    setShowDbSettings(false);
    alert("Database Source diperbarui. Melakukan sinkronisasi...");
    onManualSync();
  };

  const handleDateChange = (userId: string, newDate: string) => {
    const updated = users.map(u => u.id === userId ? { ...u, subscriptionExpiry: newDate } : u);
    setUsers(updated);
    localStorage.setItem('sf_users_db', JSON.stringify(updated));
  };

  const toggleUserActive = (userId: string) => {
    const updated = users.map(u => u.id === userId ? { ...u, isSubscribed: !u.isSubscribed } : u);
    setUsers(updated);
    localStorage.setItem('sf_users_db', JSON.stringify(updated));
  };

  const copyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    alert("Kode disalin! Tempel di Google Apps Script.");
  };

  return (
    <div className="space-y-12 animate-slide pb-20">
      <div className="bg-gray-900 p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="space-y-2">
              <h1 className="text-4xl font-black flex items-center gap-4"><Database className="text-blue-400" /> Database Dev</h1>
              <div className="flex items-center gap-3">
                 <p className="text-gray-400 font-medium">Sistem Verifikasi Pusat Socialflow.</p>
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                    <div className={`w-1.5 h-1.5 rounded-full ${dbSourceUrl ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></div>
                    <span className="text-[8px] font-black uppercase tracking-widest">{dbSourceUrl ? 'Cloud Connected' : 'Local Only'}</span>
                 </div>
              </div>
           </div>
           <div className="flex gap-4">
             <button 
               onClick={() => setShowDbSettings(!showDbSettings)}
               className={`p-4 rounded-2xl transition-all group ${showDbSettings ? 'bg-blue-500 text-white' : 'bg-white/5 border border-white/10'}`}
             >
                <Server size={20} />
             </button>
             <button 
               onClick={() => setShowScriptInfo(!showScriptInfo)}
               className={`p-4 rounded-2xl transition-all group ${showScriptInfo ? 'bg-amber-500 text-white' : 'bg-white/5 border border-white/10'}`}
             >
                <Code size={20} />
             </button>
             <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-3xl text-center backdrop-blur-md">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Pending</p>
                <p className="text-3xl font-black text-amber-400">{registrations.filter(r => r.status === 'pending').length}</p>
             </div>
           </div>
        </div>

        {showDbSettings && (
          <div className="mt-8 p-8 bg-white/5 rounded-[2.5rem] border border-white/10 animate-slide">
             <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2"><Globe size={14}/> Apps Script Web App URL</h3>
             <div className="flex gap-3">
                <input 
                  value={tempUrl} 
                  onChange={e => setTempUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/YOUR_ID/exec" 
                  className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-blue-400 transition-all text-blue-300"
                />
                <button onClick={saveDbConfig} className="px-8 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Connect</button>
             </div>
             <p className="mt-4 text-[10px] text-amber-400 flex items-center gap-2 font-bold"><Info size={14}/> Gunakan URL Web App (Deploy &gt; New Deployment) bukan URL Spreadsheet.</p>
          </div>
        )}

        {showScriptInfo && (
          <div className="mt-8 p-8 bg-white/5 rounded-[2.5rem] border border-white/10 animate-slide space-y-4">
             <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Code size={14}/> Updated Apps Script Template</h3>
                <button onClick={copyCode} className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black hover:bg-white/20 transition-all"><Copy size={14}/> Copy Code</button>
             </div>
             <pre className="p-6 bg-black/40 rounded-2xl text-[10px] font-mono text-blue-200 overflow-x-auto border border-white/5 max-h-60 custom-scrollbar leading-relaxed">
                {APPS_SCRIPT_CODE}
             </pre>
          </div>
        )}
      </div>

      {/* Registration Section */}
      <section className="space-y-6">
        <div className="flex flex-wrap justify-between items-center px-4 gap-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3">
             <RefreshCw size={16} className={`text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`}/> Antrian Verifikasi Masuk
          </h3>
          <button 
            onClick={handleRefreshDatabase}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm active:scale-95"
          >
            {isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            <span>Sync Cloud</span>
          </button>
        </div>
        
        <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm ring-1 ring-gray-100">
           <table className="w-full text-left">
              <thead className="bg-gray-50/50">
                 <tr>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Username / Email</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest">Password</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Aksi</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {registrations.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-all">
                       <td className="px-10 py-6">
                          <div>
                             <p className="text-sm font-black text-gray-900">{r.name}</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase">{r.email}</p>
                          </div>
                       </td>
                       <td className="px-10 py-6 font-mono text-[10px] text-gray-300 tracking-widest uppercase">
                          {r.password ? 'HIDDEN' : '••••••••'}
                       </td>
                       <td className="px-10 py-6">
                          <div className="flex justify-center gap-3">
                            {r.status === 'pending' ? (
                               <>
                                  <button onClick={() => onRegistrationAction(r.id, 'approved')} className="px-4 py-2 bg-emerald-100 text-emerald-600 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-200 transition-all">Approve</button>
                                  <button onClick={() => onRegistrationAction(r.id, 'rejected')} className="px-4 py-2 bg-rose-100 text-rose-600 rounded-xl text-[9px] font-black uppercase hover:bg-rose-200 transition-all">Reject</button>
                               </>
                            ) : (
                              <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${r.status === 'approved' ? 'bg-emerald-50 text-emerald-400' : 'bg-rose-50 text-rose-400'}`}>
                                {r.status}
                              </span>
                            )}
                          </div>
                       </td>
                    </tr>
                 ))}
                 {registrations.length === 0 && (
                    <tr><td colSpan={3} className="py-20 text-center text-gray-200 font-black uppercase text-xs tracking-[0.2em] italic">Belum ada pendaftaran baru.</td></tr>
                 )}
              </tbody>
           </table>
        </div>
      </section>

      {/* Active Users Section */}
      <section className="space-y-6">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center gap-3 px-4">
          <ShieldCheck size={16} className="text-emerald-500"/> Manajemen Lisensi Member
        </h3>

        <div className="bg-white rounded-[3rem] border border-gray-100 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lisensi Expired</th>
                <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Power</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                 <tr key={u.id} className="hover:bg-gray-50/50 transition-all">
                    <td className="px-10 py-8">
                       <div className="flex items-center gap-5">
                          <img src={u.avatar} className="w-14 h-14 rounded-2xl border-4 border-white shadow-lg" alt="" />
                          <div>
                             <p className="text-sm font-black text-gray-900">{u.name}</p>
                             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{u.email}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-10 py-8">
                       <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm w-fit">
                          <CalendarDays size={16} className="text-blue-400" />
                          <input type="date" value={u.subscriptionExpiry} onChange={e => handleDateChange(u.id, e.target.value)} className="bg-transparent outline-none cursor-pointer text-xs font-black text-gray-900" />
                       </div>
                    </td>
                    <td className="px-10 py-8 text-center">
                       <button 
                         onClick={() => toggleUserActive(u.id)}
                         className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest mx-auto flex items-center gap-2 shadow-sm transition-all ${
                           u.isSubscribed ? 'bg-emerald-50 text-emerald-400' : 'bg-rose-50 text-rose-400'
                         }`}
                       >
                         <Power size={14}/> {u.isSubscribed ? 'Active' : 'Blocked'}
                       </button>
                    </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default DevPortal;
