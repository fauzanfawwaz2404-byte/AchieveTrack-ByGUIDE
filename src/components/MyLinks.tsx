import React, { useState } from 'react';
import { FavoriteLink } from '../types';
import { 
  FolderPlus, Link as LinkIcon, Trash2, ExternalLink, 
  Search, Plus, Globe, Tag, Clock, Copy, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MyLinksProps {
  links: FavoriteLink[];
  onSave: (link: FavoriteLink) => void;
  onDelete: (id: string) => void;
  userEmail?: string | null;
  permissions?: { canAdd: boolean, canEdit: boolean, canDelete: boolean, isAdmin: boolean };
}

export default function MyLinks({ links, onSave, onDelete, userEmail, permissions }: MyLinksProps) {
  const isAdmin = userEmail === 'fauzanfawwaz2404@gmail.com' || permissions?.isAdmin;
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentLink, setCurrentLink] = useState<Partial<FavoriteLink>>({
    keterangan: '',
    url: ''
  });

  const filteredLinks = links.filter(l => 
    l.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = (url: string, id: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(() => {
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000);
        });
      } else {
        // Fallback for non-secure contexts or older mobile browsers
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) {
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000);
        }
      }
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handleSave = () => {
    if (!currentLink.keterangan || !currentLink.url) {
      alert('Mohon isi keterangan dan alamat web.');
      return;
    }
    
    // Ensure URL has protocol
    let finalUrl = currentLink.url;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    const newLink: FavoriteLink = {
      id: currentLink.id || Date.now().toString(),
      keterangan: currentLink.keterangan,
      url: finalUrl,
      timestamp: currentLink.timestamp || new Date().toISOString()
    };

    onSave(newLink);
    setShowModal(false);
    setCurrentLink({ keterangan: '', url: '' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus link favorit ini?')) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-(--text-color) uppercase tracking-tighter flex items-center gap-2">
          <LinkIcon size={24} className="text-blue-400" /> My <span className="text-blue-400">Links</span>
        </h2>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-grow md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input 
                type="text" 
                placeholder="Cari link..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-sm h-11 w-full pl-10 bg-white/5 border-white/10 rounded-xl focus:border-blue-500 transition-all font-bold text-xs"
              />
           </div>
           {isAdmin && (
             <button 
               onClick={() => setShowModal(true)}
               className="btn btn-primary h-11 px-6 rounded-xl font-black text-[10px] tracking-widest uppercase shadow-lg shadow-blue-500/20"
             >
               <Plus size={18} className="mr-1" /> Tambah Links
             </button>
           )}
        </div>
      </div>

      <div className="glass p-8 rounded-[2.5rem] shadow-xl border border-white/5">
        <div className="overflow-x-auto">
          <table className="table table-xs w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="bg-black/20 text-white/40 uppercase text-[10px] tracking-[0.2em]">
                <th className="p-4 rounded-l-2xl">Keterangan</th>
                <th className="p-4 border-l border-white/10">Link Akses</th>
                <th className="p-4 border-l border-white/10">Ditambahkan</th>
                <th className="p-4 rounded-r-2xl text-right">Opsi</th>
              </tr>
            </thead>
            <tbody>
              {filteredLinks.map(link => (
                <motion.tr 
                  layout
                  key={link.id} 
                  className="group hover:bg-white/5 transition-all text-(--text-color)"
                >
                  <td className="p-4 bg-white/[0.02] rounded-l-2xl border-y border-white/5">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                          <Tag size={14} className="text-blue-400" />
                       </div>
                       <span className="font-black italic uppercase tracking-tighter text-sm">{link.keterangan}</span>
                    </div>
                  </td>
                  <td className="p-4 bg-white/[0.02] border-y border-white/5">
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={() => handleCopy(link.url, link.id)}
                         className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all border ${
                           copiedId === link.id 
                           ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500' 
                           : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                         }`}
                       >
                         {copiedId === link.id ? <Check size={14} /> : <Copy size={14} />}
                         {copiedId === link.id ? 'COPIED' : 'COPY LINK'}
                       </button>

                       <a 
                         href={link.url} 
                         target="_blank" 
                         rel="noopener noreferrer"
                         className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl font-black text-[10px] tracking-widest uppercase text-blue-400 hover:bg-blue-500/30 transition-all shadow-lg shadow-blue-500/10"
                       >
                         <ExternalLink size={14} />
                         OPEN LINK
                       </a>
                    </div>
                  </td>
                  <td className="p-4 bg-white/[0.02] border-y border-white/5">
                    <div className="flex items-center gap-2 text-[10px] opacity-40 font-bold uppercase tracking-widest">
                       <Clock size={12} />
                       {new Date(link.timestamp).toLocaleDateString('id-ID')}
                    </div>
                  </td>
                  <td className="p-4 bg-white/[0.02] rounded-r-2xl border-y border-white/5 text-right">
                    {isAdmin && (
                      <button 
                        onClick={() => handleDelete(link.id)}
                        className="btn btn-ghost btn-xs text-red-500 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
              {filteredLinks.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-20 text-center opacity-20 font-black italic uppercase animate-pulse">
                    Tidak ada link favorit yang ditemukan...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="modal modal-open items-center justify-center bg-black/60 backdrop-blur-sm z-[100]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal-box glass border border-white/10 max-w-lg p-0 overflow-hidden bg-(--bg-color)/95 rounded-[2.5rem] shadow-3xl"
            >
              <div className="bg-gradient-to-r from-blue-500/30 via-blue-600/20 to-transparent p-8 border-b border-white/5 relative">
                  <div className="flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                              <FolderPlus size={24} className="text-blue-400" />
                          </div>
                          <div>
                              <h3 className="text-xl font-black text-(--text-color) italic tracking-tighter uppercase leading-none">Tambah Link Favorit</h3>
                              <p className="text-[9px] font-bold text-blue-500/80 uppercase tracking-widest mt-1">Simpan akses cepat ke web favorit</p>
                          </div>
                      </div>
                      <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
                  </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="form-control">
                  <label className="label-text text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 px-1">Keterangan</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Prodia Lab, Portal Dokter..." 
                    value={currentLink.keterangan}
                    onChange={(e) => setCurrentLink(p => ({ ...p, keterangan: e.target.value }))}
                    className="input bg-white/5 border-white/10 text-(--text-color) font-bold h-14 rounded-2xl focus:border-blue-500 transition-all"
                  />
                </div>
                <div className="form-control">
                  <label className="label-text text-[10px] font-black text-white/30 uppercase tracking-widest mb-2 px-1">Alamat Web (URL)</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: prodia.co.id" 
                    value={currentLink.url}
                    onChange={(e) => setCurrentLink(p => ({ ...p, url: e.target.value }))}
                    className="input bg-white/5 border-white/10 text-(--text-color) font-bold h-14 rounded-2xl focus:border-blue-500 transition-all font-mono"
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowModal(false)} className="btn flex-1 glass border-white/5 font-black uppercase text-[10px] tracking-widest h-14 rounded-2xl">Batal</button>
                  <button onClick={handleSave} className="btn flex-1 btn-primary font-black uppercase text-[10px] tracking-widest h-14 rounded-2xl shadow-xl shadow-blue-500/20">Simpan Link</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
