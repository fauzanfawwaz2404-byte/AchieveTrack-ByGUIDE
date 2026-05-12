import React, { useMemo, useState } from 'react';
import { LayoutDashboard, TrendingUp, Users, Send, CheckCircle, BarChart3, PieChart as PieChartIcon, Calendar, History, Trash2, Clock, CalendarDays, FileDown, Filter, Settings, RefreshCw, PhoneOff } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { WAHistory, WATarget, WACampaignSummary, WABlacklist, WASetup } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface WAPersonalDashboardProps {
  targets: WATarget[];
  history: WAHistory[];
  campaigns: WACampaignSummary[];
  waBlacklist?: WABlacklist[];
  setup?: WASetup;
  onDeleteCampaign?: (id: string) => void;
  onAddBlacklist?: (data: Omit<WABlacklist, 'id' | 'timestamp'>) => void;
  title?: string;
  isCBG?: boolean;
  userEmail?: string;
}

export default function WAPersonalDashboard({ 
  targets, history, campaigns, waBlacklist = [], setup,
  onDeleteCampaign, onAddBlacklist, title = "WA PERSONAL", isCBG = false,
  userEmail
}: WAPersonalDashboardProps) {
  const isSuperAdmin = userEmail === 'fauzanfawwaz2404@gmail.com';
  const [exportRange, setExportRange] = useState({ start: '', end: '' });
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistForm, setBlacklistForm] = useState({
    sisproId: '',
    title: '',
    nama: '',
    phone: '',
    reason: 'Permintaan Pasien'
  });
  const [filter, setFilter] = useState({
    startDate: '',
    endDate: '',
    tema: 'ALL'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showStaffPreviewModal, setShowStaffPreviewModal] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState<{
    type: 'SENT_TODAY' | 'NO_WA' | 'TOTAL_SENT' | 'UNIQUE_PATIENTS' | 'CAMPAIGN_PROGRESS';
    label: string;
  } | null>(null);

  const [collapsedTables, setCollapsedTables] = useState({
    noWa: true,
    blacklist: true
  });

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    return history.filter(h => {
      const matchTema = filter.tema === 'ALL' || h.tema === filter.tema;
      const date = h.sentAt ? new Date(h.sentAt).toISOString().split('T')[0] : '';
      const matchStart = !filter.startDate || date >= filter.startDate;
      const matchEnd = !filter.endDate || date <= filter.endDate;
      return matchTema && matchStart && matchEnd;
    });
  }, [history, filter]);

  const targetStats = useMemo(() => {
    const map = new Map<string, {
      nama: string;
      terkirim: number;
      tidakAdaWA: number;
      blacklist: number;
      totalTarget: number;
      totalCampaigns: Set<string>;
    }>();

    // Process blacklist into sets for O(1) lookup
    const blacklistedSisproIds = new Set(waBlacklist.map(b => b.sisproId).filter(Boolean));
    const blacklistedPhones = new Set(waBlacklist.map(b => b.phone).filter(Boolean));

    // Process from current targets (Workload)
    const targetMap = new Map<string, Set<string>>(); // To track unique sisproIds per staff in targets
    
    if (Array.isArray(targets)) {
      targets.forEach(t => {
        // Apply campaign filter to workload
        if (filter.tema !== 'ALL' && t.tema !== filter.tema) return;

        let key = t.petugasNama || 'TIDAK TERIDENTIFIKASI';
        const keyUpper = key.toUpperCase();
        if (keyUpper === 'DIAN' || keyUpper === 'DHYAN' || keyUpper.includes('DHYAN EKA')) {
          key = 'DHIAN';
        } else if (keyUpper === 'SITA' || keyUpper.includes('MASYITA') || keyUpper.includes('NURHIDAYATI')) {
          key = 'SITA';
        }

        if (!map.has(key)) {
          map.set(key, {
            nama: key,
            terkirim: 0,
            tidakAdaWA: 0,
            blacklist: 0,
            totalTarget: 0,
            totalCampaigns: new Set()
          });
          targetMap.set(key, new Set());
        }
        const entry = map.get(key)!;
        entry.totalTarget++;
        targetMap.get(key)!.add(t.sisproId);
        
        const isBlacklisted = blacklistedSisproIds.has(t.sisproId) || blacklistedPhones.has(t.phone);
        if (isBlacklisted) {
          entry.blacklist++;
        } else {
          if (t.status === 'Sudah Dikirim') entry.terkirim++;
          if (t.status === 'Tidak Ada WA') entry.tidakAdaWA++;
        }
        
        if (t.tema) entry.totalCampaigns.add(t.tema);
      });
    }

    // Track themes present in active workload
    const activeThemes = new Set<string>();
    if (Array.isArray(targets)) {
      targets.forEach(t => { if(t.tema) activeThemes.add(t.tema); });
    }

    // Process from history (Past performance) - Only count if not already in targets to avoid double counting
    if (Array.isArray(filteredHistory)) {
      filteredHistory.forEach(h => {
        // Only count history that matches themes in active targets (if any targets exist)
        const isRelevanTheme = activeThemes.size === 0 || (h.tema && activeThemes.has(h.tema));
        if (!isRelevanTheme) return;

        let key = h.petugasNama || 'TIDAK TERIDENTIFIKASI';
        const keyUpper = key.toUpperCase();
        if (keyUpper === 'DIAN' || keyUpper === 'DHYAN' || keyUpper.includes('DHYAN EKA')) {
          key = 'DHIAN';
        } else if (keyUpper === 'SITA' || keyUpper.includes('MASYITA') || keyUpper.includes('NURHIDAYATI')) {
          key = 'SITA';
        }

        if (!map.has(key)) {
          map.set(key, {
            nama: key,
            terkirim: 0,
            tidakAdaWA: 0,
            blacklist: 0,
            totalTarget: 0,
            totalCampaigns: new Set()
          });
          targetMap.set(key, new Set());
        }
        const entry = map.get(key)!;
        const seenInTargets = targetMap.get(key)?.has(h.sisproId);
        
        if (!seenInTargets) {
          if (h.status === 'Sudah Dikirim') entry.terkirim++;
          if (h.status === 'Tidak Ada WA') entry.tidakAdaWA++;
          if (h.tema) entry.totalCampaigns.add(h.tema);
        }
      });
    }

    return Array.from(map.values()).sort((a, b) => b.terkirim - a.terkirim);
  }, [filteredHistory, targets, waBlacklist]);

  const [visiblePetugasCount, setVisiblePetugasCount] = useState(12);

  const filteredTargetStats = useMemo(() => {
    let result = targetStats;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = targetStats.filter(t => t.nama.toLowerCase().includes(s));
    }
    return result;
  }, [targetStats, searchTerm]);

  const displayedTargetStats = useMemo(() => {
    return filteredTargetStats.slice(0, visiblePetugasCount);
  }, [filteredTargetStats, visiblePetugasCount]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchTema = filter.tema === 'ALL' || c.tema === filter.tema;
      // Use setupDate for date filtering campaigns
      const date = c.setupDate ? new Date(c.setupDate).toISOString().split('T')[0] : '';
      const matchStart = !filter.startDate || date >= filter.startDate;
      const matchEnd = !filter.endDate || date <= filter.endDate;
      return matchTema && matchStart && matchEnd;
    });
  }, [campaigns, filter]);

  const temas = useMemo(() => {
    const set = new Set<string>();
    // User wants only those that appear in history and no "TRIAL"
    history.forEach(h => { 
      if(h.tema) {
        const themeUpper = h.tema.toUpperCase();
        if (!themeUpper.includes('TRIAL')) {
          set.add(h.tema);
        }
      }
    });
    return Array.from(set).sort();
  }, [history]);
  
  const stats = useMemo(() => {
    const totalCurrent = targets.length || 0;
    const sentCurrent = targets.filter(t => t.status === 'Sudah Dikirim').length || 0;
    const noWaCurrent = targets.filter(t => t.status === 'Tidak Ada WA').length || 0;
    
    // For CBG, if setup target is set, use the larger of actual vs setup
    // For overall progress, if isCBG we can use setup.targetPerStaff * setup.staffIds.length
    const setupTargetValue = (isCBG && setup?.targetPerStaff && setup?.staffIds?.length) 
      ? (setup.targetPerStaff * (setup.staffIds.length || 1)) 
      : totalCurrent;
      
    const baseTotalForProgress = Math.max(totalCurrent, setupTargetValue);
    
    // Use filtered history for all-time stats
    const totalAllTime = filteredHistory.length || 0;
    const uniqueTargets = new Set(filteredHistory.map(h => h.sisproId)).size || 0;
    const noWaCurrentAllTime = filteredHistory.filter(h => h.status === 'Tidak Ada WA').length || 0;
    
    return {
      totalCurrent: baseTotalForProgress,
      actualCurrent: totalCurrent,
      sentCurrent,
      noWaCurrent,
      unsentCurrent: baseTotalForProgress - sentCurrent - noWaCurrent,
      totalAllTime,
      uniqueTargets,
      noWaCurrentAllTime,
      percentCurrent: baseTotalForProgress > 0 ? Math.min(100, Math.round((sentCurrent / baseTotalForProgress) * 100)) : 0
    };
  }, [targets, filteredHistory, isCBG, setup]);

  const noWaHistory = useMemo(() => {
    return filteredHistory.filter(h => h.status === 'Tidak Ada WA').slice(0, 20);
  }, [filteredHistory]);

  const filteredBlacklist = useMemo(() => {
    if (!Array.isArray(waBlacklist)) return [];
    return waBlacklist.filter(b => {
      if (!b) return false;
      if (!searchTerm) return true;
      
      const s = searchTerm.toLowerCase();
      const namaMatch = b.nama?.toLowerCase().includes(s);
      const phoneMatch = b.phone?.includes(searchTerm);
      const sisproMatch = b.sisproId?.toLowerCase().includes(s);
      
      return !!(namaMatch || phoneMatch || sisproMatch);
    });
  }, [waBlacklist, searchTerm]);

  const handleExportPDF = (isAllTime: boolean = true) => {
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID');
    
    // Filtering for report
    let filteredCampaignsForExport = [...campaigns];
    if (!isAllTime && exportRange.start && exportRange.end) {
      const start = new Date(exportRange.start);
      const end = new Date(exportRange.end);
      filteredCampaignsForExport = campaigns.filter(c => {
        const d = new Date(c.setupDate);
        return d >= start && d <= end;
      });
    }
    
    // Also apply theme filter to export if global filter theme is selected
    if (filter.tema !== 'ALL') {
       filteredCampaignsForExport = filteredCampaignsForExport.filter(c => c.tema === filter.tema);
    }

    // Header
    doc.setFillColor(15, 23, 42); // Blue gray 900
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(`${title} CAMPAIGN REPORT`, 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Periode: ${isAllTime ? 'Semua Waktu' : `${exportRange.start} s/d ${exportRange.end}`}`, 105, 28, { align: 'center' });
    doc.text(`Dicetak pada: ${dateStr}`, 105, 34, { align: 'center' });

    // Table
    autoTable(doc, {
      startY: 50,
      head: [['TEMA CAMPAIGN', 'TGL SETUP', 'TOTAL TARGET', 'TERKIRIM', 'PERSENTASE']],
      body: filteredCampaignsForExport.map(c => [
        (c.tema || 'NO TEMA').toUpperCase(),
        new Date(c.setupDate).toLocaleDateString('id-ID'),
        c.totalTargets || 0,
        c.sentCount || 0,
        `${Math.round(((c.sentCount || 0) / (c.totalTargets || 1)) * 100)}%`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    // Summary Section
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("RINGKASAN TOTAL:", 14, finalY);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Campaign: ${filteredCampaignsForExport.length}`, 14, finalY + 8);
    doc.text(`Total Pesan Terkirim: ${filteredCampaignsForExport.reduce((s, c) => s + (c.sentCount || 0), 0)}`, 14, finalY + 14);

    // Footer
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`POWERED BY GUIDE | 2026 | HALAMAN ${i} DARI ${pageCount}`, 105, 285, { align: 'center' });
    }

    doc.save(`WA_Campaign_Report_${now.getTime()}.pdf`);
    setShowExportModal(false);
  };

  // Chart data: Group by date (all time history)
  const historyStats = useMemo(() => {
    const today = new Date().toLocaleDateString('id-ID');
    const sentToday = targets.filter(t => t.status === 'Sudah Dikirim').length;
    const noWaToday = targets.filter(t => t.status === 'Tidak Ada WA').length;
    return { sentToday, noWaToday };
  }, [targets]);

  const historyByDate = useMemo(() => {
    const groups: { [key: string]: number } = {};
    filteredHistory.forEach(h => {
      if (!h.sentAt) return;
      const d = new Date(h.sentAt);
      if (isNaN(d.getTime())) return;
      const dateStr = d.toLocaleDateString();
      groups[dateStr] = (groups[dateStr] || 0) + 1;
    });
    return Object.entries(groups).map(([date, count]) => ({ date, count: Number(count) || 0 })).slice(-14); // Last 14 days of filtered data
  }, [filteredHistory]);

  // Chart data: Group by tema
  const historyByTema = useMemo(() => {
    const groups: { [key: string]: number } = {};
    filteredHistory.forEach(h => {
      const theme = h.tema || 'No Theme';
      groups[theme] = (groups[theme] || 0) + 1;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value: Number(value) || 0 }));
  }, [filteredHistory]);

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

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
          <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl border bg-white/5 border-white/10 text-white/40 font-bold">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/10">
              <Send size={14} />
            </div>
            <span className="text-[10px] tracking-widest uppercase">2. KIRIM PESAN</span>
          </div>
          <div className="w-8 h-px bg-white/10 hidden md:block" />
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl border bg-amber-500 border-amber-400 text-black font-black shadow-lg shadow-amber-500/20">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-black/20 text-black">
              <RefreshCw size={14} />
            </div>
            <span className="text-[10px] tracking-widest uppercase">3. MONITOR HASIL</span>
          </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-(--text-color) tracking-tighter italic uppercase flex items-center gap-3">
            <LayoutDashboard className="text-blue-500" size={32} /> DASHBOARD {title}
          </h2>
          <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase mt-1">Laporan & Statistik Pengiriman Pesan</p>
        </div>

        {isSuperAdmin && (
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Filters UI */}
            <div className="flex flex-wrap items-center gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md">
               <div className="flex items-center">
                  <Filter size={14} className="text-blue-500 ml-2 mr-2" />
                  <select 
                    value={filter.tema} 
                    onChange={(e) => setFilter(p => ({ ...p, tema: e.target.value }))}
                    className="select select-xs bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 focus:outline-none w-32 md:w-40"
                  >
                    <option value="ALL" className="bg-slate-900">SEMUA KAMPANYE</option>
                    {temas.map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
                  </select>
               </div>
               
               <div className="w-px h-4 bg-white/10 mx-1" />
               
               <div className="flex items-center gap-1">
                  <input 
                    type="date"
                    value={filter.startDate}
                    onChange={(e) => setFilter(p => ({ ...p, startDate: e.target.value }))}
                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-tighter focus:ring-0 focus:outline-none w-24 px-1"
                    title="Start Date"
                  />
                  <span className="opacity-20">-</span>
                  <input 
                    type="date"
                    value={filter.endDate}
                    onChange={(e) => setFilter(p => ({ ...p, endDate: e.target.value }))}
                    className="bg-transparent border-none text-[10px] font-black uppercase tracking-tighter focus:ring-0 focus:outline-none w-24 px-1"
                    title="End Date"
                  />
                  {(filter.tema !== 'ALL' || filter.startDate || filter.endDate) && (
                    <button onClick={() => setFilter({ tema: 'ALL', startDate: '', endDate: '' })} className="ml-2 text-rose-500 hover:scale-110 transition-transform">
                       <Trash2 size={14} />
                    </button>
                  )}
               </div>
            </div>

            <button 
              onClick={() => setShowExportModal(true)}
              className="btn btn-primary h-12 px-6 rounded-xl font-black text-[10px] tracking-[0.2em] uppercase shadow-xl shadow-blue-500/20"
            >
              <FileDown size={18} className="mr-2" /> EXPORT REPORT
            </button>
          </div>
        )}
      </div>

      {/* EXPORT MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="glass w-full max-w-md p-8 rounded-[3rem] border border-white/10 shadow-2xl bg-slate-900 ring-1 ring-white/10">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
                   <FileDown className="text-blue-500" size={24} /> EXPORT PDF
                 </h3>
                 <button onClick={() => setShowExportModal(false)} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-500 transition-all">
                    <History size={20} className="rotate-45" />
                 </button>
              </div>

              <div className="space-y-6">
                 <div className="grid grid-cols-1 gap-4">
                    <div>
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">START DATE</label>
                       <input 
                         type="date" 
                         value={exportRange.start}
                         onChange={e => setExportRange(p => ({...p, start: e.target.value}))}
                         className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-blue-500 outline-none"
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">END DATE</label>
                       <input 
                         type="date" 
                         value={exportRange.end}
                         onChange={e => setExportRange(p => ({...p, end: e.target.value}))}
                         className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-blue-500 outline-none"
                       />
                    </div>
                 </div>

                 <div className="pt-4 flex flex-col gap-3">
                    <button 
                      onClick={() => handleExportPDF(false)}
                      disabled={!exportRange.start || !exportRange.end}
                      className="btn btn-primary w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-widest"
                    >
                      DOWNLOAD BY RANGE
                    </button>
                    <div className="relative py-2 flex items-center">
                       <span className="flex-grow border-t border-white/10"></span>
                       <span className="mx-4 text-[8px] font-black text-slate-500 uppercase tracking-widest">OR</span>
                       <span className="flex-grow border-t border-white/10"></span>
                    </div>
                    <button 
                      onClick={() => handleExportPDF(true)}
                      className="btn btn-ghost w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/10 hover:bg-white/5"
                    >
                      DOWNLOAD ALL TIME
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MODAL BLACKLIST MANUAL */}
      {showBlacklistModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass w-full max-w-lg p-10 rounded-[3rem] border border-white/10 shadow-2xl bg-slate-900 overflow-hidden relative">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-500/20 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-8 relative">
              <div>
                <h3 className="text-2xl font-black text-rose-500 italic uppercase tracking-tighter flex items-center gap-2">
                  <PhoneOff size={28} /> TAMBAH BLACKLIST
                </h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Input data pasien yang menolak dihubungi</p>
              </div>
              <button 
                onClick={() => setShowBlacklistModal(false)}
                className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 flex items-center justify-center transition-all"
              >
                <History size={24} className="rotate-45" />
              </button>
            </div>

            <div className="space-y-5 relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ID SISPRO</label>
                  <input 
                    type="text"
                    value={blacklistForm.sisproId}
                    onChange={e => setBlacklistForm(p => ({...p, sisproId: e.target.value.toUpperCase()}))}
                    placeholder="SIS-..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-xs font-bold text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">TITLE</label>
                  <input 
                    type="text"
                    value={blacklistForm.title}
                    onChange={e => setBlacklistForm(p => ({...p, title: e.target.value}))}
                    placeholder="TN / NY / SDR"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-xs font-bold text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">NAMA LENGKAP</label>
                <input 
                  type="text"
                  value={blacklistForm.nama}
                  onChange={e => setBlacklistForm(p => ({...p, nama: e.target.value.toUpperCase()}))}
                  placeholder="NAMA PASIEN..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-xs font-bold text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all uppercase"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">NOMOR WHATSAPP</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 font-black text-xs">62</span>
                  <input 
                    type="text"
                    value={blacklistForm.phone}
                    onChange={e => setBlacklistForm(p => ({...p, phone: e.target.value.replace(/\D/g, '')}))}
                    placeholder="8123456789"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-xs font-bold text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">ALASAN BLACKLIST</label>
                <select 
                  value={blacklistForm.reason}
                  onChange={e => setBlacklistForm(p => ({...p, reason: e.target.value}))}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-xs font-bold text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                >
                  <option value="Permintaan Pasien" className="bg-slate-900">Permintaan Pasien</option>
                  <option value="Salah Nomor" className="bg-slate-900">Salah Nomor</option>
                  <option value="Tidak Sopan" className="bg-slate-900">Tidak Sopan</option>
                  <option value="Sudah Meninggal" className="bg-slate-900">Sudah Meninggal</option>
                  <option value="Lainnya" className="bg-slate-900">Lainnya</option>
                </select>
              </div>

              <button 
                onClick={() => {
                  if (!blacklistForm.nama || !blacklistForm.phone) {
                    alert('NAMA dan NOMOR WA wajib diisi!');
                    return;
                  }
                  if (onAddBlacklist) {
                    let cleanPhone = blacklistForm.phone.replace(/\D/g, '');
                    if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);
                    const fullPhone = `62${cleanPhone}`;
                    
                    onAddBlacklist({
                      ...blacklistForm,
                      phone: fullPhone,
                      blacklistedBy: 'Admin (Manual)'
                    });
                    setBlacklistForm({ sisproId: '', title: '', nama: '', phone: '', reason: 'Permintaan Pasien' });
                    setShowBlacklistModal(false);
                  }
                }}
                className="w-full btn btn-primary h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/20 mt-4 border-none bg-rose-600 hover:bg-rose-500"
              >
                SIMPAN KE BLACKLIST
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK STATS */}
      {isSuperAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            { id: 'SENT_TODAY', label: 'SENT TODAY', val: stats.sentCurrent, sub: `Dari total ${stats.totalCurrent}`, icon: <Send size={24} />, color: 'emerald' },
            { id: 'NO_WA', label: 'TIDAK ADA WA', val: stats.noWaCurrent, sub: 'Data tanpa WhatsApp', icon: <PhoneOff size={24} />, color: 'rose' },
            { id: 'TOTAL_SENT', label: 'TOTAL TERKIRIM', val: stats.totalAllTime, sub: 'Akumulasi total', icon: <History size={24} />, color: 'blue' },
            { id: 'UNIQUE_PATIENTS', label: 'PASIEN UNIK', val: stats.uniqueTargets, sub: 'Target pernah dijangkau', icon: <Users size={24} />, color: 'amber' },
            { id: 'CAMPAIGN_PROGRESS', label: 'PROGRES CAMPAIGN', val: `${stats.percentCurrent}%`, sub: 'Setup aktif saat ini', icon: <TrendingUp size={24} />, color: 'pink' },
          ].map((stat, i) => (
            <button 
              key={i} 
              onClick={() => setShowDetailModal({ type: stat.id as any, label: stat.label })}
              className="glass p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group shadow-2xl text-left transition-all hover:border-blue-500/30 active:scale-95"
            >
              <div className={`absolute -top-10 -right-10 w-32 h-32 bg-${stat.color}-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700`}></div>
              <div className="flex justify-between items-start mb-4">
                <div className={`w-14 h-14 bg-${stat.color}-500/20 rounded-2xl flex items-center justify-center text-${stat.color}-500 border border-${stat.color}-500/20`}>
                  {stat.icon}
                </div>
              </div>
              <div className={`text-4xl font-black text-${stat.color}-500 tracking-tighter italic leading-none mb-2`}>{stat.val}</div>
              <div className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{stat.label}</div>
              <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{stat.sub}</div>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CHART: ACTIVITY LOG */}
        {isSuperAdmin && (
          <>
            <div className="lg:col-span-8 glass p-8 rounded-[3rem] border border-white/10 shadow-2xl bg-black/20">
              <div className="flex justify-between items-center mb-8">
                <div>
                   <h3 className="text-xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
                     <BarChart3 className="text-blue-500" size={20} /> LOG AKTIVITAS
                   </h3>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total pesan terkirim 7 hari terakhir</p>
                </div>
                <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-black text-blue-500 uppercase tracking-widest">
                   DATA HISTORIS
                </div>
              </div>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyByDate}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 900 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem' }}
                      itemStyle={{ color: '#3b82f6', fontWeight: 900, fontSize: 11 }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART: TEMA RATIO */}
            <div className="lg:col-span-4 glass p-8 rounded-[3rem] border border-white/10 shadow-2xl bg-black/20 flex flex-col">
               <h3 className="text-xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2 mb-8">
                 <PieChartIcon className="text-pink-500" size={20} /> TOP TEMA
               </h3>

               <div className="flex-grow flex items-center justify-center relative">
                 <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={historyByTema}
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {historyByTema.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', fontSize: '10px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <div className="text-3xl font-black text-white tracking-widest italic">{historyByTema.length}</div>
                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">TEMA</div>
                 </div>
               </div>

               <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  {historyByTema.slice(0, 3).map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-full border border-white/5">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                       <span className="text-[9px] font-black text-white/60 uppercase tracking-widest truncate max-w-[80px]">{item.name}</span>
                    </div>
                  ))}
               </div>
            </div>

            {/* CAMPAIGN HISTORY SUMMARY */}
            <div className="lg:col-span-12 glass p-8 rounded-[3rem] border border-white/10 shadow-2xl bg-black/20">
              <div className="flex justify-between items-center mb-8">
                <div>
                   <h3 className="text-xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
                     <CalendarDays className="text-amber-500" size={20} /> CAMPAIGN HISTORY
                   </h3>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Ringkasan aktivitas campaign yang pernah diatur</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="table w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="border-none text-slate-500 text-left">
                      <th className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4">CAMPAIGN TEMA</th>
                      <th className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4 text-center">SETTING AT</th>
                      <th className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4 text-center">DURATION</th>
                      <th className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4 text-center">TARGETS</th>
                      <th className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4 text-center">STATUS SEND</th>
                      <th className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4 text-center">AKSI</th>
                    </tr>
                  </thead>
                  <tbody className="gap-2">
                    {filteredCampaigns.slice().reverse().map((c) => (
                      <tr key={c.id} className="glass bg-white/5 border-none group transition-all">
                        <td className="rounded-l-2xl border-none px-4">
                           <span className="text-[11px] font-black text-white uppercase italic">{c.tema}</span>
                        </td>
                        <td className="border-none px-4 text-center">
                           <div className="text-[10px] font-bold text-blue-400">
                             {new Date(c.setupDate).toLocaleDateString('id-ID')}
                           </div>
                        </td>
                        <td className="border-none px-4 text-center">
                           <div className="flex flex-col items-center">
                             <span className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">START: {c.startDate}</span>
                             <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">END: {c.deadline}</span>
                           </div>
                        </td>
                        <td className="border-none px-4 text-center">
                           <div className="text-[11px] font-black text-white">{c.totalTargets}</div>
                           <div className="text-[8px] font-bold text-slate-500 uppercase">WA TOTAL</div>
                        </td>
                        <td className="border-none px-4 text-center">
                           <div className="flex flex-col items-center">
                             <div className="text-emerald-500 font-black text-[12px]">{Number(c.sentCount) || 0}</div>
                             <div className="text-[8px] font-bold uppercase text-slate-500">TERKIRIM ({(Number(c.totalTargets) || 0) > 0 ? Math.round(((Number(c.sentCount) || 0) / (Number(c.totalTargets) || 1)) * 100) : 0}%)</div>
                           </div>
                        </td>
                        <td className="rounded-r-2xl border-none px-4 text-center">
                           {onDeleteCampaign && (
                             <button 
                               onClick={() => {
                                 if(confirm(`Hapus history campaign "${c.tema}"?`)) {
                                   onDeleteCampaign(c.id);
                                 }
                               }}
                               className="w-10 h-10 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white flex items-center justify-center transition-all border border-rose-500/20 active:scale-95"
                               title="HAPUS CAMPAIGN"
                             >
                               <Trash2 size={16} />
                             </button>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {campaigns.length === 0 && (
                <div className="p-12 text-center">
                   <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">BELUM ADA RIWAYAT CAMPAIGN</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* RINCIAN PER NAMA (BENTO GRID) */}
        <div className="lg:col-span-12 glass p-8 rounded-[3.5rem] border border-white/10 shadow-2xl bg-black/20 mt-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Users size={120} />
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative">
            <div>
              <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                <Users className="text-blue-500" size={28} /> RINCIAN PROGRES PER PETUGAS
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Monitoring produktivitas pengiriman setiap SDM/Petugas</p>
            </div>
            
            <div className="relative w-full md:w-72">
              <input 
                type="text"
                placeholder="CARI NAMA PETUGAS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-[10px] font-black text-white tracking-widest focus:border-blue-500 outline-none transition-all"
              />
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedTargetStats.map((item, idx) => {
              const setupTarget = isCBG ? (setup?.targetPerStaff || 0) : 0;
              // Priority: Workload Total > Setup Target > Sum of status
              const baseTarget = Math.max(setupTarget, item.totalTarget) || (item.terkirim + item.tidakAdaWA);
              const percent = Math.round((item.terkirim / (baseTarget || 1)) * 100);
              
              return (
                <div key={idx} className="glass bg-white/5 p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group hover:border-blue-500/50 transition-all duration-500">
                   <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1 min-w-0">
                         <h4 className="text-sm font-black text-white truncate italic group-hover:text-blue-400 transition-colors uppercase">{item.nama}</h4>
                      </div>
                      <div className="text-[10px] font-black text-blue-500 shrink-0 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/10">
                        {percent}%
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10">
                         <div className="text-base font-black text-emerald-500 italic leading-none">{item.terkirim}</div>
                         <div className="text-[7px] font-black text-emerald-500/60 uppercase tracking-widest mt-1">KIRIM</div>
                      </div>
                      <div className="bg-orange-500/5 p-3 rounded-2xl border border-orange-500/10">
                         <div className="text-base font-black text-orange-500 italic leading-none">{item.tidakAdaWA}</div>
                         <div className="text-[7px] font-black text-orange-500/60 uppercase tracking-widest mt-1">NO WA</div>
                      </div>
                      <div className="bg-rose-500/5 p-3 rounded-2xl border border-rose-500/10">
                         <div className="text-base font-black text-rose-500 italic leading-none">{item.blacklist}</div>
                         <div className="text-[7px] font-black text-rose-500/60 uppercase tracking-widest mt-1">B.LIST</div>
                      </div>
                   </div>

                   <div className="space-y-2">
                     <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest">
                       <span>PROGRESS</span>
                       <span>{item.terkirim}/{baseTarget}</span>
                     </div>
                     <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                         style={{ width: `${Math.min(100, percent)}%` }}
                       />
                     </div>
                   </div>
                </div>
              );
            })}
          </div>

          {filteredTargetStats.length > visiblePetugasCount && (
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => setVisiblePetugasCount(prev => prev + 12)}
                className="btn btn-ghost px-10 h-12 rounded-xl text-[10px] font-black tracking-[0.3em] uppercase border border-white/5 hover:bg-white/10"
              >
                TAMPILKAN LEBIH BANYAK
              </button>
              <button 
                onClick={() => setShowStaffPreviewModal(true)}
                className="btn btn-primary px-10 h-12 rounded-xl text-[10px] font-black tracking-[0.3em] uppercase shadow-xl shadow-blue-500/20"
              >
                <LayoutDashboard size={14} className="mr-2" /> PREVIEW RINGKAS
              </button>
            </div>
          )}

          {filteredTargetStats.length === 0 && (
            <div className="p-20 text-center">
               <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-white/10 opacity-20">
                 <Users size={32} />
               </div>
               <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">TIDAK ADA DATA TARGET DITEMUKAN</p>
            </div>
          )}
        </div>

      {/* DETAIL MODAL DASHBOARD */}
      {showDetailModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass w-full max-w-4xl max-h-[85vh] rounded-[3rem] border border-white/10 shadow-2xl bg-slate-900 overflow-hidden flex flex-col relative">
             <div className="flex justify-between items-center p-8 border-b border-white/5">
                <div>
                   <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                     <TrendingUp className="text-blue-500" size={28} /> RINCIAN: {showDetailModal.label}
                   </h3>
                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Laporan detail data per kategori terpilih</p>
                </div>
                <button 
                   onClick={() => setShowDetailModal(null)}
                   className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 flex items-center justify-center transition-all"
                >
                   <History size={24} className="rotate-45" />
                </button>
             </div>

             <div className="overflow-y-auto overflow-x-hidden flex-grow custom-scrollbar relative px-8 pt-4 pb-8">
                <table className="w-full border-collapse">
                   <thead className="sticky top-[-16px] z-30">
                      <tr className="bg-slate-900 shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                         <th className="text-[10px] font-black uppercase tracking-widest py-6 px-4 text-left text-blue-500 whitespace-nowrap">PASIEN</th>
                         <th className="text-[10px] font-black uppercase tracking-widest py-6 px-4 text-left text-slate-500 whitespace-nowrap">ID SISPRO</th>
                         <th className="text-[10px] font-black uppercase tracking-widest py-6 px-4 text-left text-slate-500 whitespace-nowrap">TEMA/KAMPANYE</th>
                         <th className="text-[10px] font-black uppercase tracking-widest py-6 px-4 text-left text-slate-500 whitespace-nowrap">PETUGAS</th>
                         <th className="text-[10px] font-black uppercase tracking-widest py-6 px-4 text-left text-slate-500 whitespace-nowrap">STATUS</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5 bg-slate-900">
                      {(() => {
                         let detailData: any[] = [];
                         if (showDetailModal.type === 'SENT_TODAY') {
                            detailData = targets.filter(t => t.status === 'Sudah Dikirim');
                         } else if (showDetailModal.type === 'NO_WA') {
                            detailData = targets.filter(t => t.status === 'Tidak Ada WA');
                         } else if (showDetailModal.type === 'TOTAL_SENT') {
                            detailData = filteredHistory.filter(h => h.status === 'Sudah Dikirim');
                         } else if (showDetailModal.type === 'UNIQUE_PATIENTS') {
                            const seen = new Set();
                            detailData = filteredHistory.filter(h => {
                               if (seen.has(h.sisproId)) return false;
                               seen.add(h.sisproId);
                               return true;
                            });
                         } else if (showDetailModal.type === 'CAMPAIGN_PROGRESS') {
                            detailData = targets;
                         }

                         if (detailData.length === 0) {
                            return (
                               <tr>
                                  <td colSpan={5} className="py-20 text-center">
                                     <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em]">TIDAK ADA DATA UNTUK DITAMPILKAN</p>
                                  </td>
                               </tr>
                            );
                         }

                         return detailData.slice(0, 100).map((d, i) => (
                            <tr key={i} className="group hover:bg-white/[0.02] transition-colors border-b border-white/[0.02]">
                               <td className="py-4 px-4">
                                  <div className="text-[11px] font-black text-white uppercase italic group-hover:text-blue-400 transition-colors">{d.nama}</div>
                                  <div className="text-[9px] font-bold text-slate-500">{d.phone || '-'}</div>
                               </td>
                               <td className="py-4 px-4">
                                  <span className="text-[10px] font-mono font-bold text-blue-400/70">{d.sisproId}</span>
                               </td>
                               <td className="py-4 px-4">
                                  <span className="text-[9px] font-black text-white/40 uppercase tracking-tight">{d.tema || 'NO TEMA'}</span>
                               </td>
                               <td className="py-4 px-4 text-[10px] font-black text-slate-500 uppercase italic">
                                  {d.petugasNama || '-'}
                               </td>
                               <td className="py-4 px-4 text-[9px] font-black uppercase">
                                  <span className={`px-2 py-1 rounded-md ${
                                    d.status === 'Sudah Dikirim' ? 'bg-emerald-500/10 text-emerald-500' : 
                                    d.status === 'Tidak Ada WA' ? 'bg-rose-500/10 text-rose-500' : 
                                    'bg-amber-500/10 text-amber-500'
                                  }`}>
                                     {d.status || 'PENDING'}
                                  </span>
                               </td>
                            </tr>
                         ));
                      })()}
                   </tbody>
                </table>
             </div>
             
             <div className="p-6 bg-white/5 border-t border-white/5 text-center">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">MENAMPILKAN MAKSIMUM 100 DATA TERBARU</p>
             </div>
          </div>
        </div>
      )}

      {/* STAFF PREVIEW MODAL (SCREENSHOT FRIENDLY) */}
      {showStaffPreviewModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-2 bg-black/95 backdrop-blur-xl">
           <div className="w-full max-w-[500px] max-h-[95vh] bg-[#07080a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col p-6">
              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                 <div>
                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">RINGKASAN PETUGAS</h3>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">AchievTrack Summary • {new Date().toLocaleDateString('id-ID')}</p>
                 </div>
                 <button onClick={() => setShowStaffPreviewModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                    <History size={16} className="rotate-45" />
                 </button>
              </div>

              <div className="space-y-1 overflow-y-auto custom-scrollbar flex-grow pr-2">
                 {targetStats.map((item, i) => {
                    const setupTarget = isCBG ? (setup?.targetPerStaff || 0) : 0;
                    const baseTarget = Math.max(setupTarget, item.totalTarget) || (item.terkirim + item.tidakAdaWA);
                    const percent = Math.round((item.terkirim / (baseTarget || 1)) * 100);
                    const visualPercent = Math.min(100, percent);
                    
                    return (
                       <div key={i} className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-2xl border border-white/[0.03]">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0 ${percent >= 100 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-blue-500/20 text-blue-500'}`}>
                             {i + 1}
                          </div>
                          <div className="flex-grow min-w-0">
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-black text-white truncate uppercase italic">{item.nama}</span>
                                <span className="text-[10px] font-black text-slate-400">{percent}%</span>
                             </div>
                             <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-1000 ${percent >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${visualPercent}%` }} />
                             </div>
                          </div>
                          <div className="flex flex-col items-end shrink-0 pl-2">
                             <span className="text-[10px] font-black text-white leading-none">{item.terkirim}/{baseTarget}</span>
                             <span className="text-[6px] font-bold text-slate-500 uppercase mt-0.5">TERKIRIM</span>
                          </div>
                       </div>
                    );
                 })}
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                 <div className="text-[10px] font-black text-white uppercase italic">
                    TOTAL: <span className="text-amber-500">{targetStats.length}</span> PETUGAS
                 </div>
                 <div className="text-[8px] font-bold text-slate-600 uppercase tracking-widest italic text-right">ACHIEVETRACK BY GUIDE | FAUZAN FAWWAZ | 2026</div>
              </div>
           </div>
        </div>
      )}

      {/* RECENT HISTORY TABLE */}
      <div className="lg:col-span-12 glass p-8 rounded-[3rem] border border-white/10 shadow-2xl bg-black/20">
        <div className="flex justify-between items-center mb-8">
          <div>
             <h3 className="text-xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
               <History className="text-emerald-500" size={20} /> LOG TERBARU
             </h3>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Riwayat Pengiriman kumulatif</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="border-none text-slate-500">
                <th className="bg-transparent text-[10px] font-black uppercase tracking-widest">PASIEN</th>
                <th className="bg-transparent text-[10px] font-black uppercase tracking-widest">CAMPAIGN / TEMA</th>
                <th className="bg-transparent text-[10px] font-black uppercase tracking-widest">WAKTU TERKIRIM</th>
                <th className="bg-transparent text-[10px] font-black uppercase tracking-widest">STATUS</th>
              </tr>
            </thead>
            <tbody className="gap-2">
              {filteredHistory.slice(-5).reverse().map((h) => (
                <tr key={h.id} className="glass bg-white/5 border-none group transition-all">
                  <td className="rounded-l-2xl border-none">
                     <div className="flex flex-col">
                        <span className="text-[11px] font-black text-white uppercase">{h.nama}</span>
                        <span className="text-[9px] font-bold text-slate-500">{h.sisproId}</span>
                     </div>
                  </td>
                  <td className="border-none">
                     <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-500/20 shadow-lg shadow-blue-500/10 italic">
                        {h.tema}
                     </span>
                  </td>
                  <td className="border-none">
                     <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={12} className="text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {new Date(h.sentAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                     </div>
                  </td>
                  <td className="rounded-r-2xl border-none">
                     <div className="flex items-center gap-2 text-emerald-500">
                        <CheckCircle size={14} />
                        <span className="text-[9px] font-black uppercase tracking-widest">SUCCESS</span>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {history.length === 0 && (
          <div className="p-12 text-center">
             <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">BELUM ADA RIWAYAT PENGIRIMAN</p>
          </div>
        )}
      </div>

      {/* DAFTAR TIDAK ADA WA */}
      <div className="lg:col-span-12 glass p-8 rounded-[3rem] border border-red-500/10 shadow-2xl bg-red-500/5 mt-6">
        <div className="flex justify-between items-center mb-8 cursor-pointer select-none" onClick={() => setCollapsedTables(p => ({ ...p, noWa: !p.noWa }))}>
          <div>
             <h3 className="text-xl font-black text-white italic tracking-tighter uppercase flex items-center gap-2">
               <PhoneOff className="text-rose-500" size={20} /> DAFTAR TIDAK ADA WA
             </h3>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Rekap target yang tidak memiliki nomor WhatsApp</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[10px] font-black text-rose-500 uppercase tracking-widest">
               Total: {stats.noWaCurrentAllTime} Kasus
            </div>
            <div className="text-slate-500">
              {collapsedTables.noWa ? <ChevronRight size={24} /> : <ChevronDown size={24} />}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {!collapsedTables.noWa && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="table w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="border-none text-slate-500">
                      <th className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4 text-left">Pasien</th>
                      <th className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4 text-center">ID SISPRO</th>
                      <th className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4 text-center">Petugas</th>
                      <th className="bg-transparent text-[10px] font-black uppercase tracking-widest px-4 text-center">Terakhir Up</th>
                    </tr>
                  </thead>
                  <tbody className="gap-2">
                    {noWaHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-12 text-center">
                           <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">BELUM ADA DATA TIDAK ADA WA</p>
                        </td>
                      </tr>
                    ) : (
                      noWaHistory.map((h) => (
                        <tr key={h.id} className="glass bg-white/5 border-none group transition-all hover:bg-rose-500/5">
                          <td className="rounded-l-2xl border-none px-4">
                             <span className="text-[11px] font-black text-white uppercase italic">{h.nama}</span>
                          </td>
                          <td className="border-none px-4 text-center">
                             <span className="text-[10px] font-mono font-bold text-white/40">{h.sisproId}</span>
                          </td>
                          <td className="border-none px-4 text-center">
                             <span className="text-[10px] font-black text-white/60 uppercase">{h.petugasNama}</span>
                          </td>
                          <td className="rounded-r-2xl border-none px-4 text-center">
                             <span className="text-[9px] font-bold text-slate-500 italic uppercase">
                                {new Date(h.sentAt).toLocaleDateString('id-ID')}
                             </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DAFTAR PASIEN BLACKLIST */}
      <div className="lg:col-span-12 glass p-10 rounded-[3.5rem] border border-white/10 shadow-2xl bg-slate-900/40 mt-10 relative overflow-hidden group">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none group-hover:scale-125 transition-transform duration-1000"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none group-hover:scale-125 transition-transform duration-1000"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 relative cursor-pointer select-none" onClick={() => setCollapsedTables(p => ({ ...p, blacklist: !p.blacklist }))}>
          <div className="space-y-2">
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20 border border-rose-500/20">
                 <PhoneOff size={24} />
               </div>
               <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">
                 DAFTAR PASIEN BLACKLIST
               </h3>
             </div>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-15">
               Daftar pasien yang memohon atau diblokir dari semua kampanye WA
             </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="text-slate-500">
               {collapsedTables.blacklist ? <ChevronRight size={32} /> : <ChevronDown size={32} />}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {!collapsedTables.blacklist && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden relative"
            >
              <div className="flex flex-wrap items-center gap-4 w-full md:w-auto mb-8 relative z-10">
                <div className="relative flex-grow md:flex-grow-0">
                   <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                   <input 
                     type="text"
                     placeholder="Cari nama / nomor..."
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     className="bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-[10px] font-bold text-white placeholder:text-white/20 focus:border-rose-500/50 outline-none w-full md:w-56"
                   />
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowBlacklistModal(true); }}
                  className="px-8 h-12 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-rose-600/20 active:scale-95 flex items-center gap-2 border border-rose-400/30"
                >
                  + TAMBAH BLACKLIST
                </button>
                <div className="h-12 px-6 flex items-center gap-2 bg-slate-500/10 border border-white/5 rounded-xl text-[10px] font-black text-white/60 uppercase tracking-widest backdrop-blur-md">
                   <Users size={14} className="text-slate-400" />
                   TOTAL: {waBlacklist.length} <span className="hidden sm:inline">PASIEN</span>
                </div>
              </div>

              <div className="overflow-x-auto relative z-10">
                <table className="table w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="border-none text-slate-500">
                      <th className="bg-transparent text-[10px] font-black uppercase tracking-[0.2em] px-8 text-left py-4">Informasi Pasien</th>
                      <th className="bg-transparent text-[10px] font-black uppercase tracking-[0.2em] px-4 text-center py-4">Alasan Pemblokiran</th>
                      <th className="bg-transparent text-[10px] font-black uppercase tracking-[0.2em] px-4 text-center py-4">Didaftarkan Oleh</th>
                      <th className="bg-transparent text-[10px] font-black uppercase tracking-[0.2em] px-8 text-right py-4">Waktu Input</th>
                    </tr>
                  </thead>
                  <tbody className="gap-2">
                    {filteredBlacklist.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-20 text-center glass rounded-[2.5rem] border-dashed border-2 border-white/5 bg-white/[0.02]">
                           <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                              <PhoneOff size={32} className="text-white/10" />
                           </div>
                           <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">BELUM ADA DATA BLACKLIST</p>
                           {searchTerm && <p className="text-[8px] font-bold text-rose-500/40 uppercase mt-2">Coba kata kunci lain...</p>}
                        </td>
                      </tr>
                    ) : (
                      filteredBlacklist.slice().reverse().map((b) => (
                        <tr key={b.id || `bl_${b.timestamp}_${b.phone}`} className="glass bg-white/5 border-none group transition-all hover:bg-rose-500/5 hover:translate-x-1">
                          <td className="rounded-l-[1.5rem] border-none px-8 py-5">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-rose-500 font-black italic shadow-inner">
                                   {b.nama?.charAt(0) || '?'}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[12px] font-black text-white uppercase italic tracking-tight">{b.nama || 'TANPA NAMA'}</span>
                                  <div className="flex items-center gap-2 mt-0.5">
                                     <span className="text-[9px] font-bold text-slate-500 tracking-wider font-mono">{b.phone}</span>
                                     {b.sisproId && (
                                       <span className="text-[7px] font-black bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">{b.sisproId}</span>
                                     )}
                                  </div>
                                </div>
                             </div>
                          </td>
                          <td className="border-none px-4 text-center">
                             <div className="inline-flex flex-col items-center gap-1">
                               <span className="px-4 py-1.5 bg-rose-500/10 text-rose-500 rounded-lg text-[9px] font-black uppercase tracking-widest border border-rose-500/20 shadow-lg shadow-rose-500/5">
                                 {b.reason || 'Permintaan Pasien'}
                               </span>
                             </div>
                          </td>
                          <td className="border-none px-4 text-center">
                             <div className="flex items-center justify-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                                   <Users size={12} className="text-slate-500" />
                                </div>
                                <span className="text-[10px] font-black text-white/50 uppercase italic">
                                  {(b.blacklistedBy || 'Admin').split('@')[0]}
                                </span>
                             </div>
                          </td>
                          <td className="rounded-r-[1.5rem] border-none px-8 text-right">
                             <span className="text-[10px] font-bold text-slate-500 italic uppercase">
                                {b.timestamp ? new Date(b.timestamp).toLocaleString('id-ID', { 
                                  day: '2-digit', 
                                  month: 'short', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : '-'}
                             </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
