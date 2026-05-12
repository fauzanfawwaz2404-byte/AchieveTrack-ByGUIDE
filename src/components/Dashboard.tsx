import React, { useState, useMemo } from 'react';
import { Kategori, Transaksi, WAHistory } from '../types';
import { 
  LayoutGrid, CheckCircle, XCircle, ChartLine, TriangleAlert, 
  Medal, FileText, Sparkles, TrendingUp, Users, Calendar, Wallet, Filter
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar 
} from 'recharts';
import { getDashboardInsight } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { getEffectiveDate } from '../lib/dateUtils';

interface DashboardProps {
  kategori: Kategori[];
  transaksi: Transaksi[];
  petugasList: string[];
  userEmail: string | null;
  layoutMode?: 'web' | 'mobile';
  waHistory?: WAHistory[];
  waHistoryCBG?: WAHistory[];
}

export default function Dashboard({ 
  kategori, 
  transaksi, 
  petugasList, 
  userEmail, 
  layoutMode = 'web',
  waHistory = [],
  waHistoryCBG = []
}: DashboardProps) {
  const isAdmin = userEmail === 'Admin Utama' || userEmail === 'fauzanfawwaz2404@gmail.com';
  const isMobile = layoutMode === 'mobile';
  // State Filter Dashboard Global (Top)
  const [filter, setFilter] = useState({ 
    kat: '', 
    pet: '', 
    startDate: '', 
    endDate: '',
    campaign: 'ALL' // ALL, A (Personal CC), B (SDM CABANG)
  });
  
  // State Navigasi Mingguan (History)
  const [weekViewDate, setWeekViewDate] = useState(new Date());

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printFilter, setPrintFilter] = useState({ kat: 'ALL', pet: 'ALL', start: '', end: '' });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<{ insights: string[], recommendation: string } | null>(null);

  const filteredData = useMemo(() => {
    return transaksi.filter(t => {
      const matchKat = !filter.kat || t.kategori === filter.kat;
      const matchPet = !filter.pet || t.petugas === filter.pet;
      
      const effectiveDate = getEffectiveDate(t.noLab || '', t.timestamp);
      const dayStr = effectiveDate.toISOString().split('T')[0];
      
      const matchStart = !filter.startDate || dayStr >= filter.startDate;
      const matchEnd = !filter.endDate || dayStr <= filter.endDate;
      
      return matchKat && matchPet && matchStart && matchEnd;
    });
  }, [transaksi, filter]);

  const chartData = useMemo(() => {
    const dates = [];
    const base = filter.endDate ? new Date(filter.endDate) : new Date();
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() - (6 - i));
      dates.push(d.toISOString().split('T')[0]);
    }

    return dates.map(date => {
      const dayData = filteredData.filter(t => {
        const effectiveDate = getEffectiveDate(t.noLab || '', t.timestamp);
        return effectiveDate.toISOString().split('T')[0] === date;
      });
      return {
        name: date.split('-').slice(1).join('/'),
        revenue: dayData.reduce((s, t) => s + (Number(t.nominal) || 0), 0),
        visits: Number(dayData.length) || 0
      };
    });
  }, [filteredData, filter.endDate]);

  const weeklyData = useMemo(() => {
    const year = weekViewDate.getFullYear();
    const month = weekViewDate.getMonth();
    
    const weeks = [
      { name: 'Minggu 1', start: 1, end: 7 },
      { name: 'Minggu 2', start: 8, end: 14 },
      { name: 'Minggu 3', start: 15, end: 21 },
      { name: 'Minggu 4', start: 22, end: 31 }
    ];

    return weeks.map(w => {
      const transactionsInWeek = filteredData.filter(t => {
        const d = getEffectiveDate(t.noLab || '', t.timestamp);
        const day = d.getDate();
        return d.getFullYear() === year && d.getMonth() === month && day >= w.start && day <= w.end;
      });

      const pBreakdown = petugasList.map(p => {
        const pTrs = transactionsInWeek.filter(t => t.petugas === p);
        return {
          petugas: p,
          revenue: pTrs.reduce((s, t) => s + (Number(t.nominal) || 0), 0),
          visits: Number(pTrs.length) || 0
        };
      }).filter(p => p.visits > 0).sort((a, b) => b.revenue - a.revenue);

      return {
        ...w,
        revenue: transactionsInWeek.reduce((s, t) => s + (Number(t.nominal) || 0), 0),
        visits: Number(transactionsInWeek.length) || 0,
        petugasBreakdown: pBreakdown
      };
    });
  }, [transaksi, petugasList, weekViewDate]);

  const changeWeekMonth = (dir: number) => {
    const d = new Date(weekViewDate);
    d.setMonth(d.getMonth() + dir);
    setWeekViewDate(d);
  };

  const [selectedWeek, setSelectedWeek] = useState<typeof weeklyData[0] | null>(null);

  const totalRev = useMemo(() => filteredData.reduce((sum, t) => sum + (Number(t.nominal) || 0), 0), [filteredData]);
  const totalVis = Number(filteredData.length) || 0;

  const { targetRev, targetVis } = useMemo(() => {
    if (filter.kat) {
      const current = kategori.find(k => k.nama === filter.kat);
      return { 
        targetRev: Number(current?.targetRevenue) || 0, 
        targetVis: Number(current?.targetVisit) || 0 
      };
    }
    return {
      targetRev: kategori.reduce((sum, k) => sum + (Number(k.targetRevenue) || 0), 0),
      targetVis: kategori.reduce((sum, k) => sum + (Number(k.targetVisit) || 0), 0)
    };
  }, [kategori, filter.kat]);

  const isRevAchieved = totalRev >= targetRev;
  const isVisAchieved = totalVis >= targetVis;

  const handleAiAnalysis = async () => {
    setAiLoading(true);
    const result = await getDashboardInsight(transaksi, kategori);
    setAiInsight(result);
    setAiLoading(false);
  };

  const exportProdigyPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    const fK = printFilter.kat;
    const fP = printFilter.pet;
    const fS = printFilter.start;
    const fE = printFilter.end;
    
    const filtered = transaksi.filter(t => 
      (fK === 'ALL' || t.kategori === fK) && 
      (fP === 'ALL' || t.petugas === fP) && 
      (!fS || t.timestamp.split('T')[0] >= fS) && 
      (!fE || t.timestamp.split('T')[0] <= fE)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    doc.setFillColor(245, 158, 11);
    doc.rect(0, 0, pageWidth, 15, 'F');

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text('ACHIEVETRACK PRODIA DEPOK', 14, 10);
    
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('LAPORAN RINCIAN KINERJA PETUGAS', 14, 28);
    
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(1);
    doc.line(14, 31, 80, 31);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);

    let yPos = 42;
    doc.setFont("helvetica", "bold"); doc.text(`Kategori`, 14, yPos);
    doc.setFont("helvetica", "normal"); doc.text(`: ${fK === 'ALL' ? 'Semua Kategori' : fK}`, 40, yPos);
    
    doc.setFont("helvetica", "bold"); doc.text(`Petugas`, 14, yPos + 6);
    doc.setFont("helvetica", "normal"); doc.text(`: ${fP === 'ALL' ? 'Semua Petugas' : fP}`, 40, yPos + 6);
    
    const periodeTxt = (fS || fE) 
        ? `${fS ? fS : 'Awal'} s/d ${fE ? fE : 'Sekarang'}`
        : 'Seluruh Periode';
    doc.setFont("helvetica", "bold"); doc.text(`Periode`, 14, yPos + 12);
    doc.setFont("helvetica", "normal"); doc.text(`: ${periodeTxt}`, 40, yPos + 12);
    doc.setFont("helvetica", "bold"); doc.text(`Waktu Cetak`, 14, yPos + 18);
    doc.setFont("helvetica", "normal"); doc.text(`: ${new Date().toLocaleString('id-ID')}`, 40, yPos + 18);

    const totalNominal = filtered.reduce((s, t) => s + Number(t.nominal), 0);
    doc.setFillColor(245, 158, 11, 0.1);
    doc.roundedRect(120, 38, 75, 24, 3, 3, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "bold");
    doc.text('RINGKASAN REVENUE', 125, 45);
    doc.setFontSize(14);
    doc.setTextColor(245, 158, 11);
    doc.text(`Rp ${totalNominal.toLocaleString('id-ID')}`, 125, 54);

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`TOTAL : ${filtered.length} Visit`, 125, 59);

    autoTable(doc, {
        startY: 70,
        head: [['No', 'Tanggal', 'No. Lab', 'Kategori', 'Item Promo', 'Petugas', 'Nominal']],
        body: filtered.map((t, index) => [
            index + 1,
            new Date(t.timestamp).toLocaleDateString('id-ID'),
            t.noLab || '-',
            t.kategori.toUpperCase(),
            t.promo.toUpperCase(),
            t.petugas.toUpperCase(),
            `Rp ${Number(t.nominal).toLocaleString('id-ID')}`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            6: { halign: 'right' }
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        didDrawPage: (data) => {
            const pageCount = doc.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.setFont("helvetica", "normal");
            doc.text(`Halaman ${pageCount}`, data.settings.margin.left, pageHeight - 10);
            
            doc.setFont("courier", "bold");
            doc.setTextColor(245, 158, 11);
            const footerText = "POWERED BY GUIDE";
            const textWidth = doc.getTextWidth(footerText);
            doc.text(footerText, (pageWidth / 2) - (textWidth / 2), pageHeight - 10);
        }
    });

    const filename = `Laporan_Kinerja_${fK}_${fP}_${new Date().toISOString().split('T')[0]}.pdf`;

    // ADD NEW PAGE FOR STAFF CONTRIBUTION
    doc.addPage();
    
    // Header for new page
    doc.setFillColor(245, 158, 11);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text('ACHIEVETRACK PRODIA DEPOK', 14, 10);

    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('KONTRIBUSI PETUGAS', 14, 28);
    
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(1);
    doc.line(14, 31, 80, 31);

    const contributionData = petugasList.map(p => {
      const pTransactions = filtered.filter(t => t.petugas === p);
      const revenue = pTransactions.reduce((sum, t) => sum + Number(t.nominal), 0);
      const visits = pTransactions.length;
      return { p, revenue, visits };
    })
    .filter(item => item.revenue > 0 || item.visits > 0)
    .sort((a, b) => b.revenue - a.revenue);

    const totalFilteredRev = contributionData.reduce((sum, item) => sum + item.revenue, 0);

    autoTable(doc, {
      startY: 40,
      head: [['Rank', 'Nama Petugas', 'Total Kunjungan', 'Total Revenue', '% Kontribusi']],
      body: contributionData.map((item, idx) => [
        idx + 1,
        item.p.toUpperCase(),
        item.visits,
        `Rp ${item.revenue.toLocaleString('id-ID')}`,
        `${totalFilteredRev > 0 ? ((item.revenue / totalFilteredRev) * 100).toFixed(1) : '0'}%`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'center' }
      },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "normal");
        doc.text(`Halaman ${pageCount}`, data.settings.margin.left, pageHeight - 10);
        
        doc.setFont("courier", "bold");
        doc.setTextColor(245, 158, 11);
        const footerText = "POWERED BY GUIDE";
        const textWidth = doc.getTextWidth(footerText);
        doc.text(footerText, (pageWidth / 2) - (textWidth / 2), pageHeight - 10);
      }
    });

    doc.save(filename);
    setIsPrintModalOpen(false);
  };

  const waStats = useMemo(() => {
    let combined = [];
    if (filter.campaign === 'ALL' || filter.campaign === 'A') combined.push(...waHistory);
    if (filter.campaign === 'ALL' || filter.campaign === 'B') combined.push(...waHistoryCBG);

    const filteredWA = combined.filter(h => {
      const date = h.sentAt ? new Date(h.sentAt).toISOString().split('T')[0] : '';
      const matchStart = !filter.startDate || date >= filter.startDate;
      const matchEnd = !filter.endDate || date <= filter.endDate;
      return matchStart && matchEnd;
    });

    const sentCount = filteredWA.filter(h => h.status === 'Sudah Dikirim').length;
    const noWaCount = filteredWA.filter(h => h.status === 'Tidak Ada WA').length;

    return {
      sent: sentCount,
      noWa: noWaCount,
      total: filteredWA.length
    };
  }, [waHistory, waHistoryCBG, filter.campaign, filter.startDate, filter.endDate]);

  return (
    <div className="space-y-8 pb-20">
      {/* Dynamic Header */}
      <div className={`flex ${isMobile ? 'flex-col' : 'lg:flex-row'} justify-between items-start lg:items-center gap-6`}>
        <div>
          <h2 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-black text-main-text italic tracking-tighter uppercase leading-none`}>
            {isAdmin ? 'Dashboard Eksekutif' : 'Pusat Performa Saya'}
          </h2>
          <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.4em] mt-2">
            Monitoring Performa Global 2026
          </p>
        </div>

        <div className={`flex flex-wrap items-center gap-3 w-full ${isMobile ? 'justify-between' : 'lg:w-auto lg:flex-nowrap'}`}>
                {/* Dashboard Quick Filters */}
                <div className={`flex ${isMobile ? 'flex-col w-full gap-2' : 'items-center'} bg-white/5 p-1.5 rounded-2xl border border-warning/10 backdrop-blur-md shadow-lg shadow-black/20`}>
                   <div className="flex items-center flex-wrap md:flex-nowrap">
                     <div className="flex items-center group">
                        <Filter size={12} className="text-blue-500 ml-2 mr-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <select 
                            value={filter.campaign} 
                            onChange={(e) => setFilter(p => ({ ...p, campaign: e.target.value }))}
                            className="select select-xs bg-transparent border-none text-[9px] font-black uppercase tracking-widest focus:ring-0 focus:outline-none w-28 md:w-32 text-blue-400"
                        >
                            <option value="ALL" className="bg-slate-900">SEMUA KAMPANYE</option>
                            <option value="A" className="bg-slate-900">KAMPANYE A (CC)</option>
                            <option value="B" className="bg-slate-900">KAMPANYE B (SDM)</option>
                        </select>
                     </div>
                     <div className="w-px h-4 bg-warning/20 my-auto mx-1 hidden md:block" />
                     <select 
                        value={filter.kat} 
                        onChange={(e) => setFilter(p => ({ ...p, kat: e.target.value }))}
                        className="select select-xs bg-transparent border-none text-[9px] font-black uppercase tracking-widest focus:ring-0 focus:outline-none w-28 md:w-28"
                     >
                        <option value="" className="bg-slate-900">SEMUA KATEGORI</option>
                        {kategori.map(k => <option key={k.nama} value={k.nama} className="bg-slate-900">{k.nama}</option>)}
                     </select>
                     <div className="w-px h-4 bg-warning/20 my-auto mx-1 hidden md:block" />
                     <select 
                        value={filter.pet} 
                        onChange={(e) => setFilter(p => ({ ...p, pet: e.target.value }))}
                        className="select select-xs bg-transparent border-none text-[9px] font-black uppercase tracking-widest focus:ring-0 focus:outline-none w-28 md:w-28"
                     >
                        <option value="" className="bg-slate-900">SEMUA PETUGAS</option>
                        {petugasList.map(p => <option key={p} value={p} className="bg-slate-900">{p}</option>)}
                     </select>
                   </div>
                   
                   {!isMobile && <div className="w-px h-4 bg-warning/20 my-auto mx-1" />}
                   
                   <div className={`flex items-center ${isMobile ? 'bg-black/20 p-2 rounded-xl justify-between' : ''}`}>
                     <input 
                        type="date"
                        value={filter.startDate}
                        onChange={(e) => setFilter(p => ({ ...p, startDate: e.target.value }))}
                        className="bg-transparent border-none text-[9px] font-black uppercase tracking-tighter focus:ring-0 focus:outline-none w-24 px-1"
                        title="Start Date"
                     />
                     <span className="opacity-20 self-center text-[9px]">-</span>
                     <input 
                        type="date"
                        value={filter.endDate}
                        onChange={(e) => setFilter(p => ({ ...p, endDate: e.target.value }))}
                        className="bg-transparent border-none text-[9px] font-black uppercase tracking-tighter focus:ring-0 focus:outline-none w-24 px-1"
                        title="End Date"
                     />
                     {(filter.kat || filter.pet || filter.startDate || filter.endDate || filter.campaign !== 'ALL') && (
                       <button onClick={() => setFilter({ kat: '', pet: '', startDate: '', endDate: '', campaign: 'ALL' })} className="ml-2 text-rose-500 hover:scale-110 transition-transform p-1 hover:bg-rose-500/10 rounded-full">
                          <XCircle size={14} />
                       </button>
                     )}
                   </div>
                </div>

          <div className={`flex gap-2 w-full ${isMobile ? 'justify-stretch' : 'lg:w-auto xl:ml-auto'}`}>
            <button 
              onClick={handleAiAnalysis}
              disabled={aiLoading}
              className={`btn ${isMobile ? 'flex-1' : 'btn-md'} bg-gradient-to-r from-indigo-600 to-purple-600 border-none text-white font-black italic tracking-tighter rounded-xl group hover:scale-105 transition-all shadow-xl shadow-indigo-500/20`}
            >
              {aiLoading ? <span className="loading loading-spinner loading-xs"></span> : <Sparkles size={18} className="group-hover:rotate-12 transition-transform" /> }
              ANALISA AI
            </button>
            <button 
              onClick={() => setIsPrintModalOpen(true)}
              className={`btn ${isMobile ? 'flex-1' : 'btn-md'} bg-red-600 hover:bg-red-700 border-none text-white font-black tracking-tighter rounded-xl shadow-xl shadow-red-500/20`}
            >
              <FileText size={18} /> {isMobile ? 'PDF' : 'UNDUH LAPORAN'}
            </button>
          </div>
        </div>
      </div>

      {/* AI Insight Box */}
      <AnimatePresence>
        {aiInsight && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-[2rem] border-l-8 border-purple-500 overflow-hidden bg-purple-500/5"
          >
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="text-purple-400" size={20} />
                </div>
                <h3 className="text-lg font-black text-white italic tracking-tighter uppercase">Rekomendasi Strategis AI</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {aiInsight.insights.map((ins, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-black/20 border border-white/5 group hover:bg-purple-500/10 transition-colors">
                    <span className="text-purple-400 font-black text-2xl opacity-40 italic">0{i+1}</span>
                    <p className="text-sm text-white/80 leading-relaxed">{ins}</p>
                  </div>
                ))}
              </div>
              <div className="bg-purple-500/20 p-4 rounded-2xl border border-purple-500/30 flex items-start gap-3">
                <TrendingUp size={20} className="text-purple-400 flex-shrink-0 mt-1" />
                <p className="text-sm font-bold text-white italic">{aiInsight.recommendation}</p>
              </div>
              <button 
                onClick={() => setAiInsight(null)}
                className="mt-6 text-[10px] font-black opacity-30 uppercase tracking-widest hover:opacity-100 transition-opacity"
              >
                Tutup Analisa
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Analytics Section */}
      <div className={`grid grid-cols-1 ${isMobile ? '' : 'xl:grid-cols-3'} gap-8`}>
        
        {/* Main Chart Container */}
        <div className={`${isMobile ? '' : 'xl:col-span-2'} space-y-8 overflow-hidden`}>
          {/* Summary Mini Cards */}
          <div className={`grid grid-cols-1 ${isMobile ? '' : 'sm:grid-cols-2 lg:grid-cols-4'} gap-4`}>
            <div className={`glass p-4 rounded-[1.5rem] border-l-8 ${isRevAchieved ? 'border-emerald-500' : 'border-amber-500'} bg-black/20 shadow-xl group hover:bg-emerald-500/5 transition-colors`}>
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-white/5 rounded-xl"><Wallet className="opacity-40" size={16} /></div>
              </div>
              <p className="text-[9px] font-black tracking-widest opacity-40 uppercase leading-none mb-1">Revenue</p>
              <h4 className="text-xl font-black text-main-text italic tracking-tighter leading-none mb-2">Rp {totalRev.toLocaleString()}</h4>
              <div className="flex items-center gap-2">
                 <progress className={`progress h-1 flex-grow ${isRevAchieved ? 'progress-success' : 'progress-warning'}`} value={targetRev > 0 ? (totalRev/targetRev)*100 : 0} max="100"></progress>
                 <span className="text-[9px] font-mono font-bold">{targetRev > 0 ? ((totalRev/targetRev)*100).toFixed(0) : '0'}%</span>
              </div>
            </div>

            <div className={`glass p-4 rounded-[1.5rem] border-l-8 ${isVisAchieved ? 'border-blue-500' : 'border-indigo-500'} bg-black/20 shadow-xl`}>
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-white/5 rounded-xl"><Users className="opacity-40" size={16} /></div>
              </div>
              <p className="text-[9px] font-black tracking-widest opacity-40 uppercase leading-none mb-1">Visits</p>
              <h4 className="text-xl font-black text-main-text italic tracking-tighter leading-none mb-2">{totalVis} <span className="text-[10px] opacity-40 uppercase font-bold tracking-widest">VISITS</span></h4>
              <div className="flex items-center gap-2">
                 <progress className="progress h-1 flex-grow progress-info" value={targetVis > 0 ? (totalVis/targetVis)*100 : 0} max="100"></progress>
                 <span className="text-[9px] font-mono font-bold">{targetVis > 0 ? ((totalVis/targetVis)*100).toFixed(0) : '0'}%</span>
              </div>
            </div>

            <div className={`glass p-4 rounded-[1.5rem] border-l-8 border-emerald-500 bg-black/20 shadow-xl`}>
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-white/5 rounded-xl"><CheckCircle className="opacity-40" size={16} /></div>
              </div>
              <p className="text-[9px] font-black tracking-widest opacity-40 uppercase leading-none mb-1">WA Terkirim</p>
              <h4 className="text-xl font-black text-(--text-color) italic tracking-tighter leading-none mb-2">{waStats.sent} <span className="text-[10px] opacity-40 uppercase font-bold tracking-widest">SENT</span></h4>
              <p className="text-[8px] font-bold opacity-30 uppercase">{filter.campaign === 'ALL' ? 'CC + SDM' : `MODUL ${filter.campaign}`}</p>
            </div>

            <div className={`glass p-4 rounded-[1.5rem] border-l-8 border-rose-500 bg-black/20 shadow-xl`}>
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 bg-white/5 rounded-xl"><XCircle className="opacity-40" size={16} /></div>
              </div>
              <p className="text-[9px] font-black tracking-widest opacity-40 uppercase leading-none mb-1">Tidak Ada WA</p>
              <h4 className="text-xl font-black text-(--text-color) italic tracking-tighter leading-none mb-2">{waStats.noWa} <span className="text-[10px] opacity-40 uppercase font-bold tracking-widest">KASUS</span></h4>
              <p className="text-[8px] font-bold opacity-30 uppercase tracking-widest">Gagal menjangkau</p>
            </div>
          </div>

          {/* Main Line Chart & Weekly Summary */}
          <div className="space-y-6">
            <div className={`glass p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-black/10 border border-white/5 shadow-2xl overflow-hidden relative`}>
              <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp size={120} /></div>
              <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <h3 className="text-xs font-black opacity-50 uppercase tracking-[0.3em] flex items-center gap-2">
                   <ChartLine size={16} className="text-amber-400" /> Tren Aktivitas Harian
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-amber-400"></div><span className="text-[8px] md:text-[9px] font-black uppercase opacity-40">Rev</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-400"></div><span className="text-[8px] md:text-[9px] font-black uppercase opacity-40">Vis</span></div>
                </div>
              </div>
              <div className={`${isMobile ? 'h-[200px]' : 'h-[250px]'} w-full`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                    <XAxis dataKey="name" stroke="currentColor" opacity={0.3} fontSize={isMobile ? 8 : 10} fontWeight="bold" axisLine={false} tickLine={false} dy={10} />
                    <YAxis stroke="currentColor" opacity={0.3} fontSize={isMobile ? 8 : 10} fontWeight="bold" axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(2, 6, 23, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                      itemStyle={{ fontWeight: 'bold' }}
                      labelStyle={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontSize: '10px', fontWeight: 'black', marginBottom: '8px' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#fbbf24" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="visits" stroke="#3b82f6" strokeWidth={3} fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Comparison Grid */}
            <div className="overflow-hidden">
              <div className={`flex flex-col md:flex-row items-center justify-between mb-4 px-2 gap-4`}>
                <h3 className="text-[9px] md:text-[10px] font-black opacity-40 uppercase tracking-[0.4em] flex items-center gap-2">
                  <Calendar size={14} className="text-blue-400" /> Ringkasan Performa Mingguan 
                  <span className="text-blue-400 font-bold ml-1 md:ml-2">({weekViewDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })})</span>
                </h3>
                <div className="flex gap-1 md:gap-2">
                   <button 
                    onClick={() => changeWeekMonth(-1)}
                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-blue-500/20 flex items-center justify-center border border-warning/10 transition-all"
                   >
                     <LayoutGrid size={14} className="text-blue-400 -rotate-180" />
                   </button>
                   <button 
                    onClick={() => setWeekViewDate(new Date())}
                    className="px-2 md:px-3 h-8 rounded-xl bg-white/5 hover:bg-blue-500/20 flex items-center justify-center border border-warning/10 transition-all text-[8px] md:text-[9px] font-black uppercase tracking-widest text-blue-400"
                   >
                     Bulan Ini
                   </button>
                   <button 
                    onClick={() => changeWeekMonth(1)}
                    className="w-8 h-8 rounded-xl bg-white/5 hover:bg-blue-500/20 flex items-center justify-center border border-warning/10 transition-all"
                   >
                     <LayoutGrid size={14} className="text-blue-400" />
                   </button>
                </div>
              </div>
              <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-4`}>
                {weeklyData.map((w, i) => (
                  <motion.div 
                    key={w.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setSelectedWeek(w)}
                    className="glass p-4 rounded-3xl border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 cursor-pointer transition-all group relative overflow-hidden"
                  >
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Calendar size={60} />
                    </div>
                    <p className="text-[9px] font-black text-blue-400 uppercase mb-2">{w.name}</p>
                    <h4 className="text-sm font-black text-(--text-color) font-mono leading-none mb-1">Rp {w.revenue.toLocaleString()}</h4>
                    <p className="text-[9px] font-bold opacity-30 text-(--text-color) uppercase">{w.visits} Visit</p>
                    <div className="mt-3 flex justify-end">
                      <div className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <TrendingUp size={10} className="text-(--text-color)" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Detail Modal */}
        <AnimatePresence>
          {selectedWeek && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="glass w-full max-w-2xl rounded-[3rem] overflow-hidden border border-white/10 shadow-3xl bg-[#0f172a]/95 p-8"
              >
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-(--text-color) italic uppercase tracking-tighter leading-none">Detail <span className="text-blue-400">{selectedWeek.name}</span></h3>
                    <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-2">{new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</p>
                  </div>
                  <button onClick={() => setSelectedWeek(null)} className="btn btn-sm btn-circle glass border-white/10 text-(--text-color) hover:bg-red-500 hover:text-white transition-colors">
                    <XCircle size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5 shadow-inner text-center">
                    <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-2">Total Mingguan</p>
                    <h4 className="text-3xl font-black text-emerald-400 font-mono italic">Rp {selectedWeek.revenue.toLocaleString()}</h4>
                  </div>
                  <div className="bg-white/5 p-6 rounded-3xl border border-white/5 shadow-inner text-center">
                    <p className="text-[9px] font-black opacity-30 uppercase tracking-widest mb-2">Total Kunjungan</p>
                    <h4 className="text-3xl font-black text-white font-mono">{selectedWeek.visits} <span className="text-xs opacity-40 uppercase not-italic">Visit</span></h4>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-white/40 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                    <Users size={14} className="text-amber-400" /> Kontribusi Petugas (Reminder)
                  </h4>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedWeek.petugasBreakdown.map((p, idx) => (
                      <div key={p.petugas} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center font-black text-blue-400 text-xs italic">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-black text-white uppercase tracking-tight">{p.petugas}</p>
                            <p className="text-[10px] font-bold text-white/30 uppercase">{p.visits} Transaksi Sukses</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-emerald-400 font-mono italic">Rp {p.revenue.toLocaleString()}</p>
                          <p className="text-[9px] font-bold text-amber-500/40 uppercase">Top Contributor</p>
                        </div>
                      </div>
                    ))}
                    {selectedWeek.petugasBreakdown.length === 0 && (
                      <p className="text-center py-10 opacity-20 font-black uppercase italic tracking-widest">Tidak ada aktivitas petugas...</p>
                    )}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.5em]">Prodia Depok Performance Monitor 2026</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Leaderboard Section (Gamification) */}
        <div className="space-y-6">
          <div className={`glass p-4 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-indigo-950/20 border-t-8 border-amber-400 shadow-2xl h-full`}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-amber-400/20 rounded-xl flex items-center justify-center">
                <Medal className="text-amber-400" size={24} />
              </div>
              <h3 className="text-lg md:text-xl font-black text-(--text-color) italic tracking-tighter uppercase leading-none">Papan <span className="text-amber-400">Peringkat</span></h3>
            </div>
            
            <div className="space-y-3 md:space-y-4">
              {petugasList
                .map(p => {
                  const pTrs = filteredData.filter(t => t.petugas === p);
                  return { 
                    nama: p, 
                    rev: pTrs.reduce((s, t) => s + (Number(t.nominal) || 0), 0),
                    vis: Number(pTrs.length) || 0
                  };
                })
                .filter(p => p.rev > 0 || p.vis > 0)
                .sort((a, b) => b.rev - a.rev)
                .slice(0, 5)
                .map((p, i) => (
                  <motion.div 
                    key={p.nama} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl md:rounded-3xl group transition-all relative overflow-hidden ${i === 0 ? 'bg-amber-400/10 border border-amber-400/20' : 'bg-black/20 hover:bg-white/5'}`}
                  >
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center font-black italic text-xs md:text-base ${i === 0 ? 'bg-amber-400 text-black' : 'bg-white/5 opacity-40 text-(--text-color)'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className={`font-black uppercase tracking-tight truncate ${i === 0 ? 'text-amber-400' : 'text-(--text-color)'}`}>{p.nama}</p>
                      <div className="flex items-center gap-2 md:gap-3">
                        <p className="text-[10px] md:text-[11px] font-bold text-emerald-400 font-mono italic">Rp {p.rev.toLocaleString()}</p>
                        <span className="text-[9px] opacity-10 text-(--text-color)">|</span>
                        <p className="text-[9px] md:text-[10px] font-bold opacity-40 text-(--text-color) uppercase truncate">{p.vis} Visit</p>
                      </div>
                    </div>
                    {i === 0 && <Sparkles size={14} className="text-amber-400 absolute top-2 right-2 animate-pulse" />}
                  </motion.div>
                ))}
            </div>
            
            <div className="mt-10 p-4 border border-white/5 rounded-2xl bg-black/40">
              <p className="text-[9px] font-black opacity-30 uppercase tracking-[0.3em] mb-4 text-center">Rekap Kategori Populer</p>
              <div className="space-y-3">
                {kategori.slice(0, 3).map(k => {
                  const trK = transaksi.filter(t => t.kategori === k.nama);
                  return (
                    <div key={k.nama} className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-white/60 lowercase italic">#{k.nama}</span>
                      <span className="text-[10px] font-black text-amber-500 font-mono">{trK.length} Visit</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`glass p-4 md:p-8 rounded-[1.5rem] md:rounded-[3rem] border border-white/5 bg-black/10 shadow-3xl`}>
         <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-warning/10 pb-8`}>
            <h3 className="text-base md:text-lg font-black text-(--text-color) uppercase italic tracking-tighter flex items-center gap-3">
               <Calendar size={20} className="text-amber-400" /> Detail Database <span className="opacity-20">/ Filtering</span>
            </h3>
             <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
                <select 
                  value={filter.kat} 
                  onChange={(e) => setFilter(prev => ({ ...prev, kat: e.target.value }))}
                  className="select select-xs sm:select-sm custom-select flex-1 md:w-36 h-8 md:h-10 rounded-xl"
                >
                  <option value="">Kategori: All</option>
                  {kategori.map(k => <option key={k.nama} value={k.nama}>{k.nama}</option>)}
                </select>
                
                <select 
                  value={filter.pet} 
                  onChange={(e) => setFilter(prev => ({ ...prev, pet: e.target.value }))}
                  className="select select-xs sm:select-sm custom-select flex-1 md:w-36 h-8 md:h-10 rounded-xl"
                >
                  <option value="">Petugas: All</option>
                  {petugasList.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <div className={`flex items-center gap-2 ${isMobile ? 'w-full bg-black/10 p-2 rounded-xl justify-center' : ''}`}>
                  <input 
                    type="date" 
                    value={filter.startDate} 
                    onChange={(e) => setFilter(prev => ({ ...prev, startDate: e.target.value }))}
                    className="input input-xs md:input-sm custom-select w-28 md:w-32 h-8 md:h-10 rounded-xl text-[9px] md:text-[10px]"
                    title="Start Date"
                  />
                  <span className="opacity-20">-</span>
                  <input 
                    type="date" 
                    value={filter.endDate} 
                    onChange={(e) => setFilter(prev => ({ ...prev, endDate: e.target.value }))}
                    className="input input-xs md:input-sm custom-select w-28 md:w-32 h-8 md:h-10 rounded-xl text-[9px] md:text-[10px]"
                    title="End Date"
                  />
                  <button onClick={() => setFilter({ kat: '', pet: '', startDate: '', endDate: '' })} className="btn btn-xs md:btn-sm btn-circle glass text-(--text-color) hover:text-red-400"><XCircle size={14} /></button>
                </div>
            </div>
         </div>

          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12`}>
            {kategori.map((k, idx) => {
              const trK = filteredData.filter(t => t.kategori === k.nama);
              const rRev = trK.reduce((s, t) => s + (Number(t.nominal) || 0), 0);
              const pct = (Number(k.targetRevenue) || 0) > 0 ? (rRev / (Number(k.targetRevenue) || 0)) * 100 : 0;
              return (
                <motion.div 
                  key={k.nama} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setFilter(p => ({ ...p, kat: p.kat === k.nama ? '' : k.nama }))}
                  transition={{ delay: idx * 0.05 }}
                  className={`glass p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border transition-all cursor-pointer group bg-black/20 ${filter.kat === k.nama ? 'border-amber-400 ring-4 ring-amber-400/20' : 'border-white/5 hover:border-amber-400/30'}`}
                >
                  <div className="flex justify-between items-center mb-4 md:mb-6">
                    <h4 className="text-[10px] md:text-xs font-black text-(--text-color) uppercase tracking-widest truncate max-w-[70%]">{k.nama}</h4>
                    <span className="text-[9px] md:text-[10px] font-black text-amber-400 font-mono">{Number(pct).toFixed(0)}%</span>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${Math.min(Number(pct) || 0, 100)}%` }} 
                        className={`h-full ${(Number(pct) || 0) >= 100 ? 'bg-emerald-500' : 'bg-amber-400'} shadow-[0_0_10px_rgba(245,158,11,0.3)]`}
                       />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[8px] md:text-[10px] opacity-40 font-bold uppercase">Achievement</p>
                      <p className="text-[10px] md:text-[11px] font-black text-(--text-color) italic truncate ml-2">Rp {Number(rRev).toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-center opacity-40">
                      <p className="text-[8px] md:text-[9px] font-bold uppercase">Volume</p>
                      <p className="text-[9px] md:text-[10px] font-black text-(--text-color) uppercase tracking-tighter ml-2">{Number(trK.length) || 0} Visit</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
         </div>

         {/* Achievement Table Restoration */}
         <div>
            <div className="flex items-center gap-3 mb-6">
               <TrendingUp size={18} className="text-amber-400" />
               <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">Pencapaian Per Kategori</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="table w-full bg-black/20 rounded-[2rem] overflow-hidden">
                <thead>
                  <tr className="border-b border-warning/10">
                    <th className="bg-transparent text-[10px] font-black opacity-30 uppercase tracking-widest text-(--text-color)">Kategori</th>
                    <th className="bg-transparent text-[10px] font-black opacity-30 uppercase tracking-widest text-(--text-color) text-right">Realisasi</th>
                    <th className="bg-transparent text-[10px] font-black opacity-30 uppercase tracking-widest text-(--text-color) text-right">Target</th>
                    <th className="bg-transparent text-[10px] font-black opacity-30 uppercase tracking-widest text-(--text-color) text-right">Visit</th>
                    <th className="bg-transparent text-[10px] font-black opacity-30 uppercase tracking-widest text-(--text-color) text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {kategori.map((k) => {
                    const trK = filteredData.filter(t => t.kategori === k.nama);
                    const rRev = trK.reduce((s, t) => s + (Number(t.nominal) || 0), 0);
                    const kTarget = Number(k.targetRevenue) || 0;
                    const isAccAchieved = rRev >= kTarget;
                    return (
                      <tr 
                        key={k.nama} 
                        className={`border-b border-warning/10 hover:bg-white/5 transition-colors cursor-pointer ${filter.kat === k.nama ? 'bg-amber-400/5' : ''}`}
                        onClick={() => setFilter(prev => ({ ...prev, kat: prev.kat === k.nama ? '' : k.nama }))}
                      >
                        <td><span className="text-[11px] font-black text-(--text-color) uppercase tracking-tighter">{k.nama}</span></td>
                        <td className="text-right"><span className="text-[11px] font-mono font-bold text-emerald-400">Rp {(Number(rRev) || 0).toLocaleString()}</span></td>
                        <td className="text-right"><span className="text-[11px] font-mono font-bold opacity-40 text-(--text-color)">Rp {kTarget.toLocaleString()}</span></td>
                        <td className="text-right"><span className="text-[11px] font-black text-(--text-color)">{Number(trK.length) || 0}</span></td>
                        <td className="text-center">
                          <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${isAccAchieved && kTarget > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {isAccAchieved && kTarget > 0 ? 'DONE' : 'TIDAK'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
         </div>
      </div>

      {isPrintModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box glass border border-white/10 p-10 rounded-[3rem] shadow-3xl bg-[#020617]/95">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-red-600/20 rounded-2xl flex items-center justify-center">
                <FileText className="text-red-500" size={24} />
              </div>
              <h3 className="font-black text-2xl uppercase italic tracking-tighter text-white">Export <span className="text-red-500">Analytics</span></h3>
            </div>
            
            <div className="space-y-6">
              <div className="form-control">
                <label className="label"><span className="label-text text-[10px] font-black opacity-30 uppercase tracking-widest">Kategori Data</span></label>
                <select 
                  className="select select-bordered custom-select h-12 text-sm"
                  value={printFilter.kat}
                  onChange={(e) => setPrintFilter(p => ({ ...p, kat: e.target.value }))}
                >
                  <option value="ALL">Semua Kategori</option>
                  {kategori.map(k => <option key={k.nama} value={k.nama}>{k.nama}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-[10px] font-black opacity-30 uppercase tracking-widest">Rincian Petugas</span></label>
                <select 
                  className="select select-bordered custom-select h-12 text-sm"
                  value={printFilter.pet}
                  onChange={(e) => setPrintFilter(p => ({ ...p, pet: e.target.value }))}
                >
                  <option value="ALL">Semua Petugas</option>
                  {petugasList.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text text-[10px] font-black opacity-30 uppercase tracking-widest">Rentang Waktu</span></label>
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="date" 
                    className="input input-bordered custom-select h-12 text-xs"
                    value={printFilter.start}
                    onChange={(e) => setPrintFilter(p => ({ ...p, start: e.target.value }))}
                  />
                  <input 
                    type="date" 
                    className="input input-bordered custom-select h-12 text-xs"
                    value={printFilter.end}
                    onChange={(e) => setPrintFilter(p => ({ ...p, end: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <div className="modal-action gap-4 mt-12 border-t border-white/5 pt-8">
              <button onClick={() => setIsPrintModalOpen(false)} className="btn btn-ghost uppercase font-black opacity-30 text-xs tracking-widest">Batal</button>
              <button 
                onClick={exportProdigyPDF} 
                className="btn bg-red-600 hover:bg-red-700 border-none text-white font-black tracking-tighter text-sm italic px-8 h-12 shadow-xl shadow-red-500/20"
              >
                GENERATE PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
