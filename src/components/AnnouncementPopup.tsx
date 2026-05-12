import React from 'react';
import { X, Info, AlertTriangle, CheckCircle, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  active: boolean;
  createdAt: any;
}

interface AnnouncementPopupProps {
  announcement: Announcement | null;
  onClose: () => void;
}

export default function AnnouncementPopup({ announcement, onClose }: AnnouncementPopupProps) {
  if (!announcement) return null;

  const Icon = {
    info: Info,
    warning: AlertTriangle,
    success: CheckCircle
  }[announcement.type] || Bell;

  const colorClass = {
    info: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  }[announcement.type];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          id="announcement-modal"
        >
          <div className="relative p-8">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white"
            >
              <X size={20} />
            </button>

            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${colorClass}`}>
              <Icon size={32} />
            </div>

            <h3 className="text-2xl font-black text-white mb-3 tracking-tight">
              {announcement.title}
            </h3>
            
            <div className="text-white/60 leading-relaxed text-lg whitespace-pre-wrap">
              {announcement.message}
            </div>

            <button
              onClick={onClose}
              className="w-full mt-10 py-4 bg-white text-black font-black rounded-2xl hover:bg-opacity-90 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              MENGERTI
            </button>
          </div>

          <div className="bg-white/5 px-8 py-3 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Official Announcement</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">
              {announcement.createdAt?.toDate ? announcement.createdAt.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
