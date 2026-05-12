import React, { useState } from 'react';
import { Settings, FileUp, Download, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { TestLab, Panel } from '../types';
import { PRESET_PANELS } from '../constants';

interface LabSettingsProps {
  onImportTestLab: (data: TestLab[]) => Promise<any>;
  onImportPanel: (data: Panel[]) => Promise<any>;
  onDeleteAllTestLab: () => Promise<any>;
  onDeleteAllPanel: () => Promise<any>;
  permissions: { canAdd: boolean; canEdit: boolean; canDelete: boolean; isAdmin?: boolean };
}

export default function LabSettings({ onImportTestLab, onImportPanel, onDeleteAllTestLab, onDeleteAllPanel, permissions }: LabSettingsProps) {
  const canModify = permissions.canAdd || permissions.canEdit || permissions.canDelete || permissions.isAdmin;
  const canAdd = permissions.canAdd || permissions.isAdmin;
  const canDelete = permissions.canDelete || permissions.isAdmin;
  const [labFile, setLabFile] = useState<File | null>(null);
  const [panelFile, setPanelFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [previewType, setPreviewType] = useState<'LAB' | 'PANEL' | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(true);

  const findValue = (row: any, targetHeaders: string[]) => {
    const keys = Object.keys(row);
    const normalizedTargets = targetHeaders.map(h => h.toLowerCase().replace(/\s+/g, '').replace(/_/g, ''));
    
    // 1. Exact match (normalized)
    for (const key of keys) {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
      if (normalizedTargets.includes(normalizedKey)) {
        return row[key];
      }
    }
    
    // 2. Partial match (if target is in key or vice versa)
    for (const key of keys) {
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '').replace(/_/g, '');
      for (const target of normalizedTargets) {
        if (normalizedKey.includes(target) || target.includes(normalizedKey)) {
          return row[key];
        }
      }
    }
    
    return null;
  };

  const processFile = async (file: File, type: 'LAB' | 'PANEL') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Try to find a sheet that actually has data if the first one is empty
        let worksheet = null;
        let sheetName = "";
        
        for (const name of workbook.SheetNames) {
          const ws = workbook.Sheets[name];
          const json = XLSX.utils.sheet_to_json(ws);
          if (json.length > 0) {
            worksheet = ws;
            sheetName = name;
            break;
          }
        }

        if (!worksheet) {
          setStatus({ type: 'error', message: 'File Excel kosong atau tidak memiliki data.' });
          return;
        }

        console.log(`Processing sheet: ${sheetName}`);
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (json.length < 2) {
          setStatus({ type: 'error', message: 'File Excel tidak memiliki baris data yang cukup.' });
          return;
        }

        // Get headers from first row
        const headers = json[0].map(h => (h || '').toString().toLowerCase().replace(/\s+/g, '').replace(/_/g, ''));
        const rows = json.slice(1);

        const findIndex = (targets: string[]) => {
          const normalizedTargets = targets.map(t => t.toLowerCase().replace(/\s+/g, '').replace(/_/g, ''));
          // 1. Exact match
          for (let i = 0; i < headers.length; i++) {
            if (normalizedTargets.includes(headers[i])) return i;
          }
          // 2. Partial match
          for (let i = 0; i < headers.length; i++) {
            for (const t of normalizedTargets) {
              if (headers[i].includes(t) || t.includes(headers[i])) return i;
            }
          }
          return -1;
        };

        const parsePrice = (val: any) => {
          if (typeof val === 'number') return val;
          if (!val) return 0;
          const cleaned = val.toString().replace(/[^\d]/g, '');
          return Number(cleaned) || 0;
        };

        // Determine indexes for columns
        const nameIdx = type === 'LAB' 
          ? findIndex(['NAMA', 'TEST', 'PEMERIKSAAN', 'PAKET', 'DESCRIPTION']) 
          : findIndex(['NAMAPANEL', 'PANEL', 'NAMAPAKET', 'PAKET', 'KETERANGAN']);
        
        const priceIdx = findIndex(['HARGA', 'PRICE', 'TARIF', 'TOTAL', 'AMOUNT', 'RATE']);
        const detailsIdx = findIndex(['PEMERIKSAAN', 'LIST', 'KETERANGAN', 'DETAIL', 'DESKRIPSI']);

        const formattedData = rows.map((row: any[], idx: number) => {
          const id = `${type}-${Date.now()}-${idx}`;
          
          // Positional Mapping Fallback:
          // If name index not found, assume Column 1 (index 0)
          // If price index not found, assume Column 3 (index 2) or Last Column
          const finalNameIdx = nameIdx !== -1 ? nameIdx : 0;
          const finalPriceIdx = priceIdx !== -1 ? priceIdx : (row.length > 2 ? 2 : row.length - 1);
          const finalDetailsIdx = detailsIdx !== -1 ? detailsIdx : 1;

          const rawNama = row[finalNameIdx];
          const rawHarga = row[finalPriceIdx];
          const rawDetails = row[finalDetailsIdx];

          const namaStr = (rawNama || '').toString().toUpperCase().trim();
          const hargaNum = parsePrice(rawHarga);

          if (type === 'LAB') {
            return { id, nama: namaStr, harga: hargaNum };
          } else {
            return {
              id,
              nama: namaStr,
              pemeriksaan: (rawDetails || '').toString().trim(),
              harga: hargaNum
            };
          }
        }).filter(item => item.nama && item.nama.length > 0 && item.harga > 0);

        if (formattedData.length === 0) {
          setStatus({ type: 'error', message: 'Gagal mendeteksi data. Pastikan kolom pertama adalah Nama dan kolom harga sudah sesuai.' });
          return;
        }

        setPreviewData(formattedData);
        setPreviewType(type);
      } catch (err) {
        console.error('Excel processing error:', err);
        setStatus({ type: 'error', message: 'Gagal memproses file Excel.' });
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    if (!previewData || !previewType) return;

    try {
      if (replaceExisting) {
        if (!window.confirm("APAKAH ANDA YAKIN?\n\nOpsi 'Ganti Data Lama' dipilih. SELURUH DATA yang ada saat ini akan DIHAPUS dan digantikan dengan data baru.\n\nTindakan ini tidak bisa dibatalkan.")) {
          return;
        }
        
        if (previewType === 'LAB') {
          await onDeleteAllTestLab();
        } else {
          await onDeleteAllPanel();
        }
      }

      if (previewType === 'LAB') {
        await onImportTestLab(previewData);
      } else {
        await onImportPanel(previewData);
      }

      setStatus({ type: 'success', message: `Berhasil mengimpor ${previewData.length} data ${previewType === 'LAB' ? 'Test Lab' : 'Panel'}` });
      setPreviewData(null);
      setPreviewType(null);
      setLabFile(null);
      setPanelFile(null);
    } catch (err: any) {
      console.error("Gagal import:", err);
      setStatus({ type: 'error', message: 'Gagal menyimpan ke database: ' + (err.message || 'Error tidak diketahui') });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-4 bg-purple-500/20 rounded-3xl text-purple-400">
          <Settings size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Pengaturan Lab & Panel</h1>
          <p className="text-white/40 text-sm font-bold uppercase tracking-widest mt-1">Import & Manajemen Data Master</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Import Test Lab */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-[3.5rem] border border-blue-500/10 bg-blue-500/5"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
              <FileUp size={20} />
            </div>
            <h3 className="text-lg font-black text-white uppercase italic">Import Excel Test Lab</h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-6 border-2 border-dashed border-white/10 rounded-3xl bg-black/20 text-center">
              <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={(e) => setLabFile(e.target.files?.[0] || null)}
                className="hidden" 
                id="lab-upload"
              />
              <label htmlFor="lab-upload" className="cursor-pointer block">
                <p className="text-xs font-bold text-white/40 mb-2 uppercase">Klik untuk Pilih File Excel</p>
                <p className="text-[10px] text-white/20 italic">(Header: NAMA, HARGA)</p>
                {labFile && <p className="mt-4 text-blue-400 font-black text-xs">{labFile.name}</p>}
              </label>
            </div>
            {canAdd ? (
              <button 
                onClick={() => labFile && processFile(labFile, 'LAB')}
                disabled={!labFile}
                className={`btn btn-block rounded-2xl font-black italic tracking-widest ${labFile ? 'bg-blue-500 text-black shadow-lg shadow-blue-500/20' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
              >
                PROSES IMPORT TEST LAB
              </button>
            ) : (
              <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-center">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">Anda tidak memiliki izin untuk mengimpor data.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Import Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-8 rounded-[3.5rem] border border-emerald-500/10 bg-emerald-500/5"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <FileUp size={20} />
            </div>
            <h3 className="text-lg font-black text-white uppercase italic">Import Excel Panel</h3>
          </div>
          
          <div className="space-y-4">
            <div className="p-6 border-2 border-dashed border-white/10 rounded-3xl bg-black/20 text-center">
              <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={(e) => setPanelFile(e.target.files?.[0] || null)}
                className="hidden" 
                id="panel-upload"
              />
              <label htmlFor="panel-upload" className="cursor-pointer block">
                <p className="text-xs font-bold text-white/40 mb-2 uppercase">Klik untuk Pilih File Excel</p>
                <p className="text-[10px] text-white/20 italic">(Header: NAMA PANEL, PEMERIKSAAN, HARGA)</p>
                {panelFile && <p className="mt-4 text-emerald-400 font-black text-xs">{panelFile.name}</p>}
              </label>
            </div>
            {canAdd ? (
              <div className="space-y-3">
                <button 
                  onClick={() => panelFile && processFile(panelFile, 'PANEL')}
                  disabled={!panelFile}
                  className={`btn btn-block rounded-2xl font-black italic tracking-widest ${panelFile ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                >
                  PROSES IMPORT PANEL
                </button>
                <div className="divider opacity-10">ATAU</div>
                <button 
                  onClick={() => {
                    const data = PRESET_PANELS.map((p, idx) => ({
                      ...p,
                      id: `preset-panel-${Date.now()}-${idx}`
                    }));
                    setPreviewData(data);
                    setPreviewType('PANEL');
                  }}
                  className="btn btn-block bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/30 rounded-2xl font-black italic tracking-widest text-[10px]"
                >
                  <Sparkles size={14} className="mr-2" />
                  ISI DENGAN PRESET (65 DATA)
                </button>
              </div>
            ) : (
              <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-center">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">Anda tidak memiliki izin untuk mengimpor data.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {status && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mt-10 p-6 rounded-[2.5rem] border flex items-center gap-4 ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
        >
          {status.type === 'success' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          <p className="text-sm font-black uppercase italic tracking-wider">{status.message}</p>
          <button onClick={() => setStatus(null)} className="ml-auto text-[10px] font-black uppercase text-white/30 hover:text-white">Tutup</button>
        </motion.div>
      )}

      {/* Preview Section */}
      <AnimatePresence>
        {previewData && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="mt-10 glass rounded-[3.5rem] border border-white/10 p-10 bg-white/5"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tight flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${previewType === 'LAB' ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
                  Preview Data {previewType === 'LAB' ? 'Test Lab' : 'Panel'}
                </h3>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">{previewData.length} Baris data terdeteksi</p>
              </div>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                    className="checkbox checkbox-xs border-white/20 group-hover:border-amber-500 transition-colors"
                  />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest group-hover:text-white transition-colors">Ganti Data Lama</span>
                </label>
                <button 
                  onClick={() => { setPreviewData(null); setPreviewType(null); }}
                  className="btn btn-sm px-6 bg-white/5 hover:bg-white/10 text-white/40 border-none rounded-xl font-black italic text-[10px]"
                >
                  BATAL
                </button>
                <button 
                  onClick={handleConfirmImport}
                  className={`btn btn-sm px-8 ${previewType === 'LAB' ? 'bg-blue-500 text-black' : 'bg-emerald-500 text-black'} border-none rounded-xl font-black italic text-[10px] shadow-lg ${previewType === 'LAB' ? 'shadow-blue-500/20' : 'shadow-emerald-500/20'}`}
                >
                  KONFIRMASI SIMPAN KE {previewType}
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto rounded-3xl border border-white/5 custom-scrollbar">
              <table className="table w-full">
                <thead className="bg-white/5 sticky top-0">
                  <tr>
                    <th className="bg-transparent text-[10px] font-black uppercase text-white/30 py-4 pl-6">No</th>
                    <th className="bg-transparent text-[10px] font-black uppercase text-white/30 py-4">Nama</th>
                    {previewType === 'PANEL' && <th className="bg-transparent text-[10px] font-black uppercase text-white/30 py-4">Pemeriksaan</th>}
                    <th className="bg-transparent text-[10px] font-black uppercase text-white/30 py-4 text-right pr-6">Harga</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="border-t border-white/5 hover:bg-white/5">
                      <td className="text-[10px] font-mono text-white/20 pl-6">{idx + 1}</td>
                      <td className="text-xs font-bold text-white uppercase italic">{row.nama}</td>
                      {previewType === 'PANEL' && (
                        <td className="text-[10px] text-white/40 italic truncate max-w-xs">{row.pemeriksaan || '-'}</td>
                      )}
                      <td className="text-xs font-mono text-right pr-6 text-amber-500">Rp {row.harga.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-20 p-10 glass rounded-[3.5rem] border border-white/5">
        <h4 className="text-xs font-black text-white/40 uppercase tracking-[0.4em] mb-6 flex items-center gap-2">
          <Download size={14} /> Template Format Excel
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-4">
            <p className="text-[11px] font-black text-white/40 uppercase tracking-widest">Format Test Lab</p>
            <p className="text-sm text-white/60 leading-relaxed italic">
              Header: <span className="text-white font-black">NAMA</span>, <span className="text-white font-black">HARGA</span>
            </p>
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 font-mono text-[10px] text-white/40">
               <div className="border-b border-white/10 pb-2 mb-2 flex justify-between">
                 <span>NAMA</span>
                 <span>HARGA</span>
               </div>
               <div className="flex justify-between">
                 <span>GLUKOSA PUASA</span>
                 <span>25000</span>
               </div>
            </div>

            <p className="text-[11px] font-black text-white/40 uppercase tracking-widest mt-6">Format Panel</p>
            <p className="text-sm text-white/60 leading-relaxed italic">
              Header: <span className="text-white font-black">NAMA PANEL</span>, <span className="text-white font-black">PEMERIKSAAN</span>, <span className="text-white font-black">HARGA</span>
            </p>
            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 font-mono text-[10px] text-white/40">
               <div className="border-b border-white/10 pb-2 mb-2 flex justify-between gap-4">
                 <span className="w-1/3">NAMA PANEL</span>
                 <span className="w-1/3">PEMERIKSAAN</span>
                 <span className="w-1/3 text-right">HARGA</span>
               </div>
               <div className="flex justify-between gap-4">
                 <span className="w-1/3 italic truncate">PANEL WELLNESS</span>
                 <span className="w-1/3 truncate text-[8px]">Hematologi, Glukosa, ...</span>
                 <span className="w-1/3 text-right">750000</span>
               </div>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-2">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black text-amber-500 uppercase italic">⚠️ Peringatan</p>
              <p className="text-[11px] text-white/40 mt-1 italic leading-relaxed">Import akan menimpa data lama jika ID yang dihasilkan sama. Pastikan data sudah benar sebelum memproses.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
