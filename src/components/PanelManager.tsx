import React, { useState, useMemo } from 'react';
import { BookOpen, Search, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TestLab, Panel } from '../types';

interface PanelManagerProps {
  data: Panel[];
  testLabs: TestLab[];
  onAdd: (item: Omit<Panel, 'id'>) => void;
  onEdit: (id: string, item: Partial<Panel>) => void;
  onDelete: (id: string) => void;
  onDeleteAll?: () => void;
  permissions: { canAdd: boolean; canEdit: boolean; canDelete: boolean; isAdmin?: boolean };
}

export default function PanelManager({ data, testLabs, onAdd, onEdit, onDelete, onDeleteAll, permissions }: PanelManagerProps) {
  const isAdmin = permissions.canAdd && permissions.canEdit && permissions.canDelete;
  const canAdd = permissions.canAdd || permissions.isAdmin;
  const canEdit = permissions.canEdit || permissions.isAdmin;
  const canDelete = permissions.canDelete || permissions.isAdmin;
  const [searchTerm, setSearchTerm] = useState('');
  const [testSearchTerm, setTestSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Panel | null>(null);
  const [detailItem, setDetailItem] = useState<Panel | null>(null);
  const [formData, setFormData] = useState({ nama: '', harga: '', pemeriksaan: '' });

  const filteredData = data.filter(item => 
    item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.pemeriksaan || '').toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));

  const selectedTests = useMemo(() => {
    return formData.pemeriksaan
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0);
  }, [formData.pemeriksaan]);

  const addTest = (testName: string) => {
    if (selectedTests.includes(testName)) return;
    const newPemeriksaan = [...selectedTests, testName].join('\n');
    setFormData(p => ({ ...p, pemeriksaan: newPemeriksaan }));
    setTestSearchTerm('');
  };

  const removeTest = (testName: string) => {
    const newPemeriksaan = selectedTests.filter(t => t !== testName).join('\n');
    setFormData(p => ({ ...p, pemeriksaan: newPemeriksaan }));
  };

  const filteredTests = useMemo(() => {
    if (!testSearchTerm) return [];
    const lower = testSearchTerm.toLowerCase();
    return testLabs
      .filter(t => t.nama.toLowerCase().includes(lower) && !selectedTests.includes(t.nama))
      .slice(0, 5);
  }, [testSearchTerm, testLabs, selectedTests]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.harga) return;

    if (editingItem) {
      onEdit(editingItem.id, { 
        nama: formData.nama.toUpperCase(), 
        harga: Number(formData.harga),
        pemeriksaan: formData.pemeriksaan
      });
    } else {
      onAdd({ 
        nama: formData.nama.toUpperCase(), 
        harga: Number(formData.harga),
        pemeriksaan: formData.pemeriksaan
      });
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ nama: '', harga: '', pemeriksaan: '' });
  };

  const openEdit = (item: Panel) => {
    setEditingItem(item);
    setFormData({ 
      nama: item.nama, 
      harga: item.harga.toString(),
      pemeriksaan: item.pemeriksaan || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-10 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-500/20 rounded-3xl text-emerald-400">
              <BookOpen size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Master Panel</h1>
              <p className="text-white/40 text-sm font-bold uppercase tracking-widest mt-1">Daftar Paket Pemeriksaan</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group w-full md:w-80">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="CARI NAMA PANEL..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 pr-12 h-14 w-full bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 focus:border-emerald-500/50 text-white font-black text-xs uppercase tracking-widest placeholder:text-white/20 transition-all"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            {canDelete && data.length > 0 && permissions.isAdmin && (
              <button 
                onClick={() => window.confirm('HAPUS SEMUA DATA PANEL? Tindakan ini tidak bisa dibatalkan.') && onDeleteAll?.()}
                className="btn btn-ghost h-14 px-6 text-red-500 hover:bg-red-500/10 border border-white/5 rounded-2xl font-black italic tracking-widest text-[10px]"
              >
                <Trash2 size={16} />
                DELETE ALL
              </button>
            )}

            {canAdd && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="btn h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-black border-none rounded-2xl font-black italic tracking-widest flex items-center gap-2 group shadow-xl shadow-emerald-500/20"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                TAMBAH PANEL
              </button>
            )}
          </div>
        </div>

      <div className="glass rounded-[3rem] border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full border-separate border-spacing-0">
            <thead className="bg-white/5">
              <tr>
                <th className="bg-transparent text-[10px] font-black text-white/40 uppercase tracking-widest py-6 pl-10">No</th>
                <th className="bg-transparent text-[10px] font-black text-white/40 uppercase tracking-widest py-6">Nama Paket / Panel</th>
                <th className="bg-transparent text-[10px] font-black text-white/40 uppercase tracking-widest py-6 text-right">Harga (Rp)</th>
                {(canEdit || canDelete) && <th className="bg-transparent text-[10px] font-black text-white/40 uppercase tracking-widest py-6 text-center pr-10">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, idx) => (
                <tr key={`${item.id}-${idx}`} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="py-5 pl-10 border-t border-white/5">
                    <span className="text-xs font-mono text-white/20">{idx + 1}</span>
                  </td>
                  <td className="py-5 border-t border-white/5">
                    <button 
                      onClick={() => setDetailItem(item)}
                      className="text-sm font-black text-white hover:text-emerald-400 uppercase italic truncate max-w-md transition-colors text-left"
                    >
                      {item.nama}
                    </button>
                    {item.pemeriksaan && (
                      <p className="text-[10px] text-white/40 italic truncate max-w-md border-l border-white/10 pl-2 mt-1">
                        {item.pemeriksaan}
                      </p>
                    )}
                  </td>
                  <td className="py-5 border-t border-white/5 text-right">
                    <p className="text-sm font-black text-emerald-400 font-mono">Rp {item.harga.toLocaleString()}</p>
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
                            onClick={() => window.confirm('Hapus panel ini?') && onDelete(item.id)}
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
          {filteredData.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-xs font-black text-white/20 uppercase tracking-[0.4em] italic">Data tidak ditemukan / Kosong...</p>
            </div>
          )}
        </div>
      </div>

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
              className="glass w-full max-w-md p-10 rounded-[3rem] border border-white/10 relative z-10"
            >
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-8">{editingItem ? 'Edit Panel' : 'Tambah Panel'}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="form-control">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block">Nama Paket / Panel</label>
                  <input 
                    type="text" 
                    value={formData.nama}
                    onChange={(e) => setFormData(p => ({ ...p, nama: e.target.value }))}
                    className="input w-full bg-white/5 border-white/10 rounded-2xl font-bold uppercase text-warning focus:border-emerald-500/50"
                    placeholder="CONTOH: PANEL WELLNESS"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block">Daftar Pemeriksaan</label>
                  
                  {/* Test Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedTests.map((test, idx) => (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={idx}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl group"
                      >
                        <span className="text-[10px] font-bold text-white uppercase italic">{test}</span>
                        <button 
                          type="button" 
                          onClick={() => removeTest(test)}
                          className="text-white/20 hover:text-red-400 p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </motion.div>
                    ))}
                    {selectedTests.length === 0 && (
                      <p className="text-[10px] font-medium text-white/10 italic py-2">Belum ada tes dipilih...</p>
                    )}
                  </div>

                  {/* Search Input for Tests */}
                  <div className="relative">
                    <div className="relative flex items-center">
                      <Search className="absolute left-4 text-white/20" size={14} />
                      <input 
                        type="text"
                        value={testSearchTerm}
                        onChange={(e) => setTestSearchTerm(e.target.value)}
                        placeholder="CARI & TAMBAH TES..."
                        className="input w-full pl-10 bg-white/5 border-white/10 rounded-2xl font-bold text-[10px] tracking-widest text-emerald-400 focus:border-emerald-500/50"
                      />
                    </div>

                    <AnimatePresence>
                      {testSearchTerm && filteredTests.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute z-[110] left-0 right-0 mt-2 bg-[#1a1c23] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                        >
                          {filteredTests.map((test) => (
                            <button
                              key={test.id}
                              type="button"
                              onClick={() => addTest(test.nama)}
                              className="w-full p-3 text-left hover:bg-emerald-500 hover:text-black transition-colors flex items-center justify-between"
                            >
                              <span className="text-[10px] font-black uppercase italic tracking-tight">{test.nama}</span>
                              <Plus size={14} />
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <div className="form-control">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block">Harga (Rp)</label>
                  <input 
                    type="number" 
                    value={formData.harga}
                    onChange={(e) => setFormData(p => ({ ...p, harga: e.target.value }))}
                    className="input w-full bg-white/5 border-white/10 rounded-2xl font-mono focus:border-emerald-500/50"
                    placeholder="CONTOH: 750000"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={closeModal}
                    className="btn flex-1 bg-white/5 text-white/50 border-none rounded-2xl font-black italic tracking-widest"
                  >
                    BATAL
                  </button>
                  <button 
                    type="submit"
                    className="btn flex-1 bg-emerald-500 text-black border-none rounded-2xl font-black italic tracking-widest shadow-lg shadow-emerald-500/20"
                  >
                    SIMPAN DATA
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailItem(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass w-full max-w-2xl p-0 rounded-[3rem] border border-white/10 relative z-10 overflow-hidden"
            >
              <div className="bg-emerald-500 p-10 relative">
                <button 
                  onClick={() => setDetailItem(null)}
                  className="absolute right-6 top-6 w-10 h-10 rounded-full bg-black/10 text-black flex items-center justify-center hover:bg-black/20 transition-all"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-4 text-black">
                  <div className="p-3 bg-black/10 rounded-2xl">
                    <BookOpen size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{detailItem.nama}</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mt-2">Detail Rincian Panel</p>
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-10">
                <div>
                  <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-6 border-b border-white/5 pb-4">Daftar Pemeriksaan / Paket:</h3>
                  <div className="grid grid-cols-1 gap-3 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                    {(() => {
                      const text = detailItem.pemeriksaan || '';
                      // Improved split logic: handles commas, newlines, and numbering patterns
                      let items: string[] = [];
                      
                      if (text.includes('\n')) {
                        items = text.split('\n').map(p => p.trim()).filter(p => p.length > 0);
                      } else if (text.includes(',')) {
                        items = text.split(',').map(p => p.trim()).filter(p => p.length > 0);
                      } else {
                        // Fallback: try split by numbering (1., 2., etc.)
                        items = text.split(/(?=\d+\.)/).map(p => p.trim()).filter(p => p.length > 0);
                      }

                      return items.map((p, i) => (
                        <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all group">
                          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-mono text-[10px] font-black group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                            {i + 1}
                          </div>
                          <span className="text-xs font-bold text-white/80 uppercase italic leading-tight">{p.replace(/^\d+\.\s*/, '')}</span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                <div className="bg-emerald-500/10 p-8 rounded-[2.5rem] border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">Total Biaya Panel</p>
                    <p className="text-4xl font-black text-white font-mono italic">Rp {detailItem.harga.toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => setDetailItem(null)}
                    className="btn px-10 h-14 bg-emerald-500 hover:bg-emerald-600 text-black border-none rounded-2xl font-black italic tracking-widest text-xs"
                  >
                    TUTUP DETAIL
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
