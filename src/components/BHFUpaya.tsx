import React, { useState } from 'react';
import { HandHelping, Plus, Save, Trash2, Calendar, Users, Info, AlertCircle, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BHFUpaya, BHFIssue } from '../types';

interface BHFUpayaProps {
  data: BHFUpaya[];
  issues: BHFIssue[];
  groups: string[];
  onSave: (data: BHFUpaya) => void;
  onDelete: (id: string) => void;
  onSaveIssue: (issue: BHFIssue) => void;
  onDeleteIssue: (id: string) => void;
  userEmail?: string | null;
  permissions: { canAdd: boolean; canEdit: boolean; canDelete: boolean; isAdmin: boolean };
}

export default function BHFUpayaView({ 
  data, issues = [], groups, onSave, onDelete, onSaveIssue, onDeleteIssue, userEmail, permissions 
}: BHFUpayaProps) {
  const [showForm, setShowForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBatalModalOpen, setIsBatalModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<BHFUpaya | null>(null);
  const [batalReason, setBatalReason] = useState('');
  const [itemToBatal, setItemToBatal] = useState<BHFUpaya | null>(null);

  const [kelompok, setKelompok] = useState<string>(groups[0] || 'Kelompok 1');
  const [jenisUpaya, setJenisUpaya] = useState<string>('Sebar Flyer');
  const [jumlah, setJumlah] = useState<number>(0);
  const [keterangan, setKeterangan] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  // Issue Form State
  const [issueTanggal, setIssueTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [issueKendala, setIssueKendala] = useState('');
  const [issueSearchTerm, setIssueSearchTerm] = useState('');
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);

  // Action Plan specific state
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedIssueForAction, setSelectedIssueForAction] = useState<BHFIssue | null>(null);
  const [tempActionPlan, setTempActionPlan] = useState('');
  
  // Accordion states
  const [isPlanOpen, setIsPlanOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isIssuesOpen, setIsIssuesOpen] = useState(true);
  
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    // Check if format is already DD-MMM-YYYY
    if (/[0-9]{2}-[A-Z]{3}-[0-9]{4}/.test(dateStr)) return dateStr;
    const months = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGT", "SEP", "OKT", "NOV", "DES"];
    const [year, month, day] = dateStr.split("-");
    if (!year || !month || !day) return dateStr;
    const monthIdx = parseInt(month, 10) - 1;
    return `${day}-${months[monthIdx] || month}-${year}`;
  };

  // Debugging log to ensure data flow is captured
  React.useEffect(() => {
    console.log("BHF Issues Prop updated:", issues);
  }, [issues]);

  const resetForm = () => {
    setKelompok(groups[0] || 'Kelompok 1');
    setJenisUpaya('Sebar Flyer');
    setJumlah(0);
    setKeterangan('');
    setTanggal(new Date().toISOString().split('T')[0]);
    setEditingId(null);
    setShowForm(false);
    setShowIssueForm(false);
    setIsEditModalOpen(false);
    setIsBatalModalOpen(false);
    setIsDetailModalOpen(false);
    setSelectedDetail(null);
    setBatalReason('');
    setItemToBatal(null);
    
    // Reset Issue Form
    setIssueTanggal(new Date().toISOString().split('T')[0]);
    setIssueKendala('');
    setEditingIssueId(null);
    setIsActionModalOpen(false);
    setSelectedIssueForAction(null);
    setTempActionPlan('');
    setIssueSearchTerm(''); // Clear search on reset to ensure latest data is visible
  };

  const handleSaveIssue = async () => {
    if (!issueKendala.trim()) {
      alert("Harap isi deskripsi kendala");
      return;
    }

    // Generate a clean ID if not editing
    const issueId = editingIssueId || `issue_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    console.log('UI Action: Saving Issue', issueId);
    
    try {
      await onSaveIssue({
        id: issueId,
        tanggal: issueTanggal,
        kendala: issueKendala,
        // Keep existing action plan if editing
        actionPlan: editingIssueId ? (issues.find(i => i.id === editingIssueId)?.actionPlan || '') : '',
        petugas: userEmail || 'System',
        timestamp: new Date().toISOString()
      });
      
      console.log('UI Action: Issue Save triggered successfully');
      alert('Berhasil menyimpan Issue/Kendala!');
      resetForm();
    } catch (error) {
      console.error('UI Action: Failed to save issue', error);
    }
  };

  const handleEditIssue = (issue: BHFIssue) => {
    setIssueTanggal(issue.tanggal);
    setIssueKendala(issue.kendala);
    setEditingIssueId(issue.id);
    setShowIssueForm(true);
  };

  const handleSaveActionPlan = async () => {
    if (!selectedIssueForAction) return;
    
    try {
      await onSaveIssue({
        ...selectedIssueForAction,
        actionPlan: tempActionPlan,
        timestamp: new Date().toISOString()
      });
      alert('Berhasil memperbarui Action Plan!');
      resetForm();
    } catch (error) {
      console.error('UI Action: Failed to save action plan', error);
    }
  };

  const handleEdit = (item: BHFUpaya) => {
    setKelompok(item.kelompok);
    setJenisUpaya(item.jenisUpaya);
    setJumlah(item.jumlah);
    setKeterangan(item.keterangan || '');
    setTanggal(item.tanggal);
    setEditingId(item.id);
    setIsEditModalOpen(true);
  };

  const handleSave = () => {
    if (jumlah <= 0) {
      alert("Jumlah harus lebih dari 0");
      return;
    }

    onSave({
      id: editingId || `bhf_${Date.now()}`,
      kelompok,
      jenisUpaya,
      jumlah,
      keterangan,
      tanggal,
      petugas: userEmail || 'System',
      timestamp: new Date().toISOString(),
      status: 'PLAN'
    });
    resetForm();
  };

  const updateStatus = (item: BHFUpaya, newStatus: 'SELESAI' | 'BATAL', reason?: string) => {
    if (!item.id) {
      alert("ID Data tidak valid, coba refresh halaman.");
      return;
    }
    
    const updatedItem = {
      ...item,
      status: newStatus,
      alasanBatal: reason || item.alasanBatal || '',
      timestamp: new Date().toISOString()
    };
    
    if (onSave) {
      onSave(updatedItem);
    }
    
    // Explicitly reset the modal state
    setIsBatalModalOpen(false);
    setItemToBatal(null);
    setBatalReason('');
  };

  const planItems = data.filter(item => !item.status || item.status === 'PLAN').sort((a,b) => (b.tanggal || "").localeCompare(a.tanggal || ""));
  const historyItems = data.filter(item => item.status === 'SELESAI' || item.status === 'BATAL').sort((a,b) => (b.tanggal || "").localeCompare(a.tanggal || ""));

  const filteredIssues = (issues || []).filter(issue => {
    if (!issueSearchTerm) return true;
    const term = issueSearchTerm.toLowerCase();
    const kendala = (issue.kendala || '').toLowerCase();
    const actionPlan = (issue.actionPlan || '').toLowerCase();
    const tanggal = (issue.tanggal || '');
    return kendala.includes(term) || actionPlan.includes(term) || tanggal.includes(term);
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HandHelping size={16} className="text-emerald-500 animate-pulse" />
            <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest italic">Input Kegiatan</span>
          </div>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">UPAYA <span className="text-emerald-500">BHF / HKN</span></h2>
        </div>

        <button 
          onClick={() => setShowForm(true)}
          disabled={!permissions.canAdd}
          className="btn bg-emerald-500 hover:bg-emerald-600 text-black border-none px-8 rounded-2xl font-black italic uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
        >
          <Plus size={20} /> Tambah Upaya
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass p-8 rounded-[3rem] border border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-4">Upaya Kelompok</label>
                <select 
                  value={kelompok}
                  onChange={(e) => setKelompok(e.target.value)}
                  className="select select-bordered w-full h-14 bg-black/40 border-white/10 rounded-2xl text-white font-bold focus:border-emerald-500/50"
                >
                  {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-4">Jenis Upaya</label>
                <select 
                  value={jenisUpaya}
                  onChange={(e) => setJenisUpaya(e.target.value as any)}
                  className="select select-bordered w-full h-14 bg-black/40 border-white/10 rounded-2xl text-white font-bold focus:border-emerald-500/50"
                >
                  <option value="Sebar Flyer">Sebar Flyer</option>
                  <option value="Telpon">Telpon</option>
                  <option value="Voucher">Voucher</option>
                  <option value="WA Personal">WA Personal</option>
                  <option value="Spanduk">Spanduk</option>
                  <option value="Baliho">Baliho</option>
                  <option value="Umbul-umbul">Umbul-umbul</option>
                  <option value="Banner">Banner</option>
                  <option value="Stand / Booth">Stand / Booth</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Lain-lain">Lain-lain</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-4">Tanggal Upaya</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50" size={18} />
                  <input 
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="input input-bordered w-full h-14 pl-12 bg-black/40 border-white/10 rounded-2xl text-white font-bold focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-4">Jumlah</label>
                <input 
                  type="number"
                  value={jumlah}
                  onChange={(e) => setJumlah(Number(e.target.value))}
                  placeholder="0"
                  className="input input-bordered w-full h-14 bg-black/40 border-white/10 rounded-2xl text-white font-bold focus:border-emerald-500/50"
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-4">Keterangan Tambahan</label>
                <input 
                  type="text"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Misal: Lokasi sebar flyer..."
                  className="input input-bordered w-full h-14 bg-black/40 border-white/10 rounded-2xl text-white font-bold focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={resetForm} className="btn flex-1 bg-white/5 hover:bg-white/10 text-white border-none rounded-2xl font-black italic">BATAL</button>
              <button 
                onClick={handleSave}
                className="btn flex-[2] bg-emerald-500 hover:bg-emerald-600 text-black border-none rounded-2xl font-black italic tracking-widest"
              >
                <Save size={18} /> {editingId ? 'PERBARUI' : 'SIMPAN'} UPAYA
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TABLE 1: PLAN */}
      <div className="space-y-4">
        <button 
          onClick={() => setIsPlanOpen(!isPlanOpen)}
          className="flex items-center justify-between w-full group/header"
        >
          <div className="flex items-center gap-3 ml-6">
             <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Calendar size={14} className="text-blue-500" />
             </div>
             <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Daftar Rencana <span className="text-blue-500">(PLAN)</span></h3>
          </div>
          <div className="mr-6 transform transition-transform duration-300" style={{ transform: isPlanOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover/header:bg-white/10">
              <Plus size={14} className={`text-white transition-all ${isPlanOpen ? 'rotate-45' : ''}`} />
            </div>
          </div>
        </button>

        <AnimatePresence>
          {isPlanOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5">
                        <th className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-8 h-14">Tanggal</th>
                        <th className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kelompok</th>
                        <th className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Jenis Upaya</th>
                        <th className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Qty</th>
                        <th className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Keterangan</th>
                        <th className="text-right text-[10px] font-black text-slate-500 uppercase tracking-widest px-8">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {planItems.map((item) => (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-all">
                          <td className="px-8 font-mono text-xs text-white/60">{formatDate(item.tanggal)}</td>
                          <td>
                            <span className="text-[11px] font-black text-white uppercase italic">{item.kelompok}</span>
                          </td>
                          <td>
                            <button 
                              onClick={() => {
                                setSelectedDetail(item);
                                setIsDetailModalOpen(true);
                              }}
                              className="text-[11px] font-bold text-blue-400 uppercase tracking-tight bg-blue-500/5 px-3 py-1 rounded-full border border-blue-500/10 hover:bg-blue-500/20 transition-all cursor-pointer"
                            >
                              {item.jenisUpaya}
                            </button>
                          </td>
                          <td className="text-center font-mono text-lg font-black text-white">{item.jumlah}</td>
                          <td>
                            <span className="text-[10px] font-bold text-slate-500 uppercase italic max-w-xs truncate block">{item.keterangan || '-'}</span>
                          </td>
                          <td className="px-8 text-right">
                            <div className="flex justify-end gap-2">
                               <button 
                                 onClick={() => updateStatus(item, 'SELESAI')}
                                 className="btn btn-xs bg-emerald-500 hover:bg-emerald-600 text-black border-none rounded-lg font-black text-[9px] px-4"
                               >
                                 SELESAI
                               </button>
                               <button 
                                 onClick={() => {
                                   setItemToBatal(item);
                                   setIsBatalModalOpen(true);
                                 }}
                                 className="btn btn-xs bg-red-500 hover:bg-red-600 text-black border-none rounded-lg font-black text-[9px] px-4"
                               >
                                 BATAL
                               </button>
                               <button 
                                onClick={() => handleEdit(item)}
                                disabled={!permissions.canEdit}
                                className="btn btn-square btn-xs glass text-blue-400 hover:bg-blue-500 hover:text-white"
                               >
                                 <HandHelping size={12} />
                               </button>
                               <button 
                                onClick={() => {
                                  if (window.confirm("Hapus rencana ini?")) onDelete(item.id);
                                }}
                                disabled={!permissions.canDelete}
                                className="btn btn-square btn-xs glass text-red-500 hover:bg-red-600 hover:text-white border-white/5"
                               >
                                 <Trash2 size={12} />
                               </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {planItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-10 opacity-30 text-[10px] font-black uppercase italic tracking-widest">Tidak ada rencana tertunda</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* TABLE 2: HISTORY */}
      <div className="space-y-4 pt-8">
        <button 
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="flex items-center justify-between w-full group/header"
        >
          <div className="flex items-center gap-3 ml-6">
             <div className="w-8 h-8 rounded-xl bg-slate-500/10 flex items-center justify-center border border-slate-500/20">
                <Plus size={14} className="text-slate-400" />
             </div>
             <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Riwayat Aktivitas <span className="text-slate-500">(COMPLETED / CANCELED)</span></h3>
          </div>
          <div className="mr-6 transform transition-transform duration-300" style={{ transform: isHistoryOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover/header:bg-white/10">
              <Plus size={14} className={`text-white transition-all ${isHistoryOpen ? 'rotate-45' : ''}`} />
            </div>
          </div>
        </button>
        
        <AnimatePresence>
          {isHistoryOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="glass rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl opacity-80 transition-opacity hover:opacity-100">
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5">
                        <th className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-8 h-14">Tanggal</th>
                        <th className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kelompok</th>
                        <th className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Jenis Upaya</th>
                        <th className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Qty</th>
                        <th className="text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                        <th className="text-right text-[10px] font-black text-slate-500 uppercase tracking-widest px-8">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyItems.map((item) => (
                        <tr key={item.id} className={`border-b border-white/5 hover:bg-white/[0.02] transition-all ${item.status === 'BATAL' ? 'opacity-60' : ''}`}>
                          <td className="px-8 font-mono text-xs text-white/50">{formatDate(item.tanggal)}</td>
                          <td>
                            <span className="text-[11px] font-black text-white/60 uppercase italic">{item.kelompok}</span>
                          </td>
                          <td>
                            <button 
                              onClick={() => {
                                setSelectedDetail(item);
                                setIsDetailModalOpen(true);
                              }}
                              className={`text-[11px] font-bold uppercase tracking-tight px-3 py-1 rounded-full border transition-all cursor-pointer ${
                                item.status === 'SELESAI' ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/20' : 'text-red-400 bg-red-500/5 border-red-500/10 hover:bg-red-500/20'
                              }`}
                            >
                              {item.jenisUpaya}
                            </button>
                          </td>
                          <td className="text-center font-mono text-lg font-black text-white/70">{item.jumlah}</td>
                          <td className="text-center">
                            <div className="flex flex-col items-center">
                              <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                                item.status === 'SELESAI' ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'
                              }`}>
                                {item.status}
                              </span>
                              {item.alasanBatal && <span className="text-[8px] text-red-500 italic mt-1 max-w-[100px] truncate">{item.alasanBatal}</span>}
                            </div>
                          </td>
                          <td className="px-8 text-right">
                             <button 
                              onClick={() => {
                                if (window.confirm("Hapus riwayat ini?")) onDelete(item.id);
                              }}
                              disabled={!permissions.canDelete}
                              className="btn btn-square btn-xs glass text-slate-500 hover:bg-red-500 hover:text-white"
                             >
                               <Trash2 size={12} />
                             </button>
                          </td>
                        </tr>
                      ))}
                      {historyItems.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-10 opacity-30 text-[10px] font-black uppercase italic tracking-widest">Belum ada riwayat aktivitas</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* TABLE 3: ISSUES */}
      <div className="space-y-4 pt-12 pb-20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 ml-6">
          <button 
            onClick={() => setIsIssuesOpen(!isIssuesOpen)}
            className="flex items-center gap-3 transition-transform active:scale-95 group/header text-left"
          >
             <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-lg shadow-orange-500/5 group-hover/header:bg-orange-500/20">
                <AlertCircle size={18} className="text-orange-500" />
             </div>
             <div>
               <div className="flex items-center gap-2">
                 <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">TABEL <span className="text-orange-500">ISSUE & ACTION PLAN</span></h3>
                 <Plus size={16} className={`text-orange-500 transition-all duration-300 ${isIssuesOpen ? 'rotate-45' : ''}`} />
               </div>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Monitoring kendala lapangan & rencana tindak lanjut</p>
             </div>
          </button>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-64 group">
               <input 
                 type="text"
                 placeholder="Cari issue / action plan..."
                 value={issueSearchTerm}
                 onChange={(e) => setIssueSearchTerm(e.target.value)}
                 className="input input-sm w-full h-11 bg-white/5 border-white/10 rounded-xl pl-10 text-[10px] font-bold text-white focus:border-orange-500/50 transition-all placeholder:text-slate-600"
                />
                <Info size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-500 transition-colors" />
            </div>
            
            <button 
              onClick={() => {
                resetForm();
                setShowIssueForm(true);
              }}
              className="w-full md:w-auto btn btn-sm h-11 bg-orange-500 hover:bg-orange-600 text-black border-none rounded-xl font-black italic uppercase tracking-widest px-8 shadow-lg shadow-orange-500/10"
            >
              <Plus size={16} /> TAMBAH ISSUE
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isIssuesOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <AnimatePresence>
                {showIssueForm && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    className="glass p-8 rounded-[3rem] border border-orange-500/30 bg-orange-500/5 overflow-hidden shadow-2xl relative mb-4"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                      <AlertCircle size={80} className="text-orange-500" />
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
                          {editingIssueId ? <HandHelping size={20} /> : <Plus size={20} />}
                        </div>
                        <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">
                          {editingIssueId ? 'EDIT' : 'INPUT'} <span className="text-orange-500">KENDALA LAPANGAN</span>
                        </h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-4">Tanggal Kejadian</label>
                          <input 
                            type="date"
                            value={issueTanggal}
                            onChange={(e) => setIssueTanggal(e.target.value)}
                            className="input input-bordered w-full h-14 bg-black/40 border-white/10 rounded-2xl text-white font-bold focus:border-orange-500/50"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest ml-4">Issue / Kendala yang Dihadapi</label>
                            <input 
                              type="text"
                              value={issueKendala}
                              onChange={(e) => setIssueKendala(e.target.value)}
                              placeholder="Apa kendala atau masalahnya?"
                              className="input input-bordered w-full h-14 bg-black/40 border-white/10 rounded-2xl text-white font-bold focus:border-orange-500/50"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 mt-10">
                        <button onClick={resetForm} className="btn flex-1 bg-white/5 hover:bg-white/10 text-white border-none rounded-2xl font-black italic tracking-widest">BATAL</button>
                        <button 
                          onClick={handleSaveIssue}
                          className="btn flex-[3] bg-orange-500 hover:bg-orange-600 text-black border-none rounded-2xl font-black italic uppercase tracking-widest"
                        >
                          <Save size={18} /> {editingIssueId ? 'PERBARUI' : 'SIMPAN'} ISSUE
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="glass rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/5">
                        <th className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-8 h-16 text-center">Tanggal</th>
                        <th className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Issue / Kendala</th>
                        <th className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5">Action Plan</th>
                        <th className="text-right text-[10px] font-black text-slate-500 uppercase tracking-widest px-8">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIssues.map((issue) => (
                        <tr key={issue.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-all">
                          <td className="px-8 text-center py-6">
                             <span className="font-mono text-xs text-white/40 block">{formatDate(issue.tanggal)}</span>
                          </td>
                          <td className="max-w-xs md:max-w-sm">
                            <div className="flex items-start gap-3">
                               <div className="mt-1 w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                               <p className="text-[11px] font-bold text-white leading-relaxed italic">"{issue.kendala}"</p>
                            </div>
                          </td>
                          <td className="bg-emerald-500/[0.02]">
                            <div className="flex items-start gap-4">
                               <div className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                               <div className="flex-1">
                                  {issue.actionPlan ? (
                                     <p className="text-[11px] font-black text-emerald-400 leading-relaxed uppercase tracking-tight">
                                       {issue.actionPlan}
                                     </p>
                                  ) : (
                                     <button 
                                      onClick={() => {
                                        setSelectedIssueForAction(issue);
                                        setTempActionPlan('');
                                        setIsActionModalOpen(true);
                                      }}
                                      className="text-[9px] font-black text-slate-500 hover:text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2"
                                     >
                                       <Plus size={10} /> Tambah Action Plan
                                     </button>
                                  )}
                               </div>
                            </div>
                          </td>
                          <td className="px-8 text-right">
                            <div className="flex justify-end gap-2">
                               <button 
                                onClick={() => {
                                  setSelectedIssueForAction(issue);
                                  setTempActionPlan(issue.actionPlan || '');
                                  setIsActionModalOpen(true);
                                }}
                                className="btn btn-square btn-xs bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black border-none"
                                title="Tindak Lanjut / Action Plan"
                               >
                                 <Zap size={12} />
                               </button>
                               <button 
                                onClick={() => handleEditIssue(issue)}
                                disabled={!permissions.canEdit}
                                className="btn btn-square btn-xs glass text-blue-400 hover:bg-blue-500 hover:text-white"
                               >
                                 <HandHelping size={12} />
                               </button>
                               <button 
                                onClick={() => {
                                  if (window.confirm("Hapus catatan issue ini?")) onDeleteIssue(issue.id);
                                }}
                                disabled={!permissions.canDelete}
                                className="btn btn-square btn-xs glass text-slate-500 hover:bg-red-500 hover:text-white"
                               >
                                 <Trash2 size={12} />
                               </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredIssues.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-16 opacity-30">
                            <AlertCircle className="mx-auto mb-4 opacity-10" size={40} />
                            <p className="text-[11px] font-black uppercase italic tracking-[0.3em]">
                              {issueSearchTerm ? 'Tidak ada hasil pencarian' : 'Belum ada issue / kendala tercatat'}
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isActionModalOpen && selectedIssueForAction && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass rounded-[2.5rem] border border-emerald-500/30 overflow-hidden shadow-2xl"
            >
              <div className="bg-emerald-500 p-6 text-black flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap size={20} className="animate-pulse" />
                  <h3 className="text-xl font-black italic uppercase tracking-tighter">ACTION PLAN</h3>
                </div>
                <button onClick={resetForm} className="p-2 bg-black/10 rounded-full hover:bg-black/20 transition-all">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Issue / Kendala:</p>
                   <p className="text-sm font-bold text-white italic">"{selectedIssueForAction.kendala}"</p>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-4">Rencana Tindakan (Action Plan)</label>
                  <textarea 
                    value={tempActionPlan}
                    onChange={(e) => setTempActionPlan(e.target.value)}
                    placeholder="Tuliskan rencana tindakan untuk mengatasi kendala ini..."
                    className="textarea textarea-bordered w-full min-h-[120px] bg-black/40 border-white/10 rounded-2xl text-white font-medium focus:border-emerald-500/50"
                  />
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleSaveActionPlan}
                    className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-black border-none rounded-2xl font-black italic uppercase tracking-widest shadow-xl shadow-emerald-500/20"
                  >
                    SIMPAN ACTION PLAN
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isDetailModalOpen && selectedDetail && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass w-full max-w-lg p-10 rounded-[3.5rem] border border-white/10 relative z-10 shadow-2xl overflow-hidden"
            >
              <div className={`absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 ${selectedDetail.status === 'SELESAI' ? 'bg-emerald-500/10' : (selectedDetail.status === 'BATAL' ? 'bg-red-500/10' : 'bg-blue-500/10')} rounded-full blur-3xl`}></div>

              <div className="relative z-10">
                <div className="flex items-center gap-5 mb-8">
                  <div className={`w-16 h-16 rounded-2xl ${selectedDetail.status === 'SELESAI' ? 'bg-emerald-500/20 text-emerald-400' : (selectedDetail.status === 'BATAL' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-400')} flex items-center justify-center shadow-lg`}>
                    <Info size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Rincian Upaya</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-widest ${
                        selectedDetail.status === 'SELESAI' ? 'bg-emerald-500/10 text-emerald-500' : (selectedDetail.status === 'BATAL' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-400')
                      }`}>
                        {selectedDetail.status || 'PLAN'}
                      </span>
                      <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">ID: {selectedDetail.id}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-white/5 p-6 rounded-[2rem] border border-white/5 mb-6">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Jenis Upaya</p>
                    <p className="text-sm font-black text-white uppercase italic">{selectedDetail.jenisUpaya}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Kelompok</p>
                    <p className="text-sm font-black text-white uppercase italic">{selectedDetail.kelompok}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Jumlah / Qty</p>
                    <p className="text-lg font-black text-emerald-400 font-mono">{selectedDetail.jumlah}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Tanggal Kegiatan</p>
                    <p className="text-sm font-bold text-white/80 font-mono">{formatDate(selectedDetail.tanggal)}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="space-y-1.5 ml-2">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Keterangan Detail</p>
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                      <p className="text-xs text-white/70 leading-relaxed italic">{selectedDetail.keterangan || 'Tidak ada keterangan tambahan.'}</p>
                    </div>
                  </div>

                  {selectedDetail.status === 'BATAL' && selectedDetail.alasanBatal && (
                    <div className="space-y-1.5 ml-2">
                      <p className="text-[9px] font-black text-red-500/50 uppercase tracking-[0.2em]">Alasan Pembatalan</p>
                      <div className="p-4 bg-red-500/5 rounded-2xl border border-red-500/10">
                        <p className="text-xs text-red-400 leading-relaxed font-bold italic">"{selectedDetail.alasanBatal}"</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-white/20" />
                      <div>
                        <p className="text-[8px] font-black text-white/30 uppercase">Petugas</p>
                        <p className="text-[10px] font-bold text-white/60">{selectedDetail.petugas}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-white/20" />
                      <div>
                        <p className="text-[8px] font-black text-white/30 uppercase">Updated At</p>
                        <p className="text-[10px] font-bold text-white/60 font-mono">{selectedDetail.timestamp ? new Date(selectedDetail.timestamp).toLocaleString() : '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={resetForm}
                  className="btn btn-block bg-white/5 hover:bg-white/10 text-white border-none rounded-2xl font-black italic tracking-widest"
                >
                  TUTUP RINCIAN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass w-full max-w-xl p-8 rounded-[3.5rem] border border-white/10 relative z-10 shadow-2xl"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <HandHelping size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Edit Data Upaya</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Update existing achievement details</p>
                </div>
                <button 
                  onClick={resetForm}
                  className="ml-auto btn btn-ghost btn-circle text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-4">Kelompok</label>
                  <select 
                    value={kelompok}
                    onChange={(e) => setKelompok(e.target.value)}
                    className="select select-bordered w-full h-14 bg-black/40 border-white/10 rounded-2xl text-white font-bold focus:border-blue-500/50"
                  >
                    {groups.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-4">Jenis Upaya</label>
                  <select 
                    value={jenisUpaya}
                    onChange={(e) => setJenisUpaya(e.target.value as any)}
                    className="select select-bordered w-full h-14 bg-black/40 border-white/10 rounded-2xl text-white font-bold focus:border-blue-500/50"
                  >
                    <option value="Sebar Flyer">Sebar Flyer</option>
                    <option value="Telpon">Telpon</option>
                    <option value="Voucher">Voucher</option>
                    <option value="WA Personal">WA Personal</option>
                    <option value="Spanduk">Spanduk</option>
                    <option value="Baliho">Baliho</option>
                    <option value="Umbul-umbul">Umbul-umbul</option>
                    <option value="Banner">Banner</option>
                    <option value="Stand / Booth">Stand / Booth</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Lain-lain">Lain-lain</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-4">Tanggal</label>
                  <input 
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="input input-bordered w-full h-14 bg-black/40 border-white/10 rounded-2xl text-white font-bold focus:border-blue-500/50"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-4">Jumlah</label>
                  <input 
                    type="number"
                    value={jumlah}
                    onChange={(e) => setJumlah(Number(e.target.value))}
                    className="input input-bordered w-full h-14 bg-black/40 border-white/10 rounded-2xl text-white font-bold focus:border-blue-500/50 text-center"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-4">Keterangan</label>
                  <input 
                    type="text"
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Lokasi atau detail tambahan..."
                    className="input input-bordered w-full h-14 bg-black/40 border-white/10 rounded-2xl text-white font-bold focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button onClick={resetForm} className="btn flex-1 bg-white/5 hover:bg-white/10 text-white border-none rounded-2xl font-black italic">BATAL</button>
                <button 
                  onClick={handleSave}
                  className="btn flex-[2] bg-blue-500 hover:bg-blue-600 text-black border-none rounded-2xl font-black italic tracking-widest"
                >
                  <Save size={18} /> SIMPAN PERUBAHAN
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBatalModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass w-full max-w-md p-8 rounded-[3rem] border border-red-500/20 relative z-10 shadow-2xl bg-red-500/5"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Konfirmasi Batal</h3>
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest italic">Berikan alasan pembatalan upaya</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-black mb-1">Upaya Dicatat:</p>
                  <p className="text-xs text-white font-bold">{itemToBatal?.jenisUpaya} - {itemToBatal?.kelompok}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-red-500 uppercase tracking-widest ml-4">Alasan Pembatalan</label>
                  <textarea 
                    value={batalReason}
                    onChange={(e) => setBatalReason(e.target.value)}
                    placeholder="Contoh: Lokasi tidak memungkinkan / Cuaca buruk..."
                    className="textarea textarea-bordered w-full h-32 bg-black/40 border-white/10 rounded-2xl text-white font-bold focus:border-red-500/50 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button onClick={resetForm} className="btn flex-1 bg-white/5 hover:bg-white/10 text-white border-none rounded-xl font-black italic text-[10px]">KEMBALI</button>
                <button 
                  onClick={() => {
                    if (!batalReason.trim()) {
                      alert('Harap isi alasan pembatalan');
                      return;
                    }
                    if (itemToBatal) updateStatus(itemToBatal, 'BATAL', batalReason);
                  }}
                  className="btn flex-[2] bg-red-500 hover:bg-red-600 text-black border-none rounded-xl font-black italic tracking-widest text-[10px]"
                >
                  BATALKAN UPAYA
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
