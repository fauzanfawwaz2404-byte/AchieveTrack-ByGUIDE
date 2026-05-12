import React, { useState, useEffect, memo } from 'react';
import { Folder, Search, Plus, Edit2, Trash2, X, FileText, Download, Upload, ZoomIn, ZoomOut, Maximize2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { WSHP } from '../types';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;

interface WSHPManagerProps {
  data: WSHP[];
  onSave: (item: WSHP) => void;
  onDelete: (id: string) => void;
  permissions: { canAdd: boolean; canEdit: boolean; canDelete: boolean; isAdmin?: boolean };
}

export default function WSHPManager({ data, onSave, onDelete, permissions }: WSHPManagerProps) {
  const canAdd = permissions.canAdd || permissions.isAdmin;
  const canEdit = permissions.canEdit || permissions.isAdmin;
  const canDelete = permissions.canDelete || permissions.isAdmin;

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ name: string; data: string } | null>(null);
  const [editingItem, setEditingItem] = useState<WSHP | null>(null);
  const [formData, setFormData] = useState({ judul: '', nomorDokumen: '' });
  const [fileData, setFileData] = useState<{ name: string; data: string } | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (previewFile) {
      // Create blob URL for more stable preview especially on mobile
      try {
        const parts = previewFile.data.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
        const b64 = parts[1];
        const bytes = atob(b64);
        const u8arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
          u8arr[i] = bytes.charCodeAt(i);
        }
        const blob = new Blob([u8arr], { type: mime });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        return () => URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Blob creation failed:", e);
        setBlobUrl(previewFile.data);
      }
    } else {
      setBlobUrl(null);
    }
  }, [previewFile]);

  const filteredData = data.filter(item => 
    item.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nomorDokumen.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFileData({
        name: file.name,
        data: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  const [isSaving, setIsSaving] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul || !formData.nomorDokumen) return;

    setIsSaving(true);
    try {
      const newItem: WSHP = {
        id: editingItem?.id || `wshp_${Date.now()}`,
        judul: formData.judul.toUpperCase(),
        nomorDokumen: formData.nomorDokumen.toUpperCase(),
        file: fileData || editingItem?.file,
        timestamp: editingItem?.timestamp || new Date().toISOString()
      };

      await onSave(newItem);
      closeModal();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ judul: '', nomorDokumen: '' });
    setFileData(null);
  };

  const openEdit = (item: WSHP) => {
    setEditingItem(item);
    setFormData({ 
      judul: item.judul, 
      nomorDokumen: item.nomorDokumen
    });
    setFileData(item.file || null);
    setIsModalOpen(true);
  };

  const openInNewTab = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-8 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="p-3 md:p-4 bg-amber-500/20 rounded-2xl md:rounded-3xl text-amber-400 shadow-lg shadow-amber-500/10 shrink-0">
            <Folder size={24} className="md:w-8 md:h-8" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black text-white italic uppercase tracking-tighter">WSHP Manager</h1>
            <p className="text-white/40 text-[10px] md:text-sm font-bold uppercase tracking-widest mt-0.5 md:mt-1">Pengelolaan Dokumen WSHP</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative group w-full sm:w-64 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="CARI DOKUMEN..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-10 h-12 w-full bg-white/5 hover:bg-white/10 rounded-xl md:rounded-2xl border border-white/10 focus:border-amber-500/50 text-white font-black text-[10px] md:text-xs uppercase tracking-widest placeholder:text-white/20 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
          
          {canAdd && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn h-12 md:h-14 px-6 md:px-8 bg-amber-500 hover:bg-amber-600 text-black border-none rounded-xl md:rounded-2xl font-black italic text-xs tracking-widest flex items-center justify-center gap-2 group shadow-xl shadow-amber-500/20 shrink-0"
            >
              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
              TAMBAH FILE WSHP
            </button>
          )}
        </div>
      </div>

      {/* Desktop view (Table) */}
      <div className="hidden md:block glass rounded-[2.5rem] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full border-separate border-spacing-0">
            <thead className="bg-white/5">
              <tr>
                <th className="bg-transparent text-[10px] font-black text-white/40 uppercase tracking-widest py-6 pl-10">No</th>
                <th className="bg-transparent text-[10px] font-black text-white/40 uppercase tracking-widest py-6">Judul Dokumen</th>
                <th className="bg-transparent text-[10px] font-black text-white/40 uppercase tracking-widest py-6">Nomor Dokumen</th>
                <th className="bg-transparent text-[10px] font-black text-white/40 uppercase tracking-widest py-6">File</th>
                {(canEdit || canDelete) && <th className="bg-transparent text-[10px] font-black text-white/40 uppercase tracking-widest py-6 text-center pr-10">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => (
                <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 pl-10 border-t border-white/5">
                    <span className="text-xs font-mono text-white/20">{idx + 1}</span>
                  </td>
                  <td className="py-5 border-t border-white/5">
                    <p className="text-sm font-black text-white uppercase italic truncate max-w-md">
                      {item.judul}
                    </p>
                    <p className="text-[10px] text-white/40 uppercase mt-1 font-bold">
                      {new Date(item.timestamp).toLocaleDateString('id-ID')}
                    </p>
                  </td>
                  <td className="py-5 border-t border-white/5">
                    <span className="px-3 py-1 bg-amber-500/10 rounded-lg text-[10px] font-black text-amber-500 uppercase tracking-wider border border-amber-500/20">
                      {item.nomorDokumen}
                    </span>
                  </td>
                  <td className="py-5 border-t border-white/5">
                    {item.file ? (
                      <button 
                        onClick={() => setPreviewFile(item.file!)}
                        className="flex items-center gap-2 text-[10px] font-black text-amber-500 hover:text-amber-400 uppercase transition-colors"
                      >
                        <FileText size={14} />
                        LIHAT FILE
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-white/10 uppercase italic">No File</span>
                    )}
                  </td>
                  {(canEdit || canDelete) && (
                    <td className="py-5 border-t border-white/5 text-center pr-10">
                      <div className="flex items-center justify-center gap-2">
                        {canEdit && (
                          <button 
                            onClick={() => openEdit(item)}
                            className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-black transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            onClick={() => window.confirm('Hapus dokumen ini?') && onDelete(item.id)}
                            className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-black transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile view (Cards) */}
      <div className="md:hidden space-y-4">
        {filteredData.map((item, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            key={item.id}
            className="p-5 glass rounded-3xl border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-3 flex gap-2">
              {canEdit && (
                <button 
                  onClick={() => openEdit(item)}
                  className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center"
                >
                  <Edit2 size={12} />
                </button>
              )}
              {canDelete && (
                <button 
                  onClick={() => window.confirm('Hapus dokumen ini?') && onDelete(item.id)}
                  className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>

            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-black italic">{idx + 1}</span>
              </div>
              <div className="pr-16">
                <h3 className="text-sm font-black text-white uppercase italic leading-tight mb-1 break-words">{item.judul}</h3>
                <p className="text-[8px] font-black text-amber-500 tracking-wider uppercase bg-amber-500/5 px-2 py-0.5 rounded-md border border-amber-500/10 w-fit">
                  {item.nomorDokumen}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <span className="text-[10px] font-bold text-white/30 uppercase italic">{new Date(item.timestamp).toLocaleDateString('id-ID')}</span>
              {item.file ? (
                <button 
                  onClick={() => setPreviewFile(item.file!)}
                  className="flex items-center gap-2 bg-amber-500 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase italic shadow-lg shadow-amber-500/10"
                >
                  <FileText size={12} />
                  LIHAT FILE
                </button>
              ) : (
                <span className="text-[10px] font-black text-white/10 uppercase italic">TIDAK ADA FILE</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="p-12 md:p-20 text-center glass rounded-[2.5rem] border border-white/5 mt-4">
          <p className="text-[10px] md:text-xs font-black text-white/20 uppercase tracking-[0.4em] italic">Data tidak ditemukan / Kosong...</p>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass w-full max-w-md p-6 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white/10 relative z-10"
            >
              <h2 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tighter mb-6 md:mb-8">{editingItem ? 'Edit File WSHP' : 'Tambah File WSHP'}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div className="form-control">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block">Judul Dokumen</label>
                  <input 
                    type="text" 
                    value={formData.judul}
                    onChange={(e) => setFormData(p => ({ ...p, judul: e.target.value }))}
                    className="input w-full h-12 md:h-14 bg-white/5 border-white/10 rounded-xl md:rounded-2xl font-bold uppercase text-amber-500 focus:border-amber-500/50 text-sm"
                    placeholder="CONTOH: PANDUAN WORKSHOP"
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block">Nomor Dokumen</label>
                  <input 
                    type="text" 
                    value={formData.nomorDokumen}
                    onChange={(e) => setFormData(p => ({ ...p, nomorDokumen: e.target.value }))}
                    className="input w-full h-12 md:h-14 bg-white/5 border-white/10 rounded-xl md:rounded-2xl font-bold uppercase text-amber-500 focus:border-amber-500/50 text-sm"
                    placeholder="CONTOH: 001/WSHP/2026"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block">Upload File</label>
                  <div className="relative group overflow-hidden">
                    <input 
                      type="file" 
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    />
                    <div className="w-full h-20 md:h-24 bg-white/5 border-2 border-dashed border-white/10 group-hover:border-amber-500/30 rounded-xl md:rounded-2xl flex flex-col items-center justify-center gap-1 transition-all group-hover:bg-white/10">
                      <Upload size={20} className="text-white/20 group-hover:text-amber-500 transition-colors md:w-6 md:h-6" />
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest px-4 text-center truncate w-full">
                        {fileData ? fileData.name : 'PILIH FILE...'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 md:gap-4 pt-2 md:pt-4">
                  <button 
                    type="button"
                    onClick={closeModal}
                    className="btn flex-1 h-12 md:h-14 bg-white/5 text-white/50 hover:bg-white/10 border-none rounded-xl md:rounded-2xl font-black italic text-xs tracking-widest"
                  >
                    BATAL
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="btn flex-1 h-12 md:h-14 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 disabled:cursor-not-allowed text-black border-none rounded-xl md:rounded-2xl font-black italic text-xs tracking-widest shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        SIMPAN...
                      </>
                    ) : (
                      'SIMPAN'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {previewFile && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewFile(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass w-full max-w-6xl h-full md:h-[90vh] md:rounded-[3rem] border border-white/10 relative z-10 flex flex-col overflow-hidden"
            >
              <div className="p-4 md:p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                  <div className="p-2 md:p-3 bg-amber-500/20 rounded-xl md:rounded-2xl text-amber-500 shrink-0">
                    <FileText size={18} className="md:w-5 md:h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-sm md:text-lg font-black text-white italic uppercase tracking-tight truncate">{previewFile.name}</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Document Preview</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 shrink-0">
                  <button 
                    onClick={openInNewTab}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all shadow-lg"
                    title="Buka di Tab Baru"
                  >
                    <ExternalLink size={20} />
                  </button>
                  <button 
                    onClick={() => setPreviewFile(null)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all shadow-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-grow p-2 md:p-4 bg-transparent overflow-hidden">
                {previewFile.name.toLowerCase().endsWith('.pdf') ? (
                  <div className="w-full h-full flex flex-col">
                    {blobUrl && (
                      <div className="flex-grow flex flex-col items-center bg-black/20 rounded-3xl overflow-hidden relative">
                        <div className="flex-grow w-full overflow-auto flex justify-center p-4">
                          <Document
                            file={blobUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            loading={
                              <div className="flex flex-col items-center gap-4 py-20">
                                <span className="loading loading-spinner text-amber-500"></span>
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Memuat PDF...</p>
                              </div>
                            }
                            error={
                              <div className="p-10 text-center space-y-4">
                                <p className="text-red-500 font-bold uppercase text-xs">Gagal memuat PDF di HP ini.</p>
                                <button onClick={openInNewTab} className="btn btn-sm btn-outline text-white border-white/20">Buka Eksternal</button>
                              </div>
                            }
                          >
                            <Page 
                              pageNumber={pageNumber} 
                              scale={scale}
                              width={isMobile ? window.innerWidth - 60 : 600}
                              renderAnnotationLayer={false}
                              renderTextLayer={false}
                              className="shadow-2xl rounded-lg"
                            />
                          </Document>
                        </div>
                        
                        {numPages && numPages > 1 && (
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 shadow-2xl z-50">
                            <div className="flex items-center gap-2 border-r border-white/10 pr-3 mr-1">
                               <button onClick={() => setScale(s => Math.max(s - 0.2, 0.5))} className="p-1 hover:text-amber-500 transition-colors">
                                 <ZoomOut size={18} />
                               </button>
                               <span className="text-[10px] font-black w-10 text-center opacity-50">{(scale * 100).toFixed(0)}%</span>
                               <button onClick={() => setScale(s => Math.min(s + 0.2, 3.0))} className="p-1 hover:text-amber-500 transition-colors">
                                 <ZoomIn size={18} />
                               </button>
                            </div>

                            <button 
                              disabled={pageNumber <= 1}
                              onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                              className="text-white disabled:opacity-30 hover:text-amber-500 transition-colors"
                            >
                              <ChevronLeft size={24} />
                            </button>
                            <span className="text-[10px] font-black text-white italic tracking-tighter">
                              PAGE {pageNumber} / {numPages}
                            </span>
                            <button 
                              disabled={pageNumber >= numPages}
                              onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                              className="text-white disabled:opacity-30 hover:text-amber-500 transition-colors"
                            >
                              <ChevronRight size={24} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : blobUrl && (previewFile.data.startsWith('data:image/') || previewFile.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                  <div className="w-full h-full flex flex-col">
                    <div className="flex justify-center gap-4 mb-4 md:hidden">
                      <div className="px-4 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse delay-75" />
                        </div>
                        <p className="text-[9px] font-black text-white tracking-widest uppercase truncate">Gunakan Dua Jari Untuk Zoom</p>
                      </div>
                    </div>
                    <div className="flex-grow w-full overflow-hidden flex items-center justify-center relative bg-black/40 rounded-3xl">
                      <TransformWrapper
                        initialScale={1}
                        initialPositionX={0}
                        initialPositionY={0}
                        centerOnInit={true}
                        minScale={0.5}
                        maxScale={5}
                      >
                        {({ zoomIn, zoomOut, resetTransform }) => (
                          <React.Fragment>
                            <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2">
                              <button onClick={() => zoomIn()} className="p-4 bg-black/60 backdrop-blur-xl rounded-2xl text-white hover:bg-amber-500 hover:text-black transition-all border border-white/10 shadow-2xl active:scale-95">
                                <ZoomIn size={24} />
                              </button>
                              <button onClick={() => zoomOut()} className="p-4 bg-black/60 backdrop-blur-xl rounded-2xl text-white hover:bg-amber-500 hover:text-black transition-all border border-white/10 shadow-2xl active:scale-95">
                                <ZoomOut size={24} />
                              </button>
                              <button onClick={() => resetTransform()} className="p-4 bg-black/60 backdrop-blur-xl rounded-2xl text-white hover:bg-amber-500 hover:text-black transition-all border border-white/10 shadow-2xl active:scale-95">
                                <Maximize2 size={24} />
                              </button>
                            </div>
                            <TransformComponent wrapperClassName="!w-full !h-full" contentClassName="!w-full !h-full flex items-center justify-center">
                              <img 
                                src={blobUrl} 
                                alt={previewFile.name} 
                                className="max-w-full max-h-full object-contain shadow-2xl transition-all duration-300"
                                referrerPolicy="no-referrer"
                              />
                            </TransformComponent>
                          </React.Fragment>
                        )}
                      </TransformWrapper>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-6 text-center p-8 bg-black/20 rounded-[2rem]">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-white/20">
                      <FileText size={40} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white italic uppercase tracking-tight">Format Tidak Didukung Preview</p>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] mt-1 space-x-1">
                        <span>Hanya mendukung</span>
                        <span className="text-amber-500/50">PDF & Gambar</span>
                      </p>
                    </div>
                    <button 
                      onClick={openInNewTab}
                      className="btn bg-white/10 hover:bg-white/20 text-white border-none rounded-2xl font-black italic px-10 flex items-center gap-3 transition-all"
                    >
                      <ExternalLink size={18} /> BUKA SECARA TERPISAH
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
