import React, { useState, useMemo } from 'react';
import { Send, CheckCircle, Clock, Trash2, Search, Filter, MessageCircle, ExternalLink, RefreshCw, Settings, X, User, PhoneOff, CheckCircle2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WATarget, WASetup, WAHistory, UserPermission } from '../types';

interface WAPersonalTargetProps {
  targets: WATarget[];
  history: WAHistory[];
  setup: WASetup | null;
  setups?: { [key: string]: WASetup };
  onUpdateStatus: (id: string, status: WATarget['status']) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onBlacklist?: (target: WATarget, reason: string) => void;
  userEmail?: string | null;
  userName?: string | null;
  userPermissions?: UserPermission[];
  permissions?: { canAdd: boolean, canEdit: boolean, canDelete: boolean, isAdmin: boolean };
  isCBG?: boolean;
}

export default function WAPersonalTarget({ 
  targets, history, setup, setups = {}, onUpdateStatus, onDelete, onClearAll, onBlacklist,
  userEmail, userName, userPermissions, isCBG, permissions 
}: WAPersonalTargetProps) {
  const isAdmin = permissions?.isAdmin || userEmail === 'fauzanfawwaz2404@gmail.com';
  const isSuperAdmin = userEmail === 'fauzanfawwaz2404@gmail.com';
  const canDelete = isSuperAdmin; // Tombol delete pada baris hanya bisa diakses oleh dia
  const canEdit = permissions?.canEdit || isAdmin;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | WATarget['status']>('all');
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDetail, setSelectedDetail] = useState<WATarget | null>(null);
  const [initiatedIds, setInitiatedIds] = useState<Set<string>>(new Set());
  
  // Blacklist modal states
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistingTarget, setBlacklistingTarget] = useState<WATarget | null>(null);
  const [blacklistReason, setBlacklistReason] = useState('');
  
  // CBG Slot management
  const [activeSlot, setActiveSlot] = useState<string>('slot_1');
  
  // Mapping email to petugasNama
  const staffMapping: { [key: string]: string } = useMemo(() => {
    const mapping: { [key: string]: string } = {
      'fauzanfawwaz2404@gmail.com': 'SUPERADMIN',
      'annisaraafiyani@gmail.com': 'ANNISA',
      'ashri.setiyawati@prodia.co.id': 'ASHRI',
      'ayurini2412@gmail.com': 'AYU',
      'deasy.retno@prodia.co.id': 'DEASY',
      'devi.yulianti@prodia.co.id': 'DEVY',
      'dhyaneka.de@gmail.com': 'DHIAN',
      'diaharumfajarwati.daf@gmail.com': 'DIAH',
      'elia.chrisnawati@prodia.co.id': 'ELIA',
      'citraafiona@gmail.com': 'FIONA',
      'dheena.soemardi83@gmail.com': 'HELLY',
      'lina.hendrawati@prodia.co.id': 'LINA',
      'mustikarahmawati.mr@gmail.com': 'MUSTIKA',
      'putrisuyono13@gmail.com': 'PUTRI',
      'ratnoade365@gmail.com': 'RATNO',
      'restugandhinii95@gmail.com': 'RESTU',
      'riska.noermawati17@gmail.com': 'RISKA',
      'riyaharyani17@gmail.com': 'RIYA',
      'rospianipurba@gmail.com': 'ROS',
      'masyitanurhidayati08@gmail.com': 'SITA',
      'najwaafiahtenri@gmail.com': 'SUKAERI',
      'anajuliuss@gmail.com': 'TRIYANA',
      'masyita.nurhidayati@prodia.co.id': 'SITA',
      'sita.masyita@gmail.com': 'SITA',
      'masyitanurhidayati@gmail.com': 'SITA'
    };
    return mapping;
  }, []);

  // Helper to normalize names for comparison
  const normalizeName = (name?: string) => {
    if (!name) return '';
    const upper = name.toUpperCase().trim();
    if (upper === 'DIAN' || upper === 'DHYAN' || upper.includes('DHYAN EKA')) return 'DHIAN';
    if (upper === 'MASYITA' || upper.includes('MASYITA') || upper.includes('NURHIDAYATI')) return 'SITA'; 
    if (upper === 'SEMUA PETUGAS' || upper === 'ALL') return 'ALL';
    return upper;
  };

  const petugasName = useMemo(() => {
    // 1. Check if we have a direct userName passed (from App.tsx which uses userPermissions)
    // Only use it if it's not the generic 'Petugas' and not 'Super Admin'
    if (userName && userName !== 'Petugas' && userName !== 'Super Admin') {
      return normalizeName(userName);
    }

    if (!userEmail) return null;
    const email = userEmail.toLowerCase().trim();
    
    // 2. Check hardcoded mapping
    if (staffMapping[email]) return staffMapping[email];
    
    // 3. Dynamic mapping from userPermissions if provided
    if (userPermissions && userPermissions.length > 0) {
      const match = userPermissions.find(p => p.email.toLowerCase() === email);
      if (match?.name) return normalizeName(match.name);
    }
    
    // 4. Aggressive email prefix match
    for (const [e, name] of Object.entries(staffMapping)) {
      const prefix = e.split('@')[0].toLowerCase();
      if (email.includes(prefix) || prefix.includes(email.split('@')[0])) {
        return name;
      }
    }
    
    return null;
  }, [userEmail, userName, userPermissions, staffMapping]);

  // Auto-set staff filter on mount or email change
  React.useEffect(() => {
    if (petugasName && !isSuperAdmin) {
      setStaffFilter(petugasName);
    }
  }, [petugasName, isSuperAdmin]);

  // Per-staff cooling down state
  const [coolingDownUntil, setCoolingDownUntil] = useState<number | null>(null);
  const [showCoolDownModal, setShowCoolDownModal] = useState(false);
  const [coolDownSeconds, setCoolDownSeconds] = useState(0);
  const itemsPerPage = 60;

  // Compute current active setup based on slot
  const currentActiveSetup = useMemo(() => {
    if (isCBG && setups && setups[activeSlot]) {
      return setups[activeSlot];
    }
    return setup;
  }, [isCBG, setups, activeSlot, setup]);

  // Compute targets for current slot
  const slotTargets = useMemo(() => {
    // Basic person identifier
    const currentStaffName = petugasName || staffFilter;
    const filterNorm = normalizeName(currentStaffName);

    // CC mode (Standard): return all if no specific staff filter
    if (!isCBG) {
      if (filterNorm === 'ALL' || filterNorm === '') return targets;
      return targets.filter(t => {
        const normNama = normalizeName(t.petugasNama);
        return t.petugasId === filterNorm || normNama === filterNorm;
      });
    }

    // CBG mode logic
    const currentSlotSetup = setups[activeSlot];
    
    // If no setup for this slot and no staff filter, show all (fallback)
    if (!currentSlotSetup && filterNorm === 'ALL') return targets;

    const currentSlotStaffIds = currentSlotSetup?.staffIds || [];

    return targets.filter(t => {
      const normNama = normalizeName(t.petugasNama);
      
      // Personal targets bypass slot restrictions to ensure the worker sees their work
      const isPersonalTarget = filterNorm !== 'ALL' && (t.petugasId === filterNorm || normNama === filterNorm);
      if (isPersonalTarget) return true;

      // If no setup, we only show personal targets above
      if (!currentSlotSetup) return false;

      // Slot-based filtering
      const belongsToSlotStaff = t.petugasId && currentSlotStaffIds.includes(t.petugasId);
      const matchesTema = currentSlotSetup?.tema === t.tema;
      return belongsToSlotStaff || (matchesTema && !t.petugasId);
    });
  }, [targets, isCBG, activeSlot, setups, petugasName, staffFilter]);

  // Effect: Sync Cooling Down state with current staff filter
  React.useEffect(() => {
    if (staffFilter !== 'all') {
      const savedStart = localStorage.getItem(`wa_cooldown_start_${staffFilter}`);
      const savedUntil = localStorage.getItem(`wa_cooldown_${staffFilter}`);
      
      const durationMs = (currentActiveSetup?.cooldownDuration || 60) * 60 * 1000;

      if (savedStart) {
        const startTime = parseInt(savedStart);
        const until = startTime + durationMs;
        if (until > Date.now()) {
          setCoolingDownUntil(until);
          // Sync the shared until time as well
          localStorage.setItem(`wa_cooldown_${staffFilter}`, until.toString());
          return;
        } else {
          // If the new duration means it's already over, clear it
          localStorage.removeItem(`wa_cooldown_${staffFilter}`);
          localStorage.removeItem(`wa_cooldown_start_${staffFilter}`);
          setCoolingDownUntil(null);
          return;
        }
      } else if (savedUntil) {
        // Migration: If we only have 'until', assume it started 60 mins before until (the old default)
        const oldUntil = parseInt(savedUntil);
        const startTime = oldUntil - (60 * 60 * 1000);
        const until = startTime + durationMs;
        
        localStorage.setItem(`wa_cooldown_start_${staffFilter}`, startTime.toString());
        localStorage.setItem(`wa_cooldown_${staffFilter}`, until.toString());
        
        if (until > Date.now()) {
          setCoolingDownUntil(until);
          return;
        }
      }
    }
    setCoolingDownUntil(null);
  }, [staffFilter, currentActiveSetup?.cooldownDuration]);

  // Auto-Send State
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [nextTarget, setNextTarget] = useState<WATarget | null>(null);

  // Frequency Memory: Count total times each sisproId has been contacted from history
  const frequencyMap = useMemo(() => {
    const map: { [key: string]: number } = {};
    history.forEach(h => {
      if (h.sisproId) {
        map[h.sisproId] = (map[h.sisproId] || 0) + 1;
      }
    });
    return map;
  }, [history]);

  // Logic: Find next unsent target
  const unsentTargets = useMemo(() => slotTargets.filter(t => t.status === 'Belum Dikirim'), [slotTargets]);

  // Effect: Cooling Down Timer
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (coolingDownUntil) {
      const updateSeconds = () => {
        const remaining = Math.max(0, Math.floor((coolingDownUntil - Date.now()) / 1000));
        setCoolDownSeconds(remaining);
        if (remaining === 0) {
          setCoolingDownUntil(null);
          if (staffFilter !== 'all') {
            localStorage.removeItem(`wa_cooldown_${staffFilter}`);
          }
        }
      };
      
      updateSeconds();
      timer = setInterval(updateSeconds, 1000);
    }
    return () => clearInterval(timer);
  }, [coolingDownUntil]);

  // Effect: Auto-Send Logic
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isAutoSending) {
      if (countdown > 0) {
        timer = setInterval(() => {
          setCountdown(prev => prev - 1);
        }, 1000);
      } else {
        // Time to send!
        const target = unsentTargets[0];
        if (target) {
          handleSendWA(target);
          onUpdateStatus(target.id, 'Sudah Dikirim');
          setCountdown(120); // 2 minutes
        } else {
          setIsAutoSending(false);
          alert("Semua pesan telah terkirim atau daftar target kosong.");
        }
      }
    }

    return () => clearInterval(timer);
  }, [isAutoSending, countdown, unsentTargets]);

  const toggleAutoSend = () => {
    if (!isAutoSending) {
      if (unsentTargets.length === 0) {
        alert("Tidak ada target 'Belum Dikirim'!");
        return;
      }
      if (!setup || !setup.template) {
        alert("Setup pesan belum diatur!");
        return;
      }
      if (window.confirm("Sistem akan membuka WhatsApp setiap 2 menit. Pastikan Pop-up browser diizinkan. Mulai?")) {
        setIsAutoSending(true);
        setCountdown(3); // Start first one in 3 seconds
      }
    } else {
      setIsAutoSending(false);
      setCountdown(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset to page 1 when filtering
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filteredTargets = useMemo(() => {
    const searchTermNorm = searchTerm.toLowerCase().trim();
    let result = slotTargets.filter(t => 
      t.nama.toLowerCase().includes(searchTermNorm) || 
      t.sisproId.toLowerCase().includes(searchTermNorm) ||
      t.phone.includes(searchTermNorm)
    );

    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }

    if (staffFilter !== 'all') {
      const filterNorm = normalizeName(staffFilter);
      result = result.filter(t => {
        const normNama = normalizeName(t.petugasNama);
        return t.petugasId === filterNorm || normNama === filterNorm;
      });
    }

    // Sort: Belum Dikirim (top), Sudah Dikirim (bottom)
    return result.sort((a, b) => {
      if (a.status === 'Belum Dikirim' && b.status === 'Sudah Dikirim') return -1;
      if (a.status === 'Sudah Dikirim' && b.status === 'Belum Dikirim') return 1;
      return 0;
    });
  }, [slotTargets, searchTerm, statusFilter, staffFilter]);

  const paginatedTargets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTargets.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTargets, currentPage]);

  const totalPages = Math.ceil(filteredTargets.length / itemsPerPage);

  const getWaktuGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 9) return "Selamat pagi";
    if (hour >= 9 && hour < 15) return "Selamat siang";
    if (hour >= 15 && hour < 18) return "Selamat sore";
    return "Selamat malam";
  };

  const handleSendWA = (target: WATarget) => {
    // Check specific cooling down for this target's staff
    const petugas = target.petugasNama || 'Default';
    const savedStart = localStorage.getItem(`wa_cooldown_start_${petugas}`);
    const savedUntil = localStorage.getItem(`wa_cooldown_${petugas}`);
    
    const durationMs = (currentActiveSetup?.cooldownDuration || 60) * 60 * 1000;
    let activeUntil: number | null = null;

    if (savedStart) {
      activeUntil = parseInt(savedStart) + durationMs;
    } else if (savedUntil) {
      activeUntil = parseInt(savedUntil);
    }

    if (activeUntil && activeUntil > Date.now()) {
      const remaining = Math.max(0, Math.floor((activeUntil - Date.now()) / 1000));
      setCoolDownSeconds(remaining);
      setCoolingDownUntil(activeUntil);
      setShowCoolDownModal(true);
      return;
    }

    if (!setup || (!setup.template && (!setup.templates || setup.templates.length === 0))) {
      alert("Setup pesan belum diatur! Silakan ke menu Setup.");
      return;
    }

    // Determine base message using sequential logic per staff if variations exist
    let baseMessage = target.messageOverride;
    
    // Check both 'variations' and 'templates' for backward compatibility, preferring 'variations'
    const activeTemplates = setup.variations || setup.templates || [];
    
    if (!baseMessage && activeTemplates.length > 0) {
      // Filter targets by the SAME staff to get sequential order dedicated to this staff
      const targetsBySameStaff = targets.filter(t => t.petugasNama === target.petugasNama);
      const staffIndex = targetsBySameStaff.findIndex(t => t.id === target.id);
      
      if (staffIndex !== -1) {
        // Sequential rotation per staff
        baseMessage = activeTemplates[staffIndex % activeTemplates.length];
      }
    }

    if (!baseMessage) {
      baseMessage = setup.template;
    }

    let message = baseMessage
      .replace(/<WAKTU>/g, getWaktuGreeting())
      .replace(/<TITLE>/g, target.title)
      .replace(/<NAMA>/g, target.nama)
      .replace(/<NAMA PETUGAS>/g, target.petugasNama || "");

    // WhatsApp formatting for phone
    let phone = target.phone.trim();
    if (phone.startsWith('0')) phone = '62' + phone.substring(1);
    if (phone.startsWith('+')) phone = phone.substring(1);

    const waLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    // Mark as initiated to unlock confirmation buttons
    setInitiatedIds(prev => new Set(prev).add(target.id));
    
    window.open(waLink, '_blank');
  };

  const getStats = () => {
    const list = isCBG ? slotTargets : targets;
    const total = list.length;
    const sent = list.filter(t => t.status === 'Sudah Dikirim').length;
    const noWa = list.filter(t => t.status === 'Tidak Ada WA').length;
    const unsent = total - sent - noWa;
    
    // Get unique staff from targets and normalize names
    const availableStaff = Array.from(new Set(list.map(t => {
      const n = t.petugasNama?.toUpperCase();
      return (n === 'DIAN' || n === 'DHYAN') ? 'DHIAN' : n;
    }).filter(Boolean)));
    
    return { total, sent, noWa, unsent, percent: total > 0 ? Math.round((sent / total) * 100) : 0, availableStaff };
  };

  const stats = getStats();

  const handleUpdateStatus = (id: string, status: WATarget['status']) => {
    onUpdateStatus(id, status);
    if (status === 'Sudah Dikirim') {
      const target = targets.find(t => t.id === id);
      const petugas = target?.petugasNama || 'Default';
      
      // Logic for Cooling Down Check PER STAFF
      const limit = currentActiveSetup?.cooldownLimit || 5;
      const durationMs = (currentActiveSetup?.cooldownDuration || 60) * 60 * 1000;
      
      const recentSends = history
        .filter(h => h.petugasNama === petugas && (h.status === 'Sudah Dikirim' || !h.status))
        .slice(-(limit - 1)) 
        .map(h => new Date(h.sentAt).getTime());
        
      if (recentSends.length >= (limit - 1)) {
        const firstOfSet = recentSends[0]; 
        const TRIGGER_WINDOW = 5 * 60 * 1000; // Trigger within 5 mins window
        
        if (Date.now() - firstOfSet < TRIGGER_WINDOW) {
          const now = Date.now();
          const until = now + durationMs;
          localStorage.setItem(`wa_cooldown_start_${petugas}`, now.toString());
          localStorage.setItem(`wa_cooldown_${petugas}`, until.toString());
          
          if (staffFilter === petugas || staffFilter === 'all') {
            setCoolingDownUntil(until);
            setShowCoolDownModal(true);
          }
        }
      }
    }
  };

  const handleConfirmBlacklist = () => {
    if (!blacklistingTarget) return;
    const finalReason = blacklistReason || 'Permintaan Pasien';
    if (onBlacklist) {
      onBlacklist(blacklistingTarget, finalReason);
    }
    setShowBlacklistModal(false);
    setBlacklistingTarget(null);
    setBlacklistReason('');
  };

  return (
    <div className="flex flex-col gap-6 p-2">
      {/* Workflow Indicator */}
      <div className="flex items-center justify-center gap-4 mb-4">
          <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl border bg-white/5 border-white/10 text-white/40 font-bold opacity-60">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/10">
              <Settings size={14} />
            </div>
            <span className="text-[10px] tracking-widest uppercase">1. SETUP & IMPORT</span>
          </div>
          <div className="w-8 h-px bg-white/10 hidden md:block" />
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl border bg-amber-500 border-amber-400 text-black font-black shadow-lg shadow-amber-500/20">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-black/20 text-black">
              <Send size={14} />
            </div>
            <span className="text-[10px] tracking-widest uppercase">2. KIRIM PESAN</span>
          </div>
          <div className="w-8 h-px bg-white/10 hidden md:block" />
          <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl border bg-white/5 border-white/10 text-white/40 font-bold">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/10">
              <RefreshCw size={14} />
            </div>
            <span className="text-[10px] tracking-widest uppercase">3. MONITOR HASIL</span>
          </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-(--text-color) tracking-tighter italic uppercase flex items-center gap-3">
            <Send className="text-amber-500" size={32} /> DAFTAR TARGET WA
          </h2>
          <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mt-1 flex items-center gap-2">
            Management Pengiriman Pesan Personal {isAutoSending && <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded animate-pulse">● AUTO-SEND ACTIVE</span>}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-3">
             {canEdit && (
               <button 
                 onClick={toggleAutoSend}
                 className={`px-6 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hide-on-mobile flex items-center gap-2 shadow-xl ${isAutoSending ? 'bg-rose-600 text-white shadow-rose-600/20' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'}`}
               >
                 {isAutoSending ? (
                   <>
                     <RefreshCw size={16} className="animate-spin" />
                     STOP AUTO ({formatTime(countdown)})
                   </>
                 ) : (
                   <>
                     <Clock size={16} />
                     MULAI AUTO-SEND (2M)
                   </>
                 )}
               </button>
             )}
             {canDelete && (
               <div className="flex items-center gap-2">
                 {isClearing ? (
                   <div className="flex items-center gap-3 bg-rose-500/20 px-6 h-12 rounded-xl border border-rose-500/30">
                     <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest animate-pulse">HAPUS SELURUH TARGET?</span>
                     <button 
                       onClick={async () => {
                         try {
                           await onClearAll();
                           setIsClearing(false);
                         } catch (err) {
                           console.error(err);
                           alert("Gagal menghapus target");
                           setIsClearing(false);
                         }
                       }}
                       className="px-3 py-1 bg-rose-500 text-white rounded-lg text-[9px] font-black hover:bg-rose-600 transition-colors"
                     >
                       YA, HAPUS
                     </button>
                     <button 
                       onClick={() => setIsClearing(false)}
                       className="px-3 py-1 bg-white/10 text-white rounded-lg text-[9px] font-black hover:bg-white/20 transition-colors"
                     >
                       BATAL
                     </button>
                   </div>
                 ) : (
                   <button 
                     onClick={() => setIsClearing(true)}
                     className="px-6 h-12 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group"
                   >
                     <Trash2 size={16} className="group-hover:rotate-12 transition-transform" /> HAPUS SEMUA TARGET
                   </button>
                 )}
               </div>
             )}
          </div>
          {isAutoSending && (
            <p className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest italic pr-2">
              *Pastikan browser mengizinkan POP-UP untuk fitur ini
            </p>
          )}
        </div>
      </div>

      {isCBG && (
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-blue-500/10 p-4 rounded-[2rem] border border-blue-500/20 mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg">
                <Sparkles size={20} />
             </div>
             <div>
               <h4 className="text-sm font-black text-blue-400 italic uppercase">PILIH KAMPANYE AKTIF</h4>
               <p className="text-[9px] font-medium text-slate-500 tracking-wider">Tampilkan daftar target berdasarkan kampanye yang dipilih.</p>
             </div>
          </div>
          <div className="flex p-1 bg-black/40 rounded-xl border border-white/5">
             <button 
               onClick={() => setActiveSlot('slot_1')}
               className={`px-6 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${
                 activeSlot === 'slot_1' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
               }`}
             >
               KAMPANYE A {setups?.['slot_1']?.tema ? `(${setups['slot_1'].tema})` : ''}
             </button>
             <button 
               onClick={() => setActiveSlot('slot_2')}
               className={`px-6 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${
                 activeSlot === 'slot_2' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
               }`}
             >
               KAMPANYE B {setups?.['slot_2']?.tema ? `(${setups['slot_2'].tema})` : ''}
             </button>
          </div>
        </div>
      )}

      {/* STAFF DROPDOWN OR INFO */}
      {(isCBG || (petugasName && !isSuperAdmin)) && (
        <div className="glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden bg-blue-500/5">
           <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center md:text-left">
                 <h3 className="text-xl font-black text-blue-500 italic tracking-tight uppercase">
                   {petugasName && !isSuperAdmin ? `DAFTAR TARGET: ${petugasName}` : 'SILAKAN PILIH NAMA ANDA'}
                 </h3>
                 <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase italic">
                   {petugasName && !isSuperAdmin ? 'Hanya menampilkan target yang ditugaskan kepada Anda' : 'Masing-masing orang pilih namanya lalu muncul targetnya'}
                 </p>
              </div>
              
              {(!petugasName || isSuperAdmin) ? (
                <div className="w-full md:w-[400px] relative group">
                  <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500" size={20} />
                  <select 
                    value={staffFilter}
                    onChange={(e) => setStaffFilter(e.target.value)}
                    className="w-full bg-black/60 border-2 border-blue-500/30 rounded-2xl py-5 pl-16 pr-10 text-sm font-black uppercase tracking-widest text-white focus:border-blue-500 outline-none appearance-none cursor-pointer shadow-lg transition-all"
                  >
                    <option value="all">-- SEMUA PETUGAS ({targets.length} DATA) --</option>
                    {stats.availableStaff.sort().map(sName => {
                      const normalizedSName = sName as string;
                      const count = targets.filter(t => {
                        const n = t.petugasNama?.toUpperCase();
                        const currentN = (n === 'DIAN' || n === 'DHYAN') ? 'DHIAN' : n;
                        return currentN === normalizedSName;
                      }).length;
                      
                      return (
                        <option key={normalizedSName} value={normalizedSName}>
                          {normalizedSName.toUpperCase()} ({count} Target)
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500">
                    <motion.div animate={{ y: [0, 2, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                      ▼
                    </motion.div>
                  </div>
                </div>
              ) : (
                <div className="px-8 py-4 bg-blue-500/20 rounded-2xl border border-blue-500/30">
                   <div className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">PETUGAS AKTIF</div>
                   <div className="text-2xl font-black text-white italic tracking-tighter uppercase">{petugasName}</div>
                </div>
              )}

              <div className="flex items-center gap-6">
                 <div className="text-right">
                    <div className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">PROGRES ANDA</div>
                    <div className="text-xl font-black text-blue-400 italic tracking-tighter leading-none">
                       {staffFilter === 'all' 
                         ? stats.percent 
                         : Math.round(((targets.filter(t => t.petugasNama === staffFilter && t.status === 'Sudah Dikirim').length) / (targets.filter(t => (t.petugasNama === staffFilter)).length || 1)) * 100)
                       }%
                    </div>
                 </div>
                 <div className="w-px h-8 bg-white/10 hidden sm:block" />
                 <div className="text-right">
                    <div className="text-[9px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">PROGRES GLOBAL</div>
                    <div className="text-xl font-black text-emerald-400 italic tracking-tighter leading-none">
                       {stats.percent}%
                    </div>
                 </div>
                 <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin-slow" />
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* STATS QUICK VIEW */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
         {[
           { label: 'TOTAL TARGET', val: stats.total, color: 'text-amber-500', bg: 'bg-amber-500/10' },
           { label: 'BELUM DIKIRIM', val: stats.unsent, color: 'text-slate-400', bg: 'bg-black/20' },
           { label: 'SUDAH DIKIRIM', val: stats.sent, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
           { label: 'TIDAK ADA WA', val: stats.noWa, color: 'text-rose-500', bg: 'bg-rose-500/10' },
           { label: 'PROGRES', val: `${stats.percent}%`, color: 'text-brand-400', bg: 'bg-brand-500/10' },
         ].map((stat, i) => (
           <div key={i} className={`glass ${stat.bg} p-6 rounded-[2rem] border border-white/5 shadow-xl flex flex-col items-center justify-center text-center`}>
              <div className={`text-2xl font-black ${stat.color} tracking-tighter italic`}>{stat.val}</div>
              <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mt-1">{stat.label}</div>
           </div>
         ))}
      </div>

      {/* CONTROLS */}
      <div className="lg:col-span-12 glass p-6 rounded-[2.5rem] border border-white/10 shadow-3xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-400" size={16} />
            <input 
              type="text" 
              placeholder="CARI NAMA, SISPRO, ATAU NOMOR WA..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-xs font-bold text-white placeholder:text-white/20 focus:border-brand-500/50 outline-none transition-all"
            />
          </div>
          <div className={`${isCBG ? 'md:col-span-3' : 'md:col-span-4'} relative group`}>
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 pl-14 pr-10 text-xs font-black uppercase tracking-widest text-white focus:border-emerald-500/50 outline-none appearance-none cursor-pointer"
            >
              <option value="all">SEMUA STATUS</option>
              <option value="Belum Dikirim">HANYA BELUM DIKIRIM</option>
              <option value="Sudah Dikirim">HANYA SUDAH DIKIRIM</option>
              <option value="Tidak Ada WA">HANYA TIDAK ADA WA</option>
            </select>
          </div>

          {(!petugasName || isSuperAdmin) && (
            <div className={`${isCBG ? 'md:col-span-3' : 'md:col-span-4'} relative group`}>
              <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500" size={16} />
              <select 
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 pl-14 pr-10 text-xs font-black uppercase tracking-widest text-white focus:border-blue-500/50 outline-none appearance-none cursor-pointer"
              >
                <option value="all">SEMUA PETUGAS</option>
                {stats.availableStaff.map(s => {
                  const normalizedS = s as string;
                  return (
                    <option key={normalizedS} value={normalizedS}>{normalizedS.toUpperCase()}</option>
                  );
                })}
              </select>
            </div>
          )}

          <div className={`${isCBG ? 'md:col-span-2' : 'md:col-span-2'} text-right`}>
             <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
               TOTAL: {filteredTargets.length} DATA
             </div>
          </div>
        </div>
      </div>

      {/* TARGET LIST TABLE */}
      <div className="glass overflow-hidden rounded-[2.5rem] border border-white/10 shadow-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white/5 text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">
              <tr>
                <th className="p-3 sm:p-5 w-14 sm:w-28 text-center uppercase tracking-widest hidden md:table-cell">Status</th>
                <th className="p-4 sm:p-6 text-left">DETAIL PASIEN</th>
                <th className="p-3 sm:p-5 text-center w-16 sm:w-64 uppercase tracking-widest">Aksi</th>
                <th className="p-3 sm:p-5 w-10 sm:w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {paginatedTargets.map((target) => (
                  <tr 
                    key={target.id}
                    className={`group transition-colors relative ${target.status !== 'Belum Dikirim' ? 'bg-white/[0.02] opacity-50' : 'hover:bg-white/5'}`}
                  >
                    <td className="p-3 sm:p-5 text-center hidden md:table-cell">
                      <div className={`px-1.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[6px] sm:text-[8px] font-black uppercase tracking-tighter sm:tracking-widest inline-block ${target.status === 'Sudah Dikirim' ? 'bg-emerald-500/10 text-emerald-500' : 
                        target.status === 'Tidak Ada WA' ? 'bg-rose-500/10 text-rose-500' :
                        'bg-amber-500/10 text-amber-500 animate-pulse'}`}>
                        {target.status === 'Sudah Dikirim' ? 'SENT' : target.status === 'Tidak Ada WA' ? 'NO WA' : 'UNSENT'}
                      </div>
                    </td>
                    <td className="p-4 sm:p-6">
                      <button 
                        onClick={() => setSelectedDetail(target)}
                        className="text-left group/name block w-full"
                      >
                         <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {target.title && (
                              <span className="text-[7px] sm:text-[9px] text-amber-500 font-black uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 shrink-0">
                                {target.title}
                              </span>
                            )}
                            <div className="text-white font-black text-sm sm:text-base uppercase italic tracking-tight leading-none group-hover/name:text-amber-500 transition-colors flex items-center gap-2">
                              {target.nama}
                              {frequencyMap[target.sisproId] > 0 && (
                                <span className="inline-flex items-center gap-1 bg-brand-500/10 px-2 py-0.5 rounded text-[8px] sm:text-[10px] text-brand-400 border border-brand-500/20 not-italic font-black">
                                  <Sparkles size={10} className="text-brand-400" />
                                  {frequencyMap[target.sisproId]}x
                                </span>
                              )}
                            </div>
                         </div>
                         <div className="text-[9px] sm:text-[11px] font-bold text-slate-500/80 font-mono tracking-tight">
                            <span>{target.phone}</span>
                         </div>
                      </button>
                    </td>
                    <td className="p-3 sm:p-5 text-center">
                      <div className="flex justify-center gap-1">
                        {target.status === 'Belum Dikirim' ? (
                          <>
                            {!initiatedIds.has(target.id) ? (
                              <button 
                                onClick={() => handleSendWA(target)}
                                title="KIRIM PESAN WA"
                                className="w-full md:w-auto h-9 md:h-12 px-4 md:px-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 border border-emerald-400/50 group"
                              >
                                <MessageCircle size={14} className="md:w-4 md:h-4" fill="currentColor" fillOpacity={0.2} />
                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">KIRIM PESAN</span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-1 w-full max-w-[140px] md:max-w-none justify-center">
                                <button 
                                  onClick={() => handleUpdateStatus(target.id, 'Sudah Dikirim')}
                                  title="KONFIRMASI SUDAH DIKIRIM"
                                  className="flex-1 h-8 md:h-12 rounded-lg md:rounded-xl bg-blue-500/20 hover:bg-blue-500 text-blue-500 hover:text-white flex flex-col items-center justify-center transition-all border border-blue-500/20 active:scale-95 min-w-0"
                                >
                                  <CheckCircle2 size={12} className="md:w-4 md:h-4" />
                                  <span className="text-[5px] md:text-[7px] font-black uppercase md:mt-0.5">SUDAH</span>
                                </button>
                                <button 
                                  onClick={() => handleUpdateStatus(target.id, 'Tidak Ada WA')}
                                  title="KONFIRMASI TIDAK ADA WA"
                                  className="flex-1 h-8 md:h-12 rounded-lg md:rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-500 hover:text-white flex flex-col items-center justify-center transition-all border border-rose-500/20 active:scale-95 min-w-0"
                                >
                                  <PhoneOff size={12} className="md:w-4 md:h-4" />
                                  <span className="text-[5px] md:text-[7px] font-black uppercase md:mt-0.5">NO WA</span>
                                </button>
                                <button 
                                  onClick={() => handleSendWA(target)}
                                  title="KIRIM ULANG"
                                  className="w-7 h-8 md:w-10 md:h-12 rounded-lg md:rounded-xl bg-white/5 hover:bg-white/10 text-white/30 hover:text-white flex items-center justify-center transition-all border border-white/10"
                                >
                                  <RefreshCw size={10} className="md:w-3.5 md:h-3.5" />
                                </button>
                                <button 
                                  onClick={() => {
                                    setBlacklistingTarget(target);
                                    setShowBlacklistModal(true);
                                  }}
                                  title="BLACKLIST"
                                  className="flex-1 h-8 md:h-12 rounded-lg md:rounded-xl bg-slate-500/20 hover:bg-slate-500 text-slate-500 hover:text-white flex flex-col items-center justify-center transition-all border border-white/10 active:scale-95 min-w-0"
                                >
                                  <PhoneOff size={12} className="md:w-4 md:h-4" />
                                  <span className="text-[5px] md:text-[7px] font-black uppercase md:mt-0.5 whitespace-nowrap">BLOCK</span>
                                </button>
                              </div>
                            )}
                          </>
                        ) : target.status === 'Sudah Dikirim' ? (
                          <div className="flex items-center gap-1.5">
                            <div className="text-emerald-500 flex items-center gap-1 font-black text-[7px] md:text-[10px] tracking-widest italic opacity-60">
                              <CheckCircle size={14} /> <span className="hidden sm:inline uppercase">DITERIMA</span>
                            </div>
                            <button 
                              onClick={() => handleSendWA(target)}
                              title="KIRIM ULANG PESAN"
                              className="p-1.5 md:p-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg transition-all border border-emerald-500/20 active:scale-95"
                            >
                              <RefreshCw size={10} className="md:w-3 md:h-3" />
                            </button>
                            <button 
                              onClick={() => {
                                setBlacklistingTarget(target);
                                setShowBlacklistModal(true);
                              }}
                              className="p-1.5 md:p-2 bg-slate-500/10 hover:bg-slate-500 text-slate-500 hover:text-white rounded-lg transition-all border border-white/10 active:scale-95"
                            >
                              <PhoneOff size={10} className="md:w-3 md:h-3" />
                            </button>
                          </div>
                        ) : target.status === 'Tidak Ada WA' ? (
                          <div className="text-rose-500 flex items-center gap-1 font-black text-[7px] md:text-[10px] tracking-widest italic opacity-60">
                            <PhoneOff size={14} /> <span className="hidden sm:inline uppercase">TANPA WA</span>
                          </div>
                        ) : (
                          <div className="text-gray-500 flex items-center gap-1 font-black text-[7px] md:text-[10px] tracking-widest italic opacity-60">
                            <Trash2 size={14} /> <span className="hidden sm:inline uppercase">BLACKLISTED</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 sm:p-5 text-right">
                       {canDelete && (
                         <button 
                          onClick={() => {
                            if(window.confirm("Hapus target ini?")) onDelete(target.id);
                          }}
                          className="p-2 sm:p-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg sm:rounded-xl transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                       )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8 glass p-4 rounded-3xl border border-white/5 max-w-fit mx-auto">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white disabled:opacity-30 transition-all font-black"
          >
            SEBELUMNYA
          </button>
          
          <div className="flex gap-1">
             {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
               // Simple sliding window for pagination
               let pageNum = i + 1;
               if (totalPages > 5 && currentPage > 3) {
                 pageNum = currentPage - 2 + i;
                 if (pageNum > totalPages) pageNum = totalPages - (4 - i);
               }
               
               return (
                 <button 
                   key={pageNum}
                   onClick={() => setCurrentPage(pageNum)}
                   className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === pageNum ? 'bg-amber-500 text-black' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                 >
                   {pageNum}
                 </button>
               );
             })}
          </div>

          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white disabled:opacity-30 transition-all font-black"
          >
            BERIKUTNYA
          </button>
          
          <div className="ml-4 px-4 text-[10px] font-black text-white/30 uppercase tracking-widest border-l border-white/10">
            HALAMAN {currentPage} DARI {totalPages}
          </div>
        </div>
      )}

      {filteredTargets.length === 0 && (
        <div className="glass p-20 rounded-[3rem] text-center border border-white/5 border-dashed">
           <div className="w-24 h-24 bg-black/20 rounded-full flex items-center justify-center mx-auto mb-6 opacity-30">
              <Clock size={48} />
           </div>
           <p className="text-xs font-black text-white/20 uppercase tracking-[0.5em]">BELUM ADA DATA TARGET YANG SESUAI</p>
        </div>
      )}

      {/* BLACKLIST MODAL */}
      <AnimatePresence>
        {showBlacklistModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowBlacklistModal(false)}
               className="absolute inset-0 bg-black/95 backdrop-blur-md"
             />
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 30 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 30 }}
               className="relative glass p-10 rounded-[3rem] border border-white/20 shadow-2xl max-w-md w-full bg-slate-900/90 text-center"
             >
                <div className="w-20 h-20 bg-rose-500/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 border border-rose-500/30">
                  <PhoneOff className="text-rose-500" size={32} />
                </div>
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-2">BLACKLIST PASIEN</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Pilih alasan pemblokiran untuk pasien:<br/><span className="text-white font-black">{blacklistingTarget?.nama}</span></p>
                
                <div className="space-y-3 mb-8">
                  {['PASIEN TIDAK MAU DI WA', 'PASIEN MENINGGAL', 'SALAH SAMBUNG'].map((reason) => (
                    <button 
                      key={reason}
                      onClick={() => setBlacklistReason(reason)}
                      className={`w-full py-4 rounded-2xl text-[10px] font-black tracking-widest transition-all border-2 ${
                        blacklistReason === reason ? 'bg-rose-500 border-rose-400 text-white' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowBlacklistModal(false)}
                    className="flex-1 py-4 rounded-xl text-[10px] font-black tracking-widest bg-white/5 hover:bg-white/10 text-white/50 transition-all border border-white/10"
                  >
                    BATAL
                  </button>
                  <button 
                    onClick={handleConfirmBlacklist}
                    disabled={!blacklistReason}
                    className="flex-1 py-4 rounded-xl text-[10px] font-black tracking-widest bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-500/20 transition-all disabled:opacity-30 disabled:grayscale"
                  >
                    KONFIRMASI
                  </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {selectedDetail && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 lg:p-10 pointer-events-none">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setSelectedDetail(null)}
               className="absolute inset-0 bg-black/90 backdrop-blur-md pointer-events-auto"
             />
             
             <motion.div 
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-lg bg-[#1a1c23] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden pointer-events-auto"
             >
                <div className="p-8 space-y-8">
                   <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <User className="text-amber-500" size={32} />
                         </div>
                         <div>
                            <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{selectedDetail.nama}</h4>
                            <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-2">{selectedDetail.title} • {selectedDetail.sisproId}</div>
                         </div>
                      </div>
                      <button 
                        onClick={() => setSelectedDetail(null)}
                        className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                      >
                        <X size={20} />
                      </button>
                   </div>

                   <div className="grid grid-cols-1 gap-4">
                      <div className="glass bg-white/5 p-6 rounded-2xl border border-white/5">
                         <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2 block">STATUS PENGIRIMAN</label>
                         <div className="flex items-center gap-3">
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedDetail.status === 'Sudah Dikirim' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'}`}>
                               {selectedDetail.status}
                            </div>
                            {selectedDetail.sentAt && (
                               <span className="text-[10px] font-bold text-slate-500">
                                 Pukul {new Date(selectedDetail.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </span>
                            )}
                         </div>
                         {frequencyMap[selectedDetail.sisproId] > 0 && (
                           <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">RIWAYAT KONTAK</span>
                              <div className="flex items-center gap-2 text-brand-400 font-bold text-xs italic">
                                 <Sparkles size={14} /> Terhubung {frequencyMap[selectedDetail.sisproId]}x sebelumnya
                              </div>
                           </div>
                         )}
                      </div>

                      <div className="glass bg-white/5 p-6 rounded-2xl border border-white/5">
                         <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2 block">NOMOR WHATSAPP</label>
                         <div className="text-lg font-black text-white font-mono tracking-wider">{selectedDetail.phone}</div>
                      </div>

                      {selectedDetail.petugasNama && (
                        <div className="glass bg-white/5 p-6 rounded-2xl border border-white/5">
                           <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2 block">PETUGAS TERKAIT</label>
                           <div className="text-sm font-black text-blue-400 uppercase italic tracking-widest flex items-center gap-2">
                              {selectedDetail.petugasNama}
                           </div>
                        </div>
                      )}

                      <div className="glass bg-white/5 p-6 rounded-2xl border border-white/5">
                         <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2 block">PREVIEW PESAN</label>
                         <div className="text-[11px] font-medium text-slate-400 bg-black/40 p-4 rounded-xl border border-white/5 whitespace-pre-line font-mono max-h-40 overflow-y-auto custom-scrollbar">
                            {(() => {
                              let base = selectedDetail.messageOverride;
                              const activeTemplates = currentActiveSetup?.variations || currentActiveSetup?.templates || [];
                              
                              if (!base && activeTemplates.length > 0) {
                                // Filter targets by SAME staff for preview consistency
                                const targetsBySameStaff = targets.filter(t => t.petugasNama === selectedDetail.petugasNama);
                                const staffIndex = targetsBySameStaff.findIndex(t => t.id === selectedDetail.id);
                                if (staffIndex !== -1) {
                                  base = activeTemplates[staffIndex % activeTemplates.length];
                                }
                              }
                              if (!base) base = currentActiveSetup?.template || "";
                              
                              return base
                                .replace(/<WAKTU>/g, getWaktuGreeting())
                                .replace(/<TITLE>/g, selectedDetail.title)
                                .replace(/<NAMA>/g, selectedDetail.nama)
                                .replace(/<NAMA PETUGAS>/g, selectedDetail.petugasNama || "");
                            })()}
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      {selectedDetail.status === 'Belum Dikirim' && (
                        <button 
                          onClick={() => {
                            handleSendWA(selectedDetail);
                            setSelectedDetail(null);
                          }}
                          className="btn btn-primary h-16 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center justify-center gap-3 shadow-xl shadow-brand-500/20"
                        >
                          <MessageCircle size={20} /> KIRIM SEKARANG
                        </button>
                      )}
                      {selectedDetail.status === 'Belum Dikirim' && (
                        <button 
                          onClick={() => {
                            handleUpdateStatus(selectedDetail.id, 'Sudah Dikirim');
                            setSelectedDetail(null);
                          }}
                          className="btn btn-success h-16 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20"
                        >
                          <CheckCircle size={20} /> TANDAI KIRIM
                        </button>
                      )}
                      {selectedDetail.status === 'Sudah Dikirim' && (
                        <button 
                          onClick={() => {
                            handleSendWA(selectedDetail);
                            setSelectedDetail(null);
                          }}
                          className="btn btn-primary h-16 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center justify-center gap-3"
                        >
                          <RefreshCw size={20} /> KIRIM ULANG
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          if(window.confirm("Hapus target data ini?")) {
                            onDelete(selectedDetail.id);
                            setSelectedDetail(null);
                          }
                        }}
                        className={`btn h-16 rounded-2xl font-black text-xs tracking-widest uppercase flex items-center justify-center gap-3 ${selectedDetail.status === 'Belum Dikirim' ? 'col-span-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white' : 'btn-ghost border border-white/10'}`}
                      >
                        <Trash2 size={20} /> {selectedDetail.status === 'Sudah Dikirim' ? 'HAPUS DATA' : 'HAPUS'}
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* COOLING DOWN MODAL */}
      <AnimatePresence>
        {showCoolDownModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm glass bg-rose-500/10 border border-rose-500/20 rounded-[3rem] p-10 text-center shadow-2xl shadow-rose-500/20"
            >
              <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-500/30">
                <Clock className="text-rose-500 animate-pulse" size={40} />
              </div>
              <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">COOLING DOWN</h3>
              <p className="text-xs font-bold text-rose-200/60 uppercase tracking-widest leading-relaxed mb-8">
                Anda mengirim pesan terlalu cepat. Keamanan akun WhatsApp Anda adalah prioritas kami.
              </p>
              
              <div className="glass bg-black/40 rounded-2xl p-6 border border-rose-500/20 mb-8">
                <div className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-2">DAPAT MENGIRIM KEMBALI DALAM</div>
                <div className="text-4xl font-black text-white italic tracking-tighter">
                  {Math.floor(coolDownSeconds / 60)}m {coolDownSeconds % 60}s
                </div>
              </div>

              <button 
                onClick={() => setShowCoolDownModal(false)}
                className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-widest transition-all"
              >
                MENGERTI, SAYA AKAN MENUNGGU
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
