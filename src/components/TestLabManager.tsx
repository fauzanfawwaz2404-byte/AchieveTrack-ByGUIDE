import React, { useState } from 'react';
import { FlaskConical, Search, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TestLab } from '../types';

interface TestLabManagerProps {
  data: TestLab[];
  onAdd: (item: Omit<TestLab, 'id'>) => void;
  onEdit: (id: string, item: Partial<TestLab>) => void;
  onDelete: (id: string) => void;
  onDeleteAll?: () => void;
  permissions: { canAdd: boolean; canEdit: boolean; canDelete: boolean; isAdmin?: boolean };
}

export default function TestLabManager({ data, onAdd, onEdit, onDelete, onDeleteAll, permissions }: TestLabManagerProps) {
  const isAdmin = permissions.canAdd && permissions.canEdit && permissions.canDelete; // For "Delete All" check, or just use permissions.canDelete
  const canModify = permissions.canAdd || permissions.canEdit || permissions.canDelete || permissions.isAdmin;
  const canAdd = permissions.canAdd || permissions.isAdmin;
  const canEdit = permissions.canEdit || permissions.isAdmin;
  const canDelete = permissions.canDelete || permissions.isAdmin;
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TestLab | null>(null);
  const [formData, setFormData] = useState({ nama: '', harga: '' });

  const filteredData = data.filter(item => 
    item.nama.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.harga) return;

    if (editingItem) {
      onEdit(editingItem.id, { 
        nama: formData.nama.toUpperCase(), 
        harga: Number(formData.harga) 
      });
    } else {
      onAdd({ 
        nama: formData.nama.toUpperCase(), 
        harga: Number(formData.harga) 
      });
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ nama: '', harga: '' });
  };

  const openEdit = (item: TestLab) => {
    setEditingItem(item);
    setFormData({ nama: item.nama, harga: item.harga.toString() });
    setIsModalOpen(true);
  };

  return (
    <div className="p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-10 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-500/20 rounded-3xl text-blue-400">
              <FlaskConical size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Master Test Lab</h1>
              <p className="text-white/40 text-sm font-bold uppercase tracking-widest mt-1">Daftar Pemeriksaan Tunggal</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group w-full md:w-80">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-500 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="CARI NAMA PEMERIKSAAN..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 pr-12 h-14 w-full bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 focus:border-blue-500/50 text-white font-black text-xs uppercase tracking-widest placeholder:text-white/20 transition-all"
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
                onClick={() => window.confirm('HAPUS SEMUA DATA TEST LAB? Tindakan ini tidak bisa dibatalkan.') && onDeleteAll?.()}
                className="btn btn-ghost h-14 px-6 text-red-500 hover:bg-red-500/10 border border-white/5 rounded-2xl font-black italic tracking-widest text-[10px]"
              >
                <Trash2 size={16} />
                DELETE ALL
              </button>
            )}

            {canAdd && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="btn h-14 px-8 bg-blue-500 hover:bg-blue-600 text-black border-none rounded-2xl font-black italic tracking-widest flex items-center gap-2 group shadow-xl shadow-blue-500/20"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                TAMBAH TES
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
                <th className="bg-transparent text-[10px] font-black text-white/40 uppercase tracking-widest py-6">Nama Pemeriksaan</th>
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
                    <p className="text-sm font-black text-white uppercase italic truncate max-w-md">{item.nama}</p>
                  </td>
                  <td className="py-5 border-t border-white/5 text-right">
                    <p className="text-sm font-black text-blue-400 font-mono">Rp {item.harga.toLocaleString()}</p>
                  </td>
                  {(canEdit || canDelete) && (
                    <td className="py-5 border-t border-white/5 text-center pr-10">
                      <div className="flex items-center justify-center gap-2">
                        {canEdit && (
                          <button 
                            onClick={() => openEdit(item)}
                            className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center hover:bg-blue-500 hover:text-black transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            onClick={() => window.confirm('Hapus pemeriksaan ini?') && onDelete(item.id)}
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
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-8">{editingItem ? 'Edit Pemeriksaan' : 'Tambah Pemeriksaan'}</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="form-control">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block">Nama Pemeriksaan</label>
                  <input 
                    type="text" 
                    value={formData.nama}
                    onChange={(e) => setFormData(p => ({ ...p, nama: e.target.value }))}
                    className="input w-full bg-white/5 border-white/10 rounded-2xl font-bold uppercase text-warning focus:border-blue-500/50"
                    placeholder="CONTOH: KOLESTEROL TOTAL"
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2 block">Harga (Rp)</label>
                  <input 
                    type="number" 
                    value={formData.harga}
                    onChange={(e) => setFormData(p => ({ ...p, harga: e.target.value }))}
                    className="input w-full bg-white/5 border-white/10 rounded-2xl font-mono focus:border-blue-500/50"
                    placeholder="CONTOH: 45000"
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
                    className="btn flex-1 bg-blue-500 text-black border-none rounded-2xl font-black italic tracking-widest shadow-lg shadow-blue-500/20"
                  >
                    SIMPAN DATA
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
