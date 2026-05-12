import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Save, FileUp, Zap, Info, Trash2, Image as ImageIcon, X, RefreshCw, Send, CheckCircle2, Sparkles, Filter, Search, History, Users, Plus, FileSpreadsheet, MoreVertical, CheckCircle, AlertCircle, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { WASetup, WATarget, Staff, WAHistory, WABlacklist } from '../types';

interface WAPersonalSetupProps {
  setup: WASetup | null;
  setups?: { [key: string]: WASetup };
  staffs?: Staff[];
  targets?: WATarget[];
  history?: WAHistory[];
  onSaveSetup: (setup: WASetup, targetCount?: number, slotId?: string) => Promise<void>;
  onSaveStaff?: (staff: Staff) => Promise<void>;
  onDeleteStaff?: (id: string) => Promise<void>;
  onAddTargets: (targets: WATarget[]) => void;
  onClearTargets: () => void;
  onResetAllData?: () => Promise<void>;
  targetCount: number;
  waBlacklist?: WABlacklist[];
  userEmail?: string | null;
  permissions?: { canAdd: boolean; canEdit: boolean; canDelete: boolean; isAdmin: boolean };
  isCBG?: boolean;
  onNavigate?: (view: string) => void;
}

const DEFAULT_STAFF_NAMES = [
  'Deasy', 'Mustika', 'Helly', 'Sukaeri', 'Sita',
  'Devy', 'Ayu', 'Lina', 'Annisa', 'Ros',
  'Fiona', 'Restu', 'Riska', 'Diah', 'Putri',
  'Elia', 'DHIAN', 'Triyana', 'Riya', 'Ratno', 'Ashri'
];

export default function WAPersonalSetup({ 
  setup, setups = {}, staffs = [], targets = [], history = [], onSaveSetup, onSaveStaff, onDeleteStaff,
  onAddTargets, onClearTargets, onResetAllData, targetCount, waBlacklist = [], userEmail, permissions, isCBG, onNavigate
}: WAPersonalSetupProps) {
  const isAdmin = permissions?.isAdmin || userEmail === 'fauzanfawwaz2404@gmail.com';
  const canAdd = permissions?.canAdd || isAdmin;
  const canEdit = permissions?.canEdit || isAdmin;
  const canDelete = permissions?.canDelete || isAdmin;
  
  // Slot management for CBG
  const [activeSlot, setActiveSlot] = useState<string>('slot_1');
  
  // Greeting dynamic logic
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 9) return "Selamat pagi";
    if (hour >= 9 && hour < 15) return "Selamat siang";
    if (hour >= 15 && hour < 18) return "Selamat sore";
    return "Selamat malam";
  };

  const defaultGreeting = getGreeting();
  
  // Internal state that maps to the active slot or the single setup
  const currentSetup = isCBG ? setups[activeSlot] : setup;

  const [tema, setTema] = useState(currentSetup?.tema || '');
  const [startDate, setStartDate] = useState(currentSetup?.startDate || '');
  const [deadline, setDeadline] = useState(currentSetup?.deadline || '');
  const [image, setImage] = useState<string | null>(currentSetup?.image || null);
  const [templates, setTemplates] = useState<string[]>(() => {
    if (currentSetup?.templates && currentSetup.templates.length === 5) return currentSetup.templates;
    const initial = ['<WAKTU> <TITLE> <NAMA>', '', '', '', ''];
    if (currentSetup?.template) initial[0] = currentSetup.template;
    else if (currentSetup?.templates && currentSetup.templates.length > 0) {
      currentSetup.templates.forEach((t, i) => { if (i < 5) initial[i] = t; });
    }
    return initial;
  });
  const [activeTemplateIdx, setActiveTemplateIdx] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // CBG distribution states
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(currentSetup?.staffIds || []);
  const [targetPerStaff, setTargetPerStaff] = useState<number>(
    currentSetup ? (currentSetup.targetPerStaff !== undefined ? currentSetup.targetPerStaff : 50) : 0
  );
  const [newStaffName, setNewStaffName] = useState('');
  const [isAddingStaff, setIsAddingStaff] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(!!currentSetup?.tema);
  const [isSavingTargets, setIsSavingTargets] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [previewData, setPreviewData] = useState<WATarget[]>([]);
  const [targetFilter, setTargetFilter] = useState<'ALL' | 'NEW' | 'CONTACTED' | 'NO_WA' | 'BLACKLIST'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 100;

  const [isImporting, setIsImporting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Helper: Get contact count for a specific target based on history
  const getContactHistory = useMemo(() => {
    const counts: { [key: string]: number } = {};
    history.forEach(h => {
      // Record by SISPRO ID
      if (h.sisproId && !h.sisproId.toString().startsWith('SYS-')) {
        const idKey = h.sisproId.toString().trim();
        counts[idKey] = (counts[idKey] || 0) + 1;
      }
    });
    return counts;
  }, [history]);

  // Handle data mapping with history status
  const previewWithStatus = useMemo(() => {
    return previewData.map(t => {
      const idKey = t.sisproId ? t.sisproId.toString().trim() : '';
      const phoneKey = t.phone ? t.phone.toString().trim() : '';

      const finalCount = (idKey && !idKey.startsWith('SYS-')) 
        ? (getContactHistory[idKey] || 0) 
        : 0;
      
      const isBlacklisted = waBlacklist.some(b => 
        (b.sisproId && b.sisproId.toString().trim() === idKey) || 
        (b.phone && b.phone.toString().trim() === phoneKey)
      );
      
      const isNoWa = history.some(h => 
        (h.sisproId && h.sisproId.toString().trim() === idKey) && 
        (h.status === 'Tidak Ada WA')
      );

      return {
        ...t,
        contactCount: finalCount,
        isBlacklisted,
        isNoWa
      };
    });
  }, [previewData, getContactHistory, waBlacklist, history]);

  const filteredPreview = useMemo(() => {
    let result = [];
    switch(targetFilter) {
      case 'NEW': result = previewWithStatus.filter(t => t.contactCount === 0 && !t.isBlacklisted && !t.isNoWa); break;
      case 'CONTACTED': result = previewWithStatus.filter(t => t.contactCount > 0 && !t.isBlacklisted && !t.isNoWa); break;
      case 'NO_WA': result = previewWithStatus.filter(t => t.isNoWa); break;
      case 'BLACKLIST': result = previewWithStatus.filter(t => t.isBlacklisted); break;
      default: result = previewWithStatus;
    }

    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(t => 
        (t.nama && t.nama.toLowerCase().includes(lowerSearch)) ||
        (t.phone && t.phone.toString().includes(lowerSearch)) ||
        (t.sisproId && t.sisproId.toString().includes(lowerSearch))
      );
    }

    return result;
  }, [previewWithStatus, targetFilter, searchTerm]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [targetFilter, searchTerm, previewData.length]);

  const storageLimit = useMemo(() => {
    const staffCount = isCBG ? selectedStaffIds.length : 0;
    const totalCapacity = isCBG ? staffCount * targetPerStaff : filteredPreview.length;
    return isCBG && totalCapacity > 0 ? Math.min(totalCapacity, 5000) : 5000;
  }, [isCBG, selectedStaffIds.length, targetPerStaff, filteredPreview.length]);

  const displaySaveCount = Math.min(filteredPreview.length, storageLimit);

  const totalPages = Math.ceil(filteredPreview.length / ITEMS_PER_PAGE);
  
  const paginatedPreview = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPreview.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPreview, currentPage]);

  const statsPreview = useMemo(() => {
    return {
      new: previewWithStatus.filter(t => t.contactCount === 0 && !t.isBlacklisted && !t.isNoWa).length,
      contacted: previewWithStatus.filter(t => t.contactCount > 0 && !t.isBlacklisted && !t.isNoWa).length,
      noWa: previewWithStatus.filter(t => t.isNoWa).length,
      blacklist: previewWithStatus.filter(t => t.isBlacklisted).length,
      total: previewWithStatus.length
    };
  }, [previewWithStatus]);
  const [useAllVariations, setUseAllVariations] = useState(currentSetup?.useAllVariations || false);
  const [distributeEqually, setDistributeEqually] = useState(currentSetup?.distributeEqually || false);
  const [cooldownLimit, setCooldownLimit] = useState(currentSetup?.cooldownLimit || 5);
  const [cooldownDuration, setCooldownDuration] = useState(currentSetup?.cooldownDuration || 60);

  // Sync state when slot or setup prop changes
  useEffect(() => {
    const s = isCBG ? setups[activeSlot] : setup;
    if (s) {
      if (s.tema !== tema) setTema(s.tema || '');
      if (s.startDate !== startDate) setStartDate(s.startDate || '');
      if (s.deadline !== deadline) setDeadline(s.deadline || '');
      if (s.image !== image) setImage(s.image || null);
      
      const newTemplates = s.templates && s.templates.length === 5 
        ? s.templates 
        : (s.template ? [s.template, '', '', '', ''] : ['<WAKTU> <TITLE> <NAMA>', '', '', '', '']);
      
      if (JSON.stringify(newTemplates) !== JSON.stringify(templates)) {
        setTemplates(newTemplates);
      }
      
      if (JSON.stringify(s.staffIds || []) !== JSON.stringify(selectedStaffIds)) {
        setSelectedStaffIds(s.staffIds || []);
      }
      
      const newTargetPerStaff = s.targetPerStaff !== undefined ? s.targetPerStaff : 50;
      if (newTargetPerStaff !== targetPerStaff) {
        setTargetPerStaff(newTargetPerStaff);
      }
      
      const activeUseAll = !!(s as any).useAllVariations;
      if (activeUseAll !== useAllVariations) {
        setUseAllVariations(activeUseAll);
      }
      
      const activeDistribute = !!(s as any).distributeEqually;
      if (activeDistribute !== distributeEqually) {
        setDistributeEqually(activeDistribute);
      }

      const activeCooldownLimit = s.cooldownLimit !== undefined ? s.cooldownLimit : 5;
      if (activeCooldownLimit !== cooldownLimit) {
        setCooldownLimit(activeCooldownLimit);
      }

      const activeCooldownDuration = s.cooldownDuration !== undefined ? s.cooldownDuration : 60;
      if (activeCooldownDuration !== cooldownDuration) {
        setCooldownDuration(activeCooldownDuration);
      }
      
      const newLocked = !!s.tema;
      if (newLocked !== isLocked) {
        setIsLocked(newLocked);
      }
    } else {
      // Reset for new/empty slot only if not already empty
      if (tema !== '') setTema('');
      if (startDate !== '') setStartDate('');
      if (deadline !== '') setDeadline('');
      if (image !== null) setImage(null);
      if (templates[0] !== '<WAKTU> <TITLE> <NAMA>' || templates.slice(1).some(t => t !== '')) {
         setTemplates(['<WAKTU> <TITLE> <NAMA>', '', '', '', '']);
      }
      if (selectedStaffIds.length > 0) setSelectedStaffIds([]);
      if (targetPerStaff !== 0) setTargetPerStaff(0);
      if (useAllVariations !== false) setUseAllVariations(false);
      if (distributeEqually !== false) setDistributeEqually(false);
      if (cooldownLimit !== 5) setCooldownLimit(5);
      if (cooldownDuration !== 60) setCooldownDuration(60);
      if (isLocked !== false) setIsLocked(false);
      if (previewData.length > 0) setPreviewData([]);
    }
  }, [activeSlot, setup, setups, isCBG]);

  const displayStaffs = useMemo(() => {
    // Priority 1: Use staffs from database if they exist
    if (staffs.length > 0) {
      return [...staffs]
        .map(s => ({
          ...s,
          // Mandatory spelling correction for DHIAN
          nama: ((s.nama || "").toUpperCase() === 'DIAN' || (s.nama || "").toUpperCase() === 'DHYAN') ? 'DHIAN' : s.nama
        }))
        .sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
    }
    
    // Priority 2: If we are in CBG mode and really have NO staff yet, return defaults
    // but only as a fallback, don't necessarily sort/return yet if we might be loading
    return DEFAULT_STAFF_NAMES.map((nama, idx) => ({
      id: `staff_init_${idx}`,
      nama,
      role: 'PETUGAS_CBG' as const
    })).sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
  }, [staffs]);

  // Logic for multi-slot campaign
  const otherSlotId = activeSlot === 'slot_1' ? 'slot_2' : 'slot_1';
  const otherSlotStaffIds = useMemo(() => setups?.[otherSlotId]?.staffIds || [], [setups, otherSlotId]);
  
  const availableStaffs = useMemo(() => {
    return displayStaffs.filter(s => !otherSlotStaffIds.includes(s.id));
  }, [displayStaffs, otherSlotStaffIds]);

  useEffect(() => {
    // Only auto-initialize if it's explicitly empty AND we are positive (not just loading)
    // But since we don't have a 'loading' prop here, we skip auto-init to be safe 
    // unless the user explicitly triggers it or the lists are truly empty over time.
    // To prevent confusion, I'll comment out the auto-init for now.
    /*
    if (isCBG && staffs.length === 0 && onSaveStaff && canAdd) {
      DEFAULT_STAFF_NAMES.forEach((name, idx) => {
        setTimeout(() => {
          onSaveStaff({ id: `staff_init_${idx}`, nama: name, role: 'PETUGAS_CBG' });
        }, idx * 100);
      });
    }
    */
  }, [isCBG, staffs.length, canAdd]);

  // Sample data for preview
  const sampleTarget = { title: "Bapak", nama: "Fauzan" };
  const currentTemplate = templates[activeTemplateIdx] || templates[0] || "";
  const previewMessage = currentTemplate
    .replace(/<WAKTU>/g, defaultGreeting)
    .replace(/<TITLE>/g, sampleTarget.title)
    .replace(/<NAMA>/g, sampleTarget.nama)
    .replace(/<NAMA PETUGAS>/g, "Nama Petugas Anda");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // Allow up to 5MB original but will compress
        alert("Ukuran gambar asal terlalu besar (Maks 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onload = (prev) => {
        const img = new Image();
        img.src = prev.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setImage(dataUrl);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImporting(true);
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target?.result;
          const wb = XLSX.read(data, { type: 'array' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const rawData = XLSX.utils.sheet_to_json(ws, { defval: "" }) as any[];

          if (rawData.length === 0) {
            alert("File Excel kosong atau tidak terbaca.");
            setIsImporting(false);
            return;
          }

          const mapped: WATarget[] = rawData.map((row, idx) => {
            const findVal = (possibilities: string[]) => {
              const matchedKey = Object.keys(row).find(k => {
                const normalizedK = k.toString().replace(/[\s_-]/g, '').toUpperCase();
                return possibilities.some(p => p.replace(/[\s_-]/g, '').toUpperCase() === normalizedK);
              });
              const val = matchedKey ? row[matchedKey] : '';
              return val !== undefined && val !== null ? String(val).trim() : '';
            };

            const sisproId = findVal(['ID SISPRO', 'IDSISPRO', 'ID_SISPRO', 'ID_PASIEN', 'SISPRO', 'NO RM', 'NORM', 'RM']);
            const title = findVal(['TITLE', 'GELAR', 'SAPAAN', 'MRS', 'MS', 'PANGGILAN']);
            const nama = findVal(['NAMA', 'NAME', 'NAMA_LENGKAP', 'NAMALENGKAP', 'NAMA PASIEN', 'NAMAPASIEN']);
            let phone = findVal(['NOMOR WA', 'NOMOR_WA', 'NOMORWA', 'WA', 'PHONE', 'TELEPON', 'NO_WA', 'WHATSAPP', 'NO HP', 'NOHP', 'HANDPHONE', 'MOBILE', 'NO.HP', 'CELLULAR']);
            
            // Clean phone
            const originalPhone = phone;
            phone = phone.replace(/\D/g, ''); 
            if (phone.startsWith('0')) {
              phone = '62' + phone.substring(1);
            } else if (phone.startsWith('8')) {
              phone = '628' + phone.substring(1);
            } else if (phone.length > 0 && !phone.startsWith('62')) {
              phone = '62' + phone;
            }

            // Validation: Must be mobile number (starts with 628) and not empty
            // Landlines (021, 022, etc) will start with 622... after cleaning
            const isInvalidPhone = !phone || !phone.startsWith('628') || phone.length < 10;

            return {
              id: `wa_pre_${Math.random().toString(36).substring(2, 9)}_${Date.now()}_${idx}`,
              sisproId: sisproId || `SYS-${idx}`,
              title: title || '',
              nama: nama || 'Tanpa Nama',
              phone: phone,
              isInvalidPhone,
              status: 'Belum Dikirim' as 'Belum Dikirim' | 'Sudah Dikirim'
            };
          }).filter(t => !t.isInvalidPhone);

          const uniqueMapped: WATarget[] = [];
          const seenPhones = new Set<string>();
          
          // Get IDs of patients who have been marked "Tidak Ada WA" in history
          const noWaIds = new Set(history.filter(h => h.status === 'Tidak Ada WA').map(h => h.sisproId));
          
          // Get IDs of patients in Blacklist
          const blacklistIds = new Set(waBlacklist.map(b => b.sisproId));
          
          // Get IDs/Phones already in current targets to avoid immediate duplicates if targets exist
          const existingPhones = new Set(targets.map(t => t.phone));
          const existingIds = new Set(targets.map(t => t.sisproId));

          let duplicateInFile = 0;
          let noWaFound = 0;
          let blacklistedFound = 0;
          let alreadyInTargets = 0;
          let invalidPhoneCount = rawData.length - mapped.length; // Approximate from filter at mapping stage

          mapped.forEach(item => {
            // Check for invalid phone again or if it was filtered in mapping stage
            // We need to recount specifically for the alert
            
            // Rule 1: No duplicate phone numbers in the same import list
            if (seenPhones.has(item.phone)) {
              duplicateInFile++;
              return;
            }
            
            // Rule 2: Skip if sisproId is in the No WA list
            if (noWaIds.has(item.sisproId)) {
              noWaFound++;
              return;
            }

            // Rule 3: Skip if in Blacklist
            if (blacklistIds.has(item.sisproId)) {
              blacklistedFound++;
              return;
            }

            // Rule 4: Skip if already in current campaign (targets prop)
            if (existingPhones.has(item.phone) || (item.sisproId && !item.sisproId.startsWith('SYS-') && existingIds.has(item.sisproId))) {
              alreadyInTargets++;
              return;
            }

            seenPhones.add(item.phone);
            uniqueMapped.push(item);
          });

          // Accurate count of entries skipped during initial filter vs total raw data
          invalidPhoneCount = rawData.length - uniqueMapped.length - duplicateInFile - noWaFound - blacklistedFound - alreadyInTargets;

          console.log("Excel Raw Data:", rawData);
          console.log("Unique & Filtered Data:", uniqueMapped.length);

          if (uniqueMapped.length > 0) {
            setPreviewData(uniqueMapped);
            let message = `${uniqueMapped.length} data target berhasil dimuat.`;
            if (duplicateInFile > 0 || noWaFound > 0 || blacklistedFound > 0 || alreadyInTargets > 0 || invalidPhoneCount > 0) {
              message += `\n\nDetail data yang disaring/dihapus otomatis:`;
              if (invalidPhoneCount > 0) message += `\n- ${invalidPhoneCount} No. HP Tidak Valid / Telepon Rumah (021/Lainnya)`;
              if (duplicateInFile > 0) message += `\n- ${duplicateInFile} Duplikat dalam file`;
              if (noWaFound > 0) message += `\n- ${noWaFound} Masuk daftar 'Tidak Ada WA'`;
              if (blacklistedFound > 0) message += `\n- ${blacklistedFound} Masuk daftar 'BLACKLIST'`;
              if (alreadyInTargets > 0) message += `\n- ${alreadyInTargets} Sudah ada di target aktif`;
              alert(message);
            }
          } else {
            let errorMsg = "Tidak ada data valid yang bisa diimpor.";
            errorMsg += "\nSemua data disaring atau dihapus karena:";
            if (invalidPhoneCount > 0) errorMsg += `\n- ${invalidPhoneCount} No. HP Tidak Valid / Telepon Rumah (021/Lainnya)`;
            if (duplicateInFile > 0) errorMsg += `\n- ${duplicateInFile} Duplikat dalam file`;
            if (noWaFound > 0) errorMsg += `\n- ${noWaFound} Masuk daftar 'Tidak Ada WA'`;
            if (blacklistedFound > 0) errorMsg += `\n- ${blacklistedFound} Masuk daftar 'BLACKLIST'`;
            if (alreadyInTargets > 0) errorMsg += `\n- ${alreadyInTargets} Sudah ada di target aktif`;
            alert(errorMsg);
          }
        } catch (err) {
          console.error(err);
          alert("Gagal membaca file Excel.");
        } finally {
          setIsImporting(false);
        }
      };
      reader.readAsArrayBuffer(file);
    }
    // Reset input
    e.target.value = '';
  };

  const addStaff = async () => {
    if (!newStaffName.trim() || !onSaveStaff) return;
    setIsAddingStaff(true);
    try {
      await onSaveStaff({ id: `staff_${Date.now()}`, nama: newStaffName.trim(), role: 'PETUGAS_CBG' });
      setNewStaffName('');
    } finally {
      setIsAddingStaff(false);
    }
  };

  // Handle Staff Selection Grid
  const toggleStaff = (id: string, staffData?: Staff) => {
    if (isLocked) return;
    
    // If it's a "temporary" staff from DEFAULT_STAFF_NAMES, save it to DB first
    if (id.startsWith('staff_init_') && staffData && onSaveStaff) {
       onSaveStaff(staffData);
    }

    setSelectedStaffIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const selectAllStaff = () => {
    if (isLocked) return;
    // Only select staff that are available and NOT used in the other slot
    const currentList = availableStaffs; 
    const currentListIds = currentList.map(s => s.id);
    
    if (currentListIds.length === 0) return;

    const allSelected = currentListIds.length > 0 && currentListIds.every(id => selectedStaffIds.includes(id));

    if (allSelected) {
      setSelectedStaffIds(prev => prev.filter(id => !currentListIds.includes(id)));
    } else {
      setSelectedStaffIds(prev => {
        const newIds = [...prev];
        currentListIds.forEach(id => {
          if (!newIds.includes(id)) newIds.push(id);
        });
        return newIds;
      });
    }
  };

  const handleSaveToTarget = async () => {
    if (filteredPreview.length > 0) {
        const staffCount = isCBG ? selectedStaffIds.length : 0;
        const totalCapacity = isCBG ? staffCount * targetPerStaff : filteredPreview.length;
        
        // Slicing logic: Jika isCBG, kita batasi data yang disimpan sesuai alokasi petugas.
        // Jika tidak isCBG, tetap gunakan batas aman firestore (5000).
        const safetyLimit = 5000;
        const storageLimit = isCBG && totalCapacity > 0 ? Math.min(totalCapacity, safetyLimit) : safetyLimit;

        if (filteredPreview.length > storageLimit) {
          const detailMsg = isCBG 
            ? `Berdasarkan alokasi (${staffCount} Petugas x ${targetPerStaff} Target), hanya dibutuhkan ${totalCapacity} data.\n\nSistem akan mengambil ${storageLimit} data teratas dari total ${filteredPreview.length} data yang diimport.\n\nSimpan sekarang?`
            : `Peringatan: Anda mencoba menyimpan ${filteredPreview.length} data.\n\nBatas aman database adalah ${safetyLimit} data (Max 1MB). Sistem akan memotong otomatis menjadi ${safetyLimit} data teratas agar performa tetap terjaga.\n\nLanjutkan?`;
          
          const confirmSlice = window.confirm(detailMsg);
          if (!confirmSlice) return;
        }

        setIsSavingTargets(true);
        try {
          // Normalize setup data to save alongside targets
          const setupPayload: WASetup = {
            tema,
            template: templates[0],
            startDate: startDate || "",
            deadline: deadline || "",
            image: image || "",
            templates,
            staffIds: isCBG ? selectedStaffIds : [],
            targetPerStaff: isCBG ? targetPerStaff : 0,
            // @ts-ignore
            useAllVariations,
            // @ts-ignore
            distributeEqually
          };

          let finalTargets: WATarget[] = [];
          
          // Potong data sesuai limit sebelum pemrosesan lebih lanjut
          const slicedPreview = filteredPreview.slice(0, storageLimit);
          
          const dataToSave = slicedPreview.map(t => ({
             sisproId: t.sisproId,
             title: t.title,
             nama: t.nama,
             phone: t.phone,
             id: t.id,
             status: t.status,
             tema: tema
          })) as WATarget[];

          if (isCBG && selectedStaffIds.length > 0) {
            // Smart Distribution menggunakan data yang sudah dipotong
            const activeStaffs = displayStaffs.filter(s => selectedStaffIds.includes(s.id));
            
            if (activeStaffs.length === 0) {
               alert("Silakan pilih petugas untuk alokasi target.");
               setIsSavingTargets(false);
               return;
            }

            for (const staff of activeStaffs) {
              if (staff.id.startsWith('staff_init_') && onSaveStaff) {
                await onSaveStaff(staff);
              }
            }

            let availableData = [...dataToSave];
            const staffCount = activeStaffs.length;

            let itemsPerStaff = targetPerStaff;
            
            if (distributeEqually || availableData.length < (targetPerStaff * staffCount)) {
               itemsPerStaff = Math.floor(availableData.length / staffCount);
            } else {
               const totalCapacity = targetPerStaff * staffCount;
               if (availableData.length > totalCapacity) {
                  availableData = availableData.slice(0, totalCapacity);
               }
            }

            let currentIndex = 0;
            const filledTemplates = templates.filter(t => t.trim().length > 0);
            const variationCount = filledTemplates.length > 0 ? filledTemplates.length : 1;
            
            activeStaffs.forEach((staff, staffIdx) => {
              let staffVariationIdx = 0;
              const extra = (distributeEqually || availableData.length < (targetPerStaff * staffCount)) 
                ? (staffIdx < (availableData.length % staffCount) ? 1 : 0)
                : 0;
              
              const currentLoadCount = itemsPerStaff + extra;
              const staffLoad = availableData.slice(currentIndex, currentIndex + currentLoadCount);
              
              const mapped = staffLoad.map((t) => {
                const assignedTemplate = (useAllVariations && filledTemplates.length > 0) 
                  ? filledTemplates[staffVariationIdx % variationCount] 
                  : templates[0];
                
                staffVariationIdx++;

                return {
                   ...t,
                   id: t.id.replace('wa_pre_', 'wa_'),
                   petugasId: staff.id,
                   petugasNama: staff.nama,
                   messageOverride: assignedTemplate,
                   tema: tema // Pastikan tema ikut tersimpan
                };
              });
              finalTargets = [...finalTargets, ...mapped];
              currentIndex += currentLoadCount;
            });
            
            if (finalTargets.length < dataToSave.length) {
              const diff = dataToSave.length - finalTargets.length;
              const confirmRem = window.confirm(`${finalTargets.length} target dialokasikan. ${diff} data sisa akan dihapus agar alokasi petugas merata. Lanjutkan?`);
              if (!confirmRem) {
                setIsSavingTargets(false);
                return;
              }
            }
          } else {
            // Standard assignment (no staff)
            finalTargets = dataToSave.map(t => ({
              ...t,
              id: t.id.replace('wa_pre_', 'wa_'),
              tema: tema // Pastikan tema ikut tersimpan
            }));
          }

          if (finalTargets.length === 0) {
            alert('Tidak ada data target yang valid untuk disimpan.');
            setIsSavingTargets(false);
            return;
          }

          if (isCBG && selectedStaffIds.length === 0) {
            if (!confirm('Peringatan: Anda belum memilih petugas untuk alokasi data di Kampanye B. Data akan disimpan sebagai "UNASSIGNED". Lanjutkan?')) {
               setIsSavingTargets(false);
               return;
            }
          }

          // SIMPAN SETUP & TARGET SECARA BERSAMAAN
          await onSaveSetup(setupPayload, finalTargets.length);
          await onAddTargets(finalTargets);
          
          alert(`${finalTargets.length} data target berhasil disimpan secara permanen!`);
          setPreviewData([]);
          
          // Navigation to TARGET WA (CBG or Personal based on context)
          if (onNavigate) {
            onNavigate(isCBG ? 'wa-cbg-target' : 'wa-personal-target');
          }
        } catch (err: any) {
          console.error(err);
          alert("Gagal menyimpan data: " + (err.message || "Terjadi kesalahan pada database"));
        } finally {
          setIsSavingTargets(false);
        }
    }
  };

  const removeRow = (id: string) => {
    setPreviewData(prev => prev.filter(t => t.id !== id));
  };

  const downloadHeaderTemplate = () => {
    const headers = [["ID SISPRO", "TITLE", "NAMA", "NOMOR WA"]];
    const data = [
      ["0126020900024", "Bapak", "Ag Sudibyo", "08161130999"],
      ["", "Ibu", "Contoh Nama", "08123456789"]
    ];
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "TEMPLATE_TARGET_WA.xlsx");
  };

  const [isResetConfirming, setIsResetConfirming] = useState(false);

  const handleResetAll = async () => {
    if (!isAdmin) return;
    
    if (!isResetConfirming) {
      setIsResetConfirming(true);
      // Auto-cancel after 8 seconds if not clicked again
      setTimeout(() => setIsResetConfirming(false), 8000);
      return;
    }

    setIsSaving(true);
    try {
      if (onResetAllData) {
        await onResetAllData();
        // Force manual state reset for safety
        setTema('');
        setStartDate('');
        setDeadline('');
        setTemplates(['<WAKTU> <TITLE> <NAMA>', '', '', '', '']);
        setSelectedStaffIds([]);
        setTargetPerStaff(0);
        setPreviewData([]);
        
        setIsResetConfirming(false);
        // Show success briefly
        const successEl = document.createElement('div');
        successEl.className = 'fixed top-24 left-1/2 -translate-x-1/2 bg-rose-600 text-white p-6 rounded-2xl shadow-2xl z-[200] animate-bounce font-black uppercase text-center';
        successEl.innerHTML = `
          <div class="text-xs opacity-80 mb-1">RESET BERHASIL</div>
          <div class="text-xl">DATA ${isCBG ? 'KAMPANYE B (SDM CABANG)' : 'KAMPANYE A (PERSONAL)'}</div>
          <div class="text-[10px] mt-2 opacity-60">SISTEM TELAH DIKOSONGKAN</div>
        `;
        document.body.appendChild(successEl);
        setTimeout(() => successEl.remove(), 4000);
      }
    } catch (err: any) {
      alert("Gagal mereset data: " + (err.message || "Kesalahan database"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!tema || !templates[0] || !startDate || !deadline) {
      alert("Semua field (Tema, Konten Pesan Utama, Tgl Mulai, Deadline) wajib diisi!");
      return;
    }
    
    setIsSaving(true);
    try {
      // Normalize data to avoid 'undefined' values which crash Firebase
      const payload: WASetup = {
        tema,
        template: templates[0],
        startDate: startDate || "",
        deadline: deadline || "",
        image: image || "",
        templates,
        staffIds: isCBG ? selectedStaffIds : [],
        targetPerStaff: isCBG ? targetPerStaff : 0,
        // @ts-ignore
        useAllVariations,
        // @ts-ignore
        distributeEqually,
        cooldownLimit,
        cooldownDuration
      };

      await onSaveSetup(payload, undefined, isCBG ? activeSlot : undefined);
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setIsLocked(true);
    } catch (err: any) {
      console.error(err);
      alert("Gagal menyimpan data: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyToExisting = async () => {
    if (!tema || !templates[0] || !startDate || !deadline) {
      alert("Semua field (Tema, Konten Pesan Utama, Tgl Mulai, Deadline) wajib diisi!");
      return;
    }

    const unsentTargets = targets.filter(t => t.status === 'Belum Dikirim');
    const relevantUnsentTargets = isCBG 
      ? unsentTargets.filter(t => t.petugasId && selectedStaffIds.includes(t.petugasId))
      : unsentTargets;

    if (relevantUnsentTargets.length === 0) {
      alert("Tidak ada target 'Belum Dikirim' yang bisa diupdate untuk pengaturan ini.");
      return;
    }

    if (!window.confirm(`Sistem akan memperbarui konten pesan untuk ${relevantUnsentTargets.length} target yang belum dikirim sesuai variasi saat ini. Lanjutkan?`)) {
      return;
    }

    setIsSaving(true);
    try {
      const payload: WASetup = {
        tema,
        template: templates[0],
        startDate: startDate || "",
        deadline: deadline || "",
        image: image || "",
        templates,
        staffIds: isCBG ? selectedStaffIds : [],
        targetPerStaff: isCBG ? targetPerStaff : 0,
        // @ts-ignore
        useAllVariations,
        // @ts-ignore
        distributeEqually,
        cooldownLimit,
        cooldownDuration
      };

      const filledTemplates = templates.filter(t => t.trim().length > 0);
      const variationCount = filledTemplates.length > 0 ? filledTemplates.length : 1;

      // Update Target Messages Logic
      let updatedTargets: WATarget[] = [];

      if (isCBG) {
        // PER STAFF ROTATION
        const groupedByStaff: { [key: string]: WATarget[] } = {};
        relevantUnsentTargets.forEach(t => {
          const key = t.petugasId || 'no_staff';
          if (!groupedByStaff[key]) groupedByStaff[key] = [];
          groupedByStaff[key].push(t);
        });

        Object.values(groupedByStaff).forEach(staffGroup => {
          const mapped = staffGroup.map((t, idx) => {
            const assignedTemplate = (useAllVariations && filledTemplates.length > 0)
              ? filledTemplates[idx % variationCount]
              : templates[0];
            return { ...t, messageOverride: assignedTemplate };
          });
          updatedTargets = [...updatedTargets, ...mapped];
        });
      } else {
        // GLOBAL ROTATION
        updatedTargets = relevantUnsentTargets.map((t, idx) => {
          const assignedTemplate = (useAllVariations && filledTemplates.length > 0)
            ? filledTemplates[idx % variationCount]
            : templates[0];
          return { ...t, messageOverride: assignedTemplate };
        });
      }

      await onSaveSetup(payload, undefined, isCBG ? activeSlot : undefined);
      await onAddTargets(updatedTargets); // onAddTargets handles bulk update in this app pattern

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setIsLocked(true);
      alert(`${updatedTargets.length} target berhasil diperbarui dengan konten pesan baru!`);
    } catch (err: any) {
      console.error(err);
      alert("Gagal mengupdate target: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-2">
      {/* Workflow Indicator */}
      <div className="flex items-center justify-center gap-4 mb-4">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl border bg-amber-500 border-amber-400 text-black font-black shadow-lg shadow-amber-500/20">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-black/20 text-black">
              <Settings size={14} />
            </div>
            <span className="text-[10px] tracking-widest uppercase">1. SETUP & IMPORT</span>
          </div>
          <div className="w-8 h-px bg-white/10 hidden md:block" />
          <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl border bg-white/5 border-white/10 text-white/40 font-bold">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/10">
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

      {isCBG && (
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-blue-500/10 p-4 rounded-[2rem] border border-blue-500/20">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg">
                <Sparkles size={20} />
             </div>
             <div>
               <h4 className="text-sm font-black text-blue-400 italic uppercase">MANAJEMEN KAMPANYE AKTIF</h4>
               <p className="text-[9px] font-medium text-slate-500 tracking-wider">Anda dapat mengatur hingga 2 kampanye berbeda sekaligus.</p>
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-(--text-color) tracking-tighter italic uppercase flex items-center gap-3">
            <Settings className={isLocked ? 'text-amber-500' : 'text-emerald-500'} size={32} /> 
            {isLocked ? 'SETUP TERKUNCI' : 'SETUP PESAN & TARGET'}
          </h2>
          <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mt-1">
            {isLocked ? 'Pengaturan telah disimpan dan dikunci untuk campaign aktif' : 'Konfigurasi Kampanye WA Personal'}
          </p>
        </div>
        <div className="flex gap-3">
          {isAdmin && (
             <button 
               onClick={handleResetAll}
               className={`btn h-14 px-8 rounded-2xl font-black text-xs tracking-widest shadow-xl border-none transition-all active:scale-95 ${
                 isResetConfirming 
                   ? 'bg-rose-500 animate-pulse text-white shadow-rose-600/40 ring-4 ring-rose-500/30' 
                   : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
               }`}
             >
               <Trash2 size={18} className="mr-2" /> 
               {isResetConfirming ? 'KLIK LAGI UNTUK KONFIRMASI RESET' : 'RESET SEMUA DATA'}
             </button>
          )}
          {isLocked && canEdit && (
            <button 
              onClick={() => setIsLocked(false)}
              className="btn btn-ghost h-14 px-8 rounded-2xl font-black text-xs tracking-widest border border-white/10 glass hover:bg-white/10 text-emerald-500 shadow-xl"
            >
              <RefreshCw size={18} className="mr-2" /> EDIT / PERBAHARUI
            </button>
          )}

          {!isLocked && (currentSetup?.tema || setups[activeSlot]?.tema) && targets.some(t => t.status === 'Belum Dikirim') && (
            <button 
              onClick={handleApplyToExisting}
              disabled={isSaving}
              className="btn bg-amber-500 hover:bg-amber-600 text-black h-14 px-8 rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-amber-500/20 transition-all active:scale-95"
            >
              <Sparkles size={18} className={`mr-2 ${isSaving ? 'animate-spin' : ''}`} />
              PERBAHARUI & TERAPKAN
            </button>
          )}
          
          <button 
            onClick={handleSave}
            disabled={isSaving || isLocked || (!setup?.tema ? !canAdd : !canEdit)}
            className={`btn ${isLocked ? 'btn-disabled opacity-50' : (saveSuccess ? 'btn-success' : 'btn-success')} h-14 px-8 rounded-2xl font-black text-xs tracking-widest shadow-xl ${(isLocked && !saveSuccess) ? '' : 'shadow-emerald-500/20'} group overflow-hidden relative border-none transition-all active:scale-95`}
          >
            <span className="relative z-10 flex items-center gap-3">
              {saveSuccess ? <CheckCircle2 size={18} /> : <Save size={18} className={isSaving ? 'animate-spin' : ''} />}
              {isSaving ? 'MENYIMPAN...' : saveSuccess ? 'BERHASIL' : isLocked ? 'SUDAH TERSIMPAN' : (currentSetup?.tema ? 'SIMPAN PERUBAHAN' : 'SIMPAN & KUNCI')}
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SETUP KONTEN */}
        <div className={`lg:col-span-12 glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden transition-all duration-500 ${isLocked ? 'grayscale-[0.5] opacity-90' : ''}`}>
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Settings size={120} className="text-emerald-500" />
          </div>
          
          <h3 className="text-xl font-black text-emerald-500 mb-6 italic tracking-tight uppercase flex items-center gap-2">
            1. KONFIGURASI PESAN {isLocked && <span className="text-[10px] bg-amber-500 text-black px-2 py-1 rounded-lg ml-2">READ ONLY</span>}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-2 block">TEMA / JUDUL KAMPANYE</label>
                <input 
                  type="text" 
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  readOnly={isLocked}
                  placeholder="Misal: HARI KESEHATAN NASIONAL..."
                  className={`w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold text-white placeholder:text-white/20 focus:border-emerald-500/50 outline-none transition-all shadow-inner ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-2 block">TGL MULAI</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    readOnly={isLocked}
                    className={`w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold text-white focus:border-emerald-500/50 outline-none transition-all shadow-inner ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-2 block">DEADLINE</label>
                  <input 
                    type="date" 
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    readOnly={isLocked}
                    className={`w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold text-white focus:border-emerald-500/50 outline-none transition-all shadow-inner ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={14} className="text-amber-500" />
                    <label className="text-[10px] font-black text-amber-500 tracking-widest uppercase block">LIMIT PESAN / COOL DOWN</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      value={cooldownLimit}
                      onChange={(e) => setCooldownLimit(parseInt(e.target.value) || 0)}
                      readOnly={isLocked}
                      className={`flex-grow bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs font-black text-white focus:border-amber-500/50 outline-none transition-all ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                    />
                    <span className="text-[10px] font-black text-white/40 uppercase">PESAN</span>
                  </div>
                  <p className="text-[8px] font-bold text-slate-500 mt-2 italic uppercase">Jumlah pesan sebelum masuk masa tunggu.</p>
                </div>

                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <RefreshCw size={14} className="text-blue-500" />
                    <label className="text-[10px] font-black text-blue-500 tracking-widest uppercase block">DURASI COOL DOWN (MENIT)</label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      value={cooldownDuration}
                      onChange={(e) => setCooldownDuration(parseInt(e.target.value) || 0)}
                      readOnly={isLocked}
                      className={`flex-grow bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs font-black text-white focus:border-blue-500/50 outline-none transition-all ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                    />
                    <span className="text-[10px] font-black text-white/40 uppercase">MENIT</span>
                  </div>
                  <p className="text-[8px] font-bold text-slate-500 mt-2 italic uppercase">Lama petugas harus menunggu jika limit tercapai.</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase block">KONTEN PESAN & VARIASI (MAX 5)</label>
                </div>
                
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                  {templates.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTemplateIdx(i)}
                      className={`flex-shrink-0 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        activeTemplateIdx === i 
                          ? 'bg-emerald-500 text-black border-emerald-400 shadow-lg shadow-emerald-500/20' 
                          : 'bg-white/5 text-emerald-500/50 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {i === 0 ? 'Pesan Utama' : `Variasi ${i + 1}`}
                    </button>
                  ))}
                </div>

                <textarea 
                  value={templates[activeTemplateIdx]}
                  onChange={(e) => {
                    const newTemplates = [...templates];
                    newTemplates[activeTemplateIdx] = e.target.value;
                    setTemplates(newTemplates);
                  }}
                  readOnly={isLocked}
                  rows={8}
                  placeholder={activeTemplateIdx === 0 ? "Selamat Pagi <TITLE> <NAMA>..." : `Ketik variasi pesan ${activeTemplateIdx + 1} di sini (opsional)...`}
                  className={`w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold text-white placeholder:text-white/20 focus:border-emerald-500/50 outline-none transition-all shadow-inner resize-none ${isLocked ? 'cursor-not-allowed opacity-50' : ''}`}
                />
                
                {!isLocked && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setUseAllVariations(!useAllVariations)}
                      className={`flex items-center gap-3 p-4 flex-grow rounded-2xl border transition-all ${
                        useAllVariations 
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' 
                          : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center ${useAllVariations ? 'bg-emerald-500 text-black' : 'bg-white/10'}`}>
                        {useAllVariations && <CheckCircle2 size={12} />}
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-black uppercase tracking-widest block">Gunakan Semua Variasi Secara Bergantian</span>
                        <p className="text-[8px] font-bold opacity-50 mt-0.5 italic">Pesan akan dikirim secara rotasi ke setiap target.</p>
                      </div>
                    </button>
                    
                    {targetCount > 0 && !isLocked && (
                      <button
                        onClick={handleApplyToExisting}
                        disabled={isSaving}
                        className="btn btn-warning h-auto py-3 px-6 rounded-2xl flex flex-col items-center justify-center gap-1 group shadow-xl shadow-warning/10"
                      >
                         <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                         <div className="flex flex-col text-center">
                            <span className="text-[9px] font-black uppercase tracking-wider">Update & Terapkan</span>
                            <span className="text-[7px] font-bold opacity-70">KE TARGET SAAT INI</span>
                         </div>
                      </button>
                    )}
                  </div>
                )}

                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <div className="flex items-center gap-2 text-emerald-500 mb-2">
                    <Info size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">PANDUAN PLACEHOLDER:</span>
                  </div>
                  <ul className="text-[9px] text-emerald-400/80 font-bold space-y-1">
                    <li>- Gunakan <span className="text-emerald-500 font-black">&lt;WAKTU&gt;</span> untuk Salam Otomatis (Pagi/Siang/Sore/Malam).</li>
                    <li>- Gunakan <span className="text-emerald-500 font-black">&lt;TITLE&gt;</span> untuk Bapak/Ibu.</li>
                    <li>- Gunakan <span className="text-emerald-500 font-black">&lt;NAMA&gt;</span> untuk Nama Lengkap.</li>
                    <li>- Gunakan <span className="text-emerald-500 font-black">&lt;NAMA PETUGAS&gt;</span> untuk Nama Petugas.</li>
                    <li>- Gunakan <span className="font-black text-emerald-500 italic">Enter (Baris Baru)</span> untuk pemisahan baris.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-2 block">LIVE PREVIEW</label>
                <div className="w-full bg-slate-900 border border-white/10 rounded-[2rem] p-6 relative shadow-inner h-[280px] overflow-y-auto whatsapp-preview">
                   <div className="bg-emerald-900/40 text-emerald-500 text-[8px] font-black px-2 py-1 rounded inline-block mb-4 uppercase tracking-widest">
                     Contoh Output Pesan:
                   </div>
                   <div className="text-white font-mono text-xs whitespace-pre-wrap leading-relaxed">
                     {previewMessage || "Belum ada konten..."}
                   </div>
                   {image && (
                     <div className="mt-4 rounded-xl overflow-hidden border border-white/10 max-w-[150px]">
                        <img src={image} className="w-full h-auto opacity-50" alt="Preview Image" />
                        <div className="bg-black/40 text-[7px] text-white/40 p-2 text-center uppercase font-black">GAMBAR TERKAMPANYE</div>
                     </div>
                   )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-2 block">UPLOAD GAMBAR (MAX 2MB)</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isLocked}
                    className="hidden" 
                    id="wa-image-upload" 
                  />
                  {!image ? (
                    <label 
                      htmlFor={isLocked ? undefined : "wa-image-upload"}
                      className={`w-full h-[180px] bg-black/40 border-2 border-dashed border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all group overflow-hidden ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5'}`}
                    >
                      <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                        <ImageIcon size={24} />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-white/50 group-hover:text-emerald-500">KLIK UNTUK IMPORT GAMBAR</p>
                      </div>
                    </label>
                  ) : (
                    <div className="relative w-full h-[180px] rounded-[2.5rem] overflow-hidden border border-white/10 group">
                      <img src={image} className="w-full h-full object-cover" alt="Preview" />
                      {!isLocked && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <label 
                            htmlFor="wa-image-upload"
                            className="w-12 h-12 bg-white/10 hover:bg-emerald-500 rounded-xl flex items-center justify-center text-white cursor-pointer transition-all"
                          >
                            <FileUp size={24} />
                          </label>
                          <button 
                            onClick={() => setImage(null)}
                            className="w-12 h-12 bg-white/10 hover:bg-rose-500 rounded-xl flex items-center justify-center text-white transition-all"
                          >
                            <Trash2 size={24} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SETUP PETUGAS (CBG ONLY) */}
        {isCBG && (
          <div className="lg:col-span-12 glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Send size={120} className="text-blue-500" />
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div>
                <h3 className="text-xl font-black text-blue-500 italic tracking-tight uppercase flex items-center gap-2">
                  2. SETUP PETUGAS & ALOKASI
                </h3>
                <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mt-1">Pilih petugas yang akan menjalankan kampanye ini</p>
                
                {!isLocked && displayStaffs.length > 0 && (
                  <button 
                    onClick={selectAllStaff}
                    className={`mt-4 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      selectedStaffIds.length === displayStaffs.length 
                        ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20' 
                        : 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                    }`}
                  >
                    {selectedStaffIds.length === displayStaffs.length ? 'BATAL PILIH SEMUA' : 'PILIH SEMUA PETUGAS'}
                  </button>
                )}
              </div>
              
              {!isLocked && canAdd && (
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="NAMA PETUGAS BARU..."
                    className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black tracking-widest uppercase text-white outline-none focus:border-blue-500/50"
                  />
                  <button 
                    onClick={addStaff}
                    disabled={isAddingStaff || !newStaffName.trim()}
                    className="btn btn-primary btn-sm rounded-xl font-black text-[9px] tracking-widest uppercase"
                  >
                    {isAddingStaff ? '...' : 'TAMBAH'}
                  </button>
                </div>
              )}
            </div>

            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 ${isLocked ? 'pointer-events-none opacity-80' : ''}`}>
              {displayStaffs.map((staff) => {
                const isSelected = selectedStaffIds.includes(staff.id);
                const isUsedInOtherSlot = isCBG && otherSlotStaffIds.includes(staff.id);
                const otherSlotName = activeSlot === 'slot_1' ? 'KAMPANYE B' : 'KAMPANYE A';

                return (
                  <div
                    key={staff.id}
                    onClick={() => {
                      if (!isUsedInOtherSlot) {
                        toggleStaff(staff.id, staff);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (!isUsedInOtherSlot && (e.key === 'Enter' || e.key === ' ')) {
                        toggleStaff(staff.id, staff);
                      }
                    }}
                    className={`relative p-5 rounded-2xl border transition-all flex flex-col items-center gap-3 group active:scale-95 select-none ${
                      isUsedInOtherSlot
                        ? 'bg-amber-500/10 border-amber-500/20 opacity-50 grayscale cursor-not-allowed'
                        : isSelected
                        ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-600/30 ring-2 ring-blue-400/20 cursor-pointer' 
                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20 hover:bg-white/10 cursor-pointer'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isSelected ? 'bg-white text-blue-600' :
                      isUsedInOtherSlot ? 'bg-amber-500/20 text-amber-500' : 'bg-white/10 text-white/20'
                    }`}>
                      {isSelected ? <CheckCircle2 size={24} /> : isUsedInOtherSlot ? <X size={20} /> : <Send size={20} />}
                    </div>
                    
                    <div className="flex flex-col items-center w-full min-h-[32px] justify-center">
                      <span className={`text-[10px] font-black tracking-widest uppercase truncate w-full text-center ${
                        isUsedInOtherSlot ? 'text-amber-500/60' :
                        isSelected ? 'text-white' : 'text-white/40'
                      }`}>
                        {staff.nama}
                      </span>
                      {isUsedInOtherSlot && (
                        <span className="text-[6px] font-bold text-amber-500 uppercase tracking-tighter mt-1 whitespace-nowrap">
                          DI {otherSlotName}
                        </span>
                      )}
                    </div>
                    
                    {!isLocked && canDelete && !isUsedInOtherSlot && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if(confirm(`Hapus ${staff.nama}?`)) onDeleteStaff?.(staff.id);
                        }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-rose-500 p-1 hover:bg-rose-500/10 rounded-lg transition-all z-10"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 p-6 bg-blue-500/5 border border-blue-500/20 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Settings size={120} />
              </div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500">
                  <Settings size={24} />
                </div>
                <div>
                  <h4 className="text-[12px] font-black text-blue-500 uppercase tracking-widest italic">KAPASITAS TARGET PER PETUGAS</h4>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Tentukan berapa banyak target yang akan diberikan ke tiap orang</p>
                </div>
              </div>

              {isCBG && selectedStaffIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-4 relative z-10 animate-in fade-in slide-in-from-right duration-700">
                  {/* Total Petugas */}
                  <div className="group relative px-6 py-5 bg-slate-900/40 border border-blue-500/30 rounded-[2rem] backdrop-blur-3xl shadow-[0_10px_40px_rgba(30,58,138,0.3)] hover:border-blue-500/60 transition-all duration-500 flex-grow">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Users size={64} className="text-blue-500" />
                    </div>
                    <div className="flex flex-col gap-2 relative z-10">
                      <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-lg">
                        <Users size={20} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] mb-1 opacity-70">TOTAL PETUGAS</p>
                        <p className="text-3xl font-black text-white italic tracking-tighter leading-none flex items-baseline gap-2">
                          {selectedStaffIds.length}
                          <span className="text-[10px] uppercase not-italic font-black text-white/30 tracking-widest">ORANG SDM</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="w-4 h-px bg-white/5 hidden xl:block shrink-0"></div>

                  {/* Target per Orang */}
                  <div className="group relative px-6 py-5 bg-slate-900/40 border border-amber-500/30 rounded-[2rem] backdrop-blur-3xl shadow-[0_10px_40px_rgba(120,53,15,0.3)] hover:border-amber-500/60 transition-all duration-500 flex-grow">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Target size={64} className="text-amber-500" />
                    </div>
                    <div className="flex flex-col gap-2 relative z-10">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/20 shadow-lg">
                        <Target size={20} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-amber-400 uppercase tracking-[0.3em] mb-1 opacity-70">TARGET / ORANG</p>
                        <p className="text-3xl font-black text-white italic tracking-tighter leading-none flex items-baseline gap-2">
                          {targetPerStaff}
                          <span className="text-[10px] uppercase not-italic font-black text-white/30 tracking-widest">DATA WA</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="w-4 h-px bg-white/5 hidden xl:block shrink-0"></div>

                  {/* Kapasitas Total */}
                  <div className="group relative px-10 py-6 bg-gradient-to-br from-emerald-600/40 to-emerald-950/80 border-2 border-emerald-400/50 rounded-[2.5rem] backdrop-blur-2xl shadow-[0_20px_50px_rgba(16,185,129,0.3)] hover:border-emerald-300 hover:shadow-[0_25px_60px_rgba(16,185,129,0.4)] transition-all duration-500 scale-105 ring-4 ring-emerald-500/10">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-[100px] rounded-full opacity-30 group-hover:opacity-50 transition-opacity"></div>
                    <div className="flex items-center gap-6 relative z-10">
                      <div className="relative">
                        <div className="absolute inset-x-0 bottom-0 h-4 bg-emerald-500 blur-xl opacity-50"></div>
                        <div className="w-14 h-14 rounded-3xl bg-white/10 flex items-center justify-center text-emerald-300 shadow-2xl border border-white/20 relative z-10 group-hover:-rotate-12 group-hover:scale-110 transition-all duration-500">
                          <Zap size={28} fill="currentColor" />
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.4em] mb-1 drop-shadow-md opacity-80">KAPASITAS PENYIMPANAN</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-4xl font-black text-white italic drop-shadow-[0_4px_15px_rgba(16,185,129,0.4)] tracking-tighter">
                            {(selectedStaffIds.length * targetPerStaff).toLocaleString('id-ID')}
                          </p>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-emerald-300 uppercase italic opacity-80 leading-none">DATABASE</span>
                            <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">AVAILABLE SLOTS</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-4 relative z-10">
                <button
                  disabled={isLocked}
                  onClick={() => setDistributeEqually(!distributeEqually)}
                  className={`flex items-center gap-3 px-6 h-14 rounded-2xl border transition-all ${
                    distributeEqually 
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-lg shadow-emerald-500/10' 
                      : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${distributeEqually ? 'bg-emerald-500 text-black' : 'bg-white/10'}`}>
                    {distributeEqually && <CheckCircle2 size={12} />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Bagi Rata Target</span>
                </button>

                {[50, 100, 150, 200].map(val => (
                  <button
                    key={val}
                    disabled={isLocked || distributeEqually}
                    onClick={() => setTargetPerStaff(val)}
                    className={`w-14 h-14 rounded-2xl font-black text-xs transition-all border ${
                      targetPerStaff === val && !distributeEqually
                        ? 'bg-blue-500 border-transparent text-black shadow-lg shadow-blue-500/20 scale-110' 
                        : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10 disabled:opacity-20'
                    }`}
                  >
                    {val}
                  </button>
                ))}
                <div className="relative">
                  <input 
                    type="number"
                    value={targetPerStaff}
                    onChange={(e) => setTargetPerStaff(parseInt(e.target.value) || 0)}
                    disabled={isLocked || distributeEqually}
                    className="w-24 h-14 bg-black/40 border border-white/10 rounded-2xl px-4 font-black transition-all text-center focus:border-blue-500/50 disabled:opacity-20"
                  />
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-[#1a1c23] px-2 text-[8px] font-black text-blue-500 uppercase italic tracking-widest border border-blue-500/20 rounded">CUSTOM</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETUP TARGET */}
        <div className="lg:col-span-12 glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">

          <div className="absolute top-0 right-0 p-8 opacity-5">
            <FileUp size={120} className="text-amber-500" />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h3 className="text-xl font-black text-amber-500 italic tracking-tight uppercase flex items-center gap-2">
                {isCBG ? '3.' : '2.'} DATA TARGET PELANGGAN
              </h3>
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mt-1">Import file excel untuk menentukan target</p>
            </div>
            
            <div className="flex gap-3">
               {targetCount > 0 && canDelete && (
                 <div className="flex items-center gap-2">
                   {isClearing ? (
                     <div className="flex items-center gap-3 bg-rose-500/20 px-6 h-12 rounded-xl border border-rose-500/30">
                       <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest animate-pulse">KONFIRMASI HAPUS?</span>
                       <button 
                         onClick={async () => {
                           setIsClearing(true); // Keep true for loading effect
                           try {
                             await onClearTargets();
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
                        className="px-6 h-12 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                     >
                       <Trash2 size={16} /> CLEAR ALL ({targetCount})
                     </button>
                   )}
                 </div>
               )}
               {canAdd && (
                 <div className="relative">
                   <input 
                     type="file" 
                     accept=".xlsx, .xls"
                     onChange={handleExcelImport}
                     className="hidden" 
                     id="excel-wa-upload" 
                   />
                   <label 
                     htmlFor="excel-wa-upload"
                     className="px-8 h-12 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-amber-500/20 flex items-center gap-3 cursor-pointer transition-all active:scale-95"
                   >
                     <FileUp size={16} /> IMPORT EXCEL (HEADER SPECIFIC)
                   </label>
                 </div>
               )}
            </div>
          </div>

          <div className="p-8 bg-amber-500/5 border-2 border-dashed border-amber-500/20 rounded-[2.5rem]">
             <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                  <Info size={24} />
                </div>
                <div className="flex-grow">
                   <h4 className="text-[14px] font-black text-amber-500 uppercase tracking-widest">Syarat Header File Excel:</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-1">Pastikan baris pertama file Excel Anda memiliki kolom dengan nama berikut:</p>
                </div>
                {previewData.length > 0 && (
                   <button 
                     onClick={() => setPreviewData([])}
                     className="text-[9px] font-black text-rose-500 hover:text-rose-400 transition-colors flex items-center gap-2 uppercase"
                   >
                     <X size={12} /> Batalkan Preview
                   </button>
                )}
             </div>
             
              {previewData.length === 0 ? (<>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { name: 'ID SISPRO', desc: 'ID Unik Pasien' },
                    { name: 'TITLE', desc: 'Bapak / Ibu' },
                    { name: 'NAMA', desc: 'Nama Lengkap' },
                    { name: 'NOMOR WA', desc: 'Format: 08xx...' }
                  ].map((header) => (
                    <div key={header.name} className="glass border border-amber-500/20 p-4 rounded-2xl text-center relative group">
                      <div className="text-white font-black text-[11px] mb-1 tracking-widest italic">{header.name}</div>
                      <div className="text-amber-500/50 text-[8px] font-bold uppercase">{header.desc}</div>
                    </div>
                  ))}
               </div>

               {/* FITUR OTOMATIS UNGGULAN */}
               <div className="mt-12 pt-12 border-t border-white/5">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-lg shadow-amber-500/5 relative group">
                      <Zap size={24} className="text-amber-500 animate-pulse fill-amber-500/20 relative z-10" />
                      <div className="absolute inset-0 bg-amber-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div>
                      <h5 className="text-[18px] md:text-[26px] font-black text-white uppercase tracking-[0.1em] italic leading-none">Fitur Otomatis Unggulan:</h5>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                        <span className="w-8 h-[1px] bg-amber-500/30"></span>
                        Smart Data Processing Engine
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { title: 'Format Cleaning', desc: 'Hapus karakter non-angka & spasi', color: 'indigo', icon: <Zap size={18} /> },
                      { title: 'Normalization', desc: 'Ubah awalan 0/+ menjadi 62', color: 'emerald', icon: <RefreshCw size={18} /> },
                      { title: 'Mobile Valid', desc: 'Hapus No. Rumah (021 dll)', color: 'sky', icon: <CheckCircle2 size={18} /> },
                      { title: 'Anti-Duplikasi', desc: 'Hapus nomor ganda dalam file', color: 'rose', icon: <Users size={18} /> },
                      { title: 'Smart Blacklist', desc: 'Saring daftar Hitam & Non-WA', color: 'amber', icon: <Filter size={18} /> },
                      { title: 'Session Guard', desc: 'Cek target aktif sesi ini', color: 'violet', icon: <Sparkles size={18} /> },
                    ].map((feature, idx) => (
                      <motion.div 
                        key={idx} 
                        whileHover={{ scale: 1.05, rotateY: 5, rotateX: -5, z: 50 }}
                        className={`relative flex items-center gap-4 p-5 rounded-3xl border border-white/10 group transition-all duration-500 overflow-hidden shadow-2xl`}
                        style={{
                          background: `linear-gradient(135deg, rgba(var(--${feature.color}-500-rgb, 0,0,0), 0.1) 0%, rgba(0,0,0,0.4) 100%)`,
                          perspective: '1000px'
                        }}
                      >
                        {/* GLOW EFFECT ON HOVER */}
                        <div className={`absolute -inset-1 bg-gradient-to-r from-${feature.color}-500/0 via-${feature.color}-500/20 to-${feature.color}-500/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`}></div>
                        
                        {/* COLORFUL BACKGROUND ACCENT */}
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-${feature.color}-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-${feature.color}-500/10 transition-colors`}></div>

                        <div className={`relative z-10 w-14 h-14 rounded-2xl bg-${feature.color}-500/10 flex items-center justify-center text-${feature.color}-400 border border-${feature.color}-500/20 group-hover:bg-${feature.color}-500 group-hover:text-black group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-lg shadow-${feature.color}-500/10`}>
                          {feature.icon}
                        </div>
                        
                        <div className="relative z-10">
                          <div className={`text-[12px] font-black text-white uppercase tracking-wider leading-none mb-2 group-hover:text-${feature.color}-300 transition-colors`}>{feature.title}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter leading-snug group-hover:text-slate-200 transition-colors">{feature.desc}</div>
                        </div>

                        {/* NUMBER INDICATOR */}
                        <div className={`absolute bottom-2 right-4 text-[40px] font-black text-white/5 italic select-none group-hover:text-${feature.color}-500/10 transition-colors`}>
                          {idx + 1}
                        </div>
                      </motion.div>
                    ))}
                  </div>
               </div>
              </>) : (
               <div className="space-y-6">
                 {/* QUICK FILTER & SEARCH BAR */}
                 <div className="flex flex-col gap-4">
                   <div className="flex flex-wrap items-center gap-2 p-1 bg-black/20 rounded-2xl border border-white/5">
                      {[
                        { id: 'ALL', label: 'SEMUA DATA', count: statsPreview.total, color: 'slate' },
                        { id: 'NEW', label: 'BELUM PERNAH', count: statsPreview.new, color: 'emerald' },
                        { id: 'CONTACTED', label: 'SUDAH PERNAH', count: statsPreview.contacted, color: 'blue' },
                        { id: 'BLACKLIST', label: 'PASIEN BLACKLIST', count: statsPreview.blacklist, color: 'rose' },
                        { id: 'NO_WA', label: 'TIDAK ADA WA', count: statsPreview.noWa, color: 'amber' },
                      ].map((btn) => (
                        <button
                          key={btn.id}
                          onClick={() => setTargetFilter(btn.id as any)}
                          className={`flex-grow md:flex-grow-0 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                            targetFilter === btn.id 
                              ? `bg-${btn.color}-600 text-white shadow-lg` 
                              : 'text-slate-500 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {btn.label}
                          <span className={`px-2 py-0.5 rounded-full text-[8px] ${targetFilter === btn.id ? 'bg-black/20' : 'bg-white/10'}`}>
                            {btn.count}
                          </span>
                        </button>
                      ))}
                   </div>

                   <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                        <Search size={14} />
                      </div>
                      <input 
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="CARI BERDASARKAN NAMA, ID SISPRO, ATAU NOMOR WA..."
                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-[10px] font-black text-white placeholder:text-white/20 focus:border-amber-500/50 outline-none transition-all shadow-inner tracking-widest uppercase"
                      />
                      {searchTerm && (
                        <button 
                          onClick={() => setSearchTerm('')}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                   </div>
                 </div>

                 <div className="bg-black/40 rounded-[2rem] border border-amber-500/30 overflow-hidden max-h-[400px] overflow-y-auto">
                    <table className="w-full text-left text-[11px]">
                       <thead className="bg-white/5 font-black text-slate-500 sticky top-0 backdrop-blur-md z-10">
                          <tr>
                             <th className="p-4 border-b border-white/5">SISPRO ID</th>
                             <th className="p-4 border-b border-white/5">PASIEN</th>
                             <th className="p-4 border-b border-white/5">NOMOR WA</th>
                             <th className="p-4 border-b border-white/5 text-center">RIWAYAT KONTAK</th>
                             <th className="p-4 border-b border-white/5 text-center">STATUS KHUSUS</th>
                             <th className="p-4 border-b border-white/5 text-center">AKSI</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5 font-bold">
                          {paginatedPreview.map((d: any) => (
                             <tr key={d.id} className={`text-slate-300 hover:bg-white/5 transition-colors group ${d.isBlacklisted ? 'bg-rose-500/5' : d.isNoWa ? 'bg-amber-500/5' : ''}`}>
                                <td className="p-4 font-mono text-[10px]">{d.sisproId}</td>
                                <td className="p-4">
                                   <div className="flex flex-col">
                                      <span className="text-amber-500 italic text-[9px] uppercase">{d.title}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-white uppercase">{d.nama}</span>
                                        {d.contactCount > 0 && (
                                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500 text-black rounded text-[8px] font-black animate-pulse">
                                            <Send size={8} /> {d.contactCount}X
                                          </div>
                                        )}
                                      </div>
                                   </div>
                                </td>
                                <td className="p-4 font-mono text-amber-500">{d.phone}</td>
                                <td className="p-4 text-center">
                                   {d.contactCount > 0 ? (
                                     <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-[9px] font-black border border-blue-500/20">
                                        <History size={10} />
                                        DIHUBUNGI {d.contactCount}x
                                     </div>
                                   ) : (
                                     <span className="text-[9px] text-emerald-500/40 uppercase tracking-widest font-black italic">BELUM PERNAH</span>
                                   )}
                                </td>
                                <td className="p-4 text-center">
                                   <div className="flex flex-col gap-1 items-center">
                                      {d.isBlacklisted && (
                                        <span className="px-2 py-0.5 bg-rose-500 text-white rounded text-[8px] font-black uppercase tracking-tighter">BLACKLIST</span>
                                      )}
                                      {d.isNoWa && (
                                        <span className="px-2 py-0.5 bg-amber-500 text-black rounded text-[8px] font-black uppercase tracking-tighter">NO WA</span>
                                      )}
                                      {!d.isBlacklisted && !d.isNoWa && (
                                        <span className="text-[8px] text-emerald-500/50 uppercase tracking-widest">AMAN</span>
                                      )}
                                   </div>
                                </td>
                                <td className="p-4 text-center">
                                   <button 
                                     onClick={() => removeRow(d.id)}
                                     className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-all"
                                     title="Hapus dari preview"
                                   >
                                      <Trash2 size={14} />
                                   </button>
                                </td>
                             </tr>
                          ))}
                          {filteredPreview.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-20 text-center">
                                <div className="flex flex-col items-center gap-4">
                                  <Filter size={40} className="text-slate-800" />
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tidak ada data untuk filter "{targetFilter}"</p>
                                </div>
                              </td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                 </div>

                 {/* PAGINATION CONTROLS */}
                 {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-black/20 rounded-2xl border border-white/5">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Menampilkan <span className="text-amber-500">{(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredPreview.length)}</span> dari <span className="text-white">{filteredPreview.length}</span> data
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-tighter"
                        >
                          Sebelumnya
                        </button>
                        
                        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 mx-2">
                          {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            let pageNum = currentPage;
                            if (totalPages <= 5) pageNum = i + 1;
                            else if (currentPage <= 3) pageNum = i + 1;
                            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                            else pageNum = currentPage - 2 + i;
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                                  currentPage === pageNum 
                                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                        </div>

                        <button 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed uppercase tracking-tighter"
                        >
                          Selanjutnya
                        </button>
                      </div>
                    </div>
                 )}

                 <div className="flex justify-center">
                    <button 
                      onClick={handleSaveToTarget}
                      disabled={isSavingTargets || filteredPreview.length === 0}
                      className={`btn ${isSavingTargets || filteredPreview.length === 0 ? 'btn-disabled opacity-50' : 'bg-amber-500 hover:bg-amber-400'} text-black border-none h-14 px-12 rounded-2xl font-black text-xs tracking-widest flex items-center gap-3 shadow-2xl shadow-amber-500/20 active:scale-95 transition-all`}
                    >
                      {isSavingTargets ? (
                         <RefreshCw className="animate-spin" size={20} />
                      ) : (
                         <Save size={20} />
                      )}
                                            <div className="flex flex-col items-center">
                        <span className="leading-none">{isSavingTargets ? 'SEDANG MENYIMPAN...' : `SIMPAN DATA "${targetFilter}" KE DAFTAR TARGET (${displaySaveCount})`}</span>
                        {!isSavingTargets && filteredPreview.length > displaySaveCount && (
                          <span className="text-[7px] opacity-60 font-medium tracking-tight mt-1">({filteredPreview.length - displaySaveCount} DATA LAINNYA DIABAIKAN)</span>
                        )}
                      </div>
                    </button>
                 </div>
               </div>
             )}

             <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
               <button 
                 onClick={downloadHeaderTemplate}
                 className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest text-amber-500 transition-all flex items-center gap-2"
               >
                 <FileUp size={14} /> DOWNLOAD TEMPLATE EXCEL
               </button>
               <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em] animate-pulse">
                 SISTEM AKAN OTOMATIS MEMPERBAIKI NOMOR WA KE FORMAT INTERNASIONAL
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
