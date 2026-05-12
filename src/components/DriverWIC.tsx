import React, { useState, useMemo } from 'react';
import { DriverWicData } from '../types';
import { MONTHS, WIC_CATEGORIES } from '../constants';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { FileDown, PersonStanding, Activity, ExternalLink } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DriverWICProps {
  data: DriverWicData;
  onSave: (data: DriverWicData) => void;
  userEmail?: string | null;
  permissions?: { canAdd: boolean, canEdit: boolean, canDelete: boolean, isAdmin: boolean };
}

export default function DriverWIC({ data, onSave, userEmail, permissions }: DriverWICProps) {
  const isAdmin = permissions?.isAdmin || userEmail === 'fauzanfawwaz2404@gmail.com';
  const canModify = isAdmin; // Standard logic: Only admin can modify targets/realization in WIC
  const [filter, setFilter] = useState({ category: WIC_CATEGORIES[0], month: 'ALL' });
  const [tempData, setTempData] = useState<DriverWicData>(data);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFilter, setExportFilter] = useState({ cat: 'ALL', month: 'ALL' });

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num);
  };

  const currentMonth = MONTHS[new Date().getMonth()];
  const currentMonthStats = useMemo(() => {
    const cat = filter.category;
    const d = tempData[cat]?.[currentMonth] || {tr:0,tv:0,rr:0,rv:0};
    return {
      tr: Number(d.tr) || 0,
      tv: Number(d.tv) || 0,
      rr: Number(d.rr) || 0,
      rv: Number(d.rv) || 0
    };
  }, [tempData, filter.category, currentMonth]);

  const stats = useMemo(() => {
    let tR=0, tV=0, rR=0, rV=0; 
    const cat = filter.category;
    const mF = filter.month;

    if (mF === 'ALL') {
      MONTHS.forEach(m => { 
        const d=tempData[cat]?.[m] || {tr:0,tv:0,rr:0,rv:0}; 
        tR += (Number(d.tr) || 0); 
        tV += (Number(d.tv) || 0); 
        rR += (Number(d.rr) || 0); 
        rV += (Number(d.rv) || 0); 
      }); 
    } else {
      const d = tempData[cat]?.[mF] || {tr:0,tv:0,rr:0,rv:0};
      tR = Number(d.tr) || 0; 
      tV = Number(d.tv) || 0; 
      rR = Number(d.rr) || 0; 
      rV = Number(d.rv) || 0;
    }
    return { tR, tV, rR, rV };
  }, [tempData, filter]);

  const generateWicPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const sC = exportFilter.cat;
    const sM = exportFilter.month;
    
    doc.setFillColor(79, 70, 229); // Indigo-600
    doc.rect(0, 0, pageWidth, 15, 'F');

    doc.setFontSize(18); 
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text('LAPORAN MONITORING DRIVER WIC 2026', 14, 10);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 25);
    
    const cats = sC === 'ALL' ? WIC_CATEGORIES : [sC];
    let y = 35;
    cats.forEach(cat => {
        doc.setFont("helvetica", "bold");
        doc.text(`Kategori Driver: ${cat}`, 14, y); 
        const dataRows = (sM === 'ALL' ? MONTHS : [sM]).map(m => { 
            const d = tempData[cat]?.[m] || {tr:0,tv:0,rr:0,rv:0}; 
            return [m, formatRupiah(d.tr), formatRupiah(d.rr), d.tv.toLocaleString(), d.rv.toLocaleString()]; 
        });
        autoTable(doc, { 
            startY: y + 2, 
            head: [['Bulan', 'Tgt. Rev', 'Real Rev', 'Tgt. Visit', 'Real Visit']], 
            body: dataRows, 
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] },
            didDrawPage: (dt) => {
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`Halaman ${doc.getNumberOfPages()}`, dt.settings.margin.left, pageHeight - 10);
                
                doc.setFont("courier", "bold");
                doc.setTextColor(79, 70, 229);
                const footerText = "POWERED BY GUIDE";
                const textWidth = doc.getTextWidth(footerText);
                doc.text(footerText, (pageWidth / 2) - (textWidth / 2), pageHeight - 10);
            }
        });
        y = (doc as any).lastAutoTable.finalY + 15;
    });
    doc.save(`Laporan_WIC_2026.pdf`);
    setIsExportModalOpen(false);
  };

  const chartData = {
    labels: MONTHS,
    datasets: [
      {
        label: 'Target',
        data: MONTHS.map(m => tempData[filter.category]?.[m]?.tr || 0),
        borderColor: '#fbbf24',
        tension: 0.4,
        fill: false,
      },
      {
        label: 'Real',
        data: MONTHS.map(m => tempData[filter.category]?.[m]?.rr || 0),
        borderColor: '#10b981',
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#fff' }
      }
    },
    scales: {
      y: {
        ticks: { color: 'rgba(255, 255, 255, 0.5)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: 'rgba(255, 255, 255, 0.5)' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  const updateField = (month: string, field: 'tr' | 'tv' | 'rr' | 'rv', value: string) => {
    setTempData(prev => {
      const next = { ...prev };
      if (!next[filter.category]) next[filter.category] = {};
      if (!next[filter.category][month]) next[filter.category][month] = { tr: 0, tv: 0, rr: 0, rv: 0 };
      next[filter.category][month] = { ...next[filter.category][month], [field]: Number(value) };
      return next;
    });
  };

  const pctCurRev = currentMonthStats.tr > 0 ? (currentMonthStats.rr / currentMonthStats.tr) * 100 : 0;
  const pctCurVis = currentMonthStats.tv > 0 ? (currentMonthStats.rv / currentMonthStats.tv) * 100 : 0;

  const pctRev = stats.tR > 0 ? (stats.rR / stats.tR) * 100 : 0;
  const pctVis = stats.tV > 0 ? (stats.rV / stats.tV) * 100 : 0;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tighter">
            <PersonStanding size={24} className="text-indigo-400 inline mr-2" /> Driver WIC <span>2026</span>
          </h2>
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="btn btn-sm btn-indigo glass font-bold text-[10px] uppercase shadow-lg border border-indigo-500/30"
          >
            <FileDown size={14} className="mr-1" /> Export Laporan
          </button>
        </div>
        <div className="flex gap-2">
          <select 
            value={filter.month} 
            onChange={(e) => setFilter(prev => ({ ...prev, month: e.target.value }))}
            className="select select-sm custom-select w-40 shadow-xl"
          >
            <option value="ALL">SEMUA BULAN</option>
            {MONTHS.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
          </select>
          <select 
            value={filter.category} 
            onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
            className="select select-sm custom-select w-56 shadow-xl"
          >
            {WIC_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 glass p-6 rounded-3xl min-h-[350px] border border-white/5 shadow-xl">
          <Line data={chartData} options={chartOptions as any} />
        </div>
        
        {/* Progress Akumulasi (Filter saat ini) */}
        <div className="glass p-8 rounded-3xl flex flex-col justify-center gap-6 bg-indigo-500/5 shadow-xl border border-white/5">
          <div className="text-center">
            <h4 className="text-[10px] font-black uppercase text-amber-400 mb-4 tracking-widest border-b border-white/5 pb-2">Progres Akumulasi ({filter.month})</h4>
            <p className="text-[10px] uppercase opacity-50 font-bold mb-2">Revenue {filter.category}</p>
            <p className="text-sm font-bold text-emerald-400 font-mono">{formatRupiah(stats.rR)}</p>
            <p className="text-[9px] opacity-30 mt-1">Target: {formatRupiah(stats.tR)}</p>
            <div className="flex items-center gap-2 mt-2">
              <progress className="progress progress-warning flex-grow" value={pctRev} max="100"></progress>
              <span className="text-xs font-bold text-amber-400 min-w-[45px] text-right">{pctRev.toFixed(1)}%</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase opacity-50 font-bold mb-2">Kunjungan {filter.category}</p>
            <p className="text-xl font-bold text-blue-400 font-mono">{stats.rV.toLocaleString()} / {stats.tV.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-2">
              <progress className="progress progress-info flex-grow" value={pctVis} max="100"></progress>
              <span className="text-xs font-bold text-info min-w-[45px] text-right">{pctVis.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Progres Bulan Berjalan (April) */}
        <div className="glass p-8 rounded-3xl flex flex-col justify-center gap-6 bg-emerald-500/5 shadow-xl border border-emerald-500/10">
          <div className="text-center">
            <h4 className="text-[10px] font-black uppercase text-emerald-400 mb-4 tracking-widest border-b border-white/5 pb-2">Progres Bulan Berjalan ({currentMonth})</h4>
            <p className="text-[10px] uppercase opacity-50 font-bold mb-2">Revenue {filter.category}</p>
            <p className="text-sm font-bold text-emerald-400 font-mono">{formatRupiah(currentMonthStats.rr)}</p>
            <p className="text-[9px] opacity-30 mt-1">Target: {formatRupiah(currentMonthStats.tr)}</p>
            <div className="flex items-center gap-2 mt-2">
              <progress className={`progress flex-grow ${pctCurRev >= 100 ? 'progress-success' : 'progress-warning'}`} value={pctCurRev} max="100"></progress>
              <span className="text-xs font-bold text-emerald-400 min-w-[45px] text-right">{pctCurRev.toFixed(1)}%</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] uppercase opacity-50 font-bold mb-2">Kunjungan {filter.category}</p>
            <p className="text-xl font-bold text-blue-400 font-mono">{currentMonthStats.rv.toLocaleString()} / {currentMonthStats.tv.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-2">
              <progress className="progress progress-info flex-grow" value={pctCurVis} max="100"></progress>
              <span className="text-xs font-bold text-blue-400 min-w-[45px] text-right">{pctCurVis.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass p-6 rounded-3xl shadow-lg border border-white/5">
          <h3 className="text-[10px] font-bold mb-4 uppercase opacity-50 flex justify-between items-center">
            Target Bulanan {filter.category}
            <span className="text-[8px] bg-white/5 px-2 py-1 rounded">Input angka murni, sistem akan memformat otomatis</span>
          </h3>
          <div className="table-container max-h-[400px] overflow-y-auto custom-scrollbar">
            <table className="table table-xs w-full table-fixed border-separate border-spacing-y-2">
              <thead className="sticky top-0 bg-[#0f172a] border-b border-white/5 uppercase text-[9px] opacity-50 z-10">
                <tr>
                  <th className="w-[25%] p-3">Bulan</th>
                  <th className="w-[50%] p-3 text-right">Target Rev (Rp)</th>
                  <th className="w-[25%] p-3 text-center">Tgt. Visit</th>
                </tr>
              </thead>
              <tbody>
                {MONTHS.map(m => (
                  <tr key={m} className={`${m === currentMonth ? 'bg-amber-400/10' : 'bg-white/[0.02]'} rounded-xl transition-colors`}>
                    <td className="font-bold opacity-80 p-3">
                      <div className="flex items-center gap-2">
                        {m} {m === currentMonth && <span className="badge badge-xs badge-warning border-none font-black text-[7px]">NOW</span>}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col items-end">
                        <input 
                          type="number" 
                          value={tempData[filter.category]?.[m]?.tr || 0} 
                          onChange={(e) => updateField(m, 'tr', e.target.value)}
                          readOnly={!canModify}
                          className={`input input-sm bg-black/40 w-full font-mono text-amber-500 text-right border-white/5 focus:border-amber-500/50 ${!canModify ? 'cursor-not-allowed opacity-70' : ''}`} 
                        />
                        <span className="text-[9px] text-amber-200 font-black mt-1.5 drop-shadow-sm">{formatRupiah(tempData[filter.category]?.[m]?.tr || 0)}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        value={tempData[filter.category]?.[m]?.tv || 0} 
                        onChange={(e) => updateField(m, 'tv', e.target.value)}
                        readOnly={!canModify}
                        className={`input input-sm bg-black/40 w-full font-mono text-white text-center border-white/5 focus:border-indigo-500/50 ${!canModify ? 'cursor-not-allowed opacity-70' : ''}`} 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white/5 font-black sticky bottom-0 z-10 backdrop-blur-md">
                <tr>
                  <td className="uppercase text-[9px] p-4 opacity-40">TOTAL TAHUNAN</td>
                  <td className="text-amber-400 font-mono text-right p-4 text-xs">{formatRupiah(stats.tR)}</td>
                  <td className="text-white font-mono text-center p-4 text-xs">{stats.tV.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        <div className="glass p-6 rounded-3xl shadow-lg border border-white/5">
          <h3 className="text-[10px] font-bold mb-4 uppercase opacity-50 flex justify-between items-center">
            Realisasi {filter.category}
            <span className="text-[8px] bg-white/5 px-2 py-1 rounded">Update di sini setiap akhir bulan</span>
          </h3>
          <div className="table-container max-h-[400px] overflow-y-auto custom-scrollbar">
            <table className="table table-xs w-full table-fixed border-separate border-spacing-y-2">
              <thead className="sticky top-0 bg-[#0f172a] border-b border-white/5 uppercase text-[9px] opacity-50 z-10">
                <tr>
                  <th className="w-[20%] p-3">Bulan</th>
                  <th className="w-[40%] p-3 text-right">Real Rev (Rp)</th>
                  <th className="w-[25%] p-3 text-center">Real Visit</th>
                  <th className="w-[15%] p-3 text-center">%</th>
                </tr>
              </thead>
              <tbody>
                {MONTHS.map(m => {
                  const d = tempData[filter.category]?.[m] || {tr:0,tv:0,rr:0,rv:0};
                  const ach = d.tr > 0 ? (d.rr / d.tr) * 100 : 0;
                  return (
                    <tr key={m} className={`${m === currentMonth ? 'bg-emerald-500/10' : 'bg-white/[0.02]'} rounded-xl transition-colors`}>
                      <td className="font-bold opacity-80 p-3">
                        <div className="flex items-center gap-2">
                          {m} {m === currentMonth && <span className="badge badge-xs badge-success border-none font-black text-[7px]">NOW</span>}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col items-end">
                          <input 
                            type="number" 
                            value={d.rr} 
                            onChange={(e) => updateField(m, 'rr', e.target.value)}
                            readOnly={!canModify}
                            className={`input input-sm bg-black/40 w-full font-mono text-emerald-400 font-bold text-right border-white/5 focus:border-emerald-500/50 ${!canModify ? 'cursor-not-allowed opacity-70' : ''}`} 
                          />
                          <span className="text-[9px] text-emerald-200 font-black mt-1.5 drop-shadow-sm">{formatRupiah(d.rr)}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <input 
                          type="number" 
                          value={d.rv} 
                          onChange={(e) => updateField(m, 'rv', e.target.value)}
                          readOnly={!canModify}
                          className={`input input-sm bg-black/40 w-full font-mono text-blue-400 font-bold text-center border-white/5 focus:border-indigo-500/50 ${!canModify ? 'cursor-not-allowed opacity-70' : ''}`} 
                        />
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] font-black italic tracking-tighter ${ach >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {ach.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-white/5 font-black sticky bottom-0 z-10 backdrop-blur-md">
                <tr>
                  <td className="uppercase text-[9px] p-4 opacity-40">TOTAL TAHUNAN</td>
                  <td className="text-emerald-400 font-mono text-right p-4 text-xs">{formatRupiah(stats.rR)}</td>
                  <td className="text-blue-400 font-mono text-center p-4 text-xs">{stats.rV.toLocaleString()}</td>
                  <td className="text-white font-mono p-4 text-center text-xs">{stats.tR > 0 ? ((stats.rR / stats.tR) * 100).toFixed(1) : 0}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Keterangan & Sumber Data */}
      <div className="glass p-8 rounded-[2.5rem] border border-white/5 shadow-2xl bg-indigo-500/[0.02]">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
            <Activity size={20} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white italic tracking-tighter uppercase leading-none">Informasi Strategis & Target WIC</h3>
            <p className="text-[10px] font-bold opacity-30 uppercase tracking-widest mt-1">Panduan Monitoring Driver WIC 2026</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="bg-white/5 p-5 rounded-3xl border border-white/5">
              <h4 className="text-[10px] font-black uppercase text-indigo-400 mb-3 tracking-widest">📋 Catatan Penting</h4>
              <ul className="text-xs text-white/60 space-y-2 leading-relaxed">
                <li>• Target ditetapkan dari data WIlayah.</li>
                <li>• Evaluasi realisasi dilakukan setiap akhir bulan berjalan bersumber dari wilayah.</li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col justify-center">
            <div className="bg-emerald-500/10 p-6 rounded-3xl border border-emerald-500/20">
              <h4 className="text-[10px] font-black uppercase text-emerald-400 mb-3 tracking-widest">🔗 Sumber Data Target (Spreadsheet)</h4>
              <p className="text-xs text-white/50 mb-4 leading-relaxed">Anda bisa mengakses rincian spreadsheet target melalui tombol di bawah ini untuk referensi master data:</p>
              <a 
                href="https://docs.google.com/spreadsheets/d/105AWomnO-l1KR0KtQaLyuw7Tx1foufQs/edit?rtpof=true&gid=96979870#gid=96979870" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-emerald btn-sm rounded-xl font-bold w-full shadow-lg shadow-emerald-500/20"
              >
                BUKA SPREADSHEET TARGET <ExternalLink size={14} className="ml-2" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-8">
        {isAdmin && (
          <button 
            onClick={() => { onSave(tempData); alert('Data WIC Berhasil Disimpan!'); }} 
            className="btn btn-warning px-16 font-black italic tracking-tighter h-12 rounded-2xl shadow-xl shadow-amber-500/20 border-b-4 border-amber-600 active:border-b-0 hover:scale-[1.02] transition-all"
          >
            SIMPAN DATA WIC 2026
          </button>
        )}
      </div>

      {isExportModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box glass border border-white/10">
            <button onClick={() => setIsExportModalOpen(false)} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            <h3 className="font-bold text-lg mb-4 uppercase">Export Laporan WIC 2026</h3>
            <div className="form-control mb-4">
              <label className="label"><span className="label-text">Pilih Kategori Driver</span></label>
              <select 
                className="select select-bordered custom-select"
                value={exportFilter.cat}
                onChange={(e) => setExportFilter(p => ({ ...p, cat: e.target.value }))}
              >
                <option value="ALL">Semua Kategori</option>
                {WIC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-control mb-4">
              <label className="label"><span className="label-text">Pilih Periode</span></label>
              <select 
                className="select select-bordered custom-select"
                value={exportFilter.month}
                onChange={(e) => setExportFilter(p => ({ ...p, month: e.target.value }))}
              >
                <option value="ALL">Tahunan (Januari - Desember)</option>
                {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="modal-action">
              <button onClick={() => setIsExportModalOpen(false)} className="btn btn-ghost">Batal</button>
              <button onClick={generateWicPDF} className="btn btn-indigo font-bold text-white">UNDUH LAPORAN PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
