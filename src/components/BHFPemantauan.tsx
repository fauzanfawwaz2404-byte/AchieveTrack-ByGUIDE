import React, { useState, useMemo } from 'react';
import { ChartLine, FileText, Download, Filter, Calendar, Users, Target, Activity, Trash2, PieChart as PieChartIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BHFUpaya, BHFMember } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BHFPemantauanProps {
  data: BHFUpaya[];
  groups: string[];
  members: BHFMember[];
  onSave?: (data: BHFUpaya) => void;
  onDelete?: (id: string) => void;
  userEmail?: string | null;
}

export default function BHFPemantauan({ data, groups, members, onSave, onDelete, userEmail }: BHFPemantauanProps) {
  const isFauzan = userEmail?.toLowerCase() === 'fauzanfawwaz2404@gmail.com';
  
  const [filter, setFilter] = useState({
    startDate: '',
    endDate: '',
    kelompok: ''
  });

  const [editingItem, setEditingItem] = useState<BHFUpaya | null>(null);
  const [exportMode, setExportMode] = useState<'ALL' | 'KELOMPOK' | 'DATE' | 'STATUS'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#a855f7', '#ec4899', '#6366f1'];

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGT', 'SEP', 'OKT', 'NOV', 'DES'];
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const monthIdx = parseInt(m) - 1;
    return `${d}-${months[monthIdx] || m}-${y}`;
  };

  const filteredData = useMemo(() => {
    return (data || []).filter(item => {
      // If in STATUS mode, use the kelompok filter as status selector
      const matchKelompok = exportMode === 'STATUS' ? true : (!filter.kelompok || item.kelompok === filter.kelompok);
      const matchStatus = exportMode === 'STATUS' ? ((item.status || 'PLAN') === (filter.kelompok || 'PLAN')) : true;
      const matchStart = !filter.startDate || item.tanggal >= filter.startDate;
      const matchEnd = !filter.endDate || item.tanggal <= filter.endDate;
      return matchKelompok && matchStatus && matchStart && matchEnd;
    });
  }, [data, filter, exportMode]);

  const searchedData = useMemo(() => {
    if (!searchTerm) return filteredData;
    const term = searchTerm.toLowerCase();
    return filteredData.filter(item => 
      (item.kelompok || '').toLowerCase().includes(term) ||
      (item.jenisUpaya || '').toLowerCase().includes(term) ||
      (item.keterangan || '').toLowerCase().includes(term) ||
      (item.tanggal || '').toLowerCase().includes(term) ||
      (item.status || 'PLAN').toLowerCase().includes(term)
    );
  }, [filteredData, searchTerm]);

  const stats = useMemo(() => {
    const totalQty = filteredData.reduce((sum, item) => sum + (item.jumlah || 0), 0);
    const totalActivities = filteredData.length;
    
    const byGroup = (groups || []).map(g => {
      const groupData = (filteredData || []).filter(d => d && d.kelompok === g);
      const groupTypeStats = Array.from(new Set((data || []).map(d => d.jenisUpaya))).map(t => ({
        type: t,
        val: groupData.filter(d => d.jenisUpaya === t).reduce((s, i) => s + (i.jumlah || 0), 0)
      })).filter(t => t.val > 0);

      return {
        name: g || '-',
        value: groupData.reduce((s, i) => s + (i.jumlah || 0), 0) || 0,
        count: groupData.length || 0,
        topAction: Array.from(new Set(groupData.map(d => d.jenisUpaya))).sort((a,b) => 
          groupData.filter(d => d.jenisUpaya === b).length - groupData.filter(d => d.jenisUpaya === a).length
        )[0] || '-',
        typeStats: groupTypeStats
      };
    });

    const byType = Array.from(new Set((data || []).map(d => d && d.jenisUpaya))).map(t => ({
      name: t || '-',
      value: (filteredData || []).filter(d => d && d.jenisUpaya === t).reduce((s, i) => s + (i.jumlah || 0), 0) || 0
    })).filter(t => t.value > 0);

    const sortedGroups = [...byGroup].sort((a, b) => b.value - a.value);
    const sortedTypes = [...byType].sort((a, b) => b.value - a.value);

    return { totalQty, totalActivities, byGroup, byType, sortedGroups, sortedTypes };
  }, [filteredData, data, groups]);

  const handleUpdate = () => {
    if (editingItem && onSave) {
      onSave(editingItem);
      setEditingItem(null);
    }
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      const today = new Date().toLocaleDateString('id-ID');
      const nowTime = new Date().toLocaleTimeString('id-ID');
      
      // Determine what to export based on mode
      let pdfData = filteredData;
      let subTitle = '';
      
      if (exportMode === 'KELOMPOK') {
        if (!filter.kelompok) {
          alert('Pilih Kelompok terlebih dahulu untuk mode "By Kelompok"');
          return;
        }
        pdfData = data.filter(d => d.kelompok === filter.kelompok);
        subTitle = `LAPORAN KHUSUS KELOMPOK: ${filter.kelompok}`;
      } else if (exportMode === 'DATE') {
        if (!filter.startDate || !filter.endDate) {
          alert('Pilih Rentang Tanggal terlebih dahulu untuk mode "By Date"');
          return;
        }
        pdfData = data.filter(d => d.tanggal >= filter.startDate && d.tanggal <= filter.endDate);
        subTitle = `LAPORAN PERIODE TANGGAL: ${filter.startDate} s/d ${filter.endDate}`;
      } else if (exportMode === 'STATUS') {
        const selectedStatus = filter.kelompok || 'PLAN';
        pdfData = data.filter(d => (d.status || 'PLAN') === selectedStatus);
        subTitle = `LAPORAN BERDASARKAN STATUS: ${selectedStatus}`;
      } else {
        pdfData = data;
        subTitle = 'LAPORAN AKUMULASI SELURUH DATA (ALL)';
      }

      // Recalculate stats for PDF based on pdfData
      const pdfStats = {
        totalQty: pdfData.reduce((sum, item) => sum + (item.jumlah || 0), 0),
        totalActivities: pdfData.length,
        byGroup: (groups || []).map(g => ({
          name: g,
          val: pdfData.filter(d => d.kelompok === g).reduce((s, i) => s + (i.jumlah || 0), 0)
        })).sort((a,b) => b.val - a.val)
      };

      // blue Header Background
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 210, 32, 'F');
      
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 30, 210, 2, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('LAPORAN BHF / HKN', 105, 12, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);
      doc.text(subTitle, 105, 18, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('PRODIA DEPOK PERFORMANCE MONITOR 2026', 105, 24, { align: 'center' });
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(`Periode: ${filter.startDate || 'Awal'} - ${filter.endDate || 'Sekarang'} | Dicetak: ${today} ${nowTime}`, 105, 28, { align: 'center' });

      // 1. RINGKASAN & RINCIAN UPAYA (SIDE BY SIDE)
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('1. RINGKASAN CAPAIAN', 14, 38);
      
      // Summary Table (Metrik)
      autoTable(doc, {
          startY: 41,
          margin: { right: 115 },
          head: [['Parameter', 'Capaian']],
          body: [
              ['Total Volume', pdfStats.totalQty.toLocaleString()],
              ['Log Aktivitas', pdfStats.totalActivities.toString()],
              ['Grup Unggul', pdfStats.byGroup[0]?.name || 'N/A']
          ],
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246], fontSize: 7 },
          bodyStyles: { fontSize: 7 }
      });

      // Upaya Detail (Jenis Upaya)
      const upayaSummary = Array.from(new Set(pdfData.map(d => d.jenisUpaya))).map(t => ({
        name: t,
        value: pdfData.filter(d => d.jenisUpaya === t).reduce((s, i) => s + (i.jumlah || 0), 0)
      })).sort((a,b) => b.value - a.value);

      autoTable(doc, {
        startY: 41,
        margin: { left: 105 },
        head: [['Kotak Informasi Upaya', 'Capaian']],
        body: upayaSummary.map(s => [s.name, s.value.toLocaleString()]),
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], fontSize: 7 }, 
        bodyStyles: { fontSize: 7 }
      });

      // 2. Member Structure Section (Compact Multi-Column Row)
      let currentY = Math.max((doc as any).lastAutoTable?.finalY || 0, 41) + 10;
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('2. STRUKTUR KELOMPOK & RINGKASAN UPAYA', 14, currentY);
      currentY += 4;

      const cardWidth = 37;
      const cardHeight = 115; // Tall enough to show all activity types
      const gutter = 1.5;
      const startX = 14;
      
      let cardX = startX;
      let cardY = currentY;

      (groups || []).forEach((g) => {
        const x = cardX;
        const y = cardY;

        // Card Border
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'FD');

        // Card Header
        doc.setFillColor(15, 23, 42); 
        doc.rect(x, y, cardWidth, 6, 'F');
        
        doc.setFillColor(59, 130, 246);
        doc.circle(x + 3, y + 3, 1.2, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text(g.toUpperCase(), x + 6, y + 4);

        // Members List logic (Top 5 members)
        const groupMembers = (members || []).filter(m => m.kelompok === g).sort((a,b) => (b.isLeader ? 1 : 0) - (a.isLeader ? 1 : 0));
        const groupStats = pdfData.filter(d => d.kelompok === g);
        const groupActivities = Array.from(new Set(groupStats.map(d => d.jenisUpaya))).map(t => ({
          name: t,
          val: groupStats.filter(d => d.jenisUpaya === t).reduce((s, i) => s + (i.jumlah || 0), 0)
        })).sort((a,b) => b.val - a.val);

        let memberY = y + 10;
        doc.setFontSize(5.5);
        
        groupMembers.slice(0, 6).forEach((m, i) => {
          if (m.isLeader) {
            doc.setFillColor(239, 246, 255);
            doc.rect(x + 0.5, memberY + (i * 2.8) - 2.2, cardWidth - 1, 2.8, 'F');
            doc.setTextColor(37, 99, 235);
            doc.setFont('helvetica', 'bold');
            doc.text(`> ${m.nama}`, x + 2, memberY + (i * 2.8));
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(51, 65, 85);
          } else {
            doc.setTextColor(51, 65, 85);
            doc.text(`- ${m.nama}`, x + 2, memberY + (i * 2.8));
          }
        });

        // Upaya List inside card (ALL types)
        let statsY = y + 35;
        doc.setDrawColor(241, 245, 249);
        doc.line(x + 2, statsY - 2, x + cardWidth - 2, statsY - 2);
        
        doc.setFontSize(5.5);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text('UPAYA KELOMPOK:', x + 2, statsY);
        doc.setFont('helvetica', 'normal');
        
        groupActivities.forEach((s, i) => {
          const itemY = statsY + 3.5 + (i * 2.8);
          // Only clip if it really exceeds card height
          if (itemY < y + cardHeight - 3) {
            const label = String(s.name || 'Lainnya').substring(0, 18);
            doc.setTextColor(100, 116, 139);
            doc.text(`${label}:`, x + 2, itemY);
            doc.setTextColor(15, 23, 42);
            doc.text(s.val.toLocaleString(), x + cardWidth - 3, itemY, { align: 'right' });
          }
        });

        if (groupMembers.length === 0) {
          doc.setTextColor(148, 163, 184);
          doc.text('Belum ada data', x + (cardWidth/2), y + 25, { align: 'center' });
        }

        cardX += cardWidth + gutter;
      });

      // Update currentY
      currentY = cardY + cardHeight + 10;


      // 3. Activity Log (Always Start New Page)
      doc.addPage();
      currentY = 15;
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('3. LOG AKTIVITAS TERINCI', 14, currentY);

      const sortedPdfData = [...pdfData].sort((a, b) => (a.tanggal || '').localeCompare(b.tanggal || ''));
      
      const logBody = sortedPdfData.map(item => [
        formatDateIndo(item.tanggal),
        item.kelompok || '-',
        item.jenisUpaya || '-',
        (item.jumlah || 0).toString(),
        (item.status || 'PLAN') + (item.alasanBatal ? `\n(Batal: ${item.alasanBatal})` : ''),
        item.keterangan || '-'
      ]);

      autoTable(doc, {
        startY: currentY + 5,
        head: [['Tanggal', 'Kelompok', 'Upaya', 'Qty', 'Status', 'Keterangan']],
        body: logBody,
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85] },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
          4: { cellWidth: 35 },
          5: { cellWidth: 40 }
        }
      });

      // Footer
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`PRODIA DEPOK ACHIEVETRACK | POWERED BY GUIDE | HALAMAN ${i} / ${totalPages}`, 105, 285, { align: 'center' });
      }

      doc.save(`Laporan_BHF_${exportMode}_${Date.now()}.pdf`);
    } catch (error) {
      console.error('PDF Generation Failure:', error);
      alert('Pencetakan PDF Gagal. Silakan hubungi admin jika masalah berlanjut.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <div className="flex items-center gap-2 mb-1">
            <Activity size={16} className="text-blue-500" />
            <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest italic">Monitoring Live</span>
          </div>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">PEMANTAUAN <span className="text-blue-500">BHF / HKN</span></h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 glass px-4 py-2 rounded-2xl border border-white/5 h-10">
             <Calendar size={14} className="text-slate-500" />
             <input 
              type="date" 
              value={filter.startDate}
              onChange={(e) => setFilter(p => ({ ...p, startDate: e.target.value }))}
              className="bg-transparent border-none text-[10px] font-bold text-white focus:ring-0 w-24"
             />
             <span className="text-white/20 text-xs">-</span>
             <input 
              type="date" 
              value={filter.endDate}
              onChange={(e) => setFilter(p => ({ ...p, endDate: e.target.value }))}
              className="bg-transparent border-none text-[10px] font-bold text-white focus:ring-0 w-24"
             />
          </div>

          <div className="flex items-center bg-black/40 rounded-2xl p-1 border border-white/5">
            {(['ALL', 'KELOMPOK', 'DATE', 'STATUS'] as const).map(mode => (
              <button 
                key={mode}
                onClick={() => setExportMode(mode)}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black transition-all ${exportMode === mode ? 'bg-blue-500 text-black' : 'text-slate-400 hover:text-white'}`}
              >
                {mode}
              </button>
            ))}
          </div>

          <select 
            value={filter.kelompok}
            onChange={(e) => setFilter(p => ({ ...p, kelompok: e.target.value }))}
            className="select select-sm h-10 bg-black/40 border-white/5 rounded-2xl text-[10px] font-black uppercase"
          >
            <option value="">{exportMode === 'STATUS' ? 'SEMUANYA (PLAN)' : 'Pilih Kelompok'}</option>
            {exportMode === 'STATUS' ? (
              <>
                <option value="PLAN">PLAN</option>
                <option value="SELESAI">SELESAI</option>
                <option value="BATAL">BATAL</option>
              </>
            ) : (
              (groups || []).map(g => <option key={g} value={g}>{g}</option>)
            )}
          </select>

          <button 
            onClick={exportPDF}
            className="btn btn-sm h-10 bg-blue-500 hover:bg-blue-600 text-black border-none px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20"
          >
            <Download size={14} /> EXPORT LAPORAN
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div whileHover={{ scale: 1.02 }} className="glass p-6 rounded-[2.5rem] border border-white/5 bg-blue-500/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform">
            <Target size={60} />
          </div>
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 italic">Total Item Terhitung</p>
          <p className="text-4xl font-black text-white italic tracking-tighter">{(stats.totalQty || 0).toLocaleString()}</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="glass p-6 rounded-[2.5rem] border border-white/5 bg-emerald-500/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform">
            <Activity size={60} />
          </div>
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 italic">Total Kegiatan</p>
          <p className="text-4xl font-black text-white italic tracking-tighter">{(stats.totalActivities || 0)}</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="glass p-6 rounded-[2.5rem] border border-white/5 bg-amber-500/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform">
            <Users size={60} />
          </div>
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 italic">Kelompok Teraktif</p>
          <p className="text-xl font-black text-white italic tracking-tighter uppercase">
            {(stats.sortedGroups[0]?.value || 0) > 0 ? stats.sortedGroups[0].name : '-'}
          </p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="glass p-6 rounded-[2.5rem] border border-white/5 bg-rose-500/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform">
            <Activity size={60} />
          </div>
          <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1 italic">Jenis Upaya Terbanyak</p>
          <p className="text-xl font-black text-white italic tracking-tighter uppercase">
            {stats.sortedTypes[0]?.name || '-'}
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.byGroup.map((g, i) => (
          <div key={g.name} className="glass p-4 rounded-3xl border border-white/5 bg-black/20 relative overflow-hidden group/card shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10" style={{ color: colors[i % colors.length] }}>
                <Users size={14} />
              </div>
              <span className="text-[11px] font-black text-white uppercase italic">{g.name}</span>
            </div>
            <div className="space-y-1.5 relative z-10">
              <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 uppercase border-b border-white/5 pb-1 mb-1">
                <span>Rincian Jenis Upaya</span>
                <span className="text-white font-black">{g.value}</span>
              </div>
              <div className="max-h-[80px] overflow-y-auto custom-scrollbar space-y-1">
                {g.typeStats.map((ts, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-[8px] text-slate-400 uppercase italic truncate max-w-[70%]">{ts.type}</span>
                    <span className="text-[9px] text-amber-500 font-black">{ts.val}</span>
                  </div>
                ))}
                {g.typeStats.length === 0 && (
                  <p className="text-[8px] text-slate-600 italic">Belum ada data</p>
                )}
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 opacity-10 italic font-black text-4xl pointer-events-none" style={{ color: colors[i % colors.length] }}>
              {i + 1}
            </div>
          </div>
        ))}
      </div>

      <div className="glass rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">RINCIAN DATA <span className="text-blue-500">BHF</span></h3>
              <div className="flex bg-black/40 rounded-xl px-4 py-2 border border-white/5 items-center gap-2 w-full md:w-64 mt-2">
                 <Filter size={14} className="text-blue-500" />
                 <input 
                  type="text"
                  placeholder="Cari data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-bold text-white focus:ring-0 w-full placeholder:text-slate-600 uppercase"
                 />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
               {stats.byType.map((t, i) => (
                 <div key={i} className="flex items-center gap-2 glass px-3 py-1.5 rounded-full border border-white/5 bg-black/40">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }}></div>
                    <span className="text-[9px] font-black text-white uppercase tracking-wider">{t.name}</span>
                    <span className="text-[10px] font-black text-blue-500 ml-1">{t.value}</span>
                 </div>
               ))}
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr className="border-b border-white/5 bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <th className="px-8 h-14">Tanggal</th>
                <th>Kelompok</th>
                <th>Jenis Upaya</th>
                <th className="text-center">Jumlah</th>
                <th>Keterangan</th>
                {isFauzan && <th className="text-right px-8">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {searchedData.map((item) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group/row">
                  <td className="px-8 font-mono text-xs text-white/60">{formatDateIndo(item.tanggal)}</td>
                  <td>
                    <span className="text-[11px] font-black text-white uppercase italic">
                      {item.kelompok}
                    </span>
                  </td>
                  <td><span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full uppercase">{item.jenisUpaya}</span></td>
                  <td className="text-center font-mono font-black text-white">{item.jumlah}</td>
                  <td className="text-[10px] text-slate-500 italic max-w-xs truncate">{item.keterangan || '-'}</td>
                  {isFauzan && (
                    <td className="px-8 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingItem(item)} className="btn btn-square btn-xs glass text-blue-400 hover:bg-blue-500 hover:text-white border-white/5">
                          <Activity size={12} />
                        </button>
                        <button 
                          onClick={() => {
                            if (onDelete && window.confirm('Hapus data upaya ini?')) {
                              onDelete(item.id);
                            }
                          }} 
                          className="btn btn-square btn-xs glass text-red-400 hover:bg-red-500 hover:text-white border-white/5"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="glass p-8 rounded-[3rem] w-full max-w-lg border border-blue-500/20 bg-slate-900/95">
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-6">EDIT DATA UPAYA</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest ml-2">Jumlah</label>
                    <input 
                      type="number" 
                      value={editingItem.jumlah}
                      onChange={(e) => setEditingItem({...editingItem, jumlah: Number(e.target.value)})}
                      className="input input-bordered w-full bg-black/40 border-white/10 rounded-2xl text-white font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest ml-2">Tanggal</label>
                    <input 
                      type="date" 
                      value={editingItem.tanggal}
                      onChange={(e) => setEditingItem({...editingItem, tanggal: e.target.value})}
                      className="input input-bordered w-full bg-black/40 border-white/10 rounded-2xl text-white font-bold"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest ml-2">Keterangan</label>
                  <textarea 
                    value={editingItem.keterangan || ''}
                    onChange={(e) => setEditingItem({...editingItem, keterangan: e.target.value})}
                    className="textarea textarea-bordered w-full bg-black/40 border-white/10 rounded-2xl text-white font-bold h-24"
                  />
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setEditingItem(null)} className="btn btn-ghost flex-1 font-black text-white italic">BATAL</button>
                <button onClick={handleUpdate} className="btn bg-blue-500 hover:bg-blue-600 text-black border-none flex-[2] rounded-2xl font-black italic tracking-widest">
                   SIMPAN PERUBAHAN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-8 rounded-[3.5rem] border border-white/5 h-[400px] flex flex-col">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <ChartLine size={20} className="text-blue-500" />
             </div>
             <div>
               <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Performansi Kelompok</h3>
               <p className="text-[9px] font-bold text-slate-500 uppercase">Perbandingan jumlah upaya per kelompok</p>
             </div>
          </div>
          <div className="flex-grow">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={stats.byGroup}>
                 <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                 <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#ffffff40', fontSize: 9, fontWeight: 900 }} 
                  interval={0}
                 />
                 <YAxis hide />
                 <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: '#000000', border: '1px solid #ffffff10', borderRadius: '15px' }}
                  itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}
                 />
                 <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {stats.byGroup.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} fillOpacity={0.6} stroke={colors[index % colors.length]} strokeWidth={1} />
                    ))}
                 </Bar>
               </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-8 rounded-[3.5rem] border border-white/5 h-[400px] flex flex-col">
          <div className="flex items-center gap-3 mb-8">
             <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <PieChartIcon size={20} className="text-emerald-500" />
             </div>
             <div>
               <h3 className="text-sm font-black text-white uppercase italic tracking-widest">Komposisi Upaya</h3>
               <p className="text-[9px] font-bold text-slate-500 uppercase">Distribusi berdasarkan jenis kegiatan</p>
             </div>
          </div>
          <div className="flex-grow">
             <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.byType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {stats.byType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} fillOpacity={0.6} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000000', border: '1px solid #ffffff10', borderRadius: '15px' }}
                    itemStyle={{ color: '#ffffff', fontSize: '12px', fontWeight: 'bold' }}
                  />
                </PieChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
