import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, Calendar as CalendarIcon, LayoutDashboard, Search, 
  Cloud, Sun, CloudRain, CloudLightning,
  ChevronLeft, ChevronRight, FileText, Edit3, Trash2, 
  Eye, CheckCircle, Clock, Ban, Image as ImageIcon, 
  Download, Flame, X, Info, TrendingUp, Filter,
  ChevronsLeft, ChevronsRight, Camera, FileUp, List, MessageCircle, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { CalendarActivity } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MyCalendarProps {
  activities: CalendarActivity[];
  onSave: (activity: CalendarActivity) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  userEmail?: string | null;
  permissions?: { canAdd: boolean; canEdit: boolean; canDelete: boolean; isAdmin: boolean };
}

const CATEGORY_COLORS: Record<string, string> = { 
  'KUNJUNGAN': '#8b5cf6', 
  'STAND': '#3b82f6', 
  'HOME SERVICE': '#10b981', 
  'WA PERSONAL': '#25D366', 
  'TASK REQUEST': '#f43f5e', 
  'DELEGASI TUGAS': '#ec4899', 
  'RAPAT': '#f59e0b', 
  'LAIN LAIN': '#94a3b8' 
};

const MONTH_NAMES = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
const DAY_NAMES = ["MINGGU", "SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU"];

export default function MyCalendar({ activities, onSave, onDelete, userEmail, permissions }: MyCalendarProps) {
  const isAdmin = permissions?.isAdmin || userEmail === 'fauzanfawwaz2404@gmail.com';
  const canAdd = permissions?.canAdd || isAdmin;
  const canEdit = permissions?.canEdit || isAdmin;
  const canDelete = permissions?.canDelete || isAdmin;
  const [view, setView] = useState<'calendar' | 'dashboard'>('calendar');
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly' | 'agenda'>('monthly');
  const [displayMonth, setDisplayMonth] = useState(new Date().getMonth());
  const [displayYear, setDisplayYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [weatherData, setWeatherData] = useState<any>(null);
  
  // Dashboard Filters
  const [dashFilter, setDashFilter] = useState({
    start: '',
    end: '',
    category: 'all'
  });

  // Weekly Navigation
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  });

  // Modal States
  const [showFormModal, setShowFormModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [multiSelect, setMultiSelect] = useState<string[]>([]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [isExportingWA, setIsExportingWA] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<CalendarActivity>>({});
  const [statusUpdate, setStatusUpdate] = useState<{ id: string, val: string, reason: string, dt: string } | null>(null);
  const [activeActivity, setActiveActivity] = useState<CalendarActivity | null>(null);

  // Export State
  const [exportConfig, setExportConfig] = useState({
    type: 'ALL',
    start: '',
    end: '',
    status: 'Terjadwal',
    category: 'KUNJUNGAN'
  });

  // Helper: Format Date
  const formatDateFull = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('-')) return '-';
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} ${MONTH_NAMES[m - 1]} ${y}`;
  };

  // Helper: File to Base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'doc') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (type === 'image') {
        setFormData(prev => ({ ...prev, image: base64 }));
      } else {
        setFormData(prev => ({ ...prev, doc: { name: file.name, data: base64 } }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStatusFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'doc') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (type === 'image') {
        setActiveActivity(prev => prev ? ({ ...prev, image: base64 }) : null);
      } else {
        setActiveActivity(prev => prev ? ({ ...prev, doc: { name: file.name, data: base64 } }) : null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Logic: Change Month
  const changeMonth = (dir: number) => {
    let newMonth = displayMonth + dir;
    let newYear = displayYear;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    else if (newMonth < 0) { newMonth = 11; newYear--; }
    setDisplayMonth(newMonth);
    setDisplayYear(newYear);
  };

  // Logic: Calendar Grid
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(displayYear, displayMonth, 1).getDay();
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const cells = [];

    // Empty cells
    for (let i = 0; i < firstDay; i++) {
      cells.push({ empty: true, id: `empty-${i}` });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayActs = activities.filter(a => 
        a.date === dateStr && 
        (searchQuery === "" || a.title.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (statusFilter === 'all' || a.status.includes(statusFilter))
      );
      
      cells.push({
        empty: false,
        day,
        dateStr,
        isToday: todayStr === dateStr,
        isTomorrow: tomorrowStr === dateStr,
        isActive: selectedDate === dateStr,
        acts: dayActs
      });
    }

    return cells;
  }, [displayMonth, displayYear, activities, searchQuery, selectedDate, statusFilter]);

  // Logic: Weekly View
  const weeklyGrid = useMemo(() => {
    const cells = [];
    const base = new Date(weekStart);
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    for (let i = 0; i < 7; i++) {
        const d = new Date(base);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dayActs = activities.filter(a => 
            a.date === dateStr && 
            (searchQuery === "" || a.title.toLowerCase().includes(searchQuery.toLowerCase())) &&
            (statusFilter === 'all' || a.status.includes(statusFilter))
        );
        cells.push({
            date: d,
            dateStr,
            acts: dayActs,
            isToday: todayStr === dateStr,
            isTomorrow: tomorrowStr === dateStr
        });
    }
    return cells;
  }, [weekStart, activities, searchQuery, statusFilter]);

  // Logic: Progress Ring Stats (Month current)
  const monthProgress = useMemo(() => {
    const currentMonth = activities.filter(a => {
        const d = new Date(a.date);
        return d.getMonth() === displayMonth && d.getFullYear() === displayYear;
    });
    const total = currentMonth.length;
    const done = currentMonth.filter(a => a.status.includes('Selesai')).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, percent };
  }, [activities, displayMonth, displayYear]);

  // Logic: Upcoming Tasks
  const upcomingTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return activities
      .filter(a => a.status === 'Terjadwal' && a.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);
  }, [activities]);

  // Logic: Dashboard Stats
  const dashboardStats = useMemo(() => {
    const filtered = activities.filter(a => {
      const dateOk = (!dashFilter.start || a.date >= dashFilter.start) && (!dashFilter.end || a.date <= dashFilter.end);
      const catOk = (dashFilter.category === 'all' || a.category === dashFilter.category);
      return dateOk && catOk;
    });

    return {
      total: filtered.length,
      done: filtered.filter(a => a.status.includes('Selesai')).length,
      pending: filtered.filter(a => a.status === 'Terjadwal').length,
      failed: filtered.filter(a => a.status.includes('Batal') || a.status.includes('Tidak')).length,
      filtered
    };
  }, [activities, dashFilter]);

  // Chart Data: Categories
  const categoryChartData = {
    labels: Object.keys(CATEGORY_COLORS),
    datasets: [{
      data: Object.keys(CATEGORY_COLORS).map(c => dashboardStats.filtered.filter(a => a.category === c).length),
      backgroundColor: Object.values(CATEGORY_COLORS),
      borderWidth: 0,
      hoverOffset: 15
    }]
  };

  // Chart Data: Trends
  const trendChartData = {
    labels: MONTH_NAMES,
    datasets: [{
      label: 'Kegiatan',
      data: MONTH_NAMES.map((_, i) => dashboardStats.filtered.filter(a => new Date(a.date).getMonth() === i).length),
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#8b5cf6'
    }]
  };

  // Action: Save Activity
  const saveActivity = async () => {
    if (!formData.title) {
       alert("Silakan isi nama kegiatan!");
       return;
    }
    if (!formData.date) {
       alert("Silakan pilih tanggal kegiatan!");
       return;
    }
    
    try {
      const baseId = formData.id || `act_${Date.now()}`;
      const activity: CalendarActivity = {
        id: baseId,
        title: formData.title,
        category: formData.category || 'KUNJUNGAN',
        date: formData.date,
        deadline: formData.deadline || '',
        image: formData.image || '',
        doc: formData.doc || null,
        status: formData.status || 'Terjadwal',
        reason: formData.reason || '',
        createdAt: formData.createdAt || new Date().toISOString()
      };

      await onSave(activity);

      // Simple Recurring Logic: 4 weeks
      if (isRecurring && !formData.id) {
          for (let i = 1; i <= 4; i++) {
              const d = new Date(formData.date);
              d.setDate(d.getDate() + (i * 7));
              const recAct = { ...activity, id: `${baseId}_rec_${i}`, date: d.toISOString().split('T')[0] };
              await onSave(recAct);
          }
      }

      setShowFormModal(false);
      setFormData({});
      setIsRecurring(false);
      // Small feedback
      const confirmMsg = formData.id ? "Data berhasil diperbarui!" : "Data berhasil disimpan!";
      console.log(confirmMsg);
    } catch (error: any) {
      alert("Gagal menyimpan data: " + error.message);
    }
  };

  // Action: Submit Status
  const submitStatusUpdate = async () => {
    if (!statusUpdate || !activeActivity) return;

    try {
      const updated: CalendarActivity = {
        ...activeActivity,
        status: statusUpdate.val === 'Selesai' ? `Selesai (${statusUpdate.dt.replace('T', ' ')})` : statusUpdate.val,
        reason: statusUpdate.reason
      };

      await onSave(updated);
      setShowStatusModal(false);
      setStatusUpdate(null);
      setActiveActivity(null);
    } catch (error: any) {
      alert("Gagal update status: " + error.message);
    }
  };

  // Action: Export & Share WA
  const processExport = (mode: 'PDF' | 'WA' = 'PDF') => {
    try {
      let filtered = [...activities];
      let label = "Semua Aktivitas";

      if (exportConfig.type === 'DATE') {
        if (!exportConfig.start || !exportConfig.end) {
          alert("Silakan pilih rentang tanggal!");
          return;
        }
        filtered = activities.filter(a => a.date >= exportConfig.start && a.date <= exportConfig.end);
        label = `Rentang ${exportConfig.start} - ${exportConfig.end}`;
      } else if (exportConfig.type === 'STATUS') {
        filtered = activities.filter(a => a.status.includes(exportConfig.status));
        label = `Status: ${exportConfig.status}`;
      } else if (exportConfig.type === 'CATEGORY') {
        filtered = activities.filter(a => a.category === exportConfig.category);
        label = `Kategori: ${exportConfig.category}`;
      }

      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (filtered.length === 0) {
        alert("Tidak ada data untuk kriteria ini!");
        return;
      }

      if (mode === 'PDF') {
          const doc = new jsPDF('l', 'mm', 'a4');
          doc.setFillColor(30, 27, 75);
          doc.rect(0, 0, 297, 45, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(24);
          doc.setFont('helvetica', 'bold');
          doc.text("ACTIVITYHUB - REPORT LOG", 15, 20);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 15, 30);
          doc.text(`Kriteria Laporan: ${label}`, 15, 36);

          const tableBody = filtered.map((a, i) => [
            i + 1,
            a.date.split('-').reverse().join('/'),
            a.title.toUpperCase(),
            a.category,
            a.status.toUpperCase(),
            a.reason || '-'
          ]);

          autoTable(doc, {
            startY: 50,
            head: [['No', 'Tanggal', 'Aktivitas', 'Kategori', 'Status', 'Keterangan']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [124, 58, 237], textColor: 255 },
            styles: { fontSize: 8 },
            columnStyles: { 2: { cellWidth: 80 }, 5: { cellWidth: 60 } }
          });

          doc.save(`ActivityHub_Report_${Date.now()}.pdf`);
      } else {
          // WhatsApp Export
          let text = `*📊 LAPORAN AKTIVITAS - ACTIVITYHUB*\n`;
          text += `📅 *Periode:* ${label}\n`;
          text += `🕒 *Dicetak:* ${new Date().toLocaleString('id-ID')}\n`;
          text += `------------------------------------------\n\n`;
          
          filtered.forEach((a, i) => {
              const statusIcon = a.status.includes('Selesai') ? '✅' : (a.status.includes('Batal') ? '❌' : '⏳');
              text += `${i+1}. *[${a.date}]* ${a.title.toUpperCase()}\n`;
              text += `   🏷️ ${a.category} | ${statusIcon} ${a.status}\n`;
              if (a.reason) text += `   📝 Ket: ${a.reason}\n`;
              text += `\n`;
          });
          
          text += `_Laporan dikirim via ActivityHub CC Depok_`;
          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }
      
      setShowExportModal(false);
    } catch (error: any) {
      alert("Gagal memproses data: " + error.message);
    }
  };

  const shareToWhatsApp = (activity: CalendarActivity) => {
    const text = `*DETAIL KEGIATAN*\n\n📋 *Kegiatan:* ${activity.title}\n📅 *Tanggal:* ${formatDateFull(activity.date)}\n🏷️ *Kategori:* ${activity.category}\n✅ *Status:* ${activity.status}\n\n📝 *Catatan:* ${activity.reason || '-'}\n\n_Sent via ActivityHub_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  function getWeatherIcon(code: number) {
    if (code === 0) return <Sun size={12} className="text-yellow-400" title="Cerah" />;
    if (code <= 3) return <Cloud size={12} className="text-slate-400" title="Berawan" />;
    if (code <= 65) return <CloudRain size={12} className="text-blue-400" title="Hujan" />;
    return <CloudLightning size={12} className="text-brand-400" title="Badai" />;
  }

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-6.2088&longitude=106.8456&daily=weathercode&timezone=auto');
        const data = await res.json();
        setWeatherData(data);
      } catch (e) {
        console.error("Gagal ambil cuaca:", e);
      }
    };
    fetchWeather();
  }, []);

  const selectedDayActivities = useMemo(() => {
    if (!selectedDate) return [];
    return activities.filter(a => a.date === selectedDate);
  }, [activities, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-black/20 p-4 rounded-[2rem] border border-white/5">
        <div className="flex gap-2 p-1 glass rounded-2xl">
          <button 
            onClick={() => setView('calendar')}
            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all flex items-center gap-2 ${view === 'calendar' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30' : 'text-slate-400 hover:text-white'}`}
          >
            <CalendarIcon size={14} /> Kalender
          </button>
          <button 
            onClick={() => setView('dashboard')}
            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase transition-all flex items-center gap-2 ${view === 'dashboard' ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30' : 'text-slate-400 hover:text-white'}`}
          >
            <LayoutDashboard size={14} /> Dashboard
          </button>
        </div>

        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl shadow-xl shadow-rose-600/20 transition-all text-[10px] font-black uppercase italic tracking-widest"
            title="Ekspor laporan ke PDF atau WhatsApp"
          >
            <FileText size={14} /> Export Laporan PDF
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'calendar' ? (
          <motion.div 
            key="calendar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6"
          >
            {/* Calendar Main */}
            <div className="xl:col-span-6 glass p-6 rounded-[2.5rem] border border-white/10 shadow-3xl flex flex-col h-full">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-8 items-center">
                <div className="md:col-span-3 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-400" size={14} title="Cari kegiatan..." />
                  <input 
                    type="text" 
                    placeholder="CARI..." 
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-[10px] font-black uppercase tracking-widest focus:border-brand-500/50 outline-none transition-all placeholder:text-white/20"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="md:col-span-3">
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-[10px] font-black uppercase tracking-widest focus:border-brand-500/50 outline-none transition-all text-white appearance-none cursor-pointer"
                    title="Filter berdasarkan status"
                  >
                    <option value="all">SEMUA STATUS</option>
                    <option value="Terjadwal">TERJADWAL</option>
                    <option value="Selesai">SELESAI</option>
                    <option value="Batal">BATAL</option>
                  </select>
                </div>

                <div className="md:col-span-4 flex justify-between items-center gap-3 bg-brand-900/40 px-4 py-2.5 rounded-2xl border border-brand-500/20 shadow-inner">
                  <button 
                    title="Bulan/Pekan Sebelumnya"
                    onClick={() => {
                      if (viewMode === 'monthly') changeMonth(-1);
                      else if (viewMode === 'weekly') {
                          const d = new Date(weekStart);
                          d.setDate(d.getDate() - 7);
                          setWeekStart(d.toISOString().split('T')[0]);
                      }
                    }} 
                    className="p-1.5 rounded-xl bg-black/20 hover:bg-brand-600 transition-all text-brand-300 hover:text-white"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  
                  <div className="text-center overflow-hidden">
                    {viewMode === 'monthly' ? (
                        <h2 className="text-[10px] font-black text-white italic tracking-[0.2em] uppercase truncate">{MONTH_NAMES[displayMonth]} {displayYear}</h2>
                    ) : (
                        <h2 className="text-[8px] font-black text-white italic tracking-widest uppercase truncate">PEKAN {new Date(weekStart).getDate()}/{new Date(weekStart).getMonth()+1} - {new Date(new Date(weekStart).getTime() + 6*24*60*60*1000).getDate()}/{new Date(new Date(weekStart).getTime() + 6*24*60*60*1000).getMonth()+1}</h2>
                    )}
                  </div>

                  <button 
                    title="Bulan/Pekan Selanjutnya"
                    onClick={() => {
                      if (viewMode === 'monthly') changeMonth(1);
                      else if (viewMode === 'weekly') {
                          const d = new Date(weekStart);
                          d.setDate(d.getDate() + 7);
                          setWeekStart(d.toISOString().split('T')[0]);
                      }
                    }} 
                    className="p-1.5 rounded-xl bg-black/20 hover:bg-brand-600 transition-all text-brand-300 hover:text-white"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="md:col-span-2 flex gap-1 p-1 bg-black/30 rounded-2xl justify-center">
                    {[
                        { id: 'monthly', icon: <CalendarIcon size={12} />, label: 'Tampilan Bulanan' },
                        { id: 'weekly', icon: <List size={12} />, label: 'Tampilan Mingguan' },
                    ].map(m => (
                        <button 
                            key={m.id}
                            title={m.label}
                            onClick={() => setViewMode(m.id as any)}
                            className={`p-2 rounded-xl transition-all flex-1 flex justify-center ${viewMode === m.id ? 'bg-brand-500 text-white shadow-xl shadow-brand-500/20' : 'text-white/20 hover:text-white hover:bg-white/5'}`}
                        >
                            {m.icon}
                        </button>
                    ))}
                </div>
              </div>

              {viewMode === 'monthly' && (
                <>
                  <div className="grid grid-cols-7 gap-1 mb-4 text-center">
                    {DAY_NAMES.map((d, i) => (
                      <div key={d} className={`text-[9px] font-black uppercase tracking-[0.2em] ${i === 0 ? 'text-rose-400' : (i === 6 ? 'text-blue-400' : 'text-slate-500')}`}>{d.slice(0, 3)}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2 flex-grow">
                    {calendarGrid.map((cell, idx) => (
                      <div 
                        key={cell.id || idx}
                        onClick={() => !cell.empty && handleDayClick(cell.dateStr!)}
                        className={`min-h-[100px] rounded-2xl border p-2 flex flex-col gap-1 transition-all group overflow-hidden ${cell.empty ? 'bg-white/[0.02] border-transparent opacity-20' : `cursor-pointer transition-transform hover:-translate-y-1 ${cell.isActive ? 'bg-brand-500/20 border-brand-500' : (cell.isToday ? 'bg-white/5 border-rose-500/30' : 'bg-white/5 border-white/5 hover:border-brand-500/50')}`}`}
                      >
                        {!cell.empty && (
                              <>
                                <div className="flex justify-between items-start mb-1 text-right">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[11px] font-black ${cell.isToday ? 'text-rose-400 underline decoration-2' : 'text-white/60'}`}>{cell.day}</span>
                                      {canAdd && (
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setFormData({ date: cell.dateStr });
                                            setShowFormModal(true);
                                          }}
                                          className="opacity-0 group-hover:opacity-100 p-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded-lg transition-all shadow-lg hover:shadow-emerald-500/40"
                                          title="Tambah kegiatan di tanggal ini"
                                        >
                                          <Plus size={10} className="animate-pulse" />
                                        </button>
                                      )}
                                    </div>
                                    <div className="flex gap-1">
                                        {(cell.isToday && weatherData) && (
                                            <div title={`Cuaca Hari Ini: ${weatherData.daily.weathercode[0] === 0 ? 'Cerah' : (weatherData.daily.weathercode[0] <= 3 ? 'Berawan' : 'Hujan')}`}>
                                                {getWeatherIcon(weatherData.daily.weathercode[0])}
                                            </div>
                                        )}
                                        {(!cell.isToday && cell.isTomorrow && weatherData) && (
                                            <div title={`Prediksi Cuaca Besok: ${weatherData.daily.weathercode[1] === 0 ? 'Cerah' : (weatherData.daily.weathercode[1] <= 3 ? 'Berawan' : 'Hujan')}`}>
                                                {getWeatherIcon(weatherData.daily.weathercode[1])}
                                            </div>
                                        )}
                                        {cell.acts.some(a => a.deadline && new Date(a.deadline) < new Date() && a.status === 'Terjadwal') && (
                                            <AlertCircle size={10} className="text-rose-500 animate-pulse" title="Melewati Deadline!" />
                                        )}
                                    </div>
                                </div>
                            <div className="space-y-1">
                              {(() => {
                                const sched = cell.acts?.filter(a => a.status === 'Terjadwal').length || 0;
                                const done = cell.acts?.filter(a => a.status.includes('Selesai')).length || 0;
                                const cancel = cell.acts?.filter(a => a.status.includes('Batal')).length || 0;
                                
                                return (
                                  <>
                                    {sched > 0 && <div className="text-[7px] font-black bg-brand-500/20 text-brand-300 p-0.5 rounded px-1 truncate uppercase">ANTRI: {sched}</div>}
                                    {cancel > 0 && <div className="text-[7px] font-black bg-rose-500/20 text-rose-400 p-0.5 rounded px-1 truncate uppercase">BATAL: {cancel}</div>}
                                    {done > 0 && <div className="text-[7px] font-black bg-emerald-500/20 text-emerald-400 p-0.5 rounded px-1 truncate uppercase">OK: {done}</div>}
                                  </>
                                );
                              })()}
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {viewMode === 'weekly' && (
                <div className="flex flex-col gap-4 flex-grow">
                    {weeklyGrid.map((day, dIdx) => (
                        <div 
                            key={dIdx}
                            onClick={() => handleDayClick(day.dateStr)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 items-center ${day.dateStr === selectedDate ? 'bg-brand-500/20 border-brand-500' : 'bg-white/5 border-white/5 hover:border-brand-500/30'}`}
                        >
                            <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-none relative group/day ${day.isToday ? 'bg-rose-500 text-white' : 'bg-brand-900/30 text-brand-300'}`}>
                                <span className="text-[9px] font-black uppercase">{DAY_NAMES[day.date.getDay()].slice(0, 3)}</span>
                                <span className="text-xl font-black">{day.date.getDate()}</span>
                                {canAdd && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFormData({ date: day.dateStr });
                                      setShowFormModal(true);
                                    }}
                                    className="absolute -right-2 -top-2 opacity-0 group-hover/day:opacity-100 p-1.5 bg-emerald-500 text-white rounded-lg transition-all shadow-xl shadow-emerald-500/40 scale-0 group-hover/day:scale-100"
                                  >
                                    <Plus size={10} />
                                  </button>
                                )}
                            </div>
                            <div className="flex-grow flex gap-2 overflow-x-auto no-scrollbar py-1">
                                {day.acts.length === 0 ? (
                                    <span className="text-[9px] font-black text-white/5 uppercase italic">Tidak Ada Kegiatan</span>
                                ) : (
                                    day.acts.map(a => (
                                        <div 
                                            key={a.id} 
                                            className="px-3 py-2 rounded-xl flex-none border border-white/5 bg-black/40 flex items-center gap-2 max-w-[150px]"
                                            style={{ borderLeft: `3px solid ${CATEGORY_COLORS[a.category]}` }}
                                        >
                                            <span className="text-[9px] font-black text-white truncate uppercase italic">{a.title}</span>
                                            {a.status.includes('Selesai') && <CheckCircle size={10} className="text-emerald-500" />}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
              )}

              {viewMode === 'agenda' && (
                <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-4">
                    {activities
                        .filter(a => searchQuery === "" || a.title.toLowerCase().includes(searchQuery.toLowerCase()))
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .slice(0, 20)
                        .map(a => (
                            <div 
                                key={a.id}
                                onClick={() => { setSelectedDate(a.date); handleDayClick(a.date); }}
                                className="glass p-5 rounded-[2rem] border border-white/5 flex gap-5 items-center hover:border-brand-500/40 transition-all cursor-pointer"
                            >
                                <div className="text-center w-16 opacity-40">
                                    <p className="text-[10px] font-black">{MONTH_NAMES[new Date(a.date).getMonth()].slice(0, 3)}</p>
                                    <p className="text-2xl font-black">{new Date(a.date).getDate()}</p>
                                </div>
                                <div className="flex-grow">
                                    <h4 className="text-[11px] font-black text-white uppercase italic tracking-wider">{a.title}</h4>
                                    <div className="flex gap-2 mt-2">
                                        <span className="px-2 py-0.5 rounded text-[7px] font-black uppercase text-white/80" style={{ background: CATEGORY_COLORS[a.category] }}>{a.category}</span>
                                        <span className={`px-2 py-0.5 rounded text-[7px] font-black uppercase ${a.status.includes('Selesai') ? 'text-emerald-400' : 'text-amber-400'}`}>{a.status}</span>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-white/20" />
                            </div>
                        ))
                    }
                </div>
              )}
            </div>

            {/* Upcoming Section */}
            <div className="xl:col-span-3 glass p-6 rounded-[2.5rem] border border-white/10 shadow-3xl h-full flex flex-col border-t-4 border-t-brand-500 overflow-hidden">
               <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[11px] font-black text-white italic tracking-widest uppercase flex items-center gap-3">
                        <Flame size={16} className="text-brand-500 animate-pulse" /> PROGRES BULANAN
                    </h3>
                    <div className="text-right">
                        <p className="text-[14px] font-black text-brand-400 leading-none">{monthProgress.percent}%</p>
                        <p className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter">Selesai</p>
                    </div>
               </div>

               <div className="mb-8 flex justify-center">
                    <div className="relative w-28 h-28">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                            <circle 
                                cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" 
                                className="text-brand-500 transition-all duration-1000 ease-out" 
                                strokeDasharray={`${monthProgress.percent * 2.51} 251`}
                                strokeDashoffset="0"
                                strokeLinecap="round"
                                transform="rotate(-90 50 50)"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[8px] font-black text-slate-500 uppercase">{monthProgress.done}/{monthProgress.total}</span>
                        </div>
                    </div>
               </div>
               
              <h3 className="text-[10px] font-black text-white italic tracking-widest uppercase mb-4 flex items-center gap-3">AGENDA AKTIF</h3>
              <div className="space-y-4 overflow-y-auto flex-grow pr-2 custom-scrollbar">
                {upcomingTasks.length === 0 ? (
                  <div className="py-20 text-center opacity-30 text-[10px] font-black uppercase tracking-[0.3em]">Jadwal Kosong</div>
                ) : (
                  upcomingTasks.map(task => (
                    <div 
                      key={task.id}
                      onClick={() => handleDayClick(task.date)}
                      className="group p-4 bg-white/5 border border-white/5 rounded-2xl hover:border-brand-500/40 transition-all cursor-pointer flex items-center gap-4"
                    >
                      <div className="w-1.5 h-12 rounded-full" style={{ background: CATEGORY_COLORS[task.category] }}></div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="text-[11px] font-black text-white group-hover:text-brand-400 transition-colors truncate uppercase italic">{task.title}</h4>
                        <div className="flex justify-between items-center mt-2">
                           <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{task.date.split('-').reverse().join('/')}</span>
                           <span className="px-2 py-0.5 rounded-lg text-[7px] font-black text-white uppercase tracking-wider" style={{ background: CATEGORY_COLORS[task.category] }}>{task.category}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Detail Section */}
            <div className="xl:col-span-3 glass rounded-[2.5rem] border border-white/10 shadow-3xl overflow-hidden flex flex-col h-full relative">
               {!selectedDate ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center opacity-30">
                    <CalendarIcon size={64} className="text-brand-500 mb-6" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">PILIH TANGGAL</p>
                      <p className="text-[8px] font-black uppercase mt-2">UNTUK MELIHAT DETAIL</p>
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="p-6 bg-brand-900/30 border-b border-brand-500/20 flex justify-between items-center">
                       <div className="flex items-center gap-4">
                          <h3 className="text-[10px] font-black text-white uppercase italic tracking-tighter">
                             Tgl: <span className="text-brand-400 not-italic ml-1">{formatDateFull(selectedDate!)}</span>
                          </h3>
                          {multiSelect.length > 0 && canDelete && (
                            <button 
                              onClick={async () => {
                                if (window.confirm(`Hapus ${multiSelect.length} kegiatan?`)) {
                                  for (const id of multiSelect) await onDelete(id);
                                  setMultiSelect([]);
                                }
                              }}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[8px] font-black uppercase tracking-widest italic transition-all flex items-center gap-2"
                            >
                               <Trash2 size={10} /> HAPUS ({multiSelect.length})
                            </button>
                          )}
                       </div>
                       <button 
                         onClick={() => { setFormData({ date: selectedDate }); setShowFormModal(true); }}
                         className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest italic transition-all shadow-lg shadow-brand-600/20"
                       >
                          TAMBAH
                       </button>
                    </div>

                    <div className="p-6 space-y-6 overflow-y-auto flex-grow custom-scrollbar">
                       {/* Antri */}
                       <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-2 tracking-[0.2em] mb-4">
                             <Clock size={14} /> ANTRI
                          </h4>
                          {selectedDayActivities.filter(a => a.status === 'Terjadwal').length === 0 ? (
                            <p className="text-center py-6 text-[9px] font-black text-white/10 uppercase tracking-widest italic border border-dashed border-white/5 rounded-2xl">Kosong</p>
                          ) : (
                            selectedDayActivities.filter(a => a.status === 'Terjadwal').map(a => (
                              <div key={a.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all group">
                                  <div className="flex items-center gap-4 mb-3">
                                     <div className="flex items-center justify-center">
                                         <input 
                                             type="checkbox" 
                                             checked={multiSelect.includes(a.id)}
                                             onChange={(e) => {
                                                 if (e.target.checked) setMultiSelect(prev => [...prev, a.id]);
                                                 else setMultiSelect(prev => prev.filter(id => id !== a.id));
                                             }}
                                             className="w-5 h-5 accent-brand-500 rounded-lg border-2 border-white/20 bg-black cursor-pointer shadow-inner"
                                         />
                                     </div>
                                     <div 
                                       onClick={() => { setActiveActivity(a); setShowDetailModal(true); }}
                                       className="text-[12px] font-black text-white group-hover:text-brand-400 transition-colors uppercase leading-tight cursor-pointer italic flex-grow"
                                     >
                                        {a.title}
                                     </div>
                                  </div>
                                <div className="flex justify-between items-center">
                                   <span className="px-2 py-0.5 rounded-lg text-[7px] font-black text-white uppercase tracking-widest" style={{ background: CATEGORY_COLORS[a.category] }}>{a.category}</span>
                                   <div className="flex gap-2">
                                      <button onClick={() => shareToWhatsApp(a)} className="w-8 h-8 rounded-lg glass text-emerald-500/50 hover:text-emerald-500 flex items-center justify-center border border-white/5" title="Bagi ke WhatsApp"><MessageCircle size={12} /></button>
                                       {canEdit && (
                                         <>
                                           <button onClick={() => { setActiveActivity(a); setShowStatusModal(true); setStatusUpdate({ id: a.id, val: 'Selesai', reason: '', dt: new Date().toISOString().slice(0, 16) }); }} className="px-2 py-1.5 bg-emerald-600 text-white rounded-lg text-[8px] font-black uppercase italic shadow-lg shadow-emerald-600/20 hover:scale-105 transition-transform" title="Selesaikan">SELESAI</button>
                                           <button onClick={() => { setFormData(a); setShowFormModal(true); }} className="w-8 h-8 rounded-lg glass text-white/50 hover:text-white flex items-center justify-center border border-white/5" title="Edit Data"><Edit3 size={12} /></button>
                                           <button onClick={() => { setActiveActivity(a); setShowStatusModal(true); setStatusUpdate({ id: a.id, val: 'Batal', reason: '', dt: '' }); }} className="w-8 h-8 rounded-lg glass text-rose-500/50 hover:text-rose-500 flex items-center justify-center border border-white/5" title="Batalkan"><Ban size={12} /></button>
                                         </>
                                       )}
                                   </div>
                                </div>
                              </div>
                            ))
                          )}
                       </div>

                       {/* Selesai */}
                       <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-2 tracking-[0.2em] mb-4">
                             <CheckCircle size={14} /> SELESAI
                          </h4>
                          {selectedDayActivities.filter(a => a.status.includes('Selesai')).length === 0 ? (
                            <p className="text-center py-6 text-[9px] font-black text-white/10 uppercase tracking-widest italic border border-dashed border-white/5 rounded-2xl">Belum ada</p>
                          ) : (
                            selectedDayActivities.filter(a => a.status.includes('Selesai')).map(a => (
                              <div key={a.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-4 group">
                                 <div className="flex items-center justify-center">
                                     <input 
                                         type="checkbox" 
                                         checked={multiSelect.includes(a.id)}
                                         onChange={(e) => {
                                             if (e.target.checked) setMultiSelect(prev => [...prev, a.id]);
                                             else setMultiSelect(prev => prev.filter(id => id !== a.id));
                                         }}
                                         className="w-5 h-5 accent-emerald-500 rounded-lg border-2 border-white/20 bg-black cursor-pointer shadow-inner"
                                     />
                                 </div>
                                 <div className="text-[11px] font-black text-emerald-400/50 line-through truncate uppercase italic flex-grow">{a.title}</div>
                                 <div className="flex gap-2">
                                    <button onClick={() => shareToWhatsApp(a)} className="text-emerald-500/50 hover:text-emerald-500 transition-colors" title="Bagi ke WhatsApp"><MessageCircle size={14} /></button>
                                    <button onClick={() => { setActiveActivity(a); setShowDetailModal(true); }} className="text-brand-400 hover:scale-110 transition-transform" title="Lihat Detail"><Eye size={14} /></button>
                                 </div>
                              </div>
                            ))
                          )}
                       </div>

                       {/* Batal */}
                       <div className="space-y-3">
                          <h4 className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-2 tracking-[0.2em] mb-4">
                             <X size={14} /> BATAL / LAINNYA
                          </h4>
                          {selectedDayActivities.filter(a => a.status.includes('Batal') || a.status.includes('Tidak')).length === 0 ? (
                            <p className="text-center py-6 text-[9px] font-black text-white/10 uppercase tracking-widest italic border border-dashed border-white/5 rounded-2xl">Kosong</p>
                          ) : (
                            selectedDayActivities.filter(a => a.status.includes('Batal') || a.status.includes('Tidak')).map(a => (
                              <div key={a.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-4 group">
                                 <div className="flex items-center justify-center">
                                     <input 
                                         type="checkbox" 
                                         checked={multiSelect.includes(a.id)}
                                         onChange={(e) => {
                                             if (e.target.checked) setMultiSelect(prev => [...prev, a.id]);
                                             else setMultiSelect(prev => prev.filter(id => id !== a.id));
                                         }}
                                         className="w-5 h-5 accent-rose-500 rounded-lg border-2 border-white/20 bg-black cursor-pointer shadow-inner"
                                     />
                                 </div>
                                 <div className="text-[11px] font-black text-rose-500/70 uppercase leading-none italic flex-grow">{a.title}</div>
                                 <div className="flex gap-2">
                                    <button onClick={() => shareToWhatsApp(a)} className="text-emerald-500/50 hover:text-emerald-500 transition-colors" title="Bagi ke WhatsApp"><MessageCircle size={14} /></button>
                                    <button onClick={() => { setActiveActivity(a); setShowDetailModal(true); }} className="text-brand-400 hover:scale-110 transition-transform" title="Lihat Detail"><Eye size={14} /></button>
                                    {canDelete && (
                                      <button onClick={() => {
                                         if (window.confirm("Hapus data ini?")) {
                                            onDelete(a.id);
                                         }
                                      }} className="text-white/20 hover:text-rose-500 transition-colors" title="Hapus"><Trash2 size={14} /></button>
                                    )}
                                 </div>
                              </div>
                            ))
                          )}
                       </div>
                    </div>
                 </div>
               )}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
             {/* Stats Cards */}
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'TOTAL KEGIATAN', val: dashboardStats.total, icon: <FileText className="text-white/20" />, border: 'border-brand-500', color: 'text-white' },
                  { label: 'SELESAI', val: dashboardStats.done, icon: <CheckCircle className="text-white/20" />, border: 'border-emerald-500', color: 'text-emerald-400' },
                  { label: 'MENUNGGU', val: dashboardStats.pending, icon: <Clock className="text-white/20" />, border: 'border-amber-500', color: 'text-amber-400' },
                  { label: 'BATAL', val: dashboardStats.failed, icon: <Ban className="text-white/20" />, border: 'border-rose-500', color: 'text-rose-400' },
                ].map((s, i) => (
                  <div key={i} className={`glass p-8 rounded-[2.5rem] border-l-8 ${s.border} relative overflow-hidden group shadow-2xl`}>
                     <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:scale-125 transition-transform duration-700">{s.icon}</div>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">{s.label}</p>
                     <p className={`text-5xl font-black italic tracking-tighter ${s.color}`}>{s.val}</p>
                  </div>
                ))}
             </div>

             {/* Filters */}
             <div className="glass p-8 rounded-[2.5rem] border border-white/10 shadow-2xl bg-brand-900/10 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">DARI TANGGAL</label>
                   <input 
                     type="date" 
                     className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-brand-500 outline-none transition-all"
                     value={dashFilter.start}
                     onChange={(e) => setDashFilter(prev => ({ ...prev, start: e.target.value }))}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">SAMPAI TANGGAL</label>
                   <input 
                     type="date" 
                     className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-brand-500 outline-none transition-all"
                     value={dashFilter.end}
                     onChange={(e) => setDashFilter(prev => ({ ...prev, end: e.target.value }))}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">KATEGORI</label>
                   <select 
                     className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-brand-500 outline-none transition-all uppercase"
                     value={dashFilter.category}
                     onChange={(e) => setDashFilter(prev => ({ ...prev, category: e.target.value }))}
                   >
                      <option value="all">SEMUA KATEGORI</option>
                      {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <button 
                  onClick={() => setDashFilter({ start: '', end: '', category: 'all' })}
                  className="w-full py-4 glass text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all italic border border-white/10"
                >
                   RESET FILTER
                </button>
             </div>

             {/* Charts */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="glass p-8 rounded-[3rem] border border-white/10 shadow-3xl flex flex-col">
                   <h3 className="text-xs font-black text-white italic uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                      <TrendingUp size={16} className="text-brand-500" /> DISTRIBUSI KATEGORI
                   </h3>
                   <div className="relative flex-grow flex items-center justify-center">
                     <div className="w-full max-w-[280px]">
                        <Doughnut 
                          data={categoryChartData} 
                          options={{
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: {
                              legend: {
                                position: 'bottom',
                                labels: { color: '#94a3b8', font: { size: 9, weight: 'bold' }, padding: 20 }
                              }
                            },
                            cutout: '70%'
                          }} 
                        />
                     </div>
                   </div>
                </div>

                <div className="glass p-8 rounded-[3rem] border border-white/10 shadow-3xl lg:col-span-2 flex flex-col">
                   <h3 className="text-xs font-black text-white italic uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                      <TrendingUp size={16} className="text-brand-500" /> TREN AKTIVITAS BULANAN
                   </h3>
                   <div className="flex-grow">
                      <Line 
                        data={trendChartData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', font: { size: 9 } } },
                            x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 9 } } }
                          },
                          plugins: { legend: { display: false } }
                        }} 
                      />
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Form */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowFormModal(false)} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass p-8 sm:p-10 rounded-[3rem] border border-brand-500/30 w-full max-w-xl relative z-10 shadow-3xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
               <h3 className="text-2xl font-black text-white mb-8 uppercase italic tracking-tighter text-center underline decoration-brand-500 decoration-4">Catat Kegiatan</h3>
               
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block italic">DETAIL AKTIFITAS</label>
                     <input 
                       type="text" 
                       placeholder="Contoh: Kunjungan ke Client A"
                       className="w-full bg-black/60 border border-white/10 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-brand-500 transition-all placeholder:text-white/10"
                       value={formData.title || ''}
                       onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                     />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block italic">KATEGORI</label>
                        <select 
                          className="w-full bg-black/60 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold text-white outline-none focus:border-brand-500 transition-all uppercase"
                          value={formData.category || 'KUNJUNGAN'}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        >
                           {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block italic">KEGIATAN BERULANG</label>
                        <div className="flex items-center gap-3 bg-black/60 border border-white/10 rounded-2xl p-4">
                           <input 
                               type="checkbox" 
                               className="accent-brand-500" 
                               checked={isRecurring}
                               onChange={(e) => setIsRecurring(e.target.checked)}
                           />
                           <span className="text-[10px] font-black text-white uppercase italic tracking-widest">ULANGI 4 PEKAN</span>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block italic">DEADLINE (OPSIONAL)</label>
                        <input 
                           type="datetime-local" 
                           className="w-full bg-black/60 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold text-white outline-none focus:border-brand-500 transition-all"
                           value={formData.deadline || ''}
                           onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                        />
                     </div>
                     <div className="invisible"></div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block italic">LAMPIRAN FOTO</label>
                        <input type="file" id="form-image" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'image')} />
                        <button type="button" onClick={() => document.getElementById('form-image')?.click()} className="w-full py-4 glass rounded-2xl text-[10px] font-black uppercase italic tracking-widest border border-white/10 flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                           <Camera size={14} /> PILIH GAMBAR
                        </button>
                        {formData.image && (
                          <div className="mt-2 text-center">
                             <img src={formData.image} alt="Preview" className="w-full h-32 object-cover rounded-2xl border-2 border-white/10" />
                          </div>
                        )}
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block italic">LAMPIRAN DOKUMEN</label>
                        <input type="file" id="form-doc" accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={(e) => handleFileChange(e, 'doc')} />
                        <button type="button" onClick={() => document.getElementById('form-doc')?.click()} className="w-full py-4 glass rounded-2xl text-[10px] font-black uppercase italic tracking-widest border border-white/10 flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                           <FileUp size={14} /> PILIH FILE
                        </button>
                        {formData.doc && (
                          <div className="mt-2 text-[8px] font-black text-brand-400 bg-brand-500/10 p-3 rounded-xl border border-brand-500/20 text-center uppercase truncate italic">
                             {formData.doc.name}
                          </div>
                        )}
                     </div>
                  </div>
               </div>

               <div className="flex flex-col sm:flex-row justify-end gap-4 mt-12 border-t border-white/10 pt-8">
                  <button onClick={() => setShowFormModal(false)} className="px-8 py-3 text-white/50 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all italic underline underline-offset-8">BATAL</button>
                  <button onClick={saveActivity} className="px-10 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-brand-600/30 transition-all italic">SIMPAN DATA</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Status Update */}
      <AnimatePresence>
        {showStatusModal && statusUpdate && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/85 backdrop-blur-2xl" onClick={() => setShowStatusModal(false)} 
            />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="glass p-8 rounded-[3rem] border border-emerald-500/30 w-full max-w-md relative z-10 shadow-3xl"
            >
               <h3 className="text-xl font-black text-white mb-2 uppercase italic tracking-tighter">Konfirmasi Status</h3>
               <p className="text-[10px] text-slate-500 mb-8 uppercase font-bold italic tracking-widest">Penyelesaian "{activeActivity?.title}"</p>
               
               <div className="space-y-6">
                  {statusUpdate.val === 'Selesai' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic block">WAKTU PENYELESAIAN</label>
                           <input 
                              type="datetime-local" 
                              className="w-full bg-black/60 border border-white/10 rounded-2xl py-3 px-6 text-xs font-bold text-white focus:border-emerald-500 outline-none transition-all"
                              value={statusUpdate.dt}
                              onChange={(e) => setStatusUpdate(prev => prev ? ({ ...prev, dt: e.target.value }) : null)}
                           />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic block">FOTO BUKTI</label>
                              <input type="file" id="status-image" accept="image/*" className="hidden" onChange={(e) => handleStatusFileChange(e, 'image')} />
                              <button type="button" onClick={() => document.getElementById('status-image')?.click()} className="w-full py-2.5 glass rounded-xl text-[9px] font-black uppercase italic border border-white/10 hover:bg-white/10 transition-all">UNGGAH</button>
                              {activeActivity?.image && <p className="text-[8px] text-emerald-500 font-bold text-center mt-1 uppercase italic tracking-widest">Siap Simpan</p>}
                           </div>
                           <div className="space-y-2">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic block">LAPORAN</label>
                              <input type="file" id="status-doc" accept=".pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={(e) => handleStatusFileChange(e, 'doc')} />
                              <button type="button" onClick={() => document.getElementById('status-doc')?.click()} className="w-full py-2.5 glass rounded-xl text-[9px] font-black uppercase italic border border-white/10 hover:bg-white/10 transition-all">UNGGAH</button>
                              {activeActivity?.doc && <p className="text-[8px] text-blue-400 font-bold text-center mt-1 uppercase italic tracking-widest">Siap Simpan</p>}
                           </div>
                        </div>
                     </div>
                  )}

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic block">CATATAN TAMBAHAN</label>
                     <textarea 
                        className="w-full bg-black/60 border border-white/10 rounded-2xl py-4 px-6 text-xs font-bold text-white focus:border-brand-500 outline-none transition-all resize-none"
                        rows={3}
                        placeholder="Tuliskan keterangan..."
                        value={statusUpdate.reason}
                        onChange={(e) => setStatusUpdate(prev => prev ? ({ ...prev, reason: e.target.value }) : null)}
                     />
                  </div>
               </div>

               <div className="flex justify-end gap-4 mt-10">
                  <button onClick={() => setShowStatusModal(false)} className="px-6 py-2 text-white/50 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all italic underline underline-offset-4">BATAL</button>
                  <button 
                    onClick={submitStatusUpdate} 
                    className={`px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all italic shadow-2xl ${statusUpdate.val === 'Selesai' ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-rose-600 text-white shadow-rose-500/20'}`}
                  >
                     {statusUpdate.val === 'Selesai' ? 'SELESAIKAN' : 'TIDAK JADI'}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Detail View */}
      <AnimatePresence>
        {showDetailModal && activeActivity && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/90 backdrop-blur-2xl" onClick={() => setShowDetailModal(false)} 
            />
            <motion.div 
               initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
               className="glass rounded-[3rem] border border-brand-500/20 w-full max-w-3xl relative z-10 shadow-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
               <div className="p-8 bg-brand-900/40 border-b border-white/10 flex justify-between items-center">
                  <h3 className="text-xl font-black text-white uppercase italic tracking-tighter underline decoration-brand-500 decoration-2">Informasi Kegiatan</h3>
                  <button onClick={() => setShowDetailModal(false)} className="w-10 h-10 rounded-full glass flex items-center justify-center text-white/30 hover:text-white transition-colors"><X size={20} /></button>
               </div>

               <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-grow">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-8">
                        <div>
                           <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 italic">NAMA KEGIATAN</p>
                           <h4 className="text-2xl font-black text-white italic tracking-tighter uppercase">{activeActivity.title}</h4>
                        </div>
                        <div className="flex gap-8">
                           <div className="flex-1">
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 italic">TANGGAL</p>
                              <p className="text-sm font-black text-slate-200">{formatDateFull(activeActivity.date)}</p>
                           </div>
                           <div className="flex-1">
                              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 italic">STATUS</p>
                              <span className={`px-3 py-1 rounded-md text-[9px] font-black text-white uppercase italic shadow-lg ${activeActivity.status.includes('Selesai') ? 'bg-emerald-600 shadow-emerald-500/20' : (activeActivity.status.includes('Batal') ? 'bg-rose-600 shadow-rose-500/20' : 'bg-brand-600 shadow-brand-600/20')}`}>{activeActivity.status}</span>
                           </div>
                        </div>
                        <div>
                           <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 italic">KATEGORI</p>
                           <span className="px-4 py-1.5 rounded-xl text-[9px] font-black text-white uppercase italic shadow-inner" style={{ background: CATEGORY_COLORS[activeActivity.category] }}>{activeActivity.category}</span>
                        </div>
                        {activeActivity.reason && (
                          <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 italic underline decoration-brand-500">Catatan Khusus</p>
                             <p className="text-xs text-slate-300 font-medium leading-relaxed italic">"{activeActivity.reason}"</p>
                          </div>
                        )}
                        {activeActivity.doc && (
                          <div>
                             <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-3 italic">DOKUMEN TERLAMPIR</p>
                             <button 
                               onClick={() => {
                                 const parts = activeActivity.doc!.data.split(';base64,');
                                 const contentType = parts[0].split(':')[1];
                                 const raw = window.atob(parts[1]);
                                 const uInt8Array = new Uint8Array(raw.length);
                                 for (let i = 0; i < raw.length; ++i) uInt8Array[i] = raw.charCodeAt(i);
                                 const blobUrl = URL.createObjectURL(new Blob([uInt8Array], {type: contentType}));
                                 window.open(blobUrl, '_blank');
                                 setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
                               }}
                               className="flex items-center gap-4 w-full p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl hover:bg-blue-600/20 transition-all group"
                             >
                                <FileText size={24} className="text-blue-400 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black text-blue-300 uppercase truncate">{activeActivity.doc.name}</span>
                             </button>
                          </div>
                        )}
                     </div>
                     <div className="space-y-4">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 italic">DOKUMENTASI VISUAL</p>
                        {activeActivity.image ? (
                          <div className="relative group cursor-zoom-in" onClick={() => {
                             const win = window.open();
                             win?.document.write(`<body style="margin:0;display:flex;align-items:center;justify-content:center;background:#000"><img src="${activeActivity.image}" style="max-width:98vw;max-height:98vh"></body>`);
                          }}>
                             <img src={activeActivity.image} alt="Activity" className="w-full rounded-[2rem] border border-white/10 shadow-2xl group-hover:brightness-110 transition-all" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[2rem]"><Eye size={32} className="text-white scale-90 group-hover:scale-100 transition-transform" /></div>
                          </div>
                        ) : (
                          <div className="w-full h-64 bg-white/5 rounded-[2rem] border-2 border-dashed border-white/5 flex items-center justify-center text-slate-700 font-black uppercase text-[10px] tracking-widest italic">Tidak ada foto</div>
                        )}
                     </div>
                  </div>
               </div>

               <div className="p-8 bg-white/5 flex justify-between items-center">
                  {canDelete && (
                    <button 
                      onClick={() => {
                        if (window.confirm("Apakah Anda yakin ingin menghapus kegiatan ini?")) {
                          onDelete(activeActivity.id);
                          setShowDetailModal(false);
                        }
                      }}
                      className="px-6 py-4 text-rose-500 hover:text-white hover:bg-rose-600 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all border border-rose-500/30"
                    >
                      HAPUS
                    </button>
                  )}
                  <button 
                    onClick={() => shareToWhatsApp(activeActivity)}
                    className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-emerald-600/20 transition-all flex items-center gap-3 italic"
                  >
                    <MessageCircle size={14} /> SHARE WA
                  </button>
                  <button onClick={() => setShowDetailModal(false)} className="px-10 py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-brand-600/30 transition-all italic">TUTUP</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Export Config */}
      <AnimatePresence>
        {showExportModal && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/85 backdrop-blur-2xl" onClick={() => setShowExportModal(false)} 
            />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="glass p-8 rounded-[3.5rem] border border-white/10 w-full max-w-lg relative z-10 shadow-3xl overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-6">
                   <button onClick={() => setShowExportModal(false)} className="text-white/20 hover:text-rose-500 transition-colors"><X size={20} /></button>
               </div>
               <h3 className="text-sm font-black text-white italic tracking-[0.3em] uppercase mb-8 flex items-center gap-3">
                  <Download size={20} className="text-brand-500" /> OPSI LAPORAN
               </h3>
               
               <div className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                     {[
                       { id: 'ALL', label: 'SEMUA' },
                       { id: 'DATE', label: 'RENTANG TGL' },
                       { id: 'STATUS', label: 'PER STATUS' },
                       { id: 'CATEGORY', label: 'KATEGORI' }
                     ].map(t => (
                       <button 
                         key={t.id}
                         onClick={() => setExportConfig(prev => ({ ...prev, type: t.id as any }))}
                         className={`py-3 rounded-2xl font-black uppercase text-[9px] tracking-widest border transition-all ${exportConfig.type === t.id ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20' : 'bg-black/20 border-white/5 text-white/40 hover:border-brand-500/50'}`}
                       >
                          {t.label}
                       </button>
                     ))}
                 </div>

                 {exportConfig.type === 'DATE' && (
                   <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-500 uppercase italic">MULAI</label>
                         <input 
                           type="date" 
                           className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-[10px] font-bold text-white outline-none focus:border-brand-500"
                           value={exportConfig.start}
                           onChange={(e) => setExportConfig(prev => ({ ...prev, start: e.target.value }))}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] font-black text-slate-500 uppercase italic">SAMPAI</label>
                         <input 
                           type="date" 
                           className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-[10px] font-bold text-white outline-none focus:border-brand-500"
                           value={exportConfig.end}
                           onChange={(e) => setExportConfig(prev => ({ ...prev, end: e.target.value }))}
                         />
                      </div>
                   </div>
                 )}

                 {exportConfig.type === 'STATUS' && (
                   <select 
                     className="w-full bg-black/60 border border-white/5 rounded-xl p-4 text-[10px] font-bold text-white outline-none focus:border-brand-500 uppercase animate-in fade-in slide-in-from-top-2"
                     value={exportConfig.status}
                     onChange={(e) => setExportConfig(prev => ({ ...prev, status: e.target.value }))}
                   >
                     <option value="Terjadwal">TERJADWAL (ANTRI)</option>
                     <option value="Selesai">SELESAI (OK)</option>
                     <option value="Batal">BATAL / LAINNYA</option>
                   </select>
                 )}

                 {exportConfig.type === 'CATEGORY' && (
                   <select 
                     className="w-full bg-black/60 border border-white/5 rounded-xl p-4 text-[10px] font-bold text-white outline-none focus:border-brand-500 uppercase animate-in fade-in slide-in-from-top-2"
                     value={exportConfig.category}
                     onChange={(e) => setExportConfig(prev => ({ ...prev, category: e.target.value }))}
                   >
                     {Object.keys(CATEGORY_COLORS).map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                 )}

                 <div className="flex flex-col gap-3 pt-6 border-t border-white/5">
                     <button 
                       onClick={() => processExport('PDF')}
                       className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-brand-500/20 transition-all flex items-center justify-center gap-3 italic"
                     >
                        <FileText size={16} /> DOWNLOAD PDF REPORT
                     </button>
                     <button 
                       onClick={() => processExport('WA')}
                       className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 italic"
                     >
                        <MessageCircle size={16} /> SHARE RINGKASAN KE WA
                     </button>
                     <p className="text-[8px] font-bold text-slate-500 text-center uppercase tracking-widest leading-relaxed">
                       *SHARE WA MENGIRIM RINGKASAN TEKS DETAIL.<br/>GUNAKAN PDF UNTUK BERBAGI FILE DOKUMEN.
                     </p>
                 </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  function handleDayClick(dateStr: string) {
    setSelectedDate(dateStr);
  }
}
