import React, { useState } from 'react';
import { Kategori, TargetPerPetugas } from '../types';
import { Save } from 'lucide-react';

interface AdminTargetProps {
  kategori: Kategori[];
  targets: TargetPerPetugas;
  setTargets: React.Dispatch<React.SetStateAction<TargetPerPetugas>>;
  petugasList: string[];
  userEmail?: string | null;
  permissions?: { canAdd: boolean; canEdit: boolean; canDelete: boolean; isAdmin: boolean };
}

export default function AdminTarget({ kategori, targets, setTargets, petugasList, userEmail, permissions }: AdminTargetProps) {
  const isAdmin = permissions?.isAdmin || userEmail === 'fauzanfawwaz2404@gmail.com';
  const canEdit = permissions?.canEdit || isAdmin;
  const canAdd = permissions?.canAdd || isAdmin; // Both can be used for saving
  const canUpdate = canEdit || canAdd;
  const [selectedKat, setSelectedKat] = useState("");
  const [tempTargets, setTempTargets] = useState<Record<string, { rev: number; vis: number }>>({});

  const handleKatChange = (k: string) => {
    setSelectedKat(k);
    if (k) {
      const initial: Record<string, { rev: number; vis: number }> = {};
      petugasList.forEach(p => {
        initial[p] = (targets[k] || {})[p] || { rev: 0, vis: 0 };
      });
      setTempTargets(initial);
    }
  };

  const updateTarget = (petugas: string, field: 'rev' | 'vis', value: string) => {
    setTempTargets(prev => ({
      ...prev,
      [petugas]: { ...prev[petugas], [field]: Number(value) }
    }));
  };

  const handleSave = () => {
    if (!canUpdate) {
      alert('Anda tidak memiliki izin untuk memperbarui target.');
      return;
    }
    if (!selectedKat) return;
    setTargets(prev => ({
      ...prev,
      [selectedKat]: tempTargets
    }));
    alert('Target petugas diperbarui!');
  };

  return (
    <div className="glass p-8 rounded-3xl max-w-3xl mx-auto shadow-2xl">
      <h2 className="font-bold mb-6 text-white uppercase text-center text-sm tracking-widest">Setup Target Per Petugas</h2>
      
      <select 
        value={selectedKat} 
        onChange={(e) => handleKatChange(e.target.value)}
        className="select select-sm w-full mb-6 custom-select"
      >
        <option value="">-- Pilih Kategori --</option>
        {(() => {
          const today = new Date().toISOString().split('T')[0];
          return kategori
            .filter(k => !k.expDate || k.expDate >= today)
            .map(k => <option key={k.nama} value={k.nama}>{k.nama}</option>);
        })()}
      </select>

      {selectedKat && (
        <div className="overflow-x-auto">
          <table className="table table-xs w-full">
            <thead>
              <tr className="uppercase text-[9px] opacity-50 border-b border-white/10">
                <th className="py-4">Petugas</th>
                <th className="py-4">Tgt Rev</th>
                <th className="py-4">Tgt Visit</th>
              </tr>
            </thead>
            <tbody>
              {petugasList.map(p => (
                <tr key={p} className="hover:bg-white/5 border-b border-white/5">
                  <td className="font-bold uppercase text-white py-3">{p}</td>
                  <td className="py-2">
                    <input 
                      type="number" 
                      value={tempTargets[p]?.rev || 0} 
                      onChange={(e) => updateTarget(p, 'rev', e.target.value)}
                      readOnly={!canUpdate}
                      className={`input input-xs custom-select w-full font-mono text-amber-500 ${!canUpdate ? 'cursor-not-allowed opacity-70' : ''}`} 
                    />
                  </td>
                  <td className="py-2">
                    <input 
                      type="number" 
                      value={tempTargets[p]?.vis || 0} 
                      onChange={(e) => updateTarget(p, 'vis', e.target.value)}
                      readOnly={!canUpdate}
                      className={`input input-xs custom-select w-full font-mono text-white ${!canUpdate ? 'cursor-not-allowed opacity-70' : ''}`} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {canUpdate && (
            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleSave} 
                className="btn btn-warning px-12 font-black shadow-lg flex items-center gap-2"
              >
                <Save size={18} /> SIMPAN TARGET
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
