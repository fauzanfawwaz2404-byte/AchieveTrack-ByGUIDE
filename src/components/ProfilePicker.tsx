import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserCircle, CheckCircle2, Search } from 'lucide-react';

interface ProfilePickerProps {
  petugasList: string[];
  onSelect: (name: string) => void;
  userEmail: string;
}

export default function ProfilePicker({ petugasList, onSelect, userEmail }: ProfilePickerProps) {
  const [search, setSearch] = useState('');
  const filtered = petugasList.filter(p => p.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#0f172a]">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-10 rounded-[2.5rem] max-w-lg w-full border-t-8 border-amber-500 shadow-3xl text-center"
      >
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-amber-500/20 rounded-3xl flex items-center justify-center border border-amber-500/30">
            <UserCircle className="text-amber-500" size={40} />
          </div>
        </div>

        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Halo! Kenalan Yuk</h2>
        <p className="text-amber-500/60 text-sm font-bold uppercase tracking-widest mb-8">
          Email: <span className="text-white">{userEmail}</span>
        </p>
        
        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
          Sistem mendeteksi Anda belum terhubung dengan nama petugas mana pun. 
          Silakan <span className="text-amber-400 font-bold italic">Pilih Nama Anda</span> di bawah ini agar Dashboard bisa menampilkan hasil kerja Anda secara otomatis.
        </p>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama Anda..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input w-full bg-white/5 border-white/10 h-14 pl-12 rounded-2xl focus:border-amber-500/50 transition-all text-white font-bold"
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {filtered.length > 0 ? filtered.map((name, i) => (
            <motion.button
              key={name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelect(name)}
              className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-amber-400/30 hover:bg-amber-400/10 flex items-center justify-between group transition-all"
            >
              <span className="font-black text-white uppercase tracking-tight group-hover:text-amber-400">{name}</span>
              <CheckCircle2 size={18} className="opacity-0 group-hover:opacity-100 text-amber-500 transition-opacity" />
            </motion.button>
          )) : (
            <p className="text-xs text-white/20 italic p-10">Nama tidak ditemukan dalam daftar petugas...</p>
          )}
        </div>

        <p className="mt-10 text-[10px] opacity-20 text-white uppercase tracking-[0.4em]">PRODIA DEPOK | SYSTEM MAPPING 2026</p>
      </motion.div>
    </div>
  );
}
