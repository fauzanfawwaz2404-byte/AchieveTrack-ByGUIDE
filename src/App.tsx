import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth } from './firebase';
import { PETUGAS_LIST, INITIAL_UPAYA_CATS } from './constants';
// ... existing imports
import { LogOut, LogIn, Sparkles, RefreshCw, Monitor, ShieldCheck, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import InputLog from './components/InputLog';
import Riwayat from './components/Riwayat';
import PromoBerjalan from './components/PromoBerjalan';
import DriverWIC from './components/DriverWIC';
import TargetSDM from './components/TargetSDM';
import AdminKategori from './components/AdminKategori';
import AdminPromo from './components/AdminPromo';
import AdminTarget from './components/AdminTarget';
import UpayaCCView from './components/UpayaCC';
import PCCRFM from './components/PCCRFM';
import MyLinks from './components/MyLinks';
import BirthdayManager from './components/BirthdayManager';
import MyCalendar from './components/MyCalendar';
import ProfilePicker from './components/ProfilePicker';
import WAPersonalDashboard from './components/WAPersonalDashboard';
import WAPersonalTarget from './components/WAPersonalTarget';
import WAPersonalSetup from './components/WAPersonalSetup';
import WACBGDashboard from './components/WACBGDashboard';
import WACBGTarget from './components/WACBGTarget';
import WACBGSetup from './components/WACBGSetup';
import WACBGRules from './components/WACBGRules';
import SetupUser from './components/SetupUser';
import AboutFitur from './components/AboutFitur';
import AboutVersion from './components/AboutVersion';
import AboutSupport from './components/AboutSupport';
import BHFUpaya from './components/BHFUpaya';
import BHFPemantauan from './components/BHFPemantauan';
import BHFKelompok from './components/BHFKelompok';
import TestLabManager from './components/TestLabManager';
import PanelManager from './components/PanelManager';
import LabCalculator from './components/LabCalculator';
import LabSettings from './components/LabSettings';
import WSHPManager from './components/WSHPManager';
import AnnouncementManager from './components/AnnouncementManager';
import AnnouncementPopup, { Announcement } from './components/AnnouncementPopup';
import ActivityLogs from './components/ActivityLogs';
import { useFirebaseSync } from './hooks/useFirebaseSync';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { logActivity, clearOldLogs } from './services/activityService';
import { Transaksi, WATarget, WASetup, WACampaignSummary } from './types';
import { APP_VERSION } from './constants';
import { safeStorage, safeSessionStorage } from './lib/storage';

// Register Service Worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      // Force update check on every load
      registration.update();
    }).catch(err => {
      console.log('SW registration failed: ', err);
    });
  });
}

// Memoized Components for Performance
const MemoDashboard = React.memo(Dashboard);
const MemoInputLog = React.memo(InputLog);
const MemoRiwayat = React.memo(Riwayat);
const MemoPromoBerjalan = React.memo(PromoBerjalan);
const MemoTargetSDM = React.memo(TargetSDM);
const MemoDriverWIC = React.memo(DriverWIC);
const MemoUpayaCC = React.memo(UpayaCCView);
const MemoPCCRFM = React.memo(PCCRFM);
const MemoBirthdayManager = React.memo(BirthdayManager);
const MemoWAPersonalDashboard = React.memo(WAPersonalDashboard);
const MemoWAPersonalTarget = React.memo(WAPersonalTarget);
const MemoWAPersonalSetup = React.memo(WAPersonalSetup);
const MemoWACBGDashboard = React.memo(WACBGDashboard);
const MemoWACBGTarget = React.memo(WACBGTarget);
const MemoWACBGSetup = React.memo(WACBGSetup);
const MemoBHFUpaya = React.memo(BHFUpaya);
const MemoBHFPemantauan = React.memo(BHFPemantauan);
const MemoBHFKelompok = React.memo(BHFKelompok);
const MemoTestLabManager = React.memo(TestLabManager);
const MemoPanelManager = React.memo(PanelManager);
const MemoWSHPManager = React.memo(WSHPManager);
const MemoLabCalculator = React.memo(LabCalculator);
const MemoLabSettings = React.memo(LabSettings);
const MemoMyCalendar = React.memo(MyCalendar);
const MemoMyLinks = React.memo(MyLinks);
const MemoAnnouncementManager = React.memo(AnnouncementManager);
const MemoSetupUser = React.memo(SetupUser);

// DAFTAR EMAIL YANG DIIZINKAN (Whitelist & Role Mapping)
const ADMIN_EMAILS = ['fauzanfawwaz2404@gmail.com'];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [impersonatedEmail, setImpersonatedEmail] = useState<string | null>(null);

  // Auto-Update Logic (Cache Buster)
  useEffect(() => {
    const lastVersion = safeStorage.getItem('app_version');
    if (lastVersion && lastVersion !== APP_VERSION) {
      console.log(`Version change detected: ${lastVersion} -> ${APP_VERSION}. Forcing reload...`);
      
      // Stop and unregister all service workers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (let registration of registrations) {
            registration.unregister();
          }
        });
      }
      
      // Clear all caches
      if ('caches' in window) {
        caches.keys().then(names => {
          for (let name of names) caches.delete(name);
        });
      }

      // Update version in storage and force hard reload
      safeStorage.setItem('app_version', APP_VERSION);
      setTimeout(() => window.location.reload(), 500);
    } else if (!lastVersion) {
      safeStorage.setItem('app_version', APP_VERSION);
    }
  }, []);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (safeStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });
  const [layoutMode, setLayoutMode] = useState<'web' | 'mobile'>(() => {
    return (safeStorage.getItem('layoutMode') as 'web' | 'mobile') || 'web';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    safeStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    safeStorage.setItem('layoutMode', layoutMode);
  }, [layoutMode]);

  const toggleTheme = () => setTheme(p => p === 'dark' ? 'light' : 'dark');
  const toggleLayout = () => setLayoutMode(p => p === 'web' ? 'mobile' : 'web');
  const {
    kategori,
    promos,
    transaksi,
    driverWicData,
    upayaData,
    upayaCategories,
    targetPerPetugas,
    pccrfmRecords,
    favoriteLinks,
    birthdayRecords,
    calendarActivities,
    waSetup,
    waTargets,
    waHistory,
    waCampaigns,
    waSetupCBG,
    waSetupsCBG,
    waTargetsCBG,
    waHistoryCBG,
    waCampaignsCBG,
    staffCBG,
    waBlacklist,
    userPermissions,
    appDocs,
    bhfUpaya,
    bhfIssues,
    bhfMembers,
    bhfGroups,
    testLabs,
    panels,
    wshps,
    userProfile,
    saveData,
    loading,
    refresh
  } = useFirebaseSync(user, impersonatedEmail);

  const isSuperAdmin = user?.email === 'fauzanfawwaz2404@gmail.com';
  const targetEmail = impersonatedEmail || user?.email || '';

  const userDisplayName = targetEmail && ADMIN_EMAILS.includes(targetEmail)
    ? 'Admin Utama' 
    : (userPermissions.find(p => p.email.toLowerCase() === targetEmail.toLowerCase())?.name || userProfile?.displayName || 'Petugas');

  const [editingTransaction, setEditingTransaction] = useState<Transaksi | null>(null);
  const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  useEffect(() => {
    // Auto-sync Upaya Categories to ensure latest items like CETAK SARANA PROMOSI are present
    if (user && user.email === 'fauzanfawwaz2404@gmail.com' && upayaCategories.length > 0) {
      const missingCats = INITIAL_UPAYA_CATS.filter((cat: string) => !upayaCategories.includes(cat));
      if (missingCats.length > 0) {
        saveData.upayaCats([...upayaCategories, ...missingCats]);
      }
    }
  }, [user, upayaCategories, saveData]);

  // DAFTAR MENU UNTUK PERMISSION
  const AVAILABLE_MENUS = [
    { id: 'dashboard', label: 'MONITORING PROMO' },
    { id: 'input-log', label: 'INPUT LOG' },
    { id: 'riwayat', label: 'RIWAYAT' },
    { id: 'promo-berjalan', label: 'PROMO BERJALAN' },
    { id: 'target-sdm', label: 'TARGET SDM' },
    { id: 'driver-wic', label: 'DRIVER WIC' },
    { id: 'upaya-cc', label: 'UPAYA CC/SALES' },
    { id: 'pcc-rfm', label: 'PCC & RFM' },
    { id: 'ultah-pelanggan', label: 'ULTAH PELANGGAN' },
    { id: 'wa-personal', label: 'WA PERSONAL (CC)' },
    { id: 'wa-cbg', label: 'WA PERSONAL (SDM CABANG)' },
    { id: 'wa-cbg-rules', label: 'WA CBG (INFO & ATURAN)' },
    { id: 'bhf-upaya', label: 'BHF UPAYA' },
    { id: 'bhf-pemantauan', label: 'BHF PEMANTAUAN' },
    { id: 'bhf-kelompok', label: 'BHF KELOMPOK' },
    { id: 'test-lab', label: 'TEST LAB' },
    { id: 'panel-lab', label: 'PANEL' },
    { id: 'wshp-lab', label: 'WSHP' },
    { id: 'calc-lab', label: 'KALKULATOR' },
    { id: 'settings-lab', label: 'PENGATURAN LAB' },
    { id: 'calendar-schedules', label: 'MY CALENDAR' },
    { id: 'my-links-favorites', label: 'MY LINKS' },
    { id: 'admin-kategori', label: 'ADMIN KATEGORI' },
    { id: 'admin-promo', label: 'ADMIN PROMO' },
    { id: 'admin-target', label: 'ADMIN TARGET' },
    { id: 'broadcast', label: 'BROADCAST PENGUMUMAN' },
    { id: 'setup-user', label: 'SETUP USER' },
    { id: 'about-fitur', label: 'TENTANG FITUR' },
    { id: 'about-version', label: 'VERSI APLIKASI' },
    { id: 'about-support', label: 'KONTAK SUPPORT' },
    { id: 'activity-logs', label: 'USER ACTIVITY LOG' },
  ];
  
  const currentUserAccess = userPermissions.find(p => p.email.toLowerCase() === user?.email?.toLowerCase());

  const getPermission = (menuId: string) => {
    const userEmailForPerms = user?.email?.toLowerCase();
    const isActuallySuperAdmin = userEmailForPerms === 'fauzanfawwaz2404@gmail.com';
    
    // Super admin menus that should ALWAYS be visible to super admin even during impersonation
    const superAdminOnlyMenus = ['test-lab', 'panel-lab', 'wshp-lab', 'settings-lab', 'admin-kategori', 'admin-promo', 'admin-target', 'setup-user', 'broadcast', 'activity-logs'];
    
    if (isActuallySuperAdmin && superAdminOnlyMenus.includes(menuId)) {
      return { canAdd: true, canEdit: true, canDelete: true, isAdmin: true };
    }

    // Determine whose permission we are looking at
    const effectiveEmail = impersonatedEmail?.toLowerCase() || userEmailForPerms;
    const access = userPermissions.find(p => p.email.toLowerCase() === effectiveEmail)?.allowedMenus.find(m => m.menuId === menuId || (menuId.startsWith('wa-cbg-') && m.menuId === 'wa-cbg'));
    
    // If super admin is NOT impersonating, they get everything
    if (isActuallySuperAdmin && !impersonatedEmail) {
      return { canAdd: true, canEdit: true, canDelete: true, isAdmin: true };
    }

    // Special case for BHF Upaya: all members can add by default if not specified otherwise
    if (menuId === 'bhf-upaya' && effectiveEmail && !access) {
      return { canAdd: true, canEdit: false, canDelete: false, isAdmin: false };
    }
    
    return {
      canAdd: access?.canAdd || false,
      canEdit: access?.canEdit || false,
      canDelete: access?.canDelete || false,
      isAdmin: false
    };
  };

  // 1. Separate Auth Change Listener (Runs once on mount)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      
      if (u) {
        const displayName = u.email === 'fauzanfawwaz2404@gmail.com' ? 'Admin Utama' : (u.displayName || u.email || 'User');
        logActivity(u, displayName, 'Login ke Aplikasi', 'Auto', 'Sesi Otentikasi Berhasil');
      }
    });

    // Run cleanup once on app start
    clearOldLogs();

    return () => unsub();
  }, []);

  // Announcement Listener
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'announcements'),
      where('active', '==', true)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Sort in memory to avoid composite index requirement
        const docs = snapshot.docs.map(doc => ({ 
          ...(doc.data() as Announcement), 
          id: doc.id 
        }));
        
        const latestAnnouncement = docs.sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        })[0];

        if (latestAnnouncement) {
          const lastSeen = localStorage.getItem('last_announcement_id');
          if (lastSeen !== latestAnnouncement.id) {
            setActiveAnnouncement(latestAnnouncement);
            setShowAnnouncement(true);
          }
        }
      }
    });

    return () => unsub();
  }, [user]);

  const closeAnnouncement = () => {
    if (activeAnnouncement) {
      localStorage.setItem('last_announcement_id', activeAnnouncement.id);
    }
    setShowAnnouncement(false);
    setActiveAnnouncement(null);
  };

  // 2. Separate Permission Validator (Runs when user or permissions change)
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) return;
      const emailLower = user.email?.toLowerCase();
      if (!emailLower) return;

      const isSuperAdmin = ADMIN_EMAILS.includes(emailLower);
      const hasPermission = userPermissions.some(up => up.email.toLowerCase() === emailLower);
      
      // Only lock out if permissions have actually been loaded (length > 0)
      if (!isSuperAdmin && !hasPermission && userPermissions.length > 0) {
        await signOut(auth);
        setUser(null);
        alert(`Maaf, email ${user.email} tidak memiliki izin akses. Hubungi Mas Fauzan.`);
      }
    };
    
    checkAccess();
  }, [user?.email, userPermissions]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Login failed", error);
      if (error.code === 'auth/unauthorized-domain') {
        alert(
          "Firebase Error: Unauthorized Domain.\n\n" +
          "Please add this domain to your Firebase Console (Authentication > Settings > Authorized domains):\n\n" +
          window.location.hostname
        );
      } else {
        alert("Login gagal: " + error.message);
      }
    }
  };

  const handleLogout = () => signOut(auth);

  const lastProcessedRef = useRef<string>('');

  // Sync campaign stats in background - REMOVED TO PREVENT RENDER LOOPS
  // We should compute stats in useMemo for UI, and only save to DB when a target is actually sent

  const handleNavigate = (newView: string) => {
    setView(newView);
    if (newView !== 'input-log') setEditingTransaction(null);
    const drawerCheckbox = document.getElementById('main-drawer') as HTMLInputElement;
    if (drawerCheckbox) drawerCheckbox.checked = false;

    // Log Activity
    if (user) {
      const menuLabel = AVAILABLE_MENUS.find(m => m.id === newView)?.label || newView;
      logActivity(user, userDisplayName, `Membuka Menu: ${menuLabel}`, newView);
    }
  };

  const handleDeleteTransaction = (id: string | number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.')) {
      const trans = transaksi.find(t => t.id === id);
      saveData.deleteTransaksi(id);
      logActivity(user, userDisplayName, 'Hapus Data Transaksi', 'riwayat', `Menghapus transaksi: ${trans?.nama_pasien || id}`);
    }
  };

  const handleViewPatient = (idsispro: string, type: 'PCC' | 'RFM') => {
    setView(type === 'PCC' ? 'pcc-rfm-data-pcc' : 'pcc-rfm-data-rfm');
    const u = new URLSearchParams(window.location.search);
    u.set('search', idsispro);
    window.history.replaceState({}, '', `${window.location.pathname}?${u.toString()}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-main-bg">
        <div className="flex flex-col items-center gap-4 text-amber-500">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="font-black tracking-[0.3em] animate-pulse uppercase text-xs">Memeriksa Sesi...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07080a] p-4 overflow-hidden relative font-sans">
        {/* Cinematic Background with depth */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-amber-600/10 rounded-full blur-[140px] animate-pulse"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/5 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '3s' }}></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)]"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay"></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-lg w-full"
        >
          {/* Main Container */}
          <div className="glass p-10 sm:p-20 rounded-[4rem] border border-white/5 shadow-[0_80px_150px_-30px_rgba(0,0,0,0.8)] bg-black/30 backdrop-blur-3xl relative z-10 overflow-hidden text-center">
            
            {/* Elegant Glow Effect */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-amber-500/5 rounded-full blur-[100px]"></div>
            
            {/* Minimalist Logo Section */}
            <div className="flex justify-center mb-16">
              <motion.div 
                initial={{ scale: 0.8, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 1.2, type: "spring" }}
                className="relative"
              >
                <div className="absolute inset-0 bg-amber-500/30 blur-3xl rounded-full scale-150"></div>
                <div className="w-28 h-28 bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 rounded-[2.5rem] flex items-center justify-center border border-white/20 shadow-2xl relative">
                  <LogIn className="text-black/90" size={48} strokeWidth={2.5} />
                </div>
              </motion.div>
            </div>

            {/* Premium Typography Branding */}
            <div className="space-y-3 mb-16">
              <motion.h1 
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-5xl font-black text-white italic uppercase tracking-[-0.04em] leading-none font-display"
              >
                ACHIEVE<span className="text-amber-500">T</span>
              </motion.h1>
              <div className="flex items-center justify-center gap-3 opacity-60">
                <div className="h-[0.5px] w-8 bg-current"></div>
                <p className="text-amber-500 font-bold text-[10px] uppercase tracking-[0.4em]">PRODIA DEPOK</p>
                <div className="h-[0.5px] w-8 bg-current"></div>
              </div>
            </div>

            {/* Refined Authentication Section */}
            <div className="space-y-6 mb-16">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogin}
                className="group relative w-full h-20 bg-white hover:bg-neutral-100 rounded-[2rem] transition-all duration-300 shadow-[0_20px_40px_-10px_rgba(255,255,255,0.1)] flex items-center justify-center gap-4 px-8"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                <span className="font-black text-[11px] tracking-[0.3em] text-black">OTORISASI DASHBOARD</span>
                <div className="w-8 h-[1px] bg-black/10 group-hover:w-12 transition-all"></div>
              </motion.button>
              
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
                  <Sparkles size={10} className="text-amber-500" />
                  <span className="text-white/30 text-[8px] font-black uppercase tracking-[0.4em]">SECURE GATEWAY V.{APP_VERSION}</span>
                </div>
              </div>
            </div>

            {/* Strategic Corporate Info */}
            <div className="grid grid-cols-2 gap-8 pt-10 border-t border-white/5">
              <div className="text-center">
                <p className="text-[10px] font-bold text-amber-500/50 uppercase tracking-widest mb-1">POWERED BY</p>
                <p className="text-base font-black text-white italic tracking-tighter uppercase">GUIDE DEPOK</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold text-amber-500/50 uppercase tracking-widest mb-1">ESTABLISHED</p>
                <p className="text-base font-black text-white italic tracking-tighter uppercase">@2026</p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-[8px] font-bold text-white/10 uppercase tracking-[1em] translate-x-[0.5em]">ACHIEVETRACK BY GUIDE | FAUZAN FAWWAZ | 2026</p>
            </div>
          </div>

          {/* Luxury Decorative Layer */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] pointer-events-none opacity-20">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-main-bg">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <span className="loading loading-spinner w-20 h-20 text-amber-500 opacity-20"></span>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500 animate-pulse" size={24} />
          </div>
          <p className="text-amber-500 font-black tracking-[0.5em] animate-pulse uppercase text-[10px]">Menghubungkan ke Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`drawer ${layoutMode === 'web' ? 'lg:drawer-open' : ''}`}>
      <input id="main-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col min-h-screen relative bg-main-bg">
        <Header 
          user={user} 
          onLogout={handleLogout} 
          theme={theme} 
          onToggleTheme={toggleTheme}
          layoutMode={layoutMode}
          onToggleLayout={toggleLayout}
          onRefresh={refresh}
          impersonatedEmail={impersonatedEmail}
          onImpersonate={setImpersonatedEmail}
          userPermissions={userPermissions}
          isSuperAdmin={isSuperAdmin}
        />
        
        {/* Announcement Popup */}
        {showAnnouncement && activeAnnouncement && (
          <AnnouncementPopup 
            announcement={activeAnnouncement}
            onClose={closeAnnouncement}
          />
        )}

        <main className="p-6 flex-grow">
          <>
            {view === 'dashboard' && (
                <MemoDashboard 
                  kategori={kategori} 
                  transaksi={transaksi} 
                  petugasList={PETUGAS_LIST}
                  userEmail={userDisplayName}
                  layoutMode={layoutMode}
                  waHistory={waHistory}
                  waHistoryCBG={waHistoryCBG}
                />
              )}
              {view === 'input-log' && (
            <MemoInputLog 
              kategori={kategori}
              promos={promos}
              petugasList={PETUGAS_LIST}
              transaksi={transaksi}
              onSave={(t) => {
                const perms = getPermission('input-log');
                if (!perms.canAdd && !editingTransaction) {
                  alert("Anda tidak memiliki izin untuk menambah data.");
                  return;
                }
                if (!perms.canEdit && editingTransaction) {
                  alert("Anda tidak memiliki izin untuk mengedit data.");
                  return;
                }
                saveData.transaksi(t);
                logActivity(user, userDisplayName, editingTransaction ? 'Update Data Transaksi' : 'Input Data Transaksi', 'input-log', `Pasien: ${t.nama_pasien}`);
                setView('riwayat');
              }}
              editData={editingTransaction}
              permissions={getPermission('input-log')}
            />
          )}
          {view === 'riwayat' && (
            <MemoRiwayat 
              transaksi={transaksi}
              onEdit={(t) => {
                setEditingTransaction(t);
                setView('input-log');
              }}
              onDelete={handleDeleteTransaction}
              userEmail={targetEmail}
              permissions={getPermission('riwayat')}
            />
          )}
          {view === 'promo-berjalan' && (
            <MemoPromoBerjalan promos={promos} transaksi={transaksi} kategori={kategori} />
          )}
          {view === 'driver-wic' && (
            <MemoDriverWIC 
              data={driverWicData} 
              onSave={saveData.driverWic} 
              userEmail={targetEmail}
              permissions={getPermission('driver-wic')}
            />
          )}
          {view === 'target-sdm' && (
            <MemoTargetSDM 
              kategori={kategori} 
              transaksi={transaksi} 
              targets={targetPerPetugas}
              petugasList={PETUGAS_LIST}
            />
          )}
          {view === 'admin-kategori' && (
            <AdminKategori kategori={kategori} setKategori={(newData) => {
              if (typeof newData === 'function') {
                saveData.kategori((newData as Function)(kategori));
              } else {
                saveData.kategori(newData);
              }
            }} userEmail={user.email} permissions={getPermission('admin-kategori')} />
          )}
          {view === 'admin-promo' && (
            <AdminPromo promos={promos} setPromos={(newData) => {
              if (typeof newData === 'function') {
                saveData.promos((newData as Function)(promos));
              } else {
                saveData.promos(newData);
              }
            }} kategori={kategori} userEmail={user.email} permissions={getPermission('admin-promo')} />
          )}
          {view === 'admin-target' && (
            <AdminTarget 
              kategori={kategori} 
              targets={targetPerPetugas} 
              setTargets={(newData) => {
                if (typeof newData === 'function') {
                  saveData.targets((newData as Function)(targetPerPetugas));
                } else {
                  saveData.targets(newData);
                }
              }}
              petugasList={PETUGAS_LIST}
              userEmail={user.email}
              permissions={getPermission('admin-target')}
            />
          )}
          {view === 'upaya-cc' && (
            <MemoUpayaCC 
              data={upayaData}
              setData={(newData) => {
                // This component handles individual saves, but for simplicity:
                if (typeof newData === 'function') {
                   // This is complex for RTDB individual items, but I'll optimize UpayaCC component
                }
              }}
              saveUpaya={saveData.upaya}
              deleteUpaya={saveData.deleteUpaya}
              categories={upayaCategories}
              setCategories={saveData.upayaCats}
              userEmail={user.email}
              permissions={getPermission('upaya-cc')}
            />
          )}

          {view.startsWith('pcc-rfm') && (
            <MemoPCCRFM 
              records={pccrfmRecords}
              onSave={saveData.pccrfm}
              onSaveMany={saveData.pccrfmMany}
              onDelete={saveData.deletePccrfm}
              onClearAll={saveData.clearPccrfmAll}
              subView={view}
              setSubView={setView}
              userEmail={user.email}
              permissions={getPermission('pcc-rfm')}
            />
          )}

          {view === 'my-links-favorites' && (
            <MemoMyLinks 
              links={favoriteLinks}
              onSave={(link) => {
                saveData.favoriteLink(link).then(() => {
                  alert('Link berhasil disimpan!');
                }).catch(err => {
                  alert('Gagal menyimpan link: ' + err.message);
                });
              }}
              onDelete={saveData.deleteFavoriteLink}
              userEmail={user.email}
              permissions={getPermission('my-links-favorites')}
            />
          )}

          {view.startsWith('ultah-pelanggan') && (
            <MemoBirthdayManager 
              records={birthdayRecords}
              onSave={saveData.birthdayRecord}
              onSaveMany={saveData.birthdayRecordMany}
              onDelete={saveData.deleteBirthdayRecord}
              onClearAll={saveData.clearBirthdayRecordsAll}
              onViewPatient={handleViewPatient}
              subView={view}
              user={user}
              pccrfmRecords={pccrfmRecords}
              permissions={getPermission('ultah-pelanggan')}
            />
          )}

          {view === 'calendar-schedules' && (
            <MemoMyCalendar 
              activities={calendarActivities}
              onSave={saveData.calendarActivity}
              onDelete={saveData.deleteCalendarActivity}
              userEmail={user.email}
              permissions={getPermission('calendar-schedules')}
            />
          )}

          {view === 'wa-personal-dashboard' && (
            <MemoWAPersonalDashboard 
              targets={waTargets}
              history={waHistory}
              campaigns={waCampaigns}
              waBlacklist={waBlacklist}
              userEmail={targetEmail || ''}
              onDeleteCampaign={saveData.deleteWaCampaign}
              onAddBlacklist={(data) => {
                const blacklistData = {
                  ...data,
                  id: `bl_man_${Date.now()}`,
                  blacklistedBy: user?.email || 'Admin',
                  timestamp: new Date().toISOString()
                };
                saveData.waBlacklist(blacklistData);
                alert('Pasien berhasil ditambahkan ke Blacklist secara manual.');
              }}
            />
          )}

          {view === 'wa-personal-target' && (
            <MemoWAPersonalTarget 
              targets={waTargets}
              history={waHistory}
              setup={waSetup}
              onUpdateStatus={(id, status) => {
                const target = waTargets.find(t => t.id === id);
                if (target) {
                  logActivity(user, userDisplayName, `Kirim WA (CC): ${status}`, 'wa-personal-target', `Target: ${target.nama}`);
                  const sentAt = new Date().toISOString();
                  saveData.waTarget({ ...target, status, sentAt });
                  
                  const activeTema = waSetup?.tema || 'No Campaign';
                  
                  saveData.waHistory({
                    id: `hist_${Date.now()}`,
                    sisproId: target.sisproId,
                    nama: target.nama,
                    tema: activeTema,
                    sentAt,
                    status,
                    petugasNama: target.petugasNama
                  });
                  
                  // Update or create campaign summary
                  if (activeTema !== 'No Campaign') {
                    // Try to find by tema, but prefer the most recent one if duplicates exist
                    const sortedCampaigns = [...waCampaigns].sort((a, b) => 
                      new Date(b.setupDate).getTime() - new Date(a.setupDate).getTime()
                    );
                    const activeCampaign = sortedCampaigns.find(c => c.tema === activeTema);
                    
                    if (activeCampaign) {
                      saveData.waCampaign({
                        ...activeCampaign,
                        sentCount: (activeCampaign.sentCount || 0) + 1,
                        totalTargets: waTargets.length // Refresh total targets count
                      });
                    } else {
                      // Auto-create if missing
                      saveData.waCampaign({
                        id: `camp_${Date.now()}`,
                        tema: activeTema,
                        setupDate: new Date().toISOString(),
                        startDate: waSetup?.startDate || '',
                        deadline: waSetup?.deadline || '',
                        totalTargets: waTargets.length,
                        sentCount: 1
                      });
                    }
                  }
                }
              }}
              onDelete={saveData.deleteWaTarget}
              onClearAll={saveData.clearWaTargets}
              onBlacklist={(target, reason) => {
                logActivity(user, userDisplayName, 'Blacklist Pasien (CC)', 'wa-personal-target', `Target: ${target.nama} | Alasan: ${reason}`);
                const blacklistData = {
                  id: `bl_${Date.now()}`,
                  sisproId: target.sisproId,
                  nama: target.nama,
                  phone: target.phone,
                  reason: reason,
                  blacklistedBy: user?.email || 'System',
                  timestamp: new Date().toISOString()
                };
                saveData.waBlacklist(blacklistData);
                saveData.waTarget({ ...target, status: 'BLACKLIST' });
                
                // Also add to history as Blacklist
                saveData.waHistory({
                  id: `hist_bl_${Date.now()}`,
                  sisproId: target.sisproId,
                  nama: target.nama,
                  tema: waSetup?.tema || 'Blacklist',
                  sentAt: new Date().toISOString(),
                  status: 'BLACKLIST',
                  petugasNama: target.petugasNama
                });
              }}
              userEmail={targetEmail}
              userName={userDisplayName}
              userPermissions={userPermissions}
              permissions={getPermission('wa-personal')}
            />
          )}

          {view === 'wa-personal-setup' && (
            <MemoWAPersonalSetup 
              setup={waSetup}
              targets={waTargets}
              history={waHistory}
              onSaveSetup={async (data, customCount) => {
                try {
                  await saveData.waSetup(data);
                  
                  // Find existing campaign with same tema to update, or create new
                  const existingCamp = waCampaigns.find(c => c.tema === data.tema);
                  
                  await saveData.waCampaign({
                    id: existingCamp?.id || `camp_${Date.now()}`,
                    tema: data.tema,
                    setupDate: existingCamp?.setupDate || new Date().toISOString(),
                    startDate: data.startDate || '',
                    deadline: data.deadline || '',
                    totalTargets: customCount !== undefined ? customCount : waTargets.length,
                    sentCount: waTargets.filter(t => t.status === 'Sudah Dikirim').length
                  });
                } catch (err: any) {
                  console.error("Gagal menyimpan setup WA:", err);
                  throw new Error(err.message || 'Gagal menyimpan ke database');
                }
              }}
              onAddTargets={saveData.waTargetMany}
              onClearTargets={saveData.clearWaTargets}
              onResetAllData={saveData.clearWaPersonalData}
              targetCount={waTargets.length}
              waBlacklist={waBlacklist}
              userEmail={targetEmail}
              permissions={getPermission('wa-personal')}
            />
          )}

          {view === 'wa-cbg-dashboard' && (
            <MemoWACBGDashboard 
              targets={waTargetsCBG}
              history={waHistoryCBG}
              campaigns={waCampaignsCBG}
              waBlacklist={waBlacklist}
              setup={waSetupCBG}
              userEmail={targetEmail || ''}
              onDeleteCampaign={saveData.deleteWaCampaignCBG}
              onAddBlacklist={(data) => {
                const blacklistData = {
                  ...data,
                  id: `bl_man_cbg_${Date.now()}`,
                  blacklistedBy: user?.email || 'Admin',
                  timestamp: new Date().toISOString()
                };
                saveData.waBlacklist(blacklistData);
                alert('Pasien berhasil ditambahkan ke Blacklist (CBG) secara manual.');
              }}
            />
          )}

          {view === 'wa-cbg-target' && (
            <MemoWACBGTarget 
              targets={waTargetsCBG}
              history={waHistoryCBG}
              setup={waSetupCBG}
              setups={waSetupsCBG}
              onUpdateStatus={(id, status) => {
                const target = waTargetsCBG.find(t => t.id === id);
                if (target) {
                  logActivity(user, userDisplayName, `Kirim WA (CBG): ${status}`, 'wa-cbg-target', `Target: ${target.nama}`);
                  const sentAt = new Date().toISOString();
                  saveData.waTargetCBG({ ...target, status, sentAt });
                  
                  const activeTema = waSetupCBG?.tema || 'No Campaign';
                  
                  saveData.waHistoryCBG({
                    id: `hist_cbg_${Date.now()}`,
                    sisproId: target.sisproId,
                    nama: target.nama,
                    tema: activeTema,
                    sentAt,
                    status,
                    petugasNama: target.petugasNama
                  });
                  
                  if (activeTema !== 'No Campaign') {
                    const sortedCampaigns = [...waCampaignsCBG].sort((a, b) => 
                      new Date(b.setupDate).getTime() - new Date(a.setupDate).getTime()
                    );
                    const activeCampaign = sortedCampaigns.find(c => c.tema === activeTema);
                    
                    if (activeCampaign) {
                      saveData.waCampaignCBG({
                        ...activeCampaign,
                        sentCount: (activeCampaign.sentCount || 0) + 1,
                        totalTargets: waTargetsCBG.length
                      });
                    } else {
                      saveData.waCampaignCBG({
                        id: `camp_cbg_${Date.now()}`,
                        tema: activeTema,
                        setupDate: new Date().toISOString(),
                        startDate: waSetupCBG?.startDate || '',
                        deadline: waSetupCBG?.deadline || '',
                        totalTargets: waTargetsCBG.length,
                        sentCount: 1
                      });
                    }
                  }
                }
              }}
              onDelete={saveData.deleteWaTargetCBG}
              onClearAll={saveData.clearWaTargetsCBG}
              onBlacklist={(target, reason) => {
                logActivity(user, userDisplayName, 'Blacklist Pasien (CBG)', 'wa-cbg-target', `Target: ${target.nama} | Alasan: ${reason}`);
                const blacklistData = {
                  id: `bl_cbg_${Date.now()}`,
                  sisproId: target.sisproId,
                  nama: target.nama,
                  phone: target.phone,
                  reason: reason,
                  blacklistedBy: user?.email || 'System',
                  timestamp: new Date().toISOString()
                };
                saveData.waBlacklist(blacklistData);
                saveData.waTargetCBG({ ...target, status: 'BLACKLIST' });
                
                // Also add to history as Blacklist
                saveData.waHistoryCBG({
                  id: `hist_cbg_bl_${Date.now()}`,
                  sisproId: target.sisproId,
                  nama: target.nama,
                  tema: waSetupCBG?.tema || 'Blacklist',
                  sentAt: new Date().toISOString(),
                  status: 'BLACKLIST',
                  petugasNama: target.petugasNama
                });
              }}
              userEmail={targetEmail}
              userName={userDisplayName}
              userPermissions={userPermissions}
              permissions={getPermission('wa-cbg')}
            />
          )}

          {view === 'wa-cbg-setup' && (
            <MemoWACBGSetup 
              setup={waSetupCBG}
              setups={waSetupsCBG}
              staffs={staffCBG}
              targets={waTargetsCBG}
              history={waHistoryCBG}
              onNavigate={handleNavigate}
              onSaveSetup={async (data, customCount, slotId) => {
                try {
                  await saveData.waSetupCBG(data, slotId);
                  const existingCamp = waCampaignsCBG.find(c => c.tema === data.tema);
                  
                  // Calculate targets in this campaign (staff-based filtering)
                  const relevantTargets = waTargetsCBG.filter(t => t.petugasId && data.staffIds?.includes(t.petugasId));
                  const calculatedTotal = relevantTargets.length;
                  const calculatedSent = relevantTargets.filter(t => t.status === 'Sudah Dikirim').length;
                  
                  await saveData.waCampaignCBG({
                    id: existingCamp?.id || `camp_cbg_${Date.now()}`,
                    tema: data.tema,
                    setupDate: existingCamp?.setupDate || new Date().toISOString(),
                    startDate: data.startDate || '',
                    deadline: data.deadline || '',
                    totalTargets: customCount !== undefined ? customCount : (calculatedTotal || (Number(data.targetPerStaff || 0) * (data.staffIds?.length || 0)) || existingCamp?.totalTargets || 0),
                    sentCount: calculatedSent || existingCamp?.sentCount || 0
                  });
                } catch (err: any) {
                  console.error("Gagal menyimpan setup WA CBG:", err);
                  throw new Error(err.message || 'Gagal menyimpan ke database');
                }
              }}
              onSaveStaff={saveData.staffCBG}
              onDeleteStaff={saveData.deleteStaffCBG}
              onAddTargets={saveData.waTargetManyCBG}
              onClearTargets={saveData.clearWaTargetsCBG}
              onResetAllData={saveData.clearWaCbgData}
              targetCount={waTargetsCBG.length}
              waBlacklist={waBlacklist}
              userEmail={user.email}
              permissions={getPermission('wa-cbg')}
            />
          )}

          {view === 'wa-cbg-rules' && (
            <WACBGRules 
              doc={appDocs.find(d => d.id === 'rules_sdm_cabang') || null}
              onSave={saveData.appDoc}
              userEmail={user.email}
            />
          )}

          {view === 'bhf-upaya' && (
            <MemoBHFUpaya 
              data={bhfUpaya}
              issues={bhfIssues}
              groups={bhfGroups}
              onSave={saveData.bhfUpaya}
              onDelete={saveData.deleteBhfUpaya}
              onSaveIssue={saveData.bhfIssue}
              onDeleteIssue={saveData.deleteBhfIssue}
              userEmail={user.email}
              permissions={getPermission('bhf-upaya')}
            />
          )}

          {view === 'bhf-pemantauan' && (
            <MemoBHFPemantauan 
              data={bhfUpaya} 
              groups={bhfGroups}
              members={bhfMembers}
              onSave={saveData.bhfUpaya}
              onDelete={saveData.deleteBhfUpaya}
              userEmail={user.email}
            />
          )}

          {view === 'bhf-kelompok' && (
            <MemoBHFKelompok 
              members={bhfMembers}
              groups={bhfGroups}
              onSave={saveData.bhfMember}
              onDelete={saveData.deleteBhfMember}
              onGroupsUpdate={saveData.bhfGroups}
              onRenameGroup={async (oldName, newName) => {
                if (!newName || oldName === newName) return;
                
                // 1. Update groups list
                const updatedGroups = bhfGroups.map(g => g === oldName ? newName : g);
                await saveData.bhfGroups(updatedGroups);
                
                // 2. Cascade to members
                const membersToUpdate = bhfMembers.filter(m => m.kelompok === oldName);
                for (const member of membersToUpdate) {
                  await saveData.bhfMember({ ...member, kelompok: newName });
                }
                
                // 3. Cascade to upaya data
                const upayaToUpdate = bhfUpaya.filter(u => u.kelompok === oldName);
                for (const upaya of upayaToUpdate) {
                  await saveData.bhfUpaya({ ...upaya, kelompok: newName });
                }
                
                alert(`Kelompok ${oldName} berhasil diubah menjadi ${newName}`);
              }}
              permissions={getPermission('bhf-kelompok')}
            />
          )}

          {view === 'test-lab' && (
            <MemoTestLabManager 
              data={testLabs}
              onAdd={saveData.testLab}
              onEdit={(id, item) => saveData.testLab({ ...item, id } as any)}
              onDelete={saveData.deleteTestLab}
              onDeleteAll={saveData.deleteAllTestLab}
              permissions={getPermission('test-lab')}
            />
          )}

          {view === 'panel-lab' && (
            <MemoPanelManager 
              data={panels}
              testLabs={testLabs}
              onAdd={saveData.panel}
              onEdit={(id, item) => saveData.panel({ ...item, id } as any)}
              onDelete={saveData.deletePanel}
              onDeleteAll={saveData.deleteAllPanel}
              permissions={getPermission('panel-lab')}
            />
          )}

          {view === 'wshp-lab' && (
            <MemoWSHPManager 
              data={wshps}
              onSave={saveData.wshp}
              onDelete={saveData.deleteWshp}
              permissions={getPermission('wshp-lab')}
            />
          )}

          {view === 'calc-lab' && (
            <MemoLabCalculator 
              testLabs={testLabs}
              panels={panels}
            />
          )}

          {view === 'settings-lab' && (
            <MemoLabSettings 
              onImportTestLab={saveData.testLabMany}
              onImportPanel={saveData.panelMany}
              onDeleteAllTestLab={saveData.deleteAllTestLab}
              onDeleteAllPanel={saveData.deleteAllPanel}
              permissions={getPermission('settings-lab')}
            />
          )}

          {view === 'setup-user' && (
            <MemoSetupUser 
              users={userPermissions}
              onSave={saveData.userPermissions}
              availableMenus={AVAILABLE_MENUS}
              userEmail={user.email}
              permissions={getPermission('setup-user')}
            />
          )}

          {view === 'broadcast' && (
            <MemoAnnouncementManager />
          )}

          {view === 'about-fitur' && (
            <AboutFitur 
              appDocs={appDocs}
              onSave={saveData.appDoc}
              userEmail={user.email}
            />
          )}

          {view === 'about-version' && (
            <AboutVersion 
              appDocs={appDocs}
              onSave={saveData.appDoc}
              userEmail={user.email}
            />
          )}

          {view === 'about-support' && (
            <AboutSupport 
              appDocs={appDocs}
              onSave={saveData.appDoc}
              userEmail={user.email}
            />
          )}

          {view === 'activity-logs' && (
            <ActivityLogs 
              isAdmin={user.email === 'fauzanfawwaz2404@gmail.com'}
              currentUserEmail={user.email}
            />
          )}
        </>
    </main>

        <div className="footer-credit">
          ACHIEVETRACK BY GUIDE | FAUZAN FAWWAZ | 2026
        </div>
      </div>
      <Sidebar 
        currentView={view} 
        onNavigate={handleNavigate} 
        userEmail={targetEmail} 
        theme={theme} 
        onToggleTheme={toggleTheme} 
        userPermissions={userPermissions}
      />
    </div>
  );
}
