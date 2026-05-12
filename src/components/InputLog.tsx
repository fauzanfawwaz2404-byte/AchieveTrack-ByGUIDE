import React, { useState, useEffect } from 'react';
import { Kategori, Promo, Transaksi } from '../types';
import { extractDateFromLabNo } from '../lib/dateUtils';
import { Save, ClipboardList, Hash, CreditCard, User, AlertTriangle } from 'lucide-react';

interface InputLogProps {
  kategori: Kategori[];
  promos: Promo[];
  petugasList: string[];
  transaksi: Transaksi[];
  onSave: (transaction: Transaksi) => void;
  editData?: Transaksi | null;
  permissions?: { canAdd: boolean; canEdit: boolean; canDelete: boolean; isAdmin: boolean };
}

export default function InputLog({ kategori, promos, petugasList, transaksi, onSave, editData, permissions }: InputLogProps) {
  const isAllowed = editData ? permissions?.canEdit : permissions?.canAdd;
  const isAdmin = permissions?.isAdmin;
  const [formData, setFormData] = useState<Partial<Transaksi>>({
    kategori: '',
    promo: '',
    noLab: '',
    nominal: 0,
    petugas: 'Ayu'
  });

  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    if (editData) {
      setFormData(editData);
    }
  }, [editData]);

  const today = new Date().toISOString().split('T')[0];
  const activeKategori = kategori.filter(k => !k.expDate || k.expDate >= today);

  const filteredPromos = promos.filter(p => p.kategori === formData.kategori);

  const handleKategoriChange = (val: string) => {
    setFormData(prev => ({ ...prev, kategori: val, promo: '', nominal: 0 }));
  };

  const handlePromoChange = (val: string) => {
    const p = promos.find(x => x.nama === val);
    setFormData(prev => ({ ...prev, promo: val, nominal: p ? p.harga : 0 }));
  };

  const handleNoLabChange = (val: string) => {
    setFormData(prev => ({ ...prev, noLab: val }));
    
    // Check for duplicates
    const isDuplicate = transaksi.some(t => t.noLab === val && t.id !== editData?.id);
    if (isDuplicate && val.length > 5) {
      setWarning(`Nomor Lab ini sudah pernah diinput, apakah 1 nomor 2 kontrak?`);
    } else {
      setWarning(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.kategori || !formData.promo || !formData.petugas) return;
    
    if (formData.noLab?.length !== 10) {
      setWarning("Nomor Lab harus tepat 10 digit!");
      return;
    }
    
    // Auto adjust date from noLab if possible
    const derivedTimestamp = formData.noLab ? extractDateFromLabNo(formData.noLab) : null;
    
    onSave({
      id: editData?.id || Date.now(),
      kategori: formData.kategori as string,
      promo: formData.promo as string,
      petugas: formData.petugas as string,
      noLab: formData.noLab as string,
      nominal: Number(formData.nominal),
      timestamp: derivedTimestamp || editData?.timestamp || new Date().toISOString()
    });
  };

  return (
    <div className="max-w-xl mx-auto relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
      <div className="relative glass p-10 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>

        <div className="relative z-10">
          <div className="flex flex-col items-center mb-10">
            <div className={`w-16 h-16 rounded-[1.5rem] bg-gradient-to-br ${editData ? 'from-blue-500 to-indigo-600' : 'from-emerald-500 to-emerald-700'} flex items-center justify-center shadow-lg mb-4 ring-4 ring-white/5`}>
              <ClipboardList size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">
              {editData ? 'REVISI PENCAPAIAN' : 'INPUT PENCAPAIAN'}
            </h2>
            <div className="h-1 w-12 bg-emerald-500 rounded-full mt-2"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {warning && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 animate-slide-in">
                <AlertTriangle size={20} className="text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] font-bold text-amber-200 uppercase leading-relaxed tracking-wide">
                  {warning}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 px-1">
                  <Hash size={12} className="text-emerald-500" /> Kategori
                </label>
                <div className="relative">
                  <select 
                    value={formData.kategori} 
                    onChange={(e) => handleKategoriChange(e.target.value)}
                    className="select select-md bg-black/40 border border-white/5 rounded-2xl w-full text-xs font-black uppercase text-white tracking-widest focus:border-emerald-500/50 transition-all appearance-none h-14"
                    required
                  >
                    <option value="">PILIH KATEGORI</option>
                    {activeKategori.map(k => <option key={k.nama} value={k.nama}>{k.nama}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-control">
                <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 px-1">
                  <CreditCard size={12} className="text-blue-500" /> Item Promo
                </label>
                <select 
                  value={formData.promo} 
                  onChange={(e) => handlePromoChange(e.target.value)}
                  className="select select-md bg-black/40 border border-white/5 rounded-2xl w-full text-xs font-black uppercase text-white tracking-widest focus:border-blue-500/50 transition-all h-14"
                  required
                >
                  <option value="">PILIH ITEM</option>
                  {filteredPromos.map(p => <option key={p.nama} value={p.nama}>{p.nama}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="flex items-center justify-between text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 px-1">
                  <span className="flex items-center gap-2 italic font-black text-emerald-500">Nomor Lab (10 Digit)</span>
                  <span className={`text-[9px] ${formData.noLab?.length === 10 ? 'text-emerald-400' : 'text-amber-500'}`}>
                    {formData.noLab?.length || 0}/10
                  </span>
                </label>
                <input 
                  type="text" 
                  value={formData.noLab || ''} 
                  onChange={(e) => handleNoLabChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className={`input h-14 bg-black/40 border-2 rounded-2xl w-full font-mono text-lg font-black text-center tracking-[0.1em] transition-all uppercase ${formData.noLab?.length === 10 ? 'border-emerald-500/30 text-emerald-400' : 'border-white/5 text-amber-500 shadow-inner'}`} 
                  placeholder="260XXXXXXX" 
                  required 
                />
              </div>

              <div className="form-control">
                <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 px-1">
                  <span className="flex items-center gap-2 italic font-black text-sky-400">Nominal Revenue</span>
                </label>
                <input 
                  type="number" 
                  value={formData.nominal || ''} 
                  onChange={(e) => setFormData(prev => ({ ...prev, nominal: Number(e.target.value) }))}
                  className="input h-14 bg-black/40 border border-emerald-500/10 rounded-2xl w-full text-lg font-black text-white tracking-tight focus:border-emerald-500/50 transition-all" 
                  placeholder="0"
                  required 
                />
              </div>
            </div>

            <div className="form-control">
              <label className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 px-1">
                <User size={12} className="text-indigo-400" /> Nama Petugas
              </label>
              <select 
                value={formData.petugas} 
                onChange={(e) => setFormData(prev => ({ ...prev, petugas: e.target.value }))}
                className="select select-md bg-black/40 border border-white/5 rounded-2xl w-full text-xs font-black uppercase text-white tracking-widest focus:border-indigo-500/50 h-14"
                required
              >
                {petugasList.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="flex gap-4 pt-6">
              {editData && (
                <button 
                  type="button" 
                  onClick={() => window.history.back()} 
                  className="flex-1 h-16 rounded-2xl border border-white/10 text-white/40 font-black uppercase tracking-widest hover:bg-white/5 transition-all text-sm"
                >
                  BATAL
                </button>
              )}
              <button 
                type="submit" 
                disabled={!isAllowed}
                className={`flex-[2] h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl transition-all relative overflow-hidden group/btn ${isAllowed ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-emerald-500/20 active:scale-[0.98]' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {editData ? <Save size={20} /> : <Save size={20} />}
                  {isAllowed ? (editData ? 'PERBARUI DATA' : 'SIMPAN DATA') : 'AKSES TERKUNCI'}
                </span>
                {isAllowed && (
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
