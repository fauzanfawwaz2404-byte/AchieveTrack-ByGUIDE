import React, { useState } from 'react';
import { BookOpen, Edit, Save, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppDoc } from '../types';

interface AboutFiturProps {
  appDocs: AppDoc[];
  onSave: (doc: AppDoc) => void;
  userEmail?: string | null;
}

const DEFAULT_CONTENT = `### 🚀 AchievTrack 2026 - Customer Care Depok

Aplikasi AchievTrack 2026 adalah ekosistem digital mutakhir yang dirancang khusus untuk memonitoring pencapaian target secara presisi, mengelola database pelanggan strategis (PCC & RFM), serta mengotomatisasi interaksi melalui sinkronisasi cerdas WhatsApp.

#### 📊 Dashboard Utama (High-Level Monitoring)
*   **Real-time Intelligence**: Visualisasi instan pencapaian Revenue dan Visit dengan akurasi data detik per detik.
*   **Precision Tracking**: Grafik analisis komparatif per hari vs target bulanan untuk pengambilan keputusan cepat.
*   **Leaderboard Elite**: Sistem apresiasi Top 5 Petugas untuk mendorong kompetisi positif dan produktivitas.

#### 📝 Monitoring Strategis 2026
*   **Katalog Promo Terintegrasi**: Akses cepat seluruh promo aktif dengan rincian harga, syarat, dan margin profit.
*   **Targeting SDM Presisi**: Rincian target spesifik per individu yang disesuaikan dengan kapasitas dan tren pasar.

#### 📄 Laporan PDF Ekspres (Auto-Generate)
*   **Instan & Profesional**: Hasilkan laporan performa dalam format PDF hanya dengan satu klik (One-Click Reporting).
*   **Layout Estetik**: Desain laporan yang rapi, bersih, dan berstandar korporat, siap untuk dipresentasikan ke direksi.
*   **Full Data Insight**: Mencakup seluruh metrik vital mulai dari detail transaksi hingga grafik perkembangan periodik.

#### 🚶 Walk-In Customer
*   **WIC Performance Tracker**: Monitoring mendalam terhadap arus pelanggan Walk-In untuk optimasi layanan onsite.
*   **Upaya CC Proaktif**: Dokumentasi terukur atas aktivitas Customer Care dalam mengkonversi pengunjung menjadi pelanggan loyal.

#### 👑 PCC & RFM (Customer Intelligence)
*   **Priority Customer Care**: Segmentasi eksklusif pelanggan Gold & Silver untuk strategi retensi yang lebih personal.
*   **Analisis RFM Advanced**: Pemetaan otomatis berdasarkan perilaku belanja (*Recency, Frequency, Monetary*).
*   **Loyalty Management**: Log aktivitas perawatan pelanggan yang sistematis untuk memaksimalkan *Life Time Value*.

#### 🎂 Ultimate Birthday Reminder
*   **AI-Powered Calendar**: Sistem cerdas yang mendeteksi hari ulang tahun pelanggan hari ini dan mendatang.
*   **Direct WA Engagement**: Kirimkan ucapan hangat dan promo ultah langsung melalui integrasi WhatsApp.

#### 📱 WA Personal & Bulk
*   **Smart Queue System**: Pengiriman pesan massal terproteksi dengan jeda waktu aman untuk mencegah blokir.
*   **Smart Target Filtering**: Filter cerdas saat import data untuk membedakan PASIEN BARU (belum pernah dihubungi), SUDAH PERNAH, BLACKLIST, dan TIDAK ADA WA guna akurasi alokasi ke petugas.
*   **Manual Blacklist Hub**: Form input manual untuk memasukkan pasien yang menolak dihubungi langsung dari Dashboard tanpa perlu proses import.
*   **Independent Campaign Scoping**: Pemisahan data dan pengaturan secara total antara Kampanye A (Customer Care) dan Kampanye B (SDM Cabang) sehingga reset satu kampanye tidak mempengaruhi lainnya.
*   **Anti-Ban Cooling Down**: Sistem proteksi otomatis berbasis **individu**. Jika Petugas A mengirim > 5 pesan dalam 5 menit, hanya Petugas A yang dihentikan sementara (1 Jam), Petugas lain tetap bisa lanjut.
*   **Intelligent Contact Tracker**: Sistem mencacat frekuensi setiap pasien dihubungi guna menghindari over-marketing.
*   **Anti-Duplicate Guard**: Validasi ID Pasien dan Nomor HP secara real-time saat import untuk menjaga kebersihan database.
*   **Cleanup Non-WA**: Fitur penanda nomor tidak aktif yang secara otomatis menghapus data dari antrean distribusi berkala.
*   **Concurrent Performance Engine**: Arsitektur real-time yang optimal untuk penggunaan 20+ petugas secara simultan tanpa penurunan performa.
*   **Dynamic Variable Engine**: Pesan yang terasa sangat personal bagi pelanggan dengan automasi nama dan detail unik.

#### 📅 My Calendar & Agenda
*   **Master Schedule**: Manajemen jadwal kunjungan dan penugasan harian yang tersinkronisasi antar tim.
*   **Status Track**: Visualisasi progres tugas (Planned, Completed, Ongoing) dengan interface yang intuitif.

#### 🔗 My Links Essentials
*   **Portal Hub Central**: Penyimpanan terpusat untuk seluruh link internal Prodia dan portal eksternal pendukung.
*   **Fast Access Favorit**: Akses secepat kilat ke sumber daya digital yang paling sering dibutuhkan tim.

#### 🛠️ Master Data & Security
*   **Granular Access Control**: Sistem hak akses berlapis (Super Admin, Editor, Read Only) untuk keamanan data sensitif.
*   **Self-Managed Data**: Kendali penuh atas master kategori dan promo tanpa ketergantungan pada departemen IT.`;

export default function AboutFitur({ appDocs, onSave, userEmail }: AboutFiturProps) {
  const isSuperAdmin = userEmail === 'fauzanfawwaz2404@gmail.com';
  const fiturDoc = appDocs.find(d => d.id === 'fitur_description') || {
    id: 'fitur_description',
    content: DEFAULT_CONTENT,
    lastUpdated: new Date().toISOString()
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(fiturDoc.content);

  const handleSave = () => {
    onSave({
      ...fiturDoc,
      content: editedContent,
      lastUpdatedBy: userEmail || 'System',
      lastUpdated: new Date().toISOString()
    });
    setIsEditing(false);
  };

  // Function to render simple markdown-like formatting
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} className="text-2xl font-black text-amber-500 italic uppercase mb-4 mt-8 first:mt-0">{line.replace('### ', '')}</h3>;
      if (line.startsWith('#### ')) return <h4 key={i} className="text-lg font-black text-white italic uppercase mb-3 mt-6 border-b border-white/10 pb-1">{line.replace('#### ', '')}</h4>;
      if (line.startsWith('*   **')) {
        const parts = line.replace('*   **', '').split('**: ');
        return (
          <div key={i} className="flex gap-3 mb-2 pl-4">
            <CheckCircle2 size={16} className="text-emerald-500 flex-none mt-1" />
            <p className="text-slate-300 text-sm leading-relaxed">
              <span className="font-black text-white uppercase italic text-[11px] tracking-tight">{parts[0]}</span>: {parts[1]}
            </p>
          </div>
        );
      }
      if (line.trim() === '') return <div key={i} className="h-2" />;
      return <p key={i} className="text-slate-400 text-sm leading-relaxed mb-2 pl-1">{line}</p>;
    });
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/20">
            <BookOpen className="text-amber-500" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">FITUR <span className="text-amber-500">APLIKASI</span></h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Detail Fungsionalitas Sistem AchievTrack</p>
          </div>
        </div>
        
        {isSuperAdmin && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-amber-500 hover:text-black text-amber-500 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border border-amber-500/20 italic"
          >
            <Edit size={14} /> Edit Konten
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div 
            key="editing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass p-8 rounded-[2rem] border-2 border-amber-500/30"
          >
            <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 block italic">Editor Dokumentasi Fitur (Markdown Supported)</label>
            <textarea 
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-[600px] bg-black/40 border border-white/10 rounded-2xl p-6 text-slate-300 font-mono text-sm focus:outline-none focus:border-amber-500/50 transition-all custom-scrollbar"
              placeholder="Tuliskan detail fitur di sini..."
            />
            <div className="flex gap-4 mt-6">
              <button 
                onClick={() => {
                  setEditedContent(fiturDoc.content);
                  setIsEditing(false);
                }}
                className="flex-1 h-14 bg-white/5 hover:bg-white/10 text-white font-black uppercase italic rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <X size={18} /> Batalkan
              </button>
              <button 
                onClick={handleSave}
                className="flex-[2] h-14 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase italic rounded-2xl transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <Save size={18} /> Simpan Perubahan
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="viewing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass p-10 rounded-[3rem] border border-white/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles size={200} />
            </div>
            
            <div className="max-w-4xl mx-auto relative z-10">
              {renderContent(fiturDoc.content)}
              
              <div className="mt-12 pt-8 border-t border-white/5 flex justify-between items-center">
                <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                  Last Updated: {new Date(fiturDoc.lastUpdated).toLocaleString('id-ID')} {fiturDoc.lastUpdatedBy && `by ${fiturDoc.lastUpdatedBy}`}
                </p>
                <div className="flex items-center gap-2 bg-amber-500/5 px-3 py-1 rounded-full border border-amber-500/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest italic">Dokumentasi Terverifikasi</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
