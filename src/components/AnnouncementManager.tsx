import React, { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, Send, X, Clock, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Announcement } from './AnnouncementPopup';
import { motion, AnimatePresence } from 'motion/react';

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success'
  });

  useEffect(() => {
    const q = query(
      collection(db, 'announcements'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];
      setAnnouncements(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.title || !newAnnouncement.message) return;

    try {
      await addDoc(collection(db, 'announcements'), {
        ...newAnnouncement,
        active: true,
        createdAt: serverTimestamp()
      });
      setShowAdd(false);
      setNewAnnouncement({ title: '', message: '', type: 'info' });
    } catch (error) {
      console.error("Error adding announcement:", error);
      alert("Gagal mengirim pengumuman.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pengumuman ini?')) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
    } catch (error) {
      console.error("Error deleting announcement:", error);
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, 'announcements', id), {
        active: !current
      });
    } catch (error) {
      console.error("Error toggling active:", error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">
            BROADCAST <span className="text-amber-500">PENGUMUMAN</span>
          </h2>
          <p className="text-white/40 font-bold text-[10px] uppercase tracking-[0.4em]">
            Kelola pengumuman real-time untuk seluruh pengguna
          </p>
        </div>

        <button 
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-3 bg-amber-500 hover:bg-amber-400 text-black font-black px-8 py-4 rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-[0_20px_40px_-10px_rgba(245,158,11,0.3)] group"
        >
          <Plus className="group-hover:rotate-90 transition-transform" />
          KIRIM PENGUMUMAN BARU
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="h-64 flex items-center justify-center bg-white/5 rounded-[2.5rem] border border-white/5">
            <span className="loading loading-spinner loading-lg text-amber-500"></span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center bg-white/5 rounded-[2.5rem] border border-white/10 border-dashed">
            <Bell size={48} className="text-white/10 mb-4" />
            <p className="text-white/20 font-black tracking-widest text-[10px]">BELUM ADA PENGUMUMAN</p>
          </div>
        ) : (
          announcements.map((item) => (
            <motion.div 
              layout
              key={item.id}
              className={`p-8 bg-slate-900 border ${item.active ? 'border-amber-500/30' : 'border-white/5'} rounded-[2.5rem] group hover:bg-white/[0.02] transition-colors relative overflow-hidden`}
            >
              {!item.active && <div className="absolute inset-0 bg-black/40 backdrop-grayscale z-10"></div>}
              
              <div className="flex flex-col md:flex-row gap-8 relative z-20">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shrink-0 ${
                   item.type === 'info' ? 'text-blue-400 border-blue-500/20 bg-blue-500/10' :
                   item.type === 'warning' ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' :
                   'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'
                }`}>
                   {item.type === 'info' ? <Info size={32} /> : item.type === 'warning' ? <AlertTriangle size={32} /> : <CheckCircle size={32} />}
                </div>

                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-black text-white italic tracking-tight">{item.title}</h3>
                    {!item.active && <span className="bg-red-500/20 text-red-500 text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest border border-red-500/20 italic">Nonaktif</span>}
                  </div>
                  <p className="text-white/60 leading-relaxed mb-6 whitespace-pre-wrap">{item.message}</p>
                  
                  <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-white/30">
                    <div className="flex items-center gap-2">
                      <Clock size={12} />
                      {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString('id-ID') : 'Sending...'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-3 justify-center shrink-0">
                  <button 
                    onClick={() => toggleActive(item.id, item.active)}
                    className={`px-6 py-3 rounded-xl font-black text-[10px] tracking-widest transition-all ${
                      item.active ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-emerald-500 text-black hover:bg-emerald-400'
                    }`}
                  >
                    {item.active ? 'NONAKTIFKAN' : 'AKTIFKAN'}
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-black text-[10px] tracking-widest transition-all"
                  >
                    HAPUS
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[3rem] p-10 overflow-hidden relative"
            >
               <button 
                onClick={() => setShowAdd(false)}
                className="absolute top-8 right-8 p-3 hover:bg-white/5 rounded-2xl transition-colors text-white/20 hover:text-white"
               >
                <X size={24} />
               </button>

               <div className="mb-10 text-center">
                 <div className="w-20 h-20 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                    <Send size={40} className="text-amber-500" />
                 </div>
                 <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">SIARKAN PENGUMUMAN</h2>
                 <p className="text-white/40 font-bold text-[10px] uppercase tracking-[0.4em]">Data akan langsung muncul di HP seluruh petugas</p>
               </div>

               <form onSubmit={handleCreate} className="space-y-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-4">JUDUL PENGUMUMAN</label>
                   <input 
                     required
                     value={newAnnouncement.title}
                     onChange={e => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-amber-500/50 transition-all font-bold placeholder:text-white/10"
                     placeholder="Tulis judul yang menarik..."
                   />
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-4">ISI PESAN</label>
                   <textarea 
                     required
                     rows={4}
                     value={newAnnouncement.message}
                     onChange={e => setNewAnnouncement(prev => ({ ...prev, message: e.target.value }))}
                     className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-amber-500/50 transition-all font-bold placeholder:text-white/10 resize-none"
                     placeholder="Sampaikan poin-poin penting di sini..."
                   />
                 </div>

                 <div className="grid grid-cols-3 gap-3">
                   {(['info', 'warning', 'success'] as const).map(type => (
                     <button
                       key={type}
                       type="button"
                       onClick={() => setNewAnnouncement(prev => ({ ...prev, type }))}
                       className={`py-6 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                         newAnnouncement.type === type 
                          ? 'bg-amber-500/20 border-amber-500 text-amber-500 scale-105' 
                          : 'bg-white/5 border-white/10 text-white/30 hover:bg-white/10'
                       }`}
                     >
                       {type === 'info' ? <Info /> : type === 'warning' ? <AlertTriangle /> : <CheckCircle />}
                       <span className="text-[10px] font-black uppercase tracking-widest">{type}</span>
                     </button>
                   ))}
                 </div>

                 <button
                   type="submit"
                   className="w-full py-6 bg-amber-500 text-black font-black text-[12px] tracking-[0.4em] rounded-[2rem] hover:bg-amber-400 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl mt-4"
                 >
                   SIARKAN SEKARANG
                 </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
