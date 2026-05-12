import React, { useState, useEffect } from 'react';
import { BookOpen, Edit3, Save, History, CheckCircle, Info, ShieldCheck, Zap, UserCheck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppDoc } from '../types';

interface WACBGRulesProps {
  doc: AppDoc | null;
  onSave: (doc: AppDoc) => Promise<void>;
  userEmail: string | null;
}

const DEFAULT_CONTENT = `### 📋 PANDUAN & ATURAN WA PERSONAL SDM CABANG

Selamat datang di modul **WA Personal SDM Cabang**. Modul ini dirancang untuk memudahkan komunikasi personal kepada pelanggan dengan tetap menjaga keamanan akun WhatsApp Anda.

#### 🛡️ SISTEM ANTI-BAN (COOLING DOWN)
Untuk mencegah nomor Anda terblokir oleh sistem WhatsApp, kami menerapkan aturan ketat:
*   **Limit Pengiriman**: Maksimal 5 pesan dalam waktu kurang dari 5 menit.
*   **Masa Pemulihan**: Jika batas terlampaui, sistem akan mengunci tombol kirim selama **1 Jam**.
*   **Individu**: Aturan ini berlaku per nama petugas. Jika Petugas A sedang cooling down, Petugas B tetap bisa bekerja normal.

#### ⚙️ FITUR UNGGULAN & SISTEM CERDAS
1.  **Counter Frekuensi Hubungi**: Sistem mencacat otomatis berapa kali seorang pasien telah dihubungi oleh petugas manapun di seluruh cabang, guna menghindari over-komunikasi.
2.  **Anti-Duplikat Data**: Saat import target, sistem melakukan validasi ID Pasien dan Nomor HP secara real-time untuk memastikan tidak ada data ganda yang masuk ke antrean petugas.
3.  **Manajemen Nomor Non-WA**: Fitur "Tandai Tidak Ada WA" akan menghapus nomor tersebut dari daftar antrean distribusi, sehingga petugas lain tidak akan mendapatkan nomor yang tidak aktif lagi di kemudian hari.
4.  **Dynamic Variable Engine**: Gunakan placeholder seperti \`<NAMA>\`, \`<TITLE>\`, dan \`<WAKTU>\` untuk pesan yang terasa personal dan otentik.
5.  **Smart Distribution**: Admin dapat membagi target secara merata kepada seluruh staff cabang berdasarkan beban kerja masing-masing.
6.  **Resend Protection**: Tombol "Kirim Ulang" kini tersedia pada status SENT untuk memudahkan follow-up pesan yang belum direspon tanpa harus menginput ulang data.

#### 📝 ATURAN ETIKA PETUGAS
*   Dilarang memanipulasi status pengiriman tanpa benar-benar mengirim pesan ke WhatsApp.
*   WAJIB menggunakan salam sesuai waktu (\`<WAKTU>\`) untuk menjaga profesionalisme.
*   Dilarang keras menyebarkan data pasien di luar kepentingan dinas perusahaan.

---
*Konten ini dikelola secara eksklusif oleh Admin Utama (Fauzan Fawwaz).*`;

export default function WACBGRules({ doc, onSave, userEmail }: WACBGRulesProps) {
  const isAdmin = userEmail?.toLowerCase() === 'fauzanfawwaz2404@gmail.com';
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(doc?.content || DEFAULT_CONTENT);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (doc) setContent(doc.content);
  }, [doc]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        id: 'rules_sdm_cabang',
        content,
        lastUpdatedBy: userEmail || 'Unknown',
        lastUpdated: new Date().toISOString()
      });
      setIsEditing(false);
    } catch (error) {
      alert("Gagal menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-1 sm:p-2">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
        <div>
          <h2 className="text-xl sm:text-3xl font-black text-(--text-color) tracking-tighter italic uppercase flex items-center gap-2 sm:gap-3">
            <BookOpen className="text-blue-500 w-6 h-6 sm:w-8 sm:h-8" /> INFO & ATURAN SDM CABANG
          </h2>
          <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 tracking-widest uppercase mt-0 sm:mt-1">Panduan Penggunaan & Keamanan Sistem</p>
        </div>
        
        {isAdmin && (
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`btn h-12 px-6 rounded-xl font-black text-[10px] tracking-[0.2em] uppercase shadow-xl transition-all ${isEditing ? 'btn-success shadow-emerald-500/20' : 'bg-white/10 hover:bg-white/20 text-white shadow-white/5'}`}
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="loading loading-spinner loading-xs mr-2"></span>
            ) : isEditing ? (
              <Save size={18} className="mr-2" />
            ) : (
              <Edit3 size={18} className="mr-2" />
            )}
            {isEditing ? 'SIMPAN PERUBAHAN' : 'EDIT KONTEN'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="glass p-8 rounded-[3rem] border border-white/10 shadow-2xl bg-black/20 min-h-[500px] relative overflow-hidden">
             {/* Decorative */}
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <ShieldCheck size={120} />
             </div>

             <AnimatePresence mode="wait">
               {isEditing ? (
                 <motion.div 
                   key="edit"
                   initial={{ opacity: 0 }} 
                   animate={{ opacity: 1 }} 
                   exit={{ opacity: 0 }}
                   className="h-full flex flex-col gap-4"
                 >
                   <textarea 
                     value={content}
                     onChange={(e) => setContent(e.target.value)}
                     className="w-full h-[500px] bg-black/40 border border-white/10 rounded-2xl p-6 text-sm font-medium text-slate-200 outline-none focus:border-blue-500/50 transition-all custom-scrollbar resize-none"
                     placeholder="Tulis aturan di sini... (Mendukung Markdown sederhana)"
                   />
                   <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      <Info size={14} className="text-blue-500" /> Tips: Gunakan format markdown untuk estetika (###, **, *).
                   </div>
                 </motion.div>
               ) : (
                 <motion.div 
                   key="view"
                   initial={{ opacity: 0 }} 
                   animate={{ opacity: 1 }} 
                   exit={{ opacity: 0 }}
                   className="prose prose-invert prose-emerald max-w-none prose-h3:text-2xl prose-h3:font-black prose-h3:italic prose-h3:tracking-tighter prose-h3:uppercase prose-h3:text-white prose-p:text-slate-400 prose-li:text-slate-400 prose-strong:text-emerald-400 prose-hr:border-white/5"
                 >
                   {content.split('\n').map((line, i) => {
                     if (line.startsWith('### ')) return <h3 key={i} className="mb-4">{line.replace('### ', '')}</h3>;
                     if (line.startsWith('#### ')) return <h4 key={i} className="text-lg font-black text-blue-400 uppercase tracking-tight mb-2 mt-6">{line.replace('#### ', '')}</h4>;
                     if (line.startsWith('* ')) return <li key={i} className="ml-4 list-disc mb-1">{line.replace('* ', '')}</li>;
                     if (line.startsWith('---')) return <hr key={i} className="my-8 border-white/5" />;
                     if (line.trim() === '') return <div key={i} className="h-4" />;
                     
                     // Simple bold parsing
                     const parts = line.split(/(\*\*.*?\*\*)/g);
                     return (
                       <p key={i} className="mb-2 leading-relaxed">
                         {parts.map((part, pi) => {
                           if (part.startsWith('**') && part.endsWith('**')) {
                             return <strong key={pi}>{part.slice(2, -2)}</strong>;
                           }
                           return part;
                         })}
                       </p>
                     );
                   })}
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-6">
           {/* Info Cards */}
           <div className="glass p-8 rounded-[3rem] border border-emerald-500/10 bg-emerald-500/5 shadow-2xl">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 mb-4">
                 <Zap size={24} />
              </div>
              <h4 className="text-lg font-black text-white italic uppercase tracking-tighter mb-2">QUICK TIPS</h4>
              <p className="text-xs font-bold text-slate-400 leading-relaxed">
                 Gunakan selalu variabel waktu {'<WAKTU>'} agar pesan tidak dianggap sebagai spam oleh bot WhatsApp.
              </p>
           </div>

           <div className="glass p-8 rounded-[3rem] border border-blue-500/10 bg-blue-500/5 shadow-2xl">
              <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 mb-4">
                 <UserCheck size={24} />
              </div>
              <h4 className="text-lg font-black text-white italic uppercase tracking-tighter mb-2">AUTH STATUS</h4>
              <p className="text-xs font-bold text-slate-400 mb-4">
                 Status Pengguna:
              </p>
              <div className="flex items-center gap-3 px-4 py-3 bg-black/40 rounded-2xl border border-white/5">
                 <div className={`w-3 h-3 rounded-full ${isAdmin ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`}></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                    {isAdmin ? 'Admin Utama (Editor Access)' : 'Petugas (Read Only)'}
                 </span>
              </div>
           </div>

           <div className="glass p-8 rounded-[3rem] border border-amber-500/10 bg-amber-500/5 shadow-2xl">
              <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20 mb-4">
                 <Clock size={24} />
              </div>
              <h4 className="text-lg font-black text-white italic uppercase tracking-tighter mb-2">LAST UPDATED</h4>
              <div className="space-y-4">
                 <div>
                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">OLEH PETUGAS</div>
                    <div className="text-xs font-bold text-amber-500 uppercase">{doc?.lastUpdatedBy || 'System Default'}</div>
                 </div>
                 <div>
                    <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">PADA TANGGAL</div>
                    <div className="text-xs font-bold text-slate-300 uppercase">
                       {doc?.lastUpdated ? new Date(doc.lastUpdated).toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
