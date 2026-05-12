import React, { useState } from 'react';
import { Activity, ShieldCheck, Cpu, Database, Cloud, Zap, Sparkles, Edit, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppDoc } from '../types';
import { APP_VERSION } from '../constants';

interface AboutVersionProps {
  appDocs: AppDoc[];
  onSave: (doc: AppDoc) => void;
  userEmail?: string | null;
}

const DEFAULT_LOGS = [
  { v: '7.8', date: '11 Mei 2026', changes: ['Flicker-Free Impersonation: Refaktorisasi sistem sinkronisasi data untuk mencegah UI berkedip atau data "menghilang" saat simulasi user', 'Data Preservation Guard: Verifikasi ketat sistem pembersihan data kampanye agar tetap mempertahankan database Blacklist dan status "Tidak Ada WA"', 'Robust Simulation Menu: Perbaikan bug pada dropdown simulasi di Header agar tidak menutup secara tiba-tiba sebelum pemilihan selesai', 'Intelligent Name Mapping: Sinkronisasi pemetaan nama petugas (SITA/MASYITA, DHIAN/DIAN) yang lebih pintar untuk menjamin akurasi tampilan target petugas'] },
  { v: '7.7', date: '11 Mei 2026', changes: ['Simulator User Access: Fitur simulasi login sebagai pengguna lain bagi Super Admin untuk mempermudah audit tampilan data secara langsung', 'Dynamic Identity Mapping: Peningkatan akurasi pemetaan nama petugas WhatsApp berdasarkan database User Access yang terdaftar', 'Multi-Alias Recognition: Dukungan cerdas untuk variasi nama petugas (SITA/MASYITA, DHIAN/DHYAN) guna sinkronisasi target lebih presisi', 'Safety Runtime Guards: Implementasi pengamanan "localeCompare" pada seluruh modul utama untuk mencegah error saat pengurutan data'] },
  { v: '7.6', date: '11 Mei 2026', changes: ['Security Overhaul: Implementasi sistem "Staff Identity Lock" pada menu Target WA untuk mencegah kebocoran data antar petugas', 'Privacy Guard: Integrasi data petugas (Nama & Email) ke dalam Setup User Access untuk manajemen hak akses yang lebih terpusat', 'UI Consistency: Penambahan field "Nama Petugas" pada Setup User agar admin dapat mengelola identitas petugas secara dinamis', 'Optimasi Bandwidth: Sistem filter data sisi server (Query Throttling) untuk memastikan petugas hanya mengunduh data target miliknya sendiri'] },
  { v: '7.5', date: '11 Mei 2026', changes: ['Smart Layout: Implementasi fitur "Collapsible Tables" untuk Daftar Blacklist & No-WA guna merampingkan dashboard', 'Network-First Strategy: Optimalisasi Service Worker (v11) untuk memastikan setiap reload langsung memuat versi terbaru', 'Performance Boost: Penghapusan total layar Welcome Pop-up & sistem instalasi PWA untuk akses masuk yang lebih instan', 'WA Personal Fix: Sinkronisasi akurat progres pengiriman pada dashboard SDM Cabang (Target 100/200)'] },
  { v: '7.2', date: '10 Mei 2026', changes: ['Performance Optimization: Migrasi Service Worker ke strategi "Stale-While-Revalidate" untuk akses kilat melalui cache', 'UI Cleanup: Penghapusan tombol instalasi PWA yang tidak diperlukan sesuai permintaan user', 'Asset Guard: Sinkronisasi ulang database versi 7.2 untuk menjamin konsistensi antar perangkat', 'Lighter Core: Pembersihan skrip diagnostic pada index.html untuk mempercepat First Contentful Paint'] },
  { v: '7.1', date: '10 Mei 2026', changes: ['Critical Mobile Fix: Penambahan error tracking global untuk mendiagnosa layar blank pada beberapa perangkat', 'Aggressive Cache Busting: Sistem pembersihan cache kini menjangkau Service Worker tingkat dalam (v10)', 'LocalStorage Stability: Penambahan try-catch pada akses storage untuk mencegah crash pada private browsing', 'Network-First Strategy: Aplikasi kini selalu memprioritaskan download versi terbaru sebelum menggunakan cadangan offline'] },
  { v: '7.0', date: '10 Mei 2026', changes: ['Auto-Update Mechanism: Aplikasi kini mendeteksi versi baru secara otomatis dan melakukan hard-reload untuk membersihkan cache lama', 'PWA Integrity Guard: Optimalisasi Service Worker agar langsung mengaktifkan versi terbaru tanpa menunggu (Skip Waiting)', 'Cache Busting 2.0: Penomoran cache internal baru untuk memastikan semua aset visual dan data sinkron di semua perangkat', 'Consistency Patch: Penyeragaman versi aplikasi di Header, Sidebar, dan Info Sistem'] },
  { v: '6.9', date: '10 Mei 2026', changes: ['Deep Stability Patch: Perbaikan fatal error "process.env" pada browser mobile yang menyebabkan blank screen', 'Runtime Guard: Optimalisasi urutan inisialisasi variabel profil pengguna untuk mencegah crash saat render pertama', 'Production Hardening: Pengalihan sistem environment check ke standar Vite modern (import.meta.env)'] },
  { v: '6.8', date: '10 Mei 2026', changes: ['Ultra-Stability Patch: Pembersihan total syntax CSS non-standar yang menyebabkan blank screen pada mobile', 'Cross-Browser Border Fix: Standardisasi pewarnaan border untuk semua jenis layar', 'Mobile Navigation Guard: Optimalisasi menu dropdown agar tetap muncul di browser in-app HP'] },
  { v: '6.7', date: '10 Mei 2026', changes: ['Mobile Stability Patch: Perbaikan kompatibilitas rendering CSS pada perangkat mobile/In-App Browser', 'Fallback Clipping System: Optimalisasi fitur salin link dengan sistem cadangan untuk browser mobile lama', 'Cross-Platform Border Fix: Penggunaan standar syntax border yang lebih aman untuk semua jenis layar'] },
  { v: '6.6', date: '10 Mei 2026', changes: ['Hyper-Privacy Favorit: Alamat web pada menu My Links kini sepenuhnya disembunyikan, diganti dengan tombol interaktif COPY & OPEN', 'Contrast Hardening: Peningkatan kontras teks dan border pada Mode Terang untuk kejelasan maksimal di lingkungan silau', 'Sidebar Menu Optimization: Pembaruan tipografi dan warna menu navigasi agar lebih tegas dan mudah terbaca', 'Table Clarity 2.0: Header tabel kini memiliki pemisah visual yang lebih kuat dan warna background yang kontras'] },
  { v: '6.5', date: '10 Mei 2026', changes: ['Hyper-Privacy Favorit: Penyembunyian alamat web pada menu My Links, diganti dengan tombol interaktif COPY & OPEN', 'Clipboard Navigation: Fitur satu-klik untuk menyalin URL ke clipboard dengan feedback visual', 'Direct Access Toggle: Mempermudah akses link favorit tanpa memenuhi tampilan tabel'] },
  { v: '6.4', date: '10 Mei 2026', changes: ['Ultra-Clear Light Mode: Perbaikan total kontras dan tipografi pada tema terang untuk kenyamanan mata maksimal', 'Table Header Hardening: Header pada setiap tabel kini menggunakan warna kontras tinggi dengan pemisah yang lebih tegas', 'Typography Refresh: Optimalisasi semua label "white/XX" menjadi "Dark Slate" otomatis saat mode terang aktif', 'Sidebar UI Overhaul: Navigasi samping kini lebih bersih dan terbaca jelas pada background terang'] },
  { v: '6.3', date: '10 Mei 2026', changes: ['PWA Native Bridge: Tombol instalasi langsung kini tersedia di Header untuk akses cepat ke menu Layar Utama', 'Advanced UI Clarity: Perbaikan total pada "Mode Terang" dengan kontras tinggi, border lebih tegas, dan tipografi yang lebih tajam', 'Header Optimization: Penambahan shortcut "Add to Home Screen" di samping toggle tema dan layout', 'Light Mode Enhancement: Optimalisasi warna tabel dan teks transparansi agar tetap terbaca jelas di lingkungan terang'] },
  { v: '6.2', date: '09 Mei 2026', changes: ['PWA Support: Aplikasi kini dapat diinstal langsung di Android dan iOS (Add to Home Screen)', 'Install Prompt: Sistem deteksi otomatis untuk menawarkan instalasi aplikasi saat login di mobile', 'Native Look & Feel: Pengoptimalan manifest agar aplikasi berjalan layaknya aplikasi native tanpa bar browser'] },
  { v: '6.1', date: '09 Mei 2026', changes: ['Tiered Activity Logs: Tampilan log kini dikelompokkan per pengguna untuk navigasi yang lebih bersih', 'User-Centric Drilldown: Klik pada nama pengguna untuk melihat rincian aktivitas spesifik mereka', 'UI Optimization: Grid view untuk daftar pengguna aktif dengan indikator real-time'] },
  { v: '6.0', date: '09 Mei 2026', changes: ['Sistem Log Aktivitas Real-time: Pemantauan aktivitas setiap user (Login, Navigasi Menu, Input Data) secara mendalam', 'Automatic Log Purge: Penghapusan log lama (di atas 24 jam) secara otomatis untuk menjaga performa database', 'Admin Terminal: Dashboard khusus monitoring log dengan fitur "System Flush" untuk pembersihan manual', 'Enhanced Security: Logging setiap aksi krusial (Kirim WA, Hapus Data, Blacklist) untuk audit sistem'] },
  { v: '5.9', date: '09 Mei 2026', changes: ['Slot-Aware Cooldown: Sinkronisasi masa tunggu kini mengikuti konfigurasi spesifik tiap kampanye (Slot 1/2)', 'Live Sync Fix: Perbaikan bug di mana perubahan durasi tidak langsung terbaca di menu pengiriman', 'Global State Alignment: Memastikan seluruh petugas mendapatkan pembaruan limit pesan secara real-time'] },
  { v: '5.8', date: '09 Mei 2026', changes: ['Deep Cooldown Re-Sync: Perbaikan logika update durasi masa tunggu agar langsung diterapkan pada countdown yang sedang berjalan', 'Fallback Anchor: Sistem pendeteksi waktu mulai cooldown otomatis untuk migrasi data dari versi lama', 'Dynamic Overrides: Kemampuan admin untuk memperpendek/memperlama masa tunggu di tengah kampanye aktif'] },
  { v: '5.7', date: '09 Mei 2026', changes: ['Real-time Cooldown Sync: Durasi masa tunggu kini terupdate secara otomatis bahkan saat petugas sedang dalam masa cooling down', 'Enhanced Logic: Penyimpanan waktu mulai (start time) masa tunggu untuk kalkulasi durasi yang lebih presisi', 'UI Fix: Timer pengiriman WhatsApp kini sepenuhnya responsif terhadap perubahan konfigurasi pusat'] },
  { v: '5.6', date: '09 Mei 2026', changes: ['Custom Cooldown: Konfigurasi mandiri durasi masa tunggu (Cooling Down) per kampanye', 'Message Limit: Pengaturan jumlah pesan maksimal sebelum aktivasi sistem Anti-Ban', 'Dynamic UI Setup: Integrasi input konfigurasi limit & durasi pada modul Setup Pesan', 'Precision Logic: Perhitungan masa tunggu real-time berbasis limit pesan individu petugas'] },
  { v: '5.5', date: '09 Mei 2026', changes: ['Broadcast Announcement: Sistem pengumuman real-time terintegrasi untuk seluruh pengguna aplikasi', 'Direct PDF Preview: Preview file PDF langsung di dalam aplikasi HP menggunakan React-PDF', 'Performance Optimization: Memoized komponen utama untuk perpindahan menu yang jauh lebih smooth', 'Auto Data Sync: Refresh otomatis saat masuk Dashboard untuk memastikan data ter-update'] },
  { v: '5.4', date: '09 Mei 2026', changes: ['Interactive UI: Interaktivitas penuh pada 5 kartu statistik utama Dashboard', 'Detail Modal: Penambahan tabel rincian data per kategori (Terkirim, No WA, Unik)', 'Theme Engine: Sinkronisasi dinamis filter tema dengan riwayat pengiriman (History Base)', 'Performance: Sistem lazy loading (Load More) pada kartu progres petugas', 'Staff Preview: Fitur ringkasan progres petugas dalam satu layar (Screenshot Friendly)'] },
  { v: '5.3', date: '08 Mei 2026', changes: ['Luxurious UI: Desain ulang modul Setup & Blacklist dengan tema Modern & Mewah', 'Blacklist Fix: Perbaikan bug pada tampilan pasien yang ditambahkan secara manual', 'Search Engine 2.0: Penambahan fitur pencarian cerdas pada tabel Blacklist di Dashboard', 'Smart Allocation UI: Penambahan kalkulator kapasitas otomatis di Setup Petugas', 'Storage Auto-Slicing: Sinkronisasi otomatis data besar (20rb+) dengan alokasi SDM'] },
  { v: '5.2', date: '08 Mei 2026', changes: ['Smart Slicing: Optimasi penyimpanan data besar dengan pembatasan otomatis sesuai alokasi SDM', 'Database Guard: Pencegahan error 1MB Firestore melalui pemotongan data cerdas', 'UI Enhancement: Penjelasan detail pada peringatan penyimpanan data massal'] },
  { v: '5.1', date: '08 Mei 2026', changes: ['Search Engine: Penambahan kotak pencarian cerdas pada tabel Target Pelanggan', 'Frequency Tracking: Indikator visual jumlah kontak real-time pada baris pasien di Setup', 'UI/UX: Optimasi transisi dan feedback visual pada baris yang telah dihubungi', 'Consistency: Sinkronisasi versi aplikasi global di seluruh modul'] },
  { v: '5.0', date: '08 Mei 2026', changes: ['Smart Target Filtering: NEW, CONTACTED, BLACKLIST, NO_WA filters in Setup', 'Manual Blacklist Entry: Input manual pasien blokir via Dashboard', 'Campaign Scoping Fix: Independensi total Target & Setup A vs B', 'Campaign Management: Fitur Hapus pada tabel History Kampanye', 'Frequency Tracking: Indikator riwayat kontak real-time saat import'] },
  { v: '4.9', date: '08 Mei 2026', changes: ['Fitur Filter Data pada Dashboard Monitoring Promo', 'Filter Kampanye A (CC) & Kampanye B (SDM) Terintegrasi', 'Unified WA Statistics pada Dashboard Executive', 'Filter Tema & Periode pada Dashboard WA Personal/CBG', 'Optimasi Tampilan Dashboard dengan 6 Parameter Utama'] },
  { v: '4.8', date: '07 Mei 2026', changes: ['Sistem Reset Independen per Kampanye (A & B)', 'Reset terfokus pada Setup Kontan & Target Aktif', 'Proteksi Riwayat & Statistik Dashboard saat Reset', 'Update Default Template: <WAKTU> <TITLE> <NAMA>', 'UI: Tombol Konfirmasi Reset Cerdas (Pulse Effect)'] },
  { v: '4.7', date: '06 Mei 2026', changes: ['Optimasi Layout Header & Navigation untuk perangkat Mobile', 'Perbaikan Responsivitas View Info & Aturan SDM Cabang', 'Penyesuaian Font Size & Gaps pada Top Bar (AchieveTrack Header)', 'Peningkatan Accessibility pada tombol Drawer & Profile Avatar'] },
  { v: '4.6', date: '06 Mei 2026', changes: ['Fix: Sinkronisasi akurat Total Target pada Campaign History saat Import', 'Pembaruan Logika onSaveSetup dengan manual counter alokasi', 'Perbaikan integritas data summary campaign pada modul CBG & CC'] },
  { v: '4.5', date: '06 Mei 2026', changes: ['Dokumentasi Detail Info & Aturan: Counter Frekuensi Pasien', 'Dokumentasi Sistem Anti-Duplikat Data (ID & No HP)', 'Dokumentasi Manajemen Nomor Non-WA (Distribution Cleanup)', 'Pembaruan UI Sidebar & Navigasi Module WA Personal'] },
  { v: '4.4', date: '06 Mei 2026', changes: ['Fitur Resend Message: Tombol Kirim Ulang pada status SENT', 'Optimasi UI Baris Target untuk akses cepat pengiriman ulang', 'Sinkronisasi Cooling Down Engine dengan fitur Resend', 'Perbaikan Visual Feedback pada indikator Diterima'] },
  { v: '4.3', date: '06 Mei 2026', changes: ['Sistem Anti-Ban Individual (Cooling Down per Nama Petugas)', 'Audit Riwayat Kirim Cerdas berbasis Petugas Aktif', 'Pemisahan Session Cooldown untuk 20+ User Simultan', 'Update UI Modal dengan Countdown Timer yang lebih akurat'] },
  { v: '4.2', date: '06 Mei 2026', changes: ['Optimasi Concurrent Engine untuk 20+ Pengguna Aktif', 'Real-time Data Stream Throttling (Speed Boost)', 'Memory-Efficient Rendering pada Tabel Data Besar', 'Sinkronisasi Backend Prodia-Core Performance'] },
  { v: '4.1', date: '06 Mei 2026', changes: ['Anti-Ban Layer: WA Cooling Down System (Limit 5 Pesan/5 Menit)', 'Countdown Timer 1 Jam Masuk Masa Pemulihan Akun', 'Global Enforcement Rule untuk mencegahan blokir nomor', 'Auto-Lock "Kirim Pesan" saat Masa Cooling Down Aktif'] },
  { v: '4.0', date: '06 Mei 2026', changes: ['Sistem Salam Otomatis <WAKTU> (Pagi, Siang, Sore, Malam)', 'Dynamic Greeting Engine berdasarkan Jam Server/Lokal', 'Update Panduan Placeholder pada Setup Pesan', 'Sinkronisasi Preview Output Pesan dengan Waktu Real-time'] },
  { v: '3.9', date: '06 Mei 2026', changes: ['Security Workflow: Send-First Action Enforcement', 'Pencegahan Manipulasi Status Tanpa Klik WhatsApp', 'Unlock Confirmation Buttons (Sudah/No WA) Pasca Klik Link', 'Optimasi Visual Feedback pada Baris Target Terkait'] },
  { v: '3.8', date: '06 Mei 2026', changes: ['Sistem Blacklist Otomatis Filter "Tidak Ada WA" saat Import', 'Table Rekap Khusus "DAFTAR TIDAK ADA WA" di Dashboard', 'Optimasi Engine Penomoran Baris & Pencarian', 'Visualisasi Stats Akumulasi Kasus Tanpa WhatsApp'] },
  { v: '3.7', date: '06 Mei 2026', changes: ['Sistem Intelligent Target Memory (Tracking Frekuensi per SisproID)', 'Optimasi Refresh Konten Pesan Tanpa Clear Data', 'Indikator Visual Frekuensi Kontak pada Daftar Target', 'Pemisahan Statistik Global & Personal Progres'] },
  { v: '3.6', date: '04 Mei 2026', changes: ['Optimasi Kecepatan Otorisasi Dashboard (Instant Load)', 'Peningkatan Respon Tombol & Transisi Animasi', 'Lazy Rendering Dashboard Content (Lightweight)', 'Sinkronisasi Branding Otorisasi Dashboard'] },
  { v: '3.5', date: '04 Mei 2026', changes: ['Sistem Otomatisasi Input Panel (Sinkronisasi Master TEST LAB)', 'Tagging System pada Edit Panel (Search & Select)', 'Penyempurnaan Re-branding Login (Admin Sistem)', 'Peningkatan Keamanan Data Sinkronisasi'] },
  { v: '3.4', date: '04 Mei 2026', changes: ['Peningkatan Algoritma Saran Paket (Strict Match)', 'Fix UI Overlap & Layout Pricing Saran Paket', 'Optimasi Header & Footer Preview Screenshot', 'Pembaruan Batas Maksimal Kekurangan Item Paket (Max 4)'] },
  { v: '3.3', date: '04 Mei 2026', changes: ['Pembaruan Format Tanggal (DD-MMM-YYYY)', 'Optimasi Tampilan Tabel BHF Upaya', 'Perbaikan Bug Sinkronisasi Issue'] },
  { v: '3.2', date: '03 Mei 2026', changes: ['Master Data Lab (Test & Panel)', 'Kalkulator Lab Digital dengan Diskon', 'Popup Detail Rincian Panel', 'User Access Default Read-Only', 'Peningkatan Keamanan Database (Firebase)'] },
  { v: '3.1', date: '27 Apr 2026', changes: ['Modul BHF/HKN (Upaya, Pemantauan, Kelompok)', 'Manajemen Ketua Kelompok BHF', 'Export PDF Dashboard BHF', 'Penyempurnaan Input WhatsApp Personal'] },
  { v: '3.0', date: '26 Apr 2026', changes: ['UI Overhaul (Glassmorphism)', 'Otomatisasi Target per Petugas', 'Integrasi CRM (PCC & RFM)', 'Sistem User Access Granular', 'Global Dynamic Dashboard Filters', 'Interactive Weekly History Navigation'] },
  { v: '2.8', date: '15 Apr 2026', changes: ['Advanced PDF Reporting Engine', 'My Calendar & Task Management', 'My Links Favorite Portal', 'Real-time Firebase Sync Optimization'] },
  { v: '2.5', date: '30 Mar 2026', changes: ['WhatsApp Bulk Messaging Suite', 'Birthday Automation System', 'Smart Template Variable Engine', 'Driver WIC Performance Analytics'] },
  { v: '2.0', date: '12 Mar 2026', changes: ['Executive Dashboard Interface', 'AI Analytics Integration', 'Master Data Management Hub', 'Multi-user Authentication Level'] },
  { v: '1.8', date: '25 Feb 2026', changes: ['Daily Performance Log Entry', 'Revenue Calculation Engine', 'Visit Tracking Module', 'Basic CSV Export Support'] },
  { v: '1.5', date: '02 Feb 2026', changes: ['Client Database Foundation', 'Category & Promo Mapping', 'Responsive Mobile Layout', 'Secure Data Persistence'] },
  { v: '1.2', date: '20 Jan 2026', changes: ['Initial Admin Dashboard', 'User Role Definitions', 'Static Reporting Previews'] },
  { v: '1.0', date: '10 Jan 2026', changes: ['AchievTrack Project Kickoff', 'Core Architecture Design', 'Database Schema Implementation'] }
];

export default function AboutVersion({ appDocs, onSave, userEmail }: AboutVersionProps) {
  const isSuperAdmin = userEmail === 'fauzanfawwaz2404@gmail.com';
  const versionDoc = appDocs.find(d => d.id === 'version_logs') || {
    id: 'version_logs',
    content: JSON.stringify(DEFAULT_LOGS),
    lastUpdated: new Date().toISOString()
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(versionDoc.content);

  const logs = JSON.parse(versionDoc.content);

  const handleSave = () => {
    onSave({
      ...versionDoc,
      content: editedContent,
      lastUpdatedBy: userEmail || 'System',
      lastUpdated: new Date().toISOString()
    });
    setIsEditing(false);
  };

  const versionInfo = {
    version: '7.8',
    type: 'ADVANCED / PRODUCTION',
    buildDate: '2026-05-11',
    platform: 'AchievTrack Core',
    database: 'Firebase Realtime DB',
    engine: 'Vite + React + Tailwind'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 bg-amber-500/10 px-6 py-2 rounded-full border border-amber-500/20 mb-4">
          <Activity size={16} className="text-amber-500 animate-pulse" />
          <span className="text-[11px] font-black text-amber-500 uppercase tracking-widest italic">Info Versi Sistem</span>
        </div>
        <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">VERSI <span className="text-amber-500">APLIKASI</span></h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">Lifecycle Hub Pengembang</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Version Badge */}
        <div className="glass p-10 rounded-[3rem] border border-white/10 flex flex-col items-center justify-center text-center relative overflow-hidden bg-slate-900/40">
           <div className="absolute top-0 left-0 p-8 opacity-5">
              <Zap size={120} />
           </div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Build Versi</p>
           <h3 className="text-8xl font-black text-white italic tracking-tighter flex items-start">
             {versionInfo.version}
             <span className="text-xl bg-amber-500 text-black px-3 py-1 rounded-full ml-2 mt-4 font-black">GUIDE</span>
           </h3>
           <p className="text-xs font-bold text-amber-500 mt-4 uppercase tracking-[0.2em]">{versionInfo.type}</p>
        </div>

        {/* Technical Specs */}
        <div className="flex flex-col gap-4">
           {[
             { label: 'Platform Deploy', value: versionInfo.platform, icon: <Cloud size={18} className="text-blue-400" /> },
             { label: 'Basis Data', value: versionInfo.database, icon: <Database size={18} className="text-emerald-400" /> },
             { label: 'Teknologi Utama', value: versionInfo.engine, icon: <Cpu size={18} className="text-amber-400" /> },
             { label: 'Build Terakhir', value: versionInfo.buildDate, icon: <Activity size={18} className="text-rose-400" /> }
           ].map((spec, i) => (
             <div key={i} className="glass p-5 rounded-3xl border border-white/5 flex items-center gap-4 hover:border-white/20 transition-all">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                   {spec.icon}
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{spec.label}</p>
                   <p className="text-sm font-bold text-white uppercase tracking-tight">{spec.value}</p>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Release Notes */}
      <div className="glass p-10 rounded-[3rem] border border-white/5 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-5">
           <ShieldCheck size={200} />
        </div>
        
        <div className="flex justify-between items-center mb-8 relative z-10">
          <h3 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
            <Sparkles className="text-amber-500" size={24} /> LOG PERUBAHAN SISTEM
          </h3>
          {isSuperAdmin && !isEditing && (
            <button 
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-amber-500 hover:text-black text-amber-500 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border border-amber-500/20 italic"
            >
              <Edit size={14} /> Edit Log
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
              className="relative z-20 space-y-4"
            >
              <textarea 
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-96 bg-black/40 border border-white/10 rounded-2xl p-6 text-slate-300 font-mono text-xs focus:outline-none focus:border-amber-500/50 transition-all custom-scrollbar"
                placeholder='[{"v":"1.0","date":"...","changes":["..."]}]'
              />
              <div className="flex gap-4">
                <button onClick={() => setIsEditing(false)} className="flex-1 btn btn-ghost text-white uppercase font-black italic">Batal</button>
                <button onClick={handleSave} className="flex-1 btn bg-amber-500 text-black uppercase font-black italic">Simpan Log</button>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-8 relative z-10">
              {logs.map((log: any, i: number) => (
                <div key={i} className="flex gap-6 relative group">
                    {i < logs.length - 1 && <div className="absolute left-6 top-12 bottom-0 w-px bg-white/5" />}
                    <div className={`w-12 h-12 rounded-2xl flex-none flex items-center justify-center border transition-all ${i === 0 ? 'bg-amber-500 text-black border-amber-400' : 'bg-white/5 text-slate-500 border-white/10'}`}>
                      <span className="text-[11px] font-black">v{log.v}</span>
                    </div>
                    <div className="flex-1 pb-8 group-last:pb-0">
                      <div className="flex justify-between items-center mb-4">
                          <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">Versi {log.v} Release</h4>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{log.date}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {log.changes.map((change: string, ci: number) => (
                            <div key={ci} className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                              <span className="text-xs text-slate-400 font-medium">{change}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                </div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
