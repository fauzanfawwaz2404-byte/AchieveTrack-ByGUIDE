import React, { useState } from 'react';
import { Send, Mail, MessageSquare, ShieldCheck, HeartHandshake, Phone, ExternalLink, Sparkles, Edit, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppDoc } from '../types';

interface AboutSupportProps {
  appDocs: AppDoc[];
  onSave: (doc: AppDoc) => void;
  userEmail?: string | null;
}

const DEFAULT_SUPPORT = {
  contacts: [
    {
      platform: 'WhatsApp Support',
      label: 'Hubungi via WhatsApp',
      value: '08821109336',
      icon: 'MessageSquare',
      color: 'bg-[#25D366]',
      link: 'https://wa.me/628821109336?text=Halo%20Admin,%20saya%20butuh%20bantuan%20terkait%20Aplikasi%20AchievTrack'
    },
    {
      platform: 'Email Administration',
      label: 'Kirimkan Laporan via Email',
      value: 'fauzanfawwaz2404@gmail.com',
      icon: 'Mail',
      color: 'bg-amber-500',
      link: 'mailto:fauzanfawwaz2404@gmail.com?subject=Laporan%20Aplikasi%20AchievTrack'
    }
  ],
  services: [
    { title: 'Data Corruption Fix', desc: 'Pemulihan data jika terjadi kerusakan atau kehilangan database.', icon: 'ShieldCheck' },
    { title: 'System Update', desc: 'Penambahan fitur baru atau pembaruan alur proses bisnis.', icon: 'Sparkles' },
    { title: 'Custom Development', desc: 'Pembuatan modul baru atau aplikasi custom sesuai kebutuhan unit.', icon: 'HeartHandshake' }
  ]
};

export default function AboutSupport({ appDocs, onSave, userEmail }: AboutSupportProps) {
  const isSuperAdmin = userEmail === 'fauzanfawwaz2404@gmail.com';
  const supportDoc = appDocs.find(d => d.id === 'support_info') || {
    id: 'support_info',
    content: JSON.stringify(DEFAULT_SUPPORT),
    lastUpdated: new Date().toISOString()
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(supportDoc.content);

  const data = JSON.parse(supportDoc.content);

  const handleSave = () => {
    onSave({
      ...supportDoc,
      content: editedContent,
      lastUpdatedBy: userEmail || 'System',
      lastUpdated: new Date().toISOString()
    });
    setIsEditing(false);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'MessageSquare': return <MessageSquare size={24} />;
      case 'Mail': return <Mail size={24} />;
      case 'ShieldCheck': return <ShieldCheck className="text-rose-400" />;
      case 'Sparkles': return <Sparkles className="text-amber-400" />;
      case 'HeartHandshake': return <HeartHandshake className="text-blue-400" />;
      default: return <Sparkles size={24} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 bg-rose-500/10 px-6 py-2 rounded-full border border-rose-500/20 mb-4">
          <HeartHandshake size={16} className="text-rose-500 animate-pulse" />
          <span className="text-[11px] font-black text-rose-500 uppercase tracking-widest italic">Hubungi Pengelola Sistem</span>
        </div>
        <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter">BANTUAN <span className="text-amber-500">& HELPDESK</span></h2>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">Layanan Pemeliharaan & Pengembangan Aplikasi</p>
      </div>

      <div className="flex justify-end pr-4">
        {isSuperAdmin && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-amber-500 hover:text-black text-amber-500 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border border-amber-500/20 italic"
          >
            <Edit size={14} /> Edit Layanan
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
            className="glass p-10 rounded-[3rem] border border-white/10 space-y-4"
          >
             <textarea 
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-96 bg-black/40 border border-white/10 rounded-2xl p-6 text-slate-300 font-mono text-xs focus:outline-none focus:border-amber-500/50 transition-all custom-scrollbar"
              />
              <div className="flex gap-4">
                <button onClick={() => setIsEditing(false)} className="flex-1 btn btn-ghost text-white uppercase font-black italic">Batal</button>
                <button onClick={handleSave} className="flex-1 btn bg-amber-500 text-black uppercase font-black italic">Simpan Data</button>
              </div>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.contacts.map((contact: any, i: number) => (
                <a 
                  key={i} 
                  href={contact.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group glass p-8 rounded-[3rem] border border-white/5 flex flex-col items-center text-center transition-all hover:border-amber-500/30 hover:bg-white/[0.04] scroll-mt-20"
                >
                  <div className={`w-20 h-20 rounded-[2rem] ${contact.color} flex items-center justify-center text-white shadow-2xl shadow-black/80 mb-6 transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                      {getIcon(contact.icon)}
                  </div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{contact.platform}</p>
                  <h3 className="text-xl font-black text-white italic mb-1 uppercase tracking-tight">{contact.value}</h3>
                  <p className="text-xs font-bold text-amber-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity mt-4 flex items-center gap-2">
                    {contact.label} <ExternalLink size={12} />
                  </p>
                </a>
              ))}
            </div>

            <div className="glass p-12 rounded-[3.5rem] border border-white/5 relative overflow-hidden bg-slate-900/60 transition-all hover:border-white/10 group/section">
              <div className="absolute top-0 right-0 p-12 opacity-5">
                <Send size={150} />
              </div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter inline-block">LAYANAN TERSEDIA</h3>
                  {isSuperAdmin && !isEditing && (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="opacity-0 group-hover/section:opacity-100 transition-all flex items-center gap-2 px-3 py-1 bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-500 rounded-lg font-black text-[9px] uppercase tracking-widest border border-amber-500/20 italic"
                    >
                      <Edit size={12} /> Edit Layanan
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {data.services.map((service: any, i: number) => (
                      <div key={i} className="space-y-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-xl">
                            {getIcon(service.icon)}
                        </div>
                        <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">{service.title}</h4>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">{service.desc}</p>
                      </div>
                    ))}
                </div>

                <div className="mt-12 p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <ShieldCheck size={24} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-black text-white uppercase italic tracking-wide">Penyelesaian Kendala Teknis</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed mt-1">
                        Seluruh laporan kerusakan (bug) atau permintaan pembaruan akan diproses dalam waktu maksimal 2x24 jam kerja (tergantung tingkat kompleksitas permintaan).
                      </p>
                    </div>
                </div>
              </div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
