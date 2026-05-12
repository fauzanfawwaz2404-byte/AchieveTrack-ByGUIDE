import React, { useState, useMemo } from 'react';
import { Transaksi } from '../types';
import { extractDateFromLabNo, getEffectiveDate, formatTransactionDate } from '../lib/dateUtils';
import { Search, Edit, Trash2, History } from 'lucide-react';

interface RiwayatProps {
  transaksi: Transaksi[];
  onEdit: (t: Transaksi) => void;
  onDelete: (id: string | number) => void;
  userEmail?: string | null;
  permissions?: { canAdd: boolean; canEdit: boolean; canDelete: boolean; isAdmin: boolean };
}

export default function Riwayat({ transaksi, onEdit, onDelete, userEmail, permissions }: RiwayatProps) {
  const isAdmin = permissions?.isAdmin || userEmail === 'fauzanfawwaz2404@gmail.com';
  const canEdit = permissions?.canEdit || isAdmin;
  const canDelete = permissions?.canDelete || isAdmin;
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    const searchTerm = search.toLowerCase();
    return transaksi.filter(t => 
      (t.petugas || "").toLowerCase().includes(searchTerm) ||
      (t.promo || "").toLowerCase().includes(searchTerm) ||
      (t.noLab || "").toLowerCase().includes(searchTerm) ||
      (t.kategori || "").toLowerCase().includes(searchTerm)
    );
  }, [transaksi, search]);

  return (
    <div className="glass p-8 rounded-3xl shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-white uppercase flex items-center gap-2">
          <History size={18} className="text-orange-400" /> Riwayat Pencapaian
        </h2>
        <div className="relative w-full md:w-72">
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, lab, atau promo..." 
            className="input input-sm input-bordered w-full custom-select pl-10"
          />
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        </div>
      </div>
      <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
        <table className="table table-xs w-full">
          <thead className="sticky top-0 bg-slate-900 uppercase text-[10px] text-white/60 z-10">
            <tr>
              <th className="py-3 px-4">Tanggal</th>
              <th className="py-3 px-4">No. Lab</th>
              <th className="py-3 px-4">Kategori</th>
              <th className="py-3 px-4">Item</th>
              <th className="py-3 px-4">Petugas</th>
              <th className="py-3 px-4">Nominal</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(t => (
              <tr key={t.id} className="hover:bg-white/5 transition-colors">
                <td className="text-[10px] whitespace-nowrap">
                  {formatTransactionDate(t.noLab || '', t.timestamp)}
                </td>
                <td className="font-mono text-amber-400 text-[10px]">{t.noLab || '-'}</td>
                <td className="text-white/70 text-[10px] uppercase">{t.kategori}</td>
                <td className="text-white font-bold uppercase text-[10px]">{t.promo}</td>
                <td className="text-blue-400 font-bold uppercase text-[10px]">{t.petugas}</td>
                <td className="font-mono text-emerald-400 text-[10px]">Rp {Number(t.nominal).toLocaleString()}</td>
                <td className="text-right whitespace-nowrap">
                  {(canEdit || canDelete) ? (
                    <>
                      {canEdit && (
                        <button onClick={() => onEdit(t)} className="text-amber-500 hover:text-amber-400 mr-3 p-1">
                          <Edit size={14} />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => onDelete(t.id)} className="text-error hover:text-red-400 p-1">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </>
                  ) : (
                    <span className="text-[9px] opacity-30 font-bold uppercase">View Only</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-20 opacity-30 font-bold">
                  Tidak ada data riwayat yang sesuai...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
