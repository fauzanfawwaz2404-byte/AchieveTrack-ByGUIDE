import React, { useState, useMemo } from 'react';
import { UpayaCC } from '../types';
import { WIC_CATEGORIES, CETAK_ITEMS } from '../constants';
import { 
  HandHelping, FileText, Camera, Plus, Trash2, Edit, 
  Calendar, Info, MessageCircle, Phone, MapPin, 
  ChevronRight, AlertCircle, Sparkles, Send, Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface UpayaCCProps {
  data: UpayaCC[];
  setData: (data: UpayaCC[]) => void;
  saveUpaya: (u: UpayaCC) => void;
  deleteUpaya: (id: string) => void;
  categories: string[];
  setCategories: (cats: string[]) => void;
  userEmail?: string | null;
  permissions?: { canAdd: boolean, canEdit: boolean, canDelete: boolean, isAdmin: boolean };
}

export default function UpayaCCView({ data, saveUpaya, deleteUpaya, categories, setCategories, userEmail, permissions }: UpayaCCProps) {
  const isAdmin = permissions?.isAdmin || userEmail === 'fauzanfawwaz2404@gmail.com';
  const canAdd = permissions?.canAdd || isAdmin;
  const canEdit = permissions?.canEdit || isAdmin;
  const canDelete = permissions?.canDelete || isAdmin;
  const [filter, setFilter] = useState({ wicCategory: 'ALL', upayaCategory: 'ALL', startDate: '', endDate: '', searchTerm: '' });
  const [showModal, setShowModal] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomSrc, setZoomSrc] = useState("");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUpaya, setSelectedUpaya] = useState<UpayaCC | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printFilter, setPrintFilter] = useState({ wic: 'ALL', upaya: 'ALL', startDate: '', endDate: '' });

  const [currentUpaya, setCurrentUpaya] = useState<Partial<UpayaCC>>({
    category: 'WA PERSONAL',
    wicCategory: WIC_CATEGORIES[0],
    date: new Date().toISOString().split('T')[0],
    mainInfo: '',
    detail: '',
    jenisCetak: CETAK_ITEMS[0],
    qtyCetak: 0
  });

  const filteredData = useMemo(() => {
    return data.filter(u => {
      const matchWic = filter.wicCategory === 'ALL' || u.wicCategory === filter.wicCategory;
      const matchUp = filter.upayaCategory === 'ALL' || u.category === filter.upayaCategory;
      const matchStart = !filter.startDate || u.date >= filter.startDate;
      const matchEnd = !filter.endDate || u.date <= filter.endDate;
      
      const search = (filter.searchTerm || '').toLowerCase();
      const matchSearch = !search || 
        u.wicCategory.toLowerCase().includes(search) || 
        u.category.toLowerCase().includes(search) || 
        (u.mainInfo || '').toLowerCase().includes(search) || 
        (u.detail || '').toLowerCase().includes(search) ||
        (u.jenisCetak || '').toLowerCase().includes(search);

      return matchWic && matchUp && matchStart && matchEnd && matchSearch;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, filter]);

  const summary = useMemo(() => {
    return {
      wa: filteredData
        .filter(u => u.category === 'WA PERSONAL')
        .reduce((s, u) => s + (Number(u.qtyWA) || Number(u.mainInfo) || 0), 0),
      kunjungan: filteredData.filter(u => u.category === 'KUNJUNGAN').length,
      telpon: filteredData.filter(u => u.category === 'TELPON').reduce((s, u) => s + Number(u.mainInfo || 0), 0),
      cetakSarprom: filteredData
        .filter(u => u.category === 'CETAK SARANA PROMOSI')
        .reduce((s, u) => s + (Number(u.qtyCetak) || 0), 0),
      totalEntry: filteredData.length
    };
  }, [filteredData]);

  const handleSave = () => {
    if (!currentUpaya.category || !currentUpaya.wicCategory || !currentUpaya.date) return;
    
    // Check local permissions
    if (!currentUpaya.id && !canAdd) {
      alert("Anda tidak memiliki izin untuk menambah data.");
      return;
    }
    if (currentUpaya.id && !canEdit) {
      alert("Anda tidak memiliki izin untuk mengedit data.");
      return;
    }
    const rawUpaya: UpayaCC = {
      ...(currentUpaya as UpayaCC),
      id: (currentUpaya as UpayaCC).id || Date.now().toString(),
      timestamp: (currentUpaya as UpayaCC).timestamp || new Date().toISOString()
    };

    // Clean undefined values for RTDB compatibility
    const newUpaya = JSON.parse(JSON.stringify(rawUpaya));

    try {
      saveUpaya(newUpaya);
      setShowModal(false);
      alert('Log Upaya CC Berhasil Disimpan!');
    } catch (err: any) {
      alert('Gagal menyimpan Upaya: ' + err.message);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'photo') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCurrentUpaya(prev => ({ ...prev, [type]: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (id: string) => {
    if (!canDelete) {
      alert("Anda tidak memiliki izin untuk menghapus data.");
      return;
    }
    if (confirm('Hapus riwayat upaya ini?')) {
      deleteUpaya(id);
    }
  };

  const zoomImage = (src: string) => {
    setZoomSrc(src);
    setShowZoomModal(true);
  };

  const exportUpayaPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const selWic = printFilter.wic;
    const selUp = printFilter.upaya;
    const selStart = printFilter.startDate;
    const selEnd = printFilter.endDate;
    
    doc.setFillColor(245, 158, 11);
    doc.rect(0, 0, pageWidth, 4, 'F');
    
    doc.setFontSize(18); doc.setTextColor(0,0,0);
    doc.setFont("helvetica", "bold");
    doc.text('LAPORAN UPAYA CUSTOMER CARE 2026', 14, 20);
    
    doc.setFontSize(10); doc.setTextColor(100,100,100);
    doc.setFont("helvetica", "normal");
    doc.text(`Kategori Driver: ${selWic === 'ALL' ? 'Semua Kategori' : selWic}`, 14, 28);
    doc.text(`Jenis Upaya: ${selUp === 'ALL' ? 'Semua Upaya' : selUp}`, 14, 33);
    doc.text(`Periode: ${selStart || 'Awal'} s/d ${selEnd || 'Sekarang'}`, 14, 38);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 43);

    const pdfData = data
        .filter(u => {
            const matchWic = selWic === 'ALL' || u.wicCategory === selWic;
            const matchUp = selUp === 'ALL' || u.category === selUp;
            const matchStart = !selStart || u.date >= selStart;
            const matchEnd = !selEnd || u.date <= selEnd;
            return matchWic && matchUp && matchStart && matchEnd;
        })
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(u => [
            new Date(u.date).toLocaleDateString('id-ID'),
            u.wicCategory.toUpperCase(),
            u.category.toUpperCase(),
            u.category === 'CETAK SARANA PROMOSI' ? `${u.jenisCetak} - ${u.mainInfo}` : u.mainInfo,
            u.detail
        ]);

    autoTable(doc, {
        startY: 50,
        head: [['Tanggal', 'Driver', 'Jenis Upaya', 'Sarana & Info', 'Rincian']],
        body: pdfData,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: { 4: { cellWidth: 60 } },
        didDrawPage: (dt) => {
            const pageCount = doc.getNumberOfPages();
            doc.setFontSize(8); doc.setTextColor(150, 150, 150);
            doc.text(`Halaman ${pageCount}`, dt.settings.margin.left, pageHeight - 10);
            doc.text("POWERED BY GUIDE", pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
    });

    doc.save(`Laporan_Upaya_CC_${selWic}_${selUp}.pdf`);
    setShowPrintModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-(--text-color) uppercase tracking-tighter flex items-center gap-2">
          <HandHelping size={24} className="text-amber-400" /> Upaya <span className="text-amber-400">CC</span>
        </h2>
        <button 
          onClick={() => setShowPrintModal(true)}
          className="btn btn-sm btn-warning glass font-black text-[10px] uppercase shadow-lg border border-warning/30 h-10 px-6 rounded-xl"
        >
          <FileText size={16} className="mr-1" /> Export Laporan Upaya
        </button>
      </div>

      <div className="glass p-6 rounded-3xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end border-b-2 border-white/5">
        <div className="form-control">
          <label className="label-text text-[9px] font-bold opacity-40 uppercase mb-1">Driver WIC</label>
          <select 
            value={filter.wicCategory} 
            onChange={(e) => setFilter(p => ({ ...p, wicCategory: e.target.value }))}
            className="select select-sm custom-select w-full"
          >
            <option value="ALL">SEMUA DRIVER WIC</option>
            {WIC_CATEGORIES.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="form-control">
          <label className="label-text text-[9px] font-bold opacity-40 uppercase mb-1">Jenis Upaya</label>
          <select 
            value={filter.upayaCategory} 
            onChange={(e) => setFilter(p => ({ ...p, upayaCategory: e.target.value }))}
            className="select select-sm custom-select w-full"
          >
            <option value="ALL">SEMUA JENIS UPAYA</option>
            {categories.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>
        <div className="form-control">
          <label className="label-text text-[9px] font-bold opacity-40 uppercase mb-1">Mulai Tanggal</label>
          <input type="date" value={filter.startDate} onChange={(e) => setFilter(p => ({ ...p, startDate: e.target.value }))} className="input input-sm custom-select w-full" />
        </div>
        <div className="form-control">
          <label className="label-text text-[9px] font-bold opacity-40 uppercase mb-1">Sampai Tanggal</label>
          <input type="date" value={filter.endDate} onChange={(e) => setFilter(p => ({ ...p, endDate: e.target.value }))} className="input input-sm custom-select w-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-5 rounded-2xl border-l-4 border-amber-500 bg-amber-500/5">
          <p className="text-[10px] uppercase font-black text-(--text-color) opacity-40 mb-1">Ringkasan Upaya</p>
          <div className="text-xs space-y-1">
            <p className="text-(--text-color)">Ditemukan <span className="text-amber-400 font-bold">{summary.totalEntry}</span> riwayat upaya.</p>
            <p className="text-(--text-color) opacity-70">Periode: <span className="text-(--text-color) font-bold">{filter.startDate || 'Awal'}</span> s/d <span className="text-(--text-color) font-bold">{filter.endDate || 'Sekarang'}</span></p>
          </div>
        </div>
        <div className="glass p-5 rounded-2xl border-l-4 border-blue-500 bg-blue-500/5">
          <p className="text-[10px] uppercase font-black text-(--text-color) opacity-40 mb-1">Statistik Utama</p>
          <div className="grid grid-cols-3 gap-2 text-[11px]">
            <div><p className="text-(--text-color) opacity-50">Total WA</p><p className="text-lg font-bold text-blue-500">{summary.wa}</p></div>
            <div><p className="text-(--text-color) opacity-50">Kunjungan</p><p className="text-lg font-bold text-emerald-500">{summary.kunjungan}</p></div>
            <div><p className="text-(--text-color) opacity-50">Cetak Sarprom</p><p className="text-lg font-bold text-amber-500">{summary.cetakSarprom}</p></div>
          </div>
        </div>
        <div className="glass p-5 rounded-2xl border-l-4 border-purple-500 bg-purple-500/5">
          <p className="text-[10px] uppercase font-black text-(--text-color) opacity-40 mb-1">Informasi Lain</p>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
             <div><p className="text-(--text-color) opacity-50">Total Telpon</p><p className="text-lg font-bold text-purple-500">{summary.telpon}</p></div>
          </div>
        </div>
      </div>

      {canAdd && (
        <div className="glass p-8 rounded-3xl shadow-xl flex flex-col items-center justify-center border-b-4 border-amber-500">
          <p className="text-[11px] uppercase font-black opacity-40 mb-3 tracking-widest text-center">
              DRIVER: <span className="text-(--text-color) font-bold">{filter.wicCategory}</span> | UPAYA AKTIF: <span className="text-amber-400 font-bold">{filter.upayaCategory === 'ALL' ? 'SEMUA' : filter.upayaCategory}</span>
          </p>
          <button 
            onClick={() => {
              setCurrentUpaya({
                category: filter.upayaCategory === 'ALL' ? 'WA PERSONAL' : filter.upayaCategory,
                wicCategory: filter.wicCategory,
                date: new Date().toISOString().split('T')[0],
                mainInfo: '',
                detail: '',
                jenisCetak: CETAK_ITEMS[0],
                qtyCetak: 0
              });
              setShowModal(true);
            }} 
            className="btn btn-warning px-12 font-bold shadow-xl flex items-center gap-2"
          >
            <Plus size={18} /> MASUKAN UPAYA BARU
          </button>
        </div>
      )}

      <div className="glass p-8 rounded-3xl shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-sm font-bold text-(--text-color) uppercase flex items-center gap-2">
            <FileText size={18} className="text-amber-400" /> Daftar Riwayat Upaya
          </h3>
          <div className="relative w-full md:w-72">
            <input 
              type="text" 
              placeholder="Cari kata kunci..." 
              value={filter.searchTerm}
              onChange={(e) => setFilter(p => ({ ...p, searchTerm: e.target.value }))}
              className="input input-sm bg-black/20 border-white/10 rounded-xl w-full pl-10 focus:border-amber-500/50"
            />
            <Info size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table table-xs w-full">
            <thead className="uppercase text-[9px] opacity-40">
              <tr>
                <th>Tanggal</th>
                <th>Driver WIC</th>
                <th>Jenis Upaya</th>
                <th>Info Utama</th>
                <th>Detail Upaya</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(u => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td 
                    className="text-[10px] font-bold text-amber-400 cursor-pointer underline"
                    onClick={() => { setSelectedUpaya(u); setShowDetailModal(true); }}
                  >
                    {new Date(u.date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="text-[10px] font-black text-white/40 uppercase italic tracking-widest">{u.wicCategory}</td>
                  <td className="text-xs font-bold text-white/70 uppercase">
                    <span className={`badge badge-xs font-bold border-none bg-amber-400/10 text-amber-400 py-2`}>
                      {u.category}
                    </span>
                  </td>
                  <td className="text-white uppercase font-bold text-[10px]">
                    <div className="flex flex-col">
                      {u.category === 'CETAK SARANA PROMOSI' && u.jenisCetak && (
                        <span className="text-amber-500/60 lowercase italic font-medium">{u.jenisCetak} {u.qtyCetak ? `(${u.qtyCetak} pcs)` : ''}</span>
                      )}
                      <span>{u.mainInfo || '-'}</span>
                      {u.qtyWA && <span className="text-[9px] text-blue-400">Total WA: {u.qtyWA}</span>}
                    </div>
                  </td>
                  <td className="text-[10px] opacity-60 truncate max-w-xs">{u.detail || '-'}</td>
                  <td className="text-right whitespace-nowrap">
                    {(canEdit || canDelete) ? (
                      <>
                        {canEdit && (
                          <button onClick={() => { setCurrentUpaya(u); setShowModal(true); }} className="text-amber-400 hover:text-amber-300 mr-3">
                            <Edit size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDelete(u.id)} className="text-error hover:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="flex justify-end pr-2 text-slate-600">
                        <Bot size={14} className="opacity-30" />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 opacity-30 font-bold">Tidak ada data upaya...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDetailModal && selectedUpaya && (
        <div className="modal modal-open">
          <div className="modal-box glass border border-white/10">
            <button onClick={() => setShowDetailModal(false)} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            <h3 className="font-bold text-lg mb-4 uppercase text-amber-400">Rincian Upaya CC</h3>
            <div className="bg-black/30 p-5 rounded-2xl space-y-3 border border-white/10 text-sm">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] opacity-40 uppercase font-bold">Tanggal</p>
                      <p className="font-bold text-white text-xs">{selectedUpaya.date}</p>
                    </div>
                    <div>
                      <p className="text-[9px] opacity-40 uppercase font-bold">Driver WIC</p>
                      <p className="font-bold text-indigo-400 text-xs uppercase">{selectedUpaya.wicCategory}</p>
                    </div>
                </div>
                <div className="border-t border-white/5 pt-3">
                  <p className="text-[9px] opacity-40 uppercase font-bold text-amber-500 mb-1">Jenis Upaya</p>
                  <p className="font-bold text-amber-400 text-sm uppercase">
                    {selectedUpaya.category} {selectedUpaya.category === 'CETAK SARANA PROMOSI' && selectedUpaya.jenisCetak && `(${selectedUpaya.jenisCetak})`}
                  </p>
                </div>
                <div className="border-t border-white/5 pt-3">
                    <p className="text-[9px] opacity-40 uppercase font-bold mb-1">Informasi Utama</p>
                    <p className="text-white font-bold text-lg">{selectedUpaya.mainInfo}</p>
                </div>
                <div className="border-t border-white/5 pt-3">
                    <p className="text-[9px] opacity-40 uppercase font-bold mb-1">Rincian Upaya</p>
                    <p className="text-white/80 italic text-xs leading-relaxed">{selectedUpaya.detail || 'Tidak ada rincian.'}</p>
                </div>
            </div>
            {selectedUpaya.photo && (
              <img src={selectedUpaya.photo} className="mt-4 w-full rounded-xl cursor-zoom-in" onClick={() => zoomImage(selectedUpaya.photo!)} />
            )}
            {selectedUpaya.file && (
              <div className="mt-4 p-4 bg-amber-500/10 rounded-xl flex justify-between items-center">
                  <span className="text-[10px] font-bold text-amber-400 uppercase">Dokumen Pendukung</span>
                  <button className="btn btn-xs btn-warning font-bold" onClick={() => zoomImage(selectedUpaya.file!)}>LIHAT FILE</button>
              </div>
            )}
          </div>
        </div>
      )}

      {showZoomModal && (
        <div className="modal modal-open bg-black/90">
          <div className="modal-box max-w-5xl bg-transparent p-0 flex flex-col items-center">
            <button onClick={() => setShowZoomModal(false)} className="btn btn-sm btn-circle btn-error absolute right-4 top-4">✕</button>
            <img src={zoomSrc} className="max-w-full max-h-[85vh] rounded-lg shadow-2xl" />
          </div>
        </div>
      )}

      {showPrintModal && (
        <div className="modal modal-open">
          <div className="modal-box glass border border-white/10">
            <button onClick={() => setShowPrintModal(false)} className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            <h3 className="font-bold text-lg mb-4 uppercase">Cetak Laporan Upaya</h3>
            <div className="form-control mb-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="label-text text-[10px] font-bold opacity-50 mb-1">DARI TANGGAL</label>
                    <input type="date" className="input input-sm custom-select w-full" value={printFilter.startDate} onChange={e => setPrintFilter(p=>({...p, startDate: e.target.value}))} />
                  </div>
                  <div>
                    <label className="label-text text-[10px] font-bold opacity-50 mb-1">SAMPAI TANGGAL</label>
                    <input type="date" className="input input-sm custom-select w-full" value={printFilter.endDate} onChange={e => setPrintFilter(p=>({...p, endDate: e.target.value}))} />
                  </div>
                </div>
                <label className="label-text text-[10px] font-bold opacity-50 mb-1">PILIH DRIVER</label>
                <select className="select select-bordered custom-select mb-4" value={printFilter.wic} onChange={e => setPrintFilter(p=>({...p, wic: e.target.value}))}>
                  <option value="ALL">Semua Driver</option>
                  {WIC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <label className="label-text text-[10px] font-bold opacity-50 mb-1">PILIH JENIS UPAYA</label>
                <select className="select select-bordered custom-select" value={printFilter.upaya} onChange={e => setPrintFilter(p=>({...p, upaya: e.target.value}))}>
                  <option value="ALL">Semua Upaya</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div className="modal-action">
              <button className="btn btn-warning w-full font-bold" onClick={exportUpayaPDF}>UNDUH PDF</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal modal-open items-center justify-center bg-black/60 backdrop-blur-sm z-[100]">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="modal-box glass border border-white/10 max-w-xl p-0 overflow-hidden bg-(--bg-color)/95 rounded-[2.5rem] shadow-3xl max-h-[92vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500/30 via-amber-600/20 to-transparent p-5 border-b border-white/10 relative overflow-hidden flex-shrink-0">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none animate-pulse">
                    <Sparkles size={120} className="text-amber-400" />
                </div>
                <div className="absolute -left-10 -top-10 w-40 h-40 bg-amber-500/10 blur-[60px] rounded-full"></div>
                <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 flex items-center justify-center border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                            <HandHelping size={24} className="text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-(--text-color) italic tracking-tighter uppercase leading-none drop-shadow-lg">
                                {currentUpaya.id ? 'Perbarui Upaya' : 'Masukan Upaya Baru'}
                            </h3>
                            <p className="text-[9px] font-bold text-amber-500/80 uppercase tracking-[0.4em] mt-1 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-amber-500 animate-ping"></span>
                                Log Pelayanan CC
                            </p>
                        </div>
                    <button 
                        onClick={() => setShowModal(false)}
                        className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-(--text-color) opacity-50 hover:opacity-100 transition-all hover:bg-black/10"
                    >
                        ✕
                    </button>
                </div>
            </div>
            
            <div className="p-5 space-y-3 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="form-control">
                        <label className="text-[10px] font-black text-(--text-color) opacity-40 uppercase tracking-[0.3em] px-1 mb-1 ml-1 flex items-center gap-2">
                            <Send size={10} className="text-amber-500" /> Jenis Upaya
                        </label>
                        <select 
                            value={currentUpaya.category} 
                            onChange={e => {
                                const val = e.target.value;
                                setCurrentUpaya(p=>({
                                    ...p, 
                                    category: val,
                                    jenisCetak: val === 'CETAK SARANA PROMOSI' ? CETAK_ITEMS[0] : undefined
                                }));
                            }} 
                            className="select bg-black/5 border-black/10 text-(--text-color) font-bold h-12 rounded-xl focus:border-amber-500/50 w-full transition-all"
                        >
                            {categories.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                    </div>
                    <div className="form-control">
                            <label className="text-[10px] font-black text-(--text-color) opacity-40 uppercase tracking-[0.3em] px-1 mb-2 ml-1 flex items-center gap-2">
                                <Calendar size={10} className="text-blue-500" /> Tanggal
                            </label>
                            <input 
                                type="date" 
                                value={currentUpaya.date} 
                                onChange={e => setCurrentUpaya(p=>({...p, date: e.target.value}))} 
                                className="input bg-black/5 border-black/10 text-blue-600 font-bold h-12 rounded-xl focus:border-blue-500/50 w-full" 
                            />
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                      {currentUpaya.category?.toUpperCase() === 'CETAK SARANA PROMOSI' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          <div className="form-control">
                            <label className="text-[10px] font-black text-(--text-color) opacity-40 uppercase tracking-[0.3em] px-1 mb-2 ml-1 flex items-center gap-2">
                                <Sparkles size={10} className="text-amber-500" /> Jenis Cetakan
                            </label>
                            <select 
                                value={currentUpaya.jenisCetak || CETAK_ITEMS[0]} 
                                onChange={e => setCurrentUpaya(p=>({...p, jenisCetak: e.target.value}))} 
                                className="select bg-amber-500/5 border-amber-500/10 text-amber-500 font-bold h-12 rounded-xl focus:border-amber-500/50 w-full transition-all"
                            >
                                {CETAK_ITEMS.map(item => <option key={item} value={item}>{item}</option>)}
                            </select>
                          </div>
                          
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl space-y-3"
                          >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText size={14} className="text-amber-400" />
                                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Jumlah Cetak</p>
                                </div>
                                <span className="badge badge-xs bg-amber-500 text-black font-black px-2 py-1 border-none text-[8px]">TERHITUNG</span>
                            </div>
                            <input 
                                type="number" 
                                value={currentUpaya.qtyCetak || ''} 
                                onChange={e => setCurrentUpaya(p=>({...p, qtyCetak: parseInt(e.target.value) || 0}))} 
                                className="input bg-black/5 border-black/10 text-(--text-color) font-black h-12 rounded-xl focus:border-amber-500/50 w-full text-center text-xl" 
                                placeholder="0"
                            />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">
                      {(currentUpaya.category?.toUpperCase() === 'WA PERSONAL' || currentUpaya.category?.toUpperCase() === 'WA BLAST') && (
                        <motion.div 
                          key="qty-wa"
                          initial={{ opacity: 0, scale: 0.95, height: 0 }}
                          animate={{ opacity: 1, scale: 1, height: 'auto' }}
                          exit={{ opacity: 0, scale: 0.95, height: 0 }}
                          className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl space-y-3 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-[40px] -mr-12 -mt-12 rounded-full"></div>
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                        <Bot size={16} className="text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Jumlah WhatsApp</p>
                                        <p className="text-[8px] text-white/30 uppercase mt-1 tracking-tighter">Pesan Terkirim</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="badge badge-xs bg-blue-500 text-white font-black px-2 py-2 border-none">TERHITUNG</span>
                                </div>
                            </div>
                            <input 
                                type="number" 
                                min="1" 
                                value={currentUpaya.qtyWA || ''} 
                                onChange={e => setCurrentUpaya(p=>({...p, qtyWA: parseInt(e.target.value) || 0}))} 
                                className="input bg-black/5 border-black/10 text-(--text-color) font-black h-12 rounded-xl focus:border-blue-500/50 w-full text-center text-xl shadow-inner" 
                                placeholder="0"
                            />
                            <p className="text-[10px] text-(--text-color) opacity-30 font-medium italic text-center">* Akan otomatis diakumulasi ke dalam statistik Total WA.</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="form-control">
                        <label className="text-[10px] font-black text-(--text-color) opacity-40 uppercase tracking-[0.3em] px-1 mb-2 ml-1 flex items-center gap-2">
                            <Info size={10} className="text-purple-500" /> Informasi Utama
                        </label>
                        <input 
                            type="text" 
                            value={currentUpaya.mainInfo} 
                            onChange={e => setCurrentUpaya(p=>({...p, mainInfo:e.target.value}))} 
                            className="input bg-black/5 border-black/10 text-(--text-color) font-bold h-12 rounded-xl focus:border-purple-500/50 w-full p-4" 
                            placeholder="Contoh: broadcast promo lebaran..."
                        />
                    </div>

                    <div className="form-control">
                        <label className="text-[10px] font-black text-(--text-color) opacity-40 uppercase tracking-[0.3em] px-1 mb-2 ml-1 flex items-center gap-2">
                            <FileText size={10} className="text-emerald-500" /> Rincian Upaya & Respon
                        </label>
                        <textarea 
                            value={currentUpaya.detail} 
                            onChange={e => setCurrentUpaya(p=>({...p, detail:e.target.value}))} 
                            className="textarea bg-black/5 border-black/10 text-(--text-color) font-medium h-24 rounded-xl focus:border-emerald-500/50 w-full p-4" 
                            placeholder="Tuliskan respon pelanggan secara detail..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="form-control">
                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Camera size={10} /> Foto Bukti
                            </label>
                            <input type="file" onChange={e => handleFile(e, 'photo')} className="file-input file-input-bordered bg-black/40 border-white/10 file-input-sm w-full rounded-xl text-[10px]" />
                        </div>
                        <div className="form-control">
                            <label className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <FileText size={10} /> Dokumen PDF
                            </label>
                            <input type="file" onChange={e => handleFile(e, 'file')} className="file-input file-input-bordered bg-black/40 border-white/10 file-input-sm w-full rounded-xl text-[10px]" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 p-4 border-t border-white/5 bg-black/5">
                    <button 
                        onClick={() => setShowModal(false)}
                        className="btn h-12 flex-1 glass border-white/10 text-white font-black rounded-xl tracking-widest text-[10px]"
                    >
                        BATAL
                    </button>
                    <button 
                        onClick={handleSave}
                        className="btn h-11 flex-1 bg-gradient-to-r from-amber-500 to-amber-600 border-none text-black font-black rounded-xl shadow-2xl shadow-amber-500/30 tracking-widest text-[10px] hover:shadow-amber-500/50 transition-all uppercase"
                    >
                        SIMPAN PERUBAHAN
                    </button>
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
