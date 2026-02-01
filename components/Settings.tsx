
import React from 'react';
import { Palette, ImageIcon, Sun, Layout, Pipette, Globe, Server } from 'lucide-react';

interface SettingsProps {
  primaryColorHex: string; setPrimaryColorHex: (color: string) => void;
  accentColorHex: string; setAccentColorHex: (color: string) => void;
  fontSize: 'small' | 'medium' | 'large'; setFontSize: (size: 'small' | 'medium' | 'large') => void;
  customLogo: string | null; setCustomLogo: (logo: string | null) => void;
  dbSourceUrl?: string; setDbSourceUrl?: (url: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  primaryColorHex, setPrimaryColorHex, 
  accentColorHex, setAccentColorHex,
  fontSize, setFontSize, 
  customLogo, setCustomLogo,
  dbSourceUrl, setDbSourceUrl
}) => {
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCustomLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const SettingRow = ({ icon: Icon, title, desc, children }: any) => (
    <div className="flex items-center justify-between py-6 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
          <Icon size={18} />
        </div>
        <div className="max-w-[300px]">
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {children}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto py-10 space-y-12 animate-slide">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Preferences</h1>
        <p className="text-gray-400 text-sm font-medium">Kustomisasi ambience workspace sesuai identitas brand Anda.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-sm space-y-2">
        <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-4">Branding & Colors</h3>
        
        <SettingRow icon={Pipette} title="Primary Workspace Color" desc="Warna utama aplikasi (Ambience)">
          <div className="flex items-center gap-3">
            <input type="color" value={primaryColorHex} onChange={(e) => setPrimaryColorHex(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" />
            <span className="text-xs font-mono font-bold text-gray-400">{primaryColorHex.toUpperCase()}</span>
          </div>
        </SettingRow>

        <SettingRow icon={ImageIcon} title="Sidebar Brand Logo" desc="Logo kustom menggantikan teks Socialflow">
          <div className="flex items-center gap-3">
            {customLogo && <img src={customLogo} className="w-8 h-8 object-contain rounded-lg border border-gray-100" />}
            <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 cursor-pointer hover:underline">
              Upload Logo
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
            </label>
            {customLogo && <button onClick={() => setCustomLogo(null)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-2">Reset</button>}
          </div>
        </SettingRow>

        <SettingRow icon={Layout} title="Interface Scale" desc="Ukuran teks workspace">
           <div className="flex bg-gray-50 p-1 rounded-xl">
              {(['small', 'medium', 'large'] as const).map(s => (
                <button key={s} onClick={() => setFontSize(s)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase ${fontSize === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}>
                   {s}
                </button>
              ))}
           </div>
        </SettingRow>

        {setDbSourceUrl && (
          <div className="pt-8 mt-6 border-t border-gray-100">
            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-6">Database Connectivity</h3>
            <SettingRow icon={Globe} title="Cloud Database URL" desc="Google Sheets Apps Script URL untuk sinkronisasi multi-perangkat">
              <input 
                type="text" 
                value={dbSourceUrl || ''} 
                onChange={(e) => setDbSourceUrl(e.target.value)}
                className="w-64 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="https://script.google.com/..."
              />
            </SettingRow>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
