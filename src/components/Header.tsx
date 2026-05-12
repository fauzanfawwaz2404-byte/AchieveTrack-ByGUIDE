import React, { useState, useEffect } from 'react';
import { Menu, LogOut, User as UserIcon, Sun, Moon, Smartphone, Monitor, RefreshCw, Eye, EyeOff, Sparkles } from 'lucide-react';
import { User } from 'firebase/auth';
import { UserPermission } from '../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  layoutMode: 'web' | 'mobile';
  onToggleLayout: () => void;
  onRefresh?: () => void;
  impersonatedEmail?: string | null;
  onImpersonate?: (email: string | null) => void;
  userPermissions?: UserPermission[];
  isSuperAdmin?: boolean;
}

export default function Header({ 
  user, onLogout, theme, onToggleTheme, layoutMode, onToggleLayout, onRefresh,
  impersonatedEmail, onImpersonate, userPermissions = [], isSuperAdmin 
}: HeaderProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <header className={`navbar glass sticky top-0 z-30 px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-4 flex justify-between items-center border-b border-warning/10 min-h-[56px] md:min-h-[80px]`}>
      <div className="flex items-center gap-1 sm:gap-2 md:gap-4 overflow-hidden flex-shrink">
        <label 
          htmlFor="main-drawer" 
          className={`btn btn-ghost btn-xs sm:btn-sm md:btn-md h-8 w-8 min-h-0 sm:h-auto sm:w-auto ${layoutMode === 'web' ? 'lg:hidden' : ''}`}
        >
          <Menu className="text-sm sm:text-lg md:text-xl text-amber-400" />
        </label>
        <div className="max-w-[80px] min-[360px]:max-w-[120px] sm:max-w-none">
          <h1 className="text-[10px] min-[360px]:text-sm sm:text-lg md:text-xl font-black gradient-text tracking-tighter uppercase whitespace-nowrap overflow-hidden text-ellipsis italic">ACHIEVETRACK</h1>
          <p className="text-[6px] sm:text-[9px] md:text-[10px] opacity-60 tracking-widest uppercase hidden sm:block">DEPOK PERFORMANCE MONITOR 2026</p>
        </div>
      </div>
      
      <div className="flex items-center gap-1 sm:gap-3 md:gap-6 flex-shrink-0">
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
          <div className="flex flex-col items-end min-w-0">
            <div id="real-time-clock" className="text-xs min-[360px]:text-sm sm:text-xl md:text-2xl font-mono font-black text-warning leading-none">
              {time.toLocaleTimeString('id-ID', { hour12: false })}
            </div>
            <div id="real-time-date" className="text-[5px] min-[360px]:text-[7px] sm:text-[9px] md:text-[11px] font-bold opacity-60 uppercase tracking-tighter mt-0.5 whitespace-nowrap hidden min-[320px]:block">
              {formatDate(time)}
            </div>
          </div>

          <div className="flex gap-0.5 sm:gap-1 md:gap-2">
            <button 
              onClick={onToggleTheme}
              className="btn btn-ghost btn-circle btn-[10px] sm:btn-sm h-7 w-7 min-h-0 sm:h-auto sm:w-auto border border-white/20 hover:bg-white/5 transition-all text-amber-400"
              title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            >
              {theme === 'dark' ? <Sun size={12} className="md:w-5 md:h-5" /> : <Moon size={12} className="md:w-5 md:h-5" />}
            </button>

            <button 
              onClick={onToggleLayout}
              className="btn btn-ghost btn-circle btn-[10px] sm:btn-sm h-7 w-7 min-h-0 sm:h-auto sm:w-auto border border-white/20 hover:bg-white/5 transition-all text-blue-400"
              title={layoutMode === 'web' ? 'Beralih ke Mode HP' : 'Beralih ke Mode WEB'}
            >
              {layoutMode === 'web' ? <Smartphone size={12} className="md:w-5 md:h-5" /> : <Monitor size={12} className="md:w-5 md:h-5" />}
            </button>

            {onRefresh && (
              <button 
                onClick={onRefresh}
                className="btn btn-ghost btn-circle btn-[10px] sm:btn-sm h-7 w-7 min-h-0 sm:h-auto sm:w-auto border border-white/20 hover:bg-white/5 transition-all text-emerald-400"
                title="Refresh Data"
              >
                <RefreshCw size={12} className="md:w-5 md:h-5" />
              </button>
            )}
          </div>
        </div>

        {user && (
          <div className="dropdown dropdown-end ml-1">
            <label tabIndex={0} className="btn btn-ghost btn-circle btn-xs sm:btn-sm md:btn-md avatar border-warning/20 p-0.5">
              <div className="w-6 sm:w-8 md:w-10 rounded-full">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" />
                ) : (
                  <div className="w-full h-full bg-amber-500 flex items-center justify-center text-white">
                    <UserIcon size={14} className="md:w-5 md:h-5" />
                  </div>
                )}
              </div>
            </label>
            <ul tabIndex={0} className="mt-3 z-[40] p-2 shadow-2xl menu menu-sm dropdown-content bg-slate-900 border border-warning/20 rounded-2xl w-52 text-(--text-color)">
              <li className="px-4 py-2 opacity-50 text-[10px] uppercase font-bold tracking-widest">Logged In As</li>
              <li className="px-4 pb-2 mb-2 border-b border-warning/10">
                <span className="text-amber-400 font-bold p-0">{user.displayName}</span>
                <span className="text-[9px] truncate opacity-50 p-0">{user.email}</span>
                {impersonatedEmail && (
                  <div className="mt-2 p-1 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2">
                    <Eye size={10} className="text-emerald-400" />
                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter">Preview Aktif</span>
                  </div>
                )}
              </li>

              {isSuperAdmin && onImpersonate && (
                <>
                  <li className="px-4 py-1 opacity-50 text-[10px] uppercase font-bold tracking-widest flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Sparkles size={12} className="text-amber-500" /> SIMULASI USER
                  </li>
                  <li className="px-2 mb-2" onClick={(e) => e.stopPropagation()}>
                    <select 
                      className="select select-bordered select-xs w-full bg-slate-800 border-warning/20 text-xs h-8 focus:outline-none focus:border-emerald-500 transition-colors"
                      value={impersonatedEmail || ''}
                      onChange={(e) => {
                        onImpersonate(e.target.value || null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">-- KEMBALI KE ADMIN --</option>
                      {[...userPermissions]
                        .filter(p => !!p.email && p.email.toLowerCase() !== user.email?.toLowerCase())
                        .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                        .map(p => (
                          <option key={p.email} value={p.email}>{(p.name || p.email.split('@')[0]).toUpperCase()}</option>
                      ))}
                    </select>
                  </li>
                  {impersonatedEmail && (
                    <li className="mb-2" onClick={(e) => e.stopPropagation()}>
                      <div className="px-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onImpersonate(null);
                          }}
                          className="w-full text-emerald-400 hover:bg-emerald-400/20 flex items-center gap-2 bg-emerald-400/10 py-1.5 rounded-lg justify-center text-[10px] font-bold border border-emerald-400/30"
                        >
                          <EyeOff size={12} /> STOP PREVIEW
                        </button>
                      </div>
                    </li>
                  )}
                  <div className="divider opacity-10 my-0"></div>
                </>
              )}
              <li>
                <button onClick={onLogout} className="text-error font-bold hover:bg-error/10 flex items-center gap-2">
                  <LogOut size={16} /> KELUAR SISTEM
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
