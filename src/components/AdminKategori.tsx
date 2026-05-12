import React, { useState } from 'react';
import { Kategori } from '../types';
import { Plus, Trash2, Edit, Save, XCircle } from 'lucide-react';

interface AdminKategoriProps {
  kategori: Kategori[];
  setKategori: React.Dispatch<React.SetStateAction<Kategori[]>>;
  userEmail?: string | null;
  permissions?: { canAdd: boolean; canEdit: boolean; canDelete: boolean; isAdmin: boolean };
}

export default function AdminKategori({ kategori, setKategori, userEmail, permissions }: AdminKategoriProps) {
  const isAdmin = permissions?.isAdmin || userEmail === 'fauzanfawwaz2404@gmail.com';
  const canAdd = permissions?.canAdd || isAdmin;
  const canEdit = permissions?.canEdit || isAdmin;
  const canDelete = permissions?.canDelete || isAdmin;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<Kategori>({
    nama: '',
    targetRevenue: 0,
    targetVisit: 0,
    expDate: '',
    imageUrl: '',
    mode: 'Offline'
  });

  const handleEdit = (idx: number) => {
    setEditingIndex(idx);
    setFormData(kategori[idx]);
  };

  const handleDelete = (idx: number) => {
    if (!canDelete) {
      alert('Anda tidak memiliki izin untuk menghapus data.');
      return;
    }
    if (confirm('Hapus kategori ini?')) {
      setKategori(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handleSave = () => {
    if (!formData.nama) return;
    
    if (editingIndex !== null) {
      if (!canEdit) {
        alert('Anda tidak memiliki izin untuk mengubah data.');
        return;
      }
      setKategori(prev => prev.map((k, i) => i === editingIndex ? formData : k));
    } else {
      if (!canAdd) {
        alert('Anda tidak memiliki izin untuk menambah data.');
        return;
      }
      setKategori(prev => [...prev, formData]);
    }
    
    setEditingIndex(null);
    setFormData({ nama: '', targetRevenue: 0, targetVisit: 0, expDate: '', imageUrl: '', mode: 'Offline' });
  };

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setFormData(prev => ({ ...prev, imageUrl: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="glass p-8 rounded-3xl max-w-2xl mx-auto shadow-2xl border-t-4 border-amber-400">
      <h2 className="font-bold mb-6 text-white uppercase text-center text-sm tracking-widest">
        {editingIndex !== null ? 'Edit Kategori' : 'Master Kategori'}
      </h2>
      
      <div className="flex flex-col gap-4 mb-8 bg-black/20 p-6 rounded-2xl border border-white/5 shadow-inner">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label-text text-[10px] font-bold opacity-50 mb-1.5 uppercase tracking-wider">Nama Kategori</label>
            <input 
              value={formData.nama} 
              onChange={(e) => setFormData(p => ({ ...p, nama: e.target.value.toUpperCase() }))}
              readOnly={!canEdit && editingIndex !== null}
              disabled={!canAdd && editingIndex === null}
              className={`input input-sm custom-select w-full bg-slate-900 border-white/10 text-warning font-bold uppercase ${(!canAdd && editingIndex === null) || (!canEdit && editingIndex !== null) ? 'cursor-not-allowed opacity-70' : ''}`} 
              placeholder="Contoh: BHF"
            />
          </div>
          <div className="form-control">
            <label className="label-text text-[10px] font-bold opacity-50 mb-1.5 uppercase tracking-wider">Berlaku Sampai</label>
            <input 
              type="date" 
              value={formData.expDate} 
              onChange={(e) => setFormData(p => ({ ...p, expDate: e.target.value }))}
              readOnly={(!canAdd && editingIndex === null) || (!canEdit && editingIndex !== null)}
              className={`input input-sm custom-select w-full bg-slate-900 border-white/10 ${(!canAdd && editingIndex === null) || (!canEdit && editingIndex !== null) ? 'cursor-not-allowed opacity-70' : ''}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label-text text-[10px] font-bold opacity-50 mb-1.5 uppercase tracking-wider">Target Revenue (Rp)</label>
            <input 
              type="number" 
              value={formData.targetRevenue || ''} 
              onChange={(e) => setFormData(p => ({ ...p, targetRevenue: Number(e.target.value) }))}
              placeholder="0"
              readOnly={(!canAdd && editingIndex === null) || (!canEdit && editingIndex !== null)}
              className={`input input-sm custom-select w-full bg-slate-900 border-white/10 text-emerald-400 font-mono ${(!canAdd && editingIndex === null) || (!canEdit && editingIndex !== null) ? 'cursor-not-allowed opacity-70' : ''}`}
            />
          </div>
          <div className="form-control">
            <label className="label-text text-[10px] font-bold opacity-50 mb-1.5 uppercase tracking-wider">Target Visit</label>
            <input 
              type="number" 
              value={formData.targetVisit || ''} 
              onChange={(e) => setFormData(p => ({ ...p, targetVisit: Number(e.target.value) }))}
              placeholder="0"
              readOnly={(!canAdd && editingIndex === null) || (!canEdit && editingIndex !== null)}
              className={`input input-sm custom-select w-full bg-slate-900 border-white/10 text-blue-400 font-mono ${(!canAdd && editingIndex === null) || (!canEdit && editingIndex !== null) ? 'cursor-not-allowed opacity-70' : ''}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label-text text-[10px] font-bold opacity-50 mb-1.5 uppercase tracking-wider">Mode Layanan</label>
            <select 
              value={formData.mode} 
              onChange={(e) => setFormData(p => ({ ...p, mode: e.target.value as 'Online' | 'Offline' | 'Online & Offline' }))}
              disabled={(!canAdd && editingIndex === null) || (!canEdit && editingIndex !== null)}
              className={`select select-sm custom-select w-full bg-slate-900 border-white/10 ${(!canAdd && editingIndex === null) || (!canEdit && editingIndex !== null) ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              <option value="Online">ONLINE</option>
              <option value="Offline">OFFLINE</option>
              <option value="Online & Offline">ONLINE & OFFLINE</option>
            </select>
          </div>
          <div className="form-control">
            <label className="label-text text-[10px] font-bold opacity-50 mb-1.5 uppercase tracking-wider">Upload Brosur Pendukung</label>
            <input 
              type="file" 
              onChange={handleImg} 
              disabled={(!canAdd && editingIndex === null) || (!canEdit && editingIndex !== null)}
              className={`file-input file-input-warning file-input-sm w-full custom-select bg-slate-900 border-white/10 ${(!canAdd && editingIndex === null) || (!canEdit && editingIndex !== null) ? 'cursor-not-allowed opacity-70' : ''}`} 
            />
          </div>
        </div>
        
        <div className="flex gap-2 mt-4 pt-2 border-t border-white/5">
          {editingIndex !== null && (
            <button 
              onClick={() => {
                setEditingIndex(null);
                setFormData({ nama: '', targetRevenue: 0, targetVisit: 0, expDate: '', imageUrl: '', mode: 'Offline' });
              }} 
              className="btn btn-ghost btn-sm flex-1 font-bold text-error border border-error/20"
            >
              <XCircle size={16} className="mr-1" /> BATAL
            </button>
          )}
          {((editingIndex === null && canAdd) || (editingIndex !== null && canEdit)) && (
            <button 
              onClick={handleSave} 
              className={`btn ${editingIndex !== null ? 'btn-info' : 'btn-warning'} btn-sm flex-1 font-bold shadow-lg h-10`}
            >
              {editingIndex !== null ? <><Save size={18} className="mr-1" /> SIMPAN PERUBAHAN</> : <><Plus size={18} className="mr-1" /> TAMBAH KATEGORI</>}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table w-full text-xs">
          <thead>
            <tr className="opacity-40 uppercase">
              <th>Brosur</th>
              <th>Kategori</th>
              <th>Mode</th>
              <th>Exp</th>
              <th>T. Rev</th>
              <th className="text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const today = new Date().toISOString().split('T')[0];
              return kategori.map((k, i) => {
                const isExp = k.expDate && k.expDate < today;
                return (
                  <tr key={i} className={`hover:bg-white/5 transition-colors ${isExp ? 'opacity-60 bg-red-500/5' : ''}`}>
                    <td>
                      <div className={`w-8 h-8 rounded bg-white/10 overflow-hidden flex items-center justify-center border ${isExp ? 'border-red-500/20 grayscale' : 'border-white/5'}`}>
                        {k.imageUrl ? <img src={k.imageUrl} className="w-full h-full object-cover" alt={k.nama} /> : <div className="opacity-20">?</div>}
                      </div>
                    </td>
                    <td className={`font-bold uppercase ${isExp ? 'text-white/40 line-through decoration-red-500/50' : 'text-white'}`}>{k.nama}</td>
                    <td>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                        k.mode === 'Online' ? 'text-blue-400 border-blue-400/20 bg-blue-400/5' : 
                        k.mode === 'Online & Offline' ? 'text-purple-400 border-purple-400/20 bg-purple-400/5' :
                        'text-emerald-400 border-emerald-400/20 bg-emerald-400/5'
                      }`}>
                        {k.mode || 'Offline'}
                      </span>
                    </td>
                    <td className={`font-mono text-[10px] ${isExp ? 'text-red-400' : 'text-amber-400'}`}>{k.expDate || '-'} {isExp && '(EXP)'}</td>
                    <td className={`font-mono ${isExp ? 'text-white/30' : ''}`}>Rp {Number(k.targetRevenue).toLocaleString()}</td>
                    <td className="text-right whitespace-nowrap">
                       {(canEdit || canDelete) && (
                         <>
                            {canEdit && (
                              <button onClick={() => handleEdit(i)} className="text-blue-400 hover:text-blue-300 mr-2 p-1">
                                <Edit size={14} />
                              </button>
                            )}
                            {canDelete && (
                              <button onClick={() => handleDelete(i)} className="text-error hover:text-red-400 p-1">
                                <Trash2 size={14} />
                              </button>
                            )}
                         </>
                       )}
                    </td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}
