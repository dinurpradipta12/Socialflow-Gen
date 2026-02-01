
import React from 'react';
import { Palette, ImageIcon, Moon, Sun, Layout, Monitor, Check, Pipette } from 'lucide-react';

interface SettingsProps {
  primaryColorHex: string; setPrimaryColorHex: (color: string) => void;
  accentColorHex: string; setAccentColorHex: (color: string) => void;
  fontSize: 'small' | 'medium' | 'large'; setFontSize: (size: 'small' | 'medium' | 'large') => void;
  darkMode: boolean; setDarkMode: (dark: boolean) => void;
  customLogo: string | null; setCustomLogo: (logo: string | null) => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  primaryColorHex, setPrimaryColorHex, 
  accentColorHex, setAccentColorHex,
  fontSize, setFontSize, 
  darkMode, setDarkMode,
  customLogo, setCustomLogo 
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
    <div className="flex items-center justify-between py-6 border-b border-gray-100 dark:border-slate-800 last:border-0">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-gray-400">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{title}</p>
          <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {children}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-12 animate-slide">
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Preferences</h1>
        <p className="text-gray-400 text-sm font-medium">Kustomisasi ambience workspace sesuai identitas brand Anda.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 p-10 shadow-sm space-y-2">
        <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-4">Branding & Colors</h3>
        
        <SettingRow icon={Pipette} title="Primary Workspace Color" desc="Warna utama aplikasi (Ambience)">
          <div className="flex items-center gap-3">
            <input type="color" value={primaryColorHex} onChange={(e) => setPrimaryColorHex(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" />
            <span className="text-xs font-mono font-bold text-gray-400">{primaryColorHex.toUpperCase()}</span>
          </div>
        </SettingRow>

        <SettingRow icon={Pipette} title="Accent/Secondary Color" desc="Warna elemen penunjang">
          <div className="flex items-center gap-3">
            <input type="color" value={accentColorHex} onChange={(e) => setAccentColorHex(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent" />
            <span className="text-xs font-mono font-bold text-gray-400">{accentColorHex.toUpperCase()}</span>
          </div>
        </SettingRow>

        <SettingRow icon={ImageIcon} title="Sidebar Brand Logo" desc="Logo kustom menggantikan teks Socialflow">
          <div className="flex items-center gap-3">
            {customLogo && <img src={customLogo} className="w-8 h-8 object-contain rounded-lg border border-gray-100" />}
            <label className="text-[10px] font-black uppercase tracking-widest text-blue-600 cursor-pointer hover:underline">
              Upload Logo
              <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
            </label>
            {customLogo && <button onClick={() => setCustomLogo(null)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Reset</button>}
          </div>
        </SettingRow>

        <SettingRow icon={darkMode ? Moon : Sun} title="Dark Mode" desc="Aktifkan mode malam seluruh halaman">
          <button onClick={() => setDarkMode(!darkMode)} className={`w-12 h-6 rounded-full relative transition-all ${darkMode ? 'bg-[var(--primary-color)]' : 'bg-gray-200'}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${darkMode ? 'left-7' : 'left-1'}`}></div>
          </button>
        </SettingRow>

        <SettingRow icon={Layout} title="Interface Scale" desc="Ukuran teks workspace">
           <div className="flex bg-gray-50 dark:bg-slate-800 p-1 rounded-xl">
              {(['small', 'medium', 'large'] as const).map(s => (
                <button key={s} onClick={() => setFontSize(s)} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase ${fontSize === s ? 'bg-white dark:bg-slate-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                   {s}
                </button>
              ))}
           </div>
        </SettingRow>
      </div>
    </div>
  );
};

export default Settings;
