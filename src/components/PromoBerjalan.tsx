import React, { useState } from 'react';
import { Promo, Transaksi, Kategori } from '../types';
import { Tag, ArrowLeft, Calendar, History, FolderOpen, Maximize2, X, Info, TrendingUp, DollarSign, Users, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PromoBerjalanProps {
  promos: Promo[];
  transaksi: Transaksi[];
  kategori: Kategori[];
}

export default function PromoBerjalan({ promos, transaksi, kategori }: PromoBerjalanProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewingPromo, setViewingPromo] = useState<Promo | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const categories = kategori.map(k => k.nama);
  const today = new Date().toISOString().split('T')[0];

  const getStatus = (expDate: string) => {
    if (!expDate) return 'active';
    return expDate < today ? 'expired' : 'active';
  };

  const ZoomableImage = ({ src, alt }: { src: string, alt: string }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);

    const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.min(Math.max(scale + delta, 0.5), 5);
      setScale(newScale);
    };

    return (
      <div 
        className="w-full h-full overflow-hidden flex items-center justify-center cursor-move bg-black/40"
        onWheel={handleWheel}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={(e) => {
          if (isDragging) {
            setPosition(prev => ({
              x: prev.x + e.movementX,
              y: prev.y + e.movementY
            }));
          }
        }}
      >
        <motion.img
          src={src}
          alt={alt}
          animate={{ scale, x: position.x, y: position.y }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="max-w-full max-h-full object-contain pointer-events-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1.5 rounded-full border border-white/20 text-[10px] font-black uppercase text-white pointer-events-none flex items-center gap-2">
          <span>Scroll Mouse untuk Zoom</span>
          <div className="w-px h-3 bg-white/20" />
          <span>Geser untuk Melihat Rincian</span>
        </div>
      </div>
    );
  };

  const PromoDetailModal = ({ p, onClose }: { p: Promo, onClose: () => void }) => {
    const trs = transaksi.filter(t => t.promo === p.nama);
    const count = trs.length;
    const totalRev = trs.reduce((sum, t) => sum + Number(t.nominal), 0);
    const cInfo = kategori.find(k => k.nama === p.kategori);
    const isExp = getStatus(cInfo?.expDate || '') === 'expired';

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="glass w-full max-w-5xl rounded-[2.5rem] overflow-hidden border border-white/10 relative shadow-2xl flex flex-col md:flex-row max-h-[95vh]"
        >
          <button onClick={onClose} className="absolute top-4 right-4 z-10 btn btn-circle btn-sm glass border-white/20 text-white hover:bg-red-500 hover:text-white transition-all">
            <X size={20} />
          </button>

          {/* Left: Image/Brosur Section with Scroll Zoom */}
          <div className="w-full md:w-1/2 bg-black/50 flex items-center justify-center relative min-h-[400px] border-r border-white/5">
            {cInfo?.imageUrl ? (
              <ZoomableImage src={cInfo.imageUrl} alt={p.nama} />
            ) : (
              <div className="flex flex-col items-center opacity-20">
                <Tag size={64} />
                <p className="mt-4 font-black text-xs tracking-widest uppercase">No Visual Attachment</p>
              </div>
            )}
          </div>

          {/* Right: Info Section */}
          <div className="w-full md:w-1/2 p-8 md:p-10 overflow-y-auto bg-slate-900/40">
            <div className="flex items-center gap-3 mb-6">
              <span className={`badge ${isExp ? 'badge-ghost' : 'badge-warning'} font-black text-[10px] uppercase h-6 px-3`}>{p.kategori}</span>
              <span className={`text-[10px] font-black uppercase ${
                cInfo?.mode === 'Online' ? 'text-blue-400' : 
                cInfo?.mode === 'Online & Offline' ? 'text-purple-400' : 
                'text-emerald-400'
              }`}>{cInfo?.mode || 'OFFLINE'}</span>
            </div>

            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2 leading-tight">{p.nama}</h2>
            <div className="flex items-center gap-4 mb-8">
              <p className="text-xl font-mono font-black text-emerald-400 italic">Rp {Number(p.harga).toLocaleString()}</p>
              <div className="h-4 w-px bg-white/10" />
              <p className="text-[10px] uppercase font-bold text-white/50">Expiry: <span className={isExp ? 'text-red-400' : 'text-amber-400'}>{cInfo?.expDate || '-'}</span></p>
            </div>

            {/* Stats Grid - Fixed Layout with better spacing */}
            <div className="space-y-4 mb-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 bg-white/5 p-5 rounded-3xl border border-white/5 shadow-inner">
                  <div className="flex items-center gap-2 opacity-50 mb-2">
                    <Users size={14} className="text-blue-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Kunjungan</span>
                  </div>
                  <p className="text-3xl font-black text-white font-mono">{count}</p>
                </div>
                
                <div className="flex-[1.5] bg-white/5 p-5 rounded-3xl border border-white/5 shadow-inner">
                  <div className="flex items-center gap-2 opacity-50 mb-2">
                    <TrendingUp size={14} className="text-amber-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Share Performa</span>
                  </div>
                  <p className="text-3xl font-black text-blue-400 font-mono italic">
                    {((count / (transaksi.length || 1)) * 100).toFixed(1)}<span className="text-sm ml-1 opacity-50 uppercase not-italic">%</span>
                  </p>
                </div>
              </div>

              <div className="w-full bg-white/5 p-6 rounded-3xl border border-emerald-400/10 shadow-inner">
                <div className="flex items-center gap-2 opacity-50 mb-3">
                  <DollarSign size={16} className="text-emerald-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Total Revenue Dihasilkan</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-emerald-400/40">Rp</span>
                  <p className="text-4xl font-black text-emerald-400 font-mono tracking-tighter">
                    {totalRev.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4 p-5 bg-amber-400/5 rounded-3xl border border-amber-400/10">
                <Info size={18} className="text-amber-400 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-[10px] font-black uppercase text-amber-400 mb-2 tracking-widest">Insight Strategis</h4>
                  <p className="text-[11px] text-white/70 leading-relaxed font-medium">
                    Promo kategori <span className="text-white font-bold">{p.kategori}</span> berstatus <span className={isExp ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{isExp ? 'EXPIRED' : 'AKTIF'}</span>. 
                    Target utama: mengoptimalkan {
                      cInfo?.mode === 'Online' ? 'reservasi aplikasi U-By Prodia' : 
                      cInfo?.mode === 'Online & Offline' ? 'reservasi aplikasi & kunjungan on-site' :
                      'kunjungan customer Care Depok (On-Site)'
                    }.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  if (!selectedCategory) {
    const activeCategories = categories.filter(cat => {
      const catInfo = kategori.find(k => k.nama === cat);
      return getStatus(catInfo?.expDate || '') === 'active';
    });
    
    const expiredCategories = categories.filter(cat => {
      const catInfo = kategori.find(k => k.nama === cat);
      return getStatus(catInfo?.expDate || '') === 'expired';
    });

    return (
      <div className="space-y-12">
        {activeCategories.length > 0 && (
          <section>
            <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
              <Calendar size={14} className="text-emerald-400" /> Kategori Promo Aktif
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeCategories.map((cat, idx) => {
                const catItems = promos.filter(p => p.kategori === cat);
                if (catItems.length === 0) return null;

                return (
                  <motion.div 
                    key={cat}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedCategory(cat)}
                    className="glass p-8 rounded-[2.5rem] border border-emerald-500/10 hover:border-emerald-400/50 hover:bg-emerald-400/5 transition-all cursor-pointer group relative overflow-hidden flex flex-col items-center justify-center text-center h-64"
                  >
                    <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <FolderOpen size={180} />
                    </div>
                    <div className="w-16 h-16 bg-emerald-400/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Tag size={32} className="text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">{cat}</h3>
                    <p className="text-[10px] font-bold opacity-40 uppercase mt-2 tracking-widest">
                      {catItems.length} Promos (<span className="text-emerald-400 font-black">ACTIVE</span>)
                    </p>
                    <div className="mt-6 px-4 py-1.5 bg-white/5 rounded-full text-[9px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                      Lihat Detail
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {expiredCategories.length > 0 && (
          <section>
            <h3 className="text-xs font-black text-white/20 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
              <History size={14} className="text-red-400/50" /> Kategori Promo Expired
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {expiredCategories.map((cat, idx) => {
                const catItems = promos.filter(p => p.kategori === cat);
                if (catItems.length === 0) return null;

                return (
                  <motion.div 
                    key={cat}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setSelectedCategory(cat)}
                    className="glass p-8 rounded-[2.5rem] border border-red-500/20 bg-red-500/5 grayscale opacity-70 hover:opacity-100 hover:grayscale-0 hover:border-red-400 transition-all cursor-pointer group relative overflow-hidden flex flex-col items-center justify-center text-center h-64"
                  >
                    <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity text-red-500">
                      <FolderOpen size={180} />
                    </div>
                    <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Tag size={32} className="text-red-500" />
                    </div>
                    <h3 className="text-xl font-black text-white/60 uppercase italic tracking-tighter line-through decoration-red-500/50">{cat}</h3>
                    <p className="text-[10px] font-bold text-red-400 uppercase mt-2 tracking-widest bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                      EXPIRED
                    </p>
                    <div className="mt-6 px-4 py-1.5 bg-white/5 rounded-full text-[9px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                      Arsip Data
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    );
  }

  const catPromos = promos.filter(p => p.kategori === selectedCategory);
  const catInfo = kategori.find(k => k.nama === selectedCategory);
  const activePromos = catPromos.filter(p => getStatus(catInfo?.expDate || '') === 'active');
  const expiredPromos = catPromos.filter(p => getStatus(catInfo?.expDate || '') === 'expired');

  // Compute Analytics
  const catStats = catPromos.map(p => {
    const trs = transaksi.filter(t => t.promo === p.nama);
    return {
      promo: p,
      count: trs.length,
      totalRev: trs.reduce((sum, t) => sum + Number(t.nominal), 0),
      trs
    };
  }).sort((a, b) => b.count - a.count);

  const totalCategoryRev = catStats.reduce((sum, s) => sum + s.totalRev, 0);
  const totalCategoryCount = catStats.reduce((sum, s) => sum + s.count, 0);

  const bestSeller = catStats.find(s => s.count > 0);
  const roomToGrow = [...catStats].reverse().find(s => s.count > 0 && s.promo.nama !== bestSeller?.promo.nama);
  const notSoldYet = catStats.filter(s => s.count === 0);

  const allTransactions = catStats.flatMap(s => s.trs).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const PromoCard = ({ p, isExpired, idx }: { p: Promo, isExpired: boolean, idx: number }) => {
    const trs = transaksi.filter(t => t.promo === p.nama);
    const count = trs.length;
    const totalRev = trs.reduce((sum, t) => sum + Number(t.nominal), 0);
    
    // User requested "tempelkan saja gambar brosur di Menu Promo Berjalan yang pertama"
    const fallbackImage = (idx === 0 && !isExpired) ? "https://picsum.photos/seed/brosur/600/900" : "";
    const activeImage = catInfo?.imageUrl || fallbackImage;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setViewingPromo(p)}
        className={`glass p-6 rounded-3xl border cursor-pointer transition-all shadow-lg overflow-hidden relative group ${
          isExpired 
            ? 'border-red-500/20 bg-red-500/5 opacity-60 grayscale' 
            : 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]'
        }`}
      >
        <div className="flex justify-between items-start mb-4">
          <span className={`badge ${isExpired ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'} border-none badge-sm font-black uppercase`}>
            {isExpired ? 'EXPIRED' : 'AKTIF'}
          </span>
          <span className={`text-[10px] ${
            isExpired ? 'text-white/30' : (
              catInfo?.mode === 'Online' ? 'text-blue-400' : 
              catInfo?.mode === 'Online & Offline' ? 'text-purple-400' : 
              'text-emerald-400'
            )} font-black uppercase italic`}>
            {catInfo?.mode || 'OFFLINE'}
          </span>
        </div>
        <div className="flex gap-4 mb-4">
          <div 
            className={`w-16 h-16 rounded-xl bg-black/40 overflow-hidden flex-shrink-0 border ${isExpired ? 'border-red-500/20' : 'border-emerald-500/20'} group-hover:scale-105 transition-transform relative group/img shadow-xl`}
            onClick={(e) => {
              if (activeImage) {
                e.stopPropagation();
                setZoomedImage(activeImage);
              }
            }}
          >
            {activeImage ? (
              <>
                <img src={activeImage} className="w-full h-full object-cover" alt={p.nama} />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                  <Maximize2 size={12} className="text-white" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-20">
                <Tag size={24} />
              </div>
            )}
          </div>
          <div className="flex-grow">
            <h3 className="text-md font-black text-white mb-1 uppercase truncate max-w-[150px] italic tracking-tight">{p.nama}</h3>
            <p className="text-[10px] uppercase font-bold text-white/40">Exp: <span className={`${isExpired ? 'text-red-400' : 'text-amber-400'} font-mono`}>{catInfo?.expDate || '-'}</span></p>
            <p className={`text-sm ${isExpired ? 'text-red-400/50' : 'text-emerald-400'} font-black italic`}>Rp {Number(p.harga).toLocaleString()}</p>
          </div>
        </div>
        <div className={`grid grid-cols-2 gap-2 border-t ${isExpired ? 'border-red-500/10' : 'border-emerald-500/10'} pt-4`}>
          <div>
            <p className="text-[8px] opacity-40 uppercase font-black tracking-widest">Kunjungan</p>
            <p className="text-sm font-black text-white font-mono">{count}</p>
          </div>
          <div>
            <p className="text-[8px] opacity-40 uppercase font-black tracking-widest">Revenue</p>
            <p className={`text-sm font-black font-mono ${isExpired ? 'text-white/30' : 'text-emerald-400'}`}>Rp {totalRev.toLocaleString()}</p>
          </div>
        </div>
        
        {isExpired && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] border-4 border-red-500/50 text-red-500/50 font-black text-2xl px-4 py-1 rounded-xl pointer-events-none uppercase tracking-tighter">
            EXPIRED
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between bg-slate-900/40 p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedCategory(null)}
            className="btn btn-circle btn-sm glass border-white/10 text-white hover:bg-amber-400 hover:text-black transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-xl font-black text-white uppercase italic tracking-tighter leading-none">
              Kategori: <span className="text-amber-400">{selectedCategory}</span>
            </h2>
            <p className="text-[9px] font-bold opacity-30 uppercase tracking-[0.2em] mt-1">Daftar Promo Aktif & Arsip</p>
          </div>
        </div>
      </div>

      <div className="space-y-12 pb-20">
        {/* Analytics Insights */}
        {catStats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass p-6 rounded-[2rem] border border-emerald-500/10 bg-emerald-500/5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp size={64} className="text-emerald-400" />
              </div>
              <div className="relative z-10">
                <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Terlaris (Top Performance)</h4>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-xl font-black text-white italic truncate max-w-[200px]">
                    {bestSeller ? bestSeller.promo.nama : 'BELUM ADA'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[8px] opacity-40 uppercase font-black">Sales</p>
                    <p className="text-sm font-black text-white">{bestSeller?.count || 0}</p>
                  </div>
                  <div className="h-4 w-px bg-white/10" />
                  <div>
                    <p className="text-[8px] opacity-40 uppercase font-black">Revenue</p>
                    <p className="text-sm font-black text-emerald-400">Rp {(bestSeller?.totalRev || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass p-6 rounded-[2rem] border border-amber-500/10 bg-amber-500/5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users size={64} className="text-amber-400" />
              </div>
              <div className="relative z-10">
                <h4 className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Perlu Perhatian (Low Sales)</h4>
                <p className="text-xl font-black text-white italic truncate max-w-[200px]">
                  {roomToGrow ? roomToGrow.promo.nama : 'STABIL'}
                </p>
                <p className="text-[9px] text-white/40 mt-2 font-medium">Bantu dengan strategi promo khusus atau reminder petugas.</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass p-6 rounded-[2rem] border border-white/5 bg-white/5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Tag size={64} className="text-white" />
              </div>
              <div className="relative z-10">
                <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Belum Terjual</h4>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-white font-mono">{notSoldYet.length}</p>
                  <p className="text-[10px] font-black text-white/30 uppercase italic">Kategori Produk</p>
                </div>
                <div className="mt-2 flex -space-x-2">
                  {notSoldYet.slice(0, 5).map((s, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-white/10 border border-black flex items-center justify-center text-[8px] font-black text-white/40">
                      {s.promo.nama.charAt(0)}
                    </div>
                  ))}
                  {notSoldYet.length > 5 && (
                    <div className="w-6 h-6 rounded-full bg-white/5 border border-black flex items-center justify-center text-[8px] font-black text-white/40">
                      +{notSoldYet.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Active Section */}
        {activePromos.length > 0 && (
          <section>
            <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
              <Calendar size={14} className="text-emerald-400" /> Promo Berjalan Saat Ini
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePromos.map((p, idx) => (
                <div key={`active-${idx}`}>
                  <PromoCard p={p} isExpired={false} idx={idx} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Expired Section */}
        {expiredPromos.length > 0 && (
          <section>
            <div className="h-px bg-white/5 mb-12 shadow-[0_0_10px_rgba(255,255,255,0.05)]" />
            <h3 className="text-xs font-black text-white/20 uppercase tracking-[0.4em] mb-6 flex items-center gap-3">
              <History size={14} className="text-red-400/50" /> Riwayat Promo (Expired)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
              {expiredPromos.map((p, idx) => (
                <div key={`expired-${idx}`}>
                  <PromoCard p={p} isExpired={true} idx={idx} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Detailed Transaction Table */}
        {allTransactions.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.4em] flex items-center gap-3">
                <ClipboardList size={14} className="text-blue-400" /> Rincian Transaksi Kategori
              </h3>
              <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total Revenue</p>
                <p className="text-xs font-black text-white font-mono italic">Rp {totalCategoryRev.toLocaleString()}</p>
              </div>
            </div>
            <div className="glass rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="table w-full border-separate border-spacing-y-0">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="bg-transparent text-[10px] font-black text-white/40 uppercase tracking-widest py-5 pl-8">Waktu Transaksi</th>
                      <th className="bg-transparent text-[10px] font-black text-white/40 uppercase tracking-widest py-5">No. Lab</th>
                      <th className="bg-transparent text-[10px] font-black text-white/40 uppercase tracking-widest py-5 text-center">Item Promo</th>
                      <th className="bg-transparent text-[10px] font-black text-white/40 uppercase tracking-widest py-5">Petugas</th>
                      <th className="bg-transparent text-[10px] font-black text-white/40 uppercase tracking-widest py-5 text-right pr-8">Nominal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTransactions.map((t, idx) => (
                      <tr key={idx} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 pl-8 border-t border-white/5">
                          <p className="text-xs font-medium text-white/60">{new Date(t.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                          <p className="text-[9px] font-black text-white/20 uppercase font-mono">{new Date(t.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="py-4 border-t border-white/5">
                          <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 inline-block">
                            <p className="text-xs font-black text-emerald-400 font-mono tracking-wider">{t.noLab}</p>
                          </div>
                        </td>
                        <td className="py-4 border-t border-white/5">
                          <p className="text-[11px] font-black text-white uppercase italic tracking-tight text-center">{t.promo}</p>
                        </td>
                        <td className="py-4 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-black text-blue-400 uppercase">
                              {t.petugas.charAt(0)}
                            </div>
                            <p className="text-xs font-bold text-white/70">{t.petugas}</p>
                          </div>
                        </td>
                        <td className="py-4 border-t border-white/5 text-right pr-8">
                          <p className="text-xs font-black text-emerald-400 italic">Rp {Number(t.nominal).toLocaleString()}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {allTransactions.length === 0 && (
                <div className="p-12 text-center opacity-20 font-black uppercase tracking-widest text-xs italic">
                  Belum ada rekaman transaksi untuk kategori ini...
                </div>
              )}
            </div>
          </section>
        )}

        {catPromos.length === 0 && (
          <div className="text-center py-20 opacity-20 font-black uppercase tracking-widest">
            Tidak ada promo di kategori ini...
          </div>
        )}
      </div>

      <AnimatePresence>
        {viewingPromo && (
          <PromoDetailModal p={viewingPromo} onClose={() => setViewingPromo(null)} />
        )}
        {zoomedImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomedImage(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-2xl cursor-zoom-out"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative max-w-full max-h-full"
            >
              <img src={zoomedImage} className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl border border-white/10" alt="Zoomed" />
              <button 
                onClick={() => setZoomedImage(null)}
                className="absolute -top-4 -right-4 btn btn-circle btn-sm bg-red-500 border-none text-white hover:bg-red-600 shadow-xl"
              >
                <X size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
