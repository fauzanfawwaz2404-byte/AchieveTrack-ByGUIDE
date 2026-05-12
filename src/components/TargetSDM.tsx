import React, { useState, useMemo } from 'react';
import { Kategori, Transaksi, TargetPerPetugas } from '../types';
import { Target as TargetIcon, TrendingUp, Users, Wallet, Star, Trophy, Medal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TargetSDMProps {
  kategori: Kategori[];
  transaksi: Transaksi[];
  targets: TargetPerPetugas;
  petugasList: string[];
}

export default function TargetSDM({ kategori, transaksi, targets, petugasList }: TargetSDMProps) {
  const [selectedKat, setSelectedKat] = useState("");

  const dataRows = useMemo(() => {
    if (!selectedKat) return [];
    
    const rawRows = petugasList.map(p => {
      const tgt = (targets[selectedKat] || {})[p] || { rev: 0, vis: 0 };
      const trs = transaksi.filter(t => t.petugas === p && t.kategori === selectedKat);
      const rR = trs.reduce((sum, t) => sum + (Number(t.nominal) || 0), 0);
      const rV = Number(trs.length) || 0;
      const pctR = (Number(tgt.rev) || 0) > 0 ? (rR / (Number(tgt.rev) || 0)) * 100 : 0;
      const pctV = (Number(tgt.vis) || 0) > 0 ? (rV / (Number(tgt.vis) || 0)) * 100 : 0;
      
      return { p, tgt, rR, rV, pctR, pctV };
    });

    const totalRevenue = rawRows.reduce((s, r) => s + (Number(r.rR) || 0), 0);
    const maxContribution = rawRows.length > 0 ? Math.max(...rawRows.map(r => Number(r.rR) || 0)) : 0;

    return rawRows.map(r => ({
      ...r,
      kontribusi: totalRevenue > 0 ? (r.rR / totalRevenue) * 100 : 0,
      isTop: r.rR === maxContribution && maxContribution > 0
    }));
  }, [selectedKat, targets, transaksi, petugasList]);

  const overallStats = useMemo(() => {
    if (!selectedKat || dataRows.length === 0) return null;
    const totalTgtRev = dataRows.reduce((s, r) => s + (Number(r.tgt.rev) || 0), 0);
    const totalRealRev = dataRows.reduce((s, r) => s + (Number(r.rR) || 0), 0);
    const totalTgtVis = dataRows.reduce((s, r) => s + (Number(r.tgt.vis) || 0), 0);
    const totalRealVis = dataRows.reduce((s, r) => s + (Number(r.rV) || 0), 0);
    
    return {
      totalRealRev,
      avgPctR: totalTgtRev > 0 ? (totalRealRev / totalTgtRev) * 100 : 0,
      avgPctV: totalTgtVis > 0 ? (totalRealVis / totalTgtVis) * 100 : 0
    };
  }, [selectedKat, dataRows]);

  return (
    <div className="space-y-6">
      {/* Header Section with Cool Select Box */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-pink-500/20 rounded-2xl flex items-center justify-center border border-pink-500/30 shadow-[0_0_20px_rgba(236,72,153,0.2)]">
            <TargetIcon size={32} className="text-pink-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none italic">Monitoring <span className="text-pink-400">Target</span> SDM</h2>
            <p className="text-[10px] font-bold opacity-40 tracking-[0.2em] uppercase mt-1">Real-time Performance Metrics 2026</p>
          </div>
        </div>

        <div className="relative group w-full xl:w-72">
          <select 
            value={selectedKat} 
            onChange={(e) => setSelectedKat(e.target.value)}
            className="select select-bordered w-full bg-black/40 border-pink-500/30 text-white font-bold h-12 rounded-xl focus:border-pink-500 transition-all custom-select shadow-lg uppercase text-xs"
          >
            <option value="">PILIH KATEGORI PEMANTAUAN</option>
            {kategori.map(k => <option key={k.nama} value={k.nama}>{k.nama}</option>)}
          </select>
          <div className="absolute -top-2 -right-2 bg-pink-500 text-[8px] font-black text-white px-2 py-0.5 rounded-full shadow-lg">READY</div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {overallStats && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div className="glass p-5 rounded-2xl border-l-4 border-pink-500 flex items-center gap-4 bg-pink-500/5 group hover:bg-pink-500/10 transition-all">
              <div className="p-3 bg-pink-500/20 rounded-xl group-hover:scale-110 transition-transform">
                <Wallet className="text-pink-400" size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">Total Real Revenue</p>
                <p className="text-lg font-mono font-bold text-white leading-none">Rp {overallStats.totalRealRev.toLocaleString()}</p>
              </div>
            </div>

            <div className="glass p-5 rounded-2xl border-l-4 border-emerald-500 flex items-center gap-4 bg-emerald-500/5">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <TrendingUp className="text-emerald-400" size={20} />
              </div>
              <div className="flex-grow">
                <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">Avg Growth (Rev)</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-mono font-bold text-emerald-400">{overallStats.avgPctR.toFixed(1)}%</p>
                  <progress className="progress progress-success w-12" value={overallStats.avgPctR} max="100"></progress>
                </div>
              </div>
            </div>

            <div className="glass p-5 rounded-2xl border-l-4 border-blue-500 flex items-center gap-4 bg-blue-500/5">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Users className="text-blue-400" size={20} />
              </div>
              <div>
                <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">Total Real Visits</p>
                <p className="text-xl font-black text-white leading-none">{overallStats.totalRealVis}</p>
              </div>
            </div>

            <div className="glass p-5 rounded-2xl border-l-4 border-amber-500 flex items-center gap-4 bg-amber-500/5">
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <Star className="text-amber-400" size={20} />
              </div>
              <div className="flex-grow">
                <p className="text-[9px] font-black opacity-40 uppercase tracking-widest">Avg Visit Goal</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-mono font-bold text-amber-400">{overallStats.avgPctV.toFixed(1)}%</p>
                  <progress className="progress progress-warning w-12" value={overallStats.avgPctV} max="100"></progress>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        layout
        className="glass p-8 rounded-[2.5rem] overflow-x-auto border border-white/5 shadow-2xl bg-black/20"
      >
        <table className="table table-md w-full border-separate border-spacing-y-2">
          <thead className="bg-pink-500/10 rounded-xl overflow-hidden shadow-inner">
            <tr className="border-none">
              <th className="rounded-l-2xl py-5 px-6 font-black text-pink-400 text-xs tracking-widest uppercase">Petugas</th>
              <th className="font-black text-white/40 text-[10px] tracking-tighter uppercase text-center border-l border-white/5">Target SDM</th>
              <th className="font-black text-white/40 text-[10px] tracking-tighter uppercase text-center border-l border-white/5">Realisasi Capaian</th>
              <th className="font-black text-white/40 text-[10px] tracking-tighter uppercase text-center border-l border-white/5">% Kontribusi</th>
              <th className="font-black text-white/40 text-[10px] tracking-tighter uppercase text-center border-l border-white/5">Target Kunjungan</th>
              <th className="font-black text-white/40 text-[10px] tracking-tighter uppercase text-center border-l border-white/5">Kunjungan Real</th>
              <th className="rounded-r-2xl font-black text-white/40 text-[10px] tracking-tighter uppercase text-center border-l border-white/5">Capaian Visit</th>
            </tr>
          </thead>
          <tbody className="before:block before:h-4">
            {dataRows.map((row, idx) => (
              <motion.tr 
                key={row.p} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group hover:bg-white/5 transition-all outline outline-1 outline-transparent hover:outline-pink-500/30 rounded-2xl cursor-default"
              >
                <td className={`py-4 px-6 rounded-l-2xl font-black uppercase italic text-sm transition-colors flex items-center gap-2 ${row.isTop ? 'text-amber-400 bg-amber-500/10' : 'text-white group-hover:text-pink-400'}`}>
                  {row.isTop && <Trophy size={16} className="text-amber-500 animate-bounce" />}
                  {row.p}
                </td>
                <td className={`font-mono text-center ${row.isTop ? 'bg-amber-500/5' : 'bg-black/20'}`}>
                  <p className="text-[11px] font-black text-white">Rp {row.tgt.rev.toLocaleString()}</p>
                </td>
                <td className={`text-center ${row.isTop ? 'bg-amber-500/10' : 'bg-emerald-500/5'}`}>
                   <p className={`${row.isTop ? 'text-amber-400' : 'text-emerald-400'} font-black font-mono text-[13px]`}>Rp {row.rR.toLocaleString()}</p>
                </td>
                <td className={row.isTop ? 'bg-amber-500/15' : 'bg-black/20'}>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2 w-full justify-center px-4">
                      {row.isTop && <Medal size={12} className="text-amber-500" />}
                      <span className={`text-[12px] font-black font-mono ${row.isTop ? 'text-amber-400' : 'text-pink-400'}`}>{row.kontribusi.toFixed(1)}%</span>
                    </div>
                  </div>
                </td>
                <td className={`font-mono text-center ${row.isTop ? 'bg-amber-500/5' : ''}`}>
                   <p className="text-[11px] font-black text-white/80">{row.tgt.vis}</p>
                </td>
                <td className={`text-center ${row.isTop ? 'bg-amber-500/10' : 'bg-blue-500/5'}`}>
                  <p className={`${row.isTop ? 'text-amber-400' : 'text-blue-400'} font-black font-mono text-[13px]`}>{row.rV}</p>
                </td>
                <td className={`rounded-r-2xl pl-4 pr-6 ${row.isTop ? 'bg-amber-500/15' : 'bg-black/20'}`}>
                  <div className="flex items-center gap-3">
                    <progress className={`progress h-1 flex-grow ${row.pctV >= 100 ? 'progress-success' : (row.isTop ? 'progress-warning' : 'progress-info')}`} value={row.pctV} max="100"></progress>
                    <span className={`text-[10px] font-black font-mono w-12 text-right ${row.pctV >= 100 ? 'text-success' : (row.isTop ? 'text-amber-400' : 'text-info')}`}>{row.pctV.toFixed(1)}%</span>
                  </div>
                </td>
              </motion.tr>
            ))}
            {!selectedKat && (
              <tr>
                <td colSpan={7} className="text-center py-32 rounded-3xl">
                  <div className="flex flex-col items-center gap-4 opacity-20 group">
                    <TargetIcon size={64} className="group-hover:rotate-45 transition-transform duration-700" />
                    <p className="uppercase font-black tracking-[0.4em] text-xl">Sila Pilih Kategori</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
