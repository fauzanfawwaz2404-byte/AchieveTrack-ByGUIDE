import React from 'react';
import { 
  LayoutDashboard, Edit, History, Flame, Target, PersonStanding, 
  HandHelping, Folder, Tags, Settings, LayoutGrid, ChartPie, 
  Database, Activity, Sun, Moon, Crown, Gem, HeartHandshake, 
  BookOpen, ChartLine, UserPlus, ChevronDown, Users, Cake, Gift, Calendar as CalendarIcon, ListTodo, MessageSquare, Send, Mail, FlaskConical, Bell, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { APP_VERSION } from '../constants';

import { User } from 'firebase/auth';

import { UserPermission } from '../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  userEmail?: string | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  userPermissions?: UserPermission[];
}

export default function Sidebar({ currentView, onNavigate, userEmail, theme, onToggleTheme, userPermissions = [] }: SidebarProps) {
  const isActuallySuperAdmin = localStorage.getItem('isSuperAdmin') === 'true' || userEmail?.toLowerCase() === 'fauzanfawwaz2404@gmail.com';
  const isAdmin = userEmail?.toLowerCase() === 'fauzanfawwaz2404@gmail.com';
  
  const currentUserPermission = userPermissions.find(p => p.email.toLowerCase() === userEmail?.toLowerCase());

  const isAllowed = (menuId: string) => {
    if (isAdmin) return true;
    if (!currentUserPermission) return false;
    
    const access = currentUserPermission.allowedMenus.find(a => 
      menuId === a.menuId || menuId.startsWith(`${a.menuId}-`)
    );

    if (!access) return false;

    // Special logic for menus that are purely for "Adding"
    if (menuId === 'input-log' || menuId === 'pcc-rfm-input') {
      return access.canAdd;
    }

    // Default to true if they are in the allowed list for other menus (viewing)
    return true;
  };

  const [expandedSections, setExpandedSections] = React.useState<string[]>([]);

  /* 
  // Dinonaktifkan sesuai permintaan: Agar menu tertutup semua saat refresh/awal masuk
  React.useEffect(() => {
    const activeItem = menuItems.find(m => m.id === currentView);
    if (activeItem && !expandedSections.includes(activeItem.section)) {
      setExpandedSections(prev => [...prev, activeItem.section]);
    }
  }, [currentView]);
  */

  const toggleSection = (name: string) => {
    setExpandedSections(prev => 
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} className="text-blue-400" />, section: 'MONITORING PROMO' },
    { id: 'input-log', label: 'Input Pencapaian', icon: <Edit size={18} className="text-emerald-400" />, section: 'MONITORING PROMO' },
    { id: 'riwayat', label: 'Riwayat Pencapaian', icon: <History size={18} className="text-orange-400" />, section: 'MONITORING PROMO' },
    { id: 'promo-berjalan', label: 'Promo Berjalan', icon: <Flame size={18} className="text-red-400" />, section: 'MONITORING PROMO' },
    { id: 'target-sdm', label: 'Target Per SDM', icon: <Target size={18} className="text-pink-400" />, section: 'MONITORING PROMO' },
    
    { id: 'driver-wic', label: 'Driver WIC', icon: <PersonStanding size={18} className="text-indigo-400" />, section: 'DRIVER WIC' },
    { id: 'upaya-cc', label: 'Upaya CC', icon: <HandHelping size={18} className="text-amber-400" />, section: 'DRIVER WIC' },
    
    { id: 'pcc-rfm-dashboard', label: 'Dashboard', icon: <ChartLine size={18} className="text-blue-400" />, section: 'PCC & RFM' },
    { id: 'pcc-rfm-input', label: 'Tambah Data', icon: <UserPlus size={18} className="text-emerald-400" />, section: 'PCC & RFM' },
    { id: 'pcc-rfm-data-pcc', label: 'Data PCC', icon: <Crown size={18} className="text-amber-400" />, section: 'PCC & RFM' },
    { id: 'pcc-rfm-data-rfm', label: 'Data RFM', icon: <Gem size={18} className="text-purple-400" />, section: 'PCC & RFM' },
    { id: 'pcc-rfm-care', label: 'Perawatan Pelanggan', icon: <HeartHandshake size={18} className="text-pink-400" />, section: 'PCC & RFM' },
    { id: 'pcc-rfm-guide', label: 'Panduan Import', icon: <BookOpen size={18} className="text-slate-400" />, section: 'PCC & RFM' },
    
    { id: 'ultah-pelanggan-all', label: 'Ultah Pelanggan', icon: <Users size={18} className="text-pink-400" />, section: 'ULTAH PELANGGAN' },
    { id: 'ultah-pelanggan-today', label: 'Ultah Hari Ini', icon: <Cake size={18} className="text-pink-500" />, section: 'ULTAH PELANGGAN' },
    { id: 'ultah-pelanggan-tomorrow', label: 'Ultah Besok', icon: <Gift size={18} className="text-pink-400" />, section: 'ULTAH PELANGGAN' },

    { id: 'wa-personal-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} className="text-blue-400" />, section: 'WA PERSONAL (CC)' },
    { id: 'wa-personal-target', label: 'Target WA', icon: <Send size={18} className="text-amber-400" />, section: 'WA PERSONAL (CC)' },
    { id: 'wa-personal-setup', label: 'Setup Pesan & Target', icon: <Settings size={18} className="text-emerald-400" />, section: 'WA PERSONAL (CC)' },
    
    { id: 'wa-cbg-dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} className="text-blue-400" />, section: 'WA PERSONAL (SDM CABANG)' },
    { id: 'wa-cbg-target', label: 'Target WA', icon: <Send size={18} className="text-amber-400" />, section: 'WA PERSONAL (SDM CABANG)' },
    { id: 'wa-cbg-setup', label: 'Setup Pesan & Target', icon: <Settings size={18} className="text-emerald-400" />, section: 'WA PERSONAL (SDM CABANG)' },
    { id: 'wa-cbg-rules', label: 'Info & Aturan', icon: <BookOpen size={18} className="text-indigo-400" />, section: 'WA PERSONAL (SDM CABANG)' },

    { id: 'bhf-upaya', label: 'Upaya', icon: <HandHelping size={18} className="text-emerald-400" />, section: 'BHF & HKN' },
    { id: 'bhf-pemantauan', label: 'Pemantauan', icon: <ChartPie size={18} className="text-blue-400" />, section: 'BHF & HKN' },
    { id: 'bhf-kelompok', label: 'Kelompok BHF', icon: <Users size={18} className="text-amber-400" />, section: 'BHF & HKN' },
    
    { id: 'test-lab', label: 'Test Lab', icon: <FlaskConical size={18} className="text-blue-400" />, section: 'TEST LAB / PANEL' },
    { id: 'panel-lab', label: 'Panel', icon: <BookOpen size={18} className="text-emerald-400" />, section: 'TEST LAB / PANEL' },
    { id: 'wshp-lab', label: 'WSHP', icon: <Folder size={18} className="text-amber-400" />, section: 'TEST LAB / PANEL' },
    { id: 'calc-lab', label: 'Kalkulator', icon: <LayoutDashboard size={18} className="text-amber-400" />, section: 'TEST LAB / PANEL' },
    { id: 'settings-lab', label: 'Pengaturan', icon: <Settings size={18} className="text-purple-400" />, section: 'TEST LAB / PANEL' },

    { id: 'calendar-schedules', label: 'Jadwal / Tugas', icon: <ListTodo size={18} className="text-brand-500" />, section: 'MY CALENDER' },

    { id: 'my-links-favorites', label: 'Favorit', icon: <Folder size={18} className="text-blue-400" />, section: 'MY LINKS' },

    { id: 'admin-kategori', label: 'Master Kategori', icon: <Folder size={18} className="text-slate-400" />, section: 'MASTER DATA' },
    { id: 'admin-promo', label: 'Master Promo/Item', icon: <Tags size={18} className="text-slate-400" />, section: 'MASTER DATA' },
    { id: 'admin-target', label: 'Setup Target Petugas', icon: <Settings size={18} className="text-slate-400" />, section: 'MASTER DATA' },
    { id: 'broadcast', label: 'Broadcast Pengumuman', icon: <Bell size={18} className="text-amber-500" />, section: 'MASTER DATA' },
    { id: 'setup-user', label: 'Setup User Access', icon: <Mail size={18} className="text-amber-400" />, section: 'MASTER DATA' },
    
    { id: 'about-fitur', label: 'Fitur Aplikasi', icon: <BookOpen size={18} className="text-brand-400" />, section: 'ABOUT' },
    { id: 'about-version', label: 'Versi Aplikasi', icon: <Activity size={18} className="text-slate-400" />, section: 'ABOUT' },
    { id: 'about-support', label: 'Kontak / Support', icon: <HeartHandshake size={18} className="text-rose-400" />, section: 'ABOUT' },

    { id: 'activity-logs', label: 'User Activity', icon: <Activity size={18} className="text-brand-400" />, section: 'LOG AKTIVITAS' },
  ];

  const sections = [
    { name: 'MONITORING PROMO', icon: <ChartPie size={14} className="text-orange-400" /> },
    { name: 'DRIVER WIC', icon: <Activity size={14} className="text-indigo-400" /> },
    { name: 'PCC & RFM', icon: <Crown size={14} className="text-amber-400" />, id: 'pcc-rfm' },
    { name: 'ULTAH PELANGGAN', icon: <Cake size={14} className="text-pink-500" />, id: 'ultah-pelanggan' },
    { name: 'WA PERSONAL (CC)', icon: <MessageSquare size={14} className="text-emerald-400" />, id: 'wa-personal' },
    { name: 'WA PERSONAL (SDM CABANG)', icon: <MessageSquare size={14} className="text-blue-400" />, id: 'wa-cbg' },
    { name: 'BHF & HKN', icon: <Crown size={14} className="text-amber-500" />, id: 'bhf-hkn' },
    { name: 'TEST LAB / PANEL', icon: <FlaskConical size={14} className="text-blue-400" />, id: 'test-lab-panel' },
    { name: 'MY CALENDER', icon: <CalendarIcon size={14} className="text-brand-400" />, id: 'calendar-schedules' },
    { name: 'MY LINKS', icon: <BookOpen size={14} className="text-blue-400" />, id: 'my-links-favorites' },
    { name: 'MASTER DATA', icon: <Database size={14} className="text-slate-400" />, id: 'master-data' },
    { name: 'ABOUT', icon: <BookOpen size={14} className="text-brand-400" /> },
    { name: 'LOG AKTIVITAS', icon: <Terminal size={14} className="text-brand-500" />, id: 'activity-logs' }
  ].filter(s => {
    // If section has a representative ID, check permission
    if (s.id === 'master-data') {
       // Only if user has access to at least one master data item
       return isAdmin || menuItems.filter(m => m.section === 'MASTER DATA').some(m => isAllowed(m.id));
    }
    if (s.id === 'bhf-hkn') {
       return isAdmin || isAllowed('bhf-hkn') || menuItems.filter(m => m.section === 'BHF & HKN').some(m => isAllowed(m.id));
    }
    if (s.id) return isAllowed(s.id);
    
    // Otherwise check if any menu items in this section are allowed
    return menuItems.filter(m => m.section === s.name).some(m => isAllowed(m.id));
  });

  return (
    <div className="drawer-side">
      <label htmlFor="main-drawer" className="drawer-overlay"></label>
      <div className="w-72 min-h-full glass flex flex-col border-r border-white/5 bg-main-bg/95 transition-colors duration-300">
        <div className="p-8 text-center border-b border-white/5 bg-black/20">
          <img 
            src="https://blogger.googleusercontent.com/img/a/AVvXsEjiMURwHZOik_Becsx8q5DHu4biVp1rmStKh3wu3S6KbB21YR8Hk6xWsiO-Bz73m0U_XUFAq07wpAE-aAwG_6WlpVjEq9z5DpFRhVtLmRZbdgcf_AJwUCxXiSAWkZaPa1UPvtnvnDKHasjFy6bMPXtsLV91PtWDIt7r7JVefjikWk1ch-pRBn-8YKwIFwF6" 
            alt="Logo" 
            className={`w-20 mx-auto mb-2 ${theme === 'dark' ? 'mix-blend-lighten' : 'brightness-90'}`} 
          />
          <p className="text-[10px] font-black tracking-[0.3em] text-main-text opacity-80 uppercase leading-none">Customer Care Depok</p>
          <div className="mt-1 text-[8px] font-black tracking-[0.5em] text-amber-500 uppercase opacity-60">AchieveTrack 2026</div>
        </div>

        <ul className="menu p-4 gap-2 flex-grow overflow-y-auto custom-scrollbar">
          {sections.map(section => {
            const isExpanded = expandedSections.includes(section.name);
            return (
              <li key={section.name} className="flex flex-col gap-1">
                <button 
                  onClick={() => toggleSection(section.name)}
                  className={`flex items-center justify-between w-full h-12 px-4 rounded-xl transition-all duration-300 ${isExpanded ? 'bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10' : 'hover:bg-black/5 dark:hover:bg-white/5 hover:border-transparent'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-black/10 dark:bg-black/30 border border-black/5 dark:border-white/5 transition-all ${isExpanded ? 'scale-110 shadow-[0_0_15px_rgba(251,191,36,0.2)] border-amber-500/40' : ''}`}>
                        {section.icon}
                    </div>
                    <span className={`text-[12px] font-black uppercase tracking-widest transition-colors ${isExpanded ? 'text-main-text opacity-100' : 'text-main-text opacity-70'}`}>
                      {section.name}
                    </span>
                  </div>
                  <ChevronDown size={14} className={`text-main-text opacity-40 transition-transform duration-500 ${isExpanded ? 'rotate-180 text-amber-500 dark:text-amber-400 opacity-100' : ''}`} />
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.ul 
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="ml-4 pl-4 border-l border-amber-500/30 flex flex-col gap-1 mt-1 overflow-hidden"
                    >
                      {menuItems.filter(m => m.section === section.name && isAllowed(m.id)).map(item => (
                        <li key={item.id}>
                          <button 
                            onClick={() => onNavigate(item.id)}
                            className={`flex items-center gap-3 h-10 px-4 rounded-xl transition-all text-[11px] font-black group ${currentView === item.id ? 'bg-amber-500 dark:bg-amber-400 text-white dark:text-black shadow-lg shadow-amber-500/30' : 'text-main-text opacity-75 hover:bg-black/5 dark:hover:bg-white/5 hover:text-main-text hover:opacity-100'}`}
                          >
                            <span className={`transition-transform duration-300 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110 group-hover:text-amber-500'}`}>
                                {item.icon}
                            </span>
                            <span className="tracking-tight uppercase">{item.label}</span>
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>

        <div className="p-3 border-t border-white/5 bg-black/10 text-center">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-main-text opacity-30">AchieveTrack v{APP_VERSION}</p>
        </div>
      </div>
    </div>
  );
}
