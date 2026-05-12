import React, { useState } from 'react';
import { Promo, Kategori } from '../types';
import { Plus, Trash2 } from 'lucide-react';

interface AdminPromoProps {
  promos: Promo[];
  setPromos: React.Dispatch<React.SetStateAction<Promo[]>>;
  kategori: Kategori[];
  userEmail?: string | null;
  permissions?: { canAdd: boolean; canEdit: boolean; canDelete: boolean; isAdmin: boolean };
}

export default function AdminPromo({ promos, setPromos, kategori, userEmail, permissions }: AdminPromoProps) {
  const isAdmin = permissions?.isAdmin || userEmail === 'fauzanfawwaz2404@gmail.com';
  const canAdd = permissions?.canAdd || isAdmin;
  const canDelete = permissions?.canDelete || isAdmin;
  const [formData, setFormData] = useState<Promo>({
    kategori: kategori[0]?.nama || '',
    nama: '',
    harga: 0
  });

  const handleAdd = () => {
    if (!canAdd) {
      alert('Anda tidak memiliki izin untuk menambah data.');
      return;
    }
    if (!formData.nama || !formData.kategori) return;
    setPromos(prev => [...prev, formData]);
    setFormData(prev => ({ ...prev, nama: '', harga: 0 }));
  };

  const handleDelete = (idx: number) => {
    if (!canDelete) {
      alert('Anda tidak memiliki izin untuk menghapus data.');
      return;
    }
    if (confirm('Hapus item promo ini?')) {
      setPromos(prev => prev.filter((_, i) => i !== idx));
    }
  };

  return (
    <div className="glass p-8 rounded-3xl max-w-2xl mx-auto shadow-2xl">
      <h2 className="font-bold mb-6 text-white uppercase text-center text-sm tracking-widest">Master Item Promo</h2>
      
      <div className="flex flex-col gap-4 mb-8 bg-black/20 p-6 rounded-2xl border border-white/5 shadow-inner">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label-text text-[10px] font-bold opacity-50 mb-1.5 uppercase tracking-wider">Kategori Lab</label>
            <select 
              value={formData.kategori} 
              onChange={(e) => setFormData(p => ({ ...p, kategori: e.target.value }))}
              disabled={!canAdd}
              className={`select select-sm custom-select w-full bg-slate-900 border-white/10 ${!canAdd ? 'cursor-not-allowed opacity-70' : ''}`}
            >
              {kategori.map(k => <option key={k.nama} value={k.nama}>{k.nama}</option>)}
            </select>
          </div>
          <div className="form-control">
            <label className="label-text text-[10px] font-bold opacity-50 mb-1.5 uppercase tracking-wider">Nama Item / Promo</label>
            <input 
              value={formData.nama} 
              onChange={(e) => setFormData(p => ({ ...p, nama: e.target.value.toUpperCase() }))}
              placeholder="Contoh: PROMO RAMADHAN"
              readOnly={!canAdd}
              className={`input input-sm custom-select w-full bg-slate-900 border-white/10 text-warning font-bold ${!canAdd ? 'cursor-not-allowed opacity-70' : ''}`} 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control md:col-start-2">
            <label className="label-text text-[10px] font-bold opacity-50 mb-1.5 uppercase tracking-wider">Estimasi Harga (Rp)</label>
            <input 
              type="number" 
              value={formData.harga || ''} 
              onChange={(e) => setFormData(p => ({ ...p, harga: Number(e.target.value) }))}
              placeholder="0"
              readOnly={!canAdd}
              className={`input input-sm custom-select w-full bg-slate-900 border-white/10 text-emerald-400 font-mono ${!canAdd ? 'cursor-not-allowed opacity-70' : ''}`} 
            />
          </div>
        </div>

        {canAdd && (
          <button onClick={handleAdd} className="btn btn-warning btn-sm font-bold mt-2 shadow-lg border-none hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 h-10">
            <Plus size={18} /> SIMPAN KE MASTER DATA
          </button>
        )}
      </div>

      <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
        {(() => {
          const today = new Date().toISOString().split('T')[0];
          const categorizedPromos = promos.reduce((acc, p, idx) => {
            const catInfo = kategori.find(k => k.nama === p.kategori);
            const isExp = !!(catInfo?.expDate && catInfo.expDate < today);
            const item = { ...p, originalIdx: idx, isExp };
            if (isExp) acc.expired.push(item);
            else acc.active.push(item);
            return acc;
          }, { active: [] as any[], expired: [] as any[] });

          return (
            <>
              {categorizedPromos.active.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-emerald-400 tracking-[0.2em] mb-3 uppercase">Item Promo Aktif</h4>
                  {categorizedPromos.active.map((p, i) => (
                    <div key={`active-${i}`} className="flex justify-between items-center p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors">
                      <div className="text-[11px]">
                        <b className="text-amber-400 uppercase">{p.kategori}</b>: <span className="text-white font-bold">{p.nama}</span>
                        <span className="block opacity-50 font-mono">Rp {Number(p.harga).toLocaleString()}</span>
                      </div>
                      {canDelete && (
                        <button onClick={() => handleDelete(p.originalIdx)} className="text-error hover:text-red-400 p-2">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {categorizedPromos.expired.length > 0 && (
                <div className="space-y-2 pt-4">
                  <h4 className="text-[10px] font-black text-red-400/50 tracking-[0.2em] mb-3 uppercase">History Highlights (Expired)</h4>
                  {categorizedPromos.expired.map((p, i) => (
                    <div key={`exp-${i}`} className="flex justify-between items-center p-3 bg-red-500/5 rounded-xl border border-red-500/10 opacity-60 grayscale transition-colors">
                      <div className="text-[11px]">
                        <b className="text-red-400 uppercase line-through decoration-red-500/30">{p.kategori}</b>: <span className="text-white/50 font-medium line-through decoration-white/20">{p.nama}</span>
                        <span className="block opacity-30 font-mono">Rp {Number(p.harga).toLocaleString()}</span>
                      </div>
                      {canDelete && (
                        <button onClick={() => handleDelete(p.originalIdx)} className="text-error hover:text-red-400 p-2">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}
