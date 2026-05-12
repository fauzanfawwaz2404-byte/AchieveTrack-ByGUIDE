import React, { useState, useRef, useMemo, useEffect } from 'react';
import { BirthdayRecord, PatientRecord } from '../types';
import { 
  Users, Cake, Gift, Plus, Search, Trash2, Edit, Save, X, 
  MessageCircle, Upload, Download, Filter, Calendar, User, Phone, Tag,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckCircle2, XCircle, AlertCircle, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { User as FirebaseUser } from 'firebase/auth';

interface BirthdayManagerProps {
  records: BirthdayRecord[];
  onSave: (record: BirthdayRecord) => void;
  onSaveMany: (records: BirthdayRecord[]) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onViewPatient?: (idsispro: string, type: 'PCC' | 'RFM') => void;
  subView: string;
  user?: FirebaseUser | null;
  pccrfmRecords?: PatientRecord[];
  permissions?: { canAdd: boolean, canEdit: boolean, canDelete: boolean, isAdmin: boolean };
}

// Tracking shown status in a session-persistent way (resets on refresh)
const SHOWN_SESSIONS: { [key: string]: boolean } = {};

export default function BirthdayManager({ 
  records, onSave, onSaveMany, onDelete, onClearAll, onViewPatient, subView, user, pccrfmRecords, permissions 
}: BirthdayManagerProps) {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRecord, setEditingRecord] = useState<Partial<BirthdayRecord> | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [showIntersectionPop, setShowIntersectionPop] = useState(false);
  const [intersectionData, setIntersectionData] = useState<{name: string, type: string, idsispro: string}[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.email === 'fauzanfawwaz2404@gmail.com';

  // Global dates for consistent filtering and display
  const today = useMemo(() => new Date(), []);
  const tomorrow = useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() + 1);
    return d;
  }, [today]);

  const calculateAge = (dateStr: string) => {
    if (!dateStr) return 0;
    const birthDate = new Date(dateStr);
    if (isNaN(birthDate.getTime())) return 0;
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

// Logic for Special Pop-up (PCC/RFM intersection)
  useEffect(() => {
    if (subView === 'ultah-pelanggan-today' || subView === 'ultah-pelanggan-tomorrow') {
      // Don't show again if already shown for this subView in this page load
      if (SHOWN_SESSIONS[subView]) return;

      const targetDate = subView === 'ultah-pelanggan-today' ? today : tomorrow;
      
      // Find matches in birthdayRecords that match today/tomorrow
      const bdayMatches = records.filter(r => {
        if (!r.tglLahir) return false;
        const d = new Date(r.tglLahir);
        return d.getDate() === targetDate.getDate() && d.getMonth() === targetDate.getMonth();
      });

      // Cross-reference with pccrfmRecords using idsispro
      const matches: {name: string, type: string, idsispro: string}[] = [];
      if (pccrfmRecords && bdayMatches.length > 0) {
        pccrfmRecords.forEach(p => {
          const found = bdayMatches.find(b => b.idsispro === p.idsispro);
          if (found) {
            matches.push({
              name: p.nama,
              type: p.type, // PCC or RFM
              idsispro: p.idsispro
            });
          }
        });
      }

      if (matches.length > 0) {
        setIntersectionData(matches);
        setShowIntersectionPop(true);
        SHOWN_SESSIONS[subView] = true;
      }
    }
  }, [subView, pccrfmRecords, records, today, tomorrow]);

  // Filter based on subView memoized for performance
  const filteredRecords = useMemo(() => {
    const isToday = (dateStr: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
    };

    const isTomorrow = (dateStr: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      return d.getDate() === tomorrow.getDate() && d.getMonth() === tomorrow.getMonth();
    };

    let list = Array.isArray(records) ? records : [];
    if (subView === 'ultah-pelanggan-today') {
      list = list.filter(r => r && r.tglLahir && isToday(r.tglLahir));
    } else if (subView === 'ultah-pelanggan-tomorrow') {
      list = list.filter(r => r && r.tglLahir && isTomorrow(r.tglLahir));
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(r => r && (
        (r.nama?.toLowerCase() || '').includes(s) || 
        (r.idsispro?.toLowerCase() || '').includes(s) || 
        (r.noTelp || '').includes(s)
      ));
    }
    
    return list;
  }, [records, subView, searchTerm, today, tomorrow]);

  // Handle page reset on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, subView]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + itemsPerPage);

  const stats = useMemo(() => {
    if (!records || !Array.isArray(records)) {
      return { total: 0, today: 0, tomorrow: 0, sudahWA: 0, belumWA: 0 };
    }

    const isToday = (dateStr: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
    };

    const isTomorrow = (dateStr: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      return d.getDate() === tomorrow.getDate() && d.getMonth() === tomorrow.getMonth();
    };

    return {
      total: records.length,
      today: records.filter(r => isToday(r.tglLahir)).length,
      tomorrow: records.filter(r => isTomorrow(r.tglLahir)).length,
      sudahWA: records.filter(r => r.waStatus === 'Sudah').length,
      belumWA: records.filter(r => !r.waStatus || r.waStatus === 'Belum').length
    };
  }, [records, today, tomorrow]);

  const handleUpdateWAStatus = (record: BirthdayRecord, status: 'Sudah' | 'Belum') => {
    onSave({ ...record, waStatus: status });
  };

  const handleSave = () => {
    if (!editingRecord?.nama || !editingRecord?.idsispro || !editingRecord?.tglLahir || !editingRecord?.noTelp) {
      alert('Mohon lengkapi semua data wajib.');
      return;
    }

    const record: BirthdayRecord = {
      id: editingRecord.id || Date.now().toString(),
      title: (editingRecord.title as 'Ibu' | 'Bapak') || 'Ibu',
      idsispro: editingRecord.idsispro,
      nama: editingRecord.nama,
      tglLahir: editingRecord.tglLahir,
      noTelp: editingRecord.noTelp,
      timestamp: editingRecord.timestamp || new Date().toISOString()
    };

    onSave(record);
    setShowModal(false);
    setEditingRecord(null);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const newRecords: BirthdayRecord[] = jsonData.map((row: any) => {
        // Handle Excel Date format vs String format
        let dateVal = row['TANGGAL LAHIR'] || row.tgl_lahir;
        let formattedDate = '';
        
        if (dateVal instanceof Date) {
          formattedDate = dateVal.toISOString().split('T')[0];
        } else if (typeof dateVal === 'string') {
          // Try to parse "08 September 2013" or similar
          const parsed = new Date(dateVal);
          if (!isNaN(parsed.getTime())) {
            formattedDate = parsed.toISOString().split('T')[0];
          } else {
             formattedDate = new Date().toISOString().split('T')[0];
          }
        } else if (typeof dateVal === 'number') {
           // Excel serial date
           const parsed = new Date((dateVal - (25567 + 2)) * 86400 * 1000);
           formattedDate = parsed.toISOString().split('T')[0];
        }

        return {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          title: row.Title || row.title || 'Ibu',
          idsispro: String(row['ID SISPRO'] || row.idsispro || ''),
          nama: String(row.NAMA || row.nama || ''),
          tglLahir: formattedDate || new Date().toISOString().split('T')[0],
          noTelp: String(row['NOMOR TELPON'] || row.no_telp || ''),
          timestamp: new Date().toISOString()
        };
      }).filter(r => r.nama && r.idsispro);

      if (newRecords.length > 0) {
        onSaveMany(newRecords);
        alert(`Berhasil mengimpor ${newRecords.length} data.`);
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openWhatsApp = (record: BirthdayRecord) => {
     let phone = record.noTelp.replace(/[^0-9]/g, '');
     if (phone.startsWith('0')) phone = '62' + phone.substring(1);
     
     const message = `Selamat ulang tahun ${record.title} ${record.nama} semoga ${record.title} dan keluarga selalu dalam keadaan sehat. Manfaatkan keringanan biaya 15% di Prodia cabang Depok Berlaku selama bulan ini. Tunjukkan info ini saat melakukan pemeriksaan di Prodia Depok.

Salam sehat

Prodia Depok
Fauzan`;

     window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const deleteRecord = (id: string) => {
    if (confirm('Hapus data ulang tahun ini?')) {
      onDelete(id);
    }
  };

  const handleClearAll = () => {
    if (confirm('APAKAH ANDA YAKIN INGIN MENGHAPUS SELURUH DATA ULANG TAHUN? Tindakan ini tidak dapat dibatalkan.')) {
      onClearAll();
    }
  };

  const downloadTemplate = () => {
    const template = [
      { 'Title': 'Ibu', 'ID SISPRO': '12345', 'NAMA': 'Contoh Pasien', 'TANGGAL LAHIR': '1990-01-01', 'NOMOR TELPON': '08123456789' }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Template_Ultah_Pelanggan.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="glass p-6 rounded-3xl border border-white/5 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden"
         >
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Users size={64} className="text-white" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">Total Pelanggan</p>
            <p className="text-4xl font-black font-display text-(--text-color)">{stats.total}</p>
            <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-blue-400 uppercase tracking-widest px-3 py-1 bg-blue-500/10 rounded-full w-fit">
               <Filter size={10} /> Database Terdaftar
            </div>
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="glass p-6 rounded-3xl border border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-transparent relative overflow-hidden"
         >
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Cake size={64} className="text-pink-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-pink-500/40 mb-1">Ultah Hari Ini</p>
            <p className="text-4xl font-black font-display text-pink-500">{stats.today}</p>
            <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-pink-400 uppercase tracking-widest px-3 py-1 bg-pink-500/10 rounded-full w-fit">
               <Calendar size={10} /> {today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
            </div>
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="glass p-6 rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent relative overflow-hidden"
         >
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <Gift size={64} className="text-amber-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/40 mb-1">Ultah Besok</p>
            <p className="text-4xl font-black font-display text-amber-500">{stats.tomorrow}</p>
            <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-amber-400 uppercase tracking-widest px-3 py-1 bg-amber-500/10 rounded-full w-fit">
               <Calendar size={10} /> {tomorrow.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
            </div>
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="glass p-6 rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent relative overflow-hidden"
         >
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <CheckCircle2 size={64} className="text-emerald-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500/40 mb-1">Sudah Di WA</p>
            <p className="text-4xl font-black font-display text-emerald-500">{stats.sudahWA}</p>
            <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-emerald-400 uppercase tracking-widest px-3 py-1 bg-emerald-500/10 rounded-full w-fit">
               <CheckCircle2 size={10} /> Selesai Dihubungi
            </div>
         </motion.div>

         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.4 }}
           className="glass p-6 rounded-3xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent relative overflow-hidden"
         >
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <XCircle size={64} className="text-rose-500" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500/40 mb-1">Belum Di WA</p>
            <p className="text-4xl font-black font-display text-rose-500">{stats.belumWA}</p>
            <div className="mt-4 flex items-center gap-2 text-[9px] font-bold text-rose-400 uppercase tracking-widest px-3 py-1 bg-rose-500/10 rounded-full w-fit">
               <AlertCircle size={10} /> Belum di WA
            </div>
         </motion.div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-(--text-color) uppercase tracking-tighter flex items-center gap-2">
          {subView === 'ultah-pelanggan-today' ? <Cake size={24} className="text-pink-500" /> : 
           subView === 'ultah-pelanggan-tomorrow' ? <Gift size={24} className="text-pink-400" /> : 
           <Users size={24} className="text-pink-400" />}
          {subView === 'ultah-pelanggan-today' ? <>Data Ultah <span className="text-pink-500">Hari Ini</span></> : 
           subView === 'ultah-pelanggan-tomorrow' ? <>Data Ultah <span className="text-pink-400">Besok</span></> : 
           <>Manajemen <span className="text-pink-400">Database Ultah</span></>}
        </h2>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
           <div className="relative flex-grow md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input 
                type="text" 
                placeholder="Cari pasien..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-sm h-11 w-full pl-10 bg-white/5 border-white/10 rounded-xl focus:border-pink-500 transition-all font-bold text-xs"
              />
           </div>
           
           {subView === 'ultah-pelanggan-all' && (
             <div className="flex flex-wrap gap-2">
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleImport} 
                 accept=".xlsx, .xls" 
                 className="hidden" 
               />
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="btn glass btn-sm h-11 px-4 rounded-xl font-black text-[10px] tracking-widest uppercase"
                 title="Import Excel"
               >
                 <Upload size={18} className="mr-1" /> Import
               </button>
               <button 
                 onClick={downloadTemplate}
                 className="btn glass btn-sm h-11 px-4 rounded-xl font-black text-[10px] tracking-widest uppercase"
                 title="Download Template"
               >
                 <Download size={18} className="mr-1" /> Template
               </button>
               <button 
                 onClick={() => {
                   setEditingRecord({ title: 'Ibu' });
                   setShowModal(true);
                 }}
                 className="btn btn-primary h-11 px-6 rounded-xl font-black text-[10px] tracking-widest uppercase shadow-lg shadow-pink-500/20"
               >
                 <Plus size={18} className="mr-1" /> Tambah
               </button>
               {isAdmin && (
                 <button 
                   onClick={handleClearAll}
                   className="btn btn-error btn-outline h-11 px-4 rounded-xl font-black text-[10px] tracking-widest uppercase"
                   title="Hapus Semua Data"
                 >
                   <Trash2 size={18} className="mr-1" /> Kosongkan
                 </button>
               )}
             </div>
           )}
        </div>
      </div>

      <div className="glass p-8 rounded-[2.5rem] shadow-xl border border-white/5">
        <div className="overflow-x-auto">
          <table className="table table-xs w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="bg-black/20 text-white/40 uppercase text-[10px] tracking-[0.2em]">
                <th className="p-4 rounded-l-2xl">Pasien</th>
                <th className="p-4 border-l border-white/5">ID SISPRO</th>
                <th className="p-4 border-l border-white/5">Tgl Lahir & Usia</th>
                <th className="p-4 border-l border-white/5">No Telpon</th>
                <th className="p-4 border-l border-white/5 text-center">Keterangan</th>
                <th className="p-4 rounded-r-2xl text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map(record => (
                <motion.tr 
                  layout
                  key={record.id} 
                  className="group hover:bg-white/5 transition-all text-(--text-color)"
                >
                  <td className="p-4 bg-white/[0.02] rounded-l-2xl border-y border-white/5">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                          <User size={18} className="text-pink-400" />
                       </div>
                       <div>
                          <p className="text-[10px] opacity-40 font-black uppercase tracking-widest">{record.title}</p>
                          <p className="font-black italic uppercase tracking-tighter text-sm">{record.nama}</p>
                       </div>
                    </div>
                  </td>
                  <td className="p-4 bg-white/[0.02] border-y border-white/5">
                    <span className="font-bold text-xs opacity-60 font-mono tracking-widest bg-black/20 px-2 py-1 rounded-lg">
                      {record.idsispro}
                    </span>
                  </td>
                  <td className="p-4 bg-white/[0.02] border-y border-white/5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                         <Calendar size={14} className="text-pink-500/50" />
                         {record.tglLahir && !isNaN(new Date(record.tglLahir).getTime()) ? (
                           <>
                             {new Date(record.tglLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                             <span className="text-[9px] opacity-30 ml-1">({new Date(record.tglLahir).getFullYear()})</span>
                           </>
                         ) : (
                           <span className="text-red-500">Format Salah</span>
                         )}
                      </div>
                      <div className="flex items-center gap-1.5 pl-5">
                         <Tag size={10} className="text-pink-400/40" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-pink-400">Usia: {calculateAge(record.tglLahir)} Tahun</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 bg-white/[0.02] border-y border-white/5">
                    <div className="flex items-center gap-2 text-[10px] font-bold opacity-60">
                       <Phone size={14} className="text-emerald-500/50" />
                       {record.noTelp}
                    </div>
                  </td>
                  <td className="p-4 bg-white/[0.02] border-y border-white/5 text-center">
                     <AnimatePresence mode="wait">
                       {!record.waStatus || record.waStatus === 'Belum' ? (
                         <motion.span 
                           key="belum"
                           initial={{ opacity: 0, scale: 0.8 }}
                           animate={{ opacity: 1, scale: 1 }}
                           exit={{ opacity: 0, scale: 0.8 }}
                           className="bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase tracking-[0.1em] px-2 py-1 rounded-full border border-rose-500/20 whitespace-nowrap inline-block"
                         >
                           BELUM WA
                         </motion.span>
                       ) : (
                         <motion.span 
                           key="sudah"
                           initial={{ opacity: 0, scale: 0.8 }}
                           animate={{ opacity: 1, scale: 1 }}
                           exit={{ opacity: 0, scale: 0.8 }}
                           className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-[0.1em] px-2 py-1 rounded-full border border-emerald-500/20 whitespace-nowrap inline-block"
                         >
                           SUDAH WA
                         </motion.span>
                       )}
                     </AnimatePresence>
                  </td>
                  <td className="p-4 bg-white/[0.02] rounded-r-2xl border-y border-white/5 text-right">
                    <div className="flex justify-end gap-2 flex-wrap min-w-[300px]">
                       <button 
                         onClick={() => openWhatsApp(record)}
                         className="btn btn-success btn-xs h-8 rounded-lg font-black text-[9px] uppercase tracking-widest"
                       >
                         <MessageCircle size={14} /> WhatsApp
                       </button>

                       {(() => {
                          const match = pccrfmRecords?.find(p => p.idsispro === record.idsispro);
                          if (match && onViewPatient) {
                            return (
                              <button 
                                onClick={() => onViewPatient(match.idsispro, match.type)}
                                className="btn btn-warning btn-xs h-8 rounded-lg font-black text-[9px] uppercase tracking-widest animate-pulse"
                                title={`Lihat Data ${match.type}`}
                              >
                                <ExternalLink size={14} /> {match.type}
                              </button>
                            );
                          }
                          return null;
                       })()}

                       <button 
                         onClick={() => handleUpdateWAStatus(record, 'Sudah')}
                         className={`btn btn-xs h-8 rounded-lg font-black text-[9px] uppercase tracking-widest ${record.waStatus === 'Sudah' ? 'btn-success opacity-50' : 'btn-outline border-emerald-500 text-emerald-500'}`}
                         disabled={record.waStatus === 'Sudah'}
                       >
                         <CheckCircle2 size={14} /> Sudah WA
                       </button>

                       <button 
                         onClick={() => handleUpdateWAStatus(record, 'Belum')}
                         className={`btn btn-xs h-8 rounded-lg font-black text-[9px] uppercase tracking-widest ${(!record.waStatus || record.waStatus === 'Belum') ? 'btn-error opacity-50' : 'btn-outline border-rose-500 text-rose-500'}`}
                         disabled={!record.waStatus || record.waStatus === 'Belum'}
                       >
                         <XCircle size={14} /> Belum WA
                       </button>

                       {isAdmin && (
                         <>
                           <button 
                             onClick={() => {
                               setEditingRecord(record);
                               setShowModal(true);
                             }}
                             className="btn btn-ghost btn-xs h-8 rounded-lg text-blue-500"
                           >
                             <Edit size={14} />
                           </button>
                           <button 
                             onClick={() => deleteRecord(record.id)}
                             className="btn btn-ghost btn-xs h-8 rounded-lg text-red-500"
                           >
                             <Trash2 size={14} />
                           </button>
                         </>
                       )}
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center opacity-20 font-black italic uppercase animate-pulse">
                    Tidak ada data ulang tahun yang ditemukan...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 pt-6 border-t border-white/5">
            <div className="text-[10px] font-black uppercase tracking-widest text-white/20">
              Menampilkan <span className="text-white/60">{startIndex + 1}</span> - <span className="text-white/60">{Math.min(startIndex + itemsPerPage, filteredRecords.length)}</span> dari <span className="text-pink-500">{filteredRecords.length}</span> data
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="btn btn-ghost btn-xs w-8 h-8 p-0 rounded-lg disabled:opacity-10"
              >
                <ChevronsLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn btn-ghost btn-xs w-8 h-8 p-0 rounded-lg disabled:opacity-10"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1 mx-2">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Halaman</span>
                <span className="text-sm font-black text-pink-500 bg-white/5 px-2 py-1 rounded-lg min-w-[2rem] text-center">{currentPage}</span>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">dari {totalPages}</span>
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-ghost btn-xs w-8 h-8 p-0 rounded-lg disabled:opacity-10"
              >
                <ChevronRight size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="btn btn-ghost btn-xs w-8 h-8 p-0 rounded-lg disabled:opacity-10"
              >
                <ChevronsRight size={16} />
              </button>
            </div>

            <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Baris per halaman:</span>
               <select 
                 value={itemsPerPage}
                 onChange={(e) => {
                   setItemsPerPage(Number(e.target.value));
                   setCurrentPage(1);
                 }}
                 className="select select-xs bg-white/5 border-none rounded-lg text-xs font-bold text-white/60 focus:ring-0"
               >
                 <option value={20}>20</option>
                 <option value={50}>50</option>
                 <option value={100}>100</option>
               </select>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {/* Intersection Pop-up */}
        {showIntersectionPop && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass p-8 rounded-[3rem] max-w-md w-full border border-amber-500/30 bg-(--bg-color)/95 shadow-3xl text-center"
            >
              <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-500/30 mx-auto mb-6">
                <AlertCircle className="text-amber-500" size={32} />
              </div>
              <h3 className="text-xl font-black text-(--text-color) italic tracking-tighter uppercase mb-4">
                Pemberitahuan Khusus
              </h3>
              <p className="text-xs font-bold text-white/60 mb-6 uppercase tracking-widest leading-relaxed">
                Ada Pasien <span className="text-amber-500">PCC / RFM</span> yang berulang tahun {subView === 'ultah-pelanggan-today' ? 'hari ini' : 'besok'}:
              </p>
              
              <div className="space-y-3 mb-8 max-h-48 overflow-y-auto px-2">
                {intersectionData.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{item.type}</p>
                      <p className="text-sm font-black uppercase tracking-tighter">{item.name}</p>
                    </div>
                    <div className="flex gap-2">
                      <p className="text-[9px] font-mono font-bold text-white/40">{item.idsispro}</p>
                      <button 
                        onClick={() => {
                          setShowIntersectionPop(false);
                          if (onViewPatient) onViewPatient(item.idsispro, item.type as 'PCC' | 'RFM');
                        }}
                        className="btn btn-xs btn-warning font-black text-[8px] uppercase tracking-widest"
                      >
                        LIHAT
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setShowIntersectionPop(false)}
                className="btn btn-warning w-full font-black text-[10px] tracking-widest h-14 rounded-2xl"
              >
                MENGERTI & LANJUT
              </button>
            </motion.div>
          </div>
        )}

        {showModal && (
          <div className="modal modal-open items-center justify-center bg-black/60 backdrop-blur-sm z-[100]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal-box glass border border-white/10 max-w-lg p-0 overflow-hidden bg-(--bg-color)/95 rounded-[2.5rem] shadow-3xl"
            >
              <div className="bg-gradient-to-r from-pink-500/30 via-pink-600/20 to-transparent p-8 border-b border-white/5 relative">
                  <div className="flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center border border-pink-500/30">
                              <Cake size={24} className="text-pink-400" />
                          </div>
                          <div>
                              <h3 className="text-xl font-black text-(--text-color) italic tracking-tighter uppercase leading-none">
                                {editingRecord?.id ? 'Edit Data Ultah' : 'Tambah Data Ultah'}
                              </h3>
                              <p className="text-[9px] font-bold text-pink-500/80 uppercase tracking-widest mt-1">Data Ulang Tahun Pelanggan</p>
                          </div>
                      </div>
                      <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
                  </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label-text text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 px-1">Title</label>
                    <select 
                      value={editingRecord?.title || 'Ibu'}
                      onChange={(e) => setEditingRecord(p => ({ ...p, title: e.target.value as 'Ibu' | 'Bapak' }))}
                      className="select bg-white/5 border-white/10 text-(--text-color) font-bold h-14 rounded-2xl focus:border-pink-500 transition-all"
                    >
                      <option value="Ibu" className="bg-slate-900">Ibu</option>
                      <option value="Bapak" className="bg-slate-900">Bapak</option>
                    </select>
                  </div>
                  <div className="form-control">
                    <label className="label-text text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 px-1">ID SISPRO</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: 12345" 
                      value={editingRecord?.idsispro || ''}
                      onChange={(e) => setEditingRecord(p => ({ ...p, idsispro: e.target.value }))}
                      className="input bg-white/5 border-white/10 text-(--text-color) font-bold h-14 rounded-2xl focus:border-pink-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label-text text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 px-1">Nama Pasien</label>
                  <input 
                    type="text" 
                    placeholder="Nama Lengkap..." 
                    value={editingRecord?.nama || ''}
                    onChange={(e) => setEditingRecord(p => ({ ...p, nama: e.target.value }))}
                    className="input bg-white/5 border-white/10 text-(--text-color) font-bold h-14 rounded-2xl focus:border-pink-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label-text text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 px-1">Tanggal Lahir</label>
                    <input 
                      type="date" 
                      value={editingRecord?.tglLahir || ''}
                      onChange={(e) => setEditingRecord(p => ({ ...p, tglLahir: e.target.value }))}
                      className="input bg-white/5 border-white/10 text-(--text-color) font-bold h-14 rounded-2xl focus:border-pink-500 transition-all"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label-text text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 px-1">Nomor Telpon</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: 08123456789" 
                      value={editingRecord?.noTelp || ''}
                      onChange={(e) => setEditingRecord(p => ({ ...p, noTelp: e.target.value }))}
                      className="input bg-white/5 border-white/10 text-(--text-color) font-bold h-14 rounded-2xl focus:border-pink-500 transition-all"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowModal(false)} className="btn flex-1 glass border-white/5 font-black uppercase text-[10px] tracking-widest h-14 rounded-2xl">Batal</button>
                  <button onClick={handleSave} className="btn flex-1 btn-primary bg-pink-500 border-pink-600 hover:bg-pink-600 font-black uppercase text-[10px] tracking-widest h-14 rounded-2xl shadow-xl shadow-pink-500/20 text-white">Simpan Data</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
