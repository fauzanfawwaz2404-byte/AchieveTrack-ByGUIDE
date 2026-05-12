import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, Search, Plus, Trash2, Calculator, Receipt, 
  ChevronRight, X, Sparkles, Zap, ArrowRight, Tag, User, 
  CreditCard, Layers, Activity 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TestLab, Panel } from '../types';

interface LabCalculatorProps {
  testLabs: TestLab[];
  panels: Panel[];
}

export default function LabCalculator({ testLabs, panels }: LabCalculatorProps) {
  const [selectedItems, setSelectedItems] = useState<(TestLab | Panel)[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isDiscounted, setIsDiscounted] = useState(false);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isPatientInfoActive, setIsPatientInfoActive] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [labNumber, setLabNumber] = useState('');

  const allItems = useMemo(() => [
    ...testLabs.map(t => ({ ...t, type: 'LAB' as const })),
    ...panels.map(p => ({ ...p, type: 'PANEL' as const }))
  ], [testLabs, panels]);

  const selectedIds = useMemo(() => new Set(selectedItems.map(i => i.id)), [selectedItems]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return [];
    const lowerTerm = searchTerm.toLowerCase();
    
    // 1. Filter items that are NOT already selected
    // 2. Filter items by search term
    return allItems
      .filter(item => !selectedIds.has(item.id) && item.nama.toLowerCase().includes(lowerTerm))
      .sort((a, b) => {
        const aLower = a.nama.toLowerCase();
        const bLower = b.nama.toLowerCase();
        const aStarts = aLower.startsWith(lowerTerm);
        const bStarts = bLower.startsWith(lowerTerm);
        
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return aLower.localeCompare(bLower);
      });
  }, [searchTerm, allItems, selectedIds]);

  const addItem = (item: TestLab | Panel) => {
    if (selectedIds.has(item.id)) {
      setSearchTerm('');
      return;
    }
    setSelectedItems(prev => [...prev, item]);
    setSearchTerm('');
    setActiveIndex(0);
    // Refocus input
    setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      addItem(filteredItems[activeIndex]);
    } else if (e.key === 'Escape') {
      setSearchTerm('');
    }
  };

  useEffect(() => {
    setActiveIndex(0);
  }, [searchTerm]);

  const removeItem = (id: string) => {
    setSelectedItems(prev => prev.filter(i => i.id !== id));
  };

  // AI Suggestion Logic - Ultra-strict normalization for duplicate-free matching
  const normalize = (s: string) => {
    if (!s) return "";
    let n = s.toLowerCase().trim();
    // Common mappings for Indonesian lab terms
    n = n.replace(/cholesterol/g, 'kolesterol');
    n = n.replace(/glucose/g, 'glukosa');
    n = n.replace(/gula/g, 'glukosa');
    n = n.replace(/direk/g, 'direct');
    n = n.replace(/u\. acid/g, 'uric acid');
    n = n.replace(/asam urat/g, 'uric acid');
    n = n.replace(/hba1c/g, 'a1c');
    n = n.replace(/hb a1c/g, 'a1c');
    n = n.replace(/lengkap/g, 'complete');
    n = n.replace(/rutin/g, 'routine');
    // Remove all non-alphanumeric to ensure "LDL DIREK" matches "LDL Direk" perfectly
    return n.replace(/[^a-z0-9]/g, '');
  };

  const normalizedLabs = useMemo(() => 
    testLabs.map(lab => ({
      ...lab,
      norm: normalize(lab.nama)
    })), [testLabs]);

  const suggestions = useMemo(() => {
    const areSimilar = (n1: string, n2: string) => {
      const clean1 = n1.replace(/\s+/g, '');
      const clean2 = n2.replace(/\s+/g, '');
      
      if (clean1 === clean2) return true;
      if (clean1.length > 3 && clean2.length > 3) {
        if (clean1.includes(clean2) || clean2.includes(clean1)) return true;
      }
      
      const words1 = n1.split(/\s+/).filter(w => w.length > 2);
      const words2 = n2.split(/\s+/).filter(w => w.length > 2);
      
      if (words1.length === 0 || words2.length === 0) return false;
      
      const longer = words1.length >= words2.length ? words1 : words2;
      const shorter = words1.length < words2.length ? words1 : words2;
      
      const matchCount = shorter.filter(sW => 
        longer.some(lW => lW.includes(sW) || sW.includes(lW))
      ).length;

      return matchCount >= Math.max(1, Math.ceil(shorter.length * 0.7));
    };

    const selectedLabs = selectedItems
      .filter(item => !('items' in item) && !('pemeriksaan' in item))
      .map(lab => ({ ...lab, norm: normalize(lab.nama) }));

    if (selectedLabs.length < 1) return [];

    return panels
      .filter(panel => !selectedIds.has(panel.id))
      .map(panel => {
        let panelItems: string[] = [];
      const text = panel.pemeriksaan || '';
      
      if ('items' in (panel as any) && Array.isArray((panel as any).items)) {
        panelItems = (panel as any).items;
      } else if (text) {
        if (text.includes('\n')) {
          panelItems = text.split('\n').map(p => p.trim()).filter(p => p.length > 0);
        } else if (text.includes(',')) {
          panelItems = text.split(',').map(p => p.trim()).filter(p => p.length > 0);
        } else if (/\d+\./.test(text)) {
          panelItems = text.split(/(?=\d+\.)/).map(p => p.trim().replace(/^\d+\.\s*/, '')).filter(p => p.length > 0);
        } else {
          const foundItems: string[] = [];
          const sortedLabs = [...normalizedLabs].sort((a, b) => b.nama.length - a.nama.length); 
          
          let remainingText = text.toLowerCase();
          sortedLabs.forEach(lab => {
            const labName = lab.nama.toLowerCase();
            if (remainingText.includes(labName)) {
              foundItems.push(lab.nama);
              remainingText = remainingText.replace(labName, ' '); 
            }
          });

          if (foundItems.length > 0) {
            panelItems = foundItems;
          } else {
            panelItems = text.split(/\s+/).filter(p => p.length > 3);
          }
        }
      }

      if (panelItems.length === 0) return null;

      const cleanPanelItems = panelItems.map(p => p.replace(/^\d+\.\s*/, '').trim());
      
      const matchedPanelIndices = new Set<number>();
      const matchedSelectedLabIndices = new Set<number>();
      const matches: string[] = [];
      
      // Track all matched normalized names to prevent them from appearing in "Missing"
      const matchedNorms = new Set<string>();

      // 1. Find exact and fuzzy matches
      cleanPanelItems.forEach((p, pIdx) => {
        const pNorm = normalize(p);
        
        selectedLabs.forEach((lab, sIdx) => {
          if (!matchedSelectedLabIndices.has(sIdx) && !matchedPanelIndices.has(pIdx)) {
            if (pNorm === lab.norm || areSimilar(pNorm, lab.norm)) {
              matchedPanelIndices.add(pIdx);
              matchedSelectedLabIndices.add(sIdx);
              matches.push(lab.nama);
              matchedNorms.add(pNorm);
              matchedNorms.add(lab.norm);
            }
          }
        });
      });

      // 2. Filter missing items: 
      // - Must not be matched by index
      // - Normalized name must not exist in any successful matches to avoid "LDL" showing in both
      const uniqueMissing = Array.from(new Set(
        cleanPanelItems.filter((p, idx) => {
          if (matchedPanelIndices.has(idx)) return false;
          const pNorm = normalize(p);
          if (matchedNorms.has(pNorm)) return false;
          return true;
        })
      ));

      const matchesCount = matches.length;
      const matchPercentage = (matchesCount / cleanPanelItems.length) * 100;
      
      const matchedSelectedLabs = selectedLabs.filter((_, idx) => matchedSelectedLabIndices.has(idx));
      const individualPriceSum = matchedSelectedLabs.reduce((sum, lab) => sum + lab.harga, 0);

      const totalNormalPrice = cleanPanelItems.reduce((sum, p) => {
        const pNorm = normalize(p);
        const lab = normalizedLabs.find(l => normalize(l.nama) === pNorm || areSimilar(pNorm, normalize(l.nama)));
        return sum + (lab?.harga || (panel.harga / Math.max(1, cleanPanelItems.length)));
      }, 0);

      const isCompleteMatch = matches.length === cleanPanelItems.length;
      
      const isWorthSuggesting = (isCompleteMatch && individualPriceSum > panel.harga) || 
                               (!isCompleteMatch && uniqueMissing.length >= 1 && uniqueMissing.length <= 4 && (matchPercentage >= 40 || matchesCount >= 3));

      const savingAmount = totalNormalPrice - panel.harga;
      const savingPercent = Math.round((savingAmount / (totalNormalPrice || 1)) * 100);

      return {
        panel,
        matches,
        missing: uniqueMissing,
        matchPercentage,
        isWorthSuggesting,
        suggestionType: isCompleteMatch ? 'OPTIMIZATION' : 'UPSELL' as 'OPTIMIZATION' | 'UPSELL',
        totalNormalPrice,
        matchedTotal: individualPriceSum,
        savingAmount,
        savingPercent,
        currentHemat: totalNormalPrice - panel.harga
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null && s.isWorthSuggesting)
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 5);
  }, [selectedItems, panels, testLabs, normalizedLabs]);

  const upgradeToPanel = (panel: Panel, matchNames: string[]) => {
    setSelectedItems(prev => {
      if (prev.find(i => i.id === panel.id)) return prev;
      const filtered = prev.filter(item => {
        if ('items' in item || 'pemeriksaan' in item) return true;
        const itemLower = item.nama.toLowerCase().trim();
        return !matchNames.some(m => m.trim().includes(itemLower) || itemLower.includes(m.trim()));
      });
      return [...filtered, { ...panel, type: 'PANEL' as const }];
    });
  };

  const subtotal = selectedItems.reduce((sum, item) => sum + item.harga, 0);
  const discountAmount = isDiscounted ? (subtotal * (discountPercent / 100)) : 0;
  const grandTotal = subtotal - discountAmount;

  const [showAIOffer, setShowAIOffer] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
      {/* Search Result Overlay logic moved here for better layout handling */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-[380px] bg-[#0f1115] rounded-[2.5rem] border border-white/10 shadow-2xl overflow-visible flex flex-col"
            >
              {/* Header Screenshot */}
              <div className="bg-amber-500 p-4 sm:p-5 text-black">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-2">
                    <Calculator size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-black/80">PRODIA DEPOK</span>
                  </div>
                  <button onClick={() => setShowPreview(false)} className="bg-black/10 p-1.5 rounded-full">
                    <X size={14} />
                  </button>
                </div>
                <div className="flex flex-col">
                  <p className="text-[10px] font-black text-black uppercase tracking-tighter">TRANSFER BCA PRODIA 0840873188</p>
                  {isPatientInfoActive && (
                    <div className="mt-2 pt-2 border-t border-black/10">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[6px] font-bold text-black/60 uppercase leading-none mb-0.5">NAMA PASIEN</p>
                          <p className="text-[9px] font-black text-black uppercase leading-tight">{patientName || '-'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[6px] font-bold text-black/60 uppercase leading-none mb-0.5">NO LAB / ID</p>
                          <p className="text-[9px] font-black text-black font-mono leading-tight">{labNumber || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Content area for screenshot - scroll removed to allow full capture if container permits, but modal height needs to be handled */}
              <div className="p-4 sm:p-5 space-y-2">
                <div className="space-y-1">
                  <p className="text-[7px] font-black text-amber-500 uppercase tracking-[0.2em]">Daftar Pemeriksaan</p>
                  <div className="space-y-0.5">
                    {selectedItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center gap-2 py-0.5 border-b border-white/5 last:border-0">
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-white uppercase leading-none tracking-tight">{item.nama}</p>
                        </div>
                        <p className="text-[10px] font-mono font-black text-white shrink-0">Rp {item.harga.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  {isDiscounted && (
                    <>
                      <div className="flex justify-between items-center text-white/40 mb-1">
                        <p className="text-[7px] font-black uppercase tracking-widest italic">Subtotal (Bruto)</p>
                        <p className="text-[10px] font-mono font-black">Rp {subtotal.toLocaleString()}</p>
                      </div>
                      <div className="flex justify-between items-center text-amber-500 mb-1">
                        <p className="text-[7px] font-black uppercase tracking-widest">Diskon {discountPercent}%</p>
                        <p className="text-[10px] font-mono font-black">- Rp {discountAmount.toLocaleString()}</p>
                      </div>
                    </>
                  )}
                  <div className="bg-amber-500 p-2 sm:p-3 rounded-lg border border-black/10 transition-all">
                    <p className="text-[7px] font-black text-black/60 uppercase tracking-widest leading-none mb-0.5">TOTAL</p>
                    <p className="text-xl font-black text-black font-mono tracking-tighter italic leading-none">Rp {grandTotal.toLocaleString()}</p>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <p className="text-[6px] font-black text-white/10 uppercase tracking-[0.3em]">ACHIEVETRACK PRODIA - {new Date().toLocaleDateString('id-ID')}</p>
                </div>
              </div>
              
              <div className="p-4 bg-white/5 border-t border-white/10">
                <button 
                  onClick={() => setShowPreview(false)}
                  className="w-full h-12 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest"
                >
                  Tutup Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Header - More compact on mobile */}
      <div className="flex items-center gap-4 sm:gap-6 mb-8 sm:mb-12">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-amber-500 flex items-center justify-center text-black shadow-xl shadow-amber-500/20 shrink-0">
          <Calculator size={24} className="sm:hidden" />
          <Calculator size={32} className="hidden sm:block" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tighter leading-tight">KALKULATOR</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          <section className="glass rounded-[2rem] sm:rounded-[3.5rem] border border-white/10 p-6 sm:p-10 space-y-6 sm:space-y-8 relative overflow-visible">
            <div className="relative z-10">
              {/* Refined Toggles Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {/* Patient Info Toggle */}
                <div className={`flex items-center justify-between p-4 rounded-[2rem] border transition-all duration-300 ${isPatientInfoActive ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)]' : 'bg-white/5 border-white/5'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 ${isPatientInfoActive ? 'bg-amber-500 text-black rotate-12' : 'bg-white/5 text-white/20'}`}>
                      <Receipt size={18} />
                    </div>
                    <div className="flex flex-col">
                      <h4 className="text-[10px] font-black text-white italic uppercase tracking-tight">Info Pasien</h4>
                      <p className={`text-[7px] font-black uppercase tracking-[0.2em] leading-none mt-1 ${isPatientInfoActive ? 'text-amber-500' : 'text-white/20'}`}>
                        {isPatientInfoActive ? 'AKTIF' : 'OFF'}
                      </p>
                    </div>
                  </div>
                  <div 
                    onClick={() => setIsPatientInfoActive(!isPatientInfoActive)}
                    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${isPatientInfoActive ? 'bg-amber-500' : 'bg-white/10'}`}
                  >
                    <motion.div 
                      animate={{ x: isPatientInfoActive ? 26 : 4 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
                    />
                  </div>
                </div>

                {/* Discount Toggle */}
                <div className={`flex items-center justify-between p-4 rounded-[2rem] border transition-all duration-300 ${isDiscounted ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'bg-white/5 border-white/5'}`}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shrink-0 ${isDiscounted ? 'bg-emerald-500 text-white -rotate-12' : 'bg-white/5 text-white/20'}`}>
                      <Tag size={18} />
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <h4 className="text-[10px] font-black text-white italic uppercase tracking-tight truncate">Diskon %</h4>
                      <AnimatePresence mode="wait">
                        {isDiscounted ? (
                          <motion.div 
                            key="input"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex items-center gap-1 mt-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 w-fit"
                          >
                            <input 
                              type="number" 
                              value={discountPercent}
                              onChange={(e) => setDiscountPercent(Number(e.target.value))}
                              onFocus={(e) => e.target.select()}
                              className="w-8 shrink-0 bg-transparent text-emerald-400 font-mono font-black text-[10px] outline-none"
                              autoFocus
                            />
                            <span className="text-[8px] font-black text-emerald-500/50 shrink-0">%</span>
                          </motion.div>
                        ) : (
                          <motion.p 
                            key="off"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] mt-1"
                          >
                            TAMBAHKAN
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div 
                    onClick={() => setIsDiscounted(!isDiscounted)}
                    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${isDiscounted ? 'bg-emerald-500' : 'bg-white/10'}`}
                  >
                    <motion.div 
                      animate={{ x: isDiscounted ? 26 : 4 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg"
                    />
                  </div>
                </div>
              </div>


              {/* Patient Info Fields */}
              <AnimatePresence>
                {isPatientInfoActive && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 overflow-hidden"
                  >
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-2 italic">Nama Lengkap Pasien</label>
                      <div className="relative group/input">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within/input:text-amber-500 transition-colors" size={16} />
                        <input 
                          type="text" 
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          placeholder="NAMA LENGKAP..."
                          className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 text-xs text-amber-500 font-black uppercase tracking-widest outline-none focus:border-amber-500/50 transition-all focus:bg-white/[0.08]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-2 italic">No Lab / ID Pasien</label>
                      <div className="relative group/input">
                        <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 text-white/10 group-focus-within/input:text-amber-500 transition-colors" size={16} />
                        <input 
                          type="text" 
                          value={labNumber}
                          onChange={(e) => setLabNumber(e.target.value)}
                          placeholder="CONTOH: 2605001..."
                          className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 text-xs text-amber-500 font-black uppercase tracking-widest outline-none focus:border-amber-500/50 transition-all focus:bg-white/[0.08]"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <label className="text-[9px] sm:text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-4 block">1. Pilih Pemeriksaan / Panel</label>
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-amber-500 transition-colors" size={20} />
                <input 
                  ref={searchInputRef}
                  type="text"
                  placeholder="Ketik nama tes atau paket..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-14 sm:h-18 bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl pl-14 pr-6 text-sm sm:text-lg text-white font-medium focus:ring-2 focus:ring-amber-500/50 outline-none transition-all placeholder:text-white/10"
                />
              </div>

              {/* Search Results */}
              <AnimatePresence>
                {searchTerm && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute z-[100] left-0 right-0 mt-2 bg-[#1a1c23]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                  >
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                      {filteredItems.slice(0, 10).map((item, index) => (
                        <button
                          key={`${item.type}-${item.id}`}
                          onClick={() => addItem(item)}
                          onMouseEnter={() => setActiveIndex(index)}
                          className={`w-full p-3 sm:p-4 mb-1 flex items-center justify-between transition-all duration-200 rounded-xl group ${index === activeIndex ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'hover:bg-white/5 text-white/80'}`}
                        >
                          <div className="flex items-center gap-4 text-left">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${index === activeIndex ? 'bg-black/10' : 'bg-white/5'}`}>
                              {('items' in item || 'pemeriksaan' in item) ? <Layers size={18} /> : <Activity size={18} />}
                            </div>
                            <div>
                              <p className="font-bold text-[11px] sm:text-xs uppercase tracking-tight leading-tight mb-1">{item.nama}</p>
                              <div className="flex items-center gap-2">
                                <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${index === activeIndex ? 'bg-black/10 text-black/60' : 'bg-amber-500/10 text-amber-500'}`}>
                                  {('items' in item || 'pemeriksaan' in item) ? 'PANEL' : 'SINGLE TEST'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className={`font-mono font-bold text-[10px] sm:text-xs ${index === activeIndex ? 'text-black' : 'text-white'}`}>Rp {item.harga.toLocaleString()}</p>
                            <Plus size={16} className={`${index === activeIndex ? 'text-black' : 'text-white/20 opacity-0 group-hover:opacity-100 transition-opacity'}`} />
                          </div>
                        </button>
                      ))}
                    </div>
                    {filteredItems.length === 0 && (
                      <div className="p-10 text-center flex flex-col items-center gap-4 opacity-30">
                        <Search size={32} />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] font-sans italic">Item tidak ditemukan</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected List Tags */}
            <div className="flex flex-wrap gap-2 mt-6">
              <AnimatePresence>
                    {selectedItems.map((item, idx) => (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        key={`${item.id}-${idx}`}
                        className="flex items-center gap-2 sm:gap-3 pl-3 sm:pl-4 pr-1.5 sm:pr-2 py-2 sm:py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl group"
                      >
                    <span className="text-[10px] sm:text-xs font-black text-white truncate max-w-[140px] sm:max-w-[200px] uppercase tracking-tight leading-none">{item.nama}</span>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-white/5 flex items-center justify-center hover:bg-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {selectedItems.length === 0 && (
                <p className="text-[10px] sm:text-xs font-black text-white/10 uppercase tracking-widest italic py-4">Belum ada item yang ditambahkan.</p>
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Checkout/Summary */}
        <div className="lg:col-span-5 relative">
          <div className="sticky top-10 space-y-6">
            <div className="glass rounded-[2rem] sm:rounded-[3.5rem] border border-white/10 overflow-hidden relative shadow-2xl">
              <div className="bg-amber-500 p-6 sm:p-8 text-black">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg sm:text-xl font-black italic uppercase tracking-tighter leading-none">Pemeriksaan</h3>
                  <div className="bg-black/10 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                    {selectedItems.length} Item
                  </div>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
                {/* Scrollable list */}
                <div className="space-y-3 max-h-[250px] sm:max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  {selectedItems.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 group">
                      <div className="max-w-[70%]">
                        <p className="font-black text-[10px] sm:text-xs text-white uppercase tracking-tight group-hover:text-amber-500 transition-colors truncate">{item.nama}</p>
                        <p className="text-[7px] sm:text-[8px] font-black text-white/20 uppercase tracking-widest mt-1">{item.type || 'SINGLE'}</p>
                      </div>
                      <p className="font-mono text-[10px] sm:text-xs font-black text-white">Rp {item.harga.toLocaleString()}</p>
                    </div>
                  ))}
                  {selectedItems.length === 0 && (
                    <div className="py-10 text-center opacity-10">
                      <Receipt size={40} className="mx-auto mb-4" />
                      <p className="text-[9px] font-black uppercase tracking-widest">Daftar Kosong</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Patient Info Summary */}
                  {isPatientInfoActive && (patientName || labNumber) && (
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mb-2 shadow-inner">
                      <div className="flex justify-between items-start">
                        <div className="max-w-[150px]">
                          <p className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Nama Pasien</p>
                          <p className="text-[10px] font-black text-white uppercase truncate italic">{patientName || '-'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">No Lab / ID</p>
                          <p className="text-[10px] font-black text-white font-mono italic">{labNumber || '-'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-white/40">
                    <p className="text-[9px] font-black uppercase tracking-widest">Subtotal</p>
                    <p className="font-mono text-sm leading-none font-black">Rp {subtotal.toLocaleString()}</p>
                  </div>
                  
                  {isDiscounted && (
                    <div className="flex justify-between items-center text-amber-500">
                      <p className="text-[9px] font-black uppercase tracking-widest">Diskon ({discountPercent}%)</p>
                      <p className="font-mono text-sm leading-none font-black">- Rp {discountAmount.toLocaleString()}</p>
                    </div>
                  )}

                  <div className="h-px bg-white/5" />

                  <div className="bg-white/5 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 shadow-inner">
                    <p className="text-[9px] sm:text-[10px] font-black text-amber-500/60 uppercase tracking-[0.3em] mb-2 sm:mb-3">Total</p>
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tighter">Rp {grandTotal.toLocaleString()}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowPreview(true)}
                    disabled={selectedItems.length === 0}
                    className="w-full h-14 sm:h-18 bg-amber-500 hover:bg-amber-400 disabled:opacity-20 disabled:cursor-not-allowed text-black rounded-2xl sm:rounded-3xl font-black text-xs sm:text-sm uppercase tracking-widest shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                  >
                    <Zap size={20} />
                    PENINJAUAN (PREVIEW)
                  </button>

                  {/* Suggestion Toggle Button */}
                  <AnimatePresence>
                    {selectedItems.length > 0 && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                          <div className="relative">
                            <button 
                              onClick={() => setShowAIOffer(!showAIOffer)}
                              className={`w-full h-14 sm:h-16 rounded-2xl sm:rounded-3xl border transition-all flex items-center justify-center gap-3 font-black text-[10px] sm:text-xs uppercase tracking-tight ${showAIOffer ? 'bg-white text-black border-white shadow-xl' : 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'}`}
                            >
                              <Sparkles size={16} />
                              {showAIOffer ? 'Sembunyikan Saran' : 'Lihat SARAN OTOMATIS'}
                              <div className="w-5 h-5 rounded-full bg-blue-500 text-black text-[8px] flex items-center justify-center">{suggestions.length}</div>
                            </button>
                            
                            {/* Refresh Indicator when items change */}
                            <AnimatePresence>
                              {showAIOffer && (
                                <motion.div
                                  key={selectedItems.length}
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0 }}
                                  className="absolute -right-2 -top-2 px-3 py-1 bg-emerald-500 text-black text-[7px] font-black uppercase rounded-full shadow-lg z-20 pointer-events-none"
                                >
                                  Saran Diperbarui ✨
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                        {/* AI Smart Suggestions Section (Controlled by Toggle) */}
                        <AnimatePresence>
                          {showAIOffer && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={selectedItems.length} // Force re-animation when items change
                      initial={{ opacity: 0.5, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="bg-blue-500/5 border border-blue-500/20 rounded-3xl p-4 sm:p-6 space-y-5"
                    >
                      {suggestions.length === 0 ? (
                        <div className="py-12 text-center">
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Belum Ada Saran Yang Cocok</p>
                        </div>
                      ) : (
                        suggestions.map((s, idx) => (
                          <motion.div 
                            key={`${s.panel.id}-${idx}`}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`p-5 sm:p-6 bg-black/40 border rounded-3xl transition-all flex flex-col justify-between ${s.suggestionType === 'OPTIMIZATION' ? 'border-amber-500/30 shadow-lg shadow-amber-500/5' : 'border-white/5'}`}
                          >
                             <div>
                               <div className="mb-4">
                                 <div className="flex items-center justify-between mb-2">
                                   <p className="text-xs sm:text-sm font-black text-white uppercase tracking-tight leading-tight">{s.panel.nama}</p>
                                   <div className={`px-2.5 py-1 rounded-full text-[7px] font-black uppercase tracking-widest ${s.suggestionType === 'OPTIMIZATION' ? 'bg-amber-500 text-black' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                                     {s.suggestionType === 'OPTIMIZATION' ? 'OPTIMAL' : `${Math.round(s.matchPercentage)}% COCOK`}
                                   </div>
                                 </div>
                                 <div className="flex items-center gap-2">
                                   <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                     <div 
                                       style={{ width: `${s.matchPercentage}%` }}
                                       className={`h-full ${s.suggestionType === 'OPTIMIZATION' ? 'bg-amber-500' : 'bg-blue-500'}`}
                                     />
                                   </div>
                                 </div>
                               </div>

                               <div className="mb-6">
                                 <div className="space-y-4">
                                   {/* Matched Items */}
                                   <div className="space-y-2">
                                     <div className="flex items-center gap-2">
                                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                                       <p className="text-[8px] font-black text-emerald-500/60 uppercase tracking-[0.2em]">Sudah Sesuai ({s.matches.length} Item):</p>
                                     </div>
                                     <div className="flex flex-wrap gap-1.5 pl-3">
                                       {s.matches.map((m, i) => (
                                         <span key={i} className="text-[7px] font-black text-emerald-400 capitalize bg-emerald-500/5 border border-emerald-500/10 px-2 py-1 rounded-lg">
                                           {m}
                                         </span>
                                       ))}
                                     </div>
                                   </div>

                                   {/* Missing Items */}
                                   {s.suggestionType === 'UPSELL' ? (
                                     <div className="space-y-2">
                                       <div className="flex items-center gap-2">
                                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]" />
                                         <p className="text-[8px] font-black text-blue-500/60 uppercase tracking-[0.2em]">Kekurangan ({s.missing.length} Item):</p>
                                       </div>
                                       <div className="flex flex-wrap gap-1.5 pl-3">
                                         {s.missing.map((m, i) => (
                                           <span key={i} className="text-[7px] font-black text-blue-400 capitalize bg-blue-500/5 border border-blue-500/10 px-2 py-1 rounded-lg">
                                             {m}
                                           </span>
                                         ))}
                                       </div>
                                     </div>
                                   ) : (
                                     <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-2xl flex items-center gap-2">
                                        <Sparkles size={14} className="text-amber-500 shrink-0" />
                                        <p className="text-[8px] font-black text-amber-500 uppercase leading-tight">Pilihan tes anda sudah mencakup semua isi paket ini!</p>
                                     </div>
                                   )}
                                 </div>
                               </div>
                             </div>

                            <div className="space-y-4 pt-5 border-t border-white/10">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col justify-center p-3 bg-white/5 rounded-2xl border border-white/5">
                                  <p className="text-[7px] font-black text-white/30 uppercase tracking-widest leading-none mb-1.5">Harga Normal</p>
                                  <p className="text-xs font-mono font-black text-white/60">Rp {s.matchedTotal.toLocaleString()}</p>
                                </div>

                                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 relative overflow-hidden group">
                                  <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1.5">Harga Paket</p>
                                  <div className="flex items-center justify-between gap-1">
                                    <p className="text-xs font-mono font-black text-emerald-400">Rp {s.panel.harga.toLocaleString()}</p>
                                    <div className="px-1.5 py-0.5 rounded bg-emerald-500 text-black text-[7px] font-black uppercase">-{Math.max(20, s.savingPercent)}%</div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between py-4 px-5 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-inner">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                    <Tag size={16} className="text-blue-400" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-blue-400 uppercase leading-none">HEMAT</p>
                                    <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest mt-1">Ganti ke Paket</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[8px] font-black text-blue-500/40 uppercase mb-0.5">ESTIMASI</p>
                                  <p className="text-xl font-black text-blue-400 font-mono italic tracking-tighter">Rp {s.savingAmount.toLocaleString()}</p>
                                </div>
                              </div>

                              <button 
                                onClick={() => {
                                  upgradeToPanel(s.panel, s.matches);
                                  if (suggestions.length <= 1) setShowAIOffer(false);
                                }}
                                className={`w-full h-14 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-3 transition-all group ${s.suggestionType === 'OPTIMIZATION' ? 'bg-amber-500 text-black shadow-xl shadow-amber-500/20' : 'bg-blue-500 text-black shadow-xl shadow-blue-500/20 hover:scale-[1.02]'}`}
                              >
                                AMBIL PAKET HEMAT <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
                              </button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </motion.div>
                  </AnimatePresence>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
